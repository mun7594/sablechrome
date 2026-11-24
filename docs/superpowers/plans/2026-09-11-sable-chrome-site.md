# SABLE & CHROME Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-page static luxury portfolio site for the fictional auto-services brand SABLE & CHROME, with a shared declarative scroll-animation engine.

**Architecture:** Plain static HTML per page, one shared stylesheet, one shared JS module. The JS exposes a declarative attribute API (`data-reveal`, `data-mask`, `data-parallax`, `data-scale`, `data-magnetic`, `data-count`) so every page gets identical motion behavior without per-page scripts. Nav and footer markup is duplicated per page (no templating available in a no-build static site) but is byte-identical apart from the `aria-current` link.

**Tech Stack:** HTML5, CSS3 (custom properties, grid, `position: sticky`), vanilla JS, GSAP 3 + ScrollTrigger (CDN), Lenis smooth scroll (CDN), Google Fonts.

**Spec:** `docs/superpowers/specs/2026-09-11-sable-chrome-design.md`

## Global Constraints

- **No build step.** Site must run by double-clicking `index.html` from the filesystem. No npm, no bundler, no server, no ES module imports across files (use classic `<script>` tags — `file://` blocks module CORS).
- **No pure white.** Lightest permitted value is `--bone: #EDE7DD`. Never `#fff`, `white`, or `rgba(255,255,255,…)` as a surface color. (White at low alpha for glass/scrim overlays is permitted.)
- **Palette verbatim:** `--ink:#0F0F11`, `--graphite:#17181B`, `--graphite-2:#1F2125`, `--bone:#EDE7DD`, `--sand:#DCD3C5`, `--copper:#C2703D`, `--copper-soft:#D08A5C`.
- **Fonts verbatim:** Instrument Serif (display), Inter (UI/body), JetBrains Mono (numerals).
- **Images:** only the pre-verified Unsplash IDs listed in spec §7. Do not invent new IDs — every one in the spec returned HTTP 200 and was visually inspected. Format: `https://images.unsplash.com/<id>?auto=format&fit=crop&w=<w>&q=80`.
- **Brand copy verbatim:** name `SABLE & CHROME`, descriptor `Auto Atelier`, tagline `Detail. Repair. Tint. Dispatched.`, phone `(503) 555-0147`, email `studio@sableandchrome.com`, address `Bay 14 — Ironside Works, Portland, OR 97209`.
- **Accessibility:** every `<img>` needs a real `alt`; all interactive elements reachable by keyboard; `prefers-reduced-motion` fully honored.
- **Responsive floor:** 360px. No horizontal body scroll at any width.

---

### Task 1: Design tokens, base stylesheet, nav and footer

**Files:**
- Create: `css/style.css`
- Create: `index.html` (nav + footer only at this stage, empty `<main>`)

**Interfaces:**
- Produces: CSS custom properties listed in Global Constraints on `:root`.
- Produces: utility classes later tasks rely on — `.section` (block padding), `.section--ink`, `.section--bone`, `.wrap` (max-width container), `.label` (uppercase micro-label), `.display` (Instrument Serif headline), `.mono` (JetBrains Mono numerals), `.btn`, `.btn--fill` (fill-sweep CTA), `.link-underline` (underline-slide).
- Produces: nav markup contract — `<header class="nav" id="nav">` containing `.nav__inner`, `.nav__logo`, `.nav__links`, `.nav__cta`, `.nav__burger`, plus `<div class="navmenu" id="navmenu">` for the mobile overlay. Task 2's JS queries exactly these IDs/classes.

- [ ] **Step 1: Write `css/style.css` reset + tokens**

Include `*{box-sizing:border-box}`, `html{-webkit-text-size-adjust:100%}`, `body{overflow-x:hidden}`, the `:root` token block verbatim from Global Constraints, and derived tokens `--ink-text:#141417`, `--bone-text:#EDE7DD`, `--r:2px` (border radius — keep near-sharp for the architectural feel).

- [ ] **Step 2: Add typography scale**

`.display` → `font-family:'Instrument Serif',serif; line-height:0.86; letter-spacing:-0.02em; font-weight:400`. Sizes via `clamp()`: `--fs-hero: clamp(3.4rem,12.5vw,14rem)`, `--fs-h2: clamp(2.4rem,6.5vw,6rem)`, `--fs-h3: clamp(1.6rem,3vw,2.8rem)`.
`.label` → `font-size:.7rem; text-transform:uppercase; letter-spacing:.22em; font-weight:500`.
`.mono` → `font-family:'JetBrains Mono',monospace`.

- [ ] **Step 3: Add section system**

