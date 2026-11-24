import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadScript } from "./helpers/load-script.js";

const MAIN_DOM = `
  <header id="site-header">
    <button class="site-header__toggle" aria-expanded="false"></button>
    <nav id="main-nav">
      <a href="#">Inicio</a>
      <a href="#">Galeria</a>
    </nav>
  </header>
  <section data-reveal>Conteudo</section>
`;

beforeEach(() => {
  document.body.innerHTML = MAIN_DOM;
  delete window.IntersectionObserver;
  loadScript("js/main.js");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("menu mobile", () => {
  it("abre ao clicar no toggle e fecha ao clicar fora", () => {
    const toggle = document.querySelector(".site-header__toggle");
    const nav = document.getElementById("main-nav");

    toggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(nav.classList.contains("is-open")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(nav.classList.contains("is-open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("fecha o menu ao clicar em um link", () => {
    const toggle = document.querySelector(".site-header__toggle");
    const nav = document.getElementById("main-nav");

    toggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(nav.classList.contains("is-open")).toBe(true);

    nav.querySelector("a").dispatchEvent(
      new MouseEvent("click", { bubbles: true }),
    );
    expect(nav.classList.contains("is-open")).toBe(false);
  });
});

describe("header e animacoes", () => {
  it("adiciona is-scrolled quando a pagina rola mais de 40px", () => {
    const header = document.getElementById("site-header");

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 120,
    });
    window.dispatchEvent(new Event("scroll"));

    expect(header.classList.contains("is-scrolled")).toBe(true);

    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    window.dispatchEvent(new Event("scroll"));
    expect(header.classList.contains("is-scrolled")).toBe(false);

    delete window.scrollY;
  });

  it("revela elementos [data-reveal] quando nao ha IntersectionObserver", () => {
    expect(document.querySelector("[data-reveal]").classList).toContain(
      "is-visible",
    );
  });
});
