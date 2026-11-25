const API_BASE = window.API_BASE_URL || window.__API_BASE__ || "/api";

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getImageUrl(imagemUrl, base) {
  if (!imagemUrl) return (base || ".") + "/images/postal-antigo-01.png";
  if (imagemUrl.startsWith("http")) return imagemUrl;
  if (imagemUrl.startsWith("/images/")) return (base || ".") + imagemUrl;
  if (imagemUrl.startsWith("/static/")) return (window.API_ORIGIN || "") + imagemUrl;
  return imagemUrl;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function fetchJson(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) {
    const error = new Error("Erro ao carregar dados.");
    error.status = res.status;
    throw error;
  }
  return res.json();
}

function renderPostCard(post, base) {
  const imgUrl = getImageUrl(post.imagem_capa_url, base);
  const slug = post.slug || "";
  const link = base ? base + "/pages/post.html?slug=" + slug : "post.html?slug=" + slug;
  return `
    <article class="card chronicle-card article-card">
      <a href="${link}" class="card__media">
        <img src="${imgUrl}" alt="${escapeHtml(post.titulo)}" loading="lazy" class="card__image">
      </a>
      <div class="card__body">
        ${post.autor ? '<p class="chronicle-card__author">Por: ' + escapeHtml(post.autor) + '</p>' : ""}
        <h3 class="card__title"><a href="${link}" class="card__title-link">${escapeHtml(post.titulo)}</a></h3>
        <p class="card__description">${escapeHtml(post.resumo || post.subtitulo || "")}</p>
        <a href="${link}" class="btn btn--primary">Ler história</a>
      </div>
    </article>`;
}

function renderPostalCard(postal, base) {
  const imgUrl = getImageUrl(postal.imagem_url, base);
  const link = base ? base + "/pages/postal.html?id=" + postal.id : "postal.html?id=" + postal.id;
  return `
    <article class="card card--postal postal-card">
      <a href="${link}" class="card__media postal-card-media">
        <img src="${imgUrl}" alt="${escapeHtml(postal.titulo)}" loading="lazy" class="card__image">
      </a>
      <div class="card__body postal-card-content">
        <h3 class="card__title"><a href="${link}" class="card__title-link postal-card-title">${escapeHtml(postal.titulo)}</a></h3>
        <p class="card__description">${escapeHtml(postal.epoca || "")}</p>
        <a href="${link}" class="btn btn--primary postal-card-link">Ver mais</a>
      </div>
    </article>`;
}
