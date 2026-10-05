'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const D = require('./lib/db');
const AUTH = require('./lib/auth');
const V = require('./lib/views');
const VX = require('./lib/views-extra');
const AV = require('./lib/admin-views');
const AX = require('./lib/admin-views-extra');
const I = require('./lib/icons');
const MAIL = require('./lib/mailer');
const GEMINI = require('./lib/gemini');
const { esc } = require('./lib/util');

const PORT = Number(process.env.PORT || 3000);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@clickbaixo.com.br';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

D.demoSeed();
if (D.userCount() === 0) {
  const pwd = ADMIN_PASSWORD || AUTH.randomToken(6);
  D.createUser(ADMIN_EMAIL, pwd);
  if (!ADMIN_PASSWORD) {
    console.log('================================================');
    console.log(' Usuário admin criado automaticamente:');
    console.log(' E-mail:', ADMIN_EMAIL);
    console.log(' Senha :', pwd);
    console.log(' Defina ADMIN_PASSWORD no .env para fixar a senha.');
    console.log('================================================');
  }
}

// ---- sessions (in-memory, fine for a single-instance deploy) ----
const sessions = new Map(); // token -> { userId, csrf }
function newSession(userId) {
  const token = AUTH.randomToken(32);
  const csrf = AUTH.randomToken(16);
  sessions.set(token, { userId, csrf, createdAt: Date.now() });
  return token;
}
function getSession(req) {
  const cookies = AUTH.parseCookies(req.headers.cookie);
  const token = cookies.cb_session;
  if (!token) return null;
  const s = sessions.get(token);
  return s ? { token, ...s } : null;
}

function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === '1') parts.push('Secure');
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.expireNow) parts.push('Max-Age=0');
  res.setHeader('Set-Cookie', parts.join('; '));
}

// ---- body parsing ----
function readBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseForm(buf, contentType) {
  const str = buf.toString('utf8');
  if (contentType && contentType.includes('application/json')) {
    try { return JSON.parse(str || '{}'); } catch { return {}; }
  }
  const out = {};
  for (const pair of str.split('&')) {
    if (!pair) continue;
    const [k, v] = pair.split('=');
    out[decodeURIComponent(k.replace(/\+/g, ' '))] = decodeURIComponent((v || '').replace(/\+/g, ' '));
  }
  return out;
}

// ---- helpers ----
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(body);
}
function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function baseCtx(req) {
  const s = D.getSettings();
  const cats = D.listCategories();
  const proto = (process.env.TRUST_PROXY === '1' && req.headers['x-forwarded-proto']) || 'http';
  const base = s.site_url || `${proto}://${req.headers.host}`;
  return { s, cats, base };
}

function notBot(req) {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  return !/bot|crawl|spider|slurp|facebookexternalhit/.test(ua);
}

// ======================= CATRACA DE VISITANTES =======================
// Conta cada visita em página pública: quando entrou, de que país (por IP) e
// se veio de computador ou celular (pelo User-Agent). Ver D.visitStats() e
// a página /admin/visitantes.

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  const ip = (fwd || req.socket.remoteAddress || '').split(',')[0].trim();
  return ip.replace(/^::ffff:/, '');
}

function deviceOf(req) {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  if (/mobile|android|iphone|ipod|windows phone/.test(ua)) return 'Celular';
  return 'Computador';
}

function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  return false;
}

// Cache simples em memória pra não bater na API de geolocalização de novo
// pro mesmo IP toda hora (evita estourar o limite gratuito da API).
const geoCache = new Map();
const GEO_CACHE_MAX = 2000;

