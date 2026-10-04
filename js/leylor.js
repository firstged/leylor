/* ══════════════════════════════════════════════
   LEYLOR — interactions
   Écrit à la main, zéro dépendance.
   ══════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ─────────────────────────────────────────
     À RENSEIGNER : le WhatsApp de l'atelier.
     Format international, sans + ni espaces.
     Gabon = 241. Exemple : "24104306163"
     ───────────────────────────────────────── */
  var WHATSAPP = "24104306163";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  /* Un seul écouteur de défilement pour toute la page :
     chaque module inscrit sa fonction ici et tout est
     recalculé une fois par image, pas une fois par
     événement — le navigateur en émet bien davantage. */
  var readers = [];
  var queued = false;

  function onScroll(fn) { readers.push(fn); }
  function flush() {
    queued = false;
    for (var i = 0; i < readers.length; i++) readers[i]();
  }
  function request() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(flush);
  }


  /* ══════════ DÉCHIRURES ══════════
     Le bord déchiré est une marche aléatoire : on
     avance par pas irréguliers et la hauteur dérive,
     bornée pour que la feuille reste une feuille.
     Aucun bord n'est identique à un autre, et le
     dessin est refait quand la largeur change. */

  function tornEdge(w, h) {
    var d = "M0," + h.toFixed(1) + " L0," + rand(h * .45, h * .8).toFixed(1);
    var x = 0;
    var y = h * .6;

    while (x < w) {
      x = Math.min(w, x + rand(11, 38));
      y = clamp(y + rand(-h * .3, h * .3), h * .1, h * .96);
      d += " L" + x.toFixed(1) + "," + y.toFixed(1);
    }
    return d + " L" + w.toFixed(1) + "," + h.toFixed(1) + " Z";
  }

  function initTears() {
    var tears = $$(".tear");
    if (!tears.length) return;

    function draw() {
      tears.forEach(function (t) {
        var w = Math.max(320, t.offsetWidth);
        var h = Math.max(18, t.offsetHeight);
        t.innerHTML =
          '<svg viewBox="0 0 ' + w.toFixed(0) + ' ' + h.toFixed(0) + '" preserveAspectRatio="none">' +
          '<path fill="currentColor" d="' + tornEdge(w, h) + '"/></svg>';
      });
    }

    draw();

    var t = null;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(draw, 220);
    }, { passive: true });
  }


  /* ══════════ PRÉCHARGEMENT ══════════
     Six lettres, six techniques d'atelier. Le
     compteur avance par setInterval et non par
     requestAnimationFrame : rAF ne se déclenche pas
     dans un onglet masqué, et la page resterait
     bloquée sur l'écran de chargement. */

  var CUTS = ["tracée", "découpée", "patchwork", "tamponnée", "pivotée", "déboîtée"];

  /* Durée du comptage, puis temps de pose sur le mot
     entier. Une seule constante à changer pour régler
     le rythme : six techniques méritent d'être vues. */
  var PRE_DUREE = 2600;
  var PRE_POSE = 400;

  function initPreloader() {
    var pre = $("#pre");
    if (!pre) return;

    var lts = $$("#preLogo .lt");
    var num = $("#preNum");
    var cut = $("#preCut");
    var done = false;

    if (REDUCED) { finish(true); return; }

    document.body.classList.add("is-locked");

    var landed = -1;
    var debut = Date.now();

    /* Le compteur suit l'horloge et non une addition de
       pas aléatoires : la durée est alors exacte, même
       quand le navigateur ralentit les minuteries d'un
       onglet masqué. La première lettre part dès le
       premier pas — attendre un sixième du chargement
       pour montrer quoi que ce soit, c'est ouvrir sur un
       écran vide. */
    var tick = setInterval(function () {
      var p = Math.min(100, (Date.now() - debut) / PRE_DUREE * 100);
      if (num) num.textContent = Math.round(p);

      var on = Math.min(lts.length, Math.floor(p / 100 * lts.length) + 1);
      if (on !== landed) {
        landed = on;
        for (var k = 0; k < lts.length; k++) lts[k].classList.toggle("is-on", k < on);
        if (cut) cut.textContent = CUTS[on - 1];
      }
      if (p >= 100) finish(false);
    }, 36);

    /* Chien de garde : si quoi que ce soit coince, on
       n'enferme personne devant un compteur. */
    var guard = setTimeout(function () { finish(false); }, 7000);

    function finish(instant) {
      if (done) return;
      done = true;
      clearInterval(tick);
      clearTimeout(guard);

      lts.forEach(function (l) { l.classList.add("is-on"); });
      if (num) num.textContent = "100";
      if (cut) cut.textContent = CUTS[CUTS.length - 1];

      setTimeout(function () {
        pre.classList.add("is-out");
        document.body.classList.remove("is-locked");
        document.body.classList.add("is-ready");
        document.dispatchEvent(new CustomEvent("leylor:ready"));
        request();
      }, instant ? 0 : PRE_POSE);
    }
  }


  /* ══════════ EFFET DE REMPLACEMENT ══════════
     Chaque lettre est doublée dans une fenêtre qui
     glisse : la copie du bas remplace celle du haut,
     avec un décalage lettre à lettre. */

  function buildRoll(el) {
    var txt = el.textContent;
    el.textContent = "";
    Array.prototype.forEach.call(txt, function (ch, i) {
      var cell = document.createElement("span");
      cell.className = "roll-c";
      var inner = document.createElement("span");
      inner.className = "roll-i";
      inner.style.transitionDelay = (i * 0.024).toFixed(3) + "s";
      var a = document.createElement("span");
      var b = document.createElement("span");
      // Une espace ordinaire s'effondre dans une cellule
      // inline-block en overflow:hidden — « Voir les
      // créations » deviendrait « Voirlescréations ».
      var glyph = ch === " " ? " " : ch;
      a.textContent = glyph;
      b.textContent = glyph;
      b.setAttribute("aria-hidden", "true");
      inner.appendChild(a);
      inner.appendChild(b);
      cell.appendChild(inner);
      el.appendChild(cell);
    });
  }

  function initRoll() { if (!REDUCED) $$("[data-roll]").forEach(buildRoll); }


  /* ══════════ DÉCOUPE EN MOTS ══════════
     Chaque mot devient un morceau de papier qui
     retombe en place. On découpe au mot et non à la
     lettre : un titre dont chaque lettre saute
     séparément se lit mal et vieillit vite. */

  function splitWords(el) {
    var parts = el.textContent.split(/(\s+)/);
    el.textContent = "";
    var n = 0;

    parts.forEach(function (tok) {
      if (!tok.trim()) { el.appendChild(document.createTextNode(tok)); return; }
      var w = document.createElement("span");
      w.className = "w";
      w.style.setProperty("--w", n++);
      var i = document.createElement("i");
      i.textContent = tok;
      w.appendChild(i);
      el.appendChild(w);
    });
  }

  function initSplit() { if (!REDUCED) $$("[data-split]").forEach(splitWords); }


  /* ══════════ CURSEUR-PERLE ══════════
     La perle suit la souris avec un peu de retard, la
     lueur avec beaucoup : c'est l'écart entre les deux
     qui donne l'impression d'une matière, pas d'un
     pointeur collé au doigt. */

  function initPearl() {
    if (!FINE || REDUCED) return;

    var pearl = $("#curPearl");
    var glow = $("#curGlow");
    if (!pearl || !glow) return;

    document.body.classList.add("has-pearl");

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var px = mx, py = my, gx = mx, gy = my;
    var seen = false;

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      mx = e.clientX;
      my = e.clientY;
      if (!seen) { seen = true; px = gx = mx; py = gy = my; }
    }, { passive: true });

    // Au survol de tout ce qui se clique, la perle
    // s'ouvre en anneau — la cible est annoncée.
    var hot = "a, button, label.chip, input, textarea, [data-go]";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest(hot)) document.body.classList.add("cur-hot");
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest && e.target.closest(hot)) document.body.classList.remove("cur-hot");
    });

    (function loop() {
      px = lerp(px, mx, .2);
      py = lerp(py, my, .2);
      gx = lerp(gx, mx, .075);
      gy = lerp(gy, my, .075);
      pearl.style.transform = "translate(" + px.toFixed(1) + "px," + py.toFixed(1) + "px)";
      glow.style.transform = "translate(" + gx.toFixed(1) + "px," + gy.toFixed(1) + "px)";
      requestAnimationFrame(loop);
    })();
  }


  /* ══════════ TRAÎNÉE DE TIRAGES ══════════
     Les douze vignettes existent déjà dans le DOM et
     n'en sortent jamais : on les repose sous le
     curseur à tour de rôle. Créer et détruire des
     éléments à chaque mouvement ferait tousser la
     page. Une nouvelle vignette n'apparaît que si la
     souris a parcouru SEUIL pixels depuis la
     précédente : sans cela un micro-tremblement en
     poserait trente. */

  var SEUIL = 118;

  function initTrail() {
    var hero = $("#accueil");
    var pool = $$("#trail .tr");
    if (!hero || !pool.length || REDUCED) return;
    if (!pool[0].animate) return;   // API Web Animations absente

    var lx = 0, ly = 0, idx = 0, started = false;
    var hint = $("#heroHint");

    /* L'adoucissement est porté par chaque image-clé,
       pas par les options : une courbe passée en option
       s'applique à l'itération entière et déplace tous
       les repères — la vignette s'ouvrirait d'un coup
       puis stagnerait à moitié effacée. */
    function fire(el, x, y) {
      var rot = rand(-12, 12);
      var at = " rotate(" + rot.toFixed(2) + "deg)";
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.animate([
        { opacity: 0, transform: "translate(-50%,-50%)" + at + " scale(.74)", filter: "blur(18px)",
          easing: "cubic-bezier(.22,1,.36,1)" },
        { opacity: 1, transform: "translate(-50%,-50%)" + at + " scale(1)", filter: "blur(0px)",
          offset: .26, easing: "linear" },
        { opacity: 1, transform: "translate(-50%,-50%)" + at + " scale(1)", filter: "blur(0px)",
          offset: .6, easing: "cubic-bezier(.4,0,.7,1)" },
        { opacity: 0, transform: "translate(-50%,-64%)" + at + " scale(1.06)", filter: "blur(11px)" }
      ], { duration: 1300, fill: "forwards" });
    }

    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;

      if (!started) { started = true; lx = x; ly = y; return; }
      if (Math.hypot(x - lx, y - ly) < SEUIL) return;

      lx = x;
      ly = y;
      fire(pool[idx % pool.length], x, y);
      idx++;

      if (idx === 3 && hint) hint.classList.add("is-gone");
    }, { passive: true });
  }


  /* ══════════ NAVIGATION ET PROGRESSION ══════════ */

  function initNav() {
    var nav = $("#nav");
    var bar = $("#prog i");
    var hero = $("#accueil");
    if (!nav) return;

    onScroll(function () {
      var y = window.pageYOffset;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (h > 0 ? clamp(y / h, 0, 1) : 0).toFixed(4) + ")";
      nav.classList.toggle("is-on", y > (hero ? hero.offsetHeight * .62 : 400));
    });
    request();

    // Section courante : on ne regarde que la bande
    // médiane de l'écran, sinon deux sections se
    // disputent le marqueur en permanence.
    var links = $$(".nav-links a");
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("data-sec");
      if (id) map[id] = a;
    });

    var secs = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!secs.length || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (a) a.classList.toggle("is-here", en.isIntersecting);
      });
    }, { rootMargin: "-50% 0px -50% 0px" });

    secs.forEach(function (s) { io.observe(s); });
  }


  /* ══════════ FOND CLAIR OU SOMBRE ══════════
     La lueur du curseur et la barre de navigation
     doivent savoir sur quoi elles passent. On
     surveille une bande d'un pixel au milieu de
     l'écran et on compte les sections sombres qui la
     traversent. */

  function initTone() {
    var darks = $$(".is-dark");
    if (!darks.length || !("IntersectionObserver" in window)) return;

    var count = 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { count += en.isIntersecting ? 1 : -1; });
      count = Math.max(0, count);
      document.body.classList.toggle("on-light", count === 0);
    }, { rootMargin: "-50% 0px -50% 0px" });

    darks.forEach(function (d) { io.observe(d); });
  }


  /* ══════════ APPARITIONS ══════════ */

  function initRise() {
    var els = $$("[data-rise], [data-split]");
    if (!els.length) return;

    if (REDUCED || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: .12 });

    // Décalage à l'intérieur d'un même groupe : les
    // lignes d'un titre montent l'une après l'autre.
    els.forEach(function (el) {
      if (el.hasAttribute("data-rise")) {
        var sibs = $$("[data-rise]", el.parentNode);
        var i = sibs.indexOf(el);
        if (i > 0) el.style.transitionDelay = (i * .085).toFixed(3) + "s";
      }
      io.observe(el);
    });

    /* Ce qui est déjà à l'écran au premier affichage ne
       traversera jamais le seuil de l'observateur :
       tant que rien ne défile, il ne se passe rien. Les
       éléments du bas du hero resteraient invisibles
       pour toujours. On les balaie donc à la main. */
    function sweep() {
      var h = window.innerHeight;
      els.forEach(function (el) {
        if (el.classList.contains("is-in")) return;
        var r = el.getBoundingClientRect();
        if (r.top < h && r.bottom > 0) {
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    }

    document.addEventListener("leylor:ready", sweep);
    setTimeout(sweep, 2000);   // filet, si le préloader manque à l'appel
  }


  /* ══════════ L'ALBUM ══════════
     La scène reste collée en haut de l'écran pendant
     toute la hauteur de la piste. On convertit la
     position dans cette piste en un curseur f qui va
     de 0 à n-1 : sa partie entière désigne la page du
     dessus, et chaque fond se dévoile d'autant plus
     que f est proche de son indice. Deux fonds se
     croisent donc à la fois, jamais six.

     La page se lève jusqu'au profil puis s'efface. On
     ne va pas au-delà : passé la perpendiculaire on
     verrait son dos, et une page menée jusqu'à 180°
     viendrait de toute façon se coucher sur la colonne
     de texte, à gauche. */

  var TOUR = -96;

  function initAlbum() {
    var sec = $("#univers");
    if (!sec) return;

    var track = $("#albumTrack", sec);
    var stage = $(".album-stage", sec);
    var bgs = $$(".album-bg i", sec);
    var leaves = $$(".leaf", sec);
    var items = $$(".uni-item", sec);
    var dots = $$("#uniDots li");
    var n = items.length;
    if (!track || !stage || !n) return;

    var cur = -1;

    function pinned() { return getComputedStyle(stage).position === "sticky"; }

    function show(i) {
      if (i === cur) return;
      cur = i;
      items.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
      dots.forEach(function (d, k) { d.classList.toggle("is-on", k === i); });
    }

    onScroll(function () {
      if (!pinned()) { show(-1); return; }

      var r = track.getBoundingClientRect();
      var span = r.height - stage.offsetHeight;
      var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
      var f = p * (n - 1);

      for (var i = 0; i < bgs.length; i++) {
        bgs[i].style.opacity = clamp(1 - Math.abs(f - i), 0, 1).toFixed(3);
      }

      var top = Math.floor(f);

      leaves.forEach(function (leaf) {
        var u = parseInt(leaf.getAttribute("data-u"), 10);
        var t = clamp(f - u, 0, 1);

        /* Une page déjà tournée, ou enfouie sous deux
           autres, n'est jamais vue : la peindre coûterait
           un plein-écran par image pour rien. */
        leaf.classList.toggle("is-off", t >= 1 || u > top + 1);

        /* L'effacement est porté par les faces, pas par
           la feuille : une opacité posée sur un parent en
           preserve-3d aplatit la scène et le dos de la
           page cesse d'exister. */
        leaf.style.transform = t ? "rotateY(" + (TOUR * t).toFixed(2) + "deg)" : "";
        leaf.style.setProperty("--t", t.toFixed(3));
        /* La page s'efface tôt dans son mouvement : si on
           la garde opaque jusqu'au profil, son collage
           se superpose à celui de la page suivante et on
           ne lit plus ni l'un ni l'autre. */
        leaf.style.setProperty("--o", (t < .3 ? 1 : clamp(1 - (t - .3) / .45, 0, 1)).toFixed(3));
      });

      show(Math.round(f));
    });

    // L'index n'est pas décoratif : il navigue.
    $$("#uniDots button").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = parseInt(b.getAttribute("data-go"), 10);
        if (!pinned()) {
          items[i].scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
          return;
        }
        var span = track.offsetHeight - stage.offsetHeight;
        var top = track.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: top + span * (i / (n - 1)), behavior: REDUCED ? "auto" : "smooth" });
      });
    });

    show(0);
    request();
  }


  /* ══════════ LE FIL DE L'ATELIER ══════════
     Un seul tracé relie les quatre gestes.
     pathLength="1" normalise sa longueur : le décalage
     du pointillé est alors directement la part du
     chemin qui reste à encrer. */

  var VB_W = 220, VB_H = 1000;

  function initThread() {
    var body = $("#procBody");
    var ink = $("#threadInk");
    var bed = $(".thread-bed", body || document);
    var plane = $("#plane");
    if (!body || !ink || REDUCED) return;

    var svg = ink.ownerSVGElement;

    onScroll(function () {
      var r = body.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = clamp((vh * .78 - r.top) / (r.height * .86), 0, 1);
      ink.style.strokeDashoffset = (1 - p).toFixed(4);

      if (!plane || !bed || !svg) return;
      var sr = svg.getBoundingClientRect();
      if (!sr.width) return;

      /* La longueur est mesurée sur le tracé de fond :
         lui n'a pas d'attribut pathLength, donc aucune
         ambiguïté sur ce que getTotalLength renvoie. */
      var L = bed.getTotalLength();
      var a = bed.getPointAtLength(p * L);
      var c = bed.getPointAtLength(Math.min(L, p * L + 2));

      /* Le SVG est étiré sans conserver ses proportions :
         l'angle doit être calculé dans l'espace de
         l'écran, pas dans celui du tracé, sinon l'avion
         pointe à côté de sa route. */
      var sx = sr.width / VB_W;
      var sy = sr.height / VB_H;
      var ang = Math.atan2((c.y - a.y) * sy, (c.x - a.x) * sx) * 180 / Math.PI;

      plane.style.transform =
        "translate(" + (sr.left - r.left + a.x * sx).toFixed(1) + "px," +
        (sr.top - r.top + a.y * sy).toFixed(1) + "px) translate(-50%,-50%) rotate(" +
        ang.toFixed(1) + "deg)";
      plane.classList.toggle("is-on", p > .012);
    });
    request();
  }


  /* ══════════ THÈMES ══════════
     Au survol d'un thème, la page se couvre de ce qu'il
     évoque, tracé dans la couleur de ce thème. Et le
     thème choisi se reporte dans le bon de commande :
     une vignette qui ne fait qu'illustrer est une
     vignette qui ne sert à rien. */

  function initThemes() {
    var layer = $("#doodLayer");
    var cards = $$(".js-theme");
    var form = $("#cmdForm");
    if (!cards.length) return;

    var groups = layer ? $$(".dood", layer) : [];

    function mark(slug, col) {
      groups.forEach(function (g) {
        var on = g.getAttribute("data-th") === slug;
        if (on && col) g.style.color = col;
        g.classList.toggle("is-on", on);
      });
    }

    cards.forEach(function (a) {
      var slug = a.getAttribute("data-th");
      var col = a.style.getPropertyValue("--c").trim();

      function enter() { mark(slug, col); }
      function leave() { mark(null, null); }

      a.addEventListener("pointerenter", enter);
      a.addEventListener("pointerleave", leave);
      a.addEventListener("focus", enter);
      a.addEventListener("blur", leave);

      a.addEventListener("click", function () {
        if (!form) return;
        var b = $("b", a);
        if (!b) return;
        var r = form.querySelector('input[name="theme"][value="' + b.textContent.trim() + '"]');
        if (r) {
          r.checked = true;
          form.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });
  }


  /* ══════════ AVIS ══════════ */

  function initTemo() {
    var stage = $("#temoStage");
    if (!stage) return;

    var quotes = $$(".quote", stage);
    var dots = $$("#temoDots li");
    if (quotes.length < 2) return;

    var i = 0;
    var timer = null;

    function go(k) {
      i = (k + quotes.length) % quotes.length;
      quotes.forEach(function (q, n) { q.classList.toggle("is-on", n === i); });
      dots.forEach(function (d, n) { d.classList.toggle("is-on", n === i); });
    }
    function play() { if (!REDUCED) timer = setInterval(function () { go(i + 1); }, 6500); }
    function pause() { clearInterval(timer); }

    $$("#temoDots button").forEach(function (b) {
      b.addEventListener("click", function () {
        pause();
        go(parseInt(b.getAttribute("data-q"), 10));
        play();
      });
    });

    stage.addEventListener("pointerenter", pause);
    stage.addEventListener("pointerleave", play);

    go(0);
    play();
  }


  /* ══════════ BON DE COMMANDE ══════════ */

  function initForm() {
    var form = $("#cmdForm");
    if (!form) return;

    var finRow = $("#finRow");
    var label = $("#fTotalLabel");
    var value = $("#fTotalValue");
    var legal = $("#fLegal");
    var LEGAL = legal ? legal.textContent : "";

    var SANS_PRIX = {
      livret: ["Livret de couple — pagination libre", "Sur devis"],
      photobook: ["Photobook — à venir", "Bientôt"],
      magazine: ["Magazine personnalisé — à venir", "Bientôt"]
    };

    function typeNow() {
      var r = form.querySelector('input[name="type"]:checked');
      return r ? r.value : "cadre";
    }
    function finNow() { return form.querySelector('input[name="fin"]:checked'); }
    function themeNow() {
      var r = form.querySelector('input[name="theme"]:checked');
      return r && r.value !== "autre" ? r.value : "";
    }

    /* :has() n'existe pas sur les vieux WebView Android.
       On double la sélection par une classe pour que la
       puce cochée reste visible partout. */
    function paint() {
      $$(".chip", form).forEach(function (c) {
        var inp = $("input", c);
        c.classList.toggle("is-sel", !!inp && inp.checked);
      });
    }

    function refresh() {
      var t = typeNow();
      var cadre = t === "cadre";

      if (finRow) finRow.classList.toggle("is-off", !cadre);

      if (cadre) {
        var f = finNow();
        if (label) label.textContent = f ? f.getAttribute("data-label") : "Cadre";
        if (value) value.textContent = f ? f.getAttribute("data-price") + " FCFA" : "—";
      } else {
        var pair = SANS_PRIX[t] || ["Création sur mesure", "Sur devis"];
        if (label) label.textContent = pair[0];
        if (value) value.textContent = pair[1];
      }
      paint();
    }

    form.addEventListener("change", refresh);

    // Les boutons « Commander » de l'album
    // pré-remplissent le bon avant d'y descendre.
    $$(".js-pick").forEach(function (a) {
      a.addEventListener("click", function () {
        var t = a.getAttribute("data-type");
        var f = a.getAttribute("data-fin");
        var rt = form.querySelector('input[name="type"][value="' + t + '"]');
        if (rt && !rt.disabled) rt.checked = true;
        if (f) {
          var rf = form.querySelector('input[name="fin"][value="' + f + '"]');
          if (rf) rf.checked = true;
        }
        refresh();
      });
    });

    var REQUIS = ["#fPrenom", "#fNom", "#fTel", "#fStory"];

    REQUIS.forEach(function (sel) {
      var el = $(sel, form);
      if (el) el.addEventListener("input", function () { el.classList.remove("is-bad"); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var manque = null;
      REQUIS.forEach(function (sel) {
        var el = $(sel, form);
        if (!el) return;
        var vide = !el.value.trim();
        el.classList.toggle("is-bad", vide);
        if (vide && !manque) manque = el;
      });

      if (manque) {
        if (legal) {
          legal.textContent = "Il manque encore quelque chose — les champs soulignés en rouge.";
          legal.classList.add("is-bad");
        }
        manque.focus();
        return;
      }

      if (legal) { legal.textContent = LEGAL; legal.classList.remove("is-bad"); }

      var prenom = $("#fPrenom", form).value.trim();
      var nom = $("#fNom", form).value.trim();
      var tel = $("#fTel", form).value.trim();
      var mail = $("#fEmail", form).value.trim();
      var story = $("#fStory", form).value.trim();
      var theme = themeNow();

      var lignes = [
        "Bonjour LEYLOR, je m'appelle " + prenom + " " + nom + ".",
        "",
        "Je souhaite commander : " + (label ? label.textContent : "") +
          " — " + (value ? value.textContent : "") + "."
      ];
      if (theme) lignes.push("Thème : " + theme + ".");
      lignes.push("", "Mon WhatsApp : " + tel);
      if (mail) lignes.push("Mon email : " + mail);
      lignes.push("", "Mon histoire :", story, "", "(Je joins mes photos à la suite de ce message.)");

      var msg = lignes.join("\n");

      // Sans numéro câblé, on n'envoie personne dans le
      // vide : le texte part dans le presse-papiers et
      // on le dit.
      if (WHATSAPP.indexOf("X") !== -1) {
        if (navigator.clipboard) navigator.clipboard.writeText(msg);
        if (legal) legal.textContent = "Numéro WhatsApp non renseigné — demande copiée dans le presse-papiers.";
        return;
      }

      window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });

    refresh();
  }


  /* ══════════ LIENS WHATSAPP DIRECTS ══════════ */

  function initWhatsApp() {
    var ready = WHATSAPP.indexOf("X") === -1;
    var msg = "Bonjour LEYLOR, je découvre vos créations et j'aimerais en commander une.";

    $$(".js-wa").forEach(function (a) {
      if (!ready) {
        a.setAttribute("title", "Renseignez la constante WHATSAPP dans js/leylor.js");
        return;
      }
      a.setAttribute("href", "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg));
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    });
  }


  /* ══════════ MISE EN ROUTE ══════════ */

  function boot() {
    initTears();
    initPreloader();
    initRoll();
    initSplit();
    initPearl();
    initTrail();
    initNav();
    initTone();
    initRise();
    initAlbum();
    initThread();
    initThemes();
    initTemo();
    initForm();
    initWhatsApp();

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    request();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
