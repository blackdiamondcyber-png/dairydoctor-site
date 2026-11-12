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
  /* The days a next-day carrier does not deliver. The Postal Service (Priority
     Mail and 3-day boxes) stops on all 11 federal holidays; the overnight
     choice stops only on these six, on the day itself (an "observed" Friday or
     Monday is a working day for a carrier). */
  var OVERNIGHT_HOLIDAYS = ["New Year's Day", "Memorial Day", "Independence Day", "Labor Day", "Thanksgiving Day", "Christmas Day"];
  /* Name of the holiday on d that stops delivery, or "". transit is 1 for the
     overnight choice (six days); anything else is the Postal Service (all 11
     federal holidays, observed dates). New Year's Day of the next year can be
     observed on December 31, so next year's list is read too. */
  function holidayName(d, transit) {
    var y = d.getFullYear();
    var name = holidaysOf(y)[iso(d)] || holidaysOf(y + 1)[iso(d)] || "";
    if (transit !== 1) return name;
    return name.indexOf("(observed)") === -1 && OVERNIGHT_HOLIDAYS.indexOf(name) !== -1 ? name : "";
  }
  /* Why d is a day off the calendar for a weekday: a holiday name, a closed
     day the owner added, or "". transit picks the holiday set (see above). */
  function closedLabel(d, transit) {
    var h = holidayName(d, transit);
    if (h) return h;
    return LAB_CLOSED.indexOf(iso(d)) !== -1 ? "a day the lab is closed" : "";
  }
  /* A day off for this shipping choice: a weekend, a holiday that stops its
     delivery, or a LAB_CLOSED day. Without transit, the full federal list. */
  function isLabClosed(d, transit) {
    return isWeekend(d) || closedLabel(d, transit) !== "";
  }
  /* The first lab day on or after d: a box that lands on a weekend or a
     closed day is counted from the next lab day. */
  function labDay(d, transit) {
    var x = startOfDay(d);
    for (var k = 0; k < 30 && isLabClosed(x, transit); k++) x = addDays(x, 1);
    return x;
  }
  /* Thursday of the week that holds d (d is Monday to Friday). */
  function thursdayOf(d) {
    return addDays(d, 4 - d.getDay());
  }
  /* "Thursday, Nov 26, 2026 is Thanksgiving Day" */
  function closedIs(d, transit) {
    return fmt(d) + " is " + closedLabel(d, transit);
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
     Thursday is closed (then no report date may be stated; the full federal
     list applies, the lab has not said otherwise). skipped lists the weekday
     closed days the box waited through. Which holidays stop delivery depends
     on transit (see holidayName); arriveHoliday is true when the arrival day
     is one of them, so the answer says "would arrive". */
  function boxPlan(ship, transit) {
    var arrive = addDays(ship, transit);
    var count = arrive;
    var skipped = [];
    for (var k = 0; k < 30 && isLabClosed(count, transit); k++) {
      if (!isWeekend(count)) skipped.push(count);
      count = addDays(count, 1);
    }
    var missed = count.getDay() > 3;
    var report = addDays(thursdayOf(count), missed ? 7 : 0);
    return {
      ship: ship,
      transit: transit,
      arrive: arrive,
      count: count,
      missed: missed,
      report: report,
      reportClosed: closedLabel(report),
      skipped: skipped,
      arriveWeekend: isWeekend(arrive),
      arriveClosed: !isWeekend(arrive) && closedLabel(arrive, transit) !== "",
      arriveHoliday: holidayName(arrive, transit) !== ""
    };
  }
  /* First lab-day ship on or after `from` whose box arrives on a lab day,
     Monday, Tuesday or Wednesday: samples that reach the lab by Wednesday are
     reported Thursday. */
  function firstGoodShip(from, transit) {
    for (var k = 0; k < 28; k++) {
      var s = addDays(from, k);
      if (isLabClosed(s, transit)) continue;
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
      if (isLabClosed(s, transit)) continue;
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
  /* The one label and hint for the shipping choice on every copy of the tool
     (the pages carry them as static HTML; tests read them from here). */
  var TRANSIT_LABEL = "How you ship";
  var TRANSIT_HINT = "Days from shipping to arrival at the lab. Overnight means a next-day carrier.";
  /* Why the ship day is a Monday when she can be sampled already. Boxes that
     reach the lab Thursday or Friday are tested too, in the next report. */
  var MON_WED_LINE = "Boxes that reach the lab Monday to Wednesday are in that Thursday's report, so draw and ship on ";
  var DAY_LINE = "Draw and ship: ";

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
  function closedSentence(d, transit) {
    /* A holiday is named for delivery, never as a lab closing: the owner has
       not said which days the lab is shut. The Postal Service carries Priority
       Mail and the 3-day choice; the overnight choice is a next-day carrier. */
    if (closedLabel(d, transit) === "a day the lab is closed") return closedIs(d, transit) + ".";
    return closedIs(d, transit) + (transit === 1 ? " and next-day carriers do not deliver." : " and the Postal Service does not deliver.");
  }
  /* Why a box that lands on a weekend or closed day counts from a later day. */
  function rollText(plan) {
    var head = plan.arriveWeekend ? "That is a " + DAYS[plan.arrive.getDay()] + ". The lab is staffed Monday to Friday" : "";
    var closed = plan.skipped
      .map(function (d) {
        return closedSentence(d, plan.transit);
      })
      .join(" ");
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

  /* An answer that names no ship day. */
  function say(html) {
    return { html: html, ship: null, form: "" };
  }
  /* bredValue and calvedValue are "YYYY-MM-DD" or "" (the calving date is
     read for cows only); transitValue is "1", "2" or "3"; today is a Date.
     Returns { html, ship, form }: ship is the draw-and-ship day (a Date) when
     the answer names one, otherwise null; form is the submission form's name. */
  function timingResult(speciesValue, bredValue, calvedValue, transitValue, today) {
    var kind = speciesKind(speciesValue);
    today = startOfDay(today);

    if (!bredValue) return say('<p class="muted">Enter the breeding date to see the earliest sample date.</p>');
    var d = parseDate(bredValue);
    if (!d) return say('<p class="muted">Enter the full breeding date, with a four-digit year.</p>');
    var since = daysBetween(d, today);
    if (since < -90) return say("<p>That breeding date is more than 90 days ahead. Check the date.</p>");
    if (since > LIMIT[kind])
      return say("<p>That breeding date is more than " + LIMIT[kind] + " days ago. Check the date. If it is right, call the lab before you sample, at " + PHONE + ".</p>");

    var c = null;
    if (kind === "cattle" && calvedValue) {
      c = parseDate(calvedValue);
      if (!c) return say('<p class="muted">Enter the full calving date, with a four-digit year, or leave it blank.</p>');
      if (daysBetween(c, today) < 0) return say("<p>That calving date is in the future. Check the date, or leave it blank.</p>");
      if (daysBetween(c, d) < 0) return say("<p>The calving date is after the breeding date. Check both dates.</p>");
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
    var ready = earliest <= today;
    var start = ready ? today : earliest;
    var p = firstGoodShip(start, days);
    var ship = null;
    if (p) {
      ship = p.ship;
      /* Today or past: say she can be sampled, then why the ship day waits. */
      html += "<p>" + (ready ? "She can be sampled now. " + MON_WED_LINE : "Draw and ship on ") +
        fmt(p.ship) + ". " + TRANSIT_LEAD[days] + " should arrive " + fmt(p.arrive) +
        (p.reportClosed ? "." : " and be reported " + fmt(p.report) + ".") + "</p>";
      if (p.reportClosed) html += reportClosedHtml(p.report);
      html += marginHtml(p, days);
    } else {
      html += "<p>Call the lab at " + PHONE + " to plan the ship day.</p>";
    }

    if (kind === "small") html += '<p class="muted">For does and ewes that kidded or lambed recently, ask when you call.</p>';
    return { html: html, ship: ship, form: kind === "small" ? FORMS.preg_small.name : FORMS.preg_cattle.name };
  }
  function timingAnswer(speciesValue, bredValue, calvedValue, transitValue, today) {
    return timingResult(speciesValue, bredValue, calvedValue, transitValue, today).html;
  }

  /* 2. Ship-by planner. shipValue is "YYYY-MM-DD" or ""; transitValue is
     "1", "2" or "3"; kindValue is "preg" or "bvd". The day logic comes from
     boxPlan, the same function the timing tool uses. Returns { html, ship,
     form, cold } like timingResult: ship is the picked day when the answer
     stands behind it (a lab day, and not a cold box the answer sends elsewhere). */
  function shipbyResult(shipValue, transitValue, kindValue, today) {
    today = startOfDay(today);
    var S = parseDate(shipValue);
    if (!S) return say('<p class="muted">Pick the day you can ship.</p>');
    if (S < today) return say('<p class="muted">That day has passed. Pick today or a later day.</p>');
    if (daysBetween(today, S) > 365) return say('<p class="muted">Pick a day within the next year.</p>');

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
        (isLabClosed(mon, N) ? fmt(labDay(mon, N)) + ". " + closedIs(mon, N) + ".</p>" : "Monday.</p>");
    } else if (closedLabel(S, N)) html += "<p>" + closedIs(S, N) + ". If your carrier does not pick up that day, pick another day.</p>";

    /* A holiday arrival is "would arrive": the box cannot be delivered that day. */
    html += "<p><strong>" + (plan.arriveHoliday ? "Would arrive:" : "Arrives:") + "</strong> " + fmt(A) + ".";
    if (daysBetween(A, R) !== 0) html += "<br>" + rollText(plan);
    html += "</p>";

    /* A cold box that should not go out this way gets no report line;
       the cold-box line below says what to do instead. */
    var coldStop = bvd && (N > 2 || plan.arriveWeekend || plan.arriveClosed);
    if (!coldStop && !plan.missed) {
      if (plan.reportClosed) html += reportClosedHtml(plan.report);
      else html += "<p><strong>Report:</strong> " + fmt(plan.report) + ".</p>";
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
      for (var k = 0; k < 28 && (isLabClosed(B, N) || isLabClosed(addDays(B, N), N)); k++) B = addDays(B, 1);
      if (plan.arriveWeekend && !plan.skipped.length)
        html += "<p><strong>Ear notches and BVD blood ship cold.</strong> This box would land on a " + DAYS[A.getDay()] +
          " and wait for Monday, past 48 hours. Ship on " + fmt(B) + " instead, so it lands on a weekday.</p>";
      else
        html += "<p><strong>Ear notches and BVD blood ship cold.</strong> This box would land on " +
          (plan.arriveWeekend ? "a " + DAYS[A.getDay()] : fmt(A) + ", which is " + closedLabel(A, N) + ",") +
          " and wait for " + fmt(R) + ", past 48 hours. Ship on " + fmt(B) + " instead, so it lands on a lab day.</p>";
    } else {
      html += "<p><strong>Ear notches and BVD blood ship cold.</strong> Refrigerate before shipping and pack with ice packs. Sample on the day you ship, so the box arrives within 48 hours of collection.</p>";
    }
    return {
      html: html,
      ship: isLabClosed(S, N) || coldStop ? null : S,
      form: bvd ? FORMS.bvd.name : "",
      cold: bvd
    };
  }
  function shipbyAnswer(shipValue, transitValue, kindValue, today) {
    return shipbyResult(shipValue, transitValue, kindValue, today).html;
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
      var s = Math.round(c / 10);
      html += "<li><strong>Calves:</strong> roughly " + num(c) + " in a calving season of about ten weeks, " +
        (s >= 1 ? "about " + num(s) + " a week on average, more at the peak." : "fewer than one a week.") + SHIP_WEEKLY + "</li>";
    } else {
      var w = Math.round(c / 52);
      if (w >= 1) html += "<li><strong>Calves:</strong> roughly " + num(c) + " a year, about " + num(w) + " a week." + SHIP_WEEKLY + "</li>";
      else html += "<li><strong>Calves:</strong> roughly " + num(c) + " a year, fewer than one a week. Notch the calves born since the last box and ship them that same day, so they reach the lab within 48 hours of collection.</li>";
    }
    html += "<li><strong>Purchases:</strong> test every purchased animal, bulls included, before it joins the herd.</li>";
    html += "<li><strong>Positives:</strong> isolate the animal and test its dam. It is retested or removed on the veterinarian's advice.</li>";
    html += "<li><strong>Vaccination:</strong> calves and open adults, on a schedule Dr. Pearson sets for your herd.</li>";
    html += '<li><strong>Ship day:</strong> the lab is staffed Monday to Friday, so pick a ship day that gets the cold box there on a weekday. The <a href="shipping_test.html#planner">ship-by planner</a> checks the arrival day.</li>';
    html += '</ol><p class="muted">Planning estimate only, based on about nine calves per ten breeding females a year. Call the lab to plan with the numbers from your own herd.</p>';
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

  /* 8. Calendar file for the draw-and-ship day (.ics, RFC 5545). One all-day
     event. The day is written as a plain date (VALUE=DATE, no time zone), so it
     lands on the same calendar day wherever the phone is. Nothing is sent: the
     page builds the text and the browser saves it. */
  var ICS_TITLE = "Draw and ship samples to The Dairy Doctor";
  var ICS_FILE = "dairy-doctor-reminder.ics";
  var LAB_ADDRESS = "Advanced Dairy Diagnostics & Consulting, LLC, 362 310th Avenue, Frederic, WI 54837";
  var ANY_PREG_FORM = "Cattle-Bison or the Small Ruminant Pregnancy Test Submission Form";
  var COLD_LINE = "Ear notches and BVD blood ship cold and must reach the lab within 48 hours of collection.";

  function pad2(n) {
    return ("0" + n).slice(-2);
  }
  /* "20261116" from a local date. */
  function icsDate(d) {
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
  }
  /* "20261111T154500Z": the one UTC value in the file (when it was made). */
  function icsStamp(d) {
    return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) + "T" + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + pad2(d.getUTCSeconds()) + "Z";
  }
  function icsText(v) {
    return String(v).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }
  /* Lines longer than 75 bytes are folded: CRLF plus one space. */
  function icsFold(line) {
    var out = [];
    var cur = "";
    var bytes = 0;
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      var code = line.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff && i + 1 < line.length) ch += line.charAt(++i);
      var n = ch.length === 2 ? 4 : code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
      if (bytes + n > 75) {
        out.push(cur);
        cur = " ";
        bytes = 1;
      }
      cur += ch;
      bytes += n;
    }
    out.push(cur);
    return out.join("\r\n");
  }
  /* o.date is a local Date or "YYYY-MM-DD"; o.summary and o.description are
     plain text (a newline in the description is a line break); o.now is the
     Date used for DTSTAMP (default: now). Returns "" when the date is not
     usable. The UID comes from the date alone, so a second download of the
     same day replaces the first in a calendar instead of adding a copy. */
  function makeIcs(o) {
    var day = o && o.date instanceof Date ? startOfDay(o.date) : parseDate(o && o.date);
    if (!day || isNaN(day.getTime())) return "";
    var now = o.now instanceof Date ? o.now : new Date();
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//The Dairy Doctor//Draw and ship day//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:draw-and-ship-" + icsDate(day) + "@dairydoctor.com",
      "DTSTAMP:" + icsStamp(now),
      "DTSTART;VALUE=DATE:" + icsDate(day),
      "DTEND;VALUE=DATE:" + icsDate(addDays(day, 1)),
      "SUMMARY:" + icsText(o.summary || ICS_TITLE),
      "DESCRIPTION:" + icsText(o.description || ""),
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    return lines.map(icsFold).join("\r\n") + "\r\n";
  }
  /* The file for a timing or ship-by answer. formName is "" when the answer
     does not know which form (the planner on a pregnancy box); cold adds the
     48-hour line for BVD. */
  function drawShipIcs(ship, formName, cold, now) {
    var text = "Use the " + (formName || ANY_PREG_FORM) + ".\nShip to " + LAB_ADDRESS + ".\nQuestions: (715) 653-2201.";
    if (cold) text += "\n" + COLD_LINE;
    return makeIcs({ date: ship, summary: ICS_TITLE, description: text, now: now });
  }

  /* The draw-and-ship day as plain text that can be copied by hand, shown
     beside the calendar file button: "Draw and ship: Monday, Nov 16, 2026".
     "" when there is no day. No outside calendar service is named or linked. */
  function dayLine(ship) {
    return ship instanceof Date && !isNaN(ship.getTime()) ? DAY_LINE + fmt(ship) : "";
  }

  /* 9. Herd list sheets (herd-list.html). A herd with more animals than lines
     on the form prints list sheets in the form's own columns: Tube # and
     Animal #/ID, two column pairs of 20 rows, 40 lines a sheet. The farmer
     pastes a list (typed, one column copied from a spreadsheet, or a CSV or
     text export). These functions read it, keep the farmer's order exactly
     (never sort), and number the tubes from a start number. Nothing leaves
     the page and nothing is stored. */
  var LIST_MAX = 1000;
  var SHEET_ROWS = 20;
  var SHEET_LINES = 40;
  var LIST_TESTS = [
    ["preg_cattle", "Cattle or bison pregnancy"],
    ["preg_small", "Goat or sheep pregnancy"],
    ["bvd", "BVD PI"]
  ];
  var HEADING_WORDS = /(^|[^a-z])(id|ids|tag|tags|cow|cows|animal|animals|ear|eid|rfid|number|no|name|visual)([^a-z]|$)/i;
  var SHEET_FOOT = "The Dairy Doctor, Frederic, WI. Phone (715) 653-2201. Fax (715) 653-4301.";

  function listLines(text) {
    return String(text == null ? "" : text).split(/\r\n|\r|\n/);
  }
  /* Lines that hold a run of two or more spaces between words (a report whose
     columns are lined up with spaces, such as a herd software printout). The
     line is trimmed first, so right-aligned numbers and trailing spaces do
     not count. A single space (a "840 003 123" tag) never counts. */
  var SPACE_RUN = /[  ]{2,}/;
  /* "\t" when any line holds a tab (a spreadsheet copy), "," when at least
     half the lines hold a comma (a CSV export), "  " (two spaces) when no tab
     or comma rules and more than half the lines hold a run of two or more
     spaces (a space-aligned report), otherwise "" (one column). */
  function listDelimiter(lines) {
    var filled = lines.filter(function (l) {
      return l.trim() !== "";
    });
    if (!filled.length) return "";
    if (filled.some(function (l) {
      return l.indexOf("\t") !== -1;
    })) return "\t";
    var commas = filled.filter(function (l) {
      return l.indexOf(",") !== -1;
    }).length;
    if (commas * 2 >= filled.length) return ",";
    var spaced = filled.filter(function (l) {
      return SPACE_RUN.test(l.trim());
    }).length;
    return spaced * 2 > filled.length ? "  " : "";
  }
  /* One line to trimmed cells. A cell in double quotes may hold the
     delimiter; "" inside quotes is one quote mark. With the two-space
     delimiter a cell ends at each run of two or more spaces. */
  function listCells(line, delim) {
    if (!delim) return [line.trim()];
    if (delim === "  ") return line.trim().split(/[  ]{2,}/);
    var cells = [];
    var cur = "";
    var quoted = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      if (quoted) {
        if (ch !== '"') cur += ch;
        else if (line.charAt(i + 1) === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else if (ch === '"' && cur.trim() === "") {
        quoted = true;
        cur = "";
      } else if (ch === delim) {
        cells.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }
  /* A first row is a heading when its cell in the ID column is not a number
     and some cell in it reads like a heading word (ID, Tag, Cow, Animal, #). */
  function looksLikeHeading(cells, col) {
    var v = cells[col] || "";
    if (!v || /^[\d\s.\-\/]+$/.test(v)) return false;
    return cells.some(function (c) {
      return c.indexOf("#") !== -1 || HEADING_WORDS.test(c);
    });
  }
  function listKey(id) {
    return id.replace(/\s+/g, " ").toUpperCase();
  }
  /* IDs that show up more than once, as { id, count }, in the order each
     first repeats. Case and inner spacing are ignored when comparing. */
  function listDuplicates(ids) {
    var seen = {};
    var out = [];
    ids.forEach(function (id) {
      var k = listKey(id);
      if (!Object.prototype.hasOwnProperty.call(seen, k)) seen[k] = { id: id, count: 0 };
      seen[k].count++;
      if (seen[k].count === 2) out.push(seen[k]);
    });
    return out.map(function (d) {
      return { id: d.id, count: d.count };
    });
  }
  /* text is the pasted list; column is the 0-based ID column (anything else
     reads as the first); heading is true or false when the farmer set it,
     null to decide from the first row. Blank lines and rows with nothing in
     the ID column are dropped (counted in noId); the order is kept. */
  function parseHerdList(text, column, heading) {
    var lines = listLines(text);
    var delim = listDelimiter(lines);
    var rows = [];
    lines.forEach(function (l) {
      if (l.trim() !== "") rows.push(listCells(l, delim));
    });
    var columns = rows.reduce(function (m, r) {
      return Math.max(m, r.length);
    }, 0);
    var col = Math.max(0, Math.min(columns - 1, parseInt(column, 10) || 0));
    var auto = rows.length > 0 && looksLikeHeading(rows[0], col);
    var head = rows.length > 0 && (heading === true || heading === false ? heading : auto);
    var ids = [];
    var noId = 0;
    (head ? rows.slice(1) : rows).forEach(function (r) {
      var v = (r[col] || "").trim();
      if (v) ids.push(v);
      else noId++;
    });
    var kept = ids.slice(0, LIST_MAX);
    return {
      delimiter: delim,
      columns: columns,
      preview: rows.slice(0, 3),
      column: col,
      headingAuto: auto,
      heading: head,
      headingText: head ? rows[0][col] || "" : "",
      ids: kept,
      total: ids.length,
      capped: ids.length > LIST_MAX,
      noId: noId,
      duplicates: listDuplicates(kept)
    };
  }
  /* The start tube number: blank is 1; a whole number 1 to 9,999; else null. */
  function listStart(value) {
    var v = String(value == null ? "" : value).trim();
    if (!v) return 1;
    if (!/^\d+$/.test(v)) return null;
    var n = parseInt(v, 10);
    return n >= 1 && n <= 9999 ? n : null;
  }
  /* Pages of 40: [{ number, of, first, last, rows: [{ tube, id }] }]. Tube
     numbers run from start in the pasted order. */
  function listSheets(ids, start) {
    var s = start || 1;
    var sheets = [];
    for (var i = 0; i < ids.length; i += SHEET_LINES) {
      var part = ids.slice(i, i + SHEET_LINES);
      sheets.push({
        first: s + i,
        last: s + i + part.length - 1,
        rows: part.map(function (id, k) {
          return { tube: s + i + k, id: id };
        })
      });
    }
    sheets.forEach(function (sh, k) {
      sh.number = k + 1;
      sh.of = sheets.length;
    });
    return sheets;
  }
  /* "2026-11-09" to "11/9/2026" for the sheet; anything else is "". */
  function sheetDate(v) {
    var d = parseDate(v);
    return d ? d.getMonth() + 1 + "/" + d.getDate() + "/" + d.getFullYear() : "";
  }
  function sheetFill(v, wide) {
    return '<span class="sheet-fill' + (wide ? " sheet-fill-wide" : "") + '">' + (v === "" || v == null ? "" : esc(v)) + "</span>";
  }
  function sheetCells(x) {
    return '<td class="sheet-tube">' + (x ? x.tube : "") + '</td><td class="sheet-id">' + (x ? esc(x.id) : "") + "</td>";
  }
  /* One printed sheet as HTML. sheet is one item from listSheets, or null for
     the blank sheet; meta is { farm, date ("YYYY-MM-DD"), test (a LIST_TESTS
     key or ""), lastTube }. herd-list.html carries sheetHtml(null) as its
     no-script blank sheet. */
  function sheetHtml(sheet, meta) {
    var s = sheet || null;
    var m = meta || {};
    var html = '<div class="list-sheet">';
    html += '<p class="sheet-title">Animal list sheet ' + sheetFill(s ? s.number : "") + " of " + sheetFill(s ? s.of : "") + "</p>";
    html += '<p class="sheet-staple">Goes with the signed submission form. Staple to the form.</p>';
    html += '<div class="sheet-fields">';
    html += "<p>Farm or owner name: " + sheetFill(m.farm || "", true) + "</p>";
    html += "<p>Date collected: " + sheetFill(sheetDate(m.date)) + "</p>";
    html += '<p class="sheet-test">Test (check one): ' +
      LIST_TESTS.map(function (t) {
        return '<span class="sheet-check"><span class="sheet-box">' + (m.test === t[0] ? "X" : "") + "</span> " + t[1] + "</span>";
      }).join(" ") + "</p>";
    html += "<p>Tubes on this sheet: " + sheetFill(s ? s.first : "") + " to " + sheetFill(s ? s.last : "") + "</p>";
    html += "<p>Total tubes in the box: " + sheetFill(s ? m.lastTube : "") + "</p>";
    html += "</div>";
    html += '<table class="sheet-table"><thead><tr><th scope="col">Tube #</th><th scope="col">Animal #/ID</th><th scope="col">Tube #</th><th scope="col">Animal #/ID</th></tr></thead><tbody>';
    for (var r = 0; r < SHEET_ROWS; r++) html += "<tr>" + sheetCells(s && s.rows[r]) + sheetCells(s && s.rows[r + SHEET_ROWS]) + "</tr>";
    html += "</tbody></table>";
    html += '<p class="sheet-foot">' + SHEET_FOOT + "</p>";
    return html + "</div>";
  }
  function countOf(n, one, many) {
    return num(n) + " " + (n === 1 ? one : many);
  }
  /* The tool's whole answer: { parsed, start, sheets, lastTube, html }. html
     is the summary under the box (count, warnings); sheets is empty when
     there is nothing to print. Warnings never block printing. */
  function herdListResult(text, column, heading, startValue) {
    var p = parseHerdList(text, column, heading);
    var start = listStart(startValue);
    var res = { parsed: p, start: start, sheets: [], lastTube: 0, html: "" };
    if (!p.ids.length) {
      res.html = '<p class="muted">' + (p.columns ? "No animal IDs found in that column yet." : "Paste your list in the box to see the sheets.") + "</p>";
      return res;
    }
    if (start === null) {
      res.html = '<p class="muted">Enter a start tube number from 1 to 9,999, or put it back to 1.</p>';
      return res;
    }
    var n = p.ids.length;
    res.sheets = listSheets(p.ids, start);
    res.lastTube = start + n - 1;
    var where = "Tubes " + num(start) + " to " + num(res.lastTube) + " on " + countOf(res.sheets.length, "list sheet", "list sheets") + ".";
    var html = "";
    if (p.capped)
      html += '<p class="list-warn"><strong>This list has ' + countOf(p.total, "animal", "animals") + ", more than the " + num(LIST_MAX) +
        " these sheets take.</strong> Only the first " + num(LIST_MAX) + " are on the sheets. Check that this is the right list, or call the lab at " + PHONE + ".</p><p>" + where + "</p>";
    else html += "<p><strong>This list has " + countOf(n, "animal", "animals") + ".</strong> " + where + "</p>";
    if (p.duplicates.length) {
      var twice = p.duplicates.every(function (d) {
        return d.count === 2;
      });
      var shown = p.duplicates.slice(0, 12).map(function (d) {
        return esc(d.id);
      }).join(", ");
      var more = p.duplicates.length > 12 ? ", and " + num(p.duplicates.length - 12) + " more" : "";
      html += '<p class="list-warn"><strong>' + (p.duplicates.length === 1 ? "This ID shows up " : "These IDs show up ") + (twice ? "twice: " : "more than once: ") +
        shown + more + ". Check before you print.</strong></p>";
    }
    if (p.heading) html += '<p class="muted">The first row, "' + esc(p.headingText) + '", is read as a heading and left off the sheets.</p>';
    if (p.noId) html += '<p class="muted">' + countOf(p.noId, "row has", "rows have") + " nothing in column " + (p.column + 1) + " and " + (p.noId === 1 ? "is" : "are") + " left off.</p>";
    if (start > 1)
      html += '<p class="muted">Tube numbers start at ' + num(start) + ". The sheets count tubes 1 to " + num(start - 1) + " as already in the box and show " + num(res.lastTube) + " as the total.</p>";
    res.html = html;
    return res;
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
      timingResult: timingResult,
      shipbyAnswer: shipbyAnswer,
      shipbyResult: shipbyResult,
      makeIcs: makeIcs,
      drawShipIcs: drawShipIcs,
      ICS_FILE: ICS_FILE,
      dayLine: dayLine,
      TRANSIT_LABEL: TRANSIT_LABEL,
      TRANSIT_HINT: TRANSIT_HINT,
      MON_WED_LINE: MON_WED_LINE,
      closedLabel: closedLabel,
      chooserAnswer: chooserAnswer,
      bvdAnswer: bvdAnswer,
      checklistAnswer: checklistAnswer,
      suppliesAnswer: suppliesAnswer
    };
    /* Herd list sheets (9). */
    module.exports.LIST_MAX = LIST_MAX;
    module.exports.listLines = listLines;
    module.exports.listDelimiter = listDelimiter;
    module.exports.listCells = listCells;
    module.exports.looksLikeHeading = looksLikeHeading;
    module.exports.listDuplicates = listDuplicates;
    module.exports.parseHerdList = parseHerdList;
    module.exports.listStart = listStart;
    module.exports.listSheets = listSheets;
    module.exports.sheetDate = sheetDate;
    module.exports.sheetHtml = sheetHtml;
    module.exports.herdListResult = herdListResult;
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

  /* Run fn once typing has stopped (later) or right away (now). */
  function settleThen(fn) {
    var timer = null;
    return {
      later: function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          timer = null;
          fn();
        }, 600);
      },
      now: function () {
        if (timer === null) return;
        clearTimeout(timer);
        timer = null;
        fn();
      }
    };
  }
  /* Offer the calendar file as a download from the [data-ics] button inside a
     tool, and the same day as copyable text in the [data-day] element beside
     it (made here, right after the button, when the page has none). Both ship
     hidden; they show only while the answer names a draw-and-ship day.
     Returns the function that tells them the latest answer ({ ship, form,
     cold }). The file is built when the button is pressed and saved by the
     browser; nothing is sent anywhere. */
  function icsButton(root) {
    var btn = $("[data-ics]", root);
    if (!btn) return function () {};
    var label = btn.textContent;
    var current = null;
    var timer = null;
    var status = document.createElement("span");
    status.className = "sr-only";
    status.setAttribute("aria-live", "polite");
    btn.parentNode.appendChild(status);
    var line = $("[data-day]", root);
    if (!line) {
      line = document.createElement("span");
      line.className = "tool-day";
      line.setAttribute("data-day", "");
      btn.parentNode.insertBefore(line, btn.nextSibling);
    }
    line.hidden = true;
    btn.hidden = true;
    on(btn, "click", function () {
      if (!current || !current.ship) return;
      var text = drawShipIcs(current.ship, current.form, current.cold, new Date());
      if (!text) return;
      var a = document.createElement("a");
      var url = "";
      var blob = null;
      try {
        blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
        url = window.URL.createObjectURL(blob);
      } catch (err) {
        url = "data:text/calendar;charset=utf-8," + encodeURIComponent(text);
      }
      a.href = url;
      a.download = ICS_FILE;
      a.hidden = true;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (blob) setTimeout(function () {
        window.URL.revokeObjectURL(url);
      }, 1000);
      btn.textContent = "Calendar file saved";
      clearTimeout(timer);
      timer = setTimeout(function () {
        btn.textContent = label;
      }, 2400);
      status.textContent = "";
      setTimeout(function () {
        status.textContent = "Calendar file saved. Open it to add " + fmt(current.ship) + " to your calendar.";
      }, 50);
    });
    return function (answer) {
      current = answer && answer.ship ? answer : null;
      btn.hidden = !current;
      line.textContent = current ? dayLine(current.ship) : "";
      line.hidden = !current;
    };
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

    var calendar = icsButton(root);
    function run() {
      if (calvedField) calvedField.hidden = speciesKind(species.value) !== "cattle";
      var r = timingResult(species.value, bred.value, calved ? calved.value : "", transit.value, startOfDay(new Date()));
      out.innerHTML = r.html;
      calendar(r);
    }
    /* The answer is a live region: a date field fires an event for every digit
       of a year, so wait until the typing stops (or the field loses focus). */
    var settle = settleThen(run);
    on(species, "change", run);
    on(transit, "change", run);
    on(bred, "change", settle.later);
    on(bred, "blur", settle.now);
    on(calved, "change", settle.later);
    on(calved, "blur", settle.now);
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

    var calendar = icsButton(root);
    function run() {
      var r = shipbyResult(ship.value, transit.value, kind ? kind.value : "preg", startOfDay(new Date()));
      out.innerHTML = r.html;
      calendar(r);
    }
    var settle = settleThen(run);
    on(ship, "change", settle.later);
    on(ship, "blur", settle.now);
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

    /* The page ships the whole list visible and the stepper hidden. Only when
       the stepper has drawn its first step does the list go away and the
       stepper show; if anything here throws, the list stays visible. */
    try {
      render();
      root.setAttribute("tabindex", "0");
      list.hidden = true;
      if (head) head.hidden = true;
      root.hidden = false;
    } catch (err) {
      list.hidden = false;
      if (head) head.hidden = false;
      root.hidden = true;
    }
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

  /* ---------------- 11. Herd list sheets (herd-list.html) ---------------- */
  /* Which sheets print is one attribute on <body>: data-sheets="list" prints
     the filled sheets, anything else the blank one (css: .list-page). The
     page's own Print therefore prints the list once there is one. */
  function printSheets(which) {
    var body = document.body;
    var before = body.getAttribute("data-sheets");
    body.setAttribute("data-sheets", which);
    function done() {
      window.removeEventListener("afterprint", done);
      if (before === null) body.removeAttribute("data-sheets");
      else body.setAttribute("data-sheets", before);
    }
    window.addEventListener("afterprint", done);
    window.print();
  }
  $all(".list-nojs").forEach(function (el) {
    el.hidden = true;
  });
  $all("[data-blank-print]").forEach(function (btn) {
    on(btn, "click", function () {
      printSheets("blank");
    });
    btn.hidden = false;
  });
  each('[data-tool="herdlist"]', function (root) {
    var fields = $(".list-fields", root);
    var box = $("textarea", root);
    var colWrap = $(".list-columns", root);
    var colSel = $('select[name="column"]', root);
    var preview = $(".list-preview", root);
    var headBox = $('input[name="heading"]', root);
    var test = $('select[name="test"]', root);
    var farm = $('input[name="farm"]', root);
    var date = $('input[name="collected"]', root);
    var start = $('input[name="start"]', root);
    var out = $(".tool-out", root);
    var printBtn = $("[data-list-print]", root);
    var clearBtn = $("[data-list-clear]", root);
    var sheets = $(root.getAttribute("data-sheets") || "#list-sheets");
    var sheetsSection = sheets ? sheets.closest("section") : null;
    if (!fields || !box || !colSel || !headBox || !start || !out || !printBtn || !sheets) return;
    var headTouched = false;
    var colKey = "";
    var last = null;

    /* Column picker: one option per column, named by its first-row cell, and
       the first three rows as a small table. Rebuilt only when they change. */
    function columns(p) {
      var show = p.columns > 1;
      if (colWrap) colWrap.hidden = !show;
      var key = show ? p.columns + "|" + JSON.stringify(p.preview) : "";
      if (key === colKey) return;
      colKey = key;
      var keep = colSel.value;
      colSel.innerHTML = "";
      if (preview) preview.innerHTML = "";
      if (!show) return;
      for (var c = 0; c < p.columns; c++) {
        var o = document.createElement("option");
        var first = (p.preview[0] && p.preview[0][c]) || "";
        o.value = String(c);
        o.textContent = "Column " + (c + 1) + (first ? ": " + first.slice(0, 30) : "");
        colSel.appendChild(o);
      }
      colSel.value = keep && Number(keep) < p.columns ? keep : String(p.column);
      if (!preview) return;
      var table = document.createElement("table");
      table.className = "list-preview-table";
      var cap = document.createElement("caption");
      cap.textContent = "The first rows of your list";
      table.appendChild(cap);
      p.preview.forEach(function (row) {
        var tr = document.createElement("tr");
        for (var k = 0; k < p.columns; k++) {
          var td = document.createElement("td");
          td.textContent = (row[k] || "").slice(0, 24);
          tr.appendChild(td);
        }
        table.appendChild(tr);
      });
      preview.appendChild(table);
    }

    function run() {
      var r = herdListResult(box.value, colSel.value, headTouched ? headBox.checked : null, start.value);
      last = r;
      columns(r.parsed);
      if (!headTouched) headBox.checked = r.parsed.heading;
      if (listStart(start.value) === null) start.setAttribute("aria-invalid", "true");
      else start.removeAttribute("aria-invalid");
      out.innerHTML = r.html;
      var meta = { farm: farm ? farm.value.trim() : "", date: date ? date.value : "", test: test ? test.value : "", lastTube: r.lastTube };
      sheets.innerHTML = r.sheets
        .map(function (s) {
          return sheetHtml(s, meta);
        })
        .join("");
      var has = r.sheets.length > 0;
      if (sheetsSection) sheetsSection.hidden = !has;
      if (has) document.body.setAttribute("data-sheets", "list");
      else document.body.removeAttribute("data-sheets");
      printBtn.disabled = !has;
    }
    /* The summary is a live region: wait until the typing stops. */
    var settle = settleThen(run);
    on(box, "input", settle.later);
    on(box, "blur", settle.now);
    on(start, "input", settle.later);
    on(start, "blur", settle.now);
    on(colSel, "change", run);
    on(headBox, "change", function () {
      headTouched = true;
      run();
    });
    [test, date].forEach(function (el) {
      on(el, "change", run);
    });
    on(farm, "input", settle.later);
    on(farm, "blur", settle.now);
    on(printBtn, "click", function () {
      settle.now();
      if (last && last.sheets.length) printSheets("list");
    });
    on(clearBtn, "click", function () {
      box.value = "";
      headTouched = false;
      run();
      box.focus();
    });
    fields.hidden = false;
    run();
  });
})();
