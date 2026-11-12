/* Advanced Dairy Diagnostics & Consulting: on-page tools (progressive
   enhancement). Every tool lives in a [data-tool] container whose static
   HTML already gives a complete, true answer in words; this script only adds
   the interactive version. Buttons that need the script ship with the hidden
   attribute and are shown here. No dependencies, no network, no storage.
   The date and planner logic is written as small pure functions (each takes
   its inputs and today's date and returns the answer as HTML) so it can be
   tested from node; the browser wiring starts after the "core" block. */
(function () {
  "use strict";

  /* ---------------- Dates ---------------- */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function fmt(d) {
    return DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }
  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function addDays(d, n) {
    var x = startOfDay(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  function daysBetween(a, b) {
    return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
  }
  function iso(d) {
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  /* "YYYY-MM-DD" to a local date. A year before 2000 (a year still being
     typed reads as 0002), after 2100, or an impossible day gives null. */
  function parseDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
    if (!m) return null;
    var y = parseInt(m[1], 10);
    var mo = parseInt(m[2], 10) - 1;
    var da = parseInt(m[3], 10);
    if (y < 2000 || y > 2100) return null;
    var d = new Date(2000, 0, 1);
    d.setFullYear(y, mo, da);
    if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== da) return null;
    return d;
  }
  function isWeekend(d) {
    return d.getDay() === 0 || d.getDay() === 6;
  }

  /* ---- Federal holidays and lab closed days ---- */
  /* Days the owner closes the lab beyond the federal holidays, as ISO dates
     ("2026-12-24"). Empty until he adds some. */
  var LAB_CLOSED = [];

  function nthWeekdayOf(y, mo, wd, n) {
    var first = new Date(y, mo, 1);
    return new Date(y, mo, 1 + ((wd - first.getDay() + 7) % 7) + 7 * (n - 1));
  }
  function lastWeekdayOf(y, mo, wd) {
    var last = new Date(y, mo + 1, 0);
    return new Date(y, mo, last.getDate() - ((last.getDay() - wd + 7) % 7));
  }
  /* A fixed-date holiday on Saturday is observed Friday, on Sunday Monday. */
  function observedOf(y, mo, day) {
    var d = new Date(y, mo, day);
    if (d.getDay() === 6) return addDays(d, -1);
    if (d.getDay() === 0) return addDays(d, 1);
    return d;
  }
  var holidayCache = {};
  /* The year's federal holidays as { "YYYY-MM-DD": "Name" }. */
  function holidaysOf(y) {
    if (holidayCache[y]) return holidayCache[y];
    var h = {};
    function add(d, name) {
      h[iso(d)] = name;
    }
    function fixed(mo, day, name) {
      var o = observedOf(y, mo, day);
      var actual = new Date(y, mo, day);
      h[iso(o)] = name + (o.getTime() === actual.getTime() ? "" : " (observed)");
    }
    fixed(0, 1, "New Year's Day");
    add(nthWeekdayOf(y, 0, 1, 3), "Martin Luther King Jr. Day");
    add(nthWeekdayOf(y, 1, 1, 3), "Presidents Day");
    add(lastWeekdayOf(y, 4, 1), "Memorial Day");
    fixed(5, 19, "Juneteenth");
    fixed(6, 4, "Independence Day");
    add(nthWeekdayOf(y, 8, 1, 1), "Labor Day");
    add(nthWeekdayOf(y, 9, 1, 2), "Columbus Day");
    fixed(10, 11, "Veterans Day");
    add(nthWeekdayOf(y, 10, 4, 4), "Thanksgiving Day");
    fixed(11, 25, "Christmas Day");
    holidayCache[y] = h;
    return h;
  }
  /* Name of the federal holiday observed on d, or "". New Year's Day of the
     next year can be observed on December 31, so next year's list is read too. */
  function holidayName(d) {
    var y = d.getFullYear();
    return holidaysOf(y)[iso(d)] || holidaysOf(y + 1)[iso(d)] || "";
  }
  /* Why d is a day off the lab calendar for a weekday: a holiday name, a
     closed day the owner added, or "". */
  function closedLabel(d) {
    var h = holidayName(d);
    if (h) return h;
    return LAB_CLOSED.indexOf(iso(d)) !== -1 ? "a day the lab is closed" : "";
  }
  /* The lab works Monday to Friday except holidays and LAB_CLOSED days. */
  function isLabClosed(d) {
    return isWeekend(d) || closedLabel(d) !== "";
  }
  /* The first lab day on or after d: a box that lands on a weekend or a
     closed day is counted from the next lab day. */
  function labDay(d) {
    var x = startOfDay(d);
    for (var k = 0; k < 30 && isLabClosed(x); k++) x = addDays(x, 1);
    return x;
  }
  /* Thursday of the week that holds d (d is Monday to Friday). */
  function thursdayOf(d) {
    return addDays(d, 4 - d.getDay());
  }
  /* "Thursday, Nov 26, 2026 is Thanksgiving Day" */
  function closedIs(d) {
    return fmt(d) + " is " + closedLabel(d);
  }
  /* The answer for a report Thursday that is a holiday or closed day: no
     report date, the phone line instead. */
  function reportClosedHtml(d) {
    return "<p>" + closedIs(d) + ". Call " + PHONE + " for that week's report day.</p>";
  }

  /* The one place that decides what a box does. Ship day + days in transit
     give the arrival day; a box that lands on a weekend, holiday or closed
     day counts as arriving the next lab day (count); a box counted Monday to
     Wednesday makes that week's Thursday report, a box counted Thursday or
     Friday makes the next week's. reportClosed names the holiday when that
     Thursday is closed (then no report date may be stated). skipped lists the
     weekday closed days the box waited through. */
  function boxPlan(ship, transit) {
    var arrive = addDays(ship, transit);
    var count = arrive;
    var skipped = [];
    for (var k = 0; k < 30 && isLabClosed(count); k++) {
      if (!isWeekend(count)) skipped.push(count);
      count = addDays(count, 1);
    }
    var missed = count.getDay() > 3;
    var report = addDays(thursdayOf(count), missed ? 7 : 0);
    return {
      ship: ship,
      arrive: arrive,
      count: count,
      missed: missed,
      report: report,
      reportClosed: closedLabel(report),
      skipped: skipped,
      arriveWeekend: isWeekend(arrive),
      arriveClosed: !isWeekend(arrive) && closedLabel(arrive) !== ""
    };
  }
  /* First lab-day ship on or after `from` whose box arrives on a lab day,
     Monday, Tuesday or Wednesday: samples that reach the lab by Wednesday are
     reported Thursday. */
  function firstGoodShip(from, transit) {
    for (var k = 0; k < 28; k++) {
      var s = addDays(from, k);
      if (isLabClosed(s)) continue;
      var plan = boxPlan(s, transit);
      if (!plan.arriveWeekend && !plan.arriveClosed && plan.arrive.getDay() >= 1 && plan.arrive.getDay() <= 3) return plan;
    }
    return null;
  }
  /* Latest lab-day ship whose box (by boxPlan) is in the report on the
     Thursday after Wednesday w. A cold box must also land on a lab day.
     null when no day in the two weeks before works. */
  function latestShip(w, transit, cold) {
    var thu = addDays(w, 1);
    for (var k = 0; k < 14; k++) {
      var s = addDays(w, -k);
      if (isLabClosed(s)) continue;
      var p = boxPlan(s, transit);
      if (p.report.getTime() !== thu.getTime()) continue;
      if (cold && (p.arriveWeekend || p.arriveClosed)) continue;
      return s;
    }
    return null;
  }
  /* Days in transit from the shipping choice: 1, 2 or 3. Anything else is
     read as 2, the default choice. */
  function transitDays(v) {
    var n = parseInt(v, 10);
    return n === 1 || n === 3 ? n : 2;
  }
  function plural(n, one, many) {
    return n + " " + (n === 1 ? one : many);
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  var PHONE = '<a href="tel:+17156532201">(715) 653-2201</a>';
  var REPORT_LINE = "Samples that reach the lab by Wednesday are reported Thursday.";

  /* ---------------- Core: pure answers (no page access) ---------------- */

  var TRANSIT_LEAD = { 1: "By overnight shipping it", 2: "By Priority Mail it", 3: "With 3 days in transit it" };
  var MARGIN = {
    1: "Overnight shipping is not guaranteed. Shipping a day earlier leaves a margin.",
    2: "Priority Mail usually takes 2 days but is not guaranteed. Shipping a day earlier, or overnight, leaves a margin.",
    3: "Three days in transit is not guaranteed. Shipping a day earlier leaves a margin."
  };
  /* One margin line when the box lands on Wednesday itself, the last day
     that makes Thursday's report. n is 1, 2 or 3 (transitDays). */
  function marginHtml(plan, n) {
    if (plan.arriveWeekend || plan.arriveClosed || plan.arrive.getDay() !== 3) return "";
    return '<p class="muted">' + MARGIN[n] + "</p>";
  }
  function closedSentence(d) {
    return closedIs(d) + (closedLabel(d) === "a day the lab is closed" ? "." : ", and the lab is closed.");
  }
  /* Why a box that lands on a weekend or closed day counts from a later day. */
  function rollText(plan) {
    var head = plan.arriveWeekend ? "That is a " + DAYS[plan.arrive.getDay()] + ". The lab is staffed Monday to Friday" : "";
    var closed = plan.skipped.map(closedSentence).join(" ");
    if (plan.arriveWeekend && !closed) return head + ", so count on " + fmt(plan.count) + ".";
    return (head ? head + ". " : "") + (closed ? closed + " " : "") + "Count on " + fmt(plan.count) + ".";
  }

  /* 1. "When can I test?" */
  var WAIT = { cattle: 28, heifer: 25, small: 30 };
  var LIMIT = { cattle: 240, heifer: 240, small: 140 };
  var LABEL = { cattle: "cows and bison", heifer: "virgin heifers", small: "goats and sheep" };

  function speciesKind(v) {
    return Object.prototype.hasOwnProperty.call(WAIT, v) ? v : "cattle";
  }

  /* bredValue and calvedValue are "YYYY-MM-DD" or "" (the calving date is
     read for cows only); transitValue is "1", "2" or "3"; today is a Date. */
  function timingAnswer(speciesValue, bredValue, calvedValue, transitValue, today) {
    var kind = speciesKind(speciesValue);
    today = startOfDay(today);

    if (!bredValue) return '<p class="muted">Enter the breeding date to see the earliest sample date.</p>';
    var d = parseDate(bredValue);
    if (!d) return '<p class="muted">Enter the full breeding date, with a four-digit year.</p>';
    var since = daysBetween(d, today);
    if (since < -90) return "<p>That breeding date is more than 90 days ahead. Check the date.</p>";
    if (since > LIMIT[kind])
      return "<p>That breeding date is more than " + LIMIT[kind] + " days ago. Check the date. If it is right, call the lab before you sample, at " + PHONE + ".</p>";

    var c = null;
    if (kind === "cattle" && calvedValue) {
      c = parseDate(calvedValue);
      if (!c) return '<p class="muted">Enter the full calving date, with a four-digit year, or leave it blank.</p>';
      if (daysBetween(c, today) < 0) return "<p>That calving date is in the future. Check the date, or leave it blank.</p>";
      if (daysBetween(c, d) < 0) return "<p>The calving date is after the breeding date. Check both dates.</p>";
    }

    var wait = WAIT[kind];
    var earliest = addDays(d, wait);
    var html = "";
    if (c && addDays(c, 90) > earliest) {
      earliest = addDays(c, 90);
      html += "<p><strong>Earliest sample date:</strong> " + fmt(earliest) + ". That is 90 days after calving, which comes later than " + wait + " days after breeding.</p>";
    } else {
      html += "<p><strong>Earliest sample date:</strong> " + fmt(earliest) + " (" + wait + " days after breeding for " + LABEL[kind] + ").</p>";
      if (c) html += "<p>She will be at least 90 days past calving by then.</p>";
    }

    var days = transitDays(transitValue);
    var start = earliest > today ? earliest : today;
    var p = firstGoodShip(start, days);
    if (p) {
      html += "<p>Draw and ship on " + fmt(p.ship) + ". " + TRANSIT_LEAD[days] + " should arrive " + fmt(p.arrive) +
        (p.reportClosed ? "." : " and be reported " + fmt(p.report) + ".") + "</p>";
      if (p.reportClosed) html += reportClosedHtml(p.report);
      html += marginHtml(p, days);
    } else {
      html += "<p>Call the lab at " + PHONE + " to plan the ship day.</p>";
    }

    if (kind === "small") html += '<p class="muted">For does and ewes that kidded or lambed recently, ask when you call. ' + REPORT_LINE + "</p>";
    else html += '<p class="muted">' + REPORT_LINE + "</p>";
    return html;
  }

  /* 2. Ship-by planner. shipValue is "YYYY-MM-DD" or ""; transitValue is
     "1", "2" or "3"; kindValue is "preg" or "bvd". The day logic comes from
     boxPlan, the same function the timing tool uses. */
  function shipbyAnswer(shipValue, transitValue, kindValue, today) {
    today = startOfDay(today);
    var S = parseDate(shipValue);
    if (!S) return '<p class="muted">Pick the day you can ship.</p>';
    if (S < today) return '<p class="muted">That day has passed. Pick today or a later day.</p>';
    if (daysBetween(today, S) > 365) return '<p class="muted">Pick a day within the next year.</p>';

    var N = transitDays(transitValue);
    var bvd = kindValue === "bvd";
    var plan = boxPlan(S, N);
    var A = plan.arrive;
    var R = plan.count;
    var html = "";

    if (isWeekend(S)) {
      /* When that Monday is a holiday or closed day, name the next lab day. */
      var mon = addDays(S, S.getDay() === 6 ? 2 : 1);
      html += "<p>That is a " + DAYS[S.getDay()] + ". If your carrier does not pick up on weekends, pick " +
        (isLabClosed(mon) ? fmt(labDay(mon)) + ". " + closedIs(mon) + ".</p>" : "Monday.</p>");
    } else if (closedLabel(S)) html += "<p>" + closedIs(S) + ". If your carrier does not pick up that day, pick another day.</p>";

    html += "<p><strong>Arrives:</strong> " + fmt(A) + ".";
    if (daysBetween(A, R) !== 0) html += "<br>" + rollText(plan);
    html += "</p>";

    /* A cold box that should not go out this way gets no report line;
       the cold-box line below says what to do instead. */
    var coldStop = bvd && (N > 2 || plan.arriveWeekend || plan.arriveClosed);
    if (!coldStop && !plan.missed) {
      if (plan.reportClosed) html += reportClosedHtml(plan.report);
      else html += "<p><strong>Report:</strong> " + fmt(plan.report) + ". That makes the same week's report.</p>";
      html += marginHtml(plan, N);
    } else if (!coldStop) {
      html += "<p>That arrival misses the Wednesday cutoff, so it is not in that week's Thursday report.";
      if (plan.reportClosed) html += "</p>" + reportClosedHtml(plan.report);
      else html += " This box is in the report on " + fmt(plan.report) + ".</p>";
      /* Name a ship day for the report this box missed. A later report is
         named only when the one this box makes is a closed Thursday;
         otherwise the box is already in it and the line would add nothing. */
      var W0 = addDays(R, 3 - R.getDay());
      var found = false;
      for (var w = 0; w < 3 && !found; w++) {
        var W = addDays(W0, 7 * w);
        var thu = addDays(W, 1);
        if (thu >= plan.report && !plan.reportClosed) break;
        if (closedLabel(thu)) continue;
        var D = latestShip(W, N, bvd);
        if (D && D >= today) {
          html += "<p>" + (w === 0 ? "To make the report on " : "To be in the report on ") + fmt(thu) + ", ship by " + fmt(D) + ".</p>";
          found = true;
        }
      }
      html += '<p class="muted">Questions about a late box? Call the lab at ' + PHONE + ".</p>";
    }

    if (!bvd) {
      html += '<p class="muted">Pregnancy blood tubes do not need ice. Pad the tubes well and keep the form and payment in their own bag.</p>';
    } else if (N > 2) {
      html += "<p><strong>Ear notches and BVD blood ship cold.</strong> This shipping takes longer than 48 hours. Call the lab first for instructions.</p>";
    } else if (plan.arriveWeekend || plan.arriveClosed) {
      var B = S > today ? S : today;
      for (var k = 0; k < 28 && (isLabClosed(B) || isLabClosed(addDays(B, N))); k++) B = addDays(B, 1);
      if (plan.arriveWeekend && !plan.skipped.length)
        html += "<p><strong>Ear notches and BVD blood ship cold.</strong> This box would land on a " + DAYS[A.getDay()] +
          " and wait for Monday, past 48 hours. Ship on " + fmt(B) + " instead, so it lands on a weekday.</p>";
      else
        html += "<p><strong>Ear notches and BVD blood ship cold.</strong> This box would land on " +
          (plan.arriveWeekend ? "a " + DAYS[A.getDay()] : fmt(A) + ", which is " + closedLabel(A) + ",") +
          " and wait for " + fmt(R) + ", past 48 hours. Ship on " + fmt(B) + " instead, so it lands on a lab day.</p>";
    } else {
      html += "<p><strong>Ear notches and BVD blood ship cold.</strong> Refrigerate before shipping and pack with ice packs. Sample on the day you ship, so the box arrives within 48 hours of collection.</p>";
    }
    return html;
  }

  /* 3. Which form do I need? */
  var FORMS = {
    preg_cattle: {
      name: "Cattle-Bison Pregnancy Test Submission Form",
      href: "ADDC%20Preg%20Submission%20Form.pdf",
      note: "2cc of blood in a red-top tube, no ice needed."
    },
    preg_small: {
      name: "Small Ruminant Pregnancy Test Submission Form",
      href: "Farm%20Pregnancy%20Test.pdf",
      note: "2cc of blood in a red-top tube, drawn from the jugular vein, no ice needed, 30 or more days after breeding."
    },
    bvd: {
      name: "BVD PI Test Submission Form",
      href: "BVD_PI_Test.pdf",
      note: "Ear notch or blood. Ship refrigerated with ice packs; reach the lab within 48 hours of collection."
    },
    other: {
      name: "Call the lab first",
      href: "tel:+17156532201",
      note: "Johne's, Leukosis, Mycoplasma and other monitoring are set up by phone so the right samples go in the box."
    }
  };

  function chooserAnswer(speciesValue, testValue) {
    if (testValue === "bvd" && speciesValue === "small")
      return '<p>BVD PI testing is for cattle and bison. For goats and sheep, call the lab and ask about disease monitoring.</p><p><a class="btn btn-outline" href="tel:+17156532201">Call (715) 653-2201</a></p>';
    var key = testValue === "bvd" ? "bvd" : testValue === "other" ? "other" : speciesValue === "small" ? "preg_small" : "preg_cattle";
    var f = FORMS[key];
    var isTel = f.href.indexOf("tel:") === 0;
    return "<p><strong>" + f.name + '</strong><br><span class="muted">' + f.note + '</span></p><p><a class="btn btn-outline" href="' + f.href + '">' +
      (isTel ? "Call (715) 653-2201" : "Download the form (PDF)") + "</a></p>";
  }

  /* 4. BVD program planner. raw is the field text, bad is true when the
     browser says the field holds something that is not a number. Returns
     the answer and whether the field should be marked invalid. */
  var SHIP_WEEKLY = " Once a week, notch the calves born since the last box and ship them that same day, so they reach the lab within 48 hours of collection.";

  function num(x) {
    return x.toLocaleString("en-US");
  }
  function bvdAnswer(rawValue, bad, patternValue, statusValue) {
    var raw = (rawValue || "").trim();
    if (!raw && !bad) return { invalid: false, html: '<p class="muted">Enter the number of breeding females to see the plan.</p>' };
    var n = Number(raw);
    if (bad || !isFinite(n) || n < 1 || n !== Math.floor(n))
      return { invalid: true, html: '<p class="muted">Enter a whole number of breeding females, from 1 to 20,000.</p>' };
    if (n > 20000) return { invalid: false, html: "<p>For a herd over 20,000 breeding females, call " + PHONE + " to plan the program with the lab.</p>" };

    var c = Math.round(n * 0.9);
    var html = n === 1 ? "<p>For 1 breeding female:</p><ol>" : "<p>For " + num(n) + " breeding females:</p><ol>";
    if (statusValue === "never")
      html += "<li><strong>First screen:</strong> every animal on the place once, about " + (n === 1 ? "1 breeding female" : num(n) + " breeding females") +
        " plus calves, bulls and replacements. Calves under a year old give an ear notch; adults give an ear notch or a blood sample.</li>";
    else html += "<li><strong>First screen:</strong> already done. The steps below keep the herd clean.</li>";
    if (patternValue === "season") {
      var s = Math.max(1, Math.round(c / 10));
      html += "<li><strong>Calves:</strong> roughly " + num(c) + " in a calving season of about ten weeks, about " + num(s) + " a week at the peak." + SHIP_WEEKLY + "</li>";
    } else {
      var w = Math.round(c / 52);
      if (w >= 1) html += "<li><strong>Calves:</strong> roughly " + num(c) + " a year, about " + num(w) + " a week." + SHIP_WEEKLY + "</li>";
      else html += "<li><strong>Calves:</strong> roughly " + num(c) + " a year, fewer than one a week. Notch the calves born since the last box and ship them that same day, so they reach the lab within 48 hours of collection.</li>";
    }
    html += "<li><strong>Purchases:</strong> test every purchased animal, bulls included, before it joins the herd.</li>";
    html += "<li><strong>Positives:</strong> isolate the animal and test its dam. It is retested or removed on the veterinarian's advice.</li>";
    html += "<li><strong>Vaccination:</strong> calves and open adults, on a schedule Dr. Pearson sets for your herd.</li>";
    html += '<li><strong>Ship day:</strong> the lab is staffed Monday to Friday, so pick a ship day that gets the cold box there on a weekday. The <a href="shipping_test.html#planner">ship-by planner</a> checks the arrival day.</li>';
    html += '</ol><p class="muted">Planning estimate only, based on about nine calves per ten breeding females a year. Your numbers replace these on the phone.</p>';
    return { invalid: false, html: html };
  }

  /* 7. Checklist answer. labels is the list of unticked label texts. */
  function checklistAnswer(have, total, labels) {
    if (labels.length === total) {
      return have
        ? "<p>Tick what you have in hand and what is still missing is listed here.</p>"
        : '<p>Tick what you already have; whatever is left is your order list.</p><p class="tool-count">' +
          plural(total, "item", "items") + " not ticked yet.</p>";
    }
    if (!labels.length) {
      return have
        ? "<p><strong>Everything on the list is in hand.</strong></p>"
        : "<p><strong>You have everything. Draw, pack, ship.</strong></p>";
    }
    return "<p><strong>" + (have ? "Still to gather:" : "Order or gather before you sample:") + '</strong></p><ul class="tight">' +
      labels
        .map(function (t) {
          return "<li>" + esc(t) + "</li>";
        })
        .join("") +
      "</ul>";
  }

  /* 7b. Supplies answer: two lists in one tool. Each group is
     { total, labels } where labels are the unticked item texts. */
  function listHtml(title, labels) {
    return "<p><strong>" + title + '</strong></p><ul class="tight">' +
      labels
        .map(function (t) {
          return "<li>" + esc(t) + "</li>";
        })
        .join("") +
      "</ul>";
  }
  function suppliesAnswer(order, pack) {
    var total = order.total + pack.total;
    var left = order.labels.length + pack.labels.length;
    if (left === total)
      return '<p>Tick what you already have; whatever is left is listed here.</p><p class="tool-count">' + plural(total, "item", "items") + " not ticked yet.</p>";
    if (!left) return "<p><strong>You have everything. Draw, pack, ship.</strong></p>";
    return (order.labels.length ? listHtml("Still to order:", order.labels) : '<p class="muted">Nothing left to order.</p>') +
      (pack.labels.length ? listHtml("Still to pack:", pack.labels) : '<p class="muted">Nothing left to pack.</p>');
  }

  /* Test hook: node loads this file as a module; browsers have no `module`. */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      parseDate: parseDate,
      fmt: fmt,
      iso: iso,
      LAB_CLOSED: LAB_CLOSED,
      holidayName: holidayName,
      isLabClosed: isLabClosed,
      boxPlan: boxPlan,
      labDay: labDay,
      thursdayOf: thursdayOf,
      firstGoodShip: firstGoodShip,
      latestShip: latestShip,
      timingAnswer: timingAnswer,
      shipbyAnswer: shipbyAnswer,
      chooserAnswer: chooserAnswer,
      bvdAnswer: bvdAnswer,
      checklistAnswer: checklistAnswer,
      suppliesAnswer: suppliesAnswer
    };
  }
  if (typeof document === "undefined") return;

  /* ---------------- Page wiring ---------------- */
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function on(el, ev, fn) {
    if (el) el.addEventListener(ev, fn);
  }
  /* One broken tool never stops the others; its static text stays. */
  function each(sel, init) {
    $all(sel).forEach(function (root) {
      try {
        init(root);
      } catch (err) {
        /* Leave this tool as the HTML wrote it. */
      }
    });
  }

  /* ---------------- 1. "When can I test?" ---------------- */
  each('[data-tool="timing"]', function (root) {
    var species = $('[name="species"]', root);
    var bred = $('input[name="bred"]', root);
    var calved = $('input[name="calved"]', root);
    var calvedField = calved ? calved.closest(".form-field") : null;
    var transit = $('select[name="transit"]', root);
    var out = $(".tool-out", root);
    if (!species || !bred || !transit || !out) return;
    var today = startOfDay(new Date());
    bred.min = iso(addDays(today, -365));
    bred.max = iso(addDays(today, 90));
    if (calved) {
      calved.min = iso(addDays(today, -730));
      calved.max = iso(today);
    }
    if (!bred.value) bred.value = iso(addDays(today, -30));

    function run() {
      if (calvedField) calvedField.hidden = speciesKind(species.value) !== "cattle";
      out.innerHTML = timingAnswer(species.value, bred.value, calved ? calved.value : "", transit.value, startOfDay(new Date()));
    }
    on(species, "change", run);
    on(bred, "input", run);
    on(bred, "change", run);
    on(calved, "input", run);
    on(calved, "change", run);
    on(transit, "change", run);
    run();
  });

  /* ---------------- 2. Ship-by planner ---------------- */
  each('[data-tool="shipby"]', function (root) {
    var ship = $('input[name="ship"]', root);
    var transit = $('select[name="transit"]', root);
    var kind = $('select[name="kind"]', root);
    var out = $(".tool-out", root);
    if (!ship || !transit || !out) return;
    var today = startOfDay(new Date());
    ship.min = iso(today);
    ship.max = iso(addDays(today, 365));
    if (!ship.value) ship.value = iso(labDay(today));

    function run() {
      out.innerHTML = shipbyAnswer(ship.value, transit.value, kind ? kind.value : "preg", startOfDay(new Date()));
    }
    on(ship, "input", run);
    on(ship, "change", run);
    on(transit, "change", run);
    on(kind, "change", run);
    run();
  });

  /* ---------------- 3. Which form do I need? ---------------- */
  each('[data-tool="chooser"]', function (root) {
    var species = $('select[name="species"]', root);
    var test = $('select[name="test"]', root);
    var out = $(".tool-out", root);
    if (!species || !test || !out) return;
    function run() {
      out.innerHTML = chooserAnswer(species.value, test.value);
    }
    on(species, "change", run);
    on(test, "change", run);
    run();
  });

  /* ---------------- 4. BVD program planner ---------------- */
  each('[data-tool="bvdplan"]', function (root) {
    var herd = $('input[name="herd"]', root);
    var pattern = $('select[name="pattern"]', root);
    var status = $('select[name="status"]', root);
    var out = $(".tool-out", root);
    if (!herd || !pattern || !status || !out) return;
    function run() {
      var bad = !!(herd.validity && herd.validity.badInput);
      var a = bvdAnswer(herd.value, bad, pattern.value, status.value);
      if (a.invalid) herd.setAttribute("aria-invalid", "true");
      else herd.removeAttribute("aria-invalid");
      out.innerHTML = a.html;
    }
    on(herd, "input", run);
    on(pattern, "change", run);
    on(status, "change", run);
    run();
  });

  /* ---------------- 5. Step-through guide (tail bleeding) ---------------- */
  each('[data-tool="stepper"]', function (root) {
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
    var nav = $(".stepper-nav", root);
    if (!num || !text || !prev || !next || !nav) return;
    var head = list.previousElementSibling;
    if (!(head && head.classList.contains("section-head"))) head = null;

    function render() {
      num.textContent = "Step " + (i + 1) + " of " + steps.length;
      text.innerHTML = steps[i];
      if (bar) bar.style.width = Math.round(((i + 1) / steps.length) * 100) + "%";
      prev.disabled = i === 0;
      next.textContent = i === steps.length - 1 ? "Start over" : "Next step";
      if (fig) {
        $all("[data-step]", fig).forEach(function (g) {
          var show = g.getAttribute("data-step").split(" ").indexOf(String(i + 1)) !== -1;
          g.style.display = show ? "" : "none";
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
    on(root, "keydown", function (e) {
      if (e.key === "ArrowRight") {
        next.click();
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        prev.click();
        e.preventDefault();
      }
    });

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "btn btn-outline";
    toggle.textContent = "Show all steps";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", (head && head.id ? head.id + " " : "") + list.id);
    on(toggle, "click", function () {
      var show = list.hidden;
      list.hidden = !show;
      if (head) head.hidden = !show;
      root.classList.toggle("is-list", show);
      toggle.setAttribute("aria-expanded", show ? "true" : "false");
      toggle.textContent = show ? "Back to one step at a time" : "Show all steps";
      if (show && head) head.scrollIntoView({ block: "start" });
    });
    nav.appendChild(toggle);

    list.hidden = true;
    if (head) head.hidden = true;
    root.setAttribute("tabindex", "0");
    render();
    root.hidden = false;
  });

  /* ---------------- 6. FAQ search and accordions ---------------- */
  each('[data-tool="faqsearch"]', function (root) {
    var input = $("input", root);
    var count = $(".tool-count", root);
    var expand = $(".faq-expand", root);
    var empty = $(".faq-empty");
    var items = $all("details.faq-item");
    var groups = $all(".faq-group");
    if (!input || !items.length) return;

    var total = items.length;
    var searching = false;
    var openBefore = [];
    var emptyHtml = empty ? empty.innerHTML : "";

    function norm(s) {
      return s.toLowerCase().replace(/['\u2018\u2019]/g, "").replace(/\s+/g, " ");
    }
    var texts = items.map(function (d) {
      return norm(d.textContent);
    });

    function syncExpand() {
      if (!expand) return;
      var live = items.filter(function (d) {
        return !d.hidden;
      });
      var anyClosed = live.some(function (d) {
        return !d.open;
      });
      expand.textContent = anyClosed || !live.length ? "Expand all" : "Collapse all";
      expand.disabled = !live.length;
    }

    function run() {
      var terms = norm(input.value).split(/[\s,]+/).filter(Boolean);
      var q = terms.length > 0;
      if (q && !searching) {
        openBefore = items.map(function (d) {
          return d.open;
        });
        searching = true;
      }
      var shown = 0;
      items.forEach(function (d, i) {
        var hit =
          !q ||
          terms.every(function (t) {
            return texts[i].indexOf(t) !== -1;
          });
        d.hidden = !hit;
        if (hit) shown++;
        if (q) d.open = hit;
      });
      if (!q && searching) {
        items.forEach(function (d, i) {
          d.open = openBefore[i];
        });
        searching = false;
      }
      groups.forEach(function (g) {
        g.hidden = !$all("details.faq-item", g).some(function (d) {
          return !d.hidden;
        });
      });
      if (count) {
        count.textContent = !q
          ? total + " questions"
          : shown === 1
            ? "1 of " + total + " questions matches"
            : shown + " of " + total + " questions match";
      }
      if (empty) {
        var showEmpty = q && shown === 0;
        if (showEmpty && empty.hidden) {
          /* Re-insert the text after it is visible so the status region announces it. */
          empty.innerHTML = "";
          empty.hidden = false;
          setTimeout(function () {
            if (!empty.hidden) empty.innerHTML = emptyHtml;
          }, 50);
        } else if (!showEmpty) {
          empty.hidden = true;
          empty.innerHTML = emptyHtml;
        }
      }
      syncExpand();
    }

    function clearSearch() {
      if (!input.value) return;
      input.value = "";
      run();
    }

    function openFromHash() {
      var id = location.hash.slice(1);
      if (!id) return;
      try {
        id = decodeURIComponent(id);
      } catch (e) {
        return;
      }
      var t = document.getElementById(id);
      if (!t || items.indexOf(t) === -1) return;
      clearSearch();
      t.open = true;
      t.scrollIntoView();
    }

    on(input, "input", run);
    on(input, "keydown", function (e) {
      if (e.key === "Escape" && input.value) {
        e.preventDefault();
        clearSearch();
      }
    });
    on(expand, "click", function () {
      var live = items.filter(function (d) {
        return !d.hidden;
      });
      var anyClosed = live.some(function (d) {
        return !d.open;
      });
      live.forEach(function (d) {
        d.open = anyClosed;
      });
      syncExpand();
    });
    items.forEach(function (d) {
      on(d, "toggle", syncExpand);
    });
    $all(".jump-row a").forEach(function (a) {
      on(a, "click", clearSearch);
    });
    on(window, "hashchange", openFromHash);

    /* Paper gets every showing answer open; the screen goes back after. */
    var printOpen = null;
    on(window, "beforeprint", function () {
      printOpen = items.map(function (d) {
        return d.open;
      });
      items.forEach(function (d) {
        if (!d.hidden) d.open = true;
      });
    });
    on(window, "afterprint", function () {
      if (!printOpen) return;
      items.forEach(function (d, i) {
        d.open = printOpen[i];
      });
      printOpen = null;
    });

    run();
    root.hidden = false;
    openFromHash();
  });

  /* Print one block on its own (css: body.print-focus / .print-target). */
  function printFocus(targets) {
    var main = $("main") || document.body;
    var els = (targets || []).filter(Boolean);
    if (!els.length) {
      window.print();
      return;
    }
    main.setAttribute("data-print-title", document.title.replace(/\s*\|.*$/, "") + " - The Dairy Doctor - (715) 653-2201");
    document.body.classList.add("print-focus");
    els.forEach(function (el) {
      el.classList.add("print-target");
    });
    var mql = window.matchMedia ? window.matchMedia("print") : null;
    function onMql(e) {
      if (!e.matches) done();
    }
    function done() {
      document.body.classList.remove("print-focus");
      els.forEach(function (el) {
        el.classList.remove("print-target");
      });
      window.removeEventListener("afterprint", done);
      window.removeEventListener("focus", done);
      if (mql && mql.removeListener) mql.removeListener(onMql);
    }
    window.addEventListener("afterprint", done);
    if (mql && mql.addListener) mql.addListener(onMql);
    window.print();
    /* A browser that never fires afterprint clears on the next focus. */
    setTimeout(function () {
      window.addEventListener("focus", done);
    }, 0);
  }

  /* ---------------- 7. Checklist (supplies, records) ---------------- */
  each('[data-tool="checklist"]', function (root) {
    var boxes = $all('input[type="checkbox"]', root);
    var out = $(".tool-out", root);
    var print = $(".tool-print", root);
    if (!boxes.length || !out) return;
    var have = root.getAttribute("data-mode") === "have";
    var orderBoxes = $all('[data-list="order"] input[type="checkbox"]', root);
    var packBoxes = $all('[data-list="pack"] input[type="checkbox"]', root);
    function unticked(list) {
      return list
        .filter(function (b) {
          return !b.checked;
        })
        .map(function (b) {
          return b.parentNode.textContent.trim();
        });
    }
    function run() {
      if (orderBoxes.length && packBoxes.length) {
        out.innerHTML = suppliesAnswer(
          { total: orderBoxes.length, labels: unticked(orderBoxes) },
          { total: packBoxes.length, labels: unticked(packBoxes) }
        );
        return;
      }
      out.innerHTML = checklistAnswer(have, boxes.length, unticked(boxes));
    }
    boxes.forEach(function (b) {
      on(b, "change", run);
    });
    if (print) {
      on(print, "click", function () {
        printFocus([root]);
      });
      print.hidden = false;
    }
    run();
  });

  /* ---------------- 8. Copy to clipboard ---------------- */
  var copyLive = null;
  $all("[data-copy]").forEach(function (btn) {
    var label = btn.textContent;
    var timer = null;
    btn.hidden = false;
    on(btn, "click", function () {
      var text = btn.getAttribute("data-copy");
      if (!copyLive) {
        copyLive = document.createElement("span");
        copyLive.className = "sr-only";
        copyLive.setAttribute("aria-live", "polite");
        ($("main") || document.body).appendChild(copyLive);
      }
      function copied() {
        btn.textContent = "Copied";
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.textContent = label;
        }, 1600);
        copyLive.textContent = "";
        setTimeout(function () {
          copyLive.textContent = "Address copied to the clipboard";
        }, 50);
      }
      function byHand() {
        window.prompt("Copy this address:", text);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(copied, byHand);
      else byHand();
    });
  });

  /* ---------------- 9. Form redirect follows the current host ---------------- */
  $all('form input[name="_next"]').forEach(function (inp) {
    if (window.location.protocol !== "https:" && window.location.protocol !== "http:") return;
    inp.value = window.location.origin + window.location.pathname.replace(/[^\/]*$/, "") + "thanks.html";
  });

  /* ---------------- 10. Print buttons ---------------- */
  $all("[data-print]").forEach(function (btn) {
    on(btn, "click", function () {
      var sel = btn.getAttribute("data-print");
      printFocus(sel ? $all(sel) : [btn.closest(".tool")]);
    });
    btn.hidden = false;
  });
})();
