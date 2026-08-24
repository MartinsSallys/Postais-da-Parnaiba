const API_BASE_URL = window.API_BASE_URL || window.__API_BASE__ || "http://localhost:8001";
const TOKEN_KEY = "admin_token";

// === Token Management ===
function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
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

  const response = await fetch(getApiUrl(path), options);

  if (response.status === 401) {
    clearToken();
    if (window.location.pathname.includes("/admin/") && !window.location.pathname.endsWith("login.html")) {
      window.location.href = "login.html";
    }
    throw new Error("Sessão expirada. Faça login novamente.");
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
  return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

// === Dashboard ===
let allPostais = [];
let allPosts = [];
let allCronicas = [];
let allTimeline = [];

async function loadDashboard() {
  try {
    const [postaisResponse, postsResponse, cronicasResponse, timelineResponse] = await Promise.all([
      request("/postais?size=100"),
      request("/posts?size=100"),
      request("/cronicas?size=100"),
      request("/timeline-events?size=100")
    ]);

    allPostais = normalizeCollection(postaisResponse);
    allPosts = normalizeCollection(postsResponse);
    allCronicas = normalizeCollection(cronicasResponse);
    allTimeline = normalizeCollection(timelineResponse);

    updateStats();
    renderPostais(allPostais);
    renderPosts(allPosts);
    renderCronicas(allCronicas);
    renderTimeline(allTimeline);
  } catch (error) {
    const errorMessage = error.message || "Não foi possível carregar os dados.";
    document.querySelectorAll(".admin-collection__grid").forEach((el) => {
      el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">&#9888;</div><h4 class="empty-state__title">Erro ao carregar</h4><p class="empty-state__text">${errorMessage}</p></div>`;
    });
  }
}

function updateStats() {
  const statPostais = document.getElementById("stat-postais");
  const statPosts = document.getElementById("stat-posts");
  const statCronicas = document.getElementById("stat-cronicas");
  const statTimeline = document.getElementById("stat-timeline");
  const statEpocas = document.getElementById("stat-epocas");

  if (statPostais) statPostais.textContent = allPostais.length;
  if (statPosts) statPosts.textContent = allPosts.length;
  if (statCronicas) statCronicas.textContent = allCronicas.length;
  if (statTimeline) statTimeline.textContent = allTimeline.length;
  if (statEpocas) {
    const epocas = new Set(allPostais.map((p) => p.epoca).filter(Boolean));
    statEpocas.textContent = epocas.size;
  }
}

// === Render Functions ===
function renderPostais(postais) {
  const container = document.getElementById("postal-list");
  if (!container) return;

  if (!postais.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">&#9753;</div>
        <h4 class="empty-state__title">Nenhum postal no acervo</h4>
        <p class="empty-state__text">Adicione o primeiro registro histórico para iniciar o acervo visual do museu.</p>
      </div>`;
    return;
  }

  container.innerHTML = postais
    .map((postal) => {
      const id = getResourceId(postal);
      const imgUrl = getImageUrl(postal.imagem_url);
      return `
        <article class="archive-card">
          ${imgUrl ? `<img class="archive-card__image" src="${imgUrl}" alt="${postal.titulo}" loading="lazy">` : ""}
          <div class="archive-card__content">
            <h3 class="archive-card__title">${postal.titulo || "Sem título"}</h3>
            <p class="archive-card__excerpt">${postal.descricao || "Sem descrição"}</p>
            <div class="archive-card__meta">
              ${postal.epoca ? `<span class="archive-card__tag"><span class="archive-card__tag--icon">&#9673;</span> ${postal.epoca}</span>` : ""}
              ${postal.localizacao ? `<span class="archive-card__tag"><span class="archive-card__tag--icon">&#9873;</span> ${postal.localizacao}</span>` : ""}
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
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">&#9998;</div>
        <h4 class="empty-state__title">Nenhum texto publicado</h4>
        <p class="empty-state__text">Crie crônicas, estudos ou artigos que contem a história de Parnaíba.</p>
      </div>`;
    return;
  }

  const categoriaLabels = { cronica: "Crônica", noticia: "Notícia", manchete: "Manchete", estudo: "Estudo" };

  container.innerHTML = posts
    .map((post) => {
      const id = getResourceId(post);
      const imgUrl = getImageUrl(post.imagem_capa_url);
      return `
        <article class="archive-card">
          ${imgUrl ? `<img class="archive-card__image" src="${imgUrl}" alt="${post.titulo}" loading="lazy">` : ""}
          <div class="archive-card__content">
            <h3 class="archive-card__title">${post.titulo || "Sem título"}</h3>
            <p class="archive-card__excerpt">${post.conteudo || "Sem conteúdo"}</p>
            <div class="archive-card__meta">
              ${post.autor ? `<span class="archive-card__tag"><span class="archive-card__tag--icon">&#9998;</span> ${post.autor}</span>` : ""}
              ${post.categoria ? `<span class="archive-card__tag"><span class="archive-card__tag--icon">&#9673;</span> ${categoriaLabels[post.categoria] || post.categoria}</span>` : ""}
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

function renderCronicas(cronicas) {
  const container = document.getElementById("cronicas-list");
  if (!container) return;

  if (!cronicas.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">&#9998;</div>
        <h4 class="empty-state__title">Nenhuma crônica publicada</h4>
        <p class="empty-state__text">Crie crônicas que preservem a memória e a identidade de Parnaíba.</p>
      </div>`;
    return;
  }

  container.innerHTML = cronicas
    .map((cronica) => {
      const id = getResourceId(cronica);
      const imgUrl = getImageUrl(cronica.imagem_capa_url);
      return `
        <article class="archive-card">
          ${imgUrl ? `<img class="archive-card__image" src="${imgUrl}" alt="${cronica.titulo}" loading="lazy">` : ""}
          <div class="archive-card__content">
            <h3 class="archive-card__title">${cronica.titulo || "Sem título"}</h3>
            <p class="archive-card__excerpt">${cronica.resumo || cronica.conteudo || "Sem conteúdo"}</p>
            <div class="archive-card__meta">
              ${cronica.autor ? `<span class="archive-card__tag"><span class="archive-card__tag--icon">&#9998;</span> ${cronica.autor}</span>` : ""}
              <span class="archive-card__tag"><span class="archive-card__tag--icon">&#9673;</span> ${cronica.publicado ? "Publicado" : "Rascunho"}</span>
            </div>
          </div>
          <div class="archive-card__actions">
            <button class="btn btn--outline btn--small" data-action="edit" data-type="cronica" data-id="${id}">Editar</button>
            <button class="btn btn--danger btn--small" data-action="delete" data-type="cronica" data-id="${id}">Excluir</button>
          </div>
        </article>`;
    })
    .join("");
}

function renderTimeline(events) {
  const container = document.getElementById("timeline-list");
  if (!container) return;

  if (!events.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">&#9673;</div>
        <h4 class="empty-state__title">Nenhum evento na linha do tempo</h4>
        <p class="empty-state__text">Adicione eventos históricos que marcaram a trajetória de Parnaíba.</p>
      </div>`;
    return;
  }

  container.innerHTML = events
    .map((event) => {
      const id = getResourceId(event);
      const imgUrl = getImageUrl(event.imagem_url);
      return `
        <article class="archive-card">
          ${imgUrl ? `<img class="archive-card__image" src="${imgUrl}" alt="${event.titulo}" loading="lazy">` : ""}
          <div class="archive-card__content">
            <h3 class="archive-card__title">${event.titulo || "Sem título"}</h3>
            <p class="archive-card__excerpt">${event.descricao || "Sem descrição"}</p>
            <div class="archive-card__meta">
              ${event.data_evento ? `<span class="archive-card__tag"><span class="archive-card__tag--icon">&#9673;</span> ${event.data_evento}</span>` : ""}
              <span class="archive-card__tag"><span class="archive-card__tag--icon">&#9673;</span> Ordem: ${event.ordem}</span>
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

// === Search ===
function setupSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
      renderPostais(allPostais);
      renderPosts(allPosts);
      renderCronicas(allCronicas);
      renderTimeline(allTimeline);
      return;
    }

    const filteredPostais = allPostais.filter(
      (p) =>
        (p.titulo && p.titulo.toLowerCase().includes(query)) ||
        (p.epoca && p.epoca.toLowerCase().includes(query)) ||
        (p.localizacao && p.localizacao.toLowerCase().includes(query)) ||
        (p.descricao && p.descricao.toLowerCase().includes(query))
    );

    const filteredPosts = allPosts.filter(
      (p) =>
        (p.titulo && p.titulo.toLowerCase().includes(query)) ||
        (p.autor && p.autor.toLowerCase().includes(query)) ||
        (p.categoria && p.categoria.toLowerCase().includes(query)) ||
        (p.conteudo && p.conteudo.toLowerCase().includes(query))
    );

    const filteredCronicas = allCronicas.filter(
      (c) =>
        (c.titulo && c.titulo.toLowerCase().includes(query)) ||
        (c.autor && c.autor.toLowerCase().includes(query)) ||
        (c.conteudo && c.conteudo.toLowerCase().includes(query)) ||
        (c.resumo && c.resumo.toLowerCase().includes(query))
    );

    const filteredTimeline = allTimeline.filter(
      (t) =>
        (t.titulo && t.titulo.toLowerCase().includes(query)) ||
        (t.descricao && t.descricao.toLowerCase().includes(query)) ||
        (t.data_evento && t.data_evento.toLowerCase().includes(query))
    );

    renderPostais(filteredPostais);
    renderPosts(filteredPosts);
    renderCronicas(filteredCronicas);
    renderTimeline(filteredTimeline);
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
  const cronicaFields = document.getElementById("cronica-fields");
  const timelineFields = document.getElementById("timeline-fields");
  const submitText = document.getElementById("submit-text");

  if (!modal || !form) return;

  form.reset();
  clearFormPreview();
  clearFormFeedback();

  postalFields.classList.add("is-hidden");
  postFields.classList.add("is-hidden");
  cronicaFields.classList.add("is-hidden");
  timelineFields.classList.add("is-hidden");

  if (type === "postal") {
    postalFields.classList.remove("is-hidden");
    title.textContent = id ? "Editar Postal" : "Novo Postal";
    submitText.textContent = id ? "Salvar Alterações" : "Criar Postal";
  } else if (type === "post") {
    postFields.classList.remove("is-hidden");
    title.textContent = id ? "Editar Post" : "Novo Post";
    submitText.textContent = id ? "Salvar Alterações" : "Publicar Post";
  } else if (type === "cronica") {
    cronicaFields.classList.remove("is-hidden");
    title.textContent = id ? "Editar Crônica" : "Nova Crônica";
    submitText.textContent = id ? "Salvar Alterações" : "Publicar Crônica";
  } else if (type === "timeline") {
    timelineFields.classList.remove("is-hidden");
    title.textContent = id ? "Editar Evento" : "Novo Evento";
    submitText.textContent = id ? "Salvar Alterações" : "Criar Evento";
  }

  form.dataset.type = type;
  entityId.value = id || "";

  if (id) {
    try {
      const pathMap = { postal: `/postais/${id}`, post: `/posts/${id}`, cronica: `/cronicas/${id}`, timeline: `/timeline-events/${id}` };
      const item = await request(pathMap[type]);

      if (type === "postal") {
        setValue("field-title", item.titulo);
        setValue("field-epoca", item.epoca);
        setValue("field-localizacao", item.localizacao);
        setValue("field-description", item.descricao);
        showPreview(item.imagem_url);
      } else if (type === "post") {
        setValue("field-title-post", item.titulo);
        setValue("field-author", item.autor);
        setValue("field-category", item.categoria);
        setValue("field-content", item.conteudo);
        showPreview(item.imagem_capa_url);
      } else if (type === "cronica") {
        setValue("field-titulo-cronica", item.titulo);
        setValue("field-slug-cronica", item.slug);
        setValue("field-autor-cronica", item.autor);
        setValue("field-subtitulo-cronica", item.subtitulo);
        setValue("field-resumo-cronica", item.resumo);
        setValue("field-conteudo-cronica", item.conteudo);
        showPreview(item.imagem_capa_url);
      } else if (type === "timeline") {
        setValue("field-titulo-evento", item.titulo);
        setValue("field-data-evento", item.data_evento);
        setValue("field-ordem", item.ordem);
        setValue("field-subtitulo-evento", item.subtitulo);
        setValue("field-descricao-evento", item.descricao);
        setValue("field-link-externo", item.link_externo);
        showPreview(item.imagem_url);
      }
    } catch (error) {
      alert(error.message || "Não foi possível carregar o item para edição.");
      return;
    }
  }

  modal.classList.remove("is-hidden");
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

  modal.classList.add("is-hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
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
      const uploadResult = await request("/upload", { method: "POST", body: uploadData, auth: true });
      imageUrl = uploadResult.url;
    } catch (error) {
      showFeedback(error.message || "Falha no upload da imagem.", true);
      submitText.textContent = "Salvar";
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
  }

  let body;
  const pathMap = { postal: "/postais", post: "/posts", cronica: "/cronicas", timeline: "/timeline-events" };

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
      autor: document.getElementById("field-author")?.value || "",
      categoria: document.getElementById("field-category")?.value || "",
      conteudo: document.getElementById("field-content")?.value || "",
    };
    if (imageUrl) body.imagem_capa_url = imageUrl;
  } else if (type === "cronica") {
    body = {
      titulo: document.getElementById("field-titulo-cronica")?.value || "",
      slug: document.getElementById("field-slug-cronica")?.value || "",
      autor: document.getElementById("field-autor-cronica")?.value || "",
      subtitulo: document.getElementById("field-subtitulo-cronica")?.value || "",
      resumo: document.getElementById("field-resumo-cronica")?.value || "",
      conteudo: document.getElementById("field-conteudo-cronica")?.value || "",
      publicado: true,
    };
    if (imageUrl) body.imagem_capa_url = imageUrl;
  } else if (type === "timeline") {
    body = {
      titulo: document.getElementById("field-titulo-evento")?.value || "",
      data_evento: document.getElementById("field-data-evento")?.value || "",
      ordem: parseInt(document.getElementById("field-ordem")?.value || "0", 10),
      subtitulo: document.getElementById("field-subtitulo-evento")?.value || "",
      descricao: document.getElementById("field-descricao-evento")?.value || "",
      link_externo: document.getElementById("field-link-externo")?.value || null,
      publicado: true,
    };
    if (imageUrl) body.imagem_url = imageUrl;
  }

  const path = id ? `${pathMap[type]}/${id}` : pathMap[type];

  try {
    await request(path, { method: id ? "PUT" : "POST", body, auth: true });
    showFeedback("Registro salvo com sucesso!", false);
    setTimeout(() => {
      closeModal();
      loadDashboard();
    }, 800);
  } catch (error) {
    showFeedback(error.message || "Não foi possível salvar.", true);
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

// === Delete ===
async function handleDelete(type, id) {
  const confirmMessages = {
    postal: "Tem certeza que deseja excluir este postal? Esta ação não pode ser desfeita.",
    post: "Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.",
    cronica: "Tem certeza que deseja excluir esta crônica? Esta ação não pode ser desfeita.",
    timeline: "Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
  };

  if (!confirm(confirmMessages[type] || "Tem certeza que deseja excluir?")) return;

  try {
    const pathMap = { postal: `/postais/${id}`, post: `/posts/${id}`, cronica: `/cronicas/${id}`, timeline: `/timeline-events/${id}` };
    await request(pathMap[type], { method: "DELETE" });
    await loadDashboard();
  } catch (error) {
    alert(error.message || "Não foi possível excluir.");
  }
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

      try {
        const result = await request("/auth/login", {
          method: "POST",
          body: { username, password },
          auth: false,
        });

        const tokenValue = result.access_token || result.token || result.accessToken;
        if (!tokenValue) throw new Error("O servidor não retornou um token válido.");

        storeToken(tokenValue);
        window.location.href = "index.html";
      } catch (error) {
        if (errorBox) {
          errorBox.textContent = error.message || "Não foi possível fazer login.";
          errorBox.classList.add("is-visible");
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
  document.getElementById("new-cronica-btn")?.addEventListener("click", () => openModal("cronica"));
  document.getElementById("new-timeline-btn")?.addEventListener("click", () => openModal("timeline"));

  // Modal controls
  document.getElementById("close-modal")?.addEventListener("click", closeModal);
  document.getElementById("cancel-form")?.addEventListener("click", closeModal);
  document.querySelector(".modal-backdrop")?.addEventListener("click", closeModal);
  document.getElementById("entity-form")?.addEventListener("submit", submitForm);
  document.getElementById("field-image")?.addEventListener("change", previewSelectedFile);

  // Keyboard
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

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

  // Auto-slug for cronica
  const tituloCronica = document.getElementById("field-titulo-cronica");
  const slugCronica = document.getElementById("field-slug-cronica");
  if (tituloCronica && slugCronica) {
    tituloCronica.addEventListener("input", () => {
      if (!slugCronica.dataset.manual) {
        slugCronica.value = tituloCronica.value
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
      }
    });
    slugCronica.addEventListener("input", () => {
      slugCronica.dataset.manual = slugCronica.value ? "true" : "";
    });
  }

  // Load data
  loadDashboard();
});
