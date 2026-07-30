const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const contentDir = path.join(root, "content", "materials");
const domain = "https://klosuja.com";
const phone = "+355 68 203 3672";
const phoneE164 = "+355682033672";
const email = "info@klosuja.com";
const mapUrl = "https://maps.app.goo.gl/BQaJCTi5xhsbZLW77?g_st=ac";

function fail(message) {
  console.error(`\nGabim në katalog: ${message}\n`);
  process.exit(1);
}
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function xmlEscape(value = "") {
  return escapeHtml(value);
}
function cleanDescription(value, fallback) {
  const text = String(value || fallback || "").replace(/\s+/g, " ").trim();
  return text.length <= 160 ? text : `${text.slice(0, 157).replace(/\s+\S*$/, "")}…`;
}
function safeJson(data) {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}
function readMaterials() {
  if (!fs.existsSync(contentDir)) fail("Mungon dosja content/materials.");
  const files = fs.readdirSync(contentDir).filter(name => name.endsWith(".json")).sort();
  if (!files.length) fail("Nuk u gjet asnjë material.");

  const seenNames = new Map();
  const materials = files.map(filename => {
    const fullPath = path.join(contentDir, filename);
    let data;
    try { data = JSON.parse(fs.readFileSync(fullPath, "utf8")); }
    catch (error) { fail(`${filename} nuk është JSON i vlefshëm: ${error.message}`); }

    const id = path.basename(filename, ".json");
    for (const field of ["name", "category", "image", "sq", "en"]) {
      if (data[field] === undefined || data[field] === null || data[field] === "") fail(`${filename}: mungon fusha “${field}”.`);
    }
    if (!["mermer", "granit"].includes(data.category)) fail(`${filename}: kategoria duhet të jetë “mermer” ose “granit”.`);

    const normalizedName = String(data.name).trim().toLocaleLowerCase("sq");
    if (seenNames.has(normalizedName)) {
      fail(`Materiali “${data.name}” është dy herë: ${seenNames.get(normalizedName)} dhe ${filename}.`);
    }
    seenNames.set(normalizedName, filename);

    if (String(data.image).startsWith("/uploads/")) {
      const imagePath = path.join(root, String(data.image).replace(/^\//, ""));
      if (!fs.existsSync(imagePath)) fail(`${filename}: fotografia ${data.image} nuk ekziston në repository.`);
    }

    return { id, ...data };
  });

  return materials.sort((a, b) => Number(a.order || 100) - Number(b.order || 100) || a.name.localeCompare(b.name));
}
function localizedMaterial(item, locale) {
  const text = item[locale] || {};
  const isSq = locale === "sq";
  const categoryLabel = item.category === "mermer" ? (isSq ? "Mermer" : "Marble") : (isSq ? "Granit" : "Granite");
  const detailUrl = isSq ? `/materiale/${item.id}/` : `/en/materials/${item.id}/`;
  return {
    id: item.id,
    active: item.active !== false,
    order: Number(item.order || 100),
    name: item.name,
    category: item.category,
    category_label: categoryLabel,
    tag: text.tag || "",
    image: item.image,
    image_alt: text.image_alt || item.name,
    summary: text.summary || "",
    description: text.description || text.summary || "",
    seo_title: text.seo_title || "",
    seo_description: text.seo_description || "",
    details_label: isSq ? "Shiko materialin →" : "View material →",
    detail_url: detailUrl,
    specs: Array.isArray(text.specs) ? text.specs : [],
  };
}
function injectBetween(filePath, startMarker, endMarker, content) {
  const source = fs.readFileSync(filePath, "utf8");
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) fail(`Mungojnë shenjat e gjenerimit në ${path.relative(root, filePath)}.`);
  const result = source.slice(0, start + startMarker.length) + `\n${content}\n` + source.slice(end);
  fs.writeFileSync(filePath, result, "utf8");
}
function cardHtml(material) {
  return `<article class="material-card reveal" data-category="${escapeHtml(material.category)}">
  <a class="card-open" href="${escapeHtml(material.detail_url)}" aria-label="${escapeHtml(material.name)}">
    <img src="${escapeHtml(material.image)}" alt="${escapeHtml(material.image_alt)}" loading="lazy" decoding="async">
    <div class="card-body">
      <div class="card-meta"><span>${escapeHtml(material.category_label)}</span>${material.tag ? `<span>${escapeHtml(material.tag)}</span>` : ""}</div>
      <h3>${escapeHtml(material.name)}</h3>
      <p>${escapeHtml(material.summary)}</p>
      <strong>${escapeHtml(material.details_label)}</strong>
    </div>
  </a>
</article>`;
}
function optionsHtml(materials, locale) {
  const isSq = locale === "sq";
  const groups = [
    { category: "mermer", label: isSq ? "Mermer" : "Marble" },
    { category: "granit", label: isSq ? "Granit" : "Granite" },
  ];
  return `<option value="">${isSq ? "Zgjidhni një material" : "Choose a material"}</option>\n` + groups.map(group => {
    const options = materials.filter(item => item.category === group.category).map(item => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join("\n");
    return `<optgroup label="${group.label}">\n${options}\n</optgroup>`;
  }).join("\n");
}
function headHtml({ lang, title, description, canonical, alternate, image, imageAlt }) {
  const isSq = lang === "sq";
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="sq" href="${alternate.sq}">
<link rel="alternate" hreflang="en" href="${alternate.en}">
<link rel="alternate" hreflang="x-default" href="${alternate.sq}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Klosuja">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="${escapeHtml(imageAlt)}">
<meta property="og:locale" content="${isSq ? "sq_AL" : "en_GB"}">
<meta property="og:locale:alternate" content="${isSq ? "en_GB" : "sq_AL"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${image}">
<meta name="theme-color" content="#151513">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/logo-192.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">`;
}
function navHtml(locale) {
  const isSq = locale === "sq";
  return `<header class="site-header scrolled" id="kreu">
  <div class="container nav-wrap">
    <a class="brand" href="/" aria-label="Klosuja"><span class="brand-mark">K</span><span><strong>KLOSUJA</strong><small>${isSq ? "Mermer &amp; Granit" : "Marble &amp; Granite"}</small></span></a>
    <button class="menu-toggle" aria-label="${isSq ? "Hap menunë" : "Open menu"}" aria-expanded="false"><span></span><span></span><span></span></button>
    <nav class="main-nav" aria-label="${isSq ? "Navigimi kryesor" : "Main navigation"}">
      <a href="${isSq ? "/#kompania" : "/en/#kompania"}">${isSq ? "Kompania" : "Company"}</a>
      <a href="${isSq ? "/#materialet" : "/en/#materialet"}">${isSq ? "Materialet" : "Materials"}</a>
      <a href="${isSq ? "/#sherbimet" : "/en/#sherbimet"}">${isSq ? "Shërbimet" : "Services"}</a>
      <a href="${isSq ? "/#kontakt" : "/en/#kontakt"}">${isSq ? "Kontakt" : "Contact"}</a>
      <a class="nav-cta" href="${isSq ? "/#kontakt" : "/en/#kontakt"}">${isSq ? "Kërko ofertë" : "Request a quote"}</a>
    </nav>
  </div>
</header>`;
}
function footerHtml(locale) {
  const isSq = locale === "sq";
  return `<footer class="site-footer detail-footer">
  <div class="container footer-grid">
    <div><a class="brand footer-brand" href="/"><span class="brand-mark">K</span><span><strong>KLOSUJA</strong><small>${isSq ? "Mermer &amp; Granit" : "Marble &amp; Granite"}</small></span></a><p>${isSq ? "Përpunim dhe tregtim i pllakave të mermerit dhe granitit." : "Processing and supply of marble and granite slabs."}</p></div>
    <div><h3>${isSq ? "Kontakt" : "Contact"}</h3><a href="tel:${phoneE164}">${phone}</a><a href="mailto:${email}">${email}</a><a href="${mapUrl}" target="_blank" rel="noopener noreferrer">${isSq ? "Marikaj, Tiranë–Durrës" : "Marikaj, Tirana–Durrës"}</a></div>
    <div><h3>${isSq ? "Informacion" : "Information"}</h3><p>${isSq ? "Shitje me shumicë dhe pakicë" : "Wholesale and retail sales"}</p><p>${isSq ? "Prerje sipas përmasave" : "Cutting to required dimensions"}</p><p>${isSq ? "Hënë – Shtunë, 08:00 – 17:00" : "Monday – Saturday, 08:00 – 17:00"}</p></div>
  </div>
  <div class="container footer-bottom"><p>© <span id="year"></span> Klosuja. ${isSq ? "Të gjitha të drejtat e rezervuara." : "All rights reserved."}</p><p>Marikaj • Tiranë–Durrës</p></div>
</footer>`;
}
function renderDetail(item, locale, allLocalized) {
  const isSq = locale === "sq";
  const material = localizedMaterial(item, locale);
  const sqUrl = `${domain}/materiale/${item.id}/`;
  const enUrl = `${domain}/en/materials/${item.id}/`;
  const canonical = isSq ? sqUrl : enUrl;
  const categoryNoun = item.category === "mermer" ? (isSq ? "Mermer" : "Marble") : (isSq ? "Granit" : "Granite");
  const title = material.seo_title || (isSq ? `${categoryNoun} ${material.name} në Shqipëri | Klosuja` : `${material.name} ${categoryNoun} in Albania | Klosuja`);
  const description = cleanDescription(material.seo_description, material.summary);
  const absoluteImage = material.image.startsWith("http") ? material.image : `${domain}${material.image}`;
  const related = allLocalized.filter(other => other.id !== material.id && other.category === material.category).slice(0, 3);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isSq ? "Kreu" : "Home", "item": isSq ? `${domain}/` : `${domain}/en/` },
      { "@type": "ListItem", "position": 2, "name": isSq ? "Materialet" : "Materials", "item": isSq ? `${domain}/#materialet` : `${domain}/en/#materialet` },
      { "@type": "ListItem", "position": 3, "name": material.name, "item": canonical }
    ]
  };
  const itemPage = {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    "name": title,
    "description": description,
    "url": canonical,
    "inLanguage": isSq ? "sq" : "en",
    "primaryImageOfPage": { "@type": "ImageObject", "url": absoluteImage, "caption": material.image_alt },
    "about": { "@type": "Thing", "name": material.name, "description": material.description }
  };
  const langSwitch = isSq ? `<a class="lang-switch" href="${enUrl}" lang="en">EN</a>` : `<a class="lang-switch" href="${sqUrl}" lang="sq">AL</a>`;
  const relatedHtml = related.length ? `<section class="related-section"><div class="container"><p class="eyebrow dark">${isSq ? "Materiale të ngjashme" : "Related materials"}</p><h2>${isSq ? "Shiko edhe koleksionin" : "Explore more materials"}</h2><div class="materials-grid">${related.map(cardHtml).join("\n")}</div></div></section>` : "";
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
${headHtml({ lang: locale, title, description, canonical, alternate: { sq: sqUrl, en: enUrl }, image: absoluteImage, imageAlt: material.image_alt })}
<script type="application/ld+json">${safeJson(breadcrumb)}</script>
<script type="application/ld+json">${safeJson(itemPage)}</script>
</head>
<body>
<a class="skip-link" href="#main-content">${isSq ? "Kalo te përmbajtja" : "Skip to content"}</a>
${navHtml(locale).replace('</nav>', `${langSwitch}</nav>`)}
<main class="material-detail-page" id="main-content">
  <section class="detail-hero">
    <div class="container">
      <nav class="breadcrumbs" aria-label="${isSq ? "Shtegu i faqes" : "Breadcrumb"}"><ol><li><a href="${isSq ? "/" : "/en/"}">${isSq ? "Kreu" : "Home"}</a></li><li><a href="${isSq ? "/#materialet" : "/en/#materialet"}">${isSq ? "Materialet" : "Materials"}</a></li><li aria-current="page">${escapeHtml(material.name)}</li></ol></nav>
      <div class="detail-grid">
        <figure class="detail-image"><img src="${escapeHtml(material.image)}" alt="${escapeHtml(material.image_alt)}" loading="eager" decoding="async" fetchpriority="high"></figure>
        <div class="detail-copy">
          <p class="eyebrow dark">${escapeHtml(categoryNoun)}</p>
          <h1>${escapeHtml(material.name)}</h1>
          <p class="detail-lead">${escapeHtml(material.summary)}</p>
          <div class="detail-meta"><span>${escapeHtml(categoryNoun)}</span>${material.tag ? `<span>${escapeHtml(material.tag)}</span>` : ""}</div>
          <a class="btn btn-dark detail-cta" href="${isSq ? "/" : "/en/"}?material=${encodeURIComponent(material.name)}#kontakt">${isSq ? "Kërko ofertë për këtë material" : "Request a quote for this material"}</a>
        </div>
      </div>
    </div>
  </section>
  <section class="detail-content">
    <div class="container detail-content-grid">
      <div><p class="eyebrow dark">${isSq ? "Rreth materialit" : "About the material"}</p><h2>${isSq ? "Pamje natyrale për projekte të personalizuara" : "Natural character for tailored projects"}</h2></div>
      <div><p class="detail-lead">${escapeHtml(material.description)}</p><div class="spec-grid">${material.specs.map(spec => `<div><span>${escapeHtml(spec.label)}</span><strong>${escapeHtml(spec.value)}</strong></div>`).join("")}</div><p class="detail-cta">${isSq ? "Disponueshmëria, trashësitë dhe përmasat konfirmohen sipas stokut dhe kërkesës së projektit." : "Availability, thicknesses and dimensions are confirmed according to stock and project requirements."}</p></div>
    </div>
  </section>
  ${relatedHtml}
