/* Advanced Dairy Diagnostics & Consulting - on-page tools (progressive
   enhancement). Every tool lives in a [data-tool] container whose static
   HTML already says the same thing in words; this script only adds the
   interactive version. No dependencies, no network. */
(function () {
  "use strict";

  var DAY = 86400000;
  var MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  var DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  function fmt(d) {
    return (
      DAYS[d.getDay()] +
      ", " +
      MONTHS[d.getMonth()] +
      " " +
      d.getDate() +
      ", " +
      d.getFullYear()
    );
  }
  function addDays(d, n) {
    var x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    return x;
  }
  function parseDate(v) {
    if (!v) return null;
    var p = v.split("-");
    if (p.length !== 3) return null;
    var d = new Date(
      parseInt(p[0], 10),
      parseInt(p[1], 10) - 1,
      parseInt(p[2], 10),
    );
    return isNaN(d.getTime()) ? null : d;
  }
  function isoToday() {
    var t = new Date();
    return (
      t.getFullYear() +
      "-" +
      ("0" + (t.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + t.getDate()).slice(-2)
    );
  }
  /* The lab reports on Thursday. Samples that arrive by Wednesday go out in
     that week's report; anything arriving Thursday or later waits a week. */
  function reportThursday(arrival) {
    var dow = arrival.getDay(); // 0 Sun .. 6 Sat
    var toThu = (4 - dow + 7) % 7; // days until Thursday
    if (dow <= 3) return addDays(arrival, toThu); // Sun..Wed -> this Thursday
    return addDays(arrival, toThu === 0 ? 7 : toThu); // Thu..Sat -> next Thursday
  }
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function on(el, ev, fn) {
    if (el) el.addEventListener(ev, fn);
  }

  /* ---------------- 1. "When can I test?" ---------------- */
  var WAIT = { cattle: 28, heifer: 25, small: 30 };
  var LABEL = {
    cattle: "cows and bison",
    heifer: "virgin heifers",
    small: "goats and sheep",
  };
  $all('[data-tool="timing"]').forEach(function (root) {
    var species = $('select[name="species"]', root);
    var bred = $('input[name="bred"]', root);
    var transit = $('select[name="transit"]', root);
    var out = $(".tool-out", root);
    if (!species || !bred || !out) return;
    if (!bred.value) bred.value = isoToday();
    function run() {
      var d = parseDate(bred.value);
      if (!d) {
        out.innerHTML =
          '<p class="muted">Enter the breeding date to see the earliest sample date.</p>';
        return;
      }
      var wait = WAIT[species.value] || 28;
      var earliest = addDays(d, wait);
      var today = parseDate(isoToday());
      var days = transit ? parseInt(transit.value, 10) : 2;
      var sample = earliest > today ? earliest : today;
      var arrival = addDays(sample, days);
      var report = reportThursday(arrival);
      var html = "";
      html +=
        "<p><strong>Earliest sample date:</strong> " +
        fmt(earliest) +
        " (" +
        wait +
        " days after breeding for " +
        LABEL[species.value] +
        ").</p>";
      if (earliest > today) {
        html +=
          "<p>Draw on or after that day. If you ship the same day and it arrives in " +
          days +
          " day" +
          (days === 1 ? "" : "s") +
          ", the report comes back <strong>" +
          fmt(report) +
          "</strong>.</p>";
      } else {
        html +=
          "<p>That date has passed, so the animal can be sampled now. Ship today and the report comes back <strong>" +
          fmt(report) +
          "</strong>.</p>";
      }
      html +=
        '<p class="muted">Cows should also be at least 90 days since calving. Results are reported on Thursdays for samples that reach the lab by Wednesday.</p>';
      out.innerHTML = html;
    }
    on(species, "change", run);
    on(bred, "input", run);
    on(transit, "change", run);
    run();
  });

  /* ---------------- 2. Ship-by planner ---------------- */
  $all('[data-tool="shipby"]').forEach(function (root) {
    var ship = $('input[name="ship"]', root);
    var transit = $('select[name="transit"]', root);
    var kind = $('select[name="kind"]', root);
    var out = $(".tool-out", root);
    if (!ship || !transit || !out) return;
    if (!ship.value) ship.value = isoToday();
    function run() {
      var d = parseDate(ship.value);
      if (!d) {
        out.innerHTML = '<p class="muted">Pick the day you can ship.</p>';
        return;
      }
      var days = parseInt(transit.value, 10);
      var arrival = addDays(d, days);
      var report = reportThursday(arrival);
      var late = arrival.getDay() >= 4 || arrival.getDay() === 0;
      var bvd = kind && kind.value === "bvd";
      var html =
        "<p><strong>Arrives:</strong> " +
        fmt(arrival) +
        ".<br><strong>Report:</strong> " +
        fmt(report) +
        ".</p>";
      if (late) {
        html +=
          "<p>That arrival misses the Wednesday cutoff, so the samples wait for the following Thursday. Shipping on Monday or Tuesday usually makes the same week.</p>";
      } else {
        html += "<p>That makes the same week's report.</p>";
      }
      if (bvd) {
        html +=
          "<p><strong>Ear notches and BVD blood ship cold.</strong> Refrigerate before shipping and pack with ice packs." +
          (days > 2
            ? " This transit is longer than 48 hours: call the lab first for instructions."
            : " Aim for arrival within 48 hours of collection.") +
          "</p>";
      } else {
        html +=
          '<p class="muted">Pregnancy blood tubes do not need ice. Pad the tubes well and keep the form and payment in their own bag.</p>';
      }
      out.innerHTML = html;
    }
    on(ship, "input", run);
    on(transit, "change", run);
    on(kind, "change", run);
    run();
  });

  /* ---------------- 3. Which form do I need? ---------------- */
  var FORMS = {
    preg_cattle: {
      name: "Cattle & Bison Pregnancy Test Submission Form",
      href: "ADDC%20Preg%20Submission%20Form.pdf",
      note: "2cc of blood in a red-top tube, no ice needed.",
    },
    preg_small: {
      name: "Small Ruminant Pregnancy Test Form (goats and sheep)",
      href: "Farm%20Pregnancy%20Test.pdf",
      note: "2cc of blood in a red-top tube, no ice needed, 30 or more days after breeding.",
    },
    bvd: {
      name: "BVD PI Test Form (blood or ear notch)",
      href: "BVD_PI_Test.pdf",
      note: "Ship refrigerated with ice packs; reach the lab within 48 hours of collection.",
    },
    other: {
      name: "Call the lab first",
      href: "tel:+17156532201",
      note: "Johnes, Leukosis, Mycoplasma and other monitoring are set up by phone so the right samples go in the box.",
    },
  };
  $all('[data-tool="chooser"]').forEach(function (root) {
    var species = $('select[name="species"]', root);
    var test = $('select[name="test"]', root);
    var out = $(".tool-out", root);
    if (!species || !test || !out) return;
    function run() {
      var key;
      if (test.value === "bvd") key = "bvd";
      else if (test.value === "other") key = "other";
      else key = species.value === "small" ? "preg_small" : "preg_cattle";
      if (test.value === "bvd" && species.value === "small") {
        out.innerHTML =
          '<p>BVD PI testing is for cattle and bison. For goats and sheep, call the lab and ask about disease monitoring.</p><p><a class="btn btn-outline" href="tel:+17156532201">Call (715) 653-2201</a></p>';
        return;
      }
      var f = FORMS[key];
      var isTel = f.href.indexOf("tel:") === 0;
      out.innerHTML =
        "<p><strong>" +
        f.name +
        '</strong><br><span class="muted">' +
        f.note +
        '</span></p><p><a class="btn btn-outline" href="' +
        f.href +
        '">' +
        (isTel ? "Call (715) 653-2201" : "Download the form (PDF)") +
        "</a></p>";
    }
    on(species, "change", run);
    on(test, "change", run);
    run();
  });

  /* ---------------- 4. BVD program planner ---------------- */
  $all('[data-tool="bvdplan"]').forEach(function (root) {
    var herd = $('input[name="herd"]', root);
    var pattern = $('select[name="pattern"]', root);
    var status = $('select[name="status"]', root);
    var out = $(".tool-out", root);
    if (!herd || !pattern || !status || !out) return;
    function run() {
      var n = parseInt(herd.value, 10);
      if (!n || n < 1) {
        out.innerHTML =
          '<p class="muted">Enter the number of breeding females.</p>';
        return;
      }
      var calvesYear = Math.round(n * 0.9);
      var html = '<ol class="tight">';
      if (status.value === "never") {
        html +=
          "<li><strong>Initial screen:</strong> every animal on the place once, about " +
          n +
          " breeding females plus calves, bulls and replacements. Ear notch anything under a year old; blood or notch for adults.</li>";
      } else {
        html +=
          "<li><strong>Initial screen:</strong> already done. The program below keeps the herd clean.</li>";
      }
      if (pattern.value === "year") {
        var perWeek = Math.max(1, Math.round(calvesYear / 52));
        html +=
          "<li><strong>Calves:</strong> roughly " +
          calvesYear +
          " a year, about " +
          perWeek +
          " a week. Notch each calf at birth and send one batch a week with the form.</li>";
      } else {
        var weeks = 10;
        var perWeekS = Math.max(1, Math.round(calvesYear / weeks));
        html +=
          "<li><strong>Calves:</strong> roughly " +
          calvesYear +
          " in a " +
          weeks +
          "-week calving season, about " +
          perWeekS +
          " a week at the peak. Notch at birth, batch weekly, and finish before the pairs go to pasture.</li>";
      }
      html +=
        "<li><strong>Purchases:</strong> test every purchased animal, bulls included, before it joins the herd.</li>";
      html +=
        "<li><strong>Positives:</strong> isolate the animal; Dr. Pearson will tell you whether to retest or remove it, and will want the dam tested too.</li>";
      html +=
        "<li><strong>Vaccination:</strong> calves and open adults on a timed schedule he sets for your herd.</li>";
      html +=
        '</ol><p class="muted">Planning estimate only, based on about nine calves per ten breeding females a year. Your numbers replace these on the phone.</p>';
      out.innerHTML = html;
    }
    on(herd, "input", run);
    on(pattern, "change", run);
    on(status, "change", run);
    run();
  });

  /* ---------------- 5. Step-through guide (tail bleeding) ---------------- */
  $all('[data-tool="stepper"]').forEach(function (root) {
    var listSel = root.getAttribute("data-steps");
    var list = listSel ? $(listSel) : null;
    if (!list) return;
    var steps = $all("li", list).map(function (li) {
      return li.innerHTML;
    });
    if (!steps.length) return;
    var i = 0;
    var num = $(".stepper-num", root);
    var text = $(".stepper-text", root);
    var bar = $(".stepper-bar span", root);
    var prev = $(".stepper-prev", root);
    var next = $(".stepper-next", root);
    var fig = $(".stepper-figure", root);
    if (!num || !text || !prev || !next) return;
    var head = list.previousElementSibling;
    if (!(head && head.classList.contains("section-head"))) head = null;
    var nav = $(".stepper-nav", root);
    if (nav) {
      list.hidden = true;
      if (head) head.hidden = true;
      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "btn btn-outline";
      toggle.textContent = "Show all steps";
      on(toggle, "click", function () {
        var show = list.hidden;
        list.hidden = !show;
        if (head) head.hidden = !show;
        toggle.textContent = show ? "Hide the full list" : "Show all steps";
        if (show && head) head.scrollIntoView({ block: "start" });
      });
      nav.appendChild(toggle);
    }
    function render() {
      num.textContent = "Step " + (i + 1) + " of " + steps.length;
      text.innerHTML = steps[i];
      if (bar)
        bar.style.width = Math.round(((i + 1) / steps.length) * 100) + "%";
      prev.disabled = i === 0;
      next.textContent = i === steps.length - 1 ? "Start over" : "Next step";
      if (fig) {
        $all("[data-step]", fig).forEach(function (g) {
          var show =
            g
              .getAttribute("data-step")
              .split(" ")
              .indexOf(String(i + 1)) !== -1;
          g.style.opacity = show ? "1" : "0.18";
        });
      }
    }
    on(prev, "click", function () {
      if (i > 0) i--;
      render();
    });
    on(next, "click", function () {
      i = i === steps.length - 1 ? 0 : i + 1;
      render();
    });
    root.setAttribute("tabindex", "0");
    on(root, "keydown", function (e) {
      if (e.key === "ArrowRight") {
        next.click();
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") {
        prev.click();
        e.preventDefault();
      }
    });
    root.hidden = false;
    render();
  });

  /* ---------------- 6. FAQ search + accordions ---------------- */
  $all('[data-tool="faqsearch"]').forEach(function (root) {
    var input = $("input", root);
    var count = $(".tool-count", root);
    var items = $all("details.faq-item");
    if (!input || !items.length) return;
    var expand = $(".faq-expand", root);
    function run() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (d) {
        var hit = !q || d.textContent.toLowerCase().indexOf(q) !== -1;
        d.hidden = !hit;
        if (hit) shown++;
        if (q && hit) d.open = true;
      });
      $all(".faq-group").forEach(function (g) {
        var any = $all("details.faq-item", g).some(function (d) {
          return !d.hidden;
        });
        $all(".section-head, figure", g).forEach(function (el) {
          el.hidden = !!q && !any;
        });
      });
      if (count)
        count.textContent = q
          ? shown + " of " + items.length + " questions match"
          : items.length + " questions";
      var empty = $(".faq-empty");
      if (!empty) {
        empty = document.createElement("p");
        empty.className = "faq-empty";
        empty.innerHTML =
          'No questions match. Try a shorter word, or call <a href="tel:+17156532201">(715) 653-2201</a>.';
        root.parentNode.insertBefore(empty, root.nextSibling);
      }
      empty.hidden = !(q && shown === 0);
    }
    on(input, "input", run);
    on(expand, "click", function () {
      var anyClosed = items.some(function (d) {
        return !d.open;
      });
      items.forEach(function (d) {
        d.open = anyClosed;
      });
      expand.textContent = anyClosed ? "Collapse all" : "Expand all";
    });
    run();
  });

  /* ---------------- 7. Checklist (supplies, records) ---------------- */
  $all('[data-tool="checklist"]').forEach(function (root) {
    var boxes = $all('input[type="checkbox"]', root);
    var out = $(".tool-out", root);
    var print = $(".tool-print", root);
    if (!boxes.length || !out) return;
    var mode = root.getAttribute("data-mode") || "need";
    function run() {
      var missing = boxes.filter(function (b) {
        return !b.checked;
      });
      if (mode === "have") {
        out.innerHTML = missing.length
          ? '<p><strong>Have ready:</strong></p><ul class="tight">' +
            missing
              .map(function (b) {
                return "<li>" + b.parentNode.textContent.trim() + "</li>";
              })
              .join("") +
            "</ul>"
          : "<p><strong>Everything on the list is in hand.</strong></p>";
      } else {
        out.innerHTML = missing.length
          ? '<p><strong>Order or gather before you sample:</strong></p><ul class="tight">' +
            missing
              .map(function (b) {
                return "<li>" + b.parentNode.textContent.trim() + "</li>";
              })
              .join("") +
            "</ul>"
          : "<p><strong>You have everything. Draw, pack, ship.</strong></p>";
      }
    }
    boxes.forEach(function (b) {
      on(b, "change", run);
    });
    on(print, "click", function () {
      window.print();
    });
    run();
  });

  /* ---------------- 8. Copy to clipboard ---------------- */
  $all("[data-copy]").forEach(function (btn) {
    on(btn, "click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        var was = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(function () {
          btn.textContent = was;
        }, 1600);
      };
      var live = $(".copy-live");
      if (!live) {
        live = document.createElement("span");
        live.className = "sr-only copy-live";
        live.setAttribute("aria-live", "polite");
        document.body.appendChild(live);
      }
      var announce = function () {
        live.textContent = "";
        setTimeout(function () {
          live.textContent = "Address copied to the clipboard";
        }, 50);
        done();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(announce, function () {
          window.prompt("Copy this address:", text);
        });
      } else {
        window.prompt("Copy this address:", text);
      }
    });
  });

  /* ---------------- 9. Form redirect follows the current host ---------------- */
  $all('form input[name="_next"]').forEach(function (inp) {
    if (window.location.protocol.indexOf("http") !== 0) return;
    inp.value =
      window.location.origin +
      window.location.pathname.replace(/[^\/]*$/, "") +
      "thanks.html";
  });

  /* ---------------- 10. Print buttons ---------------- */
  $all("[data-print]").forEach(function (btn) {
    on(btn, "click", function () {
      window.print();
    });
  });
})();
