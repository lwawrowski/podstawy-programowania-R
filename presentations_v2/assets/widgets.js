/* Widgety do prezentacji "Przetwarzanie danych" (zjazd 2).
   Czysty JavaScript, bez zależności. Każdy widget szuka swojego
   kontenera po id i rysuje się w nim. */
(function () {
  "use strict";

  // ---------- pomocnicze ----------
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") e.className = attrs[k];
        else if (k === "html") e.innerHTML = attrs[k];
        else if (k === "text") e.textContent = attrs[k];
        else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), attrs[k]);
        else e.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function fmt(v) {
    if (v === null || v === undefined) return "NA";
    if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(1);
    return String(v);
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function table(cols, rows, opts) {
    opts = opts || {};
    var t = el("table", { class: "w-table" });
    var thead = el("thead");
    var tr = el("tr");
    cols.forEach(function (c) {
      tr.appendChild(el("th", { class: (opts.newCols || []).indexOf(c) >= 0 ? "w-new" : "" , text: c }));
    });
    thead.appendChild(tr);
    t.appendChild(thead);
    var tb = el("tbody");
    rows.forEach(function (r, i) {
      var row = el("tr", { class: opts.rowClass ? opts.rowClass(r, i) : "" });
      cols.forEach(function (c) {
        var v = r[c];
        row.appendChild(el("td", { class: v === null || v === undefined ? "w-na" : "", text: fmt(v) }));
      });
      tb.appendChild(row);
    });
    t.appendChild(tb);
    return t;
  }

  // ---------- dane: 12 klientów ze zbioru bank ----------
  var BANK = [
    { wiek: 34, wykszt: "wyzsze", saldo: 724, hipoteka: "nie" },
    { wiek: 51, wykszt: "podstawowe", saldo: 3982, hipoteka: "nie" },
    { wiek: 31, wykszt: "srednie", saldo: 2420, hipoteka: "tak" },
    { wiek: 51, wykszt: "srednie", saldo: 423, hipoteka: "tak" },
    { wiek: 52, wykszt: "srednie", saldo: 598, hipoteka: "nie" },
    { wiek: 58, wykszt: "wyzsze", saldo: 2143, hipoteka: "tak" },
    { wiek: 39, wykszt: "srednie", saldo: 147, hipoteka: "tak" },
    { wiek: 31, wykszt: "srednie", saldo: 4388, hipoteka: "tak" },
    { wiek: 30, wykszt: "wyzsze", saldo: 1, hipoteka: "nie" },
    { wiek: 40, wykszt: "srednie", saldo: 192, hipoteka: "tak" },
    { wiek: 28, wykszt: "podstawowe", saldo: 507, hipoteka: "tak" },
    { wiek: 47, wykszt: null, saldo: 1506, hipoteka: "tak" }
  ];

  // ---------- 1. Budowniczy potoku ----------
  function pipeline(root) {
    var steps = [
      { id: "filter", label: 'filter(hipoteka == "tak")', on: false },
      { id: "mutate", label: "mutate(saldo_tys = saldo / 1000)", on: false },
      { id: "select", label: "select(wiek, wykszt, saldo…)", on: false },
      { id: "summarise", label: "summarise(…, .by = wykszt)", on: false },
      { id: "arrange", label: "arrange(desc(…))", on: false }
    ];
    var left = el("div", { class: "w-col-left" });
    var right = el("div", { class: "w-col-right" });
    root.appendChild(left);
    root.appendChild(right);

    var toggles = el("div", { class: "w-steps" });
    steps.forEach(function (s) {
      var b = el("button", {
        class: "w-step",
        onclick: function () { s.on = !s.on; render(); }
      }, [s.label]);
      s.btn = b;
      toggles.appendChild(b);
    });
    var reset = el("button", { class: "w-btn w-small", onclick: function () {
      steps.forEach(function (s) { s.on = false; }); render();
    } }, ["Wyczyść"]);
    left.appendChild(toggles);
    left.appendChild(reset);
    var code = el("pre", { class: "w-code" });
    left.appendChild(code);
    var info = el("div", { class: "w-info" });
    right.appendChild(info);
    var tabHolder = el("div", { class: "w-tabholder" });
    right.appendChild(tabHolder);

    function on(id) { return steps.filter(function (s) { return s.id === id; })[0].on; }

    function render() {
      steps.forEach(function (s) { s.btn.classList.toggle("on", s.on); });
      var rows = BANK.map(function (r) { return Object.assign({}, r); });
      var cols = ["wiek", "wykszt", "saldo", "hipoteka"];
      var newCols = [];
      var lines = ["bank"];
      var valCol = "saldo";

      if (on("filter")) {
        rows = rows.filter(function (r) { return r.hipoteka === "tak"; });
        lines.push('filter(hipoteka == "tak")');
      }
      if (on("mutate")) {
        rows.forEach(function (r) { r.saldo_tys = Math.round(r.saldo / 100) / 10; });
        cols.push("saldo_tys");
        newCols.push("saldo_tys");
        valCol = "saldo_tys";
        lines.push("mutate(saldo_tys = round(saldo / 1000, 1))");
      }
      if (on("select")) {
        cols = ["wiek", "wykszt", valCol];
        lines.push("select(wiek, wykszt, " + valCol + ")");
      }
      if (on("summarise")) {
        var groups = {};
        var order = [];
        rows.forEach(function (r) {
          var k = r.wykszt === null ? "__NA__" : r.wykszt;
          if (!groups[k]) { groups[k] = []; order.push(k); }
          groups[k].push(r[valCol]);
        });
        var meanCol = "srednie_" + valCol;
        rows = order.map(function (k) {
          var v = groups[k];
          var o = { wykszt: k === "__NA__" ? null : k, liczba: v.length };
          o[meanCol] = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
          return o;
        });
        cols = ["wykszt", "liczba", meanCol];
        newCols = ["liczba", meanCol];
        valCol = meanCol;
        lines.push("summarise(liczba = n(), " + meanCol + " = mean(" + meanCol.replace("srednie_", "") + "), .by = wykszt)");
      }
      if (on("arrange")) {
        rows.sort(function (a, b) { return b[valCol] - a[valCol]; });
        lines.push("arrange(desc(" + valCol + "))");
      }
      code.innerHTML = lines.map(function (l, i) {
        var pre = i === 0 ? "" : "  ";
        var post = i < lines.length - 1 ? " |>" : "";
        return esc(pre + l + post);
      }).join("\n");
      info.innerHTML = "Wynik: <b>" + rows.length + "</b> wierszy × <b>" + cols.length + "</b> kolumn";
      tabHolder.innerHTML = "";
      tabHolder.appendChild(table(cols, rows, { newCols: newCols }));
    }
    render();
  }

  // ---------- 2. Quiz: który czasownik? ----------
  function verbquiz(root) {
    var Q = [
      ["Chcę zobaczyć tylko klientów z hipoteką.", "filter", "Wybieramy wiersze spełniające warunek."],
      ["Chcę zostawić tylko kolumny wiek i saldo.", "select", "Wybieramy kolumny."],
      ["Chcę dodać kolumnę z saldem w tysiącach zł.", "mutate", "Nowa kolumna liczona z istniejących."],
      ["Chcę policzyć średnie saldo w każdej grupie wykształcenia.", "summarise", "Podsumowanie w grupach: summarise(.by = wykszt)."],
      ["Chcę ułożyć klientów od najstarszego.", "arrange", "Sortowanie: arrange(desc(wiek))."],
      ["Chcę klientów w wieku 30–40 lat.", "filter", "Warunek na wiersze: filter(wiek >= 30, wiek <= 40)."],
      ["Chcę kolumnę „grupa_wiekowa” z wartościami „do 40” i „40+”.", "mutate", "Nowa kolumna, np. mutate(grupa = if_else(wiek < 40, \"do 40\", \"40+\"))."],
      ["Chcę wiedzieć, ilu jest klientów w każdym stanie cywilnym.", "summarise", "Liczebności w grupach: summarise(n = n(), .by = stan_cywil) albo count(stan_cywil)."],
      ["Chcę usunąć kolumnę „kontakt”, bo jest pusta.", "select", "select(-kontakt) usuwa kolumnę."],
      ["Chcę posortować grupy od najwyższego średniego salda.", "arrange", "arrange(desc(srednie_saldo)) po summarise."]
    ];
    var verbs = ["filter", "select", "mutate", "summarise", "arrange"];
    var order = shuffle(Q), pos = -1, score = 0, answered = 0, locked = false;
    var qBox = el("div", { class: "w-question", text: "Kliknij „Losuj zadanie”." });
    var btns = el("div", { class: "w-choices" });
    var fb = el("div", { class: "w-feedback" });
    var sc = el("div", { class: "w-score" });
    var next = el("button", { class: "w-btn", onclick: draw }, ["Losuj zadanie"]);
    verbs.forEach(function (v) {
      btns.appendChild(el("button", { class: "w-choice", "data-v": v, onclick: function () { answer(v, this); } }, [v + "()"]));
    });
    root.appendChild(next);
    root.appendChild(qBox);
    root.appendChild(btns);
    root.appendChild(fb);
    root.appendChild(sc);
    function draw() {
      pos = (pos + 1) % order.length;
      if (pos === 0 && answered > 0) order = shuffle(Q);
      qBox.textContent = order[pos][0];
      fb.textContent = ""; fb.className = "w-feedback";
      locked = false;
      Array.prototype.forEach.call(btns.children, function (b) { b.classList.remove("ok", "bad"); });
    }
    function answer(v, b) {
      if (pos < 0 || locked) return;
      locked = true; answered++;
      var q = order[pos];
      if (v === q[1]) { score++; b.classList.add("ok"); fb.className = "w-feedback ok"; fb.textContent = "Dobrze! " + q[2]; }
      else {
        b.classList.add("bad");
        btns.querySelector('[data-v="' + q[1] + '"]').classList.add("ok");
        fb.className = "w-feedback bad"; fb.textContent = "Nie tym razem: to " + q[1] + "(). " + q[2];
      }
      sc.textContent = "Wynik: " + score + " / " + answered;
    }
  }

  // ---------- 3. Ułóż potok (zadanie Parsonsa) ----------
  function parsons(root) {
    var correct = [
      "bank |>",
      "  filter(wiek >= 30) |>",
      "  summarise(srednie_saldo = mean(saldo), .by = wykszt) |>",
      "  arrange(desc(srednie_saldo))"
    ];
    var cur;
    do { cur = shuffle(correct); } while (cur.join() === correct.join());
    var list = el("div", { class: "w-plist" });
    var fb = el("div", { class: "w-feedback" });
    root.appendChild(list);
    root.appendChild(el("div", { class: "w-row" }, [
      el("button", { class: "w-btn", onclick: check }, ["Sprawdź"]),
      el("button", { class: "w-btn w-ghost", onclick: function () { cur = shuffle(correct); fb.textContent = ""; fb.className = "w-feedback"; render(); } }, ["Pomieszaj"])
    ]));
    root.appendChild(fb);
    function move(i, d) {
      var j = i + d; if (j < 0 || j >= cur.length) return;
      var t = cur[i]; cur[i] = cur[j]; cur[j] = t; render();
    }
    function render() {
      list.innerHTML = "";
      cur.forEach(function (line, i) {
        list.appendChild(el("div", { class: "w-pline" }, [
          el("button", { class: "w-arrow", title: "w górę", onclick: function () { move(i, -1); } }, ["▲"]),
          el("button", { class: "w-arrow", title: "w dół", onclick: function () { move(i, 1); } }, ["▼"]),
          el("code", { text: line.trim() })
        ]));
      });
    }
    function check() {
      var ok = cur.join() === correct.join();
      var lines = list.querySelectorAll(".w-pline");
      cur.forEach(function (l, i) { lines[i].classList.toggle("ok", l === correct[i]); lines[i].classList.toggle("bad", l !== correct[i]); });
      if (ok) { fb.className = "w-feedback ok"; fb.textContent = "Brawo! Najpierw zawężamy wiersze, potem podsumowujemy, na końcu sortujemy po nowej kolumnie."; }
      else {
        var hint = cur.indexOf(correct[0]) !== 0 ? "Potok zawsze zaczyna się od danych." :
          cur.indexOf(correct[1]) > cur.indexOf(correct[2]) ? "Po summarise() nie ma już kolumny wiek, więc filter() musi być wcześniej." :
          "Kolumna srednie_saldo powstaje dopiero w summarise(), więc arrange() idzie na koniec.";
        fb.className = "w-feedback bad"; fb.textContent = "Jeszcze nie. Wskazówka: " + hint;
      }
    }
    render();
  }

  // ---------- 4. Znajdź błąd ----------
  function bughunt(root) {
    var V = [
      { lines: ["bank |>", '  filter(wykszt = "wyzsze") |>', "  select(wiek, saldo)"], bad: 1,
        why: "W warunku porównujemy przez ==, a nie =. Poprawnie: filter(wykszt == \"wyzsze\")." },
      { lines: ["bank |>", "  filter(Wiek > 30) |>", "  arrange(saldo)"], bad: 1,
        why: "R rozróżnia wielkość liter: kolumna nazywa się wiek, nie Wiek." },
      { lines: ["bank |>", "  filter(wiek > 30)", "  select(wiek, saldo)"], bad: 1,
        why: "Brakuje |> na końcu linii z filter(). Bez niego select() uruchamia się osobno i nie wie, na jakich danych działać." },
      { lines: ["bank |>", "  arrange(desc(srednie_saldo)) |>", "  summarise(srednie_saldo = mean(saldo), .by = wykszt)"], bad: 1,
        why: "Kolumna srednie_saldo jeszcze nie istnieje. arrange() musi być po summarise()." },
      { lines: ["klienci_wiek <- c(34, 51, NA, 52)", "mean(klienci_wiek)", "# wynik: NA"], bad: 1,
        why: "Brak danych daje NA w średniej. Poprawnie: mean(klienci_wiek, na.rm = TRUE)." },
      { lines: ["bank |>", '  summarise(srednie_saldo = mean(saldo), .by = "wykszt) |>', "  arrange(srednie_saldo)"], bad: 1,
        why: "Niedomknięty cudzysłów. Nazwy kolumn w dplyr piszemy bez cudzysłowu: .by = wykszt." }
    ];
    var order = shuffle(V.map(function (_, i) { return i; })), pos = -1, locked = false;
    var codeBox = el("div", { class: "w-codelines" });
    var fb = el("div", { class: "w-feedback" });
    root.appendChild(el("button", { class: "w-btn", onclick: draw }, ["Losuj kod"]));
    root.appendChild(codeBox);
    root.appendChild(fb);
    function draw() {
      pos = (pos + 1) % order.length;
      var v = V[order[pos]];
      locked = false; fb.textContent = ""; fb.className = "w-feedback";
      codeBox.innerHTML = "";
      v.lines.forEach(function (l, i) {
        codeBox.appendChild(el("div", { class: "w-cline", onclick: function () { pick(i, this); } }, [
          el("span", { class: "w-ln", text: String(i + 1) }), el("code", { text: l })
        ]));
      });
    }
    function pick(i, node) {
      if (locked) return;
      var v = V[order[pos]];
      if (i === v.bad) { locked = true; node.classList.add("ok"); fb.className = "w-feedback ok"; fb.textContent = "Trafione! " + v.why; }
      else { node.classList.add("bad"); fb.className = "w-feedback bad"; fb.textContent = "Ta linia jest w porządku. Szukaj dalej."; }
    }
    draw();
  }

  // ---------- 5. Złączenia ----------
  function joins(root) {
    var klienci = [
      { id: 1, imie: "Anna", oddzial_id: 1 },
      { id: 2, imie: "Bartek", oddzial_id: 2 },
      { id: 3, imie: "Celina", oddzial_id: 1 },
      { id: 4, imie: "Damian", oddzial_id: 4 }
    ];
    var oddzialy = [
      { oddzial_id: 1, miasto: "Poznań" },
      { oddzial_id: 2, miasto: "Warszawa" },
      { oddzial_id: 3, miasto: "Gdańsk" }
    ];
    var desc = {
      left_join: "Zostają wszyscy klienci (lewa tabela). Damian nie ma pasującego oddziału, więc dostaje NA. Najczęściej używane złączenie.",
      inner_join: "Zostają tylko wiersze, które mają parę w obu tabelach. Damian znika, Gdańsk też.",
      full_join: "Zostaje wszystko z obu tabel. Braki uzupełnia NA: Damian bez miasta, Gdańsk bez klientów.",
      anti_join: "Zostają klienci BEZ pary w drugiej tabeli. Świetne do sprawdzania, czego brakuje."
    };
    var top = el("div", { class: "w-joinsrc" }, [
      el("div", {}, [el("div", { class: "w-cap", text: "klienci" }), table(["id", "imie", "oddzial_id"], klienci, { rowClass: function (r) { return r.oddzial_id === 4 ? "w-hl-a" : ""; } })]),
      el("div", {}, [el("div", { class: "w-cap", text: "oddzialy" }), table(["oddzial_id", "miasto"], oddzialy, { rowClass: function (r) { return r.oddzial_id === 3 ? "w-hl-b" : ""; } })])
    ]);
    var btns = el("div", { class: "w-choices" });
    var code = el("pre", { class: "w-code" });
    var res = el("div", { class: "w-tabholder" });
    var fb = el("div", { class: "w-feedback info" });
    ["left_join", "inner_join", "full_join", "anti_join"].forEach(function (j) {
      btns.appendChild(el("button", { class: "w-choice", "data-j": j, onclick: function () { show(j); } }, [j + "()"]));
    });
    root.appendChild(top);
    root.appendChild(btns);
    var bottom = el("div", { class: "w-joinres" }, [el("div", {}, [code, fb]), res]);
    root.appendChild(bottom);
    function lookup(id) { return oddzialy.filter(function (o) { return o.oddzial_id === id; })[0]; }
    function show(j) {
      Array.prototype.forEach.call(btns.children, function (b) { b.classList.toggle("on", b.getAttribute("data-j") === j); });
      var rows = [], cols = ["id", "imie", "oddzial_id", "miasto"];
      klienci.forEach(function (k) {
        var o = lookup(k.oddzial_id);
        if (j === "anti_join") { if (!o) rows.push(Object.assign({}, k)); return; }
        if (o) rows.push(Object.assign({}, k, { miasto: o.miasto }));
        else if (j !== "inner_join") rows.push(Object.assign({}, k, { miasto: null }));
      });
      if (j === "full_join") {
        oddzialy.forEach(function (o) {
          if (!klienci.some(function (k) { return k.oddzial_id === o.oddzial_id; }))
            rows.push({ id: null, imie: null, oddzial_id: o.oddzial_id, miasto: o.miasto });
        });
      }
      if (j === "anti_join") cols = ["id", "imie", "oddzial_id"];
      code.textContent = j + "(klienci, oddzialy,\n  by = join_by(oddzial_id))";
      fb.textContent = desc[j] + " Wynik: " + rows.length + " wierszy.";
      res.innerHTML = "";
      res.appendChild(table(cols, rows, { rowClass: function (r) {
        return r.oddzial_id === 4 ? "w-hl-a" : r.oddzial_id === 3 ? "w-hl-b" : "";
      } }));
    }
    show("left_join");
  }

  // ---------- 6. Polowanie na błędy AI ----------
  function aihunt(root) {
    var L = [
      { code: "library(tidyverse)", kind: "ok", msg: "W porządku: ładujemy pakiety." },
      { code: "bank %>%", kind: "ok", msg: "Działa. %>% to starszy zapis potoku. Dziś częściej |>, ale oba są poprawne." },
      { code: "  filter(wykszt != NA) %>%", kind: "bug", msg: "BŁĄD: porównanie z NA zawsze daje NA, więc filter() zwróci pustą tabelę. Poprawnie: filter(!is.na(wykszt))." },
      { code: "  group_by(wykszt, hipoteka) %>%", kind: "ok", msg: "W porządku: grupujemy po dwóch zmiennych." },
      { code: "  summarise(srednie_saldo = mean(saldo)) %>%", kind: "ok", msg: "Działa. R pokaże komunikat o grupach, można go uniknąć przez .groups = \"drop\" albo .by." },
      { code: "  spread(hipoteka, srednie_saldo)", kind: "old", msg: "PRZESTARZAŁE: spread() zastąpiono przez pivot_wider(names_from = hipoteka, values_from = srednie_saldo). AI często podsuwa stare funkcje." }
    ];
    var found = 0;
    var box = el("div", { class: "w-codelines w-ai" });
    var fb = el("div", { class: "w-feedback" });
    var sol = el("pre", { class: "w-code w-hidden" });
    sol.textContent = "bank |>\n  filter(!is.na(wykszt)) |>\n  summarise(srednie_saldo = mean(saldo), .by = c(wykszt, hipoteka)) |>\n  pivot_wider(names_from = hipoteka, values_from = srednie_saldo)";
    var counter = el("div", { class: "w-score", text: "Znalezione problemy: 0 / 2" });
    root.appendChild(el("div", { class: "w-ai-head", text: "Odpowiedź asystenta AI (przykład przygotowany do ćwiczenia)" }));
    L.forEach(function (l, i) {
      box.appendChild(el("div", { class: "w-cline", onclick: function () {
        if (this.dataset.done) return;
        this.dataset.done = "1";
        this.classList.add(l.kind === "ok" ? "neutral" : "ok");
        fb.className = "w-feedback " + (l.kind === "ok" ? "info" : "ok");
        fb.textContent = l.msg;
        if (l.kind !== "ok") { found++; counter.textContent = "Znalezione problemy: " + found + " / 2"; if (found === 2) sol.classList.remove("w-hidden"); }
      } }, [el("span", { class: "w-ln", text: String(i + 1) }), el("code", { text: l.code })]));
    });
    root.appendChild(box);
    root.appendChild(counter);
    root.appendChild(fb);
    root.appendChild(el("button", { class: "w-btn w-ghost w-small", onclick: function () { sol.classList.remove("w-hidden"); } }, ["Pokaż poprawioną wersję"]));
    root.appendChild(sol);
  }

  // ---------- 7. webR ----------
  function webr(root) {
    var START = [
      "bank <- data.frame(",
      "  wiek   = c(34, 51, 31, 51, 52, 58, 47),",
      '  wykszt = c("wyzsze", "podstawowe", "srednie", "srednie", "srednie", "wyzsze", NA),',
      "  saldo  = c(724, 3982, 2420, 423, 598, 2143, 1506)",
      ")",
      "",
      "# bazowy R działa od razu:",
      "aggregate(saldo ~ wykszt, data = bank, FUN = mean)",
      "",
      "# po kliknięciu „Załaduj dplyr” odkomentuj i uruchom:",
      "# library(dplyr)",
      "# bank |> summarise(srednie_saldo = mean(saldo), .by = wykszt)"
    ].join("\n");
    var ta = el("textarea", { class: "w-editor", spellcheck: "false", wrap: "off" });
    ta.value = START;
    var out = el("pre", { class: "w-output", text: "Tu pojawi się wynik." });
    var status = el("span", { class: "w-status", text: "R nie jest jeszcze uruchomiony." });
    var runBtn = el("button", { class: "w-btn", onclick: run }, ["▶ Uruchom"]);
    var pkgBtn = el("button", { class: "w-btn w-ghost", onclick: loadDplyr }, ["Załaduj dplyr"]);
    var resetBtn = el("button", { class: "w-btn w-ghost w-small", onclick: function () { ta.value = START; } }, ["Przywróć kod"]);
    root.appendChild(el("div", { class: "w-webr-grid" }, [
      el("div", {}, [ta, el("div", { class: "w-row" }, [runBtn, pkgBtn, resetBtn, status])]),
      out
    ]));
    // Ctrl+Enter uruchamia kod, jak w RStudio
    ta.addEventListener("keydown", function (e) {
      e.stopPropagation();
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); }
    });

    var webR = null, starting = null;
    function start() {
      if (webR) return Promise.resolve(webR);
      if (starting) return starting;
      status.textContent = "Uruchamiam R w przeglądarce (kilkanaście sekund)…";
      starting = import("https://webr.r-wasm.org/latest/webr.mjs").then(function (m) {
        var w = new m.WebR();
        return w.init().then(function () { webR = w; status.textContent = "R działa."; return w; });
      }).catch(function (e) {
        starting = null;
        status.textContent = "Nie udało się uruchomić webR (brak internetu lub blokada sieci).";
        out.textContent = String(e);
        throw e;
      });
      return starting;
    }
    function run() {
      start().then(function (w) {
        status.textContent = "Liczę…";
        return new w.Shelter().then(function (shelter) {
          return shelter.captureR(ta.value, { withAutoprint: true, captureStreams: true, captureConditions: false })
            .then(function (res) {
              var txt = res.output.map(function (o) { return (o.type === "stderr" ? "! " : "") + o.data; }).join("\n");
              out.textContent = txt || "(brak wyniku do wyświetlenia)";
              status.textContent = "Gotowe.";
            })
            .catch(function (e) { out.textContent = "Błąd: " + (e.message || e); status.textContent = "R zgłosił błąd."; })
            .finally(function () { shelter.purge(); });
        });
      }).catch(function () {});
    }
    function loadDplyr() {
      start().then(function (w) {
        status.textContent = "Instaluję dplyr (do minuty)…";
        return w.installPackages(["dplyr"], { quiet: true }).then(function () { status.textContent = "dplyr gotowy. Odkomentuj ostatnie linie i uruchom."; });
      }).catch(function () {});
    }
  }

  // ---------- przyciski "Pokaż odpowiedź" ----------
  function revealButtons() {
    document.querySelectorAll("[data-reveal-target]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = document.getElementById(b.getAttribute("data-reveal-target"));
        if (t) t.classList.toggle("w-hidden");
      });
    });
  }


  // =====================================================================
  // Widgety ogólne (używane w kolejnych zjazdach)
  // Wstawia się je w .qmd przez <div data-widget="..."></div>
  // =====================================================================

  function readJSON(node) {
    var sc = node.querySelector('script[type="application/json"]');
    return sc ? JSON.parse(sc.textContent) : {};
  }

  // ---------- quiz: pytania w JSON wewnątrz diva ----------
  // { "options": [...wspólne odpowiedzi...], "items": [ {"q": "...", "code": "...", "options": [...], "answer": "...", "why": "..."} ] }
  function quiz(root) {
    var cfg = readJSON(root);
    var items = cfg.items || [];
    var order = shuffle(items), pos = -1, score = 0, answered = 0, locked = false;
    root.innerHTML = "";
    var next = el("button", { class: "w-btn", onclick: draw }, [cfg.button || "Losuj pytanie"]);
    var qBox = el("div", { class: "w-question" });
    var btns = el("div", { class: "w-choices" + (cfg.vertical ? " w-vertical" : "") });
    var fb = el("div", { class: "w-feedback" });
    var sc = el("div", { class: "w-score" });
    root.appendChild(next); root.appendChild(qBox); root.appendChild(btns); root.appendChild(fb); root.appendChild(sc);
    qBox.textContent = "Kliknij „" + (cfg.button || "Losuj pytanie") + "”.";
    function draw() {
      pos = (pos + 1) % order.length;
      if (pos === 0 && answered > 0) order = shuffle(items);
      var it = order[pos];
      locked = false; fb.textContent = ""; fb.className = "w-feedback";
      qBox.innerHTML = "";
      if (it.q) qBox.appendChild(el("div", { text: it.q }));
      if (it.code) qBox.appendChild(el("pre", { class: "w-qcode", text: it.code }));
      btns.innerHTML = "";
      var opts = it.options || cfg.options || [];
      if (cfg.shuffleOptions) opts = shuffle(opts);
      opts.forEach(function (o) {
        btns.appendChild(el("button", { class: "w-choice" + (cfg.code === false ? " w-plain" : ""), onclick: function () { answer(o, this); } }, [o]));
      });
    }
    function answer(o, b) {
      if (pos < 0 || locked) return;
      locked = true; answered++;
      var it = order[pos];
      if (o === it.answer) { score++; b.classList.add("ok"); fb.className = "w-feedback ok"; fb.textContent = "Dobrze! " + (it.why || ""); }
      else {
        b.classList.add("bad");
        Array.prototype.forEach.call(btns.children, function (x) { if (x.textContent === it.answer) x.classList.add("ok"); });
        fb.className = "w-feedback bad"; fb.textContent = "Prawidłowo: " + it.answer + ". " + (it.why || "");
      }
      sc.textContent = "Wynik: " + score + " / " + answered;
    }
  }

  // ---------- timer: <div data-widget="timer" data-minutes="4"></div> ----------
  function timer(root) {
    var total = Math.round(parseFloat(root.getAttribute("data-minutes") || "5") * 60);
    var left = total, h = null;
    var disp = el("span", { class: "w-timer-time" });
    var bStart = el("button", { class: "w-btn w-small", onclick: toggle }, ["Start"]);
    var bReset = el("button", { class: "w-btn w-ghost w-small", onclick: reset }, ["Od nowa"]);
    root.appendChild(disp); root.appendChild(bStart); root.appendChild(bReset);
    function show() {
      var m = Math.floor(left / 60), s = left % 60;
      disp.textContent = m + ":" + (s < 10 ? "0" : "") + s;
      root.classList.toggle("w-timer-end", left === 0);
      root.classList.toggle("w-timer-warn", left > 0 && left <= 30);
    }
    function toggle() {
      if (h) { clearInterval(h); h = null; bStart.textContent = "Start"; return; }
      if (left === 0) left = total;
      bStart.textContent = "Pauza";
      h = setInterval(function () { left = Math.max(0, left - 1); show(); if (left === 0) { clearInterval(h); h = null; bStart.textContent = "Start"; } }, 1000);
    }
    function reset() { if (h) { clearInterval(h); h = null; } left = total; bStart.textContent = "Start"; show(); }
    show();
  }

  // ---------- formatowanie wyników jak w konsoli R ----------
  function rnum(v) {
    if (v === null || v === undefined) return "NA";
    if (Number.isNaN(v)) return "NaN";
    if (v === Infinity) return "Inf";
    if (v === -Infinity) return "-Inf";
    if (Number.isInteger(v)) return String(v);
    return String(Number(v.toPrecision(7)));
  }
  function rprintVec(vals, isChar) {
    var items = vals.map(function (v) {
      if (v === null || v === undefined) return "NA";
      return isChar ? '"' + v + '"' : rnum(v);
    });
    if (!items.length) return isChar ? "character(0)" : "numeric(0)";
    var w = Math.max.apply(null, items.map(function (s) { return s.length; }));
    items = items.map(function (s) { return isChar ? (s + " ".repeat(w - s.length)) : (" ".repeat(w - s.length) + s); });
    var pw = ("[" + items.length + "]").length;
    var per = Math.max(1, Math.floor((80 - pw) / (w + 1)));
    var lines = [];
    for (var i = 0; i < items.length; i += per) {
      var pre = "[" + (i + 1) + "]";
      lines.push(" ".repeat(pw - pre.length) + pre + " " + items.slice(i, i + per).join(" "));
    }
    return lines.join("\n").replace(/\s+$/gm, "");
  }

  // ---------- argumenty funkcji na przykładzie log() ----------
  function logbuilder(root) {
    var st = { x: 8, base: 2, named: true, swapped: false };
    var inX = el("input", { type: "number", value: "8", class: "w-num" });
    var inB = el("input", { type: "number", value: "2", class: "w-num" });
    [inX, inB].forEach(function (i) { i.addEventListener("input", function () { st.x = parseFloat(inX.value); st.base = parseFloat(inB.value); render(); }); i.addEventListener("keydown", function (e) { e.stopPropagation(); }); });
    var bNamed = el("button", { class: "w-choice w-plain", onclick: function () { st.named = true; render(); } }, ["po nazwach"]);
    var bPos = el("button", { class: "w-choice w-plain", onclick: function () { st.named = false; render(); } }, ["pozycyjnie"]);
    var bSwap = el("button", { class: "w-btn w-ghost", onclick: function () { st.swapped = !st.swapped; render(); } }, ["⇄ Zamień kolejność argumentów"]);
    var code = el("pre", { class: "w-code w-big" });
    var fb = el("div", { class: "w-feedback info" });
    root.appendChild(el("div", { class: "w-row" }, [el("span", { text: "x =" }), inX, el("span", { text: "base =" }), inB]));
    root.appendChild(el("div", { class: "w-row" }, [el("span", { class: "w-lbl", text: "Argumenty:" }), bNamed, bPos, bSwap]));
    root.appendChild(code); root.appendChild(fb);
    function lg(a, b) { if (a < 0 || b < 0) return NaN; return Math.log(a) / Math.log(b); }
    function render() {
      bNamed.classList.toggle("on", st.named); bPos.classList.toggle("on", !st.named);
      var X = rnum(st.x), B = rnum(st.base), call, val, msg;
      if (st.named) {
        call = st.swapped ? "log(base = " + B + ", x = " + X + ")" : "log(x = " + X + ", base = " + B + ")";
        val = lg(st.x, st.base);
        msg = "Argumenty nazwane: kolejność nie ma znaczenia, wynik jest ten sam.";
      } else {
        call = st.swapped ? "log(" + B + ", " + X + ")" : "log(" + X + ", " + B + ")";
        val = st.swapped ? lg(st.base, st.x) : lg(st.x, st.base);
        msg = st.swapped ? "Uwaga! Pozycyjnie R bierze pierwszą liczbę jako x, a drugą jako base. Po zamianie liczymy co innego." : "Pozycyjnie: pierwsza wartość to x, druga to base (sprawdź w pomocy: F1 na nazwie funkcji).";
      }
      code.textContent = "> " + call + "\n[1] " + rnum(val);
      fb.textContent = msg;
    }
    render();
  }

  // ---------- indeksowanie wektora ----------
  function vecindex(root) {
    var NAME = "miesiace";
    var V = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var presets = ["3", "c(1, 12)", "2:4", "-1", "length(" + NAME + ")", "13", "c(-1, -2, -3)"];
    var boxes = el("div", { class: "w-vec" });
    V.forEach(function (v, i) { boxes.appendChild(el("div", { class: "w-cell" }, [el("span", { class: "w-idx", text: String(i + 1) }), el("span", { text: v })])); });
    var btns = el("div", { class: "w-choices" });
    presets.forEach(function (p) { btns.appendChild(el("button", { class: "w-choice", onclick: function () { inp.value = p; run(); } }, [NAME + "[" + p + "]"])); });
    var inp = el("input", { type: "text", class: "w-text", value: "3", spellcheck: "false" });
    inp.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") run(); });
    var out = el("pre", { class: "w-code" });
    root.appendChild(el("pre", { class: "w-code w-small-code", text: NAME + " <- month.name   # wbudowana stała z nazwami miesięcy" }));
    root.appendChild(boxes);
    root.appendChild(btns);
    root.appendChild(el("div", { class: "w-row" }, [el("code", { text: NAME + "[" }), inp, el("code", { text: "]" }), el("button", { class: "w-btn w-small", onclick: run }, ["Uruchom"])]));
    root.appendChild(out);
    function parse(s) {
      s = s.replace(/\s+/g, "").replace("length(" + NAME + ")", String(V.length));
      var neg = false;
      if (/^-/.test(s)) { neg = true; s = s.slice(1); }
      var m, idx = [];
      if ((m = s.match(/^c\((.*)\)$/))) {
        m[1].split(",").forEach(function (t) {
          var r = t.match(/^(-?)(\d+)(?::(\d+))?$/); if (!r) throw 0;
          var a = +r[2], b = r[3] ? +r[3] : a;
          for (var k = a; a <= b ? k <= b : k >= b; k += (a <= b ? 1 : -1)) idx.push(r[1] ? -k : k);
        });
      } else if ((m = s.match(/^\(?(\d+):(\d+)\)?$/))) {
        var a = +m[1], b = +m[2];
        for (var k = a; a <= b ? k <= b : k >= b; k += (a <= b ? 1 : -1)) idx.push(k);
      } else if (/^\d+$/.test(s)) idx.push(+s);
      else throw 0;
      if (neg) idx = idx.map(function (k) { return -k; });
      var negs = idx.filter(function (k) { return k < 0; }), poss = idx.filter(function (k) { return k > 0; });
      if (negs.length && poss.length) throw "mix";
      if (negs.length) { var drop = negs.map(function (k) { return -k; }); return V.map(function (_, i) { return i + 1; }).filter(function (k) { return drop.indexOf(k) < 0; }); }
      return poss;
    }
    function run() {
      Array.prototype.forEach.call(boxes.children, function (b) { b.classList.remove("sel"); });
      var idx;
      try { idx = parse(inp.value); }
      catch (e) {
        out.textContent = e === "mix" ? "Error in " + NAME + "[...] : can't mix positive and negative subscripts" : "Ten widget rozumie: liczbę, a:b, c(...), -liczbę i length(" + NAME + ").";
        return;
      }
      idx.forEach(function (k) { if (k >= 1 && k <= V.length) boxes.children[k - 1].classList.add("sel"); });
      out.textContent = "> " + NAME + "[" + inp.value.trim() + "]\n" + rprintVec(idx.map(function (k) { return k >= 1 && k <= V.length ? V[k - 1] : null; }), true);
    }
    run();
  }

  // ---------- ramka danych: indeksowanie na żywo ----------
  function dfexplorer(root) {
    var cols = ["plec", "wzrost", "wydatki", "pali"];
    var rows = [
      ["m", 173, 1200, true], ["k", 170, 2340, false], ["k", 163, 1900, false], ["m", 178, 890, false],
      ["k", 169, 1010, true], ["m", 180, 3099, false], ["m", 175, 1478, null], ["m", null, 2030, true]
    ];
    var E = [
      { e: "df$wzrost", c: [1], out: "[1] 173 170 163 178 169 180 175  NA", why: "$ wybiera kolumnę po nazwie. Wynik to wektor." },
      { e: "df[, 2]", c: [1], out: "[1] 173 170 163 178 169 180 175  NA", why: "[wiersze, kolumny]: puste miejsce przed przecinkiem oznacza wszystkie wiersze." },
      { e: "df[2, ]", r: [1], out: "  plec wzrost wydatki  pali\n2    k    170    2340 FALSE", why: "Puste miejsce po przecinku oznacza wszystkie kolumny." },
      { e: 'df[, c("plec", "pali")]', c: [0, 3], out: "  plec  pali\n1    m  TRUE\n2    k FALSE\n3    k FALSE\n4    m FALSE\n5    k  TRUE\n6    m FALSE\n7    m    NA\n8    m  TRUE", why: "Kilka kolumn podajemy jako wektor nazw." },
      { e: 'df[df$plec == "k", ]', r: [1, 2, 4], out: "  plec wzrost wydatki  pali\n2    k    170    2340 FALSE\n3    k    163    1900 FALSE\n5    k    169    1010  TRUE", why: "Warunek wybiera wiersze. To samo zrobimy później prościej funkcją filter()." },
      { e: 'df$wzrost[df$plec == "k"]', r: [1, 2, 4], c: [1], out: "[1] 170 163 169", why: "Najpierw kolumna, potem warunek na wiersze." },
      { e: "mean(df$wzrost)", c: [1], out: "[1] NA", why: "Jeden brak danych daje NA w średniej." },
      { e: "mean(df$wzrost, na.rm = TRUE)", c: [1], out: "[1] 172.5714", why: "na.rm = TRUE pomija braki danych." },
      { e: "nrow(df)", out: "[1] 8", why: "Liczba wierszy (obserwacji). ncol(df) zwraca liczbę kolumn." }
    ];
    var holder = el("div", { class: "w-tabholder" });
    var btns = el("div", { class: "w-choices w-vertical" });
    var out = el("pre", { class: "w-code" });
    var fb = el("div", { class: "w-feedback info" });
    E.forEach(function (x) { btns.appendChild(el("button", { class: "w-choice", onclick: function () { show(x, this); } }, [x.e])); });
    root.appendChild(el("div", { class: "w-df-grid" }, [btns, el("div", {}, [holder, out, fb])]));
    function draw(hr, hc) {
      var t = el("table", { class: "w-table w-dftable" });
      var tr = el("tr", {}, [el("th", { text: "" })]);
      cols.forEach(function (c, j) { tr.appendChild(el("th", { class: hc.indexOf(j) >= 0 ? "w-colsel" : "", text: c })); });
      t.appendChild(el("thead", {}, [tr]));
      var tb = el("tbody");
      rows.forEach(function (r, i) {
        var row = el("tr", {}, [el("td", { class: "w-rn", text: String(i + 1) })]);
        r.forEach(function (v, j) {
          var selR = hr.length ? hr.indexOf(i) >= 0 : true, selC = hc.length ? hc.indexOf(j) >= 0 : true;
          var sel = (hr.length || hc.length) && selR && selC;
          var txt = v === null ? "NA" : v === true ? "TRUE" : v === false ? "FALSE" : String(v);
          row.appendChild(el("td", { class: (sel ? "w-cellsel " : "") + (v === null ? "w-na" : ""), text: txt }));
        });
        tb.appendChild(row);
      });
      t.appendChild(tb);
      holder.innerHTML = ""; holder.appendChild(t);
    }
    function show(x, b) {
      Array.prototype.forEach.call(btns.children, function (y) { y.classList.toggle("on", y === b); });
      draw(x.r || [], x.c || []);
      out.textContent = "> " + x.e + "\n" + x.out;
      fb.textContent = x.why;
    }
    draw([], []);
    out.textContent = "Kliknij polecenie po lewej.";
  }

  var GENERIC = { quiz: quiz, timer: timer };

  function init() {
    var map = { pipeline: pipeline, verbquiz: verbquiz, parsons: parsons, bughunt: bughunt, joins: joins, aihunt: aihunt, webr: webr, logbuilder: logbuilder, vecindex: vecindex, dfexplorer: dfexplorer };
    Object.keys(map).forEach(function (id) {
      var n = document.getElementById(id);
      if (n && !n.dataset.ready) { n.dataset.ready = "1"; try { map[id](n); } catch (e) { n.textContent = "Błąd widgetu: " + e; } }
    });
    document.querySelectorAll("[data-widget]").forEach(function (n) {
      var f = GENERIC[n.getAttribute("data-widget")];
      if (f && !n.dataset.ready) { n.dataset.ready = "1"; try { f(n); } catch (e) { n.textContent = "Błąd widgetu: " + e; } }
    });
    revealButtons();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
