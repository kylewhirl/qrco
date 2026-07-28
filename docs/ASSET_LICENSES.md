# Asset License Review

Review this file before publishing the repository or distributing packages that include assets.

## Repository Assets

| Path | Status | Notes |
| --- | --- | --- |
| `public/logo.svg` | Needs owner confirmation | Project brand asset. Confirm redistribution rights. |
| `public/text-logo.png` | Needs owner confirmation | Project brand asset. Confirm redistribution rights. |
| `public/frame-1.svg` | Needs owner confirmation | QR frame artwork. Confirm author/license. |
| `public/frame-2.svg` | Needs owner confirmation | QR frame artwork. Confirm author/license. |
| `public/qr-style-swatches/*.svg` | Generated project assets | Generated from project style presets; keep source generation script documented. |
| `public/fonts/DM-PopCap-Regular.ttf` | Needs license confirmation | Confirm the font license permits public redistribution. |
| `public/fonts/Tetra-ITC-Std-Book.otf` | Needs license confirmation | Confirm the font license permits public redistribution. |
| `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` | Needs cleanup/review | Starter/demo assets. Remove if unused or confirm license before publishing. |

## Maintainer Checklist

- [ ] Confirm every font license allows redistribution in a public repository.
- [ ] Confirm brand and frame assets are owned by the project or licensed for public redistribution.
- [ ] Remove unused starter assets before the first public release.
- [ ] Keep generated swatches reproducible via `scripts/generate-style-swatches.cjs`.
