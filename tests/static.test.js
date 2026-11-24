import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const IGNORED_DIRS = new Set([".git", "node_modules", "venv", ".venv", "coverage"]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

const htmlFiles = walk(ROOT).filter((file) => file.endsWith(".html"));
const relative = (file) => path.relative(ROOT, file);

function localReferences(html) {
  const refs = [];
  const attributePattern = /(?:href|src)="([^"]+)"/g;
  let match;
  while ((match = attributePattern.exec(html)) !== null) {
    const value = match[1];
    if (!value) continue;
    if (value.includes("${") || value.includes("' +")) continue;
    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("//") ||
      value.startsWith("#") ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:") ||
      value.startsWith("javascript:") ||
      value.startsWith("data:")
    ) {
      continue;
    }
    refs.push(value);
  }
  return refs;
}

describe("integridade do frontend estatico", () => {
  it("encontra as paginas principais", () => {
    const required = [
      "index.html",
      "pages/blog.html",
      "pages/galeria.html",
      "pages/livro.html",
      "pages/post.html",
      "pages/postal.html",
      "pages/sobre.html",
      "admin/index.html",
      "admin/login.html",
      "js/main.js",
      "js/public.js",
      "js/galeria.js",
    ];

    for (const file of required) {
      expect(fs.existsSync(path.join(ROOT, file)), file).toBe(true);
    }
  });

  it("todas as referencias locais de HTML existem (links, imagens, css e js)", () => {
    expect(htmlFiles.length).toBeGreaterThan(0);

    const missing = [];
    for (const file of htmlFiles) {
      const html = fs.readFileSync(file, "utf8");
      const dir = path.dirname(file);
      for (const ref of localReferences(html)) {
        const clean = ref.split("#")[0].split("?")[0];
        if (!clean) continue;
        const target = path.resolve(dir, clean);
        if (!fs.existsSync(target)) {
          missing.push(`${relative(file)} -> ${ref}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it("todas as paginas possuem estrutura minima de HTML", () => {
    for (const file of htmlFiles) {
      const html = fs.readFileSync(file, "utf8");
      expect(html, relative(file)).toMatch(/<html[^>]*lang="pt-BR"/i);
      expect(html, relative(file)).toMatch(/<meta[^>]*charset=["']?utf-8/i);
      expect(html, relative(file)).toMatch(/<title>[^<]+<\/title>/i);
    }
  });
});
