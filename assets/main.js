// Schody drewniane. Dawid Radzimski - menu, przewijanie, karuzela oferty, opinie
(function () {
  // menu pełnoekranowe
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    var ustaw = function (open) {
      links.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function () { ustaw(!links.classList.contains('open')); });
    links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { ustaw(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ustaw(false); });
  }

  // odsłanianie przy przewijaniu
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
    var odslon = function () {
      els.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 1.1 && r.bottom > -40) { el.classList.add('in'); io.unobserve(el); }
      });
    };
    window.addEventListener('scroll', odslon, { passive: true });
    window.addEventListener('load', odslon);
    setTimeout(odslon, 1500);
  }
})();

// nagłówek gęstnieje po przewinięciu
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  var t = false;
  function upd() { nav.classList.toggle('is-stuck', window.scrollY > 24); t = false; }
  window.addEventListener('scroll', function () { if (!t) { t = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();

// karuzela oferty
(function () {
  document.querySelectorAll('.car').forEach(function (car) {
    var track = car.querySelector('.car-track');
    var bar = car.querySelector('.car-bar i');
    if (!track) return;
    function krok() { var c = track.querySelector('.card'); return c ? c.getBoundingClientRect().width + 40 : track.clientWidth * 0.8; }
    car.querySelectorAll('[data-dir]').forEach(function (b) {
      b.addEventListener('click', function () { track.scrollBy({ left: krok() * (+b.getAttribute('data-dir')), behavior: 'smooth' }); });
    });
    function pasek() {
      if (!bar) return;
      var max = track.scrollWidth - track.clientWidth;
      var w = Math.max(18, Math.min(100, track.clientWidth / track.scrollWidth * 100));
      bar.style.width = w + '%';
      bar.style.left = (max > 0 ? track.scrollLeft / max * (100 - w) : 0) + '%';
    }
    track.addEventListener('scroll', function () { requestAnimationFrame(pasek); }, { passive: true });
    window.addEventListener('resize', pasek, { passive: true });
    pasek();
  });
})();

// opinie: przełączanie cytatów
(function () {
  var box = document.querySelector('.tst');
  if (!box) return;
  var q = box.querySelectorAll('.tst-q');
  if (q.length < 2) return;
  var i = 0;
  function pokaz(n) { q[i].classList.remove('on'); i = (n + q.length) % q.length; q[i].classList.add('on'); }
  box.querySelectorAll('[data-q]').forEach(function (b) {
    b.addEventListener('click', function () { pokaz(i + (+b.getAttribute('data-q'))); });
  });
})();


// LICZNIK WAŻNOŚCI DEMA (K. 09.08: pełne odliczanie dni/godzin/minut/sekund).
// Element wstrzykuje multipage TYLKO w dema. Nie wita klienta przy wejściu - wjeżdża
// po zejściu z pierwszego ekranu i chowa się po powrocie na górę.
(function () {
  var el = document.querySelector('.demo-wazne');
  if (!el || !el.getAttribute('data-do')) return;
  var koniec = new Date(el.getAttribute('data-do') + 'T23:59:59');
  if (isNaN(koniec)) return;
  var txt = el.querySelector('.dw-txt') || el;
  var dwa = function (n) { return (n < 10 ? '0' : '') + n; };

  var cykl = parseInt(el.getAttribute('data-cykl') || '0', 10);   // dni; 0 = brak wznowienia
  function tyka() {
    var teraz = new Date(), ms = koniec - teraz;
    // po wygaśnięciu licznik rusza od nowa (K. 10.08) - dema i tak zostają, a odliczanie
    // ma dawać klientowi realne poczucie, że sprawa ma termin.
    while (ms <= 0 && cykl > 0) {
      koniec = new Date(koniec.getTime() + cykl * 86400000);
      ms = koniec - teraz;
    }
    if (ms <= 0) { txt.innerHTML = 'Wersja pokazowa wygasła'; el.classList.add('is-koniec'); return false; }
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
    var g = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
    var zegar = dwa(g) + ':' + dwa(m) + ':' + dwa(sek);
    txt.innerHTML = d > 0
      ? 'Wersja pokazowa · <b>' + d + ' dni</b> <span class="dw-zeg">' + zegar + '</span>'
      : 'Wersja pokazowa · <b class="dw-pilne">' + zegar + '</b>';
    el.classList.toggle('is-pilne', d === 0);
    return true;
  }
  if (tyka() !== false) setInterval(tyka, 1000);
  el.hidden = false;

  var tick = false;
  function stan() {
    el.classList.toggle('is-on', (window.scrollY || 0) > window.innerHeight * 0.55);
    tick = false;
  }
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true; requestAnimationFrame(stan);
  }, { passive: true });
  stan();
})();


/* === DOLNY PASEK MOBILE: chowa się przy stopce ===
   Lekcja 13.08.2026 (Zielony Azymut): klient zgłosił, że pasek „Zapytaj o termin"
   zasłania treść na dole strony. Rezerwę pod treścią daje CSS (razem z safe-area
   iPhone'a), a tu drugie zabezpieczenie: gdy w kadrze jest stopka albo sekcja CTA
   — czyli te same przyciski — pasek zjeżdża w dół i wraca po odjechaniu w górę.
   Brak IntersectionObserver = pasek zostaje widoczny, czyli stan sprzed zmiany. */
(function () {
  try {
    var pasek = document.querySelector('.sticky-reserve, .sticky-call');
    if (!pasek || !('IntersectionObserver' in window)) return;
    var cele = document.querySelectorAll('footer, .cta');
    if (!cele.length) return;
    var widoczne = 0;
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) { widoczne += w.isIntersecting ? 1 : -1; });
      if (widoczne < 0) widoczne = 0;
      pasek.classList.toggle('schowany', widoczne > 0);
    }, { threshold: 0.01 });
    cele.forEach(function (el) { io.observe(el); });
  } catch (e) {}
})();

/* === MOTION LAYER v2 (silnik) === */


/* === licznik otwarć demo (buy-signal) v3 — geo po stronie serwera === */
(function(){try{if(String(location.protocol).indexOf('http')!==0)return;try{if(/[?&#]team=1/.test(location.search+location.hash)){localStorage.setItem('nb_team','1');}}catch(e){}try{if(localStorage.getItem('nb_team')==='1')return;}catch(e){}if(/crm-newbeginning|crm\.impulseo\.pl/.test(document.referrer||''))return;try{if(navigator.webdriver)return;}catch(e){}try{if(/^https?:\/\/(kris20032|impulseo-pl)\.github\.io\/?$/i.test(document.referrer||''))return;}catch(e){}if(sessionStorage.getItem('_dv'))return;sessionStorage.setItem('_dv','1');var seg=(location.pathname.split('/').filter(Boolean)[0])||'';var base=location.origin+(seg?('/'+seg):'');var ua='';try{ua=(navigator.userAgent||'').slice(0,300);}catch(e){}var EP='https://zngfubfinbojfgaxdrbf.supabase.co/functions/v1/demo-view';try{fetch(EP,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({demo_url:base,page:location.pathname,referrer:(document.referrer||null),user_agent:(ua||null)})}).catch(function(){});}catch(e){}}catch(e){}})();