async function resolveCountry(ip) {
  if (isPrivateIp(ip)) return 'Local';
  if (geoCache.has(ip)) return geoCache.get(ip);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const resp = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/country_name/`, { signal: ctrl.signal });
    clearTimeout(timer);
    const text = (await resp.text()).trim();
    const country = resp.ok && text && text.length < 60 && !/error|undefined|not found/i.test(text) ? text : 'Desconhecido';
    if (geoCache.size >= GEO_CACHE_MAX) geoCache.clear();
    geoCache.set(ip, country);
    return country;
  } catch (e) {
    return 'Desconhecido';
  }
}

function logVisit(req, pathname) {
  if (!notBot(req)) return;
  try {
    const device = deviceOf(req);
    const id = D.registerPageview(pathname, device, null);
    const ip = clientIp(req);
    resolveCountry(ip)
      .then((country) => D.updatePageviewCountry(id, country))
      .catch(() => {});
  } catch (e) {
    console.error('[visitas]', e.message);
  }
}

// Envolve uma rota pública de página (não API, não admin, não redirect) pra
// contar a visita automaticamente antes de renderizar.
function publicPage(pattern, handler) {
  route('GET', pattern, (req, res, q, params, body) => {
    try {
      const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
      logVisit(req, pathname);
    } catch (e) { /* nunca deixa a contagem quebrar a página */ }
    return handler(req, res, q, params, body);
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- static assets ----
const STATIC_DIR = path.join(__dirname, 'public');
const STATIC_MAP = {
  '/style.css': 'style.css',
  '/admin.css': 'admin.css',
  '/app.js': 'app.js',
  '/admin.js': 'admin.js',
  '/a11y.js': 'a11y.js',
  '/social-bar-cycle.js': 'social-bar-cycle.js',
  '/favicon.svg': 'favicon.svg',
  '/apple-touch-icon.png': 'apple-touch-icon.png',
  '/icon-192.png': 'icon-192.png',
  '/icon-512.png': 'icon-512.png',
  '/manifest.json': 'manifest.json',
  '/static/og.png': 'og.png',
};
const MIME = { '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

function serveStatic(req, res, pathname) {
  const rel = STATIC_MAP[pathname];
  if (!rel) return false;
  const full = path.join(STATIC_DIR, rel);
  if (!fs.existsSync(full)) return false;
  const ext = path.extname(full);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=3600' });
  fs.createReadStream(full).pipe(res);
  return true;
}

function phSvg(req, res, query) {
  const kind = ['tv', 'phone', 'laptop', 'monitor', 'home', 'audio', 'game'].includes(query.kind) ? query.kind : 'tag';
  const svg = I.art(kind);
  res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
  res.end(svg);
}

// ---- router ----
const routes = []; // { method, regex, keys, handler }
function route(method, pattern, handler) {
  const keys = [];
  const regex = new RegExp('^' + pattern.replace(/:[a-zA-Z]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
  routes.push({ method, regex, keys, handler });
}

function matchRoute(method, pathname) {
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.regex.exec(pathname);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { handler: r.handler, params };
    }
  }
  return null;
}

// ======================= PUBLIC ROUTES =======================

route('GET', '/health', (req, res) => sendJson(res, 200, { ok: true }));

publicPage('/', (req, res) => {
  const { s, cats, base } = baseCtx(req);
  send(res, 200, V.homePage({ s, cats, base, configured: GEMINI.isConfigured() }));
});

publicPage('/ofertas', (req, res, q) => {
  const { s, cats, base } = baseCtx(req);
  const page = Math.max(1, Number(q.page) || 1);
  const order = q.order || 'recent';
  const limit = 24;
  const total = D.countDeals({});
  const deals = D.listDeals({ limit, offset: (page - 1) * limit, order });
  send(res, 200, V.offersPage({ s, cats, base, deals, page, totalPages: Math.ceil(total / limit) || 1, order }));
});

publicPage('/categoria/:slug', (req, res, q, params) => {
  const { s, cats, base } = baseCtx(req);
  const cat = D.getCategoryBySlug(params.slug);
  if (!cat) return send(res, 404, V.notFoundPage({ s, cats, base }));
  const page = Math.max(1, Number(q.page) || 1);
  const order = q.order || 'recent';
  const limit = 24;
  const total = D.countDeals({ categoryId: cat.id });
  const deals = D.listDeals({ categoryId: cat.id, limit, offset: (page - 1) * limit, order });
  send(res, 200, V.categoryPage({ s, cats, base, cat, deals, page, totalPages: Math.ceil(total / limit) || 1, order }));
});

publicPage('/buscar', (req, res, q) => {
  const { s, cats, base } = baseCtx(req);
  const query = (q.q || '').trim();
  const deals = query ? D.listDeals({ q: query, limit: 48 }) : [];
  send(res, 200, V.searchPage({ s, cats, base, q: query, deals }));
});

publicPage('/cupons', (req, res) => {
  const { s, cats, base } = baseCtx(req);
  const deals = D.listDeals({ limit: 100 }).filter((d) => d.coupon);
  send(res, 200, V.couponsListing({ s, cats, base, deals }));
});

publicPage('/oferta/:slug', (req, res, q, params) => {
  const { s, cats, base } = baseCtx(req);
  const d = D.getDealBySlug(params.slug);
  if (!d || !d.active) return send(res, 404, V.notFoundPage({ s, cats, base }));
  const related = D.relatedDeals(d.category_id, d.id, 4);
  const history = D.priceHistory(d.id, 30);
  const live = D.liveInfo();
  const waitingCount = D.pendingCount(d.id);
  send(res, 200, V.dealPage({ s, cats, base, d, related, history, live, waitingCount }));
});

publicPage('/anuncie', (req, res) => {
  const { s, cats, base } = baseCtx(req);
  send(res, 200, VX.advertisePage({ s, cats, base }));
});

publicPage('/publicidade', (req, res) => {
  const { s, cats, base } = baseCtx(req);
  const banners = D.listPartnerBanners({ onlyActive: true });
  send(res, 200, VX.advertisingShowcasePage({ s, cats, base, banners }));
});

route('GET', '/pub/:id', (req, res, q, params) => {
  const b = D.getPartnerBannerById(Number(params.id));
  if (!b) return redirect(res, '/publicidade');
  if (notBot(req)) D.registerBannerClick(b.id);
  redirect(res, b.link_url);
});

publicPage('/como-funciona', (req, res) => {
  const { s, cats, base } = baseCtx(req);
  send(res, 200, VX.howItWorksPage({ s, cats, base }));
});

publicPage('/dicas-de-compra', (req, res) => {
  const { s, cats, base } = baseCtx(req);
  send(res, 200, VX.buyingTipsPage({ s, cats, base }));
});

route('GET', '/busca-ia', (req, res) => {
  // A busca por IA agora é a própria página inicial — isso aqui existe só para não
  // quebrar links antigos/favoritos que apontem para /busca-ia.
  redirect(res, '/');
});

route('POST', '/api/busca-ia', async (req, res, q, params, body) => {
  const query = String(body.q || '').trim();
  if (!query) return sendJson(res, 400, { ok: false, error: GEMINI.MSG_EMPTY_QUERY });
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (GEMINI.rateLimited(ip)) {
    return sendJson(res, 429, { ok: false, error: GEMINI.MSG_RATE_LIMITED });
  }
  const result = await GEMINI.searchPrice(query);
  sendJson(res, result.ok ? 200 : 502, result);
});

function staticLegalPage(pathname, title, settingKey) {
  publicPage(pathname, (req, res) => {
    const { s, cats, base } = baseCtx(req);
    const html = (s[settingKey] || `<p>Conteúdo ainda não configurado. Edite em Configurações no painel admin.</p>`).replace(/\n/g, '<br>');
    send(res, 200, V.staticPage({ s, cats, base, title, html, path: pathname }));
  });
}
staticLegalPage('/sobre', 'Sobre', 'page_sobre');
staticLegalPage('/privacidade', 'Política de Privacidade', 'page_privacidade');
staticLegalPage('/termos', 'Termos de Uso', 'page_termos');

route('GET', '/go/:id', (req, res, q, params) => {
  const d = D.getDealById(Number(params.id));
  if (!d) return redirect(res, '/');
  if (notBot(req)) D.registerClick(d.id);
  redirect(res, d.affiliate_url);
});

route('GET', '/robots.txt', (req, res) => {
  const { s } = baseCtx(req);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`User-agent: *\nAllow: /\nSitemap: ${(s.site_url || '').replace(/\/$/, '')}/sitemap.xml\n`);
});

route('GET', '/sitemap.xml', (req, res) => {
  const { s } = baseCtx(req);
  const base = (s.site_url || '').replace(/\/$/, '');
  const deals = D.listDeals({ limit: 5000 });
  const cats = D.listCategories();
  const urls = ['/', '/ofertas', '/cupons', '/como-funciona', '/dicas-de-compra', '/sobre', '/anuncie', '/publicidade', ...cats.map((c) => `/categoria/${c.slug}`), ...deals.map((d) => `/oferta/${d.slug}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${base}${u}</loc></url>`).join('')}</urlset>`;
  res.writeHead(200, { 'Content-Type': 'application/xml' });
  res.end(xml);
});

