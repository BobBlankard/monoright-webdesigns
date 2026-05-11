(function () {
  "use strict";

  var siteHeader = document.querySelector(".site-header");
  var lastScrollY = 0;
  var scrollTopEpsilon = 10;
  var scrollDirDelta = 6;

  function syncSiteHeaderHeight() {
    if (!siteHeader) return;
    if (document.body.classList.contains("page-home")) {
      document.documentElement.style.removeProperty("--site-header-h");
      return;
    }
    document.documentElement.style.setProperty(
      "--site-header-h",
      Math.ceil(siteHeader.getBoundingClientRect().height) + "px"
    );
  }

  var navToggle = document.querySelector(".nav-toggle");
  var primaryNav = document.querySelector(".primary-nav");

  function setNavOpen(open) {
    if (!navToggle || !primaryNav) return;
    if (window.matchMedia("(min-width: 960px)").matches) return;
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    primaryNav.classList.toggle("is-open", open);
    primaryNav.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("mobile-nav-open", open);
    if (open && siteHeader) siteHeader.classList.remove("is-header-hidden");
    syncSiteHeaderHeight();
  }

  if (document.querySelector(".sticky-cta")) {
    document.body.classList.add("has-sticky-cta");
  }

  function syncNavForViewport() {
    if (!navToggle || !primaryNav) return;
    var desktop = window.matchMedia("(min-width: 960px)").matches;
    if (desktop) {
      document.body.classList.remove("mobile-nav-open");
      primaryNav.setAttribute("aria-hidden", "false");
      primaryNav.classList.add("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    } else {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      primaryNav.classList.toggle("is-open", open);
      primaryNav.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.classList.toggle("mobile-nav-open", open);
    }
    syncSiteHeaderHeight();
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", function () {
      if (window.matchMedia("(min-width: 960px)").matches) return;
      var open = navToggle.getAttribute("aria-expanded") !== "true";
      setNavOpen(open);
    });

    primaryNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 959px)").matches) setNavOpen(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setNavOpen(false);
    });

    window.addEventListener("resize", function () {
      syncNavForViewport();
      syncSiteHeaderHeight();
    });
    syncNavForViewport();
    syncSiteHeaderHeight();
  } else if (siteHeader) {
    window.addEventListener("resize", syncSiteHeaderHeight);
    syncSiteHeaderHeight();
  }

  /* --- Lenis: smooth scroll on desktop pointer devices only --- */
  var lenis = null;
  var lenisRafId = null;
  var lenisScrollUnsub = null;
  var lenisScriptRequested = false;

  var mqLenis = window.matchMedia(
    "(min-width: 768px) and (hover: hover) and (pointer: fine)"
  );
  var mqReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function mainScriptDir() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute("src") || "";
      if (src.indexOf("main.js") === -1) continue;
      try {
        var abs = new URL(src, window.location.href).href;
        return abs.slice(0, abs.lastIndexOf("/") + 1);
      } catch (err) {
        return src.replace(/main\.js(\?.*)?$/, "");
      }
    }
    return null;
  }

  function getScrollY() {
    if (lenis && typeof lenis.scroll === "number") return lenis.scroll;
    return window.scrollY || window.pageYOffset || 0;
  }

  function updateHeaderScroll(y) {
    if (!siteHeader || !siteHeader.classList.contains("site-header--minimal")) return;
    if (
      window.matchMedia("(max-width: 959px)").matches &&
      primaryNav &&
      primaryNav.classList.contains("is-open")
    ) {
      siteHeader.classList.remove("is-header-hidden");
      lastScrollY = y;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      siteHeader.classList.remove("is-header-hidden");
      lastScrollY = y;
      return;
    }
    if (y < scrollTopEpsilon) {
      siteHeader.classList.remove("is-header-hidden");
    } else {
      var dy = y - lastScrollY;
      if (dy > scrollDirDelta) siteHeader.classList.add("is-header-hidden");
      else if (dy < -scrollDirDelta) siteHeader.classList.remove("is-header-hidden");
    }
    lastScrollY = y;
  }

  function onWindowScroll() {
    updateHeaderScroll(window.scrollY || window.pageYOffset || 0);
  }

  function bindHeaderToWindow() {
    if (!siteHeader) return;
    window.removeEventListener("scroll", onWindowScroll);
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    lastScrollY = window.scrollY || window.pageYOffset || 0;
    updateHeaderScroll(lastScrollY);
    syncSiteHeaderHeight();
  }

  function bindHeaderToLenis(instance) {
    if (!siteHeader || !instance) return;
    window.removeEventListener("scroll", onWindowScroll);
    if (lenisScrollUnsub) {
      lenisScrollUnsub();
      lenisScrollUnsub = null;
    }
    lenisScrollUnsub = instance.on("scroll", function (state) {
      var y = state && typeof state.scroll === "number" ? state.scroll : instance.scroll;
      updateHeaderScroll(y);
    });
    lastScrollY = getScrollY();
    updateHeaderScroll(lastScrollY);
    syncSiteHeaderHeight();
  }

  function stopLenis() {
    if (lenisRafId) {
      window.cancelAnimationFrame(lenisRafId);
      lenisRafId = null;
    }
    if (lenisScrollUnsub) {
      lenisScrollUnsub();
      lenisScrollUnsub = null;
    }
    if (lenis) {
      lenis.destroy();
      lenis = null;
    }
    document.documentElement.classList.remove("lenis", "lenis-smooth");
    bindHeaderToWindow();
  }

  function startLenis() {
    if (!globalThis.Lenis || lenis || !mqLenis.matches || mqReduceMotion.matches) return;
    lenis = new globalThis.Lenis({
      lerp: 0.065,
      wheelMultiplier: 0.95,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1,
    });

    function raf(t) {
      lenis.raf(t);
      lenisRafId = window.requestAnimationFrame(raf);
    }

    lenisRafId = window.requestAnimationFrame(raf);
    bindHeaderToLenis(lenis);
    document.documentElement.classList.add("lenis", "lenis-smooth");
  }

  function loadLenisAndMaybeStart() {
    if (!mqLenis.matches || mqReduceMotion.matches) return;
    if (globalThis.Lenis) {
      startLenis();
      return;
    }
    if (lenisScriptRequested) return;
    var base = mainScriptDir();
    if (!base) return;
    lenisScriptRequested = true;
    var url = new URL("vendor/lenis.min.js", base).href;
    var sc = document.createElement("script");
    sc.src = url;
    sc.async = true;
    sc.onerror = function () {
      lenisScriptRequested = false;
    };
    sc.onload = function () {
      if (mqLenis.matches && !mqReduceMotion.matches) startLenis();
    };
    document.head.appendChild(sc);
  }

  function syncLenisWithViewport() {
    if (!mqLenis.matches || mqReduceMotion.matches) {
      stopLenis();
      return;
    }
    loadLenisAndMaybeStart();
    if (lenis && typeof lenis.resize === "function") lenis.resize();
  }

  mqLenis.addEventListener("change", syncLenisWithViewport);
  mqReduceMotion.addEventListener("change", syncLenisWithViewport);

  if (siteHeader) {
    bindHeaderToWindow();
    window.addEventListener("resize", syncSiteHeaderHeight);
  }

  syncLenisWithViewport();

  /* Scroll-in panels (Suero-style reveal, CSS-only motion) */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !("IntersectionObserver" in window)
  ) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else if (revealEls.length) {
    var revealIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealIo.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach(function (el) {
      revealIo.observe(el);
    });
  }

  /* Home pricing: border sparkles hug .pricing-card__plate edge (not outer article box) */
  (function initPricingHomeBorderParticles() {
    var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqReduce.matches) return;

    var articles = document.querySelectorAll(".pricing-packages--home .pricing-card--home");
    if (!articles.length) return;

    function isDarkTheme() {
      var t = document.documentElement.getAttribute("data-theme");
      if (t === "dark") return true;
      if (t === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    /** Point on plate-local perimeter (0..pw, 0..ph), r = corner radius */
    function edgePoint(pw, ph, r, side, u) {
      u = ((u % 1) + 1) % 1;
      r = Math.min(Math.max(r, 8), pw / 2 - 0.5, ph / 2 - 0.5);
      if (side === 0) {
        return { x: r + u * (pw - 2 * r), y: 0 };
      }
      if (side === 1) {
        return { x: pw, y: r + u * (ph - 2 * r) };
      }
      if (side === 2) {
        return { x: pw - r - u * (pw - 2 * r), y: ph };
      }
      return { x: 0, y: ph - r - u * (ph - 2 * r) };
    }

    function edgeNormal(side) {
      if (side === 0) {
        return { nx: 0, ny: -1 };
      }
      if (side === 1) {
        return { nx: 1, ny: 0 };
      }
      if (side === 2) {
        return { nx: 0, ny: 1 };
      }
      return { nx: -1, ny: 0 };
    }

    function edgeTangent(side) {
      if (side === 0) {
        return { tx: 1, ty: 0 };
      }
      if (side === 1) {
        return { tx: 0, ty: 1 };
      }
      if (side === 2) {
        return { tx: -1, ty: 0 };
      }
      return { tx: 0, ty: -1 };
    }

    /** Clockwise border length + arc-length map (plate coords), matches rounded plate */
    function borderGeom(pw, ph, r0) {
      var r = Math.min(Math.max(r0, 0.001), pw * 0.5 - 0.001, ph * 0.5 - 0.001);
      var lt = Math.max(0, pw - 2 * r);
      var lr = Math.max(0, ph - 2 * r);
      var arc = (Math.PI / 2) * r;
      var L = 2 * lt + 2 * lr + 4 * arc;
      return { pw: pw, ph: ph, r: r, lt: lt, lr: lr, arc: arc, L: L };
    }

    function unit2(dx, dy) {
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      return { x: dx / len, y: dy / len };
    }

    function pointOnBorderByArcLength(g, s) {
      s = ((s % g.L) + g.L) % g.L;
      var pw = g.pw;
      var ph = g.ph;
      var r = g.r;
      var lt = g.lt;
      var lr = g.lr;
      var arc = g.arc;
      var acc = 0;
      var u;
      var th;
      var d;
      if (s <= acc + lt) {
        u = lt < 1e-6 ? 0 : (s - acc) / lt;
        return { x: r + u * lt, y: 0, tx: 1, ty: 0 };
      }
      acc += lt;
      if (s <= acc + arc) {
        th = -Math.PI / 2 + ((s - acc) / arc) * (Math.PI / 2);
        d = unit2(-r * Math.sin(th), r * Math.cos(th));
        return { x: pw - r + r * Math.cos(th), y: r + r * Math.sin(th), tx: d.x, ty: d.y };
      }
      acc += arc;
      if (s <= acc + lr) {
        u = lr < 1e-6 ? 0 : (s - acc) / lr;
        return { x: pw, y: r + u * lr, tx: 0, ty: 1 };
      }
      acc += lr;
      if (s <= acc + arc) {
        th = ((s - acc) / arc) * (Math.PI / 2);
        d = unit2(-r * Math.sin(th), r * Math.cos(th));
        return { x: pw - r + r * Math.cos(th), y: ph - r + r * Math.sin(th), tx: d.x, ty: d.y };
      }
      acc += arc;
      if (s <= acc + lt) {
        u = lt < 1e-6 ? 0 : (s - acc) / lt;
        return { x: pw - r - u * lt, y: ph, tx: -1, ty: 0 };
      }
      acc += lt;
      if (s <= acc + arc) {
        th = Math.PI / 2 + ((s - acc) / arc) * (Math.PI / 2);
        d = unit2(-r * Math.sin(th), r * Math.cos(th));
        return { x: r + r * Math.cos(th), y: ph - r + r * Math.sin(th), tx: d.x, ty: d.y };
      }
      acc += arc;
      if (s <= acc + lr) {
        u = lr < 1e-6 ? 0 : (s - acc) / lr;
        return { x: 0, y: ph - r - u * lr, tx: 0, ty: -1 };
      }
      acc += lr;
      th = Math.PI + ((s - acc) / arc) * (Math.PI / 2);
      d = unit2(-r * Math.sin(th), r * Math.cos(th));
      return { x: r + r * Math.cos(th), y: r + r * Math.sin(th), tx: d.x, ty: d.y };
    }

    /** Samples the plate border so the beam bends through corners (no pivot-at-center). */
    function buildBorderBeamPoints(g, sCenter, halfLen, step) {
      var L = g.L;
      var a0 = sCenter - halfLen;
      var a1 = sCenter + halfLen;
      var pts = [];
      function addSegment(sStart, sEnd) {
        if (sEnd < sStart - 1e-6) return;
        var s = sStart;
        while (s <= sEnd + 1e-6) {
          var w = ((s % L) + L) % L;
          var p = pointOnBorderByArcLength(g, w);
          pts.push({ x: p.x, y: p.y });
          s += step;
        }
        var wEnd = ((sEnd % L) + L) % L;
        var pEnd = pointOnBorderByArcLength(g, wEnd);
        var last = pts[pts.length - 1];
        if (!last || last.x !== pEnd.x || last.y !== pEnd.y) {
          pts.push({ x: pEnd.x, y: pEnd.y });
        }
      }
      if (a0 >= 0 && a1 <= L) {
        addSegment(a0, a1);
      } else if (a0 < 0) {
        addSegment(L + a0, L);
        addSegment(0, a1);
      } else {
        addSegment(a0, L);
        addSegment(0, a1 - L);
      }
      var out = [];
      var eps2 = 0.35 * 0.35;
      for (var i = 0; i < pts.length; i++) {
        if (!out.length) {
          out.push(pts[i]);
          continue;
        }
        var pr = out[out.length - 1];
        var dx = pts[i].x - pr.x;
        var dy = pts[i].y - pr.y;
        if (dx * dx + dy * dy > eps2) {
          out.push(pts[i]);
        }
      }
      return out;
    }

    function strokeBorderBeamPath(ctx, ox, oy, pts, lineWidth, alpha, dark, glowPass) {
      if (!pts || pts.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ox + pts[0].x, oy + pts[0].y);
      var i;
      for (i = 1; i < pts.length; i++) {
        ctx.lineTo(ox + pts[i].x, oy + pts[i].y);
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.lineWidth = lineWidth;
      ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
      ctx.globalAlpha = alpha;
      if (glowPass) {
        ctx.strokeStyle = dark ? "rgba(200,228,255,0.75)" : "rgba(255,255,255,0.65)";
        ctx.shadowBlur = dark ? 28 : 22;
        ctx.shadowColor = dark ? "rgba(230,242,255,0.9)" : "rgba(255,255,255,0.85)";
      } else {
        ctx.strokeStyle = dark ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.98)";
        ctx.shadowBlur = dark ? 12 : 10;
        ctx.shadowColor = dark ? "rgba(248,252,255,0.55)" : "rgba(255,255,255,0.6)";
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawMonthlyBorderLightBeams(ctx, ox, oy, inst, dark) {
      var g = inst.borderGeom;
      if (!g || g.L < 24) return;
      var L = g.L;
      var halfLen = Math.min(L * 0.3, 168);
      var step = 2;
      var s0 = inst.beamS % L;
      function drawBeamAt(sCenter, intensity) {
        if (intensity < 0.05) return;
        var pts = buildBorderBeamPoints(g, sCenter, halfLen, step);
        strokeBorderBeamPath(ctx, ox, oy, pts, 16, 0.34 * intensity, dark, true);
        strokeBorderBeamPath(ctx, ox, oy, pts, 7.5, 0.78 * intensity, dark, false);
      }
      drawBeamAt(s0, 1);
      drawBeamAt(s0 - L * 0.2, 0.42);
      drawBeamAt(s0 - L * 0.4, 0.26);
      drawBeamAt(s0 + L * 0.52, 0.3);
    }

    /** Clump on one edge: shared side + u band only; each particle gets its own drift, pulse, rotation (no shared crawl). */
    function spawnSparkleCluster(inst, count, uSpread, shared) {
      var pw = inst.pw;
      var ph = inst.ph;
      if (pw < 16 || ph < 16) return;
      var side =
        shared && typeof shared.side === "number"
          ? shared.side
          : (Math.random() * 4) | 0;
      var u0 =
        shared && typeof shared.u0 === "number" ? shared.u0 : Math.random();
      var maxLifeBase = inst.featured ? 24 : 19;
      var maxLifeRange = inst.featured ? 22 : 16;
      var sizeBase = inst.featured ? 2.45 : 1.95;
      var sizeRange = inst.featured ? 1.85 : 1.35;

      for (var k = 0; k < count; k++) {
        var jitterU = (Math.random() - 0.5 + (Math.random() - 0.5) * 0.5) * uSpread;
        var anchorU = u0 + jitterU;
        anchorU = ((anchorU % 1) + 1) % 1;
        inst.particles.push({
          side: side,
          anchorU: anchorU,
          pulseT: Math.random() * Math.PI * 2,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseFreq: 0.32 + Math.random() * 0.75,
          pulseAmp: 0.006 + Math.random() * (inst.featured ? 0.018 : 0.012),
          anchorDrift: (Math.random() - 0.5) * (inst.featured ? 0.012 : 0.008),
          breatheFreq: 0.38 + Math.random() * 0.85,
          breathePhase: Math.random() * Math.PI * 2,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * (inst.featured ? 0.38 : 0.24),
          life: 0,
          maxLife: maxLifeBase + Math.random() * maxLifeRange,
          size: sizeBase + Math.random() * sizeRange,
          twinkle: Math.random() * Math.PI * 2,
          flowPhase: Math.random() * Math.PI * 2,
          ribbon: Math.random() * Math.PI * 2,
        });
      }
    }

    function resizeOne(inst) {
      var wrap = inst.article;
      var rect = wrap.getBoundingClientRect();
      inst.w = Math.max(10, Math.floor(rect.width));
      inst.h = Math.max(10, Math.floor(rect.height));
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var canvas = inst.canvas;
      canvas.width = Math.floor(inst.w * dpr);
      canvas.height = Math.floor(inst.h * dpr);
      canvas.style.width = inst.w + "px";
      canvas.style.height = inst.h + "px";
      var ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      inst.ctx = ctx;

      var plate = inst.plate || wrap.querySelector(".pricing-card__plate");
      inst.plate = plate;
      if (plate) {
        var ar = wrap.getBoundingClientRect();
        var pr = plate.getBoundingClientRect();
        inst.offX = pr.left - ar.left;
        inst.offY = pr.top - ar.top;
        inst.pw = pr.width;
        inst.ph = pr.height;
        var cs = window.getComputedStyle(plate);
        var parsed = parseFloat(cs.borderTopLeftRadius) || 20;
        inst.plateR = Math.min(Math.max(10, parsed), Math.min(inst.pw, inst.ph) * 0.48);
      } else {
        inst.offX = 0;
        inst.offY = 0;
        inst.pw = inst.w;
        inst.ph = inst.h;
        inst.plateR = Math.min(20, inst.w * 0.09, inst.h * 0.09);
      }
      if (inst && inst.pw > 0 && inst.ph > 0) {
        inst.borderGeom = borderGeom(inst.pw, inst.ph, inst.plateR);
      }

      var bottom = plate ? plate.querySelector(".pricing-card__bottom") : null;
      inst.bottomEl = bottom;
      var ctaLink = bottom ? bottom.querySelector(".pricing-card__text-cta") : null;
      inst.cta = ctaLink;
    }

    var instances = [];
    var lastT = performance.now();
    var tabHidden = document.visibilityState === "hidden";

    document.addEventListener("visibilitychange", function () {
      tabHidden = document.visibilityState === "hidden";
    });

    Array.prototype.forEach.call(articles, function (article) {
      var canvas = article.querySelector(".pricing-card__particles-canvas");
      if (!canvas) return;
      var plate = article.querySelector(".pricing-card__plate");
      var inst = {
        article: article,
        canvas: canvas,
        plate: plate,
        featured: article.classList.contains("pricing-card--home-featured"),
        particles: [],
        visible: false,
        w: 0,
        h: 0,
        offX: 0,
        offY: 0,
        pw: 0,
        ph: 0,
        plateR: 20,
        ctx: null,
        beamS: 0,
        borderGeom: null,
        ctaHovered: false,
        bottomEl: null,
        cta: null,
      };
      resizeOne(inst);

      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (e) {
              inst.visible = e.isIntersecting && e.intersectionRatio > 0.03;
            });
          },
          { root: null, rootMargin: "12% 0px 12% 0px", threshold: [0, 0.04, 0.12] }
        );
        io.observe(article);
      } else {
        inst.visible = true;
      }
      if ("ResizeObserver" in window) {
        var ro = new ResizeObserver(function () {
          resizeOne(inst);
        });
        ro.observe(article);
        if (plate) ro.observe(plate);
        if (inst.bottomEl) ro.observe(inst.bottomEl);
      } else {
        window.addEventListener("resize", function () {
          resizeOne(inst);
        });
      }
      instances.push(inst);

      if (inst.cta) {
        inst.cta.addEventListener("mouseenter", function () {
          inst.ctaHovered = true;
        });
        inst.cta.addEventListener("mouseleave", function () {
          inst.ctaHovered = false;
        });
      }
    });

    if (!instances.length) return;

    function drawSoftHalo(ctx, px, py, rad, alpha, dark) {
      var g = ctx.createRadialGradient(px, py, 0, px, py, rad);
      if (dark) {
        g.addColorStop(0, "rgba(235,244,255,0.35)");
        g.addColorStop(0.45, "rgba(150,180,235,0.12)");
        g.addColorStop(1, "rgba(60,90,150,0)");
      } else {
        g.addColorStop(0, "rgba(255,255,255,0.32)");
        g.addColorStop(0.5, "rgba(190,210,250,0.14)");
        g.addColorStop(1, "rgba(130,165,215,0)");
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /** Sharp 4-point star (8 verts); rot in radians */
    function drawStar4(ctx, px, py, outerR, innerR, rot, fillAlpha, strokeAlpha, dark) {
      if (outerR < 0.35) return;
      innerR = Math.min(innerR, outerR * 0.92);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.beginPath();
      var i;
      for (i = 0; i < 8; i++) {
        var ang = i * (Math.PI / 4) - Math.PI / 2;
        var rr = i % 2 === 0 ? outerR : innerR;
        var x = Math.cos(ang) * rr;
        var y = Math.sin(ang) * rr;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      var fill = dark
        ? ctx.createRadialGradient(0, 0, 0, 0, 0, outerR)
        : ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
      if (dark) {
        fill.addColorStop(0, "rgba(255,255,255,0.95)");
        fill.addColorStop(0.25, "rgba(220,232,255,0.88)");
        fill.addColorStop(0.55, "rgba(160,190,245,0.45)");
        fill.addColorStop(1, "rgba(90,125,200,0.08)");
      } else {
        fill.addColorStop(0, "rgba(255,255,255,1)");
        fill.addColorStop(0.22, "rgba(235,242,255,0.92)");
        fill.addColorStop(0.55, "rgba(185,205,248,0.5)");
        fill.addColorStop(1, "rgba(130,165,220,0.1)");
      }
      ctx.globalAlpha = fillAlpha;
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.globalAlpha = strokeAlpha;
      ctx.strokeStyle = dark ? "rgba(248,252,255,0.55)" : "rgba(255,255,255,0.65)";
      ctx.lineWidth = Math.min(1.1, 0.28 + outerR * 0.08);
      ctx.lineJoin = "miter";
      ctx.stroke();
      ctx.restore();
    }

    /** Brighter longer, soft ramp-in, gentle ease-out at end */
    function lifeAlpha(q) {
      if (q <= 0) return 0;
      if (q >= 1) return 0;
      if (q < 0.07) {
        return q / 0.07;
      }
      if (q < 0.84) {
        return 1;
      }
      var tail = (q - 0.84) / 0.16;
      var e = 1 - tail;
      return e * e * e;
    }

    function frame(now) {
      if (mqReduce.matches) {
        instances.forEach(function (inst) {
          if (inst.ctx) inst.ctx.clearRect(0, 0, inst.w, inst.h);
          inst.particles.length = 0;
        });
        return;
      }

      if (!tabHidden) {
        var dt = Math.min(0.048, (now - lastT) / 1000);
        lastT = now;
        var dark = isDarkTheme();
        var t = now * 0.001;

        instances.forEach(function (inst) {
          if (!inst.visible || !inst.ctx) return;
          var pw = inst.pw;
          var ph = inst.ph;
          var ox = inst.offX;
          var oy = inst.offY;
          var r = inst.plateR;
          if (pw < 12 || ph < 12) return;

          var ctx = inst.ctx;
          ctx.clearRect(0, 0, inst.w, inst.h);

          var maxP = inst.featured ? 26 : 11;
          var burstMain = inst.featured ? 0.026 : 0.0085;
          var burstExtra = inst.featured ? 0.014 : 0.0045;
          if (Math.random() < burstMain) {
            var nMain = inst.featured ? 2 + ((Math.random() * 2) | 0) : 1;
            var spreadMain = inst.featured ? 0.048 : 0.024;
            spawnSparkleCluster(inst, nMain, spreadMain, null);
          }
          if (Math.random() < burstExtra) {
            var n2 = inst.featured ? 1 + ((Math.random() * 2) | 0) : 1;
            var spread2 = inst.featured ? 0.034 : 0.017;
            spawnSparkleCluster(inst, n2, spread2, null);
          }

          if (inst.particles.length > maxP) {
            inst.particles.splice(0, inst.particles.length - maxP);
          }

          var tSlow = t * 0.31;
          var drawMul = inst.featured ? 1 : 0.58;

          for (var i = inst.particles.length - 1; i >= 0; i--) {
            var p = inst.particles[i];
            p.life += dt;
            p.pulseT += dt;
            p.anchorU += p.anchorDrift * dt;
            while (p.anchorU > 1) {
              p.anchorU -= 1;
            }
            while (p.anchorU < 0) {
              p.anchorU += 1;
            }
            var uOsc =
              p.anchorU +
              Math.sin(p.pulseT * p.pulseFreq + p.pulsePhase) * p.pulseAmp;
            uOsc = ((uOsc % 1) + 1) % 1;
            p.rot += p.rotSpeed * dt;

            var ep = edgePoint(pw, ph, r, p.side, uOsc);
            var px = ox + ep.x;
            var py = oy + ep.y;

            if (p.life >= p.maxLife) {
              inst.particles.splice(i, 1);
              continue;
            }

            var q = p.life / p.maxLife;
            var a = lifeAlpha(q);
            var tw = 0.58 + 0.42 * Math.sin(tSlow * 0.95 + p.twinkle);
            var baseAlpha = a * tw * (dark ? 1 : 0.94) * drawMul;

            var breathe =
              0.5 +
              0.5 * Math.sin(p.pulseT * p.breatheFreq + p.breathePhase);
            var breatheSharp = 0.5 + 0.5 * Math.sin(p.pulseT * p.breatheFreq * 1.63 + p.breathePhase * 0.4);
            var outerR = p.size * (1.2 + 5 * breathe);
            var innerR = outerR * (0.32 - 0.26 * breatheSharp);
            innerR = Math.max(outerR * 0.06, innerR);

            drawSoftHalo(ctx, px, py, outerR * 2.65, baseAlpha * 0.38, dark);
            drawStar4(
              ctx,
              px,
              py,
              outerR,
              innerR,
              p.rot,
              baseAlpha * 0.92,
              baseAlpha * 0.62,
              dark
            );
          }

          if (inst.featured && inst.borderGeom && inst.borderGeom.L > 24) {
            inst.beamS += dt * 32 * (inst.ctaHovered ? 2.35 : 1);
            drawMonthlyBorderLightBeams(ctx, ox, oy, inst, dark);
          }
        });
      }

      window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  })();

  /* Home pricing cards: 3D pivot tracks pointer on every mousemove (no rAF delay). */
  (function initPricingHomeCardTilt() {
    var mqHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqReduce.matches) return;

    var cards = document.querySelectorAll(".pricing-page--home .pricing-card--home");
    if (!cards.length) return;

    var maxRotateX = 10.5;
    var maxRotateY = 12.5;

    function applyTilt(card, rotateXDeg, rotateYDeg) {
      card.style.setProperty("--tilt-x", rotateXDeg.toFixed(3) + "deg");
      card.style.setProperty("--tilt-y", rotateYDeg.toFixed(3) + "deg");
    }

    function applyFromPointer(card, clientX, clientY) {
      if (!mqHover.matches || mqReduce.matches) return;
      var rect = card.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      if (w < 8 || h < 8) return;
      var cx = rect.left + w * 0.5;
      var cy = rect.top + h * 0.5;
      var dx = (clientX - cx) / (w * 0.5);
      var dy = (clientY - cy) / (h * 0.5);
      dx = Math.max(-1, Math.min(1, dx));
      dy = Math.max(-1, Math.min(1, dy));
      /* Center = flat. Pointer right → +rotateY; below center → +rotateX (card “faces” the cursor). */
      var rotateYDeg = dx * maxRotateY;
      var rotateXDeg = -dy * maxRotateX;
      applyTilt(card, rotateXDeg, rotateYDeg);
    }

    function resetTilt(card) {
      applyTilt(card, 0, 0);
    }

    cards.forEach(function (card) {
      card.addEventListener(
        "mousemove",
        function (e) {
          applyFromPointer(card, e.clientX, e.clientY);
        },
        { passive: true }
      );
      card.addEventListener("mouseleave", function () {
        resetTilt(card);
      });
    });

    function onMqlChange() {
      if (mqReduce.matches || !mqHover.matches) {
        cards.forEach(function (card) {
          resetTilt(card);
        });
      }
    }
    mqHover.addEventListener("change", onMqlChange);
    mqReduce.addEventListener("change", onMqlChange);
  })();

  /* Pricing (home + /pricing): below 960px, horizontal snap carousel with centered “active” card + dots. */
  (function initPricingHomeMobileCarousel() {
    var mq = window.matchMedia("(max-width: 959px)");
    var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var tracks = document.querySelectorAll(".pricing-packages--home");
    if (!tracks.length) return;

    var stateByTrack = new WeakMap();

    function scrollCardToCenter(track, card, instant) {
      var maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      var target = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
      var left = Math.max(0, Math.min(target, maxScroll));
      if (instant || mqReduce.matches) {
        track.scrollLeft = left;
      } else {
        track.scrollTo({ left: left, behavior: "smooth" });
      }
    }

    function updateActive(track) {
      var cards = track.querySelectorAll(":scope > .pricing-card--home");
      if (!cards.length) return;
      var rect = track.getBoundingClientRect();
      var mid = rect.left + rect.width * 0.5;
      var best = null;
      var bestDist = Infinity;
      cards.forEach(function (card) {
        var r = card.getBoundingClientRect();
        var c = r.left + r.width * 0.5;
        var d = Math.abs(c - mid);
        if (d < bestDist) {
          bestDist = d;
          best = card;
        }
      });
      cards.forEach(function (card) {
        card.classList.toggle("is-pricing-carousel-active", card === best);
      });
      var st = stateByTrack.get(track);
      if (!st || !st.dotBtns) return;
      var idx = best ? Array.prototype.indexOf.call(cards, best) : 0;
      st.dotBtns.forEach(function (btn, j) {
        btn.classList.toggle("is-active", j === idx);
        btn.setAttribute("aria-selected", j === idx ? "true" : "false");
      });
    }

    function teardown(track) {
      var st = stateByTrack.get(track);
      if (!st) return;
      st.abort.abort();
      if (st.dotsEl && st.dotsEl.parentNode) st.dotsEl.remove();
      track.removeAttribute("data-pricing-carousel-bound");
      track.removeAttribute("tabindex");
      track.removeAttribute("role");
      track.removeAttribute("aria-roledescription");
      track.removeAttribute("aria-label");
      track.querySelectorAll(":scope > .pricing-card--home").forEach(function (c) {
        c.classList.remove("is-pricing-carousel-active");
      });
      track.scrollLeft = 0;
      stateByTrack.delete(track);
    }

    function setup(track) {
      if (stateByTrack.has(track)) return;
      var cards = track.querySelectorAll(":scope > .pricing-card--home");
      if (cards.length < 2) return;

      var abort = new AbortController();

      var dotsEl = document.createElement("div");
      dotsEl.className = "pricing-carousel__dots";
      dotsEl.setAttribute("role", "tablist");
      dotsEl.setAttribute("aria-label", "Pricing plans");

      var dotBtns = [];
      cards.forEach(function (card, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pricing-carousel__dot";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-label", "Show plan " + (i + 1) + " of " + cards.length);
        btn.setAttribute("aria-selected", "false");
        btn.addEventListener(
          "click",
          function () {
            scrollCardToCenter(track, card, mqReduce.matches);
            window.requestAnimationFrame(function () {
              updateActive(track);
            });
          },
          { signal: abort.signal }
        );
        dotsEl.appendChild(btn);
        dotBtns.push(btn);
      });

      track.insertAdjacentElement("afterend", dotsEl);

      var onScroll = function () {
        window.requestAnimationFrame(function () {
          updateActive(track);
        });
      };

      track.addEventListener("scroll", onScroll, { passive: true, signal: abort.signal });
      if ("onscrollend" in window) {
        track.addEventListener("scrollend", onScroll, { signal: abort.signal });
      }
      window.addEventListener("resize", onScroll, { signal: abort.signal });

      track.setAttribute("data-pricing-carousel-bound", "1");
      track.setAttribute("tabindex", "0");
      track.setAttribute("role", "region");
      track.setAttribute("aria-roledescription", "carousel");
      track.setAttribute("aria-label", "Pricing packages, swipe sideways");

      stateByTrack.set(track, { abort: abort, dotsEl: dotsEl, dotBtns: dotBtns });

      function initialCenter() {
        if (!mq.matches) return;
        var featured = track.querySelector(":scope > .pricing-card--home-featured");
        var pick = featured || cards[0];
        scrollCardToCenter(track, pick, true);
        updateActive(track);
      }

      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(initialCenter);
      });

      onScroll();
    }

    function sync() {
      tracks.forEach(function (track) {
        if (mq.matches) setup(track);
        else teardown(track);
      });
    }

    mq.addEventListener("change", sync);
    sync();
  })();

  /* Home showcase: horizontal video gallery with scroll progress + active card highlight. */
  (function initHomeWorkGallery() {
    var section = document.querySelector(".work-gallery");
    var track = document.querySelector("[data-work-gallery-track]");
    if (!section || !track) return;
    var trackWrap = section.querySelector(".work-gallery__track-wrap");
    if (!trackWrap) return;
    var fill = document.querySelector("[data-work-gallery-progress]");
    var items = track.querySelectorAll(".work-gallery__item");
    if (!items.length) return;
    var mqDesktop = window.matchMedia("(min-width: 960px)");
    var ticking = false;
    var lastActiveItem = null;
    var desktopRange = { startY: 0, endY: 1 };

    function clamp01(v) {
      return Math.max(0, Math.min(1, v));
    }

    function maxScrollX() {
      return Math.max(0, track.scrollWidth - track.clientWidth);
    }

    function progressTargetX() {
      /* Match real track scroll range so the bar can reach 100% with scrollLeft. */
      return Math.max(1, maxScrollX());
    }

    function syncGalleryUi() {
      var targetX = progressTargetX();
      var ratio = clamp01(track.scrollLeft / targetX);
      if (fill) {
        fill.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      }

      var trackRect = track.getBoundingClientRect();
      var mid = trackRect.left + trackRect.width * 0.5;
      var best = null;
      var bestDist = Infinity;
      items.forEach(function (item) {
        var r = item.getBoundingClientRect();
        var c = r.left + r.width * 0.5;
        var d = Math.abs(c - mid);
        if (d < bestDist) {
          bestDist = d;
          best = item;
        }
      });
      items.forEach(function (item) {
        item.classList.toggle("is-active", item === best);
      });

      if (best && best !== lastActiveItem) {
        lastActiveItem = best;
        items.forEach(function (item) {
          var vid = item.querySelector("video");
          if (!vid) return;
          if (item === best) {
            var playPromise = vid.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(function () {});
            }
          } else {
            vid.pause();
          }
        });
      }
    }

    function syncDesktopStickySpan() {
      if (!mqDesktop.matches) {
        section.style.removeProperty("--work-gallery-scroll-span");
        return;
      }
      var span = Math.max(220, progressTargetX() * 0.58);
      section.style.setProperty("--work-gallery-scroll-span", Math.ceil(span) + "px");
    }

    function syncDesktopRange() {
      if (!mqDesktop.matches) return;
      var sectionTop = window.scrollY + section.getBoundingClientRect().top;
      var spanRaw = getComputedStyle(section).getPropertyValue("--work-gallery-scroll-span").trim();
      var span = parseFloat(spanRaw);
      if (!Number.isFinite(span) || span <= 0) span = Math.max(220, progressTargetX() * 0.58);
      desktopRange.startY = sectionTop;
      desktopRange.endY = sectionTop + span;
    }

    function syncDesktopScrollLock() {
      if (!mqDesktop.matches) return;
      var targetX = progressTargetX();
      if (targetX <= 0) return;
      var travel = Math.max(1, desktopRange.endY - desktopRange.startY);
      var progress = clamp01((window.scrollY - desktopRange.startY) / travel);
      track.scrollLeft = progress * targetX;
      syncGalleryUi();
    }

    function requestSyncAll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        syncDesktopStickySpan();
        syncDesktopRange();
        syncDesktopScrollLock();
        if (!mqDesktop.matches) syncGalleryUi();
      });
    }

    function onManualScroll() {
      if (mqDesktop.matches) return;
      window.requestAnimationFrame(function () {
        syncGalleryUi();
      });
    }

    track.addEventListener("scroll", onManualScroll, { passive: true });
    window.addEventListener("resize", requestSyncAll);
    window.addEventListener("scroll", requestSyncAll, { passive: true });
    if ("onscrollend" in window) track.addEventListener("scrollend", onManualScroll);
    mqDesktop.addEventListener("change", requestSyncAll);
    requestSyncAll();
  })();

  /* Value props: shared left detail rail driven by hover/focus (desktop fine pointer only) */
  var bitesStage = document.querySelector("[data-bites-stage]");
  if (bitesStage) {
    var mqBitesRail = window.matchMedia("(min-width: 640px) and (hover: hover) and (pointer: fine)");
    var rail = bitesStage.querySelector(".value-props-bites__rail");
    var biteItems = bitesStage.querySelectorAll(".value-props-bites__item[data-bite-index]");
    var bitePanels = rail
      ? rail.querySelectorAll(".value-props-bites__detail-panel[data-bite-index]")
      : [];
    var biteHideTimer = null;
    var BITE_LEAVE_MS = 140;

    function biteIndexFromEl(el) {
      if (!el || !el.getAttribute) return null;
      var raw = el.getAttribute("data-bite-index");
      if (raw === null || raw === "") return null;
      var n = parseInt(raw, 10);
      return Number.isNaN(n) ? null : n;
    }

    function biteRailEnabled() {
      return !!(mqBitesRail.matches && rail && biteItems.length && bitePanels.length);
    }

    function setBitePanelActive(index) {
      if (!rail || !bitePanels.length) return;
      bitePanels.forEach(function (panel) {
        var i = biteIndexFromEl(panel);
        if (i === null) return;
        if (i === index) {
          panel.classList.add("is-active");
          panel.setAttribute("aria-hidden", "false");
        } else {
          panel.classList.remove("is-active");
          panel.setAttribute("aria-hidden", "true");
        }
      });
    }

    function clearBiteHideTimer() {
      if (biteHideTimer) {
        window.clearTimeout(biteHideTimer);
        biteHideTimer = null;
      }
    }

    function scheduleBiteHide() {
      if (!biteRailEnabled()) return;
      clearBiteHideTimer();
      biteHideTimer = window.setTimeout(function () {
        biteHideTimer = null;
        biteItems.forEach(function (li) {
          li.classList.remove("is-bite-active");
        });
        setBitePanelActive(null);
      }, BITE_LEAVE_MS);
    }

    function activateBite(index) {
      if (!biteRailEnabled()) return;
      clearBiteHideTimer();
      biteItems.forEach(function (li) {
        li.classList.toggle("is-bite-active", biteIndexFromEl(li) === index);
      });
      setBitePanelActive(index);
    }

    function syncBiteRailAria() {
      if (!rail) return;
      var en = biteRailEnabled();
      rail.setAttribute("aria-hidden", en ? "false" : "true");
      biteItems.forEach(function (li) {
        var h3 = li.querySelector("h3");
        var idx = biteIndexFromEl(li);
        if (!h3 || idx === null) return;
        if (en) h3.setAttribute("aria-describedby", "vp-bite-desc-" + idx);
        else h3.removeAttribute("aria-describedby");
      });
      if (!en) {
        clearBiteHideTimer();
        biteItems.forEach(function (li) {
          li.classList.remove("is-bite-active");
        });
        setBitePanelActive(null);
      }
    }

    biteItems.forEach(function (li) {
      li.addEventListener("mouseenter", function () {
        var idx = biteIndexFromEl(li);
        if (idx !== null) activateBite(idx);
      });
      li.addEventListener("mouseleave", scheduleBiteHide);
      li.addEventListener("focusin", function () {
        var idx = biteIndexFromEl(li);
        if (idx !== null) activateBite(idx);
      });
    });

    bitesStage.addEventListener("focusout", function (e) {
      if (!biteRailEnabled()) return;
      var next = e.relatedTarget;
      if (next && bitesStage.contains(next)) return;
      scheduleBiteHide();
    });

    mqBitesRail.addEventListener("change", syncBiteRailAria);
    syncBiteRailAria();
  }

  /* Home hero: actual WebGL text distortion (velocity + pointer). */
  (function initHeroWordmarkWebGL() {
    var wrap = document.querySelector("[data-fluid-wordmark]");
    if (!wrap || !document.body.classList.contains("page-home")) return;
    var canvas = wrap.querySelector(".hero--home__wordmark-canvas");
    var fallbackText = wrap.querySelector(".hero--home__wordmark");
    if (!canvas || !fallbackText) return;

    var mqOk =
      window.matchMedia("(min-width: 960px)").matches &&
      window.matchMedia("(prefers-reduced-motion: no-preference)").matches &&
      window.matchMedia("(hover: hover)").matches &&
      window.matchMedia("(pointer: fine)").matches;
    if (!mqOk) return;

    var gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return;

    function createShader(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return null;
      }
      return shader;
    }

    var vertexSrc =
      "attribute vec2 a_position;\n" +
      "varying vec2 v_uv;\n" +
      "void main(){\n" +
      "  v_uv = (a_position + 1.0) * 0.5;\n" +
      "  gl_Position = vec4(a_position, 0.0, 1.0);\n" +
      "}";

    var fragmentSrc =
      "precision mediump float;\n" +
      "uniform sampler2D u_text;\n" +
      "uniform vec2 u_mouse;\n" +
      "uniform vec2 u_trailPos[12];\n" +
      "uniform float u_trailW[12];\n" +
      "uniform vec2 u_velocity;\n" +
      "uniform float u_strength;\n" +
      "uniform float u_radius;\n" +
      "uniform float u_time;\n" +
      "uniform float u_alpha;\n" +
      "uniform float u_aspect;\n" +
      "varying vec2 v_uv;\n" +
      "float n(vec2 p){\n" +
      "  return sin(p.x)*cos(p.y);\n" +
      "}\n" +
      "void main(){\n" +
      "  vec2 uv = v_uv;\n" +
      "  vec2 texUv = vec2(uv.x, 1.0 - uv.y);\n" +
      "  vec2 nuv = vec2(uv.x * u_aspect, uv.y);\n" +
      "  vec2 m = u_mouse;\n" +
      "  vec2 d = uv - m;\n" +
      "  d.x *= u_aspect;\n" +
      "  float dist = length(d);\n" +
      "  float mask = 0.0;\n" +
      "  for (int i = 0; i < 12; i++) {\n" +
      "    vec2 td = uv - u_trailPos[i];\n" +
      "    td.x *= u_aspect;\n" +
      "    float tdLen = length(td);\n" +
      "    float tMaskCore = smoothstep(u_radius, 0.0, tdLen) * u_trailW[i];\n" +
      "    float tMaskSpread = smoothstep(u_radius * 1.9, 0.0, tdLen) * u_trailW[i] * 0.42;\n" +
      "    mask += tMaskCore + tMaskSpread;\n" +
      "  }\n" +
      "  mask = clamp(mask, 0.0, 1.0) * u_alpha;\n" +
      "  vec2 velDir = normalize(u_velocity + vec2(0.0001));\n" +
      "  vec2 swirl = vec2(-d.y, d.x);\n" +
      "  float noiseA = n((nuv * 288.0) + vec2(u_time * 1.65, -u_time * 1.18));\n" +
      "  float noiseB = n((nuv * 556.0) + vec2(-u_time * 2.15, u_time * 1.56));\n" +
      "  float noiseC = n((nuv * 834.0) + vec2(u_time * 2.5, u_time * 2.2));\n" +
      "  float noiseD = n((nuv * 1100.0) + vec2(-u_time * 2.95, -u_time * 2.4));\n" +
      "  float noise = (noiseA * 0.33) + (noiseB * 0.28) + (noiseC * 0.23) + (noiseD * 0.16);\n" +
      "  vec2 offset = (velDir * 0.028 + swirl * 0.39 * noise) * u_strength * mask;\n" +
      "  vec4 sampleCol = texture2D(u_text, texUv + vec2(offset.x, -offset.y));\n" +
      "  float a = sampleCol.a;\n" +
      "  vec3 ink = vec3(0.0824, 0.0824, 0.0824);\n" +
      "  gl_FragColor = vec4(ink * a, a);\n" +
      "}";

    var vs = createShader(gl.VERTEX_SHADER, vertexSrc);
    var fs = createShader(gl.FRAGMENT_SHADER, fragmentSrc);
    if (!vs || !fs) return;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    var posLoc = gl.getAttribLocation(program, "a_position");
    var textLoc = gl.getUniformLocation(program, "u_text");
    var mouseLoc = gl.getUniformLocation(program, "u_mouse");
    var trailPosLoc = gl.getUniformLocation(program, "u_trailPos[0]");
    var trailWLoc = gl.getUniformLocation(program, "u_trailW[0]");
    var velocityLoc = gl.getUniformLocation(program, "u_velocity");
    var strengthLoc = gl.getUniformLocation(program, "u_strength");
    var radiusLoc = gl.getUniformLocation(program, "u_radius");
    var timeLoc = gl.getUniformLocation(program, "u_time");
    var alphaLoc = gl.getUniformLocation(program, "u_alpha");
    var aspectLoc = gl.getUniformLocation(program, "u_aspect");

    var quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    var textCanvas = document.createElement("canvas");
    var textCtx = textCanvas.getContext("2d");
    if (!textCtx) return;
    var textTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var simPadX = 0.16;
    var simPadY = 0.24;
    var rect = wrap.getBoundingClientRect();
    var state = {
      mouseX: 0.5,
      mouseY: 0.5,
      anchorX: 0.5,
      anchorY: 0.5,
      velX: 0,
      velY: 0,
      smoothX: 0,
      smoothY: 0,
      lastX: 0.5,
      lastY: 0.5,
      lastT: 0,
      active: false,
      trailEnergy: 0,
      lastTrailPushT: 0,
      trail: [
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
        { x: 0.5, y: 0.5, w: 0, vx: 0, vy: 0 },
      ],
    };

    function drawWordmarkTexture(width, height) {
      textCanvas.width = width;
      textCanvas.height = height;
      textCtx.clearRect(0, 0, width, height);
      var cs = window.getComputedStyle(fallbackText);
      var fontSize = parseFloat(cs.fontSize || "64") * dpr;
      var fontWeight = cs.fontWeight || "900";
      var family = cs.fontFamily || "sans-serif";
      textCtx.fillStyle = cs.color || "#353535";
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      textCtx.font = fontWeight + " " + fontSize + "px " + family;
      textCtx.fillText(
        fallbackText.textContent || "MONORIGHT",
        width * 0.5,
        height * 0.5
      );
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    }

    function resize() {
      rect = wrap.getBoundingClientRect();
      var simWidthCss = rect.width * (1 + simPadX * 2);
      var simHeightCss = rect.height * (1 + simPadY * 2);
      var w = Math.max(2, Math.floor(simWidthCss * dpr));
      var h = Math.max(2, Math.floor(simHeightCss * dpr));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = simWidthCss + "px";
      canvas.style.height = simHeightCss + "px";
      canvas.style.left = -(rect.width * simPadX) + "px";
      canvas.style.top = -(rect.height * simPadY) + "px";
      gl.viewport(0, 0, w, h);
      drawWordmarkTexture(w, h);
    }

    function onPointerMove(e) {
      var r = wrap.getBoundingClientRect();
      var x = (e.clientX - r.left) / Math.max(1, r.width);
      var y = (e.clientY - r.top) / Math.max(1, r.height);
      if (x < 0 || y < 0 || x > 1 || y > 1) return;
      var now = performance.now();
      if (!state.lastT) state.lastT = now;
      var dt = Math.max(10.4, now - state.lastT);
      state.lastT = now;
      state.velX = ((x - state.lastX) / dt) * 16.67;
      state.velY = ((y - state.lastY) / dt) * 16.67;
      state.lastX = x;
      state.lastY = y;
      var simX = (x + simPadX) / (1 + simPadX * 2);
      var simY = (y + simPadY) / (1 + simPadY * 2);
      state.mouseX = simX;
      state.mouseY = 1 - simY;
      state.active = true;
      // Push trail points at a cadence so effect doesn't pin to cursor.
      if (!state.lastTrailPushT || now - state.lastTrailPushT > 34) {
        state.lastTrailPushT = now;
        var ejectScale = Math.min(0.18, Math.hypot(state.smoothX, state.smoothY) * 0.24 + 0.02);
        state.trail.unshift({
          x: state.mouseX,
          y: state.mouseY,
          w: 0.9,
          // Eject opposite cursor direction, then let gravity pull down.
          vx: -state.smoothX * ejectScale,
          vy: -state.smoothY * ejectScale,
        });
        if (state.trail.length > 12) state.trail.length = 12;
      }
    }

    function onPointerLeave() {
      state.active = false;
    }

    function frame(t) {
      var follow = state.active ? 0.24 : 0.11;
      state.smoothX += (state.velX - state.smoothX) * follow;
      state.smoothY += (state.velY - state.smoothY) * follow;
      // Lagged anchor gives the "released/frozen" water feel even while hovering.
      var anchorFollow = state.active ? 0.07 : 0.03;
      state.anchorX += (state.mouseX - state.anchorX) * anchorFollow;
      state.anchorY += (state.mouseY - state.anchorY) * anchorFollow;
      if (!state.active) {
        state.velX *= 0.965;
        state.velY *= 0.965;
      }
      var speed = Math.hypot(state.smoothX, state.smoothY);
      state.trailEnergy = Math.max(state.trailEnergy * 0.94, speed);
      for (var i = 0; i < state.trail.length; i++) {
        var p = state.trail[i];
        // Particle drift physics: opposite-velocity launch + downward tendency.
        p.vy -= 0.00135;
        p.vx *= 0.96;
        p.vy *= 0.975;
        p.x += p.vx;
        p.y += p.vy;
        p.x = Math.max(-simPadX, Math.min(1 + simPadX, p.x));
        p.y = Math.max(-simPadY, Math.min(1 + simPadY, p.y));
        p.w *= state.active ? 0.965 : 0.93;
      }
      var strength = Math.min(13.5, speed * 52.0 + state.trailEnergy * 24.0 + (state.active ? 0.95 : 0.0));
      var radius = Math.min(0.52, 0.34 + speed * 0.5);
      var alpha = Math.min(1.0, speed * 24.0 + state.trailEnergy * 5.2 + (state.active ? 0.34 : 0.0));

      var trailPos = new Float32Array(24);
      var trailW = new Float32Array(12);
      for (var j = 0; j < 12; j++) {
        var tp = state.trail[j] || state.trail[state.trail.length - 1] || { x: state.mouseX, y: state.mouseY, w: 0 };
        trailPos[j * 2] = tp.x;
        trailPos[j * 2 + 1] = tp.y;
        trailW[j] = tp.w;
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.uniform1i(textLoc, 0);
      gl.uniform2f(mouseLoc, state.anchorX, state.anchorY);
      gl.uniform2fv(trailPosLoc, trailPos);
      gl.uniform1fv(trailWLoc, trailW);
      gl.uniform2f(velocityLoc, state.smoothX, state.smoothY);
      gl.uniform1f(strengthLoc, strength);
      gl.uniform1f(radiusLoc, radius);
      gl.uniform1f(timeLoc, t * 0.001);
      gl.uniform1f(alphaLoc, alpha);
      gl.uniform1f(aspectLoc, rect.width / Math.max(1, rect.height));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      window.requestAnimationFrame(frame);
    }

    wrap.classList.add("is-webgl-active");
    resize();
    wrap.addEventListener("pointermove", onPointerMove, { passive: true });
    wrap.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", resize);
    window.requestAnimationFrame(frame);
  })();
})();
