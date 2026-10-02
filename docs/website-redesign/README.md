# Public website redesign — design decisions and prototype handoff

Status as of 2026-10-02: **styling implemented across spurly.web (public site, auth, onboarding, dashboard, hub, admin), uncommitted on the branch.** Paper/ink/teal tokens live in `src/core/tokens/tokens.css`, fonts self-hosted via `src/core/tokens/fonts.css`, the ribbon backdrop mounts app-wide through `src/app/AppBackdrop.jsx` (animated on public + auth routes, still frame inside the signed-in app). SEO/geo planning not started.
This folder preserves the approved styling so the SEO/geo planning can happen separately without losing it.

## What was decided

- **Direction: warm editorial** (paper theme), not dark cinematic.
- **Chosen hero: Variant "E · Paper ribbons + globe".** Everything in this doc refers to E unless noted.
- **Free tools only, no accounts.** The prototype uses zero third-party UI libraries. The only runtime dependency is `three` (r128 in the prototype), and only for the globe.
- Existing hero copy is kept as is: "Reach anyone. Anywhere they work." + current lead paragraph, CTAs and the three stats.

## Files here

| File | What it is |
|---|---|
| `prototype/spurly-hero-bench.html` | The full self-contained bench: variants A–E side by side, with compare mode. **The source of truth for the styling.** Open it in a browser (needs internet for Google Fonts and the three.js CDN). |
| `prototype/land-mask-360x180.b64` | 1°-resolution land/sea bitmap, base64, 10,800 chars (~8 KB binary). Row-major from lat 90 down, lon -180 east, 1 bit per cell, LSB first. Derived from Natural Earth 110m via `world-atlas`. |
| `prototype/gen-land-mask.mjs` | Script that regenerates the mask (`npm i world-atlas@2 topojson-client d3-geo`, then `node gen-land-mask.mjs`). |
| `screenshots/variant-e-desktop.png`, `variant-e-phone.png` | Reference renders of E at 1400px and 400px wide. |

Variants in the bench: A Paper stack, B Liquid form (raymarched blob), C Orbit globe (plain), D Midnight ribbons (dark), **E Paper ribbons + globe (chosen)**. B, C and D are kept only for reference.

## Variant E: exact spec

**Background:** a full-bleed fragment shader (plain WebGL1, no library), rendered at half resolution. Warm paper base, soft apricot and teal washes from domain-warped fbm noise, plus thin contour "ribbon" lines from `sin(fbm*24 + t*0.3)`. Lines fade out toward the left so the headline stays readable. A CSS SVG-noise grain overlay sits above it (`mix-blend-mode: multiply`, opacity .5). The shader pauses when the hero is off-screen or the tab is hidden, and reacts slowly to the pointer.

**Globe (the part that explains the product):**
- Real continents drawn as dots from the land mask (dot spacing 1.6°, about 4–5k dots). Dots fade and shrink toward the limb (custom point shader) so the edge stays clean.
- **Live day/night:** sub-solar point computed from the current UTC time and day of year; sphere shader shades the night side cool grey-blue and recolors the dots. Refreshed every 20 s.
- **Lead pins** for Lagos, London, New York, São Paulo, Dubai, Singapore, Sydney, San Francisco, with live local time from `Intl.DateTimeFormat` (IANA time zones). Awake = local hour 8 to 17 -> teal pin, bright arc, a dot travels along it. Asleep -> grey pin labelled "queued", arc dimmed to 0.22.
- **"You" pin in Delhi** is the origin of all arcs. Chosen because the founder is in India; make it a neutral or geo-detected city when the GEO work lands (see below).
- Legend top-right: italic line "Their morning, not yours.", Awake / Asleep key, live UTC clock.
- Slow auto-rotation (0.03 rad/s), initial view centered near 45°E; pointer adds up to ±0.35 rad yaw and ±0.15 rad pitch.
- Labels are HTML pills projected from 3D each frame and hidden when facing away.

**Cards over the globe:** the same three cards as the paper stack (captured LinkedIn profile, outreach draft, weekly acceptance), kept small and at the edges so most of the globe stays visible. They tilt with the pointer (CSS 3D, `perspective: 1300px`, `translateZ` 30/60/90). The profile card is hidden on narrow containers; the globe takes the top 76% of the stage there. All people and numbers are fictional sample data and are labelled "Sample data".

**Layout:** two columns (copy 1.02fr / stage 1fr), floating glass pill nav, container-query based (`container: hero/inline-size`, breakpoint 860px) so it behaves in any width. Stage height 600px desktop, 640px narrow.

## Design tokens (from the prototype)

