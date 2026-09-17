# Character artwork

## Source and rights

Ten official **League of Legends Arcane skin splash artworks**, downloaded from Riot Games' Data Dragon CDN. These are game splash illustrations, not Netflix production stills or fan art. The manifest records every exact source URL, skin name, source dimensions, SHA-256 and approved crop rectangle.

- [Riot Data Dragon documentation](https://developer.riotgames.com/docs/lol#data-dragon)
- [Riot Legal Jibber Jabber](https://www.riotgames.com/en/legal)
- Metadata version: `16.18.1`
- Artwork copyright: Riot Games and respective rights holders. No ownership transfer or commercial license is implied.

**Commercial clearance is NOT established.** Riot's fan-project policy grants limited, revocable noncommercial community use, subject to restrictions; commercial projects generally require written permission except for specific exceptions. This account-selling project must not assume that policy permits its use. Obtain appropriate written permission before public/commercial distribution. Attribution alone is not permission. This artwork update does not publish the site or establish compliance with Riot's other policies.

## Selected collection

| Character | Artwork | Official source |
| --- | --- | --- |
| Jinx | Arcane Fractured Jinx | https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_60.jpg |
| Vi | Arcane Brawler Vi | https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Vi_48.jpg |
| Ekko | Arcane Last Stand Ekko | https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ekko_57.jpg |
| Jayce | Arcane Survivor Jayce | https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jayce_35.jpg |
| Caitlyn | Arcane Commander Caitlyn | https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Caitlyn_50.jpg |
| Viktor | Arcane Savior Viktor | https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Viktor_24.jpg |
| Mel | Arcane Councilor Mel | https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Mel_1.jpg |
| Heimerdinger | Arcane Professor Heimerdinger | https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Heimerdinger_33.jpg |
| Warwick | Arcane Vander Warwick | https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Warwick_56.jpg |
| Singed | Arcane Shimmer Lab Singed | https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Singed_28.jpg |

## Local variants

`public/media/characters/` contains four WebP files for each character:

- `*-240.webp`: 240×320 portrait, normal-density account nodes.
- `*-480.webp`: 480×640 portrait, high-density displays and page transition.
- `*-thumb.webp`: 160×160 upper-portrait thumbnail, music player and compact UI.
- `*-wide.webp`: full 1215×717 composition, available for future motion graphics. These are **not transparent cutouts or separated animation layers**.

Portraits use individually selected 3:4 crops inspected in a contact sheet. Lanczos downsampling, WebP quality 85, metadata omitted, no upscaling. Full colour is retained; the app adds only a subtle contrast treatment, hover and existing transition effects. Responsive `srcSet`, explicit image dimensions and lazy loading keep the tree lightweight. Images are served locally; no runtime CDN dependency.

`src/lib/characters.js` is the generated runtime catalogue; `accounts.js` preserves the existing CHAMPIONS export. Existing four accounts keep their original character order (Jinx, Vi, Ekko, Jayce); new accounts cycle through all ten. **Add / Edit signal → Character artwork** also lets users choose any of the ten immediately without adding fake accounts. The choice is saved with the account in the existing session storage.

The old Jinx cutout, uncut Jinx, Vi, Ekko and Jayce portrait files have been removed. The unrelated reference image, logos, video and audio are unchanged.

## Rebuild the images

```sh
python -m pip install --target node_modules/.cache/artwork-python -r scripts/requirements-artwork.txt
PYTHONPATH=node_modules/.cache/artwork-python python scripts/prepare-character-artwork.py
```

Edit `scripts/character-artwork.json`, not the generated catalogue. Cached original JPEGs live under the ignored `node_modules/.cache/arcane-artwork/`; the script downloads missing originals with timeouts and rejects non-JPEG, oversize, undersized, or invalid crops. To deliberately re-fetch an original, remove its individual cache file first. Source checksums allow drift to be reviewed against the committed manifest.

Verification: `npm test` checks roster completeness, all local WebP headers/dimensions/budgets, source provenance, and obsolete-reference removal. `npm run build` builds the app. Browser verification covers the landing artwork and account editing/selection.