// ---- public API ----
route('POST', '/api/inscrever', async (req, res, q, params, body) => {
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return sendJson(res, 400, { ok: false, error: 'E-mail inválido.' });
  D.addSubscriber(email);
  sendJson(res, 200, { ok: true });
});

route('POST', '/api/contato-comercial', async (req, res, q, params, body) => {
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  if (!name || !EMAIL_RE.test(email)) return sendJson(res, 400, { ok: false, error: 'Preencha nome e e-mail válidos.' });
  D.addLead({ name, email, phone: body.phone, message: body.message });
  sendJson(res, 200, { ok: true });
});

route('POST', '/api/alerta', async (req, res, q, params, body) => {
  const dealId = Number(body.deal_id);
  const email = String(body.email || '').trim().toLowerCase();
  const target = Number(body.target_price);
  const d = D.getDealById(dealId);
  if (!d) return sendJson(res, 404, { ok: false, error: 'Oferta não encontrada.' });
  if (!EMAIL_RE.test(email)) return sendJson(res, 400, { ok: false, error: 'E-mail inválido.' });
  if (!target || target <= 0) return sendJson(res, 400, { ok: false, error: 'Preço-alvo inválido.' });
  D.createAlert(dealId, email, target);
  sendJson(res, 200, { ok: true, message: 'Prontinho! Você será avisado por e-mail quando o preço baixar.' });
});

