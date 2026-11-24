import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadScript } from "./helpers/load-script.js";

beforeEach(() => {
  document.body.innerHTML = "";
  delete window.API_BASE_URL;
  delete window.__API_BASE__;
  window.history.replaceState({}, "", "/");
  loadScript("js/public.js");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("escapeHtml", () => {
  it("escapa tags e impede injecao de HTML", () => {
    const html = window.escapeHtml('<img src=x onerror="alert(1)">');
    expect(html).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("escapa aspas simples e duplas (seguro em atributos)", () => {
    expect(window.escapeHtml(`" onmouseover='x'`)).toBe(
      "&quot; onmouseover=&#39;x&#39;",
    );
  });

  it("escapa ampersand sem duplicar entidades", () => {
    expect(window.escapeHtml("a & b")).toBe("a &amp; b");
    expect(window.escapeHtml("&amp;")).toBe("&amp;amp;");
  });

  it("retorna vazio para null/undefined e converte numeros", () => {
    expect(window.escapeHtml(null)).toBe("");
    expect(window.escapeHtml(undefined)).toBe("");
    expect(window.escapeHtml(0)).toBe("0");
  });
});

describe("getImageUrl", () => {
  it("usa a imagem padrao quando nao ha URL", () => {
    expect(window.getImageUrl(null, ".")).toBe(
      "./images/postal-antigo-01.png",
    );
    expect(window.getImageUrl("", undefined)).toBe(
      "./images/postal-antigo-01.png",
    );
  });

  it("mantem URLs absolutas (http/https)", () => {
    expect(window.getImageUrl("https://exemplo.com/a.jpg", ".")).toBe(
      "https://exemplo.com/a.jpg",
    );
  });

  it("prefixa imagens locais /images/ com a base", () => {
    expect(window.getImageUrl("/images/a.png", ".")).toBe("./images/a.png");
    expect(window.getImageUrl("/images/a.png", "..")).toBe("../images/a.png");
  });

  it("mantem uploads /static/ sem prefixo", () => {
    expect(window.getImageUrl("/static/uploads/a.png", ".")).toBe(
      "/static/uploads/a.png",
    );
  });

  it("devolve outros valores como vieram", () => {
    expect(window.getImageUrl("foto.png", ".")).toBe("foto.png");
  });
});

describe("getQueryParam", () => {
  it("le parametros da URL", () => {
    window.history.replaceState({}, "", "/pages/post.html?slug=porto&id=7");
    expect(window.getQueryParam("slug")).toBe("porto");
    expect(window.getQueryParam("id")).toBe("7");
  });

  it("retorna null quando o parametro nao existe", () => {
    window.history.replaceState({}, "", "/pages/post.html");
    expect(window.getQueryParam("slug")).toBeNull();
  });
});

describe("renderPostCard", () => {
  const post = {
    titulo: "A Parnaiba antiga",
    autor: "Equipe editorial",
    resumo: "Memorias da cidade.",
    slug: "parnaiba-antiga",
    imagem_capa_url: "/static/uploads/capa.png",
  };

  it("renderiza titulo, autor, resumo, imagem e link", () => {
    const html = window.renderPostCard(post, ".");

    expect(html).toContain("A Parnaiba antiga");
    expect(html).toContain("Por: Equipe editorial");
    expect(html).toContain("Memorias da cidade.");
    expect(html).toContain('src="/static/uploads/capa.png"');
    expect(html).toContain('href="./pages/post.html?slug=parnaiba-antiga"');
  });

  it("escapa conteudo malicioso em texto e atributos", () => {
    const html = window.renderPostCard(
      {
        ...post,
        titulo: '" onmouseover="alert(1)',
        resumo: "<script>alert(1)</script>",
      },
      ".",
    );

    expect(html).not.toContain('alt="" onmouseover');
    expect(html).toContain("&quot; onmouseover=&quot;alert(1)");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("funciona sem base (links relativos)", () => {
    const html = window.renderPostCard(post, "");
    expect(html).toContain('href="post.html?slug=parnaiba-antiga"');
  });
});

describe("renderPostalCard", () => {
  const postal = {
    id: 42,
    titulo: "Porto das Barcas",
    epoca: "Anos 1940",
    imagem_url: "/images/porto.png",
  };

  it("renderiza postal com link por id", () => {
    const html = window.renderPostalCard(postal, ".");

    expect(html).toContain("Porto das Barcas");
    expect(html).toContain("Anos 1940");
    expect(html).toContain('src="./images/porto.png"');
    expect(html).toContain('href="./pages/postal.html?id=42"');
  });
});

describe("fetchJson", () => {
  it("faz GET em API_BASE + path e retorna JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(window.fetchJson("/postais?size=6")).resolves.toEqual({
      items: [],
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/postais?size=6");
  });

  it("lanca erro quando a resposta nao e ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(window.fetchJson("/postais")).rejects.toThrow(
      "Erro ao carregar dados.",
    );
  });
});
