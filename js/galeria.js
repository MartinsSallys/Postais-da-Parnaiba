const API_BASE = window.API_BASE_URL || window.__API_BASE__ || "http://localhost:8001";
const FRONTEND_BASE = "";

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function getImageUrl(imagemUrl) {
  if (!imagemUrl) return "../images/postal-antigo-01.png";
  if (imagemUrl.startsWith("http")) return imagemUrl;
  if (imagemUrl.startsWith("/images/")) return `..${imagemUrl}`;
  if (imagemUrl.startsWith("/static/")) return `${API_BASE}${imagemUrl}`;
  return imagemUrl;
}

async function loadPostais() {
  const grid = document.getElementById("dynamic-gallery");
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/postais?size=50`);
    if (!res.ok) throw new Error("Erro ao carregar postais.");
    const data = await res.json();
    const postais = data.items || [];

    if (!postais.length) {
      grid.innerHTML = '<p class="empty-state">Nenhum postal cadastrado ainda.</p>';
      return;
    }

    grid.innerHTML = postais
      .map((postal) => {
        const imageUrl = getImageUrl(postal.imagem_url);

        return `
        <article class="postal-card">
          <div class="postal-card__image">
            <img src="${imageUrl}" alt="${escapeHtml(postal.titulo)}" loading="lazy">
            <div class="postal-card__overlay">
              <span class="postal-card__year">${escapeHtml(postal.epoca || "")}</span>
              <p class="postal-card__desc">${escapeHtml(postal.descricao || "")}</p>
              ${postal.localizacao ? `<span class="postal-card__location">${escapeHtml(postal.localizacao)}</span>` : ""}
            </div>
          </div>
          <div class="postal-card__label">${escapeHtml(postal.titulo)}</div>
        </article>
      `;
      })
      .join("");
  } catch (error) {
    grid.innerHTML = '<p class="empty-state">Erro ao carregar postais.</p>';
  }
}

async function loadTimeline() {
  const container = document.getElementById("dynamic-timeline");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/timeline-events/?publicados_only=true&size=50`);
    if (!res.ok) throw new Error("Erro ao carregar eventos.");
    const data = await res.json();
    const events = data.items || [];

    if (!events.length) {
      container.innerHTML = '<p class="empty-state">Nenhum evento na linha do tempo.</p>';
      return;
    }

    const sorted = [...events].sort((a, b) => a.ordem - b.ordem);

    container.innerHTML = sorted
      .map((event) => {
        const imgUrl = getImageUrl(event.imagem_url);
        const hasImage = event.imagem_url;

        return `
        <article class="timeline-event">
          <div class="timeline-event__marker">
            <span class="timeline-event__date">${escapeHtml(event.data_evento)}</span>
          </div>
          <div class="timeline-event__content">
            ${hasImage ? `<img class="timeline-event__image" src="${imgUrl}" alt="${escapeHtml(event.titulo)}" loading="lazy">` : ""}
            <h3 class="timeline-event__title">${escapeHtml(event.titulo)}</h3>
            ${event.subtitulo ? `<p class="timeline-event__subtitle">${escapeHtml(event.subtitulo)}</p>` : ""}
            <p class="timeline-event__desc">${escapeHtml(event.descricao)}</p>
            ${event.link_externo ? `<a class="timeline-event__link" href="${escapeHtml(event.link_externo)}" target="_blank" rel="noopener">Saiba mais &rarr;</a>` : ""}
          </div>
        </article>
      `;
      })
      .join("");
  } catch (error) {
    container.innerHTML = '<p class="empty-state">Erro ao carregar eventos.</p>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPostais();
  loadTimeline();
});
