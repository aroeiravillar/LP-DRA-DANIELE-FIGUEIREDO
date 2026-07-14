# LP — Dra. Daniele Oliveira Figueiredo

Landing page da **Dra. Daniele Oliveira Figueiredo**, médica nutróloga em Belo Horizonte (CRMMG 58325). Atendimento exclusivamente particular, 100% online.

## Sobre

Site estático, arquivo único (`index.html`) com todas as imagens embutidas em base64 — sem dependências externas além das fontes do Google. Basta abrir o HTML em qualquer navegador.

- **Método:** PLENE (Performance · Longevidade · Emagrecimento · Nível de Vida · Equilíbrio)
- **Modalidade:** Consultas 100% online
- **Atendimento:** Exclusivamente particular — não atende convênios
- **App:** [DOF Nutrologia](https://play.google.com/store/apps/details?id=br.com.dofnutrologia.app) (Android) e [App Store](https://apps.apple.com/br/app/dof-nutrologia/id6747347404)
- **WhatsApp:** [wa.me/5531984196394](https://wa.me/5531984196394)

## Stack

- HTML5 + CSS3 + JavaScript vanilla
- Fontes: Cormorant Garamond e Lato (Google Fonts)
- Zero build step, zero framework, zero dependências de backend

## Deploy

Qualquer serviço de hospedagem estática funciona:

**Netlify / Vercel / Cloudflare Pages**
Arrastar a pasta `site/` na interface web. Pronto.

**GitHub Pages**
Settings → Pages → Source: branch `main` / root.

**Servidor próprio**
Subir o `index.html` para qualquer pasta servida por HTTP.

## Blog + Painel Admin

O blog usa geração estática a partir de markdown, com um painel para a Dra. publicar sozinha.

- **Painel:** `/admin/` — Sveltia CMS (login GitHub). A Dra. escreve o artigo e publica.
- **Artigos (fonte):** `blog/posts/*.md` (frontmatter + markdown). É o que o painel grava.
- **Build:** `node build.js` lê os `.md` e gera `blog/<slug>.html`, `blog/index.html` e `sitemap.xml` — com SEO e schema (BlogPosting/Breadcrumb/FAQPage).
- **Deploy:** a Vercel roda `build.js` automaticamente (ver `vercel.json`).

> ⚠️ **Não edite os HTML dentro de `blog/` à mão** — eles são gerados e serão sobrescritos. Edite o `.md` em `blog/posts/` e rode `node build.js`.

Repositório configurado no painel: `aroeiravillar/LP-DRA-DANIELE-FIGUEIREDO` (branch `main`).

Rodar o build localmente:

```bash
npm install
node build.js
```

## Créditos

Landing Page feita por **AV Marketing Médico**.
