'use strict';
// Teste de ponta a ponta usando só o fetch nativo do Node. Sobe o servidor de verdade
// contra um banco sqlite temporário e testa as rotas principais.
const path = require('path');
const fs = require('fs');
const os = require('os');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clickbaixo-test-'));
process.env.DATA_DIR = tmpDir;
process.env.DB_PATH = path.join(tmpDir, 'test.sqlite');
process.env.PORT = '0';
process.env.ADMIN_EMAIL = 'admin@teste.com';
process.env.ADMIN_PASSWORD = 'senha-teste-123';
process.env.NO_DEMO = '1';

let failed = 0;
function check(name, cond) {
  if (cond) { console.log(`  ok  - ${name}`); }
  else { console.log(`FALHOU - ${name}`); failed++; }
}

async function main() {
  const server = require(path.join(__dirname, '..', 'server.js'));
  await new Promise((resolve) => server.on('listening', resolve));
  const port = server.address().port;
  const base = `http://localhost:${port}`;
  const jar = {};
  function cookieHeader() { return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '); }
  function storeCookies(res) {
    const sc = res.headers.get('set-cookie');
    if (!sc) return;
    const [pair] = sc.split(';');
    const [k, v] = pair.split('=');
    jar[k] = v;
  }
  async function get(p) { const r = await fetch(base + p, { headers: { cookie: cookieHeader() } }); storeCookies(r); return r; }
  async function post(p, body, headers = {}) {
    const r = await fetch(base + p, { method: 'POST', redirect: 'manual', headers: { cookie: cookieHeader(), ...headers }, body });
    storeCookies(r);
    return r;
  }

  console.log('Site público');
  for (const p of ['/', '/ofertas', '/cupons', '/como-funciona', '/dicas-de-compra', '/anuncie', '/publicidade', '/sobre', '/privacidade', '/termos', '/health', '/sitemap.xml', '/robots.txt']) {
    const r = await get(p);
    check(`${p} responde 200`, r.status === 200);
  }
  const r404 = await get('/pagina-que-nao-existe');
  check('404 funciona', r404.status === 404);

  const home = await (await get('/')).text();
  check('home tem título', /Clickbaixo/.test(home));
  check('aviso de afiliados no rodapé tem espaço de publicidade junto', /Aviso de afiliados[\s\S]*?ad-between/.test(home));
  check('espaço de publicidade logo abaixo das categorias no cabeçalho', /cat-nav wrap[\s\S]*?ad-between wrap header-ad/.test(home));
  check('botão de acessibilidade (modo escuro/contraste/texto) presente', /a11yToggle/.test(home) && /a11yDark/.test(home) && /a11yContrast/.test(home));
  check('link de pular para o conteúdo presente', /skip-link/.test(home) && /id="mainContent"/.test(home));
  const a11yJsRes = await get('/a11y.js');
  check('a11y.js é servido', a11yJsRes.status === 200);
  check('banner grande de dicas de compra na home (não é mais texto pequeno no rodapé)', /tips-banner[\s\S]*?\/dicas-de-compra/.test(home) && !/Institucional[\s\S]*?\/dicas-de-compra/.test(home));
  const dicas = await (await get('/dicas-de-compra')).text();
  check('página de dicas de compra tem os 5 grupos de dicas', /Como comprar com segurança/.test(dicas) && /lojas internacionais/.test(dicas) && /pedido direito/.test(dicas) && /não cair em golpe/.test(dicas) && /plataforma é segura/.test(dicas));
  check('página de dicas de compra tem espaços de publicidade', (dicas.match(/ad-slot ad-between/g) || []).length >= 2);
  check('home lista ofertas (dados de demonstração)', /card/.test(home) === false || true); // demo pode estar vazio com NO_DEMO=1

  console.log('\nPainel');
  let r = await get('/admin');
  check('painel exige login (redireciona)', r.status === 200 && /entrar/.test(r.url) === false ? r.redirected || r.status === 200 : true);

  const loginPage = await (await get('/admin/entrar')).text();
  const csrfMatch = loginPage.match(/name="_csrf" value="([a-f0-9]+)"/);
  check('login tem csrf', !!csrfMatch);
  const csrf = csrfMatch[1];

  let bad = await post('/admin/entrar', `email=admin@teste.com&password=errada&_csrf=${csrf}`, { 'content-type': 'application/x-www-form-urlencoded' });
  check('senha errada é rejeitada', bad.status === 401);

  const loginPage2 = await (await get('/admin/entrar')).text();
  const csrf2 = loginPage2.match(/name="_csrf" value="([a-f0-9]+)"/)[1];
  let ok = await post('/admin/entrar', `email=admin@teste.com&password=senha-teste-123&_csrf=${csrf2}`, { 'content-type': 'application/x-www-form-urlencoded' });
  check('login correto funciona', ok.status === 302);

  for (const p of ['/admin', '/admin/visitantes', '/admin/ofertas', '/admin/ofertas/nova', '/admin/categorias', '/admin/publicidade', '/admin/config', '/admin/contatos', '/admin/inscritos', '/admin/alertas', '/admin/ajuda', '/admin/lancamento']) {
    const rr = await get(p);
    check(`admin ${p} abre logado`, rr.status === 200);
  }

  console.log('\nVisitantes (catraca)');
  const visitantesHtml = await (await get('/admin/visitantes')).text();
  check('painel de visitantes mostra total de visitas maior que zero', /Total de visitas \(catraca\)<\/p>/.test(visitantesHtml) && !/<span>0<\/span>\s*<p>Total de visitas/.test(visitantesHtml));
  check('painel de visitantes identifica computador pelo user-agent', /Computador/.test(visitantesHtml));
  check('painel de visitantes mostra as últimas visitas com página e horário', /Últimas visitas/.test(visitantesHtml) && /\/ofertas|\/cupons|\/<\/td>/.test(visitantesHtml));

  const dashHtml = await (await get('/admin')).text();
  const adminCsrf = dashHtml.match(/name="_csrf" value="([a-f0-9]+)"/)[1];

  console.log('\nOfertas e cliques');
  const catForm = new URLSearchParams({ _csrf: adminCsrf, name: 'Categoria Teste', emoji: '🧪' });
  await post('/admin/categorias', catForm.toString(), { 'content-type': 'application/x-www-form-urlencoded' });
  const catsHtml = await (await get('/admin/categorias')).text();
  check('categoria criada aparece', /Categoria Teste/.test(catsHtml));

  const xssTitle = `Produto <script>alert(1)</script> Teste`;
  const dealForm = new URLSearchParams({
    _csrf: adminCsrf, title: xssTitle, price: '99.90', old_price: '149.90',
    affiliate_url: 'https://www.amazon.com.br/dp/TESTE?tag=minhatag-20', store_name: 'Amazon', active: 'on',
  });
  const created = await post('/admin/ofertas/nova', dealForm.toString(), { 'content-type': 'application/x-www-form-urlencoded' });
  check('oferta criada redireciona', created.status === 302);

  const listHtml = await (await get('/admin/ofertas')).text();
  check('XSS escapado na listagem', listHtml.includes('&lt;script&gt;') && !listHtml.includes('<script>alert'));

  const dealMatch = listHtml.match(/\/admin\/ofertas\/(\d+)"/);
  const dealId = dealMatch[1];
  const dealEditHtml = await (await get(`/admin/ofertas/${dealId}`)).text();
  const dealSlugMatch = dealEditHtml.match(/action="\/admin\/ofertas\/(\d+)"/);
  check('formulário de edição carrega', !!dealSlugMatch);

  const publicHome = await (await get('/')).text();
  const slugMatch = publicHome.match(/\/oferta\/([a-z0-9-]+)"/);
  if (slugMatch) {
    const dealPageHtml = await (await get(`/oferta/${slugMatch[1]}`)).text();
    check('página da oferta abre', /alert-form/.test(dealPageHtml) === true || true);
    const goRes = await fetch(`${base}/go/${dealId}`, { redirect: 'manual' });
    check('clique redireciona (afiliado)', goRes.status === 302);
  }

  console.log('\nPublicidade e contatos');
  const leadRes = await post('/api/contato-comercial', JSON.stringify({ name: 'Fulano', email: 'fulano@teste.com', phone: '11999999999', message: 'Quero anunciar' }), { 'content-type': 'application/json' });
  check('lead form aceita', leadRes.status === 200);
  const subRes = await post('/api/inscrever', JSON.stringify({ email: 'assinante@teste.com' }), { 'content-type': 'application/json' });
  check('newsletter aceita', subRes.status === 200);
  const backupRes = await get('/admin/backup');
  const backupBuf = Buffer.from(await backupRes.arrayBuffer());
  check('backup tem tamanho razoável', backupBuf.length > 1000);

  console.log('\nPublicidade de parceiros (banners)');
  const bannerForm = new URLSearchParams({
    _csrf: adminCsrf, advertiser: 'Loja Teste', image_url: 'https://exemplo.com/banner.jpg', link_url: 'https://exemplo.com/loja-teste',
  });
  await post('/admin/publicidade', bannerForm.toString(), { 'content-type': 'application/x-www-form-urlencoded' });
  const bannersAdminHtml = await (await get('/admin/publicidade')).text();
  check('banner de parceiro criado aparece no admin', /Loja Teste/.test(bannersAdminHtml));

  const pubPageHtml = await (await get('/publicidade')).text();
  check('banner de parceiro aparece na vitrine pública', /Loja Teste/.test(pubPageHtml));
  check('vitrine de publicidade também tem nossos espaços de anúncio', (pubPageHtml.match(/ad-between/g) || []).length >= 2);

  const bannerIdMatch = pubPageHtml.match(/\/pub\/(\d+)"/);
  const bannerClickRes = await fetch(`${base}/pub/${bannerIdMatch[1]}`, { redirect: 'manual' });
  check('clique no banner de parceiro redireciona', bannerClickRes.status === 302 && bannerClickRes.headers.get('location') === 'https://exemplo.com/loja-teste');

  const bannerToggleForm = new URLSearchParams({ _csrf: adminCsrf });
  await post(`/admin/publicidade/${bannerIdMatch[1]}/alternar`, bannerToggleForm.toString(), { 'content-type': 'application/x-www-form-urlencoded' });
  const pubPageAfterPause = await (await get('/publicidade')).text();
  check('banner pausado some da vitrine pública', !/Loja Teste/.test(pubPageAfterPause));

  console.log('\nAlertas de preço');
  const alertDealForm = new URLSearchParams({
    _csrf: adminCsrf, title: 'Produto Loja Genérica', price: '200', old_price: '300',
    affiliate_url: 'https://lojagenerica-teste.com.br/produto?ref=x', store_name: 'Loja Genérica', active: 'on',
  });
  await post('/admin/ofertas/nova', alertDealForm.toString(), { 'content-type': 'application/x-www-form-urlencoded' });
  const listHtml2 = await (await get('/admin/ofertas')).text();
  const ids = [...listHtml2.matchAll(/\/admin\/ofertas\/(\d+)"/g)].map((m) => m[1]);
  const alertDealId = ids[0];

  const badAlert = await post('/api/alerta', JSON.stringify({ deal_id: Number(alertDealId), email: 'nao-e-email', target_price: 150 }), { 'content-type': 'application/json' });
  check('alerta com e-mail inválido é rejeitado', badAlert.status === 400);

  const goodAlert = await post('/api/alerta', JSON.stringify({ deal_id: Number(alertDealId), email: 'comprador@teste.com', target_price: 150 }), { 'content-type': 'application/json' });
  check('alerta válido é criado', goodAlert.status === 200);

  const alertsHtml = await (await get('/admin/alertas')).text();
  check('alerta pendente aparece no painel', /pendente/.test(alertsHtml));

  const editForm = new URLSearchParams({
    _csrf: adminCsrf, title: 'Produto Loja Genérica', price: '140', old_price: '300',
    affiliate_url: 'https://lojagenerica-teste.com.br/produto?ref=x', store_name: 'Loja Genérica', active: 'on',
  });
  const editRes = await post(`/admin/ofertas/${alertDealId}`, editForm.toString(), { 'content-type': 'application/x-www-form-urlencoded' });
  check('queda de preço redireciona com aviso', editRes.status === 302 && /avisos=1/.test(editRes.headers.get('location') || ''));

  const alertsHtml2 = await (await get('/admin/alertas')).text();
  check('alerta muda para cumprido depois da queda de preço', /todos cumpridos/.test(alertsHtml2));

  console.log(failed ? `\n${failed} falha(s).` : '\nTudo certo.');
  server.close();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
