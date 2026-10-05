(function () {
  try {
    if (!localStorage.getItem('cb_cookie_ok')) {
      var b = document.getElementById('cookieBanner');
      if (b) b.hidden = false;
    }
  } catch (e) {}
  var okBtn = document.getElementById('cookieOk');
  if (okBtn) okBtn.addEventListener('click', function () {
    try { localStorage.setItem('cb_cookie_ok', '1'); } catch (e) {}
    document.getElementById('cookieBanner').hidden = true;
  });

  function post(url, data) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); });
  }

  var subForm = document.getElementById('subscribe-form');
  if (subForm) {
    subForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = subForm.email.value.trim();
      var msg = document.getElementById('subscribe-msg');
      post('/api/inscrever', { email: email }).then(function (res) {
        msg.textContent = res.body.ok ? 'Pronto! Você vai receber as melhores ofertas.' : (res.body.error || 'Erro ao inscrever.');
        if (res.body.ok) subForm.reset();
      }).catch(function () { msg.textContent = 'Erro de conexão. Tente de novo.'; });
    });
  }

  var leadForm = document.getElementById('lead-form');
  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('lead-msg');
      var data = {
        name: leadForm.name.value.trim(),
        email: leadForm.email.value.trim(),
        phone: leadForm.phone.value.trim(),
        message: leadForm.message.value.trim(),
      };
      post('/api/contato-comercial', data).then(function (res) {
        msg.textContent = res.body.ok ? 'Mensagem enviada! Responderemos em breve.' : (res.body.error || 'Erro ao enviar.');
        if (res.body.ok) leadForm.reset();
      }).catch(function () { msg.textContent = 'Erro de conexão. Tente de novo.'; });
    });
  }

  var aiForm = document.getElementById('ai-search-form');
  if (aiForm) {
    aiForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = document.getElementById('ai-search-result');
      var query = aiForm.q.value.trim();
      if (!query) return;
      box.innerHTML = '<p class="ai-loading">Buscando...</p>';
      post('/api/busca-ia', { q: query }).then(function (res) {
        if (!res.body.ok) {
          box.innerHTML = '<p class="ai-error">' + (res.body.error || 'Não consegui buscar agora.') + '</p>';
          return;
        }
        var html = '<p class="ai-result-text"></p>';
        box.innerHTML = html;
        box.querySelector('.ai-result-text').textContent = res.body.text;
        if (res.body.sources && res.body.sources.length) {
          var srcDiv = document.createElement('div');
          srcDiv.className = 'ai-sources';
          res.body.sources.forEach(function (s) {
            var a = document.createElement('a');
            a.href = s.url; a.textContent = s.title || s.url;
            a.target = '_blank'; a.rel = 'noopener nofollow';
            srcDiv.appendChild(a);
          });
          box.appendChild(srcDiv);
        }
        // O banner de publicidade só aparece aqui dentro, junto com a resposta.
        var adTpl = document.getElementById('ai-ad-template');
        if (adTpl) box.appendChild(adTpl.content.cloneNode(true));
      }).catch(function () {
        box.innerHTML = '<p class="ai-error">Erro de conexão. Tente de novo.</p>';
      });
    });
  }

  (function () {
    var btn = document.getElementById('pwaInstallBtn');
    if (!btn) return;
    var alreadyInstalled = false;
    try {
      alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    } catch (e) {}
    if (alreadyInstalled) return;

    var deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      btn.hidden = false;
    });
    btn.addEventListener('click', function () {
      if (!deferredPrompt) return;
      btn.hidden = true;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () { deferredPrompt = null; }).catch(function () {});
    });
    window.addEventListener('appinstalled', function () {
      btn.hidden = true;
      deferredPrompt = null;
    });
  })();

  var alertForm = document.getElementById('alert-form');
  if (alertForm) {
    alertForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('alert-msg');
      var data = {
        deal_id: Number(alertForm.getAttribute('data-deal-id')),
        email: alertForm.email.value.trim(),
        target_price: Number(String(alertForm.target_price.value).replace(',', '.')),
      };
      post('/api/alerta', data).then(function (res) {
        msg.textContent = res.body.message || res.body.error || 'Algo deu errado.';
        if (res.body.ok) alertForm.reset();
      }).catch(function () { msg.textContent = 'Erro de conexão. Tente de novo.'; });
    });
  }

  // Carrossel automático da faixa de categorias (abaixo da busca): a pessoa pode
  // arrastar/deslizar com o dedo a qualquer momento, e quando solta, ele volta
  // a passar sozinho de tempos em tempos até o fim e recomeça do início.
  (function () {
    var nav = document.querySelector('.cat-nav');
    if (!nav) return;
    var reduceMotion = false;
    try { reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (reduceMotion) return;

    var timer = null;
    var paused = false;

    function hasOverflow() { return nav.scrollWidth > nav.clientWidth + 4; }

    function step() {
      if (paused || !hasOverflow()) return;
      var atEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 4;
      if (atEnd) {
        nav.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        var first = nav.querySelector('a');
        var amount = first ? first.getBoundingClientRect().width + 6 : 140;
        nav.scrollBy({ left: amount, behavior: 'smooth' });
      }
    }

    function start() {
      stop();
      timer = setInterval(step, 2800);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function pause() { paused = true; }
    function resume() { paused = false; }

    nav.addEventListener('pointerdown', pause);
    nav.addEventListener('pointerup', resume);
    nav.addEventListener('pointercancel', resume);
    nav.addEventListener('mouseenter', pause);
    nav.addEventListener('mouseleave', resume);
    nav.addEventListener('touchstart', pause, { passive: true });
    nav.addEventListener('touchend', resume, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    start();
  })();
})();
