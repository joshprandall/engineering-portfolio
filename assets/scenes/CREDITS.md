# Scene credits

Night: “Cosmic Cliffs” in the Carina Nebula (NIRCam image).
Credit: NASA, ESA, CSA, and STScI.
Source: https://science.nasa.gov/asset/webb/cosmic-cliffs-in-the-carina-nebula-nircam-image/
Image record: https://esawebb.org/images/weic2205a/
License: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/
Media guidance: https://esawebb.org/copyright/
The supplied display image is encoded as WebP for web delivery. A translucent reading layer, a slow camera drift and decorative stars are rendered separately. The motion is not an astronomical time-lapse.

Day: Existing Pexels nature footage, with the original vector landscape retained as a fallback. The current source identifiers and creator names are preserved from `site-scenes.js`:

- Forest waterfall — K: https://www.pexels.com/video/waterfall-in-the-forest-7351460/
- Forest river — Christophe Génot: https://www.pexels.com/video/serene-forest-river-scene-in-daylight-33886656/
- Beach at sunset — Daniel Feldman: https://www.pexels.com/video/birds-flying-above-beach-at-sunset-9982425/

Retain source attribution and applicable Pexels terms. The refinement pass preserves the existing media; it does not assert a new independent licensing review.


## Day scene delivery

The production deployer downloads the exact licensed Pexels MP4s above into `assets/scenes/day/` and serves them from the OSU site itself. This avoids depending on third-party hotlink playback for the visible waterfall, river, and beach/birds motion. The original Pexels URLs remain in `site-scenes.js` only as an emergency playback fallback and for source attribution.

## Phone playback renditions — 2026-09-29

The `day/*-mobile.mp4` files are 1280×720 H.264 Main/3.1 renditions of the same complete approved clips, encoded at 24 fps with a capped bitrate and an initial seek index. Original 1920×1080 files remain preserved for larger screens. There is no substitute footage; creators and licenses above apply unchanged.