`.section{padding-block:clamp(5rem,11vw,11rem)}`, `.section--ink{background:var(--ink);color:var(--bone-text)}`, `.section--bone{background:var(--bone);color:var(--ink-text)}`, `.wrap{width:min(1360px,92vw);margin-inline:auto}`.

- [ ] **Step 4: Build the navbar CSS**

Fixed, `z-index:100`, transparent by default. State class `.nav.is-stuck` (added by JS past 80px) applies: floating pill — `width:min(1200px,94vw)`, `background:rgba(15,15,17,.72)`, `backdrop-filter:blur(18px) saturate(1.3)`, `border:1px solid rgba(237,231,221,.1)`, reduced padding, and `.nav__wordmark{opacity:0;transform:translateX(-8px)}`. State class `.nav.is-hidden` applies `transform:translateY(-140%)`.

- [ ] **Step 5: Build hover interaction primitives**

`.link-underline` — `::after` bar at `bottom:-4px`, `transform:scaleX(0)`, `transform-origin:right`; on hover `scaleX(1)` with origin `left` (this origin swap is what makes it read as a *slide*, not a grow).
`.btn--fill` — `::before` copper panel at `translateY(101%)`; on hover `translateY(0)`; text sits in a `position:relative` span above it.
`.btn .arrow` — on hover the arrow translates `x:4px` while a duplicate arrow slides in from `x:-14px` (arrow-slide).

- [ ] **Step 6: Write `index.html` shell**

`<head>` with charset, viewport, title `SABLE & CHROME — Auto Atelier`, meta description, Google Fonts preconnect + stylesheet link, `css/style.css`, and an inline SVG favicon data-URI using the copper monogram.
`<body>` containing: preloader div, nav header, mobile navmenu, empty `<main>`, footer. Footer carries the wordmark, the three contact lines from Global Constraints, service links, and a copyright line.

- [ ] **Step 7: Verify in browser**

Open `index.html`. Confirm: fonts render (serif wordmark, mono numerals), nav is transparent and centered, footer shows correct contact details, no console errors, no horizontal scrollbar at 360px.

- [ ] **Step 8: Commit**

```bash
git add css/style.css index.html
git commit -m "feat: design tokens, base styles, nav and footer shell"
```

---

### Task 2: Animation engine

**Files:**
- Create: `js/main.js`
- Modify: `index.html` (add CDN script tags + `js/main.js` before `</body>`)

**Interfaces:**
- Consumes: nav markup contract from Task 1.
- Produces: the declarative attribute API every later task uses:
  - `data-reveal` — fades + rises `28px` on enter. Optional `data-delay="0.15"`.
  - `data-stagger` — staggers `[data-reveal]` descendants by `0.08s`.
  - `data-mask` — splits text to lines, wipes each up from `translateY(110%)`, stagger `0.09s`.
  - `data-parallax="0.3"` — translates y by `scrollProgress * 0.3 * elementHeight`.
  - `data-scale` — image scales `1.18 → 1` across its viewport pass.
  - `data-magnetic` — element follows cursor within its bounds, max offset `10px`, eases home on leave.
  - `data-count` — counts `0 → textContent` once on enter, preserving `,` separators and any `+`/`h` suffix.

- [ ] **Step 1: Add CDN tags to `index.html`**

GSAP 3.12.5, ScrollTrigger 3.12.5, Lenis 1.0.42, then `js/main.js` — in that order, all before `</body>`.

- [ ] **Step 2: Write the reduced-motion guard first**

```js
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```
When `REDUCED`, skip Lenis and every ScrollTrigger, and immediately set all `[data-reveal]`/`[data-mask]` elements to their final visible state. This must be the first thing written so no later effect can leave content invisible.

- [ ] **Step 3: Write the line splitter**

```js
function splitLines(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
  const spans = [...el.querySelectorAll('.w')];
  const lines = []; let top = null, cur = null;
  spans.forEach(s => {
    if (s.offsetTop !== top) { top = s.offsetTop; cur = []; lines.push(cur); }
    cur.push(s);
  });
  el.innerHTML = lines
    .map(l => `<span class="line"><span class="line__i">${l.map(s => s.textContent).join(' ')}</span></span>`)
    .join('');
  return [...el.querySelectorAll('.line__i')];
}
```
`.line{display:block;overflow:hidden}` and `.line__i{display:block;will-change:transform}` go in `css/style.css`.

- [ ] **Step 4: Wire nav scroll behavior**

On scroll: add `.is-stuck` past 80px; add `.is-hidden` when scrolling down past 400px, remove on any upward delta. Burger toggles `.navmenu.is-open` and staggers link reveal.

- [ ] **Step 5: Implement the preloader**