route('GET', '/ph.svg', (req, res, q) => phSvg(req, res, q));

// ======================= ADMIN =======================

function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) { redirect(res, '/admin/entrar'); return null; }
  return session;
}

function checkCsrf(req, body, session) {
  return body._csrf && session && body._csrf === session.csrf;
}

function replaceCsrf(html, token) {
  return html.split('__CSRF__').join(esc(token));
}

route('GET', '/admin/entrar', (req, res) => {
  if (getSession(req)) return redirect(res, '/admin');
  const token = AUTH.randomToken(16);
  loginTokens.set(token, Date.now());
  send(res, 200, AV.loginPage({ csrf: token }));
});

const loginTokens = new Map();

route('POST', '/admin/entrar', async (req, res, q, params, body) => {
  const email = String(body.email || '').trim().toLowerCase();
  const user = D.getUserByEmail(email);
  const ok = user && AUTH.verifyPassword(body.password || '', user.password);
  if (!ok) {
    const token = AUTH.randomToken(16);
    return send(res, 401, AV.loginPage({ error: 'E-mail ou senha incorretos.', csrf: token }));
  }
  const token = newSession(user.id);
  setCookie(res, 'cb_session', token, { maxAge: 60 * 60 * 24 * 14 });
  redirect(res, '/admin');
});

route('POST', '/admin/sair', (req, res, q, params, body) => {
  const session = getSession(req);
  if (session) sessions.delete(session.token);
  setCookie(res, 'cb_session', '', { expireNow: true });
  redirect(res, '/admin/entrar');
});

