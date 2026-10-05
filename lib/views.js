'use strict';
const { esc, money, discountPct, timeAgo } = require('./util');
const I = require('./icons');

const BUILD = Date.now();

// Link de afiliado pra página oficial de "ofertas do dia" da Amazon (não é uma oferta
// específica cadastrada no painel — é um banner fixo convidando a navegar direto na Amazon).
const AMAZON_DEALS_URL = 'https://www.amazon.com.br/s?srs=121431228011&bbn=121431228011&rh=p_n_deal_type%3A23565493011&dc=&qid=1791088957&rnid=23565491011&linkCode=ll2&tag=valterviagens-20&linkId=06fce57987fb6f0b497632114f878aec&ref_=as_li_ss_tl';

function ad(code, cls) {
  if (!code || !code.trim()) return '';
  return `<div class="ad-slot ${cls}">${code}</div>`;
}

function icon(name, size) { return I.icon(name, size); }

function a11yWidget() {
  return `<div class="a11y-widget">
  <button id="a11yToggle" class="a11y-fab" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="a11yPanel" aria-label="Acessibilidade e aparência">${icon('filter', 20)}</button>
  <div id="a11yPanel" class="a11y-panel" hidden role="menu" aria-label="Opções de acessibilidade">
    <p class="a11y-title">Acessibilidade</p>
    <button type="button" id="a11yDark" class="a11y-item" role="menuitemcheckbox" aria-checked="false">
      <span class="a11y-ic">${icon('moon', 18)}</span> Modo escuro
      <span class="a11y-switch" aria-hidden="true"></span>
    </button>
    <button type="button" id="a11yContrast" class="a11y-item" role="menuitemcheckbox" aria-checked="false">
      <span class="a11y-ic">${icon('contrast', 18)}</span> Alto contraste
      <span class="a11y-switch" aria-hidden="true"></span>
    </button>
    <div class="a11y-row">
      <span>Tamanho do texto</span>
      <div class="a11y-fontctl">
        <button type="button" id="a11yFontDec" aria-label="Diminuir o tamanho do texto">A-</button>
        <button type="button" id="a11yFontReset" aria-label="Tamanho padrão do texto">A</button>
        <button type="button" id="a11yFontInc" aria-label="Aumentar o tamanho do texto">A+</button>
      </div>
    </div>
  </div>
</div>`;
}

function logoMark(size = 26) {
  const r = Math.round(size * 0.22);
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <radialGradient id="bgGrad${size}" cx="30%" cy="18%" r="85%">
        <stop offset="0%" stop-color="#1c3570"/><stop offset="46%" stop-color="#0f1c3f"/><stop offset="100%" stop-color="#080f24"/>
      </radialGradient>
      <linearGradient id="arrowGrad${size}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffe066"/><stop offset="100%" stop-color="#ffb300"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="${r}" fill="url(#bgGrad${size})"/>
    <path d="M38 8 H62 V46 H78 L50 80 L22 46 H38 Z" fill="url(#arrowGrad${size})"/>
  </svg>`;
}

function layout({ s, cats, base, title, description, body, path = '/', noindex = false }) {
  const siteTitle = title ? `${title} · ${esc(s.site_name)}` : `${esc(s.site_name)} — ${esc(s.site_tagline)}`;
  const desc = esc(description || s.site_tagline);
  const url = (s.site_url || '').replace(/\/$/, '') + path;
  const catsNav = (cats || []).map((c) => `<a href="/categoria/${esc(c.slug)}">${I.catIcon(c)} ${esc(c.name)}</a>`).join('');
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
<title>${siteTitle}</title>
<meta name="description" content="${desc}">
${noindex ? '<meta name="robots" content="noindex,follow">' : ''}
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${siteTitle}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${(s.site_url || '').replace(/\/$/, '')}/static/og.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0d1526">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css?v=${BUILD}">
${s.ga_id ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(s.ga_id)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${esc(s.ga_id)}');</script>` : ''}
${s.adsense_client ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(s.adsense_client)}" crossorigin="anonymous"></script>` : ''}
${s.head_code || ''}
</head>
<body>
<a class="skip-link" href="#mainContent">Pular para o conteúdo</a>
<div class="cookie-banner" id="cookieBanner" hidden>
  <p>Usamos cookies para melhorar sua experiência e medir resultados de publicidade.</p>
  <button class="btn btn-sm" id="cookieOk">Entendi</button>