Counter 0→100 over ~1.1s, then the ink panel wipes up (`yPercent:-100`, `power4.inOut`), then the hero mask-reveal timeline plays. Guard with `sessionStorage` so it only runs on first visit within the session.

- [ ] **Step 6: Implement each attribute handler**

One `init()` that queries each attribute and attaches its ScrollTrigger. Call `splitLines` on resize (debounced 200ms) and refresh ScrollTrigger.

- [ ] **Step 7: Verify**

Add one temporary `data-reveal` and one `data-mask` element to `index.html`, scroll, confirm both animate. Confirm with reduced-motion forced on that content is visible and no errors appear. Remove the temporary elements.

- [ ] **Step 8: Commit**

```bash
git add js/main.js index.html css/style.css
git commit -m "feat: declarative scroll animation engine"
```

---

### Task 3: Home page

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: all utility classes from Task 1 and all attributes from Task 2.

- [ ] **Step 1: Hero** — Oversized Typography + Parallax + Mask Reveal

Full-height ink section. Three parallax depth layers (`data-parallax` at `0.12`, `0.28`, `0.45`) using `photo-1503376780353-7e6692767b70` as the backdrop and `photo-1626668893632-6f3a4466d22f` as an overlapping foreground card. Headline in `.display` at `--fs-hero` with `data-mask`, one word in italic. Scroll cue at bottom.

- [ ] **Step 2: Marquee** — copper strip, scroll-velocity-linked

Duplicate the word list twice for a seamless loop; GSAP `xPercent` tween whose `timeScale` is nudged by scroll velocity and whose direction flips with scroll direction.

- [ ] **Step 3: The Atelier** — Editorial Split

Bone section. Sticky left text column (`position:sticky; top:18vh`), right column of two stacked images (`photo-1492144534655-ae79c964c9d7`, `photo-1615906655593-ad0386982a0f`) with `data-parallax` and `data-scale`.

- [ ] **Step 4: Services** — Bento Grid

Ink section, 4 asymmetric cells on a 12-col grid (cell 1 spans 7×2 rows, cells 2–4 span 5). Each cell: mono index, title, one-line description, image. Hover = Image Zoom (`scale:1.07`), Overlay Reveal (copper panel wiping up from `translateY(100%)` carrying the "View service" label), Card Lift (`translateY(-6px)` + border brightening).

- [ ] **Step 5: The Process** — Sticky Story Layout

Bone section. Left column sticky heading + copper progress bar. Right column: 4 steps, each with mono index and image, revealing in sequence; ScrollTrigger drives the progress bar scaleY.

- [ ] **Step 6: Selected Work** — Project Stack

Ink section, pinned. 3 cards stack with increasing `top` offsets; as each advances the one behind scales to `0.94` and dims. Uses McLaren, BMW M4, Ferrari images.

- [ ] **Step 7: Numbers band**

`data-count` on the four figures from spec §8.

- [ ] **Step 8: Testimonial + CTA band**

Oversized quote with `data-mask`, portrait `photo-1507003211169-0a1dd7228f2d`. CTA band with `.btn--fill` + arrow-slide + `data-magnetic`.

- [ ] **Step 9: Verify**

Scroll the whole page. Every image loads (check Network for 404s), every section animates once, pinned sections release cleanly, no layout shift. Then resize to 375px and confirm pinning is disabled and nothing overflows.

- [ ] **Step 10: Commit**

```bash
git add index.html css/style.css js/main.js
git commit -m "feat: home page"
```

---

### Task 4: Services page

**Files:**
- Create: `services.html`

- [ ] **Step 1:** Copy nav/footer/head from `index.html`, set `aria-current="page"` on the Services link, title `Services — SABLE & CHROME`.
- [ ] **Step 2:** Compact ink hero, `data-mask` headline, mono service count.
- [ ] **Step 3:** Sticky left index listing the 4 services with mono indices; active item highlights in copper as its panel enters view.
- [ ] **Step 4:** Four detail panels alternating ink/bone. Each: oversized number, title, prose, spec list (`<dl>`), "from" price, and an image using Overlapping Layers — image overhangs the section edge via negative margin — plus `data-scale`. Images per spec §7 by service.
- [ ] **Step 5:** Add-ons grid (6 small cards, card-lift hover).
- [ ] **Step 6:** CTA band, reusing the Task 3 markup exactly.
- [ ] **Step 7: Verify** — all images load, sticky index tracks correctly, overhanging images don't cause horizontal scroll at any width.
- [ ] **Step 8: Commit** — `git commit -m "feat: services page"`

---

### Task 5: Work page with before/after slider

**Files:**
- Create: `work.html`