function adminPage(method, pattern, fn) {
  route(method, pattern, async (req, res, q, params, body) => {
    const session = requireAuth(req, res);
    if (!session) return;
    if (method === 'POST' && !checkCsrf(req, body, session)) {
      return send(res, 403, 'Token CSRF inválido. Volte e tente novamente.');
    }
    await fn(req, res, q, params, body, session);
  });
}

function renderAdmin(res, { body, active }, session, title, flash) {
  send(res, 200, replaceCsrf(AV.adminLayout({ title, body, active, csrf: session.csrf, flash }), session.csrf));
}

adminPage('GET', '/admin', (req, res, q, params, body, session) => {
  const st = D.dashboardStats();
  renderAdmin(res, AV.dashboardPage(st), session, 'Painel');
});

adminPage('GET', '/admin/visitantes', (req, res, q, params, body, session) => {
  const st = D.visitStats();
  renderAdmin(res, AV.visitorsPage(st), session, 'Visitantes');
});

adminPage('GET', '/admin/ofertas', (req, res, q, params, body, session) => {
  const deals = D.listDealsAdmin({ q: q.q });
  renderAdmin(res, AV.dealsListPage({ deals, q: q.q }), session, 'Ofertas');
});

adminPage('GET', '/admin/ofertas/nova', (req, res, q, params, body, session) => {
  const cats = D.listCategories();
  renderAdmin(res, AV.dealFormPage({ cats, isNew: true }), session, 'Nova oferta');
});

function parseDealForm(body) {
  return {
    title: String(body.title || '').trim(),
    price: body.price,
    old_price: body.old_price,
    category_id: body.category_id ? Number(body.category_id) : null,
    store_name: String(body.store_name || 'Amazon').trim() || 'Amazon',
    affiliate_url: String(body.affiliate_url || '').trim(),
    source_url: String(body.source_url || '').trim(),
    coupon: String(body.coupon || '').trim(),
    image_url: String(body.image_url || '').trim(),
    description: String(body.description || '').trim(),
    active: body.active === 'on' || body.active === '1' || body.active === true,
    featured: body.featured === 'on' || body.featured === '1' || body.featured === true,
  };
}

adminPage('POST', '/admin/ofertas/nova', (req, res, q, params, body, session) => {
  const data = parseDealForm(body);
  const errors = [];
  if (!data.title) errors.push('Título é obrigatório.');
  if (!data.affiliate_url) errors.push('Link de afiliado é obrigatório.');
  if (!data.price || Number(data.price) <= 0) errors.push('Preço deve ser maior que zero.');
  if (errors.length) {
    const cats = D.listCategories();
    return renderAdmin(res, AV.dealFormPage({ deal: { ...data, id: 0 }, cats, errors, isNew: true }), session, 'Nova oferta');
  }
  const { id } = D.saveDeal(data);
  redirect(res, '/admin/ofertas?msg=criada');
});

adminPage('GET', '/admin/ofertas/:id', (req, res, q, params, body, session) => {
  const d = D.getDealById(Number(params.id));
  if (!d) return redirect(res, '/admin/ofertas');
  const cats = D.listCategories();
  renderAdmin(res, AV.dealFormPage({ deal: d, cats, isNew: false }), session, 'Editar oferta');
});

adminPage('POST', '/admin/ofertas/:id', (req, res, q, params, body, session) => {
  const id = Number(params.id);
  const data = parseDealForm(body);
  const errors = [];
  if (!data.title) errors.push('Título é obrigatório.');
  if (!data.affiliate_url) errors.push('Link de afiliado é obrigatório.');
  if (!data.price || Number(data.price) <= 0) errors.push('Preço deve ser maior que zero.');
  if (errors.length) {
    const cats = D.listCategories();
    return renderAdmin(res, AV.dealFormPage({ deal: { ...data, id }, cats, errors, isNew: false }), session, 'Editar oferta');
  }
  const { matchedAlerts } = D.saveDeal(data, id);
  const updated = D.getDealById(id);
  if (matchedAlerts.length) notifyAlerts(updated, matchedAlerts);
  redirect(res, `/admin/ofertas?msg=salva${matchedAlerts.length ? `&avisos=${matchedAlerts.length}` : ''}`);
});

