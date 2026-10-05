# Clickbaixo

Site de ofertas e cupons focado em afiliado Amazon, com painel administrativo completo,
alertas de preço por e-mail e espaço para banners de outras redes de anúncio.

Feito em Node.js puro — **sem nenhuma dependência de terceiros** (sem Express, sem ORM):
usa só os módulos nativos (`http`, `node:sqlite`, `net`/`tls`, `crypto`). Isso significa
`npm install` é opcional e instantâneo, e o deploy é simples em qualquer lugar que rode Node 22+.

## Como o site ganha dinheiro

1. **Link de afiliado Amazon** em cada oferta (`/go/:id`) — você recebe comissão quando
   alguém compra depois de clicar.
2. **Banners de anúncio** (Configurações → Banners de anúncio): cole o código de qualquer
   rede — Google AdSense, uma rede de tráfego pago, ou um anunciante direto — nos espaços
   de topo, entre seções e na página da oferta. Isso dá uma fonte de receita que não depende
   só da Amazon, mesmo o site comprando só na Amazon por enquanto.
3. **Página "Anuncie aqui"** (`/anuncie`): quem quiser anunciar deixa contato, que cai em
   Contatos no painel — você negocia e cola o banner da pessoa manualmente.
4. **Alertas de preço por e-mail**: visitante deixa um preço-alvo; quando você baixa o preço
   da oferta até lá, ele recebe um e-mail — isso traz gente de volta para comprar.

## Rodando localmente

```bash
npm install          # opcional, não há dependências de produção
cp .env.example .env # edite com seus dados
npm start
```

Acesse `http://localhost:3000`. O painel fica em `/admin` — no primeiro start, se você não
definir `ADMIN_PASSWORD` no `.env`, uma senha é gerada e mostrada no terminal.

## Testes

```bash
npm test
```

Roda um teste de ponta a ponta (`scripts/smoke.js`) contra um banco de dados temporário:
login, CRUD de ofertas, cliques de afiliado, XSS, CSRF, newsletter, contato comercial e o
fluxo completo de alertas de preço.

## Estrutura

```
server.js              roteador HTTP principal
lib/db.js               schema SQLite + acesso a dados
lib/auth.js              hash de senha, cookies, tokens
lib/mailer.js            cliente SMTP escrito do zero (sem biblioteca)
lib/views.js             páginas públicas
lib/views-extra.js       página "Anuncie aqui" e "Como funciona"
lib/admin-views.js       layout do painel + páginas principais
lib/admin-views-extra.js páginas secundárias do painel
lib/icons.js             ícones SVG e ilustrações de produto
lib/util.js              funções auxiliares (escape, moeda, datas)
public/                  CSS, JS e imagens
scripts/smoke.js         teste automatizado
```

## Próximos passos (quando quiser crescer)

- Adicionar outras lojas afiliadas (Shopee, Mercado Livre etc.) — hoje o campo "Loja" de
  cada oferta já é livre, então dá pra cadastrar ofertas de qualquer loja manualmente; uma
  tabela de lojas com detecção automática de link pode ser adicionada depois.
- Trocar o banner de anúncio estático por um sistema de campanhas vendidas diretamente.
- Afiliado de jogos: a Amazon já vende consoles e jogos físicos; para jogos digitais, vale
  avaliar a Nuuvem Co-Op (via Rakuten Advertising), já que PlayStation e Xbox não têm
  programa de afiliados aberto para o Brasil.

Veja `DEPLOY.md` para o passo a passo de colocar no ar.
