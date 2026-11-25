const API_BASE_URL = window.API_BASE_URL || window.__API_BASE__ || "/api";
const TOKEN_KEY = "admin_token";

// === Token Management ===
function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  if (payload.exp && Date.now() / 1000 >= payload.exp) return false;
  return true;
}

// === API Helpers ===
function getApiUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request(path, { method = "GET", body = null, auth = true, parseJson = true } = {}) {
  const token = getToken();
  const headers = {};

  if (!(body instanceof FormData)) {
    headers.Accept = "application/json";
  }

  if (auth && token && isTokenValid(token)) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
  }

  let response;
  try {
    response = await fetch(getApiUrl(path), options);
  } catch {
    throw new Error(
      "Nao foi possivel conectar a API. O servidor pode estar iniciando; tente novamente em alguns segundos."
    );
  }

  if (response.status === 401) {
    clearToken();
    if (window.location.pathname.includes("/admin/") && !window.location.pathname.endsWith("login.html")) {
      window.location.href = "login.html";
    }
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  if (!response.ok) {
    let message = "Falha ao comunicar com a API.";
    try {
      const data = await response.json();
      message = data.detail || data.message || data.error || message;
    } catch {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch {}
    }
    throw new Error(message);
  }

  if (parseJson && response.status !== 204) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  return null;
}

function normalizeCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.results)) return payload.results;
  }
  return [];
}

function getResourceId(item) {
  return item?.id || item?.postal_id || item?.post_id || "";
}

function getImageUrl(value) {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  if (value.startsWith("/images/")) return `${window.location.origin}${value}`;
  if (value.startsWith("/static/")) return `${window.API_ORIGIN || ""}${value}`;
  return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// === Toast System ===
let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    toastContainer.setAttribute("aria-live", "polite");
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(message, type = "info", duration = 4000) {
  const container = ensureToastContainer();
  const icons = { success: "\u2713", error: "\u2717", info: "\u2139" };

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${icons[type] || icons.info}</span>
    <span class="toast__message">${escapeHtml(message)}</span>
    <button class="toast__close" aria-label="Fechar" type="button">\u00d7</button>
  `;

  toast.querySelector(".toast__close").addEventListener("click", () => removeToast(toast));
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }

  return toast;
}

function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.add("is-leaving");
  setTimeout(() => toast.remove(), 300);
}

// === Confirm Dialog ===
function showConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.innerHTML = `
      <div class="confirm-dialog" role="dialog" aria-labelledby="confirm-title">
        <div class="confirm-dialog__icon" aria-hidden="true">\u26a0</div>
        <h3 id="confirm-title" class="confirm-dialog__title">${escapeHtml(title)}</h3>
        <p class="confirm-dialog__message">${escapeHtml(message)}</p>
        <div class="confirm-dialog__actions">
          <button class="btn btn--outline confirm-cancel" type="button">Cancelar</button>
          <button class="btn btn--danger confirm-ok" type="button">Confirmar</button>
        </div>
      </div>
    `;

    const close = (result) => {
      overlay.classList.remove("is-visible");
      setTimeout(() => overlay.remove(), 300);
      resolve(result);
    };

    overlay.querySelector(".confirm-cancel").addEventListener("click", () => close(false));
    overlay.querySelector(".confirm-ok").addEventListener("click", () => close(true));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-visible"));

    overlay.querySelector(".confirm-ok").focus();
  });
}

// === Loading State ===
function showLoading(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="skeleton skeleton--card"></div>
    <div class="skeleton skeleton--card"></div>
    <div class="skeleton skeleton--card"></div>
  `;
}

// === Dashboard ===
let allPostais = [];
let allPosts = [];
let allTimeline = [];

async function loadDashboard() {
  const sections = ["postal-list", "posts-list", "timeline-list"];
  sections.forEach((id) => showLoading(document.getElementById(id)));

  try {
    const [postaisResponse, postsResponse, timelineResponse] = await Promise.all([
      request("/postais?size=100"),
      request("/posts?size=100"),
      request("/timeline-events?size=100"),
    ]);

    allPostais = normalizeCollection(postaisResponse);
    allPosts = normalizeCollection(postsResponse);
    allTimeline = normalizeCollection(timelineResponse);

    animateCounters();
    renderPostais(allPostais);
    renderPosts(allPosts);
    renderTimeline(allTimeline);
    updateTabCounts();
  } catch (error) {
    const errorMessage = error.message || "Nao foi possivel carregar os dados.";
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">\u26a0</div><h4 class="empty-state__title">Erro ao carregar</h4><p class="empty-state__text">${escapeHtml(errorMessage)}</p></div>`;
      }
    });
  }
}

