# ADR 001: Tenor Proxy Integration

## Context
We needed to integrate Tenor GIFs into the application to allow users to search and post GIFs. The standard integration method provided by Tenor involves using their client-side embed script or iframe.

## Decision
We decided to implement a **Server-Side Proxy Scraper** instead of using the official client-side embed.

### Implementation Details
1.  **Frontend**: Fetches GIF metadata from our own API (`/api/proxy/tenor?id=...`) instead of Tenor directly.
2.  **Backend**: The API route fetches the Tenor view page, parses the HTML to extract the `og:image` meta tag (which contains the raw GIF URL), and returns this URL to the frontend.
3.  **Rendering**: The frontend renders the GIF using a standard HTML `<img>` tag.

## Consequences

### Advantages (Why we did it)
*   **Clean UI**: We have complete control over the styling. There is no forced Tenor branding, "Share" buttons, or "Related GIFs" overlay.
*   **Privacy**: Users do not directly connect to Tenor's servers upon page load (no third-party tracking cookies or scripts).
*   **Performance (Frontend)**: Zero external scripts to load. The page bundle is smaller and rendering is instant once the URL is known.

### Disadvantages (Trade-offs)
*   **Efficiency**: This method is **less efficient** than the official embed in terms of latency and server load.
    *   *Double Hop*: Request goes Client -> Our Server -> Tenor -> Our Server -> Client.
    *   *Server Load*: Our server handles the overhead of fetching and parsing HTML for every new GIF lookup.
*   **Reliability**: This relies on scraping the `og:image` tag. If Tenor changes their page structure, this feature will break until updated.
*   **Bandwidth**: We are proxying the *metadata* request. The actual GIF image is loaded directly from Tenor's CDN (`media.tenor.com`) by the client browser, so bandwidth for the image itself is offloaded, which is good.

## Conclusion
The trade-off of slightly higher server latency is accepted in exchange for a significantly superior and cleaner User Experience (UX) that matches the application's premium aesthetic.
