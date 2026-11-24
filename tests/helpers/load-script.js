import fs from "node:fs";
import path from "node:path";

/**
 * Executa um script classico do site dentro do ambiente jsdom atual.
 * Os scripts do projeto usam declaracoes globais (function ...), entao
 * ficam disponiveis em `window` apos a execucao.
 */
export function loadScript(relativePath) {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const code = fs.readFileSync(absolutePath, "utf8");
  window.eval(`${code}\n//# sourceURL=${relativePath}`);
}
