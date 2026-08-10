/* Advanced Dairy Diagnostic & Consulting - nav + scroll motion (progressive
   enhancement). No dependencies. If this fails to load, nav-group triggers
   are real links to sensible pages, and [data-reveal] is visible via CSS
   alone. Nav-dropdown logic runs unconditionally (core nav, not motion). */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var groups = document.querySelectorAll('.nav-group');
  var openGroup = null;
  var hoverCapable = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)');

  function closeGroup(g) {
    if (!g) return;
    g.trigger.setAttribute('aria-expanded', 'false');
    g.panel.classList.remove('is-open');
    if (openGroup === g) openGroup = null;
  }

  function openGroupNow(g) {
    if (openGroup && openGroup !== g) closeGroup(openGroup);
    g.trigger.setAttribute('aria-expanded', 'true');
    g.panel.classList.add('is-open');
    openGroup = g;
  }

  groups.forEach(function (el) {
    var trigger = el.querySelector('.nav-group-trigger');
    var panel = el.querySelector('.nav-panel');
    if (!trigger || !panel) return;
    var g = { el: el, trigger: trigger, panel: panel };

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (trigger.getAttribute('aria-expanded') === 'true') closeGroup(g);
      else openGroupNow(g);
    });

    el.addEventListener('mouseenter', function () {
      if (hoverCapable && hoverCapable.matches) openGroupNow(g);
    });
    el.addEventListener('mouseleave', function () {
      if (hoverCapable && hoverCapable.matches) closeGroup(g);
    });

    el.addEventListener('focusout', function (e) {
      if (!el.contains(e.relatedTarget)) closeGroup(g);
    });
  });

  document.addEventListener('click', function (e) {
    if (openGroup && !openGroup.el.contains(e.target)) closeGroup(openGroup);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openGroup) {
      var t = openGroup.trigger;
      closeGroup(openGroup);
      t.focus();
    }
  });

  if (reduceMotion) return;

  document.documentElement.classList.add('js-motion');

  function startCounts(root) {
    var els = root.hasAttribute && root.hasAttribute('data-count') ? [root] : root.querySelectorAll('[data-count]');
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        if (el.dataset.counted) return;
        el.dataset.counted = '1';
        var target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) return;
        var duration = 900;
        var start = null;
        function tick(ts) {
          if (start === null) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          el.textContent = Math.round(target * progress);
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = String(target);
        }
        requestAnimationFrame(tick);
      })(els[i]);
    }
  }

  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            startCounts(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('in');
      startCounts(el);
    });
  }

  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
