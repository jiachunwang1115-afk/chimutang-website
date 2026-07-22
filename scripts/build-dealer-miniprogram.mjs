import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "dealer-miniprogram");
const products = JSON.parse(await readFile(path.join(root, "products_clean.json"), "utf8"));
const catalog = products.map((product) => ({
  code: product.code,
  wood: product.wood || "",
  series: product.series || "",
  structure: product.structure || "",
  spec: product.spec || "",
  status: product.metadata_status || "",
}));

await mkdir(path.join(target, "data"), { recursive: true });
await mkdir(path.join(target, "assets"), { recursive: true });
await writeFile(path.join(target, "data", "products.js"), `module.exports = ${JSON.stringify(catalog)};\n`, "utf8");
await cp(path.join(root, "logo", "logo.png"), path.join(target, "assets", "logo.png"));
await cp(path.join(root, "media", "brand-film-poster.jpg"), path.join(target, "assets", "brand-film-poster.jpg"));

console.log(`Dealer mini program assets ready with ${catalog.length} products.`);
