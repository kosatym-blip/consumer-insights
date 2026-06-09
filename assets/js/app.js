/* ============================================================================
   Consumer Insights — motion & interaction helper (vanilla, no deps)
   Generated-site version: same as prototype + working community cut +
   real ZIP download (no placeholder interception).
   Respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onView(el, cb, opts) {
    if (!("IntersectionObserver" in window) || reduceMotion) { cb(el); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); }
      });
    }, opts || { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
  }

  function formatNum(n) { return Math.round(n).toLocaleString("ru-RU"); }

  /* ---- count-up ---- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = prefix + formatNum(target) + suffix; return; }
    var dur = 1500, start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + formatNum(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + formatNum(target) + suffix;
    }
    requestAnimationFrame(tick);
  }

  document.querySelectorAll(".reveal").forEach(function (el) {
    onView(el, function (t) { t.classList.add("is-visible"); });
  });
  document.querySelectorAll("[data-count]").forEach(function (el) { onView(el, countUp); });
  document.querySelectorAll(".emotion__fill").forEach(function (el) {
    var v = el.getAttribute("data-val");
    onView(el, function (t) { t.style.width = v + "%"; }, { threshold: 0.4 });
  });

  /* ---- brand bars ---- */
  (function () {
    var fills = Array.prototype.slice.call(document.querySelectorAll(".brand-row__fill"));
    if (!fills.length) return;
    var max = fills.reduce(function (m, f) {
      return Math.max(m, parseFloat(f.getAttribute("data-val")) || 0);
    }, 0);
    fills.forEach(function (f) {
      var v = parseFloat(f.getAttribute("data-val")) || 0;
      var pct = max ? (v / max) * 100 : 0;
      onView(f, function (t) { t.style.width = pct + "%"; }, { threshold: 0.3 });
    });
  })();

  /* ---- expanders ---- */
  document.querySelectorAll("[data-expander]").forEach(function (wrap) {
    var btn = wrap.querySelector(".expander__btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = wrap.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---- brand detail toggles ---- */
  document.querySelectorAll(".brand-row__toggle").forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      var row = toggle.closest(".brand-row");
      if (row) row.classList.toggle("is-open");
    });
  });

  /* ---- run selector ---- */
  document.querySelectorAll(".run-select").forEach(function (sel) {
    var btn = sel.querySelector(".run-select__btn");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      sel.classList.toggle("is-open");
    });
    sel.querySelectorAll(".run-select__item").forEach(function (item) {
      item.addEventListener("click", function () {
        sel.querySelectorAll(".run-select__item").forEach(function (i) {
          i.removeAttribute("aria-current");
        });
        item.setAttribute("aria-current", "true");
        var label = item.getAttribute("data-label");
        var lblEl = btn.querySelector("[data-run-label]");
        if (label && lblEl) lblEl.textContent = label;
        sel.classList.remove("is-open");
      });
    });
    document.addEventListener("click", function () { sel.classList.remove("is-open"); });
  });

  /* ---- cut / filter chips + community cut + honesty toggle ----
     All filters compose: type/sort chip × community select × proven toggle. */
  (function () {
    var bar = document.querySelector("[data-cutbar]");
    if (!bar) return;
    var grid = document.querySelector("[data-themes]");
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".theme-card"));
    var originalOrder = cards.slice();

    var state = { type: "all", community: "all", provenOnly: false, sortHot: false };

    function cardCommunities(c) {
      return (c.getAttribute("data-communities") || "")
        .split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    }

    function matches(c) {
      // proven toggle
      if (state.provenOnly && c.getAttribute("data-status") !== "proven") return false;
      // type cut
      if (state.type !== "all") {
        if (c.getAttribute("data-type") !== state.type) return false;
      }
      // community cut
      if (state.community !== "all") {
        if (cardCommunities(c).indexOf(state.community) === -1) return false;
      }
      return true;
    }

    function render() {
      // restore base order, then optionally sort hottest first
      originalOrder.forEach(function (c) { grid.appendChild(c); });
      if (state.sortHot) {
        cards.slice().sort(function (a, b) {
          return (parseInt(b.getAttribute("data-emotion"), 10) || 0) -
                 (parseInt(a.getAttribute("data-emotion"), 10) || 0);
        }).forEach(function (c) { grid.appendChild(c); });
      }
      cards.forEach(function (c) { c.classList.toggle("is-hidden", !matches(c)); });
    }

    bar.querySelectorAll(".cut-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-filter");
        bar.querySelectorAll(".cut-chip").forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        if (f === "emotion") {
          state.sortHot = true;
          // keep current type filter; "hot" is a sort, not a type
        } else {
          state.sortHot = false;
          state.type = f;
        }
        render();
      });
    });

    var commSel = bar.querySelector("[data-community-select]");
    if (commSel) {
      commSel.addEventListener("change", function () {
        state.community = commSel.value || "all";
        render();
      });
    }

    var honestyToggle = bar.querySelector("[data-honesty-toggle]");
    if (honestyToggle) {
      honestyToggle.addEventListener("change", function () {
        state.provenOnly = honestyToggle.checked;
        render();
      });
    }
  })();

})();