adminPage('POST', '/admin/ofertas/:id/excluir', (req, res, q, params, body, session) => {
  D.deleteDeal(Number(params.id));
  redirect(res, '/admin/ofertas');
});

adminPage('GET', '/admin/categorias', (req, res, q, params, body, session) => {
  const cats = D.listCategories();
  const counts = D.categoryCounts();
  renderAdmin(res, AV.categoriesPage({ cats, counts }), session, 'Categorias');
});

adminPage('POST', '/admin/categorias', (req, res, q, params, body, session) => {
  if (String(body.name || '').trim()) D.saveCategory({ name: body.name, emoji: body.emoji });
  redirect(res, '/admin/categorias');
});

adminPage('POST', '/admin/categorias/:id/excluir', (req, res, q, params, body, session) => {
  D.deleteCategory(Number(params.id));
  redirect(res, '/admin/categorias');
});

adminPage('GET', '/admin/publicidade', (req, res, q, params, body, session) => {
  const banners = D.listPartnerBanners();
  renderAdmin(res, AV.partnerBannersPage({ banners }), session, 'Publicidade de parceiros');
});

adminPage('POST', '/admin/publicidade', (req, res, q, params, body, session) => {
  const advertiser = String(body.advertiser || '').trim();
  const imageUrl = String(body.image_url || '').trim();
  const linkUrl = String(body.link_url || '').trim();
  if (advertiser && imageUrl && linkUrl) {
    D.createPartnerBanner({ advertiser, image_url: imageUrl, link_url: linkUrl, sort_order: body.sort_order, active: true });
  }
  redirect(res, '/admin/publicidade');
});

adminPage('POST', '/admin/publicidade/:id/alternar', (req, res, q, params, body, session) => {
  D.togglePartnerBanner(Number(params.id));
  redirect(res, '/admin/publicidade');
});

adminPage('POST', '/admin/publicidade/:id/excluir', (req, res, q, params, body, session) => {
  D.deletePartnerBanner(Number(params.id));
  redirect(res, '/admin/publicidade');
});

adminPage('GET', '/admin/config', (req, res, q, params, body, session) => {
  const s = D.getSettings();
  renderAdmin(res, AV.settingsPage({ s }), session, 'Configurações');
});

adminPage('POST', '/admin/config', (req, res, q, params, body, session) => {
  D.setSettings(body);
  redirect(res, '/admin/config?msg=salvo');
});

adminPage('POST', '/admin/senha', (req, res, q, params, body, session) => {
  if (String(body.password || '').length >= 8) {
    D.setUserPassword(session.userId, body.password);
  }
  redirect(res, '/admin/config?msg=senha');
});

adminPage('GET', '/admin/contatos', (req, res, q, params, body, session) => {
  const leads = D.listLeads();
  renderAdmin(res, AX.leadsPage({ leads }), session, 'Contatos');
});

adminPage('POST', '/admin/contatos/:id/status', (req, res, q, params, body, session) => {
  D.setLeadStatus(Number(params.id), body.status);
  redirect(res, '/admin/contatos');
});

adminPage('GET', '/admin/inscritos', (req, res, q, params, body, session) => {
  const subs = D.listSubscribers();
  renderAdmin(res, AX.subscribersPage({ subs }), session, 'Inscritos');
});

adminPage('GET', '/admin/alertas', (req, res, q, params, body, session) => {
  const byDeal = D.listAlertsByDeal();
  renderAdmin(res, AX.alertsPage({ byDeal, mailConfigured: MAIL.isConfigured() }), session, 'Alertas de preço');
});

adminPage('GET', '/admin/ajuda', (req, res, q, params, body, session) => {
  renderAdmin(res, AX.helpPage(), session, 'Ajuda');
});

