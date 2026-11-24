const API_BASE = window.API_BASE_URL || window.__API_BASE__ || "/api";
const FRONTEND_BASE = "";

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getImageUrl(imagemUrl) {
  if (!imagemUrl) return "../images/postal-antigo-01.png";
  if (imagemUrl.startsWith("http")) return imagemUrl;
  if (imagemUrl.startsWith("/images/")) return `..${imagemUrl}`;
  if (imagemUrl.startsWith("/static/")) return imagemUrl;
  return imagemUrl;
}

let allPostais = [];
let activeDecade = "all";
let activeLocation = "all";
let sortMode = "recent";
let searchQuery = "";

function getDecade(epoca) {
  if (!epoca) return null;
  const match = epoca.match(/(\d{4})/);
  if (!match) return null;
  return Math.floor(parseInt(match[1]) / 10) * 10;
}

function renderPostais(postais) {
  const grid = document.getElementById("dynamic-gallery");
  const emptyMsg = document.getElementById("galeria-empty");
  const countEl = document.getElementById("galeria-count");
  if (!grid) return;

  if (countEl) countEl.textContent = postais.length;

  if (!postais.length) {
    grid.innerHTML = "";
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";

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
}

function applyFilters() {
  let filtered = [...allPostais];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((p) => {
      const titulo = (p.titulo || "").toLowerCase();
      const epoca = (p.epoca || "").toLowerCase();
      const localizacao = (p.localizacao || "").toLowerCase();
      const descricao = (p.descricao || "").toLowerCase();
      return titulo.includes(q) || epoca.includes(q) || localizacao.includes(q) || descricao.includes(q);
    });
  }

  if (activeDecade !== "all") {
    const decade = parseInt(activeDecade);
    filtered = filtered.filter((p) => {
      const d = getDecade(p.epoca);
      return d === decade;
    });
  }

  if (activeLocation !== "all") {
    filtered = filtered.filter((p) => {
      return (p.localizacao || "").toLowerCase() === activeLocation.toLowerCase();
    });
  }

  if (sortMode === "recent") {
    filtered.sort((a, b) => {
      const ya = parseInt((a.epoca || "0").match(/\d{4}/)?.[0] || "0");
      const yb = parseInt((b.epoca || "0").match(/\d{4}/)?.[0] || "0");
      return yb - ya;
    });
  } else if (sortMode === "oldest") {
    filtered.sort((a, b) => {
      const ya = parseInt((a.epoca || "9999").match(/\d{4}/)?.[0] || "9999");
      const yb = parseInt((b.epoca || "9999").match(/\d{4}/)?.[0] || "9999");
      return ya - yb;
    });
  } else if (sortMode === "name") {
    filtered.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));
  }

  renderPostais(filtered);
}

function buildLocationChips() {
  const container = document.getElementById("location-chips");
  if (!container) return;

  const locations = [...new Set(allPostais.map((p) => p.localizacao).filter(Boolean))].sort();

  container.innerHTML = `<button class="galeria-chip is-active" type="button" data-location="all">Todos</button>` +
    locations
      .map(
        (loc) =>
          `<button class="galeria-chip" type="button" data-location="${escapeHtml(loc)}">${escapeHtml(loc)}</button>`
      )
      .join("");
}

async function loadPostais() {
  const grid = document.getElementById("dynamic-gallery");
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/postais?size=50`);
    if (!res.ok) throw new Error("Erro ao carregar postais.");
    const data = await res.json();
    allPostais = data.items || [];

    if (!allPostais.length) {
      grid.innerHTML = '<p class="empty-state">Nenhum postal cadastrado ainda.</p>';
      return;
    }

    buildLocationChips();
    applyFilters();
  } catch (error) {
    grid.innerHTML = '<p class="empty-state">Erro ao carregar postais.</p>';
  }
}

async function loadTimeline() {
  const container = document.getElementById("dynamic-timeline");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/timeline-events?publicados_only=true&size=50`);
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

  const searchInput = document.getElementById("galeria-search-input");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = e.target.value;
        applyFilters();
      }, 250);
    });

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  document.getElementById("decade-chips")?.addEventListener("click", (e) => {
    const chip = e.target.closest(".galeria-chip");
    if (!chip) return;
    document.querySelectorAll("#decade-chips .galeria-chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    activeDecade = chip.dataset.decade;
    applyFilters();
  });

  document.getElementById("location-chips")?.addEventListener("click", (e) => {
    const chip = e.target.closest(".galeria-chip");
    if (!chip) return;
    document.querySelectorAll("#location-chips .galeria-chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    activeLocation = chip.dataset.location;
    applyFilters();
  });

  document.getElementById("galeria-sort")?.addEventListener("change", (e) => {
    sortMode = e.target.value;
    applyFilters();
  });
});
