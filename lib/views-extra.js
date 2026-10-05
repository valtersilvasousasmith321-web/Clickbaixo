'use strict';
const { esc } = require('./util');
const V = require('./views');
const I = require('./icons');

function advertisePage({ s, cats, base }) {
  const body = `
  <section class="wrap static-page">
    <h1>${I.icon('megaphone', 24)} Anuncie aqui</h1>
    <p class="muted">Tem um banner de uma rede de anúncios ou um produto pra divulgar? Fale com a gente.</p>
    <form id="lead-form" class="lead-form" novalidate>
      <label>Nome<input name="name" required maxlength="120"></label>
      <label>E-mail<input name="email" type="email" required maxlength="120"></label>
      <label>Telefone/WhatsApp<input name="phone" maxlength="40"></label>
      <label>Mensagem<textarea name="message" rows="4" maxlength="2000"></textarea></label>
      <button class="btn btn-buy" type="submit">Enviar</button>
    </form>
    <p class="sub-msg" id="lead-msg" role="status"></p>
  </section>
  ${V.ad(s.ad_between, 'ad-between wrap')}`;
  return V.layout({ s, cats, base, title: 'Anuncie aqui', body, path: '/anuncie' });
}

function howItWorksPage({ s, cats, base, stores }) {
  const STEPS = [
    ['Garimpamos ofertas', 'Selecionamos promoções reais de preço, não só anúncios comuns.'],
    ['Conferimos o preço', 'Comparamos com o histórico antes de publicar — nada de "desconto falso".'],
    ['Você compra direto na loja', 'O clique te leva para a loja oficial (hoje, Amazon) para finalizar a compra com segurança.'],
    ['A gente ganha uma comissão', 'Por indicar a venda, recebemos uma pequena comissão — sem custo extra pra você.'],
  ];
  const body = `
  <section class="wrap static-page">
    <h1>Como funciona o ${esc(s.site_name)}</h1>
    <div class="steps-grid">${STEPS.map(([t, d], i) => `<div class="step-card"><span class="step-n">${i + 1}</span><h3>${esc(t)}</h3><p class="muted">${esc(d)}</p></div>`).join('')}</div>
    <h2>Onde compramos hoje</h2>
    <p class="store-chip-static">Amazon</p>
    <h2>O que não fazemos</h2>
    <ul class="dont-list">
      <li>Não inventamos desconto: todo preço é conferido antes de publicar.</li>
      <li>Não escondemos que ganhamos comissão — isso está em todas as páginas de oferta.</li>
      <li>Não vendemos seu e-mail nem seus dados para terceiros.</li>
    </ul>
  </section>
  ${V.ad(s.ad_between, 'ad-between wrap')}`;
  return V.layout({ s, cats, base, title: 'Como funciona', body, path: '/como-funciona' });
}

function advertisingShowcasePage({ s, cats, base, banners }) {
  const list = banners || [];
  const body = `
  <section class="wrap listing-head"><h1>${I.icon('megaphone', 24)} Publicidade</h1></section>
  <section class="wrap">
    <p class="muted" style="max-width:720px">Espaço dedicado a banners de lojas, comércios, sites, plataformas e sistemas parceiros que anunciam aqui dentro do ${esc(s.site_name)}. Quer colocar o seu banner nessa vitrine? <a href="/anuncie" style="color:var(--blue);font-weight:600">Fale com a gente</a>.</p>
  </section>
  ${V.ad(s.ad_between, 'ad-between wrap')}
  <section class="wrap">
    ${list.length ? `<div class="banner-grid">${list.map(bannerCard).join('')}</div>` : `<div class="empty-state"><p>${I.icon('megaphone', 28)}</p><h3>Ainda não temos banners de parceiros</h3><p class="muted">Em breve essa vitrine vai mostrar lojas, sites e plataformas parceiras.</p></div>`}
  </section>
  ${V.ad(s.ad_between, 'ad-between wrap')}
  `;
  return V.layout({ s, cats, base, title: 'Publicidade', body, path: '/publicidade' });
}

