# Sable &amp; Chrome — Auto Atelier

A four-page portfolio site for a fictional auto-services shop covering paint correction and detailing, mechanical repair, ceramic window tint, and mobile dispatch.

## Opening it

Double-click **`index.html`**. That's it — there is no build step, no `npm install`, and no server required.

GSAP, ScrollTrigger, Lenis and the Google Fonts load from CDNs, so the first load needs an internet connection. Without one the site still works: it falls back to a fully static, fully visible page.

## Deploying

Drag the whole folder onto [Netlify Drop](https://app.netlify.com/drop), or push it to a GitHub repo and turn on Pages. No configuration needed.

## Files

```
index.html        Home
services.html     The four services
work.html         Work orders + before/after slider
contact.html      Booking form + mobile dispatch
css/style.css     All styles, tokens at the top
js/main.js        Scroll animation engine + UI behaviour
docs/superpowers/ Design spec and implementation plan
```

## Colour

No pure white appears anywhere — `--bone` is the lightest value on the site. Sections alternate between the dark and light surfaces down every page.

| Token | Value | Used for |
|---|---|---|
| `--ink` | `#0F0F11` | dark section backgrounds |
| `--graphite` | `#17181B` | cards sitting on ink |
| `--bone` | `#EDE7DD` | light section backgrounds |
| `--sand` | `#DCD3C5` | cards sitting on bone |
| `--copper` | `#C2703D` | accent, CTAs, data labels |

To re-skin the site, change these five values in the `:root` block at the top of `css/style.css`. Everything else is derived from them.

## Type

- **Instrument Serif** — oversized display
- **Inter** — body and interface
- **JetBrains Mono** — job numbers and spec figures

## Animation

`js/main.js` reads attributes off the markup, so you add motion in HTML rather than writing JavaScript:

| Attribute | Effect |
|---|---|
| `data-reveal` | fades and rises into view (`data-delay="0.2"` to offset) |
| `data-stagger` | staggers any `data-reveal` children |
| `data-mask` | splits text into lines and wipes each one up |
| `data-parallax="0.3"` | scroll-linked vertical drift |
| `data-scale` | image settles from 1.16 to 1 as it centres |
| `data-magnetic` | element leans toward the cursor |
| `data-count` | counts up to the attribute's value |

Add `data-hero` alongside `data-mask` to hold a headline back until the page-load curtain lifts.

### Graceful degradation

- **`prefers-reduced-motion: reduce`** — smooth scroll, every ScrollTrigger and the curtain are all skipped, and content renders at its final state.
- **CDN unreachable / JS disabled** — same fallback, everything visible and static.
- **Background tabs** — `requestAnimationFrame` is suspended there, so a 4.5s failsafe lifts the loading curtain regardless.
- **Below 900px** — the pinned project stack unpins and the layout becomes a normal single-column scroll.

## Accessibility

Every image has a real `alt`. The before/after slider is a proper `role="slider"`: focus it and use arrow keys, or Home/End. Focus outlines are visible throughout. The contact form pairs every field with a `<label>` and validates in-place.

## Notes

- The contact form is **not wired to a backend**. Submitting it validates the fields and swaps in a confirmation panel; nothing is transmitted.
- Business details (address, phone, prices, job numbers) are fictional. The phone number uses the reserved `555` range.
- Photography is from [Unsplash](https://unsplash.com) and hotlinked from their CDN. Every URL was verified before use. For production, download the images and serve them locally.