function launchChecks() {
  const s = D.getSettings();
  const deals = D.countDeals({ onlyActive: true });
  const checks = [
    { level: 'essential', ok: /^https:\/\//.test(s.site_url || ''), title: 'URL do site configurada (https)', desc: 'Defina a URL final do site em Configurações.', link: '/admin/config' },
    { level: 'essential', ok: deals >= 4, title: 'Pelo menos 4 ofertas reais publicadas', desc: `Você tem ${deals} oferta(s) ativa(s).`, link: '/admin/ofertas' },
    { level: 'essential', ok: !!s.amazon_tag, title: 'Tag de afiliado Amazon registrada', desc: 'Preencha sua tag de afiliado em Configurações (lembrete).', link: '/admin/config' },
    { level: 'essential', ok: !!s.contact_email, title: 'E-mail de contato definido', desc: 'Necessário para a página "Anuncie aqui" e para seus visitantes.', link: '/admin/config' },
    { level: 'essential', ok: process.env.ADMIN_PASSWORD ? true : false, title: 'Senha de admin fixada por variável de ambiente', desc: 'Defina ADMIN_PASSWORD no .env/hospedagem para não depender da senha gerada automaticamente.', link: null },
    { level: 'recommended', ok: !!s.whatsapp_url || !!s.instagram_url || !!s.telegram_url, title: 'Pelo menos um canal de divulgação', desc: 'WhatsApp, Instagram ou Telegram configurado.', link: '/admin/config' },
    { level: 'recommended', ok: !!(s.ad_top || s.ad_between || s.ad_deal || s.adsense_client), title: 'Algum banner de anúncio configurado', desc: 'Receita extra além da Amazon — AdSense ou banner de outra rede.', link: '/admin/config' },
    { level: 'recommended', ok: !!s.ga_id, title: 'Google Analytics configurado', desc: 'Para acompanhar visitas.', link: '/admin/config' },
    { level: 'recommended', ok: MAIL.isConfigured(), title: 'E-mail (SMTP) configurado', desc: 'Para os alertas de preço saírem por e-mail de verdade.', link: null },
    { level: 'recommended', ok: !!(s.page_privacidade && s.page_termos), title: 'Páginas de Privacidade e Termos preenchidas', desc: 'Importante para AdSense e para seus visitantes.', link: '/admin/config' },
  ];
  return checks;
}

adminPage('GET', '/admin/lancamento', (req, res, q, params, body, session) => {
  renderAdmin(res, AX.launchPage({ checks: launchChecks() }), session, 'Checklist de lançamento');
});

adminPage('GET', '/admin/backup', (req, res, q, params, body, session) => {
  const buf = D.backupBuffer();
  res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="clickbaixo-backup-${Date.now()}.sqlite"` });
  res.end(buf);
});

function notifyAlerts(deal, hits) {
  if (!hits.length) return;
  for (const hit of hits) {
    MAIL.sendMail({
      to: hit.email,
      subject: `O preço baixou: ${deal.title}`,
      text: `Boa notícia! "${deal.title}" agora está por R$ ${deal.price}. Confira: ${(D.getSettings().site_url || '').replace(/\/$/, '')}/oferta/${deal.slug}`,
    }).catch(() => {});
  }
}

// ======================= HTTP SERVER =======================

const server = http.createServer(async (req, res) => {
  try {
    const parsed = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(parsed.pathname);
    const query = Object.fromEntries(parsed.searchParams.entries());

    if (serveStatic(req, res, pathname)) return;

    const match = matchRoute(req.method, pathname);
    if (!match) {
      const { s, cats, base } = baseCtx(req);
      return send(res, 404, V.notFoundPage({ s, cats, base }));
    }

    let body = {};
    if (req.method === 'POST') {
      const buf = await readBody(req);
      body = parseForm(buf, req.headers['content-type']);
    }
    await match.handler(req, res, query, match.params, body);
  } catch (err) {
    console.error('[erro]', err);
    if (!res.headersSent) send(res, 500, 'Erro interno do servidor.');
  }
});

server.listen(PORT, () => {
  console.log(`Clickbaixo rodando em http://localhost:${PORT}`);
});

module.exports = server;
