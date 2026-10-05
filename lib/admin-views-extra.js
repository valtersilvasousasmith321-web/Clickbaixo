'use strict';
const { esc, money, timeAgo } = require('./util');
const I = require('./icons');

function alertsPage({ byDeal, mailConfigured }) {
  const body = `
  <h1>Alertas de preço</h1>
  ${!mailConfigured ? `<div class="flash flash-warn">O envio de e-mail não está configurado (variáveis SMTP_*). Os alertas continuam sendo registrados e marcados como "avisado" aqui no painel, mas o e-mail não sai até você configurar o SMTP no .env.</div>` : ''}
  ${byDeal.length ? byDeal.map((d) => `<details class="alert-group" ${d.pending > 0 ? 'open' : ''}>
    <summary>${esc(d.title)} — ${d.pending > 0 ? `<span class="pill-off">${d.pending} pendente(s)</span>` : '<span class="pill-ok">todos cumpridos</span>'} <span class="muted">preço atual ${money(d.price)}</span></summary>
    <p><a href="/admin/ofertas/${d.deal_id}">Editar oferta</a></p>
  </details>`).join('') : '<p class="muted">Nenhum alerta cadastrado ainda.</p>'}`;
  return { body, active: '/admin/alertas' };
}

function leadsPage({ leads }) {
  const STATUS = ['novo', 'em contato', 'fechado', 'descartado'];
  const body = `
  <h1>Contatos (página Anuncie aqui)</h1>
  <table class="admin-table">
    <thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Mensagem</th><th>Status</th><th>Quando</th></tr></thead>
    <tbody>${leads.map((l) => `<tr>
      <td>${esc(l.name)}</td><td>${esc(l.email)}</td><td>${esc(l.phone)}</td>
      <td class="msg-cell">${esc(l.message)}</td>
      <td><form method="post" action="/admin/contatos/${l.id}/status" data-autosubmit><input type="hidden" name="_csrf" value="__CSRF__"><select name="status">${STATUS.map((s) => `<option value="${s}" ${l.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></form></td>
      <td class="muted">${timeAgo(l.created_at)}</td>
    </tr>`).join('') || '<tr><td colspan="6" class="muted">Nenhum contato ainda.</td></tr>'}</tbody>
  </table>`;
  return { body, active: '/admin/contatos' };
}

function subscribersPage({ subs }) {
  const body = `
  <h1>Inscritos na newsletter</h1>
  <table class="admin-table"><thead><tr><th>E-mail</th><th>Desde</th></tr></thead>
  <tbody>${subs.map((s) => `<tr><td>${esc(s.email)}</td><td class="muted">${timeAgo(s.created_at)}</td></tr>`).join('') || '<tr><td colspan="2" class="muted">Ninguém inscrito ainda.</td></tr>'}</tbody></table>`;
  return { body, active: '/admin/inscritos' };
}

function launchPage({ checks }) {
  const essential = checks.filter((c) => c.level === 'essential');
  const recommended = checks.filter((c) => c.level === 'recommended');
  const doneCount = checks.filter((c) => c.ok).length;
  const pct = Math.round((doneCount / checks.length) * 100);
  const item = (c) => `<li class="ck ${c.ok ? 'ck-ok' : 'ck-pending'}">${I.icon(c.ok ? 'check' : 'close', 16)} <div><b>${esc(c.title)}</b><p class="muted">${esc(c.desc)}</p>${c.link ? `<a href="${c.link}">${c.ok ? 'Ver' : 'Resolver agora'}</a>` : ''}</div></li>`;
  const body = `
  <h1>Checklist de lançamento</h1>
  <div class="launch-top">
    <div class="meter"><div class="meter-fill" style="width:${pct}%"></div></div>
    <p>${doneCount} de ${checks.length} itens prontos (${pct}%)</p>
  </div>
  <h2>Essenciais antes de publicar</h2>
  <ul class="checklist">${essential.map(item).join('')}</ul>
  <h2>Recomendados</h2>
  <ul class="checklist">${recommended.map(item).join('')}</ul>
  <h2>Depois de publicar</h2>
  <ol>
    <li>Cadastre o site no Google Search Console e envie o sitemap.</li>
    <li>Confirme que o Google Analytics está recebendo visitas (Configurações → Rastreamento).</li>
    <li>Se for usar AdSense, solicite a revisão do site depois de ter pelo menos 8–10 ofertas reais publicadas.</li>
    <li>Faça backup do banco de dados periodicamente (botão de backup abaixo).</li>
  </ol>
  <a class="btn btn-sm" href="/admin/backup">Baixar backup do banco de dados</a>
  `;
  return { body, active: '/admin/lancamento' };
}

const HELP = [
  ['Primeiros passos', [
    ['Como eu cadastro uma oferta?', 'Vá em Ofertas → Nova oferta. Cole o link de afiliado completo da Amazon (com <code>?tag=sua-tag-20</code>), preço, e uma imagem se quiser. Marque "Ativa" para publicar.'],
    ['Onde coloco minha tag de afiliado da Amazon?', 'Em Configurações → Afiliado Amazon, como lembrete. Mas o que importa de verdade é colar o link completo com <code>?tag=</code> em cada oferta, no campo "Link de afiliado".'],
  ]],
  ['Alertas de preço', [
    ['Como funciona o alerta de preço?', 'Na página de cada oferta, o visitante pode deixar o e-mail e um preço-alvo. Quando você editar a oferta e baixar o preço até aquele valor (ou menos), o sistema tenta enviar um e-mail automático (se o SMTP estiver configurado) e sempre marca como "avisado" no painel.'],
    ['Preciso configurar e-mail?', 'Não é obrigatório — o site funciona sem isso. Mas sem SMTP configurado (variáveis SMTP_* no .env), o e-mail não é enviado de verdade, só fica registrado aqui no painel.'],
  ]],
  ['Busca inteligente de preços', [
    ['O que é a página "Buscar com IA"?', 'Uma caixa de busca onde o visitante digita um produto e uma IA (Gemini, da Google) pesquisa ao vivo na web e responde com 2 a 4 lojas e preços aproximados, cada um com link. É uma estimativa, não um dado garantido — por isso a página sempre mostra um aviso disso.'],
    ['Preciso configurar algo pra isso funcionar?', 'Sim: defina <code>GEMINI_API_KEY</code> nas variáveis de ambiente (crie a chave em aistudio.google.com/apikey, com faturamento ativado). Sem isso, a página fica com um aviso de "em breve" e o resto do site continua funcionando normalmente.'],
    ['Isso tem custo?', 'Sim, cada busca chama a API do Gemini e isso é cobrado por uso pela Google — não é algo do Clickbaixo. Pra controlar gasto, o site já limita o número de buscas por hora por visitante (variável <code>AI_SEARCH_LIMIT_PER_HOUR</code>, padrão 12).'],
  ]],
  ['Banners e outras rendas', [
    ['Posso colocar um banner de outra rede de anúncios além da Amazon?', 'Sim. Em Configurações → Banners de anúncio, cole o código HTML/JS de qualquer rede (AdSense, uma rede de tráfego pago, um anunciante direto). Isso aparece no topo do site, entre seções e nas páginas de oferta — o site não fica "só Amazon" visualmente, mesmo usando só a Amazon como loja de verdade.'],
    ['Tem como vender espaço de anúncio direto pra alguém?', 'Sim, use a página pública "Anuncie aqui" (/anuncie): quem quiser anunciar manda uma mensagem, que cai em Contatos no painel. Você combina o valor e cola o banner dela em Configurações → Banners.'],
  ]],
  ['Manutenção', [
    ['Como eu faço backup?', 'Em Checklist de lançamento, tem um botão para baixar o banco de dados (.sqlite) inteiro.'],
    ['Como eu mudo a senha do painel?', 'Em Configurações, no final da página, tem o formulário de trocar senha.'],
  ]],
];

function helpPage() {
  const body = `<h1>Ajuda</h1>${HELP.map(([group, items]) => `
    <h2 class="help-group">${esc(group)}</h2>
    ${items.map(([q, a]) => `<details class="faq-item"><summary>${esc(q)}</summary><p>${a}</p></details>`).join('')}
  `).join('')}`;
  return { body, active: '/admin/ajuda' };
}

module.exports = { alertsPage, leadsPage, subscribersPage, launchPage, helpPage, HELP };
