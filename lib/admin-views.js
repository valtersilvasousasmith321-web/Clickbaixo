'use strict';
const { esc, money } = require('./util');
const I = require('./icons');
const V = require('./views');

const NAV = [
  { href: '/admin', label: 'Painel', icon: 'grid' },
  { href: '/admin/visitantes', label: 'Visitantes', icon: 'chart' },
  { href: '/admin/lancamento', label: 'Checklist de lançamento', icon: 'check' },
  { group: 'Ofertas' },
  { href: '/admin/ofertas', label: 'Ofertas', icon: 'tag' },
  { href: '/admin/ofertas/nova', label: 'Nova oferta', icon: 'bolt' },
  { href: '/admin/categorias', label: 'Categorias', icon: 'grid' },
  { group: 'Público' },
  { href: '/admin/publicidade', label: 'Publicidade (banners)', icon: 'megaphone' },
  { href: '/admin/contatos', label: 'Contatos (anuncie)', icon: 'megaphone' },
  { href: '/admin/alertas', label: 'Alertas de preço', icon: 'bolt' },
  { href: '/admin/inscritos', label: 'Inscritos', icon: 'share' },
  { href: '/admin/config', label: 'Configurações', icon: 'filter' },
  { group: '' },
  { href: '/admin/ajuda', label: 'Ajuda', icon: 'external' },
];

function adminLayout({ title, body, active, csrf, flash }) {
  const nav = NAV.map((item) => {
    if (item.group !== undefined) return item.group ? `<p class="nav-group">${esc(item.group)}</p>` : '<hr>';
    return `<a href="${item.href}" class="${active === item.href ? 'active' : ''}">${I.icon(item.icon, 16)} ${esc(item.label)}</a>`;
  }).join('');
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>(function(){try{
  var t=localStorage.getItem('cb_theme');
  if(!t){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}
  document.documentElement.setAttribute('data-theme',t);
  if(localStorage.getItem('cb_contrast')==='1') document.documentElement.setAttribute('data-contrast','high');
  var f=localStorage.getItem('cb_fontsize'); if(f&&f!=='base') document.documentElement.setAttribute('data-fontsize',f);
}catch(e){}})();</script>
<title>${esc(title)} · Admin Clickbaixo</title>
<meta name="robots" content="noindex,nofollow">
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/admin.css">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0d1526">
</head>
<body class="admin-body">
<a class="skip-link" href="#mainContent">Pular para o conteúdo</a>
<div class="admin-shell">
  <aside class="admin-side">
    <a class="brand" href="/admin">${V.logoMark(22)} <span>Clickbaixo</span></a>
    <nav>${nav}</nav>
    <form method="post" action="/admin/sair"><input type="hidden" name="_csrf" value="${esc(csrf)}"><button class="link-btn" type="submit">Sair</button></form>
  </aside>
  <main class="admin-main" id="mainContent" tabindex="-1">
    ${flash ? `<div class="flash flash-${flash.type}">${esc(flash.msg)}</div>` : ''}
    ${body}
  </main>
</div>
${V.a11yWidget()}
<script src="/admin.js"></script>
<script src="/a11y.js"></script>
</body>
</html>`;
}

function loginPage({ error, csrf }) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<script>(function(){try{
  var t=localStorage.getItem('cb_theme');
  if(!t){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}
  document.documentElement.setAttribute('data-theme',t);
  if(localStorage.getItem('cb_contrast')==='1') document.documentElement.setAttribute('data-contrast','high');
  var f=localStorage.getItem('cb_fontsize'); if(f&&f!=='base') document.documentElement.setAttribute('data-fontsize',f);
}catch(e){}})();</script>
<title>Entrar · Clickbaixo</title><meta name="robots" content="noindex,nofollow">
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/admin.css"></head>
<body class="admin-body login-body">
  <form class="login-card" method="post" action="/admin/entrar">
    <h1>${V.logoMark(24)} Clickbaixo</h1>
    <p class="muted">Painel administrativo</p>
    ${error ? `<p class="flash flash-error">${esc(error)}</p>` : ''}
    <input type="hidden" name="_csrf" value="${esc(csrf)}">
    <label>E-mail<input type="email" name="email" required autofocus></label>
    <label>Senha<input type="password" name="password" required></label>
    <button class="btn btn-buy" type="submit">Entrar</button>
  </form>
  ${V.a11yWidget()}
  <script src="/a11y.js"></script>
</body></html>`;
}

