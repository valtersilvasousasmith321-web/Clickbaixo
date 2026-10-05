(function () {
  'use strict';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var root = document.documentElement;
  var toggleBtn = document.getElementById('a11yToggle');
  var panel = document.getElementById('a11yPanel');
  if (!toggleBtn || !panel) return;

  function closePanel() { panel.hidden = true; toggleBtn.setAttribute('aria-expanded', 'false'); }
  function openPanel() { panel.hidden = false; toggleBtn.setAttribute('aria-expanded', 'true'); }
  toggleBtn.addEventListener('click', function () {
    if (panel.hidden) openPanel(); else closePanel();
  });
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !toggleBtn.contains(e.target)) closePanel();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) { closePanel(); toggleBtn.focus(); }
  });

  var darkBtn = document.getElementById('a11yDark');
  function applyDark(isDark) {
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (darkBtn) darkBtn.setAttribute('aria-checked', isDark ? 'true' : 'false');
    set('cb_theme', isDark ? 'dark' : 'light');
  }
  if (darkBtn) {
    applyDark(root.getAttribute('data-theme') === 'dark');
    darkBtn.addEventListener('click', function () { applyDark(root.getAttribute('data-theme') !== 'dark'); });
  }

  var contrastBtn = document.getElementById('a11yContrast');
  function applyContrast(on) {
    if (on) root.setAttribute('data-contrast', 'high'); else root.removeAttribute('data-contrast');
    if (contrastBtn) contrastBtn.setAttribute('aria-checked', on ? 'true' : 'false');
    set('cb_contrast', on ? '1' : '0');
  }
  if (contrastBtn) {
    applyContrast(root.getAttribute('data-contrast') === 'high');
    contrastBtn.addEventListener('click', function () { applyContrast(root.getAttribute('data-contrast') !== 'high'); });
  }

  var sizes = ['base', 'lg', 'xl'];
  function applyFontSize(sz) {
    if (sz === 'base') root.removeAttribute('data-fontsize'); else root.setAttribute('data-fontsize', sz);
    set('cb_fontsize', sz);
  }
  var cur = get('cb_fontsize') || 'base';
  if (sizes.indexOf(cur) === -1) cur = 'base';
  var incBtn = document.getElementById('a11yFontInc');
  var decBtn = document.getElementById('a11yFontDec');
  var resetBtn = document.getElementById('a11yFontReset');
  if (incBtn) incBtn.addEventListener('click', function () {
    var i = sizes.indexOf(cur); cur = sizes[Math.min(i + 1, sizes.length - 1)]; applyFontSize(cur);
  });
  if (decBtn) decBtn.addEventListener('click', function () {
    var i = sizes.indexOf(cur); cur = sizes[Math.max(i - 1, 0)]; applyFontSize(cur);
  });
  if (resetBtn) resetBtn.addEventListener('click', function () { cur = 'base'; applyFontSize(cur); });
})();
