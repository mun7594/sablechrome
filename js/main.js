/* ==========================================================================
   SABLE & CHROME — motion engine
   Declarative attribute API:
     data-reveal        rise + fade on enter        (optional data-delay="0.2")
     data-stagger       staggers [data-reveal] descendants
     data-mask          line-split wipe             (add data-hero to defer to preloader)
     data-parallax="n"  scroll-linked y translate
     data-scale         image settles 1.16 -> 1 as it centres
     data-magnetic      cursor attraction
     data-count         numeric count-up
   Everything degrades to fully-visible static content if GSAP is unavailable
   or the visitor prefers reduced motion.
   ========================================================================== */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var MOTION = hasGSAP && !REDUCED;
  var DESKTOP = function () { return window.innerWidth >= 900; };

  var lenis = null;
  var heroLines = [];

  /* ---------------------------------------------------------------- utils */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  /* Fallback: make every animated element visible and static. */
  function showEverything() {
    $$('[data-reveal]').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    $$('[data-mask]').forEach(function (el) { el.style.visibility = 'visible'; });
    $$('[data-melt]').forEach(function (el) { el.style.opacity = '1'; });
    $$('.hero__card, .hero__cue').forEach(function (el) { el.style.opacity = '1'; });
    $$('[data-count]').forEach(function (el) {
      el.textContent = el.getAttribute('data-count');
    });
    var pre = $('.preload');
    if (pre) pre.parentNode.removeChild(pre);
    document.documentElement.classList.remove('is-loading');
  }

  /* --------------------------------------------------------- line splitter */
  /* Wraps each visual line in an overflow:hidden mask so it can wipe up.
     GSAP's SplitText is a paid plugin, so this does the same job by
     measuring offsetTop to work out where the browser broke each line. */
  function splitLines(el) {
    if (!el.dataset.original) el.dataset.original = el.textContent.trim();
    var words = el.dataset.original.split(/\s+/);

    el.innerHTML = words.map(function (w) {
      return '<span class="w" style="display:inline-block">' + w + '</span>';
    }).join(' ');

    var spans = $$('.w', el);
    var lines = [], top = null, cur = null;
    spans.forEach(function (s) {
      if (s.offsetTop !== top) { top = s.offsetTop; cur = []; lines.push(cur); }
      cur.push(s.textContent);
    });

    el.innerHTML = lines.map(function (l) {
      return '<span class="line"><span class="line__i">' + l.join(' ') + '</span></span>';
    }).join('');

    return $$('.line__i', el);
  }

  /* ------------------------------------------------------------------ nav */

  function initNav() {
    var nav = $('#nav');
    var menu = $('#navmenu');
    var burger = $('#burger');
    if (!nav) return;

    var last = window.scrollY;

    function onScroll() {
      var y = window.scrollY;
      nav.classList.toggle('is-stuck', y > 80);
      if (y > 400 && y > last + 4) nav.classList.add('is-hidden');
      else if (y < last - 4) nav.classList.remove('is-hidden');
      last = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = menu.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.documentElement.style.overflow = open ? 'hidden' : '';
        if (lenis) { open ? lenis.stop() : lenis.start(); }
      });
      $$('a', menu).forEach(function (a) {
        a.addEventListener('click', function () {
          menu.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          burger.setAttribute('aria-label', 'Open menu');
          document.documentElement.style.overflow = '';
          if (lenis) lenis.start();
        });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) burger.click();
      });
    }
  }

  /* ----------------------------------------------------- before / after UI */
  /* The "before" layer is the same photograph under a dulling CSS filter,
     so both halves align exactly and the wipe reads as one continuous image. */
  function initBeforeAfter() {
    $$('.ba').forEach(function (ba) {
      var handle = $('.ba__handle', ba);
      if (!handle) return;
      var dragging = false;

      function setX(pct) {
        pct = Math.max(0, Math.min(100, pct));
        ba.style.setProperty('--x', pct + '%');
        handle.setAttribute('aria-valuenow', Math.round(pct));
      }

      function fromEvent(e) {
        var rect = ba.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        setX(((clientX - rect.left) / rect.width) * 100);
      }

      function start(e) { dragging = true; fromEvent(e); }
      function move(e) { if (dragging) { fromEvent(e); if (e.cancelable && e.touches) e.preventDefault(); } }
      function end() { dragging = false; }

      ba.addEventListener('mousedown', start);
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);
      ba.addEventListener('touchstart', start, { passive: true });
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', end);

      handle.addEventListener('keydown', function (e) {
        var now = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
        var step = e.shiftKey ? 10 : 2;
        if (e.key === 'ArrowLeft') { setX(now - step); e.preventDefault(); }
        if (e.key === 'ArrowRight') { setX(now + step); e.preventDefault(); }
        if (e.key === 'Home') { setX(0); e.preventDefault(); }
        if (e.key === 'End') { setX(100); e.preventDefault(); }
      });

      setX(50);
    });
  }

  /* ----------------------------------------------------------------- form */

  function initForm() {
    var form = $('#enquiry');
    if (!form) return;
    var sent = $('#sent');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;

      $$('[data-required]', form).forEach(function (input) {
        var field = input.closest('.field');
        var err = $('.field__err', field);
        var value = input.value.trim();
        var message = '';

        if (!value) {
          message = 'This field is required.';
        } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          message = 'Enter a valid email address.';
        }

        field.classList.toggle('is-invalid', !!message);
        if (err) err.textContent = message;
        if (message) ok = false;
      });

      if (!ok) {
        var firstBad = $('.field.is-invalid input, .field.is-invalid textarea', form);
        if (firstBad) firstBad.focus();
        return;
      }

      form.hidden = true;
      if (sent) {
        sent.hidden = false;
        sent.setAttribute('tabindex', '-1');
        sent.focus();
      }
    });

    /* Clear the error as soon as the visitor starts fixing it. */
    $$('[data-required]', form).forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field.classList.contains('is-invalid')) {
          field.classList.remove('is-invalid');
          var err = $('.field__err', field);
          if (err) err.textContent = '';
        }
      });
    });
  }

  /* ------------------------------------------------- shared liquid filters */
  /* One hidden SVG feeds every liquid effect: #goo (CTAs), #threshold
     (hero word morph) and #ripple (footer wordmark). Injected once so no
     page needs the markup by hand. */
  function initFilters() {
    if ($('#sc-defs')) return;
    var host = document.createElement('div');
    host.id = 'sc-defs';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    host.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg"><defs>' +
        '<filter id="goo">' +
          '<feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/>' +
          '<feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="g"/>' +
          '<feComposite in="SourceGraphic" in2="g" operator="atop"/>' +
        '</filter>' +
        '<filter id="threshold">' +
          '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"/>' +
        '</filter>' +
        '<filter id="ripple" x="-20%" y="-20%" width="140%" height="140%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.002 0.008" numOctaves="2" seed="3"/>' +
          '<feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G"/>' +
        '</filter>' +
      '</defs></svg>';
    document.body.appendChild(host);
  }

  /* ------------------------------------------------------------ gooey CTAs */
  /* Every primary button gets a liquid fill: droplets rise from the base,
     merge under #goo into one surface, and separate again on leave. The
     old ::before sweep stays in the CSS as the no-JS fallback. */
  function initGoo() {
    $$('.btn--fill, .btn--solid').forEach(function (btn) {
      if ($('.btn__goo', btn)) return;
      var goo = document.createElement('span');
      goo.className = 'btn__goo';
      goo.setAttribute('aria-hidden', 'true');
      goo.innerHTML = '<b></b><i></i><i></i><i></i><i></i>';
      btn.insertBefore(goo, btn.firstChild);
      btn.classList.add('btn--goo');
    });
  }

  /* -------------------------------------------------------- hero word morph */
  /* The emphasis word melts between disciplines: two stacked copies swap
     blur and opacity under #threshold, which snaps the soft alpha into a
     liquid edge. The container width eases so the sentence reflows with it. */
  function initMorph() {
    if (REDUCED) return;
    var el = $('[data-morph]');
    if (!el) return;
    var words = el.getAttribute('data-morph').split(',');
    var spans = $$('.morph__w', el);
    if (spans.length < 2 || words.length < 2) return;

    var a = spans[0], b = spans[1];
    var MORPH_S = 1.0, COOLDOWN_S = 2.6;
    var idx = 0, morphT = 0, cooldown = COOLDOWN_S, last = null;

    function lockWidth(span) { el.style.width = span.offsetWidth + 'px'; }
    a.textContent = words[0];
    b.textContent = words[1 % words.length];
    requestAnimationFrame(function () { lockWidth(a); });

    function blend(f) {
      b.style.filter = 'blur(' + Math.min(8 / Math.max(f, 0.0001) - 8, 60) + 'px)';
      b.style.opacity = Math.pow(f, 0.4);
      var inv = 1 - f;
      a.style.filter = 'blur(' + Math.min(8 / Math.max(inv, 0.0001) - 8, 60) + 'px)';
      a.style.opacity = Math.pow(inv, 0.4);
    }

    function frame(now) {
      if (last === null) last = now;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (cooldown > 0) {
        cooldown -= dt;
        if (cooldown <= 0) {
          b.textContent = words[(idx + 1) % words.length];
          lockWidth(b);
          morphT = 0;
        }
      } else {
        morphT += dt;
        var f = morphT / MORPH_S;
        if (f >= 1) {
          idx = (idx + 1) % words.length;
          a.textContent = words[idx];
          a.style.filter = 'none'; a.style.opacity = '1';
          b.style.filter = 'none'; b.style.opacity = '0';
          cooldown = COOLDOWN_S;
        } else {
          blend(f);
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    window.addEventListener('resize', debounce(function () {
      el.style.width = 'auto';
      requestAnimationFrame(function () { lockWidth(a); });
    }, 200));
  }

  /* -------------------------------------------------- testimonial spotlight */
  /* The quote sits dimmed and blurred; a full-strength clone is masked to a
     radial pool of light that trails the cursor. Touch and reduced-motion
     visitors simply get the plain, fully readable quote. */
  function initSpotlight() {
    if (REDUCED || window.matchMedia('(hover: none)').matches) return;
    $$('[data-spot]').forEach(function (spot) {
      var text = $('.spot__text', spot);
      if (!text) return;

      var lit = text.cloneNode(true);
      lit.classList.remove('spot__text');
      lit.classList.add('spot__lit');
      lit.setAttribute('aria-hidden', 'true');
      spot.appendChild(lit);
      spot.classList.add('spot--on');

      var cue = document.createElement('p');
      cue.className = 'spot__cue mono';
      cue.setAttribute('aria-hidden', 'true');
      cue.textContent = 'Move the light across the quote';
      spot.parentNode.appendChild(cue);

      var tx = 50, ty = 50, cx = 50, cy = 50, raf = null;
      function loop() {
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        spot.style.setProperty('--sx', cx.toFixed(2) + '%');
        spot.style.setProperty('--sy', cy.toFixed(2) + '%');
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(loop);
        else raf = null;
      }
      spot.addEventListener('pointermove', function (e) {
        var r = spot.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width) * 100;
        ty = ((e.clientY - r.top) / r.height) * 100;
        if (raf === null) raf = requestAnimationFrame(loop);
      });
    });
  }

  /* --------------------------------------------------------- FAQ flip cards */
  function initFlip() {
    $$('.fcard__inner').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var flipped = btn.classList.toggle('is-flipped');
        btn.setAttribute('aria-expanded', flipped ? 'true' : 'false');
      });
    });
  }

  /* --------------------------------------------------------- pricing slider */
  function initPricing() {
    $$('[data-pricing]').forEach(function (root) {
      var slider = $('.pricing__slider', root);
      var rows = $$('.pricing__rows li', root);
      var totalEl = $('[data-pricing-total]', root);
      var countEl = $('[data-pricing-count]', root);
      var baysEl = $('[data-pricing-bays]', root);
      var saveEl = $('[data-pricing-save]', root);
      if (!slider || !rows.length || !totalEl) return;

      var DISCOUNT = [0, 0.05, 0.10, 0.15];
      var max = parseInt(slider.max, 10) || rows.length;
      var shown = { v: 0 };

      function estimate(n) {
        var sum = 0;
        rows.slice(0, n).forEach(function (li) {
          sum += parseFloat(li.getAttribute('data-price')) || 0;
        });
        /* rounded to a five so the adjusted figure reads like a rate card */
        return Math.round((sum * (1 - DISCOUNT[n - 1])) / 5) * 5;
      }

      function render(v) {
        totalEl.textContent = '$' + Math.round(v).toLocaleString('en-US');
      }

      function update() {
        var n = Math.min(max, Math.max(1, parseInt(slider.value, 10) || 1));
        rows.forEach(function (li, i) { li.classList.toggle('is-on', i < n); });
        if (countEl) countEl.textContent = n;
        if (baysEl) baysEl.textContent = n === 1 ? 'bay booked' : 'bays booked';
        if (saveEl) {
          saveEl.textContent = n > 1
            ? Math.round(DISCOUNT[n - 1] * 100) + '% combined-booking adjustment'
            : 'Single-bay rate, no adjustment';
        }
        slider.style.setProperty('--fill', (((n - 1) / (max - 1)) * 100) + '%');

        var target = estimate(n);
        if (MOTION) {
          window.gsap.to(shown, {
            v: target, duration: 0.7, ease: 'power3.out', overwrite: true,
            onUpdate: function () { render(shown.v); }
          });
        } else {
          shown.v = target;
          render(target);
        }
      }

      shown.v = estimate(parseInt(slider.value, 10) || 1);
      render(shown.v);
      slider.addEventListener('input', update);
      update();
    });
  }

  /* ---------------------------------------------------- footer liquid field */
  /* A ghosted wordmark behind the footer, always gently rippling while on
     screen. Two slow sine waves keep the water moving on its own; cursor
     speed pours extra energy in, which decays back to the ambient level.
     The loop only runs while the footer is in the viewport. */
  function initFooterLiquid() {
    if (REDUCED) return;
    var foot = $('.foot');
    if (!foot) return;

    var el = document.createElement('div');
    el.className = 'foot__liquid';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span>Sable &amp; Chrome</span>';
    foot.insertBefore(el, foot.firstChild);

    var disp = null, turb = null;
    function nodes() {
      if (!disp) {
        var f = document.getElementById('ripple');
        if (f) {
          turb = f.querySelector('feTurbulence');
          disp = f.querySelector('feDisplacementMap');
        }
      }
      return !!(disp && turb);
    }

    var boost = 0, t = 0, raf = null, inView = false;
    function loop() {
      t += 0.016;
      boost *= 0.96;
      if (nodes()) {
        var scale = 18 + Math.sin(t * 0.7) * 9 + Math.sin(t * 0.23) * 6 + boost;
        disp.setAttribute('scale', scale.toFixed(2));
        var bf = 0.002 + Math.sin(t * 0.4) * 0.0005;
        turb.setAttribute('baseFrequency', bf.toFixed(5) + ' ' + (bf * 4).toFixed(5));
      }
      if (inView) raf = requestAnimationFrame(loop);
      else raf = null;
    }
    function wake() { if (raf === null && inView) raf = requestAnimationFrame(loop); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        wake();
      }).observe(foot);
    } else {
      inView = true;
      wake();
    }

    var lastX = null, lastY = null;
    foot.addEventListener('pointermove', function (e) {
      if (lastX !== null) {
        var speed = Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
        boost = Math.min(80, boost + speed * 0.7);
      }
      lastX = e.clientX; lastY = e.clientY;
    });
    foot.addEventListener('pointerleave', function () { lastX = lastY = null; });
  }

  /* ------------------------------------------------- testimonial carousel */
  function initTestimonials() {
    $$('[data-tstack]').forEach(function (stack) {
      var scope = stack.parentElement;
      var slides = $$('.tslide', stack);
      if (slides.length < 2) return;
      var prev = $('[data-tprev]', scope);
      var next = $('[data-tnext]', scope);
      var count = $('[data-tcount]', scope);
      var i = 0;

      function pad(n) { return String(n).padStart(2, '0'); }
      function go(n) {
        i = (n + slides.length) % slides.length;
        slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
        if (count) count.textContent = pad(i + 1) + ' / ' + pad(slides.length);
      }

      if (prev) prev.addEventListener('click', function () { go(i - 1); });
      if (next) next.addEventListener('click', function () { go(i + 1); });
      go(0);
    });
  }

  /* -------------------------------------------------------- ambient video */
  /* Reduced-motion visitors get the poster frame instead of a moving loop. */
  function initVideos() {
    if (!REDUCED) return;
    $$('video[autoplay]').forEach(function (v) {
      v.removeAttribute('autoplay');
      v.pause();
    });
  }

  /* ------------------------------------------------------- motion: scroll */

  function initSmoothScroll() {
    if (typeof window.Lenis === 'undefined') return;
    lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      smoothTouch: false
    });
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    window.gsap.ticker.lagSmoothing(0);
  }

  function initAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      a.addEventListener('click', function (e) {
        var target = document.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -90 });
        else target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function initReveals() {
    var gsap = window.gsap;
    var claimed = [];

    $$('[data-stagger]').forEach(function (group) {
      var kids = $$('[data-reveal]', group);
      if (!kids.length) return;
      kids.forEach(function (k) { claimed.push(k); });
      gsap.fromTo(kids,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: group, start: 'top 85%', once: true }
        });
    });

    $$('[data-reveal]').forEach(function (el) {
      if (claimed.indexOf(el) !== -1) return;
      gsap.fromTo(el,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          delay: parseFloat(el.getAttribute('data-delay')) || 0,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
    });
  }

  function initMasks() {
    var gsap = window.gsap;
    heroLines = [];

    $$('[data-mask]').forEach(function (el) {
      el.style.visibility = 'visible';
      var lines = splitLines(el);
      gsap.set(lines, { yPercent: 110 });

      if (el.hasAttribute('data-hero')) {
        heroLines = heroLines.concat(lines);
        return;
      }

      gsap.to(lines, {
        yPercent: 0, duration: 1.15, ease: 'power4.out', stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        onStart: function () { el.classList.add('is-revealed'); }
      });
    });
  }

  function initParallax() {
    var gsap = window.gsap;
    $$('[data-parallax]').forEach(function (el) {
      var amt = parseFloat(el.getAttribute('data-parallax')) || 0.2;
      gsap.fromTo(el,
        { yPercent: -amt * 42 },
        {
          yPercent: amt * 42, ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true
          }
        });
    });
  }

  function initScale() {
    var gsap = window.gsap;
    $$('[data-scale]').forEach(function (el) {
      gsap.fromTo(el,
        { scale: 1.16 },
        {
          scale: 1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'center center', scrub: true }
        });
    });
  }

  function initMagnetic() {
    if (window.matchMedia('(hover: none)').matches) return;
    var gsap = window.gsap;
    $$('[data-magnetic]').forEach(function (el) {
      var strength = parseFloat(el.getAttribute('data-magnetic')) || 0.3;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * strength;
        var y = (e.clientY - r.top - r.height / 2) * strength;
        gsap.to(el, {
          x: Math.max(-14, Math.min(14, x)),
          y: Math.max(-10, Math.min(10, y)),
          duration: 0.5, ease: 'power3.out'
        });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  function initCount() {
    var gsap = window.gsap;
    $$('[data-count]').forEach(function (el) {
      var raw = el.getAttribute('data-count');
      var target = parseFloat(raw.replace(/[^0-9.]/g, ''));
      var suffix = raw.replace(/[0-9.,]/g, '');
      if (isNaN(target)) return;
      var obj = { v: 0 };
      el.textContent = '0' + suffix;
      window.ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: target, duration: 1.9, ease: 'power3.out',
            onUpdate: function () {
              el.textContent = Math.round(obj.v).toLocaleString('en-US') + suffix;
            }
          });
        }
      });
    });
  }

  /* Project stack — cards pin and settle behind one another. */
  function initStack() {
    var gsap = window.gsap;
    $$('.stack').forEach(function (stack) {
      var cards = $$('.stackcard', stack);
      if (cards.length < 2 || !DESKTOP()) return;

      cards.forEach(function (card, i) {
        card.style.position = 'sticky';
        card.style.top = (11 + i * 1.6) + 'vh';
        gsap.set(card, { transformOrigin: 'center top' });

        if (i < cards.length - 1) {
          gsap.to(card, {
            scale: 0.93, opacity: 0.45, ease: 'none',
            scrollTrigger: {
              trigger: cards[i + 1], start: 'top bottom', end: 'top top', scrub: true
            }
          });
        }
      });
    });
  }

  /* Copper marquee — speed and direction respond to scrolling. */
  function initMarquee() {
    var gsap = window.gsap;
    $$('.marquee').forEach(function (bar) {
      var track = $('.marquee__track', bar);
      if (!track) return;

      var tween = gsap.to(track, {
        xPercent: -50, duration: 26, ease: 'none', repeat: -1
      });

      var lastY = window.scrollY;
      window.addEventListener('scroll', function () {
        var y = window.scrollY;
        var dir = y > lastY ? 1 : -1;
        var boost = Math.min(5, 1 + Math.abs(y - lastY) * 0.08);
        tween.timeScale(dir * boost);
        lastY = y;
        clearTimeout(bar._t);
        bar._t = setTimeout(function () { tween.timeScale(dir); }, 180);
      }, { passive: true });
    });
  }

  /* The process progress bar tracks how far through the steps you are. */
  function initProgress() {
    var gsap = window.gsap;
    $$('.story').forEach(function (story) {
      var fill = $('.story__progress i', story);
      var steps = $('.story__steps', story);
      if (!fill || !steps) return;
      gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: steps, start: 'top 65%', end: 'bottom 75%', scrub: true }
      });
    });
  }

  /* Services page: highlight the index entry whose panel is in view. */
  function initServiceIndex() {
    var items = $$('.svc__index li');
    if (!items.length) return;
    items.forEach(function (li) {
      var link = $('a', li);
      if (!link) return;
      var panel = document.getElementById(link.getAttribute('href').slice(1));
      if (!panel) return;
      window.ScrollTrigger.create({
        trigger: panel, start: 'top 45%', end: 'bottom 45%',
        onToggle: function (self) { li.classList.toggle('is-active', self.isActive); }
      });
    });
  }

  /* ------------------------------------------------------------ preloader */

  function runPreloader(done) {
    var pre = $('.preload');
    if (!pre) { done(); return; }

    var seen = false;
    try { seen = sessionStorage.getItem('sc-loaded') === '1'; } catch (err) { seen = false; }

    if (seen) {
      pre.parentNode.removeChild(pre);
      document.documentElement.classList.remove('is-loading');
      done();
      return;
    }

    var gsap = window.gsap;
    var num = $('.preload__num', pre);
    var bar = $('.preload__bar', pre);
    var counter = { v: 0 };
    var finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      if (pre.parentNode) pre.parentNode.removeChild(pre);
      document.documentElement.classList.remove('is-loading');
      try { sessionStorage.setItem('sc-loaded', '1'); } catch (err) { /* private mode */ }
    }

    /* requestAnimationFrame is suspended in background tabs, which would
       otherwise leave the curtain up over the whole page. Never trap it. */
    var failsafe = setTimeout(function () {
      if (finished) return;
      finish();
      done();
    }, 4500);

    gsap.timeline()
      .to(counter, {
        v: 100, duration: 1.05, ease: 'power2.inOut',
        onUpdate: function () {
          if (num) num.textContent = String(Math.round(counter.v)).padStart(3, '0');
        }
      })
      .to(bar, { width: '100%', duration: 1.05, ease: 'power2.inOut' }, 0)
      .to(pre, {
        yPercent: -100, duration: 1, ease: 'power4.inOut',
        onComplete: function () { clearTimeout(failsafe); finish(); }
      }, '+=0.15')
      .add(function () { if (!finished) done(); }, '-=0.45');
  }

  function playHero() {
    var gsap = window.gsap;
    if (heroLines.length) {
      gsap.to(heroLines, { yPercent: 0, duration: 1.3, ease: 'power4.out', stagger: 0.1 });
    }
    var melt = $('[data-melt]');
    if (melt) {
      gsap.fromTo(melt,
        { opacity: 1, y: 36, filter: 'blur(26px)' },
        { y: 0, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out', clearProps: 'filter,transform' });
    }
    var card = $('.hero__card');
    if (card) gsap.to(card, { opacity: 1, duration: 1.2, ease: 'power2.out', delay: 0.35 });
  }

  /* ------------------------------------------------------------------ go */

  function boot() {
    /* These work with or without motion. */
    initNav();
    initBeforeAfter();
    initForm();
    initFilters();
    initGoo();
    initFlip();
    initPricing();
    initTestimonials();
    initVideos();
    initSpotlight();   /* self-gates on hover + reduced motion */
    initMorph();       /* self-gates on reduced motion */
    initFooterLiquid();/* self-gates on reduced motion */

    if (!MOTION) {
      showEverything();
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    initSmoothScroll();
    initAnchors();
    initMasks();
    initReveals();
    initParallax();
    initScale();
    initMagnetic();
    initCount();
    initStack();
    initMarquee();
    initProgress();
    initServiceIndex();

    runPreloader(playHero);

    /* Line breaks change with the viewport, so masks are re-measured. */
    var lastW = window.innerWidth;
    window.addEventListener('resize', debounce(function () {
      if (Math.abs(window.innerWidth - lastW) < 40) return;
      lastW = window.innerWidth;
      $$('[data-mask]').forEach(function (el) {
        var lines = splitLines(el);
        window.gsap.set(lines, { yPercent: 0 });
      });
      window.ScrollTrigger.refresh();
    }, 220));
  }

  function start() {
    if (!hasGSAP) {
      showEverything();
      initNav(); initBeforeAfter(); initForm();
      initFilters(); initGoo(); initFlip(); initPricing();
      initTestimonials(); initVideos();
      initSpotlight(); initMorph(); initFooterLiquid();
      return;
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(boot).catch(boot);
    } else {
      boot();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
