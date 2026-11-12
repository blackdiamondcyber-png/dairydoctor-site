/* Advanced Dairy Diagnostics & Consulting: navigation, the barn card
   disclosure and scroll motion (progressive enhancement). No dependencies. Every menu is a
   <details>, so the site navigates fully without this file, and
   [data-reveal] content is visible through CSS alone. */
(function () {
  'use strict';

  /* Navigation: this only adds one menu open at a time, close on an outside
     click, close on Escape (focus returns to its summary), and close after a
     link is followed. */
  var navDetails = Array.prototype.slice.call(document.querySelectorAll('.site-nav details'));

  function closeNav(except) {
    navDetails.forEach(function (d) {
      if (d !== except) d.removeAttribute('open');
    });
  }

  navDetails.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) closeNav(d);
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.site-nav')) closeNav(null);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = navDetails.filter(function (d) { return d.open; });
    if (!open.length) return;
    var summary = open[open.length - 1].querySelector('summary');
    closeNav(null);
    if (summary) summary.focus();
  });

  Array.prototype.forEach.call(document.querySelectorAll('.site-nav a'), function (a) {
    a.addEventListener('click', function () { closeNav(null); });
  });

  /* 404.html writes a <base> so its links work at any missing path. That
     would send "#main" (the skip link) to the home page, so on a page with
     a <base>, same-page links are handled here. No other page has a <base>. */
  if (document.querySelector('base')) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      var t = id && document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      t.focus();
      t.scrollIntoView();
    });
  }

  /* New client form (contact.html, form[data-reach]): a phone number OR an
     email is enough. If both are empty, stop the send, say so in the
     aria-live line and put the visitor in the phone field. Without this
     file only the name is required. */
  var reach = document.querySelector('form[data-reach]');
  if (reach) {
    var phone = reach.querySelector('input[type="tel"]');
    var email = reach.querySelector('input[type="email"]');
    var reachMsg = reach.querySelector('.form-message');
    var reachable = function () {
      return !!(phone.value.trim() || email.value.trim());
    };
    reach.addEventListener('submit', function (e) {
      if (reachable()) return;
      e.preventDefault();
      reachMsg.textContent = 'Please give a phone number or an email so the lab can reach you.';
      phone.focus();
    });
    reach.addEventListener('input', function () {
      if (reachMsg.textContent && reachable()) reachMsg.textContent = '';
    });
  }

  /* "Email this to your vet" (a[data-mail-page="herd-vet"]): the message
     body carries this page's own address plus the section, so the link
     works on the preview and on the final domain alike. */
  Array.prototype.forEach.call(document.querySelectorAll('a[data-mail-page]'), function (a) {
    var url = location.href.split('#')[0] + '#' + a.getAttribute('data-mail-page');
    a.href += '&body=' + encodeURIComponent(url);
  });

  /* Barn card (shipping_test.html, <details class="barn-card-details">): shut
     behind "Show the barn card" on phones, open from 768 px (R4 ruling 11),
     and always open on paper. Without this file it starts shut everywhere
     and one tap opens it. */
  var barn = document.querySelector('.barn-card-details');
  if (barn) {
    var wide = window.matchMedia ? window.matchMedia('(min-width: 768px)') : null;
    if (wide && wide.matches) barn.open = true;
    var barnWasOpen = null;
    window.addEventListener('beforeprint', function () {
      barnWasOpen = barn.open;
      barn.open = true;
    });
    window.addEventListener('afterprint', function () {
      if (barnWasOpen !== null) barn.open = barnWasOpen;
      barnWasOpen = null;
    });
  }

  /* Scroll reveal: skipped for reduced motion and for browsers without
     IntersectionObserver; content then simply shows. */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (!revealEls.length) return;

  /* The observer's first report covers every block. Whatever is on screen
     then is shown at once with no fade, and only after that does js-motion
     hide the blocks further down, so nothing visible ever blinks out. */
  var firstReport = true;
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (firstReport) entry.target.classList.add('now');
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
      if (firstReport) {
        firstReport = false;
        document.documentElement.classList.add('js-motion');
      }
    },
    /* A low threshold plus a positive bottom rootMargin makes sections fade
       in just before they scroll into view, so a tall section never sits
       blank on a short screen. */
    { threshold: 0.01, rootMargin: '0px 0px 8% 0px' }
  );

  revealEls.forEach(function (el) {
    io.observe(el);
  });
})();
