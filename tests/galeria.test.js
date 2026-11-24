import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadScript } from "./helpers/load-script.js";

const GALLERY_DOM = `
  <span id="galeria-count"></span>
  <div id="location-chips"></div>
  <div id="dynamic-gallery"></div>
  <p id="galeria-empty" style="display:none"></p>
  <div id="dynamic-timeline"></div>
`;

function jsonResponse(payload) {
  return Promise.resolve({ ok: true, json: async () => payload });
}

beforeEach(() => {
  document.body.innerHTML = GALLERY_DOM;
  delete window.API_BASE_URL;
  delete window.__API_BASE__;
  loadScript("js/galeria.js");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getDecade", () => {
  it("extrai a decada de uma epoca", () => {
    expect(window.getDecade("Anos 1940")).toBe(1940);
    expect(window.getDecade("1953")).toBe(1950);
    expect(window.getDecade("fotografia de 1899")).toBe(1890);
  });

  it("retorna null quando nao ha ano", () => {
    expect(window.getDecade(null)).toBeNull();
    expect(window.getDecade("")).toBeNull();
    expect(window.getDecade("sem data")).toBeNull();
  });
});

describe("getImageUrl (galeria)", () => {
  it("usa imagem padrao quando vazio", () => {
    expect(window.getImageUrl(null)).toBe("../images/postal-antigo-01.png");
  });

  it("ajusta /images/ para o nivel de pages/", () => {
    expect(window.getImageUrl("/images/porto.png")).toBe("../images/porto.png");
  });

  it("mantem URLs externas e uploads", () => {
    expect(window.getImageUrl("https://exemplo.com/a.jpg")).toBe(
      "https://exemplo.com/a.jpg",
    );
    expect(window.getImageUrl("/static/uploads/a.png")).toBe(
      "/static/uploads/a.png",
    );
  });
});

describe("renderPostais", () => {
  const postais = [
    {
      titulo: "Porto das Barcas",
      imagem_url: "/images/porto.png",
      epoca: "Anos 1940",
      descricao: "Registro do porto.",
      localizacao: "Centro",
    },
    {
      titulo: "Mercado Publico",
      imagem_url: null,
      epoca: "1930",
      descricao: "Mercado antigo.",
      localizacao: "Centro",
    },
  ];

  it("renderiza cards, contador e esconde o estado vazio", () => {
    window.renderPostais(postais);

    const grid = document.getElementById("dynamic-gallery");
    expect(grid.querySelectorAll(".postal-card")).toHaveLength(2);
    expect(grid.textContent).toContain("Porto das Barcas");
    expect(grid.textContent).toContain("Mercado Publico");
    expect(document.getElementById("galeria-count").textContent).toBe("2");
    expect(document.getElementById("galeria-empty").style.display).toBe("none");
  });

  it("escapa conteudo malicioso dos campos", () => {
    window.renderPostais([
      {
        titulo: '<img src=x onerror="alert(1)">',
        imagem_url: null,
        epoca: "1900",
        descricao: "<script>alert(1)</script>",
        localizacao: '" onmouseover="x',
      },
    ]);

    const grid = document.getElementById("dynamic-gallery");
    expect(grid.querySelector("script")).toBeNull();
    expect(grid.querySelector("img[onerror]")).toBeNull();
    expect(grid.innerHTML).toContain("&lt;img");
    expect(grid.innerHTML).toContain("&lt;script&gt;");
  });

  it("mostra o estado vazio quando nao ha postais", () => {
    window.renderPostais([]);

    expect(document.getElementById("dynamic-gallery").innerHTML).toBe("");
    expect(document.getElementById("galeria-count").textContent).toBe("0");
    expect(document.getElementById("galeria-empty").style.display).toBe("block");
  });
});

describe("loadPostais", () => {
  it("busca postais, monta filtros de localizacao e renderiza", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        jsonResponse({
          items: [
            {
              titulo: "Porto",
              imagem_url: null,
              epoca: "1940",
              localizacao: "Centro",
              descricao: "d",
            },
            {
              titulo: "Delta",
              imagem_url: null,
              epoca: "1980",
              localizacao: "Ilha",
              descricao: "d",
            },
            {
              titulo: "Mercado",
              imagem_url: null,
              epoca: "1930",
              localizacao: "Centro",
              descricao: "d",
            },
          ],
        }),
      ),
    );

    await window.loadPostais();

    expect(fetch).toHaveBeenCalledWith("/api/postais?size=50");
    expect(
      document.querySelectorAll("#dynamic-gallery .postal-card"),
    ).toHaveLength(3);
    const chips = document.querySelectorAll("#location-chips .galeria-chip");
    expect([...chips].map((c) => c.dataset.location)).toEqual([
      "all",
      "Centro",
      "Ilha",
    ]);
  });

  it("exibe mensagem de erro quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false })));

    await window.loadPostais();

    expect(document.getElementById("dynamic-gallery").textContent).toContain(
      "Erro ao carregar postais.",
    );
  });

  it("exibe estado vazio quando a API nao retorna itens", async () => {
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse({ items: [] })));

    await window.loadPostais();

    expect(document.getElementById("dynamic-gallery").textContent).toContain(
      "Nenhum postal cadastrado ainda.",
    );
  });
});

describe("loadTimeline", () => {
  it("ordena eventos por ordem e renderiza link externo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        jsonResponse({
          items: [
            {
              titulo: "Segundo",
              descricao: "B",
              data_evento: "1950",
              ordem: 2,
              imagem_url: null,
              link_externo: "https://exemplo.com/b",
            },
            {
              titulo: "Primeiro",
              descricao: "A",
              data_evento: "1900",
              ordem: 1,
              imagem_url: null,
              link_externo: null,
            },
          ],
        }),
      ),
    );

    await window.loadTimeline();

    expect(fetch).toHaveBeenCalledWith(
      "/api/timeline-events?publicados_only=true&size=50",
    );
    const titles = [
      ...document.querySelectorAll("#dynamic-timeline .timeline-event__title"),
    ].map((el) => el.textContent);
    expect(titles).toEqual(["Primeiro", "Segundo"]);
    expect(
      document.querySelector("#dynamic-timeline .timeline-event__link"),
    ).not.toBeNull();
  });

  it("exibe erro quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false })));

    await window.loadTimeline();

    expect(document.getElementById("dynamic-timeline").textContent).toContain(
      "Erro ao carregar eventos.",
    );
  });
});
