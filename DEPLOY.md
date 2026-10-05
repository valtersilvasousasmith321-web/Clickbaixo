# Passo a passo para colocar o Clickbaixo no ar

## 1. Testar no seu computador (VS Code)

1. Instale o [Node.js 22 ou mais novo](https://nodejs.org/).
2. Abra a pasta `clickbaixo` no VS Code.
3. No terminal do VS Code: `npm install` (opcional) e depois `npm start`.
4. Acesse `http://localhost:3000`. Entre em `/admin` com a senha que aparece no terminal.
5. Também dá para rodar com F5 (já vem configurado em `.vscode/launch.json`).

## 2. Subir pro GitHub

```bash
cd clickbaixo
git init
git add .
git commit -m "Primeira versão do Clickbaixo"
```

Crie um repositório vazio no GitHub (github.com/new) e depois:

```bash
git remote add origin https://github.com/SEU_USUARIO/clickbaixo.git
git branch -M main
git push -u origin main
```

(O `.gitignore` já exclui o banco de dados e o `.env` — nunca suba sua senha.)

## 3. Hospedar (Railway é o caminho mais simples)

1. Crie uma conta em [railway.app](https://railway.app) e clique em "New Project" → "Deploy
   from GitHub repo" → escolha o repositório `clickbaixo`.
2. O Railway já detecta o `Dockerfile`/`railway.json` e builda sozinho.
3. Em **Variables**, adicione:
   - `SITE_URL` = a URL que o Railway te der (ou seu domínio, depois do passo 4)
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD` (escolha uma senha forte)
   - `TRUST_PROXY=1`
   - `NO_DEMO=1`
   - (opcional) `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — veja o passo 6
4. Em **Settings → Volumes**, adicione um volume montado em `/app/data` (é onde o banco de
   dados sqlite fica — sem isso, seus dados somem a cada deploy).
5. Clique em "Deploy". Depois de pronto, acesse `/admin` no endereço gerado e troque a senha.

Alternativas: `render.yaml` e `fly.toml` também funcionam (Render exige plano pago para disco
persistente; Fly.io tem camada gratuita limitada).

## 4. Domínio próprio (opcional, mas recomendado)

1. Compre um domínio (registro.br, se quiser `.com.br`).
2. No Railway: Settings → Networking → Custom Domain → siga as instruções de DNS.
3. Depois que o domínio estiver ativo, atualize `SITE_URL` na variável de ambiente.

## 5. Configurar o site (dentro do painel, em `/admin`)

- **Configurações → Site**: nome, slogan, URL, e-mail de contato.
- **Configurações → Afiliado Amazon**: cole sua tag (ex: `seumarcador-20`) como lembrete —
  o que realmente importa é usar o link completo com `?tag=` em cada oferta.
- **Configurações → Canais de divulgação**: WhatsApp, Instagram, Telegram.
- **Configurações → Banners de anúncio**: cole aqui o código de qualquer rede de anúncios
  (AdSense, uma rede de tráfego pago, etc.) para ter uma segunda fonte de receita além da
  Amazon.
- **Ofertas → Nova oferta**: cadastre pelo menos 6–8 ofertas reais antes de divulgar.
- **Categorias**: ajuste/crie as categorias que fizerem sentido pro seu público.

Use o **Checklist de lançamento** (`/admin/lancamento`) para ver o que falta, item por item.

## 6. E-mail para os alertas de preço (opcional)

Sem isso o site funciona normalmente — só o envio automático de e-mail fica desligado (o
alerta continua sendo registrado e marcado como "avisado" no painel).

Qualquer provedor SMTP serve. Exemplos de variáveis:

- **Brevo (ex-Sendinblue)**, grátis até 300 e-mails/dia: `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`
- **Gmail** (com uma "senha de app", não a senha normal): `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`
- **Zoho Mail**: `SMTP_HOST=smtp.zoho.com`, `SMTP_PORT=587`

Preencha `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM` nas variáveis de ambiente da hospedagem.

## 7. Depois de publicar

1. Cadastre o site no [Google Search Console](https://search.google.com/search-console) e
   envie `https://seudominio.com.br/sitemap.xml`.
2. Configure o Google Analytics (Configurações → Rastreamento) para acompanhar visitas.
3. Se for usar Google AdSense, peça a revisão do site só depois de ter várias ofertas reais
   publicadas havia algum tempo.
4. Baixe um backup do banco de dados de vez em quando (`/admin/lancamento` tem o botão).

## Dúvidas rápidas

A página `/admin/ajuda` dentro do painel tem um FAQ cobrindo cadastro de ofertas, alertas de
preço, banners e manutenção.