function dashboardPage(st) {
  const body = `
  <h1>Painel</h1>
  <div class="stat-grid">
    <div class="stat-card"><span>${st.deals}</span><p>Ofertas ativas</p></div>
    <div class="stat-card"><span>${st.clicksTotal}</span><p>Cliques totais</p></div>
    <div class="stat-card"><span>${st.clicks7d}</span><p>Cliques (7 dias)</p></div>
    <div class="stat-card"><span>${st.views30d}</span><p>Visitas (30 dias)</p></div>
    <div class="stat-card"><span>${st.subs}</span><p>Inscritos</p></div>
    <div class="stat-card"><span>${st.newLeads}</span><p>Contatos novos</p></div>
    <div class="stat-card"><span>${st.pendingAlerts}</span><p>Alertas pendentes</p></div>
  </div>
  <h2>Mais clicados</h2>
  <table class="admin-table">
    <thead><tr><th>Oferta</th><th>Cliques</th></tr></thead>
    <tbody>${st.clicksByDeal.map((r) => `<tr><td>${esc(r.title)}</td><td>${r.n}</td></tr>`).join('') || '<tr><td colspan="2" class="muted">Sem dados ainda</td></tr>'}</tbody>
  </table>`;
  return { body, active: '/admin' };
}

function timeAgo(iso) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function visitorsPage(st) {
  const pct = (n) => (st.total ? Math.round((n / st.total) * 100) : 0);
  const body = `
  <div class="page-head"><h1>Visitantes</h1></div>
  <p class="muted">Toda vez que alguém abre uma página do site conta aqui — tipo uma catraca. O país vem do IP de quem visitou (pode levar um instante pra aparecer) e o tipo de aparelho vem do navegador.</p>
  <div class="stat-grid">
    <div class="stat-card"><span>${st.total}</span><p>Total de visitas (catraca)</p></div>
    <div class="stat-card"><span>${st.today}</span><p>Hoje</p></div>
    <div class="stat-card"><span>${st.last30d}</span><p>Últimos 30 dias</p></div>
    <div class="stat-card"><span>${st.countryCount}</span><p>Países diferentes já visitaram</p></div>
  </div>

  <h2>De onde vieram (todos os países do mundo que já visitaram)</h2>
  <table class="admin-table">
    <thead><tr><th>País</th><th>Visitas</th><th>%</th></tr></thead>
    <tbody>${st.byCountry.map((r) => `<tr><td>${esc(r.country)}</td><td>${r.n}</td><td>${pct(r.n)}%</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Sem dados ainda</td></tr>'}</tbody>
  </table>

  <h2>Computador ou celular</h2>
  <table class="admin-table">
    <thead><tr><th>Aparelho</th><th>Visitas</th><th>%</th></tr></thead>
    <tbody>${st.byDevice.map((r) => `<tr><td>${esc(r.device)}</td><td>${r.n}</td><td>${pct(r.n)}%</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Sem dados ainda</td></tr>'}</tbody>
  </table>

  <h2>Páginas mais visitadas</h2>
  <table class="admin-table">
    <thead><tr><th>Página</th><th>Visitas</th><th>%</th></tr></thead>
    <tbody>${st.byPage.map((r) => `<tr><td>${esc(r.path)}</td><td>${r.n}</td><td>${pct(r.n)}%</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Sem dados ainda</td></tr>'}</tbody>
  </table>

  <h2>Últimas visitas</h2>
  <table class="admin-table">
    <thead><tr><th>Quando</th><th>Página</th><th>País</th><th>Aparelho</th></tr></thead>
    <tbody>${st.recent.map((r) => `<tr><td>${timeAgo(r.created_at)}</td><td>${esc(r.path)}</td><td>${esc(r.country || 'Aguardando…')}</td><td>${esc(r.device || '—')}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Sem dados ainda</td></tr>'}</tbody>
  </table>
  <p class="muted small">O país é descoberto consultando o IP do visitante num serviço externo (ipapi.co) — isso só funciona com o site publicado de verdade na internet com acesso de saída liberado. Rodando aqui local (ou num ambiente sem internet de saída), vai aparecer "Desconhecido" ou "Local".</p>`;
  return { body, active: '/admin/visitantes' };
}

function categoryBadge(c) {
  return c ? `${c.emoji || ''} ${esc(c.name)}` : '<span class="muted">—</span>';
}

function dealsListPage({ deals, q }) {
  const body = `
  <div class="page-head">
    <h1>Ofertas</h1>
    <a class="btn btn-buy" href="/admin/ofertas/nova">Nova oferta</a>
  </div>
  <form class="inline-search" method="get"><input type="search" name="q" value="${esc(q || '')}" placeholder="Buscar..."><button class="btn btn-sm" type="submit">Buscar</button></form>
  <table class="admin-table">
    <thead><tr><th></th><th>Título</th><th>Categoria</th><th>Preço</th><th>Cliques</th><th>Status</th><th></th></tr></thead>
    <tbody>${deals.map((d) => `<tr>
      <td><img class="thumb" src="${d.image_url || '/ph.svg'}" alt=""></td>
      <td><a href="/admin/ofertas/${d.id}">${esc(d.title)}</a></td>
      <td>${categoryBadge(d.category_id ? { emoji: d.category_emoji, name: d.category_name } : null)}</td>
      <td>${money(d.price)}</td>
      <td>${d.clicks}</td>
      <td>${d.active ? '<span class="pill-ok">Ativa</span>' : '<span class="pill-off">Pausada</span>'}</td>
      <td><form method="post" action="/admin/ofertas/${d.id}/excluir" data-confirm="Excluir esta oferta?"><input type="hidden" name="_csrf" value="__CSRF__"><button class="link-btn danger" type="submit">Excluir</button></form></td>
    </tr>`).join('') || '<tr><td colspan="7" class="muted">Nenhuma oferta ainda.</td></tr>'}</tbody>
  </table>`;
  return { body, active: '/admin/ofertas' };
}

function dealFormPage({ deal, cats, errors, isNew }) {
  const d = deal || { title: '', price: '', old_price: '', coupon: '', affiliate_url: '', source_url: '', store_name: 'Amazon', description: '', active: 1, featured: 0, category_id: '' };
  const body = `
  <div class="page-head"><h1>${isNew ? 'Nova oferta' : 'Editar oferta'}</h1></div>
  ${errors && errors.length ? `<div class="flash flash-error">${errors.map(esc).join('<br>')}</div>` : ''}
  <form method="post" class="admin-form" action="${isNew ? '/admin/ofertas/nova' : `/admin/ofertas/${d.id}`}">
    <input type="hidden" name="_csrf" value="__CSRF__">
    <label>Título<input name="title" required value="${esc(d.title)}" maxlength="200"></label>
    <div class="form-row">
      <label>Preço atual (R$)<input name="price" type="number" step="0.01" min="0" required value="${esc(d.price)}"></label>
      <label>Preço antigo (R$, opcional)<input name="old_price" type="number" step="0.01" min="0" value="${esc(d.old_price || '')}"></label>
    </div>
    <div class="form-row">
      <label>Categoria<select name="category_id"><option value="">—</option>${cats.map((c) => `<option value="${c.id}" ${String(d.category_id) === String(c.id) ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('')}</select></label>
      <label>Loja<input name="store_name" value="${esc(d.store_name || 'Amazon')}" list="store-list"><datalist id="store-list"><option value="Amazon"></datalist></label>
    </div>
    <label>Link de afiliado (sua URL completa com a tag de afiliado)<input name="affiliate_url" type="url" required value="${esc(d.affiliate_url)}" placeholder="https://www.amazon.com.br/dp/XXXX?tag=seumarcador-20"></label>
    <label>Link original do produto (opcional, referência)<input name="source_url" type="url" value="${esc(d.source_url || '')}"></label>
    <div class="form-row">
      <label>Cupom (opcional)<input name="coupon" value="${esc(d.coupon || '')}" maxlength="60"></label>
      <label>Imagem (URL, opcional)<input name="image_url" value="${esc(d.image_url || '')}" id="img-url"></label>
    </div>
    <img id="img-preview" src="${esc(d.image_url || '')}" class="${d.image_url ? '' : 'hidden'}" alt="pré-visualização">
    <label>Descrição (opcional)<textarea name="description" rows="4" maxlength="2000">${esc(d.description || '')}</textarea></label>
    <div class="form-row checks">
      <label class="check"><input type="checkbox" name="active" ${d.active ? 'checked' : ''}> Ativa (visível no site)</label>
      <label class="check"><input type="checkbox" name="featured" ${d.featured ? 'checked' : ''}> Destacar na home</label>
    </div>
    <button class="btn btn-buy" type="submit">Salvar</button>
  </form>`;
  return { body, active: '/admin/ofertas' };
}

function categoriesPage({ cats, counts }) {
  const body = `
  <div class="page-head"><h1>Categorias</h1></div>
  <form method="post" class="admin-form inline-form" action="/admin/categorias">
    <input type="hidden" name="_csrf" value="__CSRF__">
    <input name="name" placeholder="Nome da categoria" required maxlength="80">
    <input name="emoji" placeholder="Emoji" maxlength="8" value="🏷️" style="width:70px">
    <button class="btn btn-sm" type="submit">Adicionar</button>
  </form>
  <table class="admin-table">
    <thead><tr><th>Categoria</th><th>Ofertas</th><th></th></tr></thead>
    <tbody>${cats.map((c) => `<tr>
      <td>${c.emoji} ${esc(c.name)}</td>
      <td>${counts[c.id] || 0}</td>
      <td><form method="post" action="/admin/categorias/${c.id}/excluir" data-confirm="Excluir categoria?"><input type="hidden" name="_csrf" value="__CSRF__"><button class="link-btn danger" type="submit">Excluir</button></form></td>
    </tr>`).join('') || '<tr><td colspan="3" class="muted">Nenhuma categoria.</td></tr>'}</tbody>
  </table>`;
  return { body, active: '/admin/categorias' };
}

function partnerBannersPage({ banners }) {
  const body = `
  <div class="page-head"><h1>Publicidade de parceiros</h1></div>
  <p class="muted">Aqui ficam os banners de lojas, comércios, sites, plataformas e sistemas parceiros que você aceitar anunciar dentro do Clickbaixo. Eles aparecem na vitrine pública em <code>/publicidade</code>, que já vem com os nossos próprios espaços de publicidade (as tags configuradas em Configurações) no topo e no final — isso é automático, você não precisa fazer nada.</p>
  <form method="post" class="admin-form" action="/admin/publicidade">
    <input type="hidden" name="_csrf" value="__CSRF__">
    <label>Nome do anunciante (loja, site, plataforma...)<input name="advertiser" required maxlength="120" placeholder="Ex: Loja da Maria, Sistema XPTO"></label>
    <label>Imagem do banner (URL)<input name="image_url" type="url" required placeholder="https://..."></label>
    <label>Link de destino (para onde o clique leva)<input name="link_url" type="url" required placeholder="https://..."></label>
    <label>Ordem de exibição (opcional, menor aparece primeiro)<input name="sort_order" type="number" value="0"></label>
    <button class="btn btn-buy" type="submit">Adicionar banner</button>
  </form>
  <table class="admin-table">
    <thead><tr><th></th><th>Anunciante</th><th>Cliques</th><th>Status</th><th></th></tr></thead>
    <tbody>${banners.map((b) => `<tr>
      <td><img class="thumb" src="${esc(b.image_url)}" alt=""></td>
      <td><a href="${esc(b.link_url)}" target="_blank" rel="noopener">${esc(b.advertiser)}</a></td>
      <td>${b.clicks}</td>
      <td>${b.active ? '<span class="pill-ok">Ativo</span>' : '<span class="pill-off">Pausado</span>'}</td>
      <td style="display:flex;gap:10px">
        <form method="post" action="/admin/publicidade/${b.id}/alternar"><input type="hidden" name="_csrf" value="__CSRF__"><button class="link-btn" type="submit">${b.active ? 'Pausar' : 'Ativar'}</button></form>
        <form method="post" action="/admin/publicidade/${b.id}/excluir" data-confirm="Excluir este banner?"><input type="hidden" name="_csrf" value="__CSRF__"><button class="link-btn danger" type="submit">Excluir</button></form>
      </td>
    </tr>`).join('') || '<tr><td colspan="5" class="muted">Nenhum banner de parceiro ainda.</td></tr>'}</tbody>
  </table>`;
  return { body, active: '/admin/publicidade' };
}

function settingsPage({ s, errors }) {
  const body = `
  <h1>Configurações</h1>
  ${errors && errors.length ? `<div class="flash flash-error">${errors.map(esc).join('<br>')}</div>` : ''}
  <form method="post" class="admin-form" action="/admin/config">
    <input type="hidden" name="_csrf" value="__CSRF__">
    <h2>Site</h2>
    <div class="form-row">
      <label>Nome do site<input name="site_name" value="${esc(s.site_name)}"></label>
      <label>Slogan<input name="site_tagline" value="${esc(s.site_tagline)}"></label>
    </div>
    <label>URL do site (ex: https://clickbaixo.com.br)<input name="site_url" value="${esc(s.site_url)}"></label>
    <label>E-mail de contato<input name="contact_email" type="email" value="${esc(s.contact_email)}"></label>

    <h2>Afiliado Amazon</h2>
    <p class="muted">Sua tag de associado da Amazon (ex: <code>seumarcador-20</code>). Cole sempre o link completo com <code>?tag=</code> ao criar cada oferta — este campo é só uma referência para você lembrar qual tag usar.</p>
    <label>Minha tag de afiliado Amazon<input name="amazon_tag" value="${esc(s.amazon_tag)}" placeholder="seumarcador-20"></label>

    <h2>Canais de divulgação</h2>
    <div class="form-row">
      <label>WhatsApp (link)<input name="whatsapp_url" value="${esc(s.whatsapp_url)}" placeholder="https://wa.me/55..."></label>
      <label>Telegram (link)<input name="telegram_url" value="${esc(s.telegram_url)}"></label>
      <label>Instagram (link)<input name="instagram_url" value="${esc(s.instagram_url)}"></label>
    </div>

    <h2>Banners de anúncio</h2>
    <p class="muted">Cole aqui o código (HTML/JS) de qualquer rede de anúncios ou tráfego pago — AdSense, Monetizze, Taboola, um banner de um anunciante direto, etc. Não precisa ser só Amazon: isso aparece junto das ofertas, como uma fonte extra de receita, sem redirecionar o visitante para fora do fluxo de compra.</p>
    <label>Banner no topo do site (aparece em todas as páginas)<textarea name="ad_top" rows="3">${esc(s.ad_top)}</textarea></label>
    <label>Banner estratégico (home, ofertas, categorias, cupons, busca com IA, institucionais)<textarea name="ad_between" rows="3">${esc(s.ad_between)}</textarea></label>
    <label>Banner na página da oferta<textarea name="ad_deal" rows="3">${esc(s.ad_deal)}</textarea></label>
    <p class="muted small">Esses espaços aparecem nos lugares de mais tráfego do site — logo abaixo da busca por IA na home, no meio das listagens de ofertas/categorias/cupons e nas páginas institucionais. Pode usar o banner de uma rede de tráfego pago (como o que você já configurou) ou vender diretamente para um anunciante/empresa que queira divulgar aqui.</p>
    <label>Cliente do Google AdSense (ca-pub-...)<input name="adsense_client" value="${esc(s.adsense_client)}"></label>

    <h2>Rastreamento</h2>
    <div class="form-row">
      <label>Google Analytics (ID)<input name="ga_id" value="${esc(s.ga_id)}" placeholder="G-XXXXXXX"></label>
    </div>
    <label>Código extra no &lt;head&gt; (opcional, avançado)<textarea name="head_code" rows="3">${esc(s.head_code)}</textarea></label>

    <h2>Textos das páginas</h2>
    <label>Aviso de afiliados (rodapé)<textarea name="affiliate_notice" rows="3">${esc(s.affiliate_notice)}</textarea></label>
    <label>Sobre<textarea name="page_sobre" rows="4">${esc(s.page_sobre)}</textarea></label>
    <label>Privacidade<textarea name="page_privacidade" rows="6">${esc(s.page_privacidade)}</textarea></label>
    <label>Termos de uso<textarea name="page_termos" rows="6">${esc(s.page_termos)}</textarea></label>
    <label>Texto final do rodapé<input name="footer_text" value="${esc(s.footer_text)}"></label>

    <button class="btn btn-buy" type="submit">Salvar configurações</button>
  </form>
  <h2>Trocar senha</h2>
  <form method="post" class="admin-form" action="/admin/senha">
    <input type="hidden" name="_csrf" value="__CSRF__">
    <label>Nova senha<input name="password" type="password" minlength="8" required></label>
    <button class="btn btn-sm" type="submit">Trocar senha</button>
  </form>`;
  return { body, active: '/admin/config' };
}

module.exports = { NAV, adminLayout, loginPage, dashboardPage, visitorsPage, dealsListPage, dealFormPage, categoriesPage, partnerBannersPage, settingsPage };
