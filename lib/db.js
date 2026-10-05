'use strict';
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const { hashPassword } = require('./auth');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'clickbaixo.sqlite');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  emoji TEXT DEFAULT '🏷️',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id INTEGER,
  image_url TEXT,
  price REAL NOT NULL,
  old_price REAL,
  coupon TEXT,
  affiliate_url TEXT NOT NULL,
  source_url TEXT,
  store_name TEXT DEFAULT 'Amazon',
  description TEXT,
  active INTEGER DEFAULT 1,
  featured INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL,
  price REAL NOT NULL,
  recorded_at TEXT NOT NULL,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS price_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  target_price REAL NOT NULL,
  created_at TEXT NOT NULL,
  notified_at TEXT,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_alerts_deal ON price_alerts(deal_id, notified_at);

CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'novo',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  country TEXT,
  device TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS partner_banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advertiser TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  clicks INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
`);

// Migração simples: bancos criados antes da "catraca" de visitantes não têm essas
// colunas ainda. Tenta adicionar; se já existirem, o SQLite recusa e a gente ignora.
for (const col of ['country TEXT', 'device TEXT']) {
  try { db.exec(`ALTER TABLE pageviews ADD COLUMN ${col}`); } catch (e) { /* coluna já existe */ }
}

const DEFAULTS = {
  site_name: 'Clickbaixo',
  site_tagline: 'Clique, ache o preço lá embaixo',
  site_url: process.env.SITE_URL || '',
  contact_email: '',
  whatsapp_url: '',
  telegram_url: '',
  instagram_url: '',
  amazon_tag: 'valterviagens-20',
  adsense_client: '',
  ga_id: '',
  head_code: '<script type="text/javascript" src="//data527.click/2f80d16459178080f274/39acc3d33e/?placementName=clickbaixo"></script>\n<script type="text/javascript" src="//cdn-server.live/5e26c531fb1387e86a0c/2f9291aa27/?placementName=default"></script>',
  ads_txt: '',
  ad_top: '<ins style="width: 300px;height:250px" data-width="300" data-height="250" class="u6475295c50" data-domain="//data527.click" data-affquery="/f0ed67e60ca0a73206da/6475295c50/?placementName=MetaDocExpress"><script src="//data527.click/js/responsive.js" async></script></ins>',
  ad_between: '<ins style="width: 0px;height:0px" data-width="0" data-height="0" class="v208c5fcc73" data-domain="//data527.click" data-affquery="/4ed820bfd3ff18337f19/208c5fcc73/?placementName=MetaDocExpress"><script src="//data527.click/js/responsive.js" async></script></ins>',
  ad_deal: '<ins style="width: 0px;height:0px" data-width="0" data-height="0" class="t47ad935d15" data-domain="//data527.click" data-affquery="/4ed820bfd3ff18337f19/47ad935d15/?placementName=MetaDocExpress"><script src="//data527.click/js/responsive.js" async></script></ins>',
  ad_sidebar: '',
  affiliate_notice: 'Este site participa do Programa de Associados da Amazon, um programa de publicidade projetado para fornecer um meio de ganharmos comissões por meio de links para a Amazon.com.br, sem custo adicional para você.',
  footer_text: '',
  page_privacidade: `Última atualização: ${new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}

O Clickbaixo respeita a sua privacidade. Esta página explica, de forma simples, quais informações coletamos de quem visita o site, para que elas servem e quais são os seus direitos.

1. QUEM SOMOS
O Clickbaixo é um site de divulgação de ofertas e promoções de eletrônicos, com links de afiliado para lojas como a Amazon. Dúvidas sobre esta política podem ser enviadas para o e-mail de contato informado no rodapé do site.

2. QUE INFORMAÇÕES COLETAMOS
Coletamos automaticamente, de forma agregada e sem identificar você pessoalmente:
- O país de onde a visita partiu (a partir do endereço IP, sem guardar o IP em si);
- Se o acesso veio de computador ou celular;
- Quais páginas foram visitadas e quando.
Também coletamos o que você mesmo nos envia por vontade própria, como e-mail ao se inscrever na newsletter, ou nome, e-mail, telefone e mensagem ao preencher o formulário da página "Anuncie aqui" ou um alerta de preço.
Não pedimos nem coletamos dados sensíveis (como CPF, documentos, dados de pagamento ou de saúde).

