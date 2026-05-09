import feedparser
import re
import time
import json
import urllib.parse
from fuzzywuzzy import fuzz

# --- Configuration ---
RSS_URL_TEMPLATE = "https://nyaa.si/?page=rss&c=3_1&f=2&q={}" # Category 3_1 (Lit/Eng), Filter 2 (Trusted)
DRY_RUN = True
RATE_LIMIT_SECONDS = 2

# --- Mock Database ---
# In a real app, this would connect to PostgreSQL/Prisma
MOCK_DB = [
    {'id': 101, 'title': 'One Piece', 'last_chapter': 1044},
    {'id': 102, 'title': 'Jujutsu Kaisen', 'last_chapter': 180},
    {'id': 103, 'title': 'My Hero Academia', 'last_chapter': 350}
]

def search_nyaa(manga_title):
    """
    Queries Nyaa.si RSS feed for a specific manga title.
    Returns a list of entries.
    """
    encoded_title = urllib.parse.quote(manga_title)
    url = RSS_URL_TEMPLATE.format(encoded_title)
    
    print(f"[*] Querying Nyaa for: {manga_title}...")
    feed = feedparser.parse(url)
    
    if feed.bozo:
        print(f"[!] Error parsing feed: {feed.bozo_exception}")
        return []
        
    return feed.entries

def parse_filename(filename):
    """
    Parses a filename to extract Scan Group, Title, and Chapter Number.
    Returns a dict or None if parsing fails.
    """
    # Regex Breakdown:
    # ^(?:\[(.*?)\])? : Optional Scan Group in brackets at start. Group 1.
    # \s*             : Optional whitespace
    # (.*?)           : Title (Non-greedy). Group 2.
    # \s+             : Whitespace separator
    # (?:-\s+)?       : Optional dash separator
    # (?:c|ch\.?|chapter|#)?\s* : Optional Chapter prefix (c, ch, chapter, #)
    # (\d+(\.\d+)?)   : Chapter Number (Float supported). Group 3.
    # .*              : Anything else (e.g. (1080p), [MKV])
    
    # Note: This is a general pattern, might need refinement for specific groups.
    # Example: [TCB Scans] One Piece Chapter 1045 [1080p]
    
    pattern = r"^(?:\[(.*?)\])?\s*(.*?)\s+(?:-\s+)?(?:c|ch\.?|chapter|#)?\s*(\d+(\.\d+)?).*"
    
    match = re.search(pattern, filename, re.IGNORECASE)
    
    if match:
        scan_group = match.group(1) if match.group(1) else "Unknown"
        title = match.group(2).strip()
        chapter_num = float(match.group(3))
        
        return {
            'scan_group': scan_group,
            'title': title,
            'chapter': chapter_num,
            'original_filename': filename
        }
    
    return None

def process_manga(db_entry):
    """
    Orchestrates the check for a single manga.
    """
    manga_title = db_entry['title']
    last_chapter = db_entry['last_chapter']
    
    entries = search_nyaa(manga_title)
    new_chapters = []
    
    for entry in entries:
        parsed = parse_filename(entry.title)
        
        if not parsed:
            # print(f"[-] Failed to parse: {entry.title}")
            continue
            
        # Fuzzy match title to ensure it's actually the right manga
        # (Nyaa search is fuzzy, so we might get partial matches)
        match_ratio = fuzz.ratio(manga_title.lower(), parsed['title'].lower())
        
        if match_ratio < 80:
            # print(f"[-] Title mismatch ({match_ratio}%): {parsed['title']} != {manga_title}")
            continue
            
        if parsed['chapter'] > last_chapter:
            # Found a new chapter!
            new_chapters.append({
                'manga_id': db_entry['id'],
                'chapter_number': parsed['chapter'],
                'scan_group': parsed['scan_group'],
                'title': entry.title,
                'magnet': entry.link,
                'pub_date': entry.published
            })
            
    return new_chapters

def main():
    print("=== OmniRead Content Ingestion Test ===\n")
    
    all_updates = []
    
    for db_entry in MOCK_DB:
        updates = process_manga(db_entry)
        
        if updates:
            print(f"[+] Found {len(updates)} new chapters for {db_entry['title']}!")
            all_updates.extend(updates)
        else:
            print(f"[.] No new chapters for {db_entry['title']}.")
            
        # Rate Limiting
        time.sleep(RATE_LIMIT_SECONDS)
        print("-" * 40)

    print("\n=== Summary of Updates ===")
    if all_updates:
        # Sort by Manga ID then Chapter Number
        all_updates.sort(key=lambda x: (x['manga_id'], x['chapter_number']))
        
        for update in all_updates:
            payload = {
                'manga_id': update['manga_id'],
                'chapter_number': update['chapter_number'],
                'magnet_link': update['magnet']
            }
            
            print(json.dumps(payload, indent=2))
            
            if not DRY_RUN:
                # Here we would actually trigger the download/ingestion
                print(f"--> Triggering ingestion for Ch. {update['chapter_number']}")
    else:
        print("No updates found.")

if __name__ == "__main__":
    main()
