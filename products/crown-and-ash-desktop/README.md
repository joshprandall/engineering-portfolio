# Crown & Ash Desktop

This package turns the offline browser runtime into a dedicated Windows desktop application without coupling the website deployment to Electron.

## Development launch

From this directory:

1. `npm install`
2. `npm start`

## Windows installer

Run `npm run dist:win`. The NSIS installer is written to `dist/`.

The packaging step copies the authoritative game from `games/3d-battle-chess/` into a generated `app/` directory. Do not edit the generated copy. The window uses context isolation, disables Node integration in game content, keeps the Chromium sandbox enabled, blocks unexpected navigation, and opens approved external links in the system browser.

Steamworks, code signing, achievements, cloud saves, store media and Steam Deck certification remain separate release gates. This package does not claim those features.