3. COOKIES E TECNOLOGIAS SEMELHANTES
Usamos cookies próprios para lembrar preferências (como modo escuro) e cookies de terceiros ligados aos anúncios exibidos no site e, quando configurado, ao Google Analytics. Esses parceiros podem usar cookies para medir audiência e exibir publicidade. Você pode bloquear cookies nas configurações do seu navegador, mas isso pode afetar o funcionamento de algumas partes do site.

4. LINKS DE AFILIADO E PUBLICIDADE
O Clickbaixo participa do Programa de Associados da Amazon e pode ganhar comissão sobre compras feitas a partir dos nossos links, sem custo adicional para você. O site também exibe anúncios de redes de publicidade parceiras. Essas empresas têm suas próprias políticas de privacidade, que não controlamos.

5. PARA QUE USAMOS ESSAS INFORMAÇÕES
Usamos os dados coletados para: entender quais ofertas e páginas fazem mais sucesso; melhorar o site; responder contatos e alertas de preço que você solicitou; e cumprir obrigações legais, quando aplicável. Não vendemos seus dados pessoais a terceiros.

6. COM QUEM COMPARTILHAMOS
Compartilhamos informações apenas com prestadores de serviço que ajudam a operar o site (hospedagem, envio de e-mail, redes de anúncio e análise de audiência), e somente na medida necessária para esse serviço.

7. SEUS DIREITOS (LGPD)
De acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode pedir, a qualquer momento: confirmação de que tratamos seus dados, acesso a eles, correção de dados incompletos ou desatualizados, exclusão dos seus dados (como remover seu e-mail da newsletter) e informações sobre com quem compartilhamos seus dados. Para exercer esses direitos, use o e-mail de contato informado no rodapé do site.

8. SEGURANÇA
Adotamos medidas razoáveis para proteger as informações que coletamos, mas nenhum site é 100% livre de risco. Caso identifique qualquer problema de segurança, avise-nos pelo e-mail de contato.

9. CRIANÇAS E ADOLESCENTES
O Clickbaixo não é direcionado a menores de 18 anos e não coleta intencionalmente dados de crianças ou adolescentes.

10. ALTERAÇÕES DESTA POLÍTICA
Podemos atualizar esta política de tempos em tempos para refletir mudanças no site ou na legislação. A data no topo desta página mostra a última atualização.`,
  page_termos: `Última atualização: ${new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}

Ao usar o Clickbaixo, você concorda com estes Termos de Uso. Leia com atenção.

1. O QUE É O CLICKBAIXO
O Clickbaixo é um site de divulgação de ofertas e promoções de produtos eletrônicos encontradas em outras lojas, principalmente na Amazon. Nós não vendemos produtos diretamente: ao clicar em "Ver oferta", você é levado para o site da loja parceira, onde a compra é feita diretamente com ela.

2. LINKS DE AFILIADO
O Clickbaixo participa do Programa de Associados da Amazon e de outros programas de afiliados. Isso significa que podemos receber uma comissão quando você compra um produto através dos nossos links, sem nenhum custo adicional para você. Essa comissão não influencia o preço que você paga.

3. PRECISÃO DAS OFERTAS E PREÇOS
Fazemos o possível para conferir cada oferta antes de publicar, mas preços, cupons e estoque são controlados pelas lojas parceiras e podem mudar a qualquer momento, inclusive depois de publicarmos a oferta aqui. Sempre confira o preço final e as condições diretamente no site da loja antes de concluir a compra. O Clickbaixo não se responsabiliza por diferenças de preço, falta de estoque ou alterações feitas pela loja depois da publicação.

4. PUBLICIDADE
O site exibe anúncios de redes de publicidade parceiras para se manter gratuito. Esses anúncios são de responsabilidade de quem os veicula; o Clickbaixo não se responsabiliza pelo conteúdo, produtos ou serviços anunciados por terceiros.

5. CONTA E FORMULÁRIOS
Alguns recursos (newsletter, alerta de preço, formulário de "Anuncie aqui") pedem informações de contato como e-mail, nome ou telefone. Ao preencher esses formulários, você garante que as informações fornecidas são verdadeiras e autoriza o uso descrito na nossa Política de Privacidade.

