# Suero-style premium studio reference (for agents)

Use this when building or refactoring sites to match **editorial studio** quality: calm, confident typography, restrained motion, and smooth scroll. Adapt copy, colors, and components to the client brand; do **not** copy proprietary fonts, logos, or licensed Webflow project markup wholesale.

## Source material (local example)

On the machine where this was captured (paths will differ per user):

- Saved page: `~/Downloads/suero premium example.htm` (Ethan Suero / Suero Studio marketing site snapshot).
- Assets folder: `~/Downloads/suero premium example_files/` (Webflow export CSS, Lenis, GSAP, Swiper, custom `suero-main.js`, etc.).

Do not ship those third-party bundles in client projects unless licenses and performance budgets allow.

## Tech stack (example site)


| Layer               | What they use                                             | Lightweight alternative                                                                               |
| ------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Smooth scroll       | **Lenis** + `html.lenis.lenis-smooth`                     | Same Lenis bundle; add `lenis.css` rules (height auto, overflow clip when stopped).                   |
| Scroll storytelling | **GSAP** + **ScrollTrigger** + SplitText-style line masks | **CSS transitions** + **Intersection Observer** for fade/slide-in; avoid GSAP if bundle size matters. |
| Carousels           | **Swiper**                                                | CSS scroll-snap or native `<details>` / static grid for small sites.                                  |
| CMS / build         | Webflow                                                   | Static HTML + shared CSS (this repo pattern).                                                         |


## Typography system (example)

- **Display / headlines:** custom **Extenda** (very wide, high impact). Close free substitutes: **Outfit**, **Syne**, **Bebas Neue** (narrower), **Oswald** (condensed).
- **UI / body:** **Switzer** (geometric neo-grotesk). Close free substitutes: **DM Sans**, **Plus Jakarta Sans**, **Manrope**, **Inter**.

**Rules to copy:**

1. **One display family** for hero + section titles; **one sans** for body, nav, buttons.
2. **Tight line-height** on large headings (`1.05`–`1.12`), **negative letter-spacing** on big type (`-0.02em` to `-0.04em`).
3. **Eyebrow / label** style: small caps, `0.12em`–`0.14em` letter-spacing, muted color, above the main headline.
4. **Accent phrases** inside a headline: wrap in `<strong>` with same font but **heavier weight** or slightly **higher contrast** color (not a second rainbow).

## Color & surface (example vibe)

- **Dark-first studio** feel: near-black warm background (`#111`–`#141210`), off-white text (`#ebe9e4`), muted body one step cooler (`#9b9893`).
- **Light sections** in the same family: warm paper (`#edeae3`–`#f4f1eb`), deep charcoal text (`#161513`).
- **Borders:** low-contrast 1px; **glass** uses soft blur + semi-transparent fill, not heavy drop shadows.
- **Selection** (`::selection`): invert or use a subtle brand tint; keep readable.

## Layout & rhythm

- **Generous vertical spacing** between sections (`clamp(3rem, 8vw, 6rem)` or stepped space tokens).
- **Max-width** for reading columns (`42rem`–`48rem` for long copy); let marketing headings go wider (`min(var(--max), 72rem)`).
- **Grid:** optional 12-column mental model; content often **starts narrow** in hero then **opens up** for cards.
- **Asymmetry on purpose:** tagline block bottom-left under centered logo (pattern we use on Monoright home hero).

## Motion principles (example)

- **Primary easing (snappy):** `cubic-bezier(0.625, 0.05, 0, 1)` on hovers and text reveals.
- **Nav / links:** per-character vertical slide using duplicated line (`text-shadow` + `translateY`); replicate only if accessibility and reduced-motion are handled (`prefers-reduced-motion: reduce` → no stagger, instant state).
- **Buttons:** slight lift on hover (`translateY(-2px)`), shadow ramp, **180–220ms** transitions on fine pointers only.
- **Scroll reveals:** opacity + small `translateY` (8–20px), **once** when entering viewport (Intersection Observer), not on every scroll.
- **Hero / canvas:** optional WebGL or video; for static sites use **gradient mesh** + subtle **noise** (CSS or tiny SVG) instead.

## Components to echo

1. **Header:** full-width bar at top → on scroll, **floating pill** with max-width and rounded radius (already similar in Monoright `site-header.is-compact`).
2. **Primary CTA:** one strong button (e.g. “Schedule a call” / “Get a quote”); secondary as outline or ghost.
3. **Section headers:** eyebrow + large title + short supporting line; avoid long paragraphs under H2.
4. **Cards:** glass or solid surface, **one** focal element (icon or number), clear benefit line, single CTA.
5. **Footer:** big typographic CTA row + simple link columns.

## Accessibility & performance

- Respect `**prefers-reduced-motion`:** disable Lenis where needed, skip reveal animations, shorten transitions.
- **Lenis + sticky:** sync scroll position with header (Monoright binds Lenis `scroll` to header compact state).
- **Fonts:** `font-display: swap`; subset weights actually used.
- **Do not** hide system cursor on client sites unless explicitly requested (Suero example uses custom cursor in some builds).

## How Monoright implements this (this repo)

- **Fonts:** Google **Outfit** (display) + **DM Sans** (UI/body) in `css/styles.css` (`@import`).
- **Tokens:** warm neutrals in `:root` / `[data-theme]` blocks; `--ease-reveal` for scroll fades.
- **Motion:** `[data-reveal]` + `.is-visible` via `js/main.js` Intersection Observer (no GSAP).
- **Scroll:** Lenis from `js/vendor/lenis.min.js` with tuned `lerp` (smoother glide) and `wheelMultiplier` slightly under 1; `html` gets `lenis lenis-smooth` while Lenis is running. Smooth scroll activates from **768px** width on fine pointers (see `mqLenis` in `js/main.js`).
- **Hover list (home value props):** `value-props--suero-band` + `value-props-bites` mimic the example’s large typographic rows on a near-black band; detail copy sits in a `grid-template-rows: 0fr → 1fr` panel on hover/focus-within (fine pointers), and stays open on touch / narrow viewports.

When porting to another project, copy the **token names**, **easing**, and **observer pattern**, then swap fonts and hex values for the new brand.