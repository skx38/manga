# OmniRead - Product Requirements Document (PRD)

## 1. Product Overview
**Product Name:** OmniRead
**Goal:** To build the ultimate digital comics platform for Webtoons, Manga, Manhwa, and Manhua, solving major user complaints regarding discovery, reading experience, and synchronization.
**Target Audience:** Power users of existing platforms (Webtoon, MangaDex, Tachiyomi/Mihon) who are frustrated with "Daily Pass" models, poor search, and lack of customization.

## 2. User Stories

### 2.1 The "Hybrid" Reader Engine
*   **As a user**, I want the reader to automatically detect if a comic is a Webtoon or Manga so that I don't have to manually switch reading modes.
*   **As a Webtoon reader**, I want "Gapless Stitching" with 0px padding between images so that the art flows seamlessly without breaking immersion.
*   **As a mobile user**, I want "Smart Scroll" (tap zones or volume keys) so that I can read one-handed while commuting.
*   **As a Manga reader on a tablet**, I want "Smart Landscape Split" to view double-page spreads as a single seamless image.
*   **As a power user**, I want to customize color profiles (OLED Black, Sepia) to reduce eye strain during night reading.
*   **As an E-Ink device owner**, I want a high-contrast, no-animation "E-Ink Mode" to prevent ghosting and improve readability.

### 2.2 Advanced Discovery & Taxonomy
*   **As a user**, I want to include (Green), exclude (Red), or optionally include (Grey) tags in my search so that I can find exactly what I want (e.g., "Fantasy" but NOT "Harem").
*   **As a user**, I want to distinguish between Demographics (Seinen) and Themes (Isekai) to filter content more accurately.
*   **As a user**, I want my reading progress to automatically sync with MyAnimeList, AniList, and Kitsu so that my lists are always up to date.
*   **As a former Tachiyomi user**, I want to import my backup JSON file so that I don't lose my existing library.

### 2.3 Community & Social Layer
*   **As a user**, I want threaded discussions to have meaningful conversations about chapters.
*   **As a user**, I want spoilers in comments to be automatically hidden until I reach the end of the chapter to avoid being spoiled.
*   **As a user**, I want the option to enable "Danmu" (bullet comments) for a shared reading experience.

### 2.4 Creator Economy & Gamification
*   **As a user**, I want a "Wait-to-Read" model for ongoing series instead of "Daily Pass" so I can binge-read older chapters freely.
*   **As a user**, I want a "Streak" system with "Freeze" items so I don't lose my progress if I miss a day.
*   **As a creator**, I want to see a "Drop-off Heatmap" to understand where readers stop scrolling.

## 3. Functional Requirements

### 3.1 Hybrid Reader Engine
*   **Polymorphic Rendering:** System must analyze image dimensions and metadata to default to Vertical Scroll (Webtoon) or Paged View (Manga).
*   **Webtoon Mode:**
    *   Infinite vertical scroll.
    *   Gapless rendering (canvas stitching).
    *   Smart Scroll: Configurable tap zones (top/bottom/sides) and volume key scrolling.
*   **Manga Mode:**
    *   Right-to-Left (RTL) navigation.
    *   Smart Landscape Split: Detects wide images and renders them across the full screen in landscape mode.
*   **Image Processing:**
    *   Auto-Crop Borders: Algorithm to detect and remove white scanning margins.
    *   Smart Fit: Options for Fit to Width, Fit to Height, and Stretch.
*   **E-Ink Mode:**
    *   Disables all sliding animations.
    *   Forces high-contrast B&W rendering.
    *   Pagination only (no smooth scrolling).

### 3.2 Advanced Discovery
*   **Boolean Search:**
    *   UI must support 3 states for tags: Include (AND), Exclude (NOT), Optional (OR).
*   **Smart Library:**
    *   **2-Way Sync:** OAuth integration with MAL, AniList, Kitsu.
    *   **Migration:** Parser for Tachiyomi/Mihon protobuf/JSON backups to map titles to OmniRead ID.

### 3.3 Community
*   **Spoiler Quarantine:**
    *   Comments section collapsed by default on new chapters.
    *   "Predictive Spoiler Warnings": NLP model analyzes comment text before posting to warn users if it looks like a spoiler.
*   **Danmu:**
    *   Overlay comments scrolling horizontally.
    *   Toggle switch in Reader Settings.

### 3.4 Monetization & Gamification
*   **Wait-to-Read:** Latest 3 chapters locked for free users (timer based). Backlog free.
*   **Streaks:** Daily login tracking. "Freeze" item purchasable or earnable.
*   **Creator Dashboard:** Analytics visualization for scroll depth/drop-off.

## 4. Non-Functional Requirements
*   **Performance:** Reader must maintain 60fps (or native refresh rate) scrolling.
*   **Accessibility:** AI-generated Alt-Text for images.
*   **SEO:** SSR for web pages to ensure indexability.