6. USO PERMITIDO DO SITE
Você concorda em não usar o Clickbaixo para fins ilegais, para tentar acessar áreas restritas sem autorização, para sobrecarregar o site de forma automatizada (bots, scraping em massa) ou para qualquer atividade que prejudique o funcionamento do site ou de outros usuários.

7. PROPRIEDADE INTELECTUAL
A marca, o layout e os textos originais do Clickbaixo pertencem ao site. Imagens, nomes e marcas de produtos de terceiros pertencem aos respectivos fabricantes e lojas, e são usados aqui apenas a título informativo.

8. LIMITAÇÃO DE RESPONSABILIDADE
O Clickbaixo é um serviço de divulgação de ofertas, fornecido "como está". Não garantimos que o site ficará sempre no ar sem interrupções, nem nos responsabilizamos por prejuízos decorrentes de compras feitas em sites de terceiros a partir dos nossos links.

9. LINKS EXTERNOS
O site contém links para sites de terceiros (lojas, redes sociais, anunciantes). Não temos controle sobre o conteúdo ou as práticas desses sites e recomendamos a leitura dos termos e da política de privacidade de cada um antes de usá-los.

10. ALTERAÇÕES DESTES TERMOS
Podemos atualizar estes Termos de Uso a qualquer momento, publicando a nova versão nesta página com a data de atualização no topo. O uso contínuo do site após uma alteração significa que você concorda com os novos termos.

11. LEI APLICÁVEL
Estes termos são regidos pelas leis da República Federativa do Brasil.

12. CONTATO
Dúvidas sobre estes termos podem ser enviadas para o e-mail de contato informado no rodapé do site.`,
  page_sobre: '',
};

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = {};
  for (const r of rows) map[r.key] = r.value;
  return { ...DEFAULTS, ...map };
}

function setSettings(obj) {
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  const tx = db.exec('BEGIN');
  try {
    for (const [k, v] of Object.entries(obj)) {
      if (!(k in DEFAULTS)) continue;
      stmt.run(k, String(v ?? ''));
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

function uniqueSlug(base, table, excludeId = 0) {
  let slug = slugify(base);
  let n = 1;
  while (true) {
    const row = db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).get(slug, excludeId);
    if (!row) return slug;
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
}

// ---- categories ----
function listCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY sort_order ASC, name ASC').all();
}
function getCategoryBySlug(slug) {
  return db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
}
function getCategoryById(id) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}
function saveCategory(data, id = 0) {
  const slug = uniqueSlug(data.name, 'categories', id);
  if (id) {
    db.prepare('UPDATE categories SET name=?, slug=?, emoji=?, sort_order=? WHERE id=?')
      .run(data.name, slug, data.emoji || '🏷️', Number(data.sort_order) || 0, id);
    return id;
  }
  const r = db.prepare('INSERT INTO categories (name, slug, emoji, sort_order) VALUES (?,?,?,?)')
    .run(data.name, slug, data.emoji || '🏷️', Number(data.sort_order) || 0);
  return Number(r.lastInsertRowid);
}
function deleteCategory(id) {
  db.prepare('UPDATE deals SET category_id = NULL WHERE category_id = ?').run(id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}
function categoryCounts() {
  const rows = db.prepare(`SELECT category_id, COUNT(*) n FROM deals WHERE active = 1 GROUP BY category_id`).all();
  const map = {};
  for (const r of rows) map[r.category_id] = r.n;
  return map;
}

// ---- deals ----
const DEAL_COLS = `d.*, c.name AS category_name, c.slug AS category_slug, c.emoji AS category_emoji`;

function rowToDeal(r) {
  if (!r) return r;
  return r;
}

function listDeals({ categoryId, q, onlyFeatured, onlyActive = true, limit = 60, offset = 0, order = 'recent' } = {}) {
  const where = [];
  const params = [];
  if (onlyActive) where.push('d.active = 1');
  if (categoryId) { where.push('d.category_id = ?'); params.push(categoryId); }
  if (q) { where.push('(d.title LIKE ? OR d.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (onlyFeatured) where.push('d.featured = 1');
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  let orderSql = 'd.created_at DESC';
  if (order === 'price_asc') orderSql = 'd.price ASC';
  else if (order === 'price_desc') orderSql = 'd.price DESC';
  else if (order === 'discount') orderSql = '(CASE WHEN d.old_price > 0 THEN (d.old_price - d.price) / d.old_price ELSE 0 END) DESC';
  const sql = `SELECT ${DEAL_COLS} FROM deals d LEFT JOIN categories c ON c.id = d.category_id ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  return db.prepare(sql).all(...params);
}

