# SABLE & CHROME — Design Spec

**Date:** 2026-09-11
**Type:** Static 4-page luxury portfolio site for an auto-services business
**Status:** Approved by user

---

## 1. Brand

- **Name:** SABLE & CHROME — *Auto Atelier*
- **Rationale:** "Sable" is the dark tone, "Chrome" the light one; the name encodes the palette.
- **Tagline:** Detail. Repair. Tint. Dispatched.
- **Logo:** inline SVG monogram — `S` and `C` sharing a diagonal shear inside a hairline square bracket. Inline so strokes can draw on load and the mark can shrink into the collapsed navbar.
- **Voice:** quiet luxury. Short declarative sentences. Spec-sheet cadence. No exclamation marks.

**Fictional business details** (clearly demo, safe ranges):
- Bay 14 — Ironside Works, Portland, OR 97209
- (503) 555-0147 · studio@sableandchrome.com
- Tue–Sat, 08:00–18:00

---

## 2. Color

No pure white anywhere. Bone is the lightest value on the site.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#0F0F11` | dark section background |
| `--graphite` | `#17181B` | cards/panels on ink |
| `--graphite-2` | `#1F2125` | hover state, borders on ink |
| `--bone` | `#EDE7DD` | light section background |
| `--sand` | `#DCD3C5` | cards/panels on bone |
| `--copper` | `#C2703D` | accent, CTA, index numerals, marquee |
| `--copper-soft` | `#D08A5C` | hover accent |

Text: `--ink-text: #141417` on bone; `--bone-text: #EDE7DD` on ink; muted variants at 62% opacity.

Sections alternate **Ink → Bone → Ink** down every page. Each transition coincides with an animation trigger so the color flip and motion reinforce each other.

---

## 3. Typography

- **Instrument Serif** (400, 400italic) — oversized editorial display. Hero `clamp(3.4rem, 12.5vw, 14rem)`, line-height 0.86, tracking -0.02em. Italic for one emphasis word per headline.
- **Inter** (300/400/500) — body, nav, buttons. Micro-labels: 0.7rem, uppercase, 0.22em tracking.
- **JetBrains Mono** (400) — `01 / 02 / 03` index numerals and spec-sheet data.

Loaded from Google Fonts with `preconnect`.

---

## 4. Pages & Layout Assignments

Each layout pattern has **one primary home** so nothing repeats.

### `index.html` — Home
1. **Hero** — Oversized Typography + Parallax (3 depth layers) + Mask Reveal on headline lines
2. **Marquee** — copper strip, scroll-velocity-linked speed
3. **The Atelier** — Editorial Split; sticky text column, parallax image column
4. **Services** — Bento Grid, 4 asymmetric cells; hover = Image Zoom + Overlay Reveal + Card Lift
5. **The Process** — Sticky Story Layout; pinned heading, steps 01–04 advance against it, Scale on imagery
6. **Selected Work** — Project Stack; 3 cards stack + scale inside a pinned section
7. **Numbers** — count-up on reveal
8. **Testimonial** — oversized quote, Mask Reveal
9. **CTA band** — Arrow Slide + Fill Sweep

### `services.html`
Sticky left index of the 4 services against long-scroll detail panels. Alternating Ink/Bone. Overlapping Layers (image overhangs section edge) + Scale. Add-ons grid closes it out.

### `work.html`
Full Project Stack of 6 pinned case cards → editorial grid → **draggable before/after comparison slider** (the one genuinely novel moment). The "before" layer is the same image under a CSS dulling filter, so geometry aligns perfectly.

### `contact.html`
Editorial Split — sticky contact block on Ink, form on Bone with floating labels and copper service chips. Mobile-dispatch callout + coverage grid.

---

## 5. Navbar

- Transparent over hero with full wordmark.
- Past ~80px: collapses into a floating pill — backdrop blur, hairline border, wordmark hidden, monogram only, reduced height.
- Hides on scroll-down, returns immediately on scroll-up.
- Links: Underline Slide. CTA: Fill Sweep + Magnetic Hover.
- Mobile: full-screen Ink overlay, staggered link reveal.

---

## 6. Animation System

Single declarative pass in `js/main.js`:

| Attribute | Effect |
|---|---|
| `data-reveal` | y-offset + fade in, optional `data-delay` |
| `data-stagger` | staggers direct children |
| `data-mask` | line-split, each line wiped up from `translateY(110%)` |
| `data-parallax="0.3"` | y-translate proportional to scroll |
| `data-scale` | image scales 1.18 → 1 across viewport |
| `data-magnetic` | element follows cursor within radius |
| `data-count` | numeric count-up |

