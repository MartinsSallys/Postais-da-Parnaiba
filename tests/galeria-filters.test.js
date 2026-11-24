import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { loadScript } from "./helpers/load-script.js";

const POSTAIS = [
  {
    titulo: "Porto das Barcas",
    imagem_url: null,
    epoca: "1945",
    localizacao: "Centro",
    descricao: "Registro do porto",
  },
  {
    titulo: "Mercado Publico",
    imagem_url: null,
    epoca: "1933",
    localizacao: "Centro",
    descricao: "Mercado antigo",
  },
  {
    titulo: "Delta do Parnaiba",
    imagem_url: null,
    epoca: "1985",
    localizacao: "Ilha",
    descricao: "Paisagem natural",
  },
  {
    titulo: "Igreja Sao Sebastiao",
    imagem_url: null,
    epoca: "1901",
    localizacao: "Centro",
    descricao: "Igreja historica",
  },
];

const FILTERS_DOM = `
  <span id="galeria-count"></span>
  <div id="decade-chips">
    <button class="galeria-chip is-active" type="button" data-decade="all">Todas</button>
    <button class="galeria-chip" type="button" data-decade="1940">1940</button>
    <button class="galeria-chip" type="button" data-decade="1930">1930</button>
  </div>
  <div id="location-chips"></div>
  <input id="galeria-search-input" />
  <select id="galeria-sort">
    <option value="recent">Recentes</option>
    <option value="oldest">Antigos</option>
    <option value="name">Nome</option>
  </select>
  <div id="dynamic-gallery"></div>
  <p id="galeria-empty" style="display:none"></p>
  <div id="dynamic-timeline"></div>
`;

function response(payload) {
  return Promise.resolve({ ok: true, json: async () => payload });
}

function cardTitles() {
  return [
    ...document.querySelectorAll("#dynamic-gallery .postal-card__label"),
  ].map((el) => el.textContent);
}

function clickChip(selector) {
  const chip = document.querySelector(selector);
  expect(chip).not.toBeNull();
  chip.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

beforeEach(async () => {
  document.body.innerHTML = FILTERS_DOM;
  vi.stubGlobal(
    "fetch",
    vi.fn((url) =>
      String(url).includes("/postais")
        ? response({ items: POSTAIS })
        : response({ items: [] }),
    ),
  );

  loadScript("js/galeria.js");
  document.dispatchEvent(new Event("DOMContentLoaded"));
  await new Promise((resolve) => setTimeout(resolve, 0));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("filtra por busca, decada, local e ordenacao", async () => {
  expect(cardTitles()).toHaveLength(4);
  expect(document.getElementById("galeria-count").textContent).toBe("4");

  // --- Busca textual (com debounce de 250ms) ---
  vi.useFakeTimers();
  const input = document.getElementById("galeria-search-input");
  input.value = "porto";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await vi.advanceTimersByTimeAsync(300);

  expect(cardTitles()).toEqual(["Porto das Barcas"]);

  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await vi.advanceTimersByTimeAsync(300);
  vi.useRealTimers();

  expect(cardTitles()).toHaveLength(4);

  // --- Filtro por decada ---
  clickChip('#decade-chips [data-decade="1940"]');
  expect(cardTitles()).toEqual(["Porto das Barcas"]);

  clickChip('#decade-chips [data-decade="all"]');
  expect(cardTitles()).toHaveLength(4);

  // --- Filtro por localizacao (chips gerados a partir dos dados) ---
  clickChip('#location-chips [data-location="Ilha"]');
  expect(cardTitles()).toEqual(["Delta do Parnaiba"]);

  clickChip('#location-chips [data-location="all"]');
  expect(cardTitles()).toHaveLength(4);

  // --- Ordenacao ---
  const sort = document.getElementById("galeria-sort");

  sort.value = "name";
  sort.dispatchEvent(new Event("change", { bubbles: true }));
  expect(cardTitles()).toEqual([
    "Delta do Parnaiba",
    "Igreja Sao Sebastiao",
    "Mercado Publico",
    "Porto das Barcas",
  ]);

  sort.value = "oldest";
  sort.dispatchEvent(new Event("change", { bubbles: true }));
  expect(cardTitles()[0]).toBe("Igreja Sao Sebastiao");

  sort.value = "recent";
  sort.dispatchEvent(new Event("change", { bubbles: true }));
  expect(cardTitles()[0]).toBe("Delta do Parnaiba");
});