function countDeals({ categoryId, q, onlyActive = true } = {}) {
  const where = [];
  const params = [];
  if (onlyActive) where.push('active = 1');
  if (categoryId) { where.push('category_id = ?'); params.push(categoryId); }
  if (q) { where.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const row = db.prepare(`SELECT COUNT(*) n FROM deals ${whereSql}`).get(...params);
  return row.n;
}

function getDealById(id) {
  return db.prepare(`SELECT ${DEAL_COLS} FROM deals d LEFT JOIN categories c ON c.id = d.category_id WHERE d.id = ?`).get(id);
}
function getDealBySlug(slug) {
  return db.prepare(`SELECT ${DEAL_COLS} FROM deals d LEFT JOIN categories c ON c.id = d.category_id WHERE d.slug = ?`).get(slug);
}
function listDealsAdmin({ q, limit = 200, offset = 0 } = {}) {
  const where = [];
  const params = [];
  if (q) { where.push('d.title LIKE ?'); params.push(`%${q}%`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return db.prepare(`SELECT ${DEAL_COLS} FROM deals d LEFT JOIN categories c ON c.id = d.category_id ${whereSql} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
}

function priceHistory(dealId, limit = 20) {
  return db.prepare('SELECT * FROM price_history WHERE deal_id = ? ORDER BY recorded_at ASC LIMIT ?').all(dealId, limit);
}

function saveDeal(data, id = 0) {
  const now = new Date().toISOString();
  const price = Number(data.price) || 0;
  const oldPrice = data.old_price ? Number(data.old_price) : null;
  let matchedAlerts = [];
  if (id) {
    const existing = db.prepare('SELECT price FROM deals WHERE id = ?').get(id);
    db.prepare(`UPDATE deals SET title=?, category_id=?, image_url=?, price=?, old_price=?, coupon=?, affiliate_url=?, source_url=?, store_name=?, description=?, active=?, featured=?, updated_at=? WHERE id=?`)
      .run(data.title, data.category_id || null, data.image_url || null, price, oldPrice, data.coupon || null, data.affiliate_url, data.source_url || null, data.store_name || 'Amazon', data.description || null, data.active ? 1 : 0, data.featured ? 1 : 0, now, id);
    if (existing && Number(existing.price) !== price) {
      db.prepare('INSERT INTO price_history (deal_id, price, recorded_at) VALUES (?,?,?)').run(id, price, now);
      matchedAlerts = matchAlerts(id, price, now);
    }
    return { id, matchedAlerts };
  }
  const slug = uniqueSlug(data.title, 'deals', 0);
  const r = db.prepare(`INSERT INTO deals (title, slug, category_id, image_url, price, old_price, coupon, affiliate_url, source_url, store_name, description, active, featured, clicks, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)`)
    .run(data.title, slug, data.category_id || null, data.image_url || null, price, oldPrice, data.coupon || null, data.affiliate_url, data.source_url || null, data.store_name || 'Amazon', data.description || null, data.active ? 1 : 0, data.featured ? 1 : 0, now, now);
  const newId = Number(r.lastInsertRowid);
  db.prepare('INSERT INTO price_history (deal_id, price, recorded_at) VALUES (?,?,?)').run(newId, price, now);
  return { id: newId, matchedAlerts: [] };
}

function deleteDeal(id) {
  db.prepare('DELETE FROM deals WHERE id = ?').run(id);
}

function registerClick(dealId) {
  const now = new Date().toISOString();
  db.prepare('INSERT INTO clicks (deal_id, created_at) VALUES (?,?)').run(dealId, now);
  db.prepare('UPDATE deals SET clicks = clicks + 1 WHERE id = ?').run(dealId);
}

function registerPageview(p, device, country) {
  const info = db.prepare('INSERT INTO pageviews (path, created_at, device, country) VALUES (?,?,?,?)')
    .run(p, new Date().toISOString(), device || null, country || null);
  return info.lastInsertRowid;
}

function updatePageviewCountry(id, country) {
  db.prepare('UPDATE pageviews SET country = ? WHERE id = ?').run(country, id);
}

// "Catraca" de visitantes: total, por país e por tipo de aparelho (computador/celular).
function visitStats() {
  const total = db.prepare('SELECT COUNT(*) n FROM pageviews').get().n;
  const today = db.prepare("SELECT COUNT(*) n FROM pageviews WHERE created_at >= datetime('now','start of day')").get().n;
  const last30d = db.prepare("SELECT COUNT(*) n FROM pageviews WHERE created_at >= datetime('now','-30 day')").get().n;
  // Sem LIMIT aqui de propósito — é pra listar TODOS os países do mundo que já
  // mandaram visita, não só os primeiros. Tem menos de 250 países no planeta,
  // então isso nunca vira uma lista gigante.
  const byCountry = db.prepare(`
    SELECT COALESCE(NULLIF(country, ''), 'Aguardando…') country, COUNT(*) n
    FROM pageviews GROUP BY country ORDER BY n DESC
  `).all();
  const countryCount = byCountry.filter((r) => r.country !== 'Aguardando…' && r.country !== 'Local' && r.country !== 'Desconhecido').length;
  const byDevice = db.prepare(`
    SELECT COALESCE(NULLIF(device, ''), 'Desconhecido') device, COUNT(*) n
    FROM pageviews GROUP BY device ORDER BY n DESC
  `).all();
  const byPage = db.prepare(`
    SELECT path, COUNT(*) n FROM pageviews GROUP BY path ORDER BY n DESC LIMIT 20
  `).all();
  const recent = db.prepare('SELECT path, created_at, device, country FROM pageviews ORDER BY id DESC LIMIT 30').all();
  return { total, today, last30d, byCountry, countryCount, byDevice, byPage, recent };
}

function topDiscounts(limit = 8, exceptId = 0) {
  return db.prepare(`SELECT ${DEAL_COLS} FROM deals d LEFT JOIN categories c ON c.id = d.category_id
    WHERE d.active = 1 AND d.old_price > d.price AND d.id != ?
    ORDER BY (d.old_price - d.price) / d.old_price DESC LIMIT ?`).all(exceptId, limit);
}

function relatedDeals(categoryId, exceptId, limit = 4) {
  return db.prepare(`SELECT ${DEAL_COLS} FROM deals d LEFT JOIN categories c ON c.id = d.category_id
    WHERE d.active = 1 AND d.category_id = ? AND d.id != ? ORDER BY d.created_at DESC LIMIT ?`).all(categoryId, exceptId, limit);
}

function liveInfo() {
  const total = db.prepare('SELECT COUNT(*) n FROM deals WHERE active = 1').get().n;
  const lastCheck = db.prepare('SELECT MAX(updated_at) m FROM deals').get().m;
  return { total, lastCheck };
}

// ---- price alerts ----
function createAlert(dealId, email, targetPrice) {
  const now = new Date().toISOString();
  const r = db.prepare('INSERT INTO price_alerts (deal_id, email, target_price, created_at) VALUES (?,?,?,?)')
    .run(dealId, email, targetPrice, now);
  return Number(r.lastInsertRowid);
}
function pendingCount(dealId) {
  return db.prepare('SELECT COUNT(*) n FROM price_alerts WHERE deal_id = ? AND notified_at IS NULL').get(dealId).n;
}
function matchAlerts(dealId, price, now) {
  const hits = db.prepare('SELECT * FROM price_alerts WHERE deal_id = ? AND notified_at IS NULL AND target_price >= ?').all(dealId, price);
  if (hits.length) {
    db.prepare('UPDATE price_alerts SET notified_at = ? WHERE deal_id = ? AND notified_at IS NULL AND target_price >= ?').run(now, dealId, price);
  }
  return hits;
}
function listAlertsByDeal() {
  const rows = db.prepare(`
    SELECT d.id as deal_id, d.title, d.slug, d.price,
      SUM(CASE WHEN a.notified_at IS NULL THEN 1 ELSE 0 END) as pending,
      COUNT(*) as total,
      MAX(a.created_at) as last_at
    FROM price_alerts a JOIN deals d ON d.id = a.deal_id
    GROUP BY d.id
    ORDER BY pending DESC, last_at DESC
  `).all();
  return rows;
}
function listAlertsForDeal(dealId) {
  return db.prepare('SELECT * FROM price_alerts WHERE deal_id = ? ORDER BY created_at DESC').all(dealId);
}
function deleteAlert(id) {
  db.prepare('DELETE FROM price_alerts WHERE id = ?').run(id);
}
function alertStats() {
  const pending = db.prepare('SELECT COUNT(*) n FROM price_alerts WHERE notified_at IS NULL').get().n;
  const total = db.prepare('SELECT COUNT(*) n FROM price_alerts').get().n;
  return { pending, total };
}

// ---- subscribers / leads ----
function addSubscriber(email) {
  try {
    db.prepare('INSERT INTO subscribers (email, created_at) VALUES (?,?)').run(email, new Date().toISOString());
    return true;
  } catch (e) {
    return false;
  }
}
function countSubscribers() {
  return db.prepare('SELECT COUNT(*) n FROM subscribers').get().n;
}
function listSubscribers(limit = 500) {
  return db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC LIMIT ?').all(limit);
}
function addLead(data) {
  db.prepare('INSERT INTO leads (name, email, phone, message, status, created_at) VALUES (?,?,?,?,?,?)')
    .run(data.name || '', data.email || '', data.phone || '', data.message || '', 'novo', new Date().toISOString());
}
function listLeads() {
  return db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
}
function setLeadStatus(id, status) {
  db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, id);
}

// ---- partner banners (vitrine de publicidade de lojas/plataformas parceiras) ----
function listPartnerBanners({ onlyActive = false } = {}) {
  const where = onlyActive ? 'WHERE active = 1' : '';
  return db.prepare(`SELECT * FROM partner_banners ${where} ORDER BY sort_order ASC, created_at DESC`).all();
}
function getPartnerBannerById(id) {
  return db.prepare('SELECT * FROM partner_banners WHERE id = ?').get(id);
}
function createPartnerBanner(data) {
  const r = db.prepare('INSERT INTO partner_banners (advertiser, image_url, link_url, sort_order, active, created_at) VALUES (?,?,?,?,?,?)')
    .run(data.advertiser, data.image_url, data.link_url, Number(data.sort_order) || 0, data.active ? 1 : 0, new Date().toISOString());
  return Number(r.lastInsertRowid);
}
function deletePartnerBanner(id) {
  db.prepare('DELETE FROM partner_banners WHERE id = ?').run(id);
}
function togglePartnerBanner(id) {
  db.prepare('UPDATE partner_banners SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
}
function registerBannerClick(id) {
  db.prepare('UPDATE partner_banners SET clicks = clicks + 1 WHERE id = ?').run(id);
}

// ---- users ----
function userCount() {
  return db.prepare('SELECT COUNT(*) n FROM users').get().n;
}
function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}
function createUser(email, password) {
  db.prepare('INSERT INTO users (email, password, created_at) VALUES (?,?,?)')
    .run(email, hashPassword(password), new Date().toISOString());
}
function setUserPassword(id, password) {
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPassword(password), id);
}

// ---- stats ----
function dashboardStats() {
  const deals = db.prepare('SELECT COUNT(*) n FROM deals WHERE active = 1').get().n;
  const clicksTotal = db.prepare('SELECT COUNT(*) n FROM clicks').get().n;
  const clicks7d = db.prepare("SELECT COUNT(*) n FROM clicks WHERE created_at >= datetime('now','-7 day')").get().n;
  const views30d = db.prepare("SELECT COUNT(*) n FROM pageviews WHERE created_at >= datetime('now','-30 day')").get().n;
  const subs = countSubscribers();
  const newLeads = db.prepare("SELECT COUNT(*) n FROM leads WHERE status='novo'").get().n;
  const pendingAlerts = alertStats().pending;
  const clicksByDeal = db.prepare(`SELECT d.title, COUNT(*) n FROM clicks cl JOIN deals d ON d.id = cl.deal_id GROUP BY d.id ORDER BY n DESC LIMIT 10`).all();
  return { deals, clicksTotal, clicks7d, views30d, subs, newLeads, pendingAlerts, clicksByDeal };
}

function demoSeed() {
  if (process.env.NO_DEMO === '1') return;
  if (listCategories().length) return;
  const cats = [
    ['Smart TVs', '📺'], ['Celulares', '📱'], ['Notebooks', '💻'],
    ['Informática', '⌨️'], ['Eletrodomésticos', '🏠'], ['Áudio e Eletrônicos', '🎧'],
  ];
  const ids = cats.map(([name, emoji]) => saveCategory({ name, emoji }));
  const celularesAffiliateUrl = 'https://www.amazon.com.br/s?k=celular+barato+promo%C3%A7%C3%A3o&crid=4SZEG7797HCK&sprefix=Celular+bara%2Caps%2C324&linkCode=ll2&tag=valterviagens-20&linkId=b1db09bc7bcdcd26ff03528fa36311d0&ref_=as_li_ss_tl';
  const eletrodomesticosAffiliateUrl = 'https://www.amazon.com.br/s?k=eletrodomesticos+promo%C3%A7%C3%B5es&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&linkCode=ll2&tag=valterviagens-20&linkId=ed846884ff429053bc714a37c50908ec&ref_=as_li_ss_tl';
  const audioEletronicosAffiliateUrl = 'https://www.amazon.com.br/s?k=eletronicos+baratos&crid=3R454WXDR198W&sprefix=Eletr%C3%B4nicos+%2Caps%2C380&linkCode=ll2&tag=valterviagens-20&linkId=6d9612b9becacc9d0c17baf831f53e01&ref_=as_li_ss_tl';
  const smartTvsAffiliateUrl = 'https://www.amazon.com.br/s?k=Tv+promo%C3%A7%C3%A3o&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=22PDC2QR0S1CI&sprefix=tv+promo%C3%A7%C3%A3o+%2Caps%2C926&linkCode=ll2&tag=valterviagens-20&linkId=c903eb7f0ba4ba5903f7e8599de0ab7d&ref_=as_li_ss_tl';
  const notebooksAffiliateUrl = 'https://www.amazon.com.br/s?k=notebook+promo%C3%A7%C3%B5es&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&linkCode=ll2&tag=valterviagens-20&linkId=1dc89405761b7e111f84c57a6b2671b6&ref_=as_li_ss_tl';
  const informaticaAffiliateUrl = 'https://www.amazon.com.br/s?k=Item+Inform%C3%A1tica+promo%C3%A7%C3%A3o&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=2MNRKBQJFT266&sprefix=item+inform%C3%A1tica+promo%C3%A7%C3%A3o+%2Caps%2C524&linkCode=ll2&tag=valterviagens-20&linkId=3807d6a0cf17ba242bb46c9a501dd5a6&ref_=as_li_ss_tl';
  const sample = [
    ['Smart TV 50" 4K', ids[0], 1899, 2599, smartTvsAffiliateUrl],
    ['Fone de ouvido Bluetooth', ids[5], 129, 249, audioEletronicosAffiliateUrl],
    ['Notebook 8GB 256GB SSD', ids[2], 2399, 3199, notebooksAffiliateUrl],
    ['Smartphone 128GB', ids[1], 999, 1399, celularesAffiliateUrl],
    ['Air Fryer 4L', ids[4], 219, 349, eletrodomesticosAffiliateUrl],
    ['Mouse sem fio', ids[3], 59, 99, informaticaAffiliateUrl],
  ];
  for (const [title, cid, price, oldPrice, url] of sample) {
    saveDeal({ title, category_id: cid, price, old_price: oldPrice, affiliate_url: url, store_name: 'Amazon', active: 1, featured: 1, description: 'Oferta de demonstração — edite ou remova no painel.' });
  }
}

function backupBuffer() {
  return fs.readFileSync(DB_PATH);
}

module.exports = {
  db, DATA_DIR, DB_PATH, DEFAULTS,
  getSettings, setSettings, slugify, uniqueSlug,
  listCategories, getCategoryBySlug, getCategoryById, saveCategory, deleteCategory, categoryCounts,
  listDeals, countDeals, getDealById, getDealBySlug, listDealsAdmin, priceHistory, saveDeal, deleteDeal,
  registerClick, registerPageview, updatePageviewCountry, visitStats, topDiscounts, relatedDeals, liveInfo,
  createAlert, pendingCount, matchAlerts, listAlertsByDeal, listAlertsForDeal, deleteAlert, alertStats,
  addSubscriber, countSubscribers, listSubscribers, addLead, listLeads, setLeadStatus,
  listPartnerBanners, getPartnerBannerById, createPartnerBanner, deletePartnerBanner, togglePartnerBanner, registerBannerClick,
  userCount, getUserByEmail, createUser, setUserPassword,
  dashboardStats, demoSeed, backupBuffer,
};