- **Libraries:** GSAP + ScrollTrigger + Lenis, all via CDN.
- **Line splitter:** custom (GSAP SplitText is paid). Splits by wrapping words, measuring `offsetTop` to group into lines, re-wrapping each line in an `overflow:hidden` mask. Re-runs on resize.
- **Preloader:** ~1.1s Ink curtain with a counter, then panel wipes up.
- **Reduced motion:** `prefers-reduced-motion` disables Lenis, all ScrollTriggers, and reveals everything at final state.
- **Mobile:** all pinning disabled below 900px; sections flow normally.

---

## 7. Verified Image Map

All URLs confirmed HTTP 200 and visually inspected. Base: `https://images.unsplash.com/<id>?auto=format&fit=crop&w=<w>&q=80`

**Hero / atmosphere (dark)**
- `photo-1503376780353-7e6692767b70` — black Porsche rear 3/4, motion blur → hero primary
- `photo-1626668893632-6f3a4466d22f` — Challenger, dark warehouse, cinematic teal/red → hero layer, before/after
- `photo-1492144534655-ae79c964c9d7` — silver Camaro in dark garage with lifts → The Atelier

**Detailing / paint**
- `photo-1708805282695-ef186db20192` — detailer machine-polishing black panel
- `photo-1620584898989-d39f7f9ed1b7` — red rotary polisher above glossy black panel
- `photo-1632823471808-08b572e7381c` — technician polishing dark paint, yellow pad
- `photo-1607860108855-64acf2078ed9` — foam-washing black sports car
- `photo-1520340356584-f9917d1eea6f` — pressure washer on black car
- `photo-1554744512-d6c603f27c54` — red Tesla fender/headlight reflecting ceiling

**Mechanical**
- `photo-1615906655593-ad0386982a0f` — mechanic in dark overalls in engine bay
- `photo-1625047509168-a7026f36de04` — mechanic over engine bay
- `photo-1619642751034-765dfdf7c58e` — wrench on engine, low-key
- `photo-1599256872237-5dcc0fbe9668` — hands in engine compartment
- `photo-1486262715619-67b85e0b08d3` — engine belt and pulleys

**Glass & tint**
- `photo-1602970890693-e576d76a900f` — dark tinted windshield close crop
- `photo-1663384609181-c585d45de9a8` — cabin view out through tinted door glass
- `photo-1686218661637-dd10ecd3666d` — sedan rear door, dark tint
- `photo-1690022676526-2762ac826843` — quarter glass reflecting palms at dusk

**Mobile dispatch**
- `photo-1763377278900-0ce8242c5005` — mobile tire-service van at night, doors open
- `photo-1759477444242-46d92681a8e1` — spare tire and tool kit in trunk
- `photo-1632733711679-529326f6db12` — hands at engine fuse box with tools

**Wheels & brakes**
- `photo-1611838608826-4c32a6160d90` — Aston Martin wheel, yellow six-piston caliper
- `photo-1661333587569-3889badd01a7` — AMG wheel, turquoise caliper
- `photo-1611838609490-70113198661a` — red alloy, yellow caliper

**Interiors**
- `photo-1605437241278-c1806d14a4d9` — Mercedes diamond-quilted black leather
- `photo-1502014335594-c026800f24ee` — Aston Martin dash, brown leather
- `photo-1608259243654-70c070e0f6ed` — detailer cleaning bucket seats
- `photo-1449965408869-eaa3f722e40d` — hand on wheel, dusk bokeh

**Work gallery**
- `photo-1588258219511-64eb629cb833` (classic 911) · `photo-1544829099-b9a0c07fad1a` (Huracán) · `photo-1580273916550-e323be2ae537` (BMW M4) · `photo-1493238792000-8113da705763` (R8 taillight) · `photo-1553440569-bcc63803a83d` (AMG GT) · `photo-1503736334956-4c8f8e92946d` (Ferrari 458) · `photo-1583121274602-3e2820c69888` (LaFerrari, light) · `photo-1597007066704-67bf2068d5b2` (Audi A4)

> **Correction (found during build):** `photo-1622185135505-2d795003994a` is a **motorcycle**, not a 911 — an off-by-one against the catalogue. The 911 is `photo-1588258219511-64eb629cb833`. Also `photo-1542362567-b07e54358753` (McLaren) crops to show only the houses behind the car in a 3:2 frame, so it is not used.

**Portraits (testimonials)**
- `photo-1507003211169-0a1dd7228f2d` · `photo-1500648767791-00dcc994a43e` · `photo-1472099645785-5658abf4ff4e`