function bannerCard(b) {
  return `<a class="banner-card" href="/pub/${b.id}" target="_blank" rel="nofollow sponsored noopener">
    <img src="${esc(b.image_url)}" alt="${esc(b.advertiser)}" loading="lazy">
    <span class="banner-card-name">${esc(b.advertiser)}</span>
  </a>`;
}

function tipGroup(icon, title, items) {
  return `<div class="tip-group">
    <h2>${I.icon(icon, 20)} ${esc(title)}</h2>
    <ul class="tip-list">${items.map((it) => `<li>${it}</li>`).join('')}</ul>
  </div>`;
}

function buyingTipsPage({ s, cats, base }) {
  const body = `
  <section class="wrap listing-head"><h1>${I.icon('bulb', 24)} Dicas de compra na internet</h1></section>
  <section class="wrap static-page">
    <p class="muted" style="max-width:720px">Reunimos aqui orientações práticas pra você comprar online com mais segurança e sem dor de cabeça — desde o básico até comprar em lojas de fora do Brasil.</p>
  </section>
  ${V.ad(s.ad_between, 'ad-between wrap')}
  <section class="wrap static-page tip-sections">
    ${tipGroup('shield', 'Como comprar com segurança na internet', [
      'Prefira pagar no cartão de crédito ou em plataformas com proteção ao comprador — é mais fácil contestar uma compra do que com Pix ou boleto.',
      'Desconfie de preços muito abaixo do mercado: pesquise o histórico do produto antes de se empolgar com um "desconto".',
      'Só digite dados de cartão em páginas com cadeado (https://) e no domínio oficial da loja — confira a URL com atenção.',
      'Guarde prints da página do produto, do preço e da confirmação do pedido até o item chegar.',
    ])}
    ${tipGroup('globe', 'Como comprar em lojas internacionais', [
      'Verifique se a loja envia pro Brasil e o prazo real de entrega — pode levar semanas, não dias.',
      'Compras internacionais podem ter imposto de importação na chegada; pesquise a regra atual antes de fechar o pedido.',
      'Prefira sites que mostram o preço já em reais ou com conversão clara, pra não ter surpresa na fatura do cartão.',
      'Anote o código de rastreio internacional assim que ele for emitido — a entrega passa pela alfândega antes dos Correios.',
    ])}
    ${tipGroup('package', 'Como fazer o pedido direito', [
      'Confira nome, endereço e CPF antes de confirmar — erro de cadastro é a causa mais comum de pedido extraviado.',
      'Leia a descrição completa do produto (tamanho, voltagem, cor, modelo) antes de comprar, não só o título.',
      'Sempre que possível, acompanhe o rastreio e guarde o número do pedido até a entrega ser confirmada.',
      'Ao receber, confira o produto na hora — se vier diferente do anunciado, acione a loja ou a plataforma de pagamento o quanto antes.',
    ])}
    ${tipGroup('alert', 'Como não cair em golpe', [
      'Golpista cria senso de urgência ("só hoje", "últimas unidades") pra você não pesquisar — pare e pesquise mesmo assim.',
      'Nunca pague fora do site oficial pra "garantir" um desconto a mais, mesmo que peçam isso no WhatsApp ou Instagram.',
      'Anúncio sem CNPJ, sem endereço e só com Pix como forma de pagamento merece desconfiança redobrada.',
      'Se a loja te pressiona a sair do app/site oficial pra "resolver mais rápido" no WhatsApp, isso é sinal de alerta.',
    ])}
    ${tipGroup('lock', 'Como pesquisar se uma plataforma é segura', [
      'Procure o nome da loja + "reclame aqui" ou "golpe" antes de comprar pela primeira vez.',
      'Confira se a empresa tem CNPJ ativo e informações de contato reais (não só uma rede social).',
      'Veja a idade do domínio e se o site tem política de troca/devolução e termos de uso publicados.',
      'Comentários e avaliações recentes (não só os antigos) dizem mais sobre como a loja está atendendo agora.',
    ])}
  </section>
  ${V.ad(s.ad_between, 'ad-between wrap')}`;
  return V.layout({ s, cats, base, title: 'Dicas de compra na internet', body, path: '/dicas-de-compra' });
}

module.exports = { advertisePage, howItWorksPage, advertisingShowcasePage, buyingTipsPage };
