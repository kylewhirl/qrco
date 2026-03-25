import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = new URL("../dist", import.meta.url);

async function walk(dir) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const info = await stat(fullPath);
    if (info.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (!fullPath.endsWith(".js")) {
      continue;
    }
    const source = await readFile(fullPath, "utf8");
    const next = source.replace(/from\s+["'](\.[^"']+)["']/g, (match, specifier) => {
      if (specifier.endsWith(".js") || specifier.endsWith(".mjs") || specifier.endsWith(".cjs")) {
        return match;
      }
      return match.replace(specifier, `${specifier}.js`);
    });
    if (next !== source) {
      await writeFile(fullPath, next);
    }
  }
}

await walk(root.pathname);
