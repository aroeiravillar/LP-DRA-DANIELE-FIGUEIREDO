/* ============================================================
   build.js — Gerador estático do blog da Dra. Daniele
   ------------------------------------------------------------
   Lê os artigos em markdown (blog/posts/*.md), converte cada um
   em uma página HTML estática completa (com SEO + schema),
   regenera a listagem do blog (blog/index.html) e o sitemap.xml.

   Roda automaticamente no deploy da Vercel (buildCommand).
   Também pode rodar localmente:  node build.js
   ============================================================ */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { marked } = require("marked");

// ---- Configurações do site --------------------------------------------------
const SITE_URL = "https://dradanieleofigueiredo.com";
const WHATSAPP =
  "https://wa.me/5531984196394?text=Ol%C3%A1!%20Vim%20pelo%20blog%20e%20gostaria%20de%20agendar%20uma%20consulta%20online%20com%20a%20Dra.%20Daniele.";
const GTM_ID = "GTM-WGRDJ7ZZ";

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, "blog", "posts");
const BLOG_DIR = path.join(ROOT, "blog");

// ---- Utilitários ------------------------------------------------------------
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return "";
  return `${dt.getUTCDate()} de ${MESES[dt.getUTCMonth()]} de ${dt.getUTCFullYear()}`;
}
function isoDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return "";
  return dt.toISOString().slice(0, 10);
}
// Deixa URLs de imagem absolutas para Open Graph / schema
function absUrl(p) {
  if (!p) return "";
  if (/^https?:\/\//.test(p)) return p;
  return SITE_URL + (p.startsWith("/") ? "" : "/") + p;
}
// Caminho absoluto a partir da raiz do site (à prova de trailing slash / cleanUrls)
function root(p) {
  if (!p) return "/";
  return p.startsWith("/") ? p : "/" + p;
}

// ---- Componentes de layout (iguais à LP) ------------------------------------
function head({ title, description, keywords, canonical, ogImage, ogType, jsonld }) {
  const ld = jsonld.map((o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`).join("\n");
  return `<!DOCTYPE html><html lang="pt-BR"><head>

<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');</script>
<!-- End Google Tag Manager -->

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#4BBEA7">

<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ""}
<meta name="author" content="Dra. Daniele Oliveira Figueiredo">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">

<meta property="og:type" content="${ogType}">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ogImage}">

${ld}

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&amp;family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/blog/blog.css">
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
`;
}

function nav(activeBlog = true) {
  return `<nav class="nav">
  <a href="/" class="nav-logo">
    <img src="/assets/logo.jpeg" alt="Logo Dra. Daniele Oliveira Figueiredo">
    <span class="nav-logo-text">
      <span class="nav-logo-name">Dra. Daniele Oliveira Figueiredo</span>
      <span class="nav-logo-sub">Nutróloga</span>
    </span>
  </a>
  <div class="nav-links">
    <a href="/#sobre">Sobre</a>
    <a href="/#metodo">Método PLENE</a>
    <a href="/#app">App</a>
    <a href="/blog/"${activeBlog ? ' class="active"' : ""}>Blog</a>
  </div>
  <a href="${WHATSAPP}" target="_blank" rel="noopener" class="nav-cta" data-gtm="conversion-click">Agendar consulta</a>
</nav>`;
}

function footer() {
  return `<footer class="footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-col">
        <h4>Navegação</h4>
        <a href="/#sobre">Sobre</a>
        <a href="/#metodo">Método PLENE</a>
        <a href="/#app">App</a>
        <a href="/blog/">Blog</a>
      </div>
      <div class="footer-col">
        <h4>Atendimento</h4>
        <p>2ª a 6ª · 08h às 17h</p>
        <p>100% online · particular</p>
        <a href="${WHATSAPP}" target="_blank" rel="noopener" data-gtm="conversion-click">Agendar consulta</a>
      </div>
      <div class="footer-col">
        <h4>App DOF</h4>
        <a href="https://apps.apple.com/br/app/dof-nutrologia/id6747347404" target="_blank" rel="noopener">App Store</a>
        <a href="https://play.google.com/store/apps/details?id=br.com.dofnutrologia.app" target="_blank" rel="noopener">Google Play</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© 2026 Dra. Daniele Oliveira Figueiredo · Todos os direitos reservados</div>
      <div>Médica nutróloga · Atendimento 100% online · Sediada em Belo Horizonte/MG</div>
      <div class="footer-credit">Landing Page feita por <strong>AV Marketing Médico</strong></div>
    </div>
  </div>
</footer>
</body></html>`;
}

// ---- Renderização de um artigo ---------------------------------------------
function renderArticle(post) {
  const { data, content, slug } = post;
  const canonical = `${SITE_URL}/blog/${slug}.html`;
  const ogImage = absUrl(data.image) || `${SITE_URL}/assets/hero-portrait.jpeg`;
  const bodyHtml = marked.parse(content);

  // JSON-LD
  const jsonld = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: data.title,
      description: data.description,
      image: ogImage,
      datePublished: isoDate(data.date),
      dateModified: isoDate(data.date),
      inLanguage: "pt-BR",
      author: {
        "@type": "Physician",
        name: data.author || "Dra. Daniele Oliveira Figueiredo",
        medicalSpecialty: "Nutrologia",
        identifier: "CRMMG 58325",
        url: SITE_URL + "/",
      },
      publisher: {
        "@type": "Organization",
        name: "Dra. Daniele Oliveira Figueiredo",
        logo: { "@type": "ImageObject", url: SITE_URL + "/icon-512.png" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL + "/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: SITE_URL + "/blog/" },
        { "@type": "ListItem", position: 3, name: data.title },
      ],
    },
  ];

  const faq = Array.isArray(data.faq) ? data.faq.filter((f) => f && f.question && f.answer) : [];
  if (faq.length) {
    jsonld.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  const cover = data.image
    ? `<figure class="article-cover"><img src="${esc(root(data.image))}" alt="${esc(data.image_alt || data.title)}"></figure>`
    : "";

  const faqHtml = faq.length
    ? `<h2>Perguntas frequentes</h2>\n` +
      faq
        .map(
          (f) => `<div class="faq-item"><h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p></div>`
        )
        .join("\n")
    : "";

  const meta = [
    `Por ${esc(data.author || "Dra. Daniele Oliveira Figueiredo")}`,
    formatDate(data.date),
    data.reading_time ? `Leitura de ${data.reading_time} min` : "",
  ]
    .filter(Boolean)
    .map((t, i, arr) => (i < arr.length - 1 ? `<span>${t}</span><span class="dot"></span>` : `<span>${t}</span>`))
    .join("");

  return (
    head({
      title: `${data.title} | Dra. Daniele Figueiredo`,
      description: data.description,
      keywords: data.keywords,
      canonical,
      ogImage,
      ogType: "article",
      jsonld,
    }) +
    nav() +
    `<article class="article">
  <div class="container-narrow">
    <div class="breadcrumb">
      <a href="/">Início</a> &nbsp;›&nbsp; <a href="/blog/">Blog</a> &nbsp;›&nbsp; ${esc(data.title)}
    </div>
    <div class="article-head">
      <div class="cat">${esc(data.category || "Blog")}</div>
      <h1>${esc(data.title)}</h1>
      <div class="article-meta">${meta}</div>
    </div>
    ${cover}
    <div class="article-body">
${bodyHtml}
      <div class="cta-box">
        <h3>Pronta para começar seu acompanhamento?</h3>
        <p>Agende sua consulta online com a Dra. Daniele e receba um plano feito para o seu corpo e a sua rotina — de onde você estiver.</p>
        <a href="${WHATSAPP}" target="_blank" rel="noopener" class="btn-wa" data-gtm="conversion-click">Agendar pelo WhatsApp</a>
      </div>
      ${faqHtml}
      <div class="author-box">
        <img src="/assets/hero-portrait.jpeg" alt="Dra. Daniele Oliveira Figueiredo, nutróloga">
        <div>
          <div class="who">Dra. Daniele Oliveira Figueiredo</div>
          <div class="crm">Médica Nutróloga · CRMMG 58325</div>
          <div class="bio">Nutróloga com atendimento 100% online e particular para todo o Brasil. Criadora do Método PLENE, une performance, longevidade, emagrecimento, nível de vida e equilíbrio em um acompanhamento individualizado.</div>
        </div>
      </div>
      <p class="med-disclaimer">Este conteúdo tem caráter informativo e educativo e não substitui uma consulta médica. Resultados variam de pessoa para pessoa e dependem de avaliação individual. Em caso de dúvidas sobre sua saúde, procure um médico.</p>
    </div>
  </div>
</article>
` +
    footer()
  );
}

// ---- Renderização da listagem (blog/index.html) -----------------------------
function renderIndex(posts) {
  const cards = posts
    .map((p) => {
      const d = p.data;
      const thumb = d.image
        ? `<div class="thumb"><img src="${esc(root(d.image))}" alt="${esc(d.image_alt || d.title)}"></div>`
        : `<div class="thumb"></div>`;
      return `    <a href="/blog/${p.slug}.html" class="post-card" data-gtm="blog-post-click">
      ${thumb}
      <div class="body">
        <div class="cat">${esc(d.category || "Blog")}</div>
        <h2>${esc(d.title)}</h2>
        <p>${esc(d.description || "")}</p>
        <span class="more">Ler artigo →</span>
      </div>
    </a>`;
    })
    .join("\n\n");

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog · Dra. Daniele Oliveira Figueiredo",
    url: SITE_URL + "/blog/",
    inLanguage: "pt-BR",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.data.title,
      url: `${SITE_URL}/blog/${p.slug}.html`,
      datePublished: isoDate(p.data.date),
    })),
  };

  return (
    head({
      title: "Blog · Nutrologia e Saúde | Dra. Daniele Oliveira Figueiredo",
      description:
        "Conteúdos sobre nutrologia, emagrecimento, longevidade e saúde escritos pela Dra. Daniele Oliveira Figueiredo, nutróloga particular (CRMMG 58325). Atendimento 100% online para todo o Brasil.",
      keywords: "",
      canonical: SITE_URL + "/blog/",
      ogImage: SITE_URL + "/assets/hero-portrait.jpeg",
      ogType: "website",
      jsonld: [jsonld],
    }) +
    nav() +
    `<header class="blog-hero">
  <div class="container">
    <div class="eyebrow">Blog</div>
    <h1>Saúde, nutrologia e longevidade com base em ciência</h1>
    <p>Conteúdos práticos sobre emagrecimento, performance e qualidade de vida — escritos pela Dra. Daniele Oliveira Figueiredo.</p>
  </div>
</header>

<main class="container">
  <div class="post-grid">
${cards || '    <p style="grid-column:1/-1;color:var(--ink-muted)">Em breve, novos artigos por aqui.</p>'}
  </div>
</main>
` +
    footer()
  );
}

// ---- Sitemap ----------------------------------------------------------------
function renderSitemap(posts) {
  const urls = [
    { loc: SITE_URL + "/", priority: "1.0", freq: "monthly", lastmod: isoDate(new Date()) },
    { loc: SITE_URL + "/blog/", priority: "0.8", freq: "weekly", lastmod: isoDate(new Date()) },
    ...posts.map((p) => ({
      loc: `${SITE_URL}/blog/${p.slug}.html`,
      priority: "0.7",
      freq: "monthly",
      lastmod: isoDate(p.data.date) || isoDate(new Date()),
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  )
  .join("\n")}
</urlset>
`;
}

// ---- Execução ---------------------------------------------------------------
function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log("Nenhuma pasta blog/posts encontrada — nada a gerar.");
    return;
  }
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const posts = files
    .map((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const slug = file.replace(/\.md$/, "");
      return { data, content, slug };
    })
    .filter((p) => p.data && p.data.title)
    .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));

  // Páginas de artigo
  posts.forEach((post) => {
    const outfile = path.join(BLOG_DIR, `${post.slug}.html`);
    fs.writeFileSync(outfile, renderArticle(post), "utf8");
    console.log("✓ artigo:", `blog/${post.slug}.html`);
  });

  // Listagem
  fs.writeFileSync(path.join(BLOG_DIR, "index.html"), renderIndex(posts), "utf8");
  console.log("✓ listagem: blog/index.html");

  // Sitemap
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), renderSitemap(posts), "utf8");
  console.log("✓ sitemap: sitemap.xml");

  console.log(`\nConcluído — ${posts.length} artigo(s) gerado(s).`);
}

main();