</div>
${ad(s.ad_top, 'ad-top')}
<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="/">${logoMark(26)} <span>${esc(s.site_name)}</span></a>
    <form class="search" action="/buscar" method="get">
      <input type="search" name="q" placeholder="Buscar ofertas..." aria-label="Buscar">
      <button type="submit">${icon('search', 18)}</button>
    </form>
    <nav class="util-nav">
      <a href="/ofertas">Ofertas</a>
      <a href="/cupons">Cupons</a>
      ${s.whatsapp_url ? `<a class="btn btn-wa" href="${esc(s.whatsapp_url)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
      <button id="pwaInstallBtn" class="pwa-install-btn" type="button" hidden title="Instalar o ${esc(s.site_name)}" aria-label="Instalar o ${esc(s.site_name)}">${icon('install', 18)}</button>
    </nav>
  </div>
  <div class="cat-nav wrap">${catsNav}</div>
  ${ad(s.ad_between, 'ad-between wrap header-ad')}
</header>
<main id="mainContent" tabindex="-1">
${body}
</main>
<footer class="site-footer">
  <div class="wrap foot-grid">
    <div>
      <a class="brand" href="/">${logoMark(22)} <span>${esc(s.site_name)}</span></a>
      <p class="muted">${esc(s.site_tagline)}</p>
      <p class="muted small">Afiliados ativos: Amazon.</p>
    </div>
    <div>
      <h4>Explorar</h4>
      <a href="/">Início</a>
      <a href="/cupons">Cupons</a>
      <a href="/buscar">Buscar</a>
      <a href="/publicidade">Publicidade</a>
    </div>
    <div>
      <h4>Institucional</h4>
      <a href="/como-funciona">Como funciona</a>
      <a href="/sobre">Sobre</a>
      <a href="/privacidade">Privacidade</a>
      <a href="/termos">Termos de uso</a>
      <a href="/anuncie">Anuncie aqui</a>
    </div>
    <div>
      <h4>Siga</h4>
      ${s.instagram_url ? `<a href="${esc(s.instagram_url)}" target="_blank" rel="noopener">Instagram</a>` : ''}
      ${s.telegram_url ? `<a href="${esc(s.telegram_url)}" target="_blank" rel="noopener">Telegram</a>` : ''}
      ${s.whatsapp_url ? `<a href="${esc(s.whatsapp_url)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
      ${s.contact_email ? `<a href="mailto:${esc(s.contact_email)}">${esc(s.contact_email)}</a>` : ''}
    </div>
  </div>
  <div class="wrap foot-legal">
    <details>
      <summary>Aviso de afiliados</summary>
      <p>${esc(s.affiliate_notice)}</p>
      ${ad(s.ad_between, 'ad-between')}
    </details>
    <p class="muted small">${esc(s.footer_text || `© ${new Date().getFullYear()} ${s.site_name}. Todos os direitos reservados.`)}</p>
  </div>
</footer>
${a11yWidget()}
<script src="/app.js?v=${BUILD}" defer></script>
<script src="/a11y.js?v=${BUILD}" defer></script>
${s.head_code ? `<script src="/social-bar-cycle.js?v=${BUILD}" defer></script>` : ''}
</body>
</html>`;
}

function showPrice() { return true; }

function priceHTML(d) {
  const pct = discountPct(d.price, d.old_price);
  return `<div class="price-row">
    ${d.old_price > d.price ? `<span class="old-price">${money(d.old_price)}</span>` : ''}
    <span class="price">${money(d.price)}</span>
    ${pct > 0 ? `<span class="pct">-${pct}%</span>` : ''}
  </div>`;
}

function imgSrc(d) {
  if (d.image_url) return esc(d.image_url);
  const kind = d.category_emoji ? I.kindOf({ emoji: d.category_emoji, name: d.category_name }) : 'tag';
  return `/ph.svg?kind=${kind}`;
}

function card(d) {
  return `<article class="card">
    <a class="card-img" href="/oferta/${esc(d.slug)}">
      <img src="${imgSrc(d)}" alt="${esc(d.title)}" loading="lazy" width="300" height="300">
      ${discountPct(d.price, d.old_price) > 0 ? `<span class="badge-pct">-${discountPct(d.price, d.old_price)}%</span>` : ''}
      ${d.coupon ? `<span class="badge-cupom">Cupom</span>` : ''}
    </a>
    <div class="card-body">
      <p class="card-store">${esc(d.store_name || 'Amazon')}</p>
      <h3 class="card-title"><a href="/oferta/${esc(d.slug)}">${esc(d.title)}</a></h3>
      ${priceHTML(d)}
      <a class="btn btn-buy" href="/go/${d.id}" target="_blank" rel="nofollow sponsored noopener">Ver oferta</a>
    </div>
  </article>`;
}

function grid(deals) {
  if (!deals.length) return emptyState();
  return `<div class="grid">${deals.map(card).join('')}</div>`;
}

function emptyState() {
  return `<div class="empty-state">
    <p>${icon('search', 28)}</p>
    <h3>Nenhuma oferta encontrada</h3>
    <p class="muted">Tente outra categoria ou volte mais tarde — atualizamos sempre.</p>
  </div>`;
}

function pagination(page, totalPages, baseUrl) {
  if (totalPages <= 1) return '';
  let out = '<nav class="pagination">';
  if (page > 1) out += `<a href="${baseUrl}&page=${page - 1}">${icon('arrow', 16)} Anterior</a>`;
  out += `<span>Página ${page} de ${totalPages}</span>`;
  if (page < totalPages) out += `<a href="${baseUrl}&page=${page + 1}">Próxima</a>`;
  out += '</nav>';
  return out;
}

function subscribeBlock() {
  return `<section class="subscribe-block">
    <div>
      <h2>Receba as melhores ofertas no seu e-mail</h2>
      <p class="muted">Sem spam. Só promoção de verdade, direto da Amazon.</p>
    </div>
    <form id="subscribe-form" class="subscribe-form" novalidate>
      <input type="email" name="email" placeholder="seu@email.com" required maxlength="120">
      <button class="btn btn-buy" type="submit">Quero receber</button>
    </form>
    <p class="sub-msg" id="subscribe-msg" role="status"></p>
  </section>`;
}

function homePage({ s, cats, base, configured }) {
  const EXPLORE = [
    ['tag', 'Catálogo de ofertas', 'Veja todas as promoções conferidas, por categoria ou pelas mais recentes.', '/ofertas'],
    ['bolt', 'Cupons de desconto', 'Cupons ativos agora pra economizar ainda mais na hora de comprar.', '/cupons'],
    ['shield', 'Como funciona', 'Entenda como garimpamos e conferimos cada oferta antes de publicar.', '/como-funciona'],
    ['megaphone', 'Publicidade', 'Banners de lojas, sites e plataformas parceiras anunciando aqui dentro.', '/publicidade'],
    ['external', 'Anuncie aqui', 'Tem uma loja ou produto? Fale com a gente e anuncie no Clickbaixo.', '/anuncie'],
    ['info', 'Sobre o Clickbaixo', 'Conheça a proposta do site e quem está por trás dele.', '/sobre'],
  ];
  const body = `
  <section class="wrap home-search-hero">
    ${I.heroDecoCluster()}
    <h1>${esc(s.site_name)}</h1>
    <p class="muted home-search-sub">Diga o que você quer comprar. A gente busca ao vivo e te leva direto pro menor preço.</p>
    ${!configured ? `<div class="ai-disabled">A busca inteligente está indisponível no momento. Volte em breve.</div>` : `
    <form id="ai-search-form" class="ai-search-form ai-search-form-lg" novalidate>
      <input type="text" name="q" placeholder="Ex: smart tv 50 polegadas 4k" required maxlength="140" autofocus>
      <button class="btn btn-buy" type="submit">${icon('search', 18)} Buscar</button>
    </form>
    <div id="ai-search-result" class="ai-search-result" aria-live="polite"></div>
    <template id="ai-ad-template">${ad(s.ad_between, 'ad-between')}</template>
    <p class="muted small">Resultado gerado por inteligência artificial com busca na web — os preços são uma referência do momento da busca; confirme sempre na loja antes de comprar.</p>
    `}
  </section>
  ${ad(s.ad_between, 'ad-between wrap')}
  <section class="wrap home-explore">
    <h2 class="section-title">Explore o Clickbaixo</h2>
    <div class="explore-grid">
      ${EXPLORE.map(([ic, title, desc, href]) => `<a class="explore-card" href="${href}">
        <span class="explore-ic">${icon(ic, 22)}</span>
        <h3>${esc(title)}</h3>
        <p class="muted">${esc(desc)}</p>
      </a>`).join('')}
    </div>
  </section>
  ${ad(s.ad_between, 'ad-between wrap')}
  <section class="wrap">
    <a class="tips-banner" href="/dicas-de-compra">
      <span class="tips-banner-ic">${icon('bulb', 30)}</span>
      <span class="tips-banner-text">
        <h2>Dicas de compra na internet</h2>
        <p>Como comprar com segurança, como importar de fora, como pedir direito e não cair em golpe. Tudo o que você precisa saber antes de finalizar uma compra online.</p>
      </span>
      <span class="btn btn-buy tips-banner-btn">Ver as dicas ${icon('arrow', 16)}</span>
    </a>
  </section>
  <section class="wrap">
    <a class="deals-banner" href="${esc(AMAZON_DEALS_URL)}" target="_blank" rel="nofollow sponsored noopener">
      <span class="deals-banner-ic">${icon('tag', 30)}</span>
      <span class="deals-banner-text">
        <h2>Ver todos os descontos da Amazon</h2>
        <p>A página oficial de ofertas do dia da Amazon, atualizada direto por eles — todas as categorias, tudo em promoção agora.</p>
      </span>
      <span class="btn btn-buy deals-banner-btn">Ver descontos ${icon('external', 16)}</span>
    </a>
  </section>
  ${ad(s.ad_between, 'ad-between wrap')}
  `;
  return layout({ s, cats, base, body, path: '/' });
}

function categoryPage({ s, cats, base, cat, deals, page, totalPages, order }) {
  const body = `
  <section class="wrap listing-head">
    <h1>${I.catIcon(cat, 26)} ${esc(cat.name)}</h1>
    ${sortNav(order, `/categoria/${esc(cat.slug)}?`)}
  </section>
  <section class="wrap">${grid(deals)}
  ${pagination(page, totalPages, `/categoria/${esc(cat.slug)}?order=${order}`)}</section>
  ${ad(s.ad_between, 'ad-between wrap')}
  `;
  return layout({ s, cats, base, title: cat.name, body, path: `/categoria/${cat.slug}` });
}

function sortNav(order, baseQs) {
  const opts = [['recent', 'Mais recentes'], ['discount', 'Maior desconto'], ['price_asc', 'Menor preço'], ['price_desc', 'Maior preço']];
  return `<div class="sort-nav">${opts.map(([v, label]) => `<a class="${order === v ? 'active' : ''}" href="${baseQs}order=${v}">${label}</a>`).join('')}</div>`;
}

function offersPage({ s, cats, base, deals, page, totalPages, order }) {
  const body = `
  <section class="wrap listing-head">
    <h1>Todas as ofertas</h1>
    ${sortNav(order, `/ofertas?`)}
  </section>
  <section class="wrap">${grid(deals)}
  ${pagination(page, totalPages, `/ofertas?order=${order}`)}</section>
  ${ad(s.ad_between, 'ad-between wrap')}
  `;
  return layout({ s, cats, base, title: 'Ofertas', body, path: '/ofertas' });
}

function searchPage({ s, cats, base, q, deals }) {
  const body = `
  <section class="wrap listing-head">
    <h1>Resultados para "${esc(q)}"</h1>
  </section>
  <section class="wrap">${grid(deals)}</section>
  ${ad(s.ad_between, 'ad-between wrap')}
  `;
  return layout({ s, cats, base, title: `Busca: ${q}`, body, path: '/buscar', noindex: true });
}

function couponsListing({ s, cats, base, deals }) {
  const mid = Math.ceil(deals.length / 2);
  const first = deals.slice(0, mid);
  const second = deals.slice(mid);
  const body = `
  <section class="wrap listing-head"><h1>${icon('tag', 24)} Cupons de desconto</h1></section>
  ${ad(s.ad_between, 'ad-between wrap')}
  <section class="wrap">${grid(first)}</section>
  ${second.length ? ad(s.ad_between, 'ad-between wrap') : ''}
  ${second.length ? `<section class="wrap">${grid(second)}</section>` : ''}
  ${ad(s.ad_between, 'ad-between wrap')}
  `;
  return layout({ s, cats, base, title: 'Cupons', body, path: '/cupons' });
}

function sparkline(history) {
  if (!history || history.length < 2) return '';
  const prices = history.map((h) => h.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const pts = history.map((h, i) => {
    const x = (i / (history.length - 1)) * 280;
    const y = 50 - ((h.price - min) / range) * 46 - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg class="sparkline" viewBox="0 0 280 50" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
}

function dealPage({ s, cats, base, d, related, history, live, waitingCount = 0 }) {
  const suggestTarget = Math.max(1, Math.round(d.price * 0.9));
  const alertBlock = `<section class="alert-box" id="alerta">
    <div class="alert-ic">${icon('bolt', 22)}</div>
    <div>
      <h2>Ainda não é a hora? A gente avisa.</h2>
      <p>Diga até quanto você pagaria. Quando o preço chegar lá (ou menos), você recebe um e-mail.${waitingCount ? ` <b>${waitingCount} ${waitingCount === 1 ? 'pessoa está' : 'pessoas estão'} esperando</b> esta oferta baixar.` : ''}</p>
      <form id="alert-form" class="alert-form" data-deal-id="${d.id}" novalidate>
        <label>Avisar quando custar até<div class="alert-price"><span>R$</span><input name="target_price" inputmode="decimal" required value="${suggestTarget}" aria-label="Preço-alvo"></div></label>
        <label>Seu e-mail<input name="email" type="email" required placeholder="voce@email.com" autocomplete="email" maxlength="120"></label>
        <button class="btn btn-buy" type="submit">Quero ser avisado</button>
      </form>
      <p class="sub-msg" id="alert-msg" role="status"></p>
    </div>
  </section>`;
  const body = `
  <section class="wrap deal-page">
    <nav class="breadcrumb"><a href="/">Início</a> / ${d.category_name ? `<a href="/categoria/${esc(d.category_slug)}">${esc(d.category_name)}</a> / ` : ''}${esc(d.title)}</nav>
    ${ad(s.ad_between, 'ad-between wrap')}
    <div class="deal-main">
      <div class="deal-img"><img src="${imgSrc(d)}" alt="${esc(d.title)}" width="480" height="480"></div>
      <div class="deal-info">
        <p class="card-store">${esc(d.store_name || 'Amazon')}</p>
        <h1>${esc(d.title)}</h1>
        ${priceHTML(d)}
        ${d.coupon ? `<p class="coupon-box">Cupom: <b>${esc(d.coupon)}</b></p>` : ''}
        <a class="btn btn-buy btn-lg" href="/go/${d.id}" target="_blank" rel="nofollow sponsored noopener">Ver oferta na ${esc(d.store_name || 'Amazon')}</a>
        ${sparkline(history) ? `<div class="price-hist"><h3>${icon('chart', 16)} Histórico de preço</h3>${sparkline(history)}</div>` : ''}
        ${d.description ? `<div class="deal-desc">${esc(d.description).replace(/\n/g, '<br>')}</div>` : ''}
        ${ad(s.ad_deal, 'ad-deal')}
      </div>
    </div>
    ${ad(s.ad_between, 'ad-between wrap')}
    ${alertBlock}
    ${related.length ? `<section class="deal-more"><h2 class="section-title">Você também pode gostar</h2><div class="grid">${related.map(card).join('')}</div></section>` : ''}
    ${ad(s.ad_between, 'ad-between wrap')}
  </section>
  `;
  return layout({ s, cats, base, title: d.title, description: d.description, body, path: `/oferta/${d.slug}` });
}

function staticPage({ s, cats, base, title, html, path }) {
  const body = `<section class="wrap static-page"><h1>${esc(title)}</h1><div class="prose">${html}</div></section>
  ${ad(s.ad_between, 'ad-between wrap')}`;
  return layout({ s, cats, base, title, body, path });
}

function notFoundPage({ s, cats, base }) {
  const body = `<section class="wrap static-page not-found">
    <h1>404</h1>
    <p>Essa página não existe ou a oferta já saiu do ar.</p>
    <a class="btn btn-buy" href="/">Voltar para o início</a>
  </section>`;
  return layout({ s, cats, base, title: 'Página não encontrada', body, path: '/404', noindex: true });
}

module.exports = {
  BUILD, layout, card, grid, ad, icon, logoMark, showPrice, emptyState, subscribeBlock, imgSrc, priceHTML,
  pagination, sortNav, homePage, categoryPage, offersPage, searchPage, couponsListing, dealPage,
  staticPage, notFoundPage, sparkline, a11yWidget,
};
