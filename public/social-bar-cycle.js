// Faz o widget de anúncio "social bar" (o balãozinho de notificação que a rede de
// anúncios injeta sozinha na página) aparecer e se recolher em ciclos, em vez de
// ficar sempre visível. A gente não controla o código interno do script de
// anúncio — então aqui a gente só observa o que ele adiciona na página e
// alterna a visibilidade desse elemento com um temporizador nosso.
(function () {
  // Tempo visível e tempo escondido, em milissegundos. Ajuste esses dois números
  // se quiser um ciclo diferente.
  var SHOW_MS = 25000; // 25s visível
  var HIDE_MS = 100000; // 100s escondido

  // Elementos que já são nossos (nunca mexer neles).
  var OURS_IDS = ['cookieBanner', 'appRoot', 'demoBar', 'demoToast', 'mainContent', 'a11yPanel', 'a11yToggle'];
  var OURS_CLASSES = ['a11y-widget', 'skip-link', 'cookie-banner'];
  var OURS_CLASS_PREFIXES = ['ad-']; // nossos próprios slots de anúncio (ad-slot, ad-top, ad-between, ad-deal...)

  function isOurs(el) {
    if (!el || el.nodeType !== 1) return true; // não é elemento — ignora
    var tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK' || tag === 'NOSCRIPT') return true;
    if (tag === 'HEADER' || tag === 'MAIN' || tag === 'FOOTER' || tag === 'NAV') return true;
    if (OURS_IDS.indexOf(el.id) !== -1) return true;
    if (el.classList) {
      for (var i = 0; i < OURS_CLASSES.length; i++) {
        if (el.classList.contains(OURS_CLASSES[i])) return true;
      }
      for (var j = 0; j < el.classList.length; j++) {
        for (var k = 0; k < OURS_CLASS_PREFIXES.length; k++) {
          if (el.classList[j].indexOf(OURS_CLASS_PREFIXES[k]) === 0) return true;
        }
      }
    }
    return false;
  }

  var tracked = null;

  function startCycle(el) {
    var visible = true;
    function toggle() {
      visible = !visible;
      el.style.setProperty('display', visible ? '' : 'none', 'important');
      setTimeout(toggle, visible ? SHOW_MS : HIDE_MS);
    }
    setTimeout(toggle, SHOW_MS);
  }

  function tryTrack(el) {
    if (tracked || isOurs(el)) return false;
    tracked = el;
    startCycle(el);
    return true;
  }

  // O widget pode já estar na página (script síncrono) ou aparecer depois
  // (script assíncrono que injeta o elemento mais tarde) — cobre os dois casos.
  var already = document.body ? document.body.children : [];
  for (var i = 0; i < already.length && !tracked; i++) tryTrack(already[i]);

  if (!tracked) {
    var observer = new MutationObserver(function (mutations) {
      if (tracked) { observer.disconnect(); return; }
      for (var m = 0; m < mutations.length; m++) {
        var added = mutations[m].addedNodes;
        for (var n = 0; n < added.length; n++) {
          if (tryTrack(added[n])) { observer.disconnect(); return; }
        }
      }
    });
    observer.observe(document.body, { childList: true });
  }
})();