function animateCounters() {
  const counters = [
    { el: document.getElementById("stat-postais"), value: allPostais.length },
    { el: document.getElementById("stat-posts"), value: allPosts.length },
    { el: document.getElementById("stat-publicados"), value: allPosts.filter((p) => p.status === "published").length },
    { el: document.getElementById("stat-timeline"), value: allTimeline.length },
    {
      el: document.getElementById("stat-epocas"),
      value: new Set(allPostais.map((p) => p.epoca).filter(Boolean)).size,
    },
  ];

  counters.forEach(({ el, value }) => {
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    if (start === value) return;
    const duration = 600;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (value - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

function updateTabCounts() {
  const tabs = {
    "tab-postais": allPostais.length,
    "tab-posts": allPosts.length,
    "tab-timeline": allTimeline.length,
  };
  Object.entries(tabs).forEach(([id, count]) => {
    const badge = document.querySelector(`#${id} .tab-count`);
    if (badge) badge.textContent = count;
  });
}

// === Render Functions ===
function renderPostais(postais) {
  const container = document.getElementById("postal-list");
  if (!container) return;

  if (!postais.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">\u2709</div><h4 class="empty-state__title">Nenhum postal no acervo</h4><p class="empty-state__text">Adicione o primeiro registro historico para iniciar o acervo visual do museu.</p></div>`;
    return;
  }

  container.innerHTML = postais
    .map((postal, i) => {
      const id = getResourceId(postal);
      const imgUrl = getImageUrl(postal.imagem_url);
      return `
      <article class="archive-card" style="animation-delay:${i * 0.05}s">
        ${imgUrl ? `<img class="archive-card__image" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(postal.titulo)}" loading="lazy">` : ""}
        <div class="archive-card__content">
          <h3 class="archive-card__title">${escapeHtml(postal.titulo || "Sem titulo")}</h3>
          <p class="archive-card__excerpt">${escapeHtml(postal.descricao || "Sem descricao")}</p>
          <div class="archive-card__meta">
            ${postal.epoca ? `<span class="archive-card__tag">${escapeHtml(postal.epoca)}</span>` : ""}
            ${postal.localizacao ? `<span class="archive-card__tag">${escapeHtml(postal.localizacao)}</span>` : ""}
          </div>
        </div>
        <div class="archive-card__actions">
          <button class="btn btn--outline btn--small" data-action="edit" data-type="postal" data-id="${id}">Editar</button>
          <button class="btn btn--danger btn--small" data-action="delete" data-type="postal" data-id="${id}">Excluir</button>
        </div>
      </article>`;
    })
    .join("");
}

function renderPosts(posts) {
  const container = document.getElementById("posts-list");
  if (!container) return;

  if (!posts.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">\u270e</div><h4 class="empty-state__title">Nenhum texto publicado</h4><p class="empty-state__text">Cronicas, estudos ou artigos que contam a historia de Parnaiba.</p></div>`;
    return;
  }

  const catLabels = { cronica: "Cronica", noticia: "Noticia", manchete: "Manchete", estudo: "Estudo" };
  const statusLabels = { draft: "Rascunho", scheduled: "Agendado", published: "Publicado", archived: "Arquivado" };

  container.innerHTML = posts
    .map((post, i) => {
      const id = getResourceId(post);
      const imgUrl = getImageUrl(post.imagem_capa_url);
      const status = post.status || "draft";
      return `
      <article class="archive-card" style="animation-delay:${i * 0.05}s">
        ${imgUrl ? `<img class="archive-card__image" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(post.titulo)}" loading="lazy">` : ""}
        <div class="archive-card__content">
          <h3 class="archive-card__title">${escapeHtml(post.titulo || "Sem titulo")}</h3>
          ${post.subtitulo ? `<p class="archive-card__subtitle">${escapeHtml(post.subtitulo)}</p>` : ""}
          <p class="archive-card__excerpt">${escapeHtml(post.resumo || post.conteudo || "Sem conteudo")}</p>
          <div class="archive-card__meta">
            ${post.autor ? `<span class="archive-card__tag">${escapeHtml(post.autor)}</span>` : ""}
            ${post.categoria ? `<span class="archive-card__tag">${escapeHtml(catLabels[post.categoria] || post.categoria)}</span>` : ""}
            <span class="archive-card__tag archive-card__tag--status" data-status="${status}">${statusLabels[status] || status}</span>
            ${post.publicado_em ? `<span class="archive-card__tag">${escapeHtml(new Date(post.publicado_em).toLocaleDateString("pt-BR"))}</span>` : ""}
          </div>
        </div>
        <div class="archive-card__actions">
          <button class="btn btn--outline btn--small" data-action="edit" data-type="post" data-id="${id}">Editar</button>
          <button class="btn btn--danger btn--small" data-action="delete" data-type="post" data-id="${id}">Excluir</button>
        </div>
      </article>`;
    })
    .join("");
}

function renderTimeline(events) {
  const container = document.getElementById("timeline-list");
  if (!container) return;

  if (!events.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">\u25c9</div><h4 class="empty-state__title">Nenhum evento na linha do tempo</h4><p class="empty-state__text">Adicione eventos historicos que marcaram a trajetoria de Parnaiba.</p></div>`;
    return;
  }

  container.innerHTML = events
    .map((event, i) => {
      const id = getResourceId(event);
      const imgUrl = getImageUrl(event.imagem_url);
      return `
      <article class="archive-card" style="animation-delay:${i * 0.05}s">
        ${imgUrl ? `<img class="archive-card__image" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(event.titulo)}" loading="lazy">` : ""}
        <div class="archive-card__content">
          <h3 class="archive-card__title">${escapeHtml(event.titulo || "Sem titulo")}</h3>
          <p class="archive-card__excerpt">${escapeHtml(event.descricao || "Sem descricao")}</p>
          <div class="archive-card__meta">
            ${event.data_evento ? `<span class="archive-card__tag">${escapeHtml(event.data_evento)}</span>` : ""}
            <span class="archive-card__tag">Ordem: ${event.ordem}</span>
            <span class="archive-card__tag archive-card__tag--status" data-status="${event.publicado ? "published" : "draft"}">${event.publicado ? "Publicado" : "Rascunho"}</span>
          </div>
        </div>
        <div class="archive-card__actions">
          <button class="btn btn--outline btn--small" data-action="edit" data-type="timeline" data-id="${id}">Editar</button>
          <button class="btn btn--danger btn--small" data-action="delete" data-type="timeline" data-id="${id}">Excluir</button>
        </div>
      </article>`;
    })
    .join("");
}

// === Tab Navigation ===
function setupTabs() {
  const tabs = document.querySelectorAll(".admin-nav__tab");
  const sections = {
    "tab-postais": "postal-section",
    "tab-posts": "posts-section",
    "tab-timeline": "timeline-section",
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("admin-nav__tab--active"));
      tab.classList.add("admin-nav__tab--active");

      const targetId = sections[tab.id];
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  // Update active tab on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const tabId = Object.entries(sections).find(([, sId]) => sId === entry.target.id)?.[0];
          if (tabId) {
            tabs.forEach((t) => t.classList.remove("admin-nav__tab--active"));
            document.getElementById(tabId)?.classList.add("admin-nav__tab--active");
          }
        }
      });
    },
    { rootMargin: "-20% 0px -70% 0px" }
  );

  Object.values(sections).forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

// === Search ===
function setupSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = e.target.value.toLowerCase().trim();

      if (!query) {
        renderPostais(allPostais);
        renderPosts(allPosts);
        renderTimeline(allTimeline);
        return;
      }

      renderPostais(
        allPostais.filter(
          (p) =>
            (p.titulo && p.titulo.toLowerCase().includes(query)) ||
            (p.epoca && p.epoca.toLowerCase().includes(query)) ||
            (p.localizacao && p.localizacao.toLowerCase().includes(query)) ||
            (p.descricao && p.descricao.toLowerCase().includes(query))
        )
      );

      renderPosts(
        allPosts.filter(
          (p) =>
            (p.titulo && p.titulo.toLowerCase().includes(query)) ||
            (p.autor && p.autor.toLowerCase().includes(query)) ||
            (p.categoria && p.categoria.toLowerCase().includes(query)) ||
            (p.conteudo && p.conteudo.toLowerCase().includes(query))
        )
      );

      renderTimeline(
        allTimeline.filter(
          (t) =>
            (t.titulo && t.titulo.toLowerCase().includes(query)) ||
            (t.descricao && t.descricao.toLowerCase().includes(query)) ||
            (t.data_evento && t.data_evento.toLowerCase().includes(query))
        )
      );
    }, 250);
  });
}

// === Modal ===
async function openModal(type, id = null) {
  const modal = document.getElementById("entity-modal");
  const title = document.getElementById("modal-title");
  const form = document.getElementById("entity-form");
  const entityId = document.getElementById("entity-id");
  const postalFields = document.getElementById("postal-fields");
  const postFields = document.getElementById("post-fields");
  const timelineFields = document.getElementById("timeline-fields");
  const submitText = document.getElementById("submit-text");

  if (!modal || !form) return;

  form.reset();
  clearFormPreview();
  clearFormFeedback();

  postalFields.classList.add("is-hidden");
  postFields.classList.add("is-hidden");
  timelineFields.classList.add("is-hidden");

  if (type === "postal") {
    postalFields.classList.remove("is-hidden");
    title.textContent = id ? "Editar Postal" : "Novo Postal";
    submitText.textContent = id ? "Salvar Alteracoes" : "Criar Postal";
  } else if (type === "post") {
    postFields.classList.remove("is-hidden");
    title.textContent = id ? "Editar Texto" : "Novo Texto";
    submitText.textContent = id ? "Salvar Alteracoes" : "Publicar Texto";
  } else if (type === "timeline") {
    timelineFields.classList.remove("is-hidden");
    title.textContent = id ? "Editar Evento" : "Novo Evento";
    submitText.textContent = id ? "Salvar Alteracoes" : "Criar Evento";
  }

  form.dataset.type = type;
  entityId.value = id || "";

  if (id) {
    try {
      const pathMap = {
        postal: `/postais/${id}`,
        post: `/posts/${id}`,
        timeline: `/timeline-events/${id}`,
      };
      const item = await request(pathMap[type]);

      if (type === "postal") {
        setValue("field-title", item.titulo);
        setValue("field-epoca", item.epoca);
        setValue("field-localizacao", item.localizacao);
        setValue("field-description", item.descricao);
        showPreview(item.imagem_url);
      } else if (type === "post") {
        setValue("field-title-post", item.titulo);
        setValue("field-subtitulo-post", item.subtitulo);
        setValue("field-author", item.autor);
        setValue("field-category", item.categoria);
        setValue("field-content", item.conteudo);
        setValue("field-resumo-post", item.resumo);
        // Set status radio
        const statusValue = item.status || "draft";
        const statusRadio = document.querySelector(`input[name="status_post"][value="${statusValue}"]`);
        if (statusRadio) statusRadio.checked = true;
        toggleScheduledDate(statusValue);
        if (item.publicado_em) {
          const dt = new Date(item.publicado_em);
          const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setValue("field-scheduled-date", local);
        }
        showPreview(item.imagem_capa_url);
      } else if (type === "timeline") {
        setValue("field-titulo-evento", item.titulo);
        setValue("field-data-evento", item.data_evento);
        setValue("field-ordem", item.ordem);
        setValue("field-subtitulo-evento", item.subtitulo);
        setValue("field-descricao-evento", item.descricao);
        setValue("field-link-externo", item.link_externo);
        const pub = document.getElementById("field-publicado-evento");
        if (pub) pub.checked = item.publicado;
        showPreview(item.imagem_url);
      }
    } catch (error) {
      showToast(error.message || "Nao foi possivel carregar o item para edicao.", "error");
      return;
    }
  }

  modal.classList.remove("is-hidden");
  modal.classList.add("is-visible");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.value = value;
}

function showPreview(url) {
  if (!url) return;
  const preview = document.getElementById("form-preview");
  if (preview) {
    preview.src = getImageUrl(url);
    preview.classList.add("is-visible");
  }
}

function clearFormPreview() {
  const preview = document.getElementById("form-preview");
  if (preview) {
    preview.src = "";
    preview.classList.remove("is-visible");
  }
  const fileInput = document.getElementById("field-image");
  if (fileInput) fileInput.value = "";
}

function clearFormFeedback() {
  const feedback = document.getElementById("form-feedback");
  if (feedback) {
    feedback.textContent = "";
    feedback.classList.remove("is-error");
  }
}

function closeModal() {
  const modal = document.getElementById("entity-modal");
  if (!modal) return;

  modal.classList.remove("is-visible");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  setTimeout(() => modal.classList.add("is-hidden"), 300);
}

function previewSelectedFile() {
  const input = document.getElementById("field-image");
  const preview = document.getElementById("form-preview");
  if (!input || !preview) return;

  const file = input.files?.[0];
  if (!file) {
    preview.src = "";
    preview.classList.remove("is-visible");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    preview.src = event.target.result;
    preview.classList.add("is-visible");
  };
  reader.readAsDataURL(file);
}

// === Drag & Drop ===
function setupDragDrop() {
  const zone = document.getElementById("file-upload-area");
  if (!zone) return;

  ["dragenter", "dragover"].forEach((evt) => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((evt) => {
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove("is-dragover");
    });
  });

  zone.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const input = document.getElementById("field-image");
    if (input) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("change"));
    }
  });
}

// === Form Submit ===
async function submitForm(event) {
  event.preventDefault();
  const form = document.getElementById("entity-form");
  const submitText = document.getElementById("submit-text");
  if (!form) return;

  const type = form.dataset.type || "postal";
  const id = document.getElementById("entity-id").value;

  submitText.textContent = "Salvando...";
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  let imageUrl = null;
  const imageInput = document.getElementById("field-image");

  if (imageInput?.files?.[0]) {
    const uploadData = new FormData();
    uploadData.set("file", imageInput.files[0]);
    try {
      const uploadResult = await request("/upload", {
        method: "POST",
        body: uploadData,
        auth: true,
      });
      imageUrl = uploadResult.url;
    } catch (error) {
      showFeedback(error.message || "Falha no upload da imagem.", true);
      submitText.textContent = "Salvar";
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
  }

  let body;
  const pathMap = {
    postal: "/postais",
    post: "/posts",
    timeline: "/timeline-events",
  };

  if (type === "postal") {
    body = {
      titulo: document.getElementById("field-title")?.value || "",
      descricao: document.getElementById("field-description")?.value || "",
      epoca: document.getElementById("field-epoca")?.value || "",
      localizacao: document.getElementById("field-localizacao")?.value || "",
    };
    if (imageUrl) body.imagem_url = imageUrl;
  } else if (type === "post") {
    body = {
      titulo: document.getElementById("field-title-post")?.value || "",
      subtitulo: document.getElementById("field-subtitulo-post")?.value || null,
      autor: document.getElementById("field-author")?.value || "",
      categoria: document.getElementById("field-category")?.value || "",
      resumo: document.getElementById("field-resumo-post")?.value || null,
      conteudo: document.getElementById("field-content")?.value || "",
      status: document.querySelector('input[name="status_post"]:checked')?.value || "draft",
    };
    if (imageUrl) body.imagem_capa_url = imageUrl;
    // If scheduled, include publicado_em
    if (body.status === "scheduled") {
      const schedDate = document.getElementById("field-scheduled-date")?.value;
      if (schedDate) body.publicado_em = new Date(schedDate).toISOString();
    }
  } else if (type === "timeline") {
    body = {
      titulo: document.getElementById("field-titulo-evento")?.value || "",
      data_evento: document.getElementById("field-data-evento")?.value || "",
      ordem: parseInt(document.getElementById("field-ordem")?.value || "0", 10),
      subtitulo: document.getElementById("field-subtitulo-evento")?.value || "",
      descricao: document.getElementById("field-descricao-evento")?.value || "",
      link_externo: document.getElementById("field-link-externo")?.value || null,
      publicado: document.getElementById("field-publicado-evento")?.checked ?? true,
    };
    if (imageUrl) body.imagem_url = imageUrl;
  }

  const path = id ? `${pathMap[type]}/${id}` : pathMap[type];

  try {
    await request(path, { method: id ? "PUT" : "POST", body, auth: true });
    showToast(id ? "Registro atualizado com sucesso!" : "Registro criado com sucesso!", "success");
    setTimeout(() => {
      closeModal();
      loadDashboard();
    }, 600);
  } catch (error) {
    showFeedback(error.message || "Nao foi possivel salvar.", true);
    showToast(error.message || "Erro ao salvar registro.", "error");
  } finally {
    submitText.textContent = "Salvar";
    if (submitBtn) submitBtn.disabled = false;
  }
}

function showFeedback(message, isError) {
  const feedback = document.getElementById("form-feedback");
  if (feedback) {
    feedback.textContent = message;
    feedback.classList.toggle("is-error", isError);
  }
}

// === Password Modal ===
function openPasswordModal() {
  const modal = document.getElementById("password-modal");
  const form = document.getElementById("password-form");
  if (!modal || !form) return;

  form.reset();
  const feedback = document.getElementById("password-feedback");
  if (feedback) feedback.textContent = "";

  modal.classList.remove("is-hidden");
  modal.classList.add("is-visible");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => document.getElementById("password-current")?.focus(), 100);
}

function closePasswordModal() {
  const modal = document.getElementById("password-modal");
  if (!modal) return;

  modal.classList.remove("is-visible");
  modal.setAttribute("aria-hidden", "true");
  setTimeout(() => modal.classList.add("is-hidden"), 300);
}

function showPasswordFeedback(message, isError) {
  const feedback = document.getElementById("password-feedback");
  if (feedback) {
    feedback.textContent = message;
    feedback.classList.toggle("is-error", isError);
  }
}

async function submitPasswordForm(event) {
  event.preventDefault();
  const form = document.getElementById("password-form");
  const submitText = document.getElementById("password-submit-text");
  if (!form) return;

  const current = document.getElementById("password-current").value;
  const next = document.getElementById("password-new").value;
  const confirm = document.getElementById("password-confirm").value;

  if (next !== confirm) {
    showPasswordFeedback("As senhas novas nao coincidem.", true);
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitText.textContent = "Salvando...";
  if (submitBtn) submitBtn.disabled = true;

  try {
    await request("/auth/change-password", {
      method: "POST",
      body: { current_password: current, new_password: next },
      auth: true,
    });
    showToast("Senha alterada com sucesso!", "success");
    setTimeout(closePasswordModal, 600);
  } catch (error) {
    showPasswordFeedback(error.message || "Nao foi possivel alterar a senha.", true);
  } finally {
    submitText.textContent = "Alterar Senha";
    if (submitBtn) submitBtn.disabled = false;
  }
}

function toggleScheduledDate(status) {
  const wrapper = document.getElementById("scheduled-date-wrapper");
  if (!wrapper) return;
  if (status === "scheduled") {
    wrapper.classList.remove("is-hidden");
  } else {
    wrapper.classList.add("is-hidden");
  }
}

// === Delete ===
async function handleDelete(type, id) {
  const labels = {
    postal: "postal",
    post: "texto",
    timeline: "evento",
  };

  const confirmed = await showConfirm(
    `Excluir ${labels[type]}`,
    `Tem certeza que deseja excluir este ${labels[type]}? Esta acao nao pode ser desfeita.`
  );

  if (!confirmed) return;

  try {
    const pathMap = {
      postal: `/postais/${id}`,
      post: `/posts/${id}`,
      timeline: `/timeline-events/${id}`,
    };
    await request(pathMap[type], { method: "DELETE" });
    showToast(`${labels[type].charAt(0).toUpperCase() + labels[type].slice(1)} excluido com sucesso!`, "success");
    await loadDashboard();
  } catch (error) {
    showToast(error.message || "Nao foi possivel excluir.", "error");
  }
}

// === Keyboard Shortcuts ===
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Ignore if inside form input
    if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

    // Escape: close modal
    if (e.key === "Escape") {
      const modal = document.getElementById("entity-modal");
      if (modal && modal.classList.contains("is-visible")) {
        closeModal();
        return;
      }
      const passwordModal = document.getElementById("password-modal");
      if (passwordModal && passwordModal.classList.contains("is-visible")) {
        closePasswordModal();
        return;
      }
    }

    // Ctrl/Cmd + K: focus search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      document.getElementById("search-input")?.focus();
      return;
    }

    // Ctrl/Cmd + N: new postal
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      openModal("postal");
      return;
    }
  });
}

// === Init ===
document.addEventListener("DOMContentLoaded", () => {
  // Login page
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    const token = getToken();
    if (token && isTokenValid(token)) {
      window.location.href = "index.html";
      return;
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const errorBox = document.getElementById("login-error");
      const btn = loginForm.querySelector('button[type="submit"]');

      if (btn) {
        btn.disabled = true;
        btn.textContent = "Entrando...";
      }

      try {
        const result = await request("/auth/login", {
          method: "POST",
          body: { username, password },
          auth: false,
        });

        const tokenValue = result.access_token || result.token || result.accessToken;
        if (!tokenValue) throw new Error("O servidor nao retornou um token valido.");

        storeToken(tokenValue);
        window.location.href = "index.html";
      } catch (error) {
        if (errorBox) {
          errorBox.textContent = error.message || "Nao foi possivel fazer login.";
          errorBox.classList.add("is-visible");
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Entrar no Painel";
        }
      }
    });
    return;
  }

  // Dashboard page
  const token = getToken();
  if (!token || !isTokenValid(token)) {
    window.location.href = "login.html";
    return;
  }

  // Logout
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    clearToken();
    window.location.href = "login.html";
  });

  // Mobile menu toggle
  const toggleBtn = document.querySelector(".admin-header__toggle");
  const mobileNav = document.querySelector(".admin-header__mobile");
  if (toggleBtn && mobileNav) {
    toggleBtn.addEventListener("click", () => {
      const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
      toggleBtn.setAttribute("aria-expanded", String(!expanded));
      mobileNav.hidden = expanded;
    });
  }

  // Mobile logout
  document.getElementById("logout-btn-mobile")?.addEventListener("click", () => {
    clearToken();
    window.location.href = "login.html";
  });

  // New buttons
  document.getElementById("new-postal-btn")?.addEventListener("click", () => openModal("postal"));
  document.getElementById("new-post-btn")?.addEventListener("click", () => openModal("post"));
  document.getElementById("new-timeline-btn")?.addEventListener("click", () => openModal("timeline"));

  // Modal controls
  document.getElementById("close-modal")?.addEventListener("click", closeModal);
  document.getElementById("cancel-form")?.addEventListener("click", closeModal);
  document.querySelector(".modal-backdrop")?.addEventListener("click", closeModal);
  document.getElementById("entity-form")?.addEventListener("submit", submitForm);
  document.getElementById("field-image")?.addEventListener("change", previewSelectedFile);

  // Password modal
  document.getElementById("password-btn")?.addEventListener("click", openPasswordModal);
  document.getElementById("password-btn-mobile")?.addEventListener("click", () => {
    const mobileNav = document.querySelector(".admin-header__mobile");
    if (mobileNav) mobileNav.hidden = true;
    openPasswordModal();
  });
  document.getElementById("close-password-modal")?.addEventListener("click", closePasswordModal);
  document.getElementById("cancel-password")?.addEventListener("click", closePasswordModal);
  document.querySelector("#password-modal .modal-backdrop")?.addEventListener("click", closePasswordModal);
  document.getElementById("password-form")?.addEventListener("submit", submitPasswordForm);

  // Click actions (edit/delete)
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const { action, type, id } = button.dataset;
    if (action === "edit") await openModal(type, id);
    if (action === "delete") handleDelete(type, id);
  });

  // Search
  setupSearch();

  // Tabs
  setupTabs();

  // Drag & drop
  setupDragDrop();

  // Keyboard shortcuts
  setupKeyboardShortcuts();

  // Status radio toggle for scheduled date
  document.querySelectorAll('input[name="status_post"]').forEach((radio) => {
    radio.addEventListener("change", (e) => toggleScheduledDate(e.target.value));
  });

  // Load data
  loadDashboard();
});
