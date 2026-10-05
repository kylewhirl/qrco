# Dashboard legibility fixes

## Scope

Presentation-only follow-up to the existing dashboard design. QR destinations,
scan processing, analytics queries, authentication, and billing logic are unchanged.

## Source-confirmed issues addressed

- Removed a blanket white sidebar foreground that produced 1.08:1 contrast on
  the light sidebar. The existing semantic foreground is 17.47:1 on that surface.
- Kept the dark sidebar's neutral hover surface and made nested metadata and
  scan badges follow the highlighted row foreground in both themes.
- Added a separate dark text-blue token (8.63:1 on the dark card), without
  brightening primary button backgrounds. Dark red actions now have 5.40:1
  contrast with white labels.
- Increased small chart labels and range controls; fixed the tooltip's invalid
  `hsl(#hex)` token, labelled range buttons, and enabled chart keyboard support.
- Let long metric names wrap rather than disappear behind ellipses.
- Removed competing blanket radius rules; apply consistent control/dialog/menu
  radii to Radix portal content as well as dashboard descendants.
- Prevented narrow-screen breadcrumb wrapping from crowding header actions.
- Removed the invisible keyboard-focusable AI button in the collapsed sidebar,
  and gave collapsed icons sufficient horizontal room.
- Loaded the 500/600 Montserrat weights used by body text and UI labels.

## Validation

- `node --test scripts/dashboard-legibility.test.mjs`: 13 passing tests for
  token-pair contrast and CSS regression guards. These are source/token tests,
  not a rendered accessibility audit or a WCAG conformance claim.
- `npm run check`: ESLint (zero warnings), TypeScript, and SDK build.
- `git diff --check`.
- `npm run build`: blocked before application compilation because the existing
  migration prebuild requires `DATABASE_URL`, unavailable in this environment.
  No production database credentials or migrations were used.

## Visual QA still required

The live dashboard redirects to sign-in in the available cloud browser. An
isolated component fixture was prepared, but that browser rejected its local
preview URL with `net::ERR_BLOCKED_BY_CLIENT`. No authenticated dashboard,
responsive screenshots, or rendered contrast measurements are claimed.

Before merging, check desktop and narrow-screen light/dark dashboard layouts,
collapsed and mobile navigation, long metric values, 7/30/90-day chart controls,
keyboard focus, and portal dialogs/menus (open, close, Escape, and repeat).
