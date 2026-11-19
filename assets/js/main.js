(function () {
  'use strict';
  var MODE = window.KG_MODE || 'site';
  var BASE = window.KG_BASE || '/assets/';
  var ROUTES = { home: '/', visa: '/services/visa-immigration/', id: '/services/digital-id-banking/', guides: '/guides/' };
  var LANGS = [
    { c: 'en', n: 'English', f: 'en' }, { c: 'th', n: 'ไทย', f: 'th' }, { c: 'zh', n: '中文', f: 'zh' },
    { c: 'vi', n: 'Tiếng Việt', f: 'vi' }, { c: 'uz', n: 'Oʻzbekcha', f: 'uz' }, { c: 'bn', n: 'বাংলা', f: 'bn' },
    { c: 'ur', n: 'اردو', f: 'ur' }, { c: 'my', n: 'မြန်မာ', f: 'my' }, { c: 'lo', n: 'ລາວ', f: 'lo' }, { c: 'km', n: 'ខ្មែរ', f: 'km' }
  ];
  var CODES = LANGS.map(function (l) { return l.c; });
  var ALIASES = { cn: 'zh', vt: 'vi', urd: 'ur', lao: 'lo', kh: 'km' };
  var FONTS = {
    th: 'Noto+Sans+Thai:wght@400;500;600;700', zh: 'Noto+Sans+SC:wght@400;500;600;700',
    bn: 'Noto+Sans+Bengali:wght@400;500;600;700', ur: 'Noto+Naskh+Arabic:wght@400;500;600;700',
    my: 'Noto+Sans+Myanmar:wght@400;500;600;700', lo: 'Noto+Sans+Lao:wght@400;500;600;700',
    km: 'Noto+Sans+Khmer:wght@400;500;600;700'
  };
  var PDFJS = window.KG_PDFJS || 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';
  var dicts = {};
  var lang = 'en';
  var root = document.documentElement;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function sstore(k, v) { try { if (v === undefined) { var x = sessionStorage.getItem(k); sessionStorage.removeItem(k); return x; } sessionStorage.setItem(k, v); } catch (e) { return null; } }

  // ---------- i18n ----------
  function loadDict(c) {
    if (dicts[c]) return Promise.resolve(dicts[c]);
    if (window.KG_I18N && window.KG_I18N[c]) { dicts[c] = window.KG_I18N[c]; return Promise.resolve(dicts[c]); }
    return fetch(BASE + 'i18n/' + c + '.json').then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { dicts[c] = d; return d; });
  }
  function t(key) {
    var d = dicts[lang] || {}, en = dicts.en || {};
    return d[key] != null ? d[key] : (en[key] != null ? en[key] : null);
  }
  function md(s) { return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function href(route) { return MODE === 'preview' ? '#' + (route === 'home' ? 'home' : route === 'visa' ? 'visa-immigration' : route === 'id' ? 'digital-id-banking' : route) : ROUTES[route]; }

  function apply(scope) {
    scope = scope || document;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v == null) return;
      if (el.hasAttribute('data-n')) v = v.replace('{n}', el.getAttribute('data-n'));
      if (el.hasAttribute('data-links')) v = v.replace('{v}', href('visa')).replace('{b}', href('id'));
      el.innerHTML = md(v);
      if (el.hasAttribute('data-links')) el.querySelectorAll('a').forEach(function (a) {
        a.setAttribute('data-route', a.getAttribute('href').indexOf('visa') > -1 ? 'visa' : 'id');
      });
    });
    scope.querySelectorAll('[data-i18n-label]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-label')); if (v) { el.setAttribute('aria-label', v); el.setAttribute('title', v); }
    });
    var tk = document.body.getAttribute('data-title');
    if (tk && t(tk)) document.title = document.body.getAttribute('data-page') === 'home' ? 'K-Guide | ' + t(tk) : t(tk) + ' | K-Guide';
  }

  function loadFont(c) {
    if (!FONTS[c] || document.getElementById('font-' + c)) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.id = 'font-' + c;
    l.href = 'https://fonts.googleapis.com/css2?family=' + FONTS[c] + '&display=swap';
    document.head.appendChild(l);
  }

  function setLang(c, save) {
    if (CODES.indexOf(c) < 0) c = 'en';
    lang = c;
    root.lang = c;
    root.dir = c === 'ur' ? 'rtl' : 'ltr';
    if (save) store('kg-lang', c);
    loadFont(c);
    document.querySelectorAll('.lang-code').forEach(function (el) { el.textContent = c.toUpperCase(); });
    document.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-lang') === c ? 'true' : 'false'); });
    if (c === 'en' && !dicts.en && !save && MODE !== 'preview') { root.classList.remove('i18n-wait'); return Promise.resolve(); }
    var need = c === 'en' ? [loadDict('en')] : [loadDict('en'), loadDict(c)];
    return Promise.all(need).then(function () { apply(); }).catch(function () {}).then(function () { root.classList.remove('i18n-wait'); });
  }

  function initialLang() {
    var q = null;
    try {
      var params = new URLSearchParams(location.search);
      q = params.get('lang');
      if (q) {
        params.delete('lang');
        var rest = params.toString();
        history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
      }
    } catch (e) {}
    if (q) { q = ALIASES[q] || q; if (CODES.indexOf(q) > -1) { store('kg-lang', q); return q; } }
    var s = store('kg-lang');
    if (s && CODES.indexOf(s) > -1) return s;
    return 'en';
  }

  // ---------- menus ----------
  var langBtn, langMenu, mobileMenu, lastFocus;
  function closeLang() { if (!langMenu) return; langMenu.classList.remove('open'); langBtn.setAttribute('aria-expanded', 'false'); }
  function openMobile() {
    lastFocus = document.activeElement;
    mobileMenu.classList.add('open'); mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    document.querySelector('.menu-btn').setAttribute('aria-expanded', 'true');
    setTimeout(function () { var c = mobileMenu.querySelector('.mm-close'); c && c.focus();  }, 50);
  }
  function closeMobile() {
    if (!mobileMenu || !mobileMenu.classList.contains('open')) return;
    mobileMenu.classList.remove('open'); mobileMenu.setAttribute('aria-hidden', 'true');
    if (!viewerOpen) document.body.classList.remove('no-scroll');
    document.querySelector('.menu-btn').setAttribute('aria-expanded', 'false');
    lastFocus && lastFocus.focus && lastFocus.focus();
  }

  function setActiveNav(page) {
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      var n = a.getAttribute('data-nav'), on = n === page || (n === 'services' && (page === 'visa' || page === 'id'));
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  // ---------- scroll targets ----------
  function scrollToSection(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var box = el.querySelector('.steps-box');
    if (box) expand(box, true);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }
  function expand(box, open) {
    box.classList.toggle('collapsed', !open);
    var b = box.querySelector('.steps-toggle'); b && b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  // ---------- PDF viewer ----------
  var viewer, viewerOpen = false, pdfLib = null, currentTask = null, observer = null, viewerFocus;
  function getPdfLib() {
    if (pdfLib) return Promise.resolve(pdfLib);
    return import(PDFJS + 'pdf.min.mjs').then(function (m) {
      m.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.mjs';
      pdfLib = m; return m;
    });
  }
  function openViewer(btn) {
    viewer = viewer || document.getElementById('viewer');
    if (!viewer) return;
    viewerFocus = btn;
    var url = btn.getAttribute('data-pdf'), key = btn.getAttribute('data-title-key');
    var title = viewer.querySelector('#viewer-title');
    var card = btn.closest('.guide-card'), h = card && card.querySelector('h2');
    title.setAttribute('data-i18n', key); title.innerHTML = t(key) ? md(t(key)) : (h ? h.textContent : '');
    viewer.querySelectorAll('.viewer-dl').forEach(function (a) { a.href = url; });
    var pages = viewer.querySelector('.viewer-pages'); pages.innerHTML = '';
    var status = viewer.querySelector('.viewer-status'); status.hidden = false;
    status.querySelector('.spinner').hidden = false;
    status.querySelector('.progress').hidden = false;
    status.querySelector('.progress span').style.width = '0%';
    status.querySelector('.msg').setAttribute('data-i18n', 'viewer.loading');
    status.querySelector('.msg').textContent = t('viewer.loading');
    status.querySelector('.err-actions').hidden = true;
    viewer.hidden = false; viewerOpen = true;
    document.body.classList.add('no-scroll');
    setTimeout(function () { viewer.querySelector('.viewer-close').focus(); }, 30);

    getPdfLib().then(function (lib) {
      currentTask = lib.getDocument({ url: url });
      currentTask.onProgress = function (p) {
        if (p.total) status.querySelector('.progress span').style.width = Math.min(100, Math.round(p.loaded / p.total * 100)) + '%';
      };
      return currentTask.promise;
    }).then(function (doc) {
      if (!viewerOpen) return;
      status.hidden = true;
      if (observer) observer.disconnect();
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { observer.unobserve(e.target); renderPage(doc, e.target); } });
      }, { root: viewer.querySelector('.viewer-body'), rootMargin: '600px 0px' });
      var chain = Promise.resolve();
      for (var i = 1; i <= doc.numPages; i++) {
        (function (n) {
          chain = chain.then(function () { return doc.getPage(n); }).then(function (page) {
            var vp = page.getViewport({ scale: 1 });
            var wrap = document.createElement('div');
            wrap.className = 'pdf-page';
            wrap.style.aspectRatio = vp.width + ' / ' + vp.height;
            wrap.style.maxWidth = '100%';
            wrap._page = page;
            wrap.setAttribute('aria-label', 'Page ' + n);
            pages.appendChild(wrap);
            observer.observe(wrap);
          });
        })(i);
      }
    }).catch(function (err) {
      if (!viewerOpen) return;
      status.querySelector('.spinner').hidden = true;
      status.querySelector('.progress').hidden = true;
      status.querySelector('.msg').setAttribute('data-i18n', 'viewer.error');
      status.querySelector('.msg').textContent = t('viewer.error');
      status.querySelector('.err-actions').hidden = false;
    });
  }
  function renderPage(doc, wrap) {
    var page = wrap._page; if (!page) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = wrap.clientWidth || 800;
    var base = page.getViewport({ scale: 1 });
    var vp = page.getViewport({ scale: (w * dpr) / base.width });
    var canvas = document.createElement('canvas');
    canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
    wrap.appendChild(canvas);
    page.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
  }
  function closeViewer() {
    if (!viewerOpen) return;
    viewerOpen = false; viewer.hidden = true;
    if (observer) observer.disconnect();
    if (currentTask) { try { currentTask.destroy(); } catch (e) {} currentTask = null; }
    viewer.querySelector('.viewer-pages').innerHTML = '';
    document.body.classList.remove('no-scroll');
    viewerFocus && viewerFocus.focus && viewerFocus.focus();
  }

  // ---------- preview router ----------
  var VIEW_FOR_HASH = { '': 'home', home: 'home', 'visa-immigration': 'visa', 'digital-id-banking': 'id', guides: 'guides' };
  function routeTo(view, target, push) {
    var tpl = document.querySelector('template[data-view="' + view + '"]') || document.querySelector('template[data-view="404"]');
    var main = document.getElementById('main');
    main.innerHTML = '';
    main.appendChild(tpl.content.cloneNode(true));
    document.body.setAttribute('data-page', tpl.getAttribute('data-view'));
    document.body.setAttribute('data-title', tpl.getAttribute('data-title'));
    setActiveNav(tpl.getAttribute('data-view'));
    apply(main); apply(document.querySelector('.site-header'));
    if (push !== false) {
      var h = href(view);
      if (location.hash !== h) { suppressHash = true; location.hash = h.slice(1); }
    }
    if (target) setTimeout(function () { scrollToSection(target); }, 60);
    else window.scrollTo(0, 0);
  }
  var suppressHash = false;

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-lang]'))) {
      setLang(el.getAttribute('data-lang'), true); closeLang();
      return;
    }
    if ((el = e.target.closest('.lang-btn'))) {
      var open = !langMenu.classList.contains('open');
      langMenu.classList.toggle('open', open); el.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { var cur = langMenu.querySelector('[aria-checked="true"]'); cur && cur.focus(); }
      return;
    }
    if (langMenu && !e.target.closest('.lang')) closeLang();
    if (e.target.closest('.menu-btn')) { openMobile(); return; }
    if (e.target.closest('.mm-close')) { closeMobile(); return; }
    if ((el = e.target.closest('.steps-toggle'))) { var box = el.closest('.steps-box'); expand(box, box.classList.contains('collapsed')); return; }
    if ((el = e.target.closest('[data-scroll]'))) {
      e.preventDefault();
      var id = el.getAttribute('data-scroll');
      if (id === 'find') { var s = document.getElementById('find'); s && s.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else scrollToSection(id);
      return;
    }
    if ((el = e.target.closest('.js-view'))) { e.preventDefault(); openViewer(el); return; }
    if (e.target.closest('.viewer-close') || e.target.classList.contains('viewer-backdrop')) { closeViewer(); return; }
    if ((el = e.target.closest('a[data-route]'))) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      var target = el.getAttribute('data-target');
      closeMobile();
      if (MODE === 'preview') { e.preventDefault(); routeTo(el.getAttribute('data-route'), target); }
      else if (target) {
        var samePage = location.pathname === el.pathname;
        if (samePage) { e.preventDefault(); scrollToSection(target); }
        else sstore('kg-target', target);
      }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeLang(); closeMobile(); closeViewer(); }
    if (e.key === 'Tab' && mobileMenu && mobileMenu.classList.contains('open')) trap(e, mobileMenu);
    if (e.key === 'Tab' && viewerOpen) trap(e, viewer.querySelector('.viewer-panel'));
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && langMenu && langMenu.classList.contains('open')) {
      var items = Array.prototype.slice.call(langMenu.querySelectorAll('button'));
      var i = items.indexOf(document.activeElement);
      e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    }
  });
  function trap(e, box) {
    var f = box.querySelectorAll('a[href],button:not([disabled])');
    f = Array.prototype.filter.call(f, function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  window.addEventListener('resize', function () { if (window.innerWidth > 860) closeMobile(); });

  // ---------- boot ----------
  langBtn = document.querySelector('.lang-btn');
  langMenu = document.querySelector('.lang-menu');
  mobileMenu = document.querySelector('.mobile-menu');
  var first = initialLang();

  if (MODE === 'preview') {
    window.addEventListener('hashchange', function () {
      if (suppressHash) { suppressHash = false; return; }
      routeTo(VIEW_FOR_HASH[location.hash.slice(1)] || '404', null, false);
    });
    routeTo(VIEW_FOR_HASH[location.hash.slice(1)] || '404', null, false);
  } else {
    setActiveNav(document.body.getAttribute('data-page'));
    var tgt = sstore('kg-target');
    if (tgt) setTimeout(function () { scrollToSection(tgt); }, 120);
  }
  setLang(first, false);
})();
