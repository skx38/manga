# OmniRead - UI Wireframe Descriptions

## 1. Boolean Search Interface

### 1.1 Overview
The Boolean Search interface is designed to allow power users to construct complex queries using a tri-state tagging system. It is located within the "Browse" or "Search" tab.

### 1.2 Components

#### A. Search Bar
*   **Position:** Top of the screen.
*   **Function:** Text input for title or author search.
*   **Right Icon:** "Filter" button to expand/collapse the advanced tag filter view.

#### B. Tag Categories (Accordion/Tabs)
*   **Layout:** Horizontal scrollable tabs or vertical accordion sections.
*   **Categories:**
    *   **Demographics:** Seinen, Shounen, Josei, Shoujo.
    *   **Format:** Webtoon, Manga, Manhwa, Manhua.
    *   **Genres:** Action, Fantasy, Romance, Horror, etc.
    *   **Themes:** Isekai, Regression, Villainess, System, Harem.
    *   **Status:** Ongoing, Completed, Hiatus.

#### C. Tri-State Tag Chips
*   **Visual Style:** Rounded pills/chips.
*   **Interaction:**
    *   **Default State (Grey):** Tag is ignored (OR logic if multiple selected in other contexts, but generally "don't care").
        *   *Visual:* Grey background, Black text (or White in Dark Mode).
    *   **1st Tap -> Include (Green Check):** Content MUST contain this tag (AND logic).
        *   *Visual:* Green background, White text, Checkmark icon on left.
    *   **2nd Tap -> Exclude (Red X):** Content MUST NOT contain this tag (NOT logic).
        *   *Visual:* Red background, White text, "X" icon on left.
    *   **3rd Tap -> Reset (Grey):** Returns to Default State.

#### D. Active Filters Summary
*   **Position:** Below the tag selection area, just above the results.
*   **Function:** Shows a horizontal scrolling list of currently active "Include" and "Exclude" tags for quick review.
*   **Interaction:** Tapping an active filter chip here removes it (resets to Grey).

### 1.3 User Flow Example
1.  User opens Search.
2.  User taps "Fantasy" (Turns Green/Include).
3.  User taps "Harem" once (Green), then taps again (Turns Red/Exclude).
4.  User types "Leveling" in the search bar.
5.  **Result:** System queries for titles matching "Leveling" AND tag "Fantasy" AND NOT tag "Harem".

## 2. Reader Interface (Hybrid Controls)

### 2.1 Webtoon Mode (Vertical)
*   **Overlay (Tap Center):**
    *   **Top Bar:** Back button, Chapter Title, Settings Gear.
    *   **Bottom Bar:** Slider for page scrubbing, Previous/Next Chapter buttons.
*   **Smart Scroll Zones (Configurable):**
    *   **Left 20%:** Scroll Up / Page Up.
    *   **Right 20%:** Scroll Down / Page Down.
    *   **Center:** Toggle Overlay.

### 2.2 Manga Mode (Paged)
*   **Overlay:** Same as Webtoon.
*   **Navigation:** Tap Left/Right edges to turn pages (RTL default).
*   **Landscape Split:**
    *   When device is rotated to Landscape, the UI checks image aspect ratio.
    *   If image is a double-page spread (width > height * 1.5), it renders as one full-screen image.
    *   If images are single pages, it renders two pages side-by-side (Page N on right, Page N+1 on left for RTL).