</main>
${footerHtml(locale)}
<script src="/script-detail.js"></script>
</body>
</html>`;
}
function generateSitemap(materials) {
  const urls = [];
  const add = ({loc, sq, en, image, imageTitle, imageCaption}) => {
    urls.push(`<url><loc>${xmlEscape(loc)}</loc><xhtml:link rel="alternate" hreflang="sq" href="${xmlEscape(sq)}"/><xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(en)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(sq)}"/>${image ? `<image:image><image:loc>${xmlEscape(image)}</image:loc><image:title>${xmlEscape(imageTitle)}</image:title><image:caption>${xmlEscape(imageCaption)}</image:caption></image:image>` : ""}</url>`);
  };
  add({ loc: `${domain}/`, sq: `${domain}/`, en: `${domain}/en/`, image: `${domain}/og-klosuja.jpg`, imageTitle: "Klosuja – Mermer & Granit", imageCaption: "Përpunim dhe tregtim i mermerit dhe granitit në Marikaj." });
  add({ loc: `${domain}/en/`, sq: `${domain}/`, en: `${domain}/en/`, image: `${domain}/og-klosuja.jpg`, imageTitle: "Klosuja – Marble & Granite", imageCaption: "Marble and granite processing and supply in Marikaj, Albania." });
  materials.filter(item => item.active !== false).forEach(item => {
    const sq = localizedMaterial(item, "sq");
    const en = localizedMaterial(item, "en");
    const sqUrl = `${domain}${sq.detail_url}`;
    const enUrl = `${domain}${en.detail_url}`;
    const image = item.image.startsWith("http") ? item.image : `${domain}${item.image}`;
    add({ loc: sqUrl, sq: sqUrl, en: enUrl, image, imageTitle: sq.name, imageCaption: sq.image_alt });
    add({ loc: enUrl, sq: sqUrl, en: enUrl, image, imageTitle: en.name, imageCaption: en.image_alt });
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>\n`;
}

const materials = readMaterials();
const active = materials.filter(item => item.active !== false);
const sqMaterials = active.map(item => localizedMaterial(item, "sq"));
const enMaterials = active.map(item => localizedMaterial(item, "en"));
const outputs = {
  "materials-sq.json": { materials: materials.map(item => localizedMaterial(item, "sq")) },
  "materials-en.json": { materials: materials.map(item => localizedMaterial(item, "en")) },
};
for (const [filename, data] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(root, filename), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`U krijua ${filename} me ${data.materials.length} materiale.`);
}
injectBetween(path.join(root, "index.html"), "<!-- MATERIAL_CARDS_START -->", "<!-- MATERIAL_CARDS_END -->", sqMaterials.map(cardHtml).join("\n"));
injectBetween(path.join(root, "en", "index.html"), "<!-- MATERIAL_CARDS_START -->", "<!-- MATERIAL_CARDS_END -->", enMaterials.map(cardHtml).join("\n"));
injectBetween(path.join(root, "index.html"), "<!-- MATERIAL_OPTIONS_START -->", "<!-- MATERIAL_OPTIONS_END -->", optionsHtml(sqMaterials, "sq"));
injectBetween(path.join(root, "en", "index.html"), "<!-- MATERIAL_OPTIONS_START -->", "<!-- MATERIAL_OPTIONS_END -->", optionsHtml(enMaterials, "en"));

for (const dir of [path.join(root, "materiale"), path.join(root, "en", "materials")]) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}
active.forEach(item => {
  const sqDir = path.join(root, "materiale", item.id);
  const enDir = path.join(root, "en", "materials", item.id);
  fs.mkdirSync(sqDir, { recursive: true });
  fs.mkdirSync(enDir, { recursive: true });
  fs.writeFileSync(path.join(sqDir, "index.html"), renderDetail(item, "sq", sqMaterials), "utf8");
  fs.writeFileSync(path.join(enDir, "index.html"), renderDetail(item, "en", enMaterials), "utf8");
});
fs.writeFileSync(path.join(root, "sitemap.xml"), generateSitemap(materials), "utf8");
console.log(`U krijuan ${active.length * 2} faqe materialesh dhe sitemap.xml.`);