| Token | Value | Notes |
|---|---|---|
| paper | `#f3ede3` | page ground |
| ink | `#1e1a16` | text, "You" pin, ink button |
| ink-2 | `#5a5148` | secondary text |
| teal | `#0a6f82` | text-safe accent and CTA background (white text passes AA) |
| teal-bright | `#0d9bb5` | your existing brand teal; pins, bars, glows (not for text) |
| apricot | `#f2b98f` | warm accent |
| card | `#fffdf8` | cards |
| Display font | Fraunces (opsz 144, SOFT 50, weight 420; italic 380 for "Anywhere") | headline |
| Body font | Instrument Sans 400/500/600 | |
| Mono font | IBM Plex Mono 400/500 | chips, labels, legend |

Headline: `clamp(40px, 7.2cqw, 90px)`, line-height .98, letter-spacing -.035em.
Note: the current site body font is Georgia. Adopting the three fonts above is part of the decision; **self-host them** in the real build instead of using the Google Fonts link (avoids a render-blocking third-party request and layout shift).

## Constraints for the real implementation (spurly.web)

Read `docs/SEO_PLAN.md` first. The public site is prerendered at build time (`scripts/prerender.mjs`, routes in `src/products/pages/website/seo.js`).

1. **Nothing may touch `window`, `document`, `Intl` timing, WebGL or `Date` during render.** Prerender must produce the full hero text, nav, CTAs and stats as static HTML. The globe canvas mounts after hydration in an effect.
2. **Lazy-load the globe** (`React.lazy` + dynamic import of `three`), so it never enters the main bundle or the prerender. LCP must be the headline text, not the canvas.
3. **Static poster fallback**: render the paper background and a pre-rendered globe image (a screenshot of the globe, WebP) in the prerendered HTML; swap to the live canvas once it is ready. Also the fallback for no-WebGL, reduced motion, and low-end phones.
4. **`prefers-reduced-motion`:** one still frame, no rotation, no tilt.
5. **Pause when off-screen** (IntersectionObserver) and when the tab is hidden; cap pixel ratio at 2; dispose the renderer and lose the context on unmount (React StrictMode double-mount safe).
6. **Code style:** function-based modules only, no classes. try/catch only in controller layers, not in components.
7. **Tokens:** map the values above onto the existing `body.mkt` variables in `website.css` (`--teal` is already `#0d9bb5`). Do not create a parallel token system.
8. Replace the three.js CDN with the npm `three` package, importing only what is used (tree-shake; the prototype uses WebGLRenderer, Scene, PerspectiveCamera, Group, Points, ShaderMaterial, Mesh, SphereGeometry, Line, QuadraticBezierCurve3, BufferGeometry/Attributes, Vector3). Consider a small hand-rolled WebGL renderer for the globe if bundle size is a concern.
9. Land mask: decode the base64 once, lazily, with the globe chunk.

## Suggested port plan

1. New `components/HeroGlobe/` with: `index.jsx` (lazy shell + poster), `globe.js` (scene setup, plain functions returning `{resize, render, destroy}`), `landMask.js`, `leads.js` (cities and time zones), `sun.js` (sub-solar point), `ribbonShader.js`.
2. Rewrite `Hero.jsx` markup/CSS to variant E. Remove or retire `DotGlow`, `FlapBoard` and the old `Globe` if nothing else uses them (check `HomePage.jsx` imports).
3. Verify: `npm run build` (prerender passes, dist HTML contains the hero text), Lighthouse mobile, reduced-motion path, StrictMode.
4. Then continue down the page (phases 2–6 in `claude/website_3d_redesign_plan.md` in the Claude Project): How it works, Who it's for, Pricing, nav/footer.

## Hooks for the SEO and GEO planning chat

- The hero already needs a **geo-aware origin pin** ("You · <city>"). `claude/` memory note `user_geo_detection` covers IP vs browser APIs and the privacy trade-offs; if India/non-India gating is built, reuse its result here instead of hard-coding Delhi. Fall back to a neutral city when location is unknown. No location prompt on the public page.
- Pin local times and awake status are computed client-side from the visitor's clock, which is correct without any geo data.
- Everything in the hero is decorative sample data, so keep the real value-proposition text in the HTML (headline, lead, stats, `sr-only` audience sentence) for crawlers.
- Do not add the animated labels (city times) to structured data or crawlable text.

## Not used, on purpose

Inkword, GetLayers, Spline and Unicorn Studio need accounts or paid plans. React Bits and OpenShaders were evaluated as free options but the final prototype does not need them. Reference sites for the feel: openshaders.com (single living shader plus tight type), inkword.app (the product itself as the hero).

The Claude-side private artifact of the bench ("Spurly Hero Prototype") may also still exist in the Claude app, but this folder is the durable copy.
