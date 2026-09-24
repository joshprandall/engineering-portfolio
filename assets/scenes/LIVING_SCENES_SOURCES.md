# Living scene media sources

The shared Day/Night scene system is implemented in `site-scenes.js` and `site-scenes.css`.

## Dark theme

### Webb’s Cosmic Cliffs
- Local asset: `assets/scenes/webb-cosmic-cliffs.webp`
- Source: https://esawebb.org/images/weic2205a/
- Credit: NASA, ESA, CSA, and STScI
- The site adds decorative parallax, star shimmer, glow, drifting particles, and rare subtle streaks. These effects are not an astronomical time-lapse.

## Light theme

The Light theme uses real nature video from Pexels. The files are streamed from Pexels’ video CDN rather than copied into this repository so the repository does not redistribute large stock-video binaries. The exact media URLs, creator names, source pages, and credits are committed in `site-scenes.js`.

Pexels states that its photos and videos may be used free for personal and commercial purposes under the Pexels License:
https://www.pexels.com/license/

### Forest river
- Creator: Christophe Génot
- Source: https://www.pexels.com/video/serene-forest-river-scene-in-daylight-33886656/
- Media: real forest, foliage, and flowing water

### Birds over water
- Creator: Daniel Feldman
- Source: https://www.pexels.com/video/birds-flying-above-beach-at-sunset-9982425/
- Media: real birds in flight, sky, coastline, and moving water

### Forest waterfall
- Creator: K
- Source: https://www.pexels.com/video/waterfall-in-the-forest-7351460/
- Media: real waterfall, stream, forest, and vegetation

## Performance and accessibility

- Videos are muted, inline, looped, and loaded only for Light mode.
- Save-Data mode keeps a real still-image poster instead of streaming video.
- The shared Pause Motion control stops video and decorative animation.
- The existing `prefers-reduced-motion` integration remains authoritative through `PortfolioTheme.isPaused()`.
- The Dark theme uses the local Webb image and lightweight canvas/CSS motion.