**Rejected during review** (404 or irrelevant): `photo-1632823471565-1ecdf5d1f1b0`, `photo-1613214149922-f1809c9b9d0e`, `photo-1621905251189-08b45d6a269e` (construction worker), `photo-1530046339160-ce3e530c7d2f` (shock racks), `photo-1581091226825-a6a2a5aee158` (lab), `photo-1580983218765-f663bec07b37` (factory), `photo-1609081219090-a6d81d3085bf` (headphones), `photo-1588258219511-64eb629cb833` (motorcycle).

---

## 8. Content

**Services**
- `01 PAINT & DETAIL` — multi-stage correction, ceramic coating, interior restoration
- `02 MECHANICAL` — diagnostics, servicing, brakes, suspension, performance
- `03 GLASS & TINT` — ceramic film, UV/IR rejection, precision-cut
- `04 MOBILE DISPATCH` — the workshop comes to you

**Process:** 01 Intake & Assessment → 02 Specification → 03 Execution → 04 Handover

**Numbers:** 1,240 vehicles delivered · 14 years · 38-point inspection · 48h average turnaround

**Work (6):** Porsche 911 Turbo S (correction + ceramic) · McLaren 720S (front PPF) · Mercedes-AMG GT (interior restoration) · Audi R8 (ceramic tint, 5-window) · BMW M4 Competition (suspension + brakes) · Ferrari 458 Italia (concours prep)

---

## 9. File Structure

```
index.html
services.html
work.html
contact.html
css/style.css
js/main.js
README.md
```

No build step. Opens by double-clicking `index.html`.

---

## 10. Liquid interaction layer (added 2026-11-24)

Five additions, all riding the existing token/motion system. One hidden SVG defs block (`#goo`, `#threshold`, `#ripple`) is injected by `main.js` on every page.

| Feature | Where | How |
|---|---|---|
| Hero word morph | `index.html` h1, `[data-morph]` | Emphasis word cycles *returned → corrected → serviced → tinted*: two stacked spans cross-fade blur/opacity under `#threshold` (alpha-crunch = liquid melt); container width eases between words. Headline intro switched from `data-mask` to `data-melt` (blur melt-in from the preloader). |
| Testimonial spotlight carousel | `index.html`, `[data-tstack]` / `[data-spot]` | Three quotes cross-fade in one grid cell, arrows + `01 / 03` mono counter (`data-tprev`/`data-tnext`/`data-tcount`). Each quote dimmed + blurred with a cloned full-strength layer masked to a radial light that lerps after the cursor (`--sx/--sy`). Touch and reduced-motion get plain quotes. |
| Hero video card | `index.html`, `.hero__card` | The overlapping 3:4 hero card is an autoplaying muted loop (Mixkit 47831, technician shining paint) with the original Unsplash shot as poster. Reduced motion pauses it to the poster frame. |
| Pricing slider | `index.html`, `[data-pricing]` | Range input 1–4 "bays"; services accumulate in fixed order with 0/5/10/15% combined-booking adjustment, totals rounded to $5. GSAP count tween on the serif total. |
| FAQ flip cards | `index.html`, `.fcard` | Six cards, `rotateY` flip on a real `<button>` with `aria-expanded`. Sand front / ink back. |
| Footer liquid wordmark | all pages, injected `.foot__liquid` | Ghosted wordmark at 14% bone, distorted by `feTurbulence` + `feDisplacementMap`. Always rippling on two slow sine waves while the footer is in view (IntersectionObserver-gated rAF); cursor speed pours in extra energy that decays back to ambient. |
| Gooey CTAs | all pages, `.btn--fill` / `.btn--solid` | `main.js` injects a `.btn__goo` layer (bar + 4 droplets) under `filter:url(#goo)`; on hover the droplets rise and merge into the fill, separating on leave. The old `::before` sweep remains as the no-JS fallback. |

Landing-page section order is now: Hero → Marquee → Atelier (bone) → Services (ink) → Process (bone) → Work (ink) → Figures (ink) → Testimonial (bone) → **Pricing (ink)** → **FAQ (bone)** → CTA → Footer.

---

## 11. Success Criteria

1. Four pages, consistent nav/footer, all internal links resolve.
2. Every image loads (all URLs pre-verified).
3. Every named animation and interaction from the brief present, each in a deliberate location.
4. No pure white; ink/bone alternation visible on every page.
5. Works with no server, no npm, offline-tolerant except CDN assets.
6. Responsive to 360px; reduced-motion respected.