- [ ] **Step 1:** Nav/footer/head, `aria-current` on Work, title `Work — SABLE & CHROME`.
- [ ] **Step 2:** Hero with mono project count and `data-mask` headline.
- [ ] **Step 3:** Project Stack — 6 pinned case cards, each full-bleed image + meta row (client, service, year) with Overlay Reveal on hover.
- [ ] **Step 4:** Editorial grid below — mixed-height cards with Image Zoom.
- [ ] **Step 5:** Before/after slider.

The "before" layer is **the same image** as "after" under a dulling filter, so the two halves align pixel-perfectly:
```css
.ba__before img { filter: saturate(.42) contrast(.84) brightness(.92); }
```
Wrap in `.ba` with `.ba__after` clipped by `clip-path: inset(0 0 0 var(--x))`. Drag handle updates `--x`. Must support mouse drag, touch drag, and `ArrowLeft`/`ArrowRight` keys with `role="slider"`, `aria-valuenow`, and a visible focus ring.

- [ ] **Step 6:** CTA band.
- [ ] **Step 7: Verify** — drag the slider with mouse, then with keyboard via Tab. Confirm the clip tracks the handle exactly and does not drift when the window is resized.
- [ ] **Step 8: Commit** — `git commit -m "feat: work page and before/after slider"`

---

### Task 6: Contact page

**Files:**
- Create: `contact.html`

- [ ] **Step 1:** Nav/footer/head, `aria-current` on Contact, title `Contact — SABLE & CHROME`.
- [ ] **Step 2:** Editorial split — sticky ink info column (address, phone, email, hours from Global Constraints) beside a bone form column.
- [ ] **Step 3:** Form — floating labels (`:placeholder-shown` + `:focus-within` technique, no JS), copper service chips as styled `<input type="radio">` + `<label>` pairs, textarea, submit with fill-sweep. Every field has a real `<label>` and `id`/`for` pairing.
- [ ] **Step 4:** Client-side validation only — on submit, `preventDefault()`, validate required fields, and swap the form for an inline confirmation panel. No network request (there is no backend).
- [ ] **Step 5:** Mobile-dispatch callout using `photo-1763377278900-0ce8242c5005` + coverage grid.
- [ ] **Step 6: Verify** — tab through every field, confirm labels float, chips are keyboard-selectable, and submitting empty shows validation rather than silently succeeding.
- [ ] **Step 7: Commit** — `git commit -m "feat: contact page"`

---

### Task 7: Cross-page QA

**Files:** Modify any of the above as defects surface. Create `README.md`.

- [ ] **Step 1:** Load each of the 4 pages in a real browser. Record console errors — expect zero.
- [ ] **Step 2:** Check the Network panel on each page for any non-200 image. Replace any failure from the spec §7 bench.
- [ ] **Step 3:** Click every nav link, footer link, and CTA on all 4 pages. Confirm no dead `href="#"` that should go somewhere.
- [ ] **Step 4:** Test at 1440px, 1024px, 768px, 375px. Confirm zero horizontal overflow and that all pinning is off below 900px.
- [ ] **Step 5:** Force `prefers-reduced-motion: reduce` and reload each page. Confirm all content is visible and static.
- [ ] **Step 6:** Write `README.md` — what the site is, how to open it, file map, image credits, how to swap the palette.
- [ ] **Step 7: Commit** — `git commit -m "chore: QA fixes and README"`

---

## Self-Review

**Spec coverage:** §1 brand → Task 1 (nav/footer) + Task 3. §2 color → Task 1. §3 type → Task 1. §4 pages → Tasks 3–6, one each. §5 navbar → Tasks 1–2. §6 animation → Task 2. §7 images → referenced per-section in Tasks 3–6, audited in Task 7 Step 2. §8 content → Tasks 3–6. §9 structure → all tasks. §10 criteria → Task 7. No gaps.

**Placeholder scan:** No TBD/TODO. "Handle edge cases" does not appear — validation in Task 6 Step 4 is specified concretely (preventDefault, validate required, swap panel).

**Type consistency:** `.is-stuck` / `.is-hidden` / `.is-open` used identically in Tasks 1 and 2. `splitLines` produces `.line__i`, which Task 2 Step 3's CSS and Step 6's handler both target. `--x` is the single custom property driving the before/after clip in Task 5.

**Known deviation from the skill's default:** this is a static site with no test runner, so the red-green-refactor cycle is replaced by explicit browser-verification steps. Each task still ends with an independently observable deliverable and a commit.

**Note:** the working directory is not currently a git repository. Either `git init` first, or treat the `git commit` steps as checkpoints rather than literal commands.
