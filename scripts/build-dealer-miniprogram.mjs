import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "dealer-miniprogram");
const productAssetDir = path.join(target, "assets", "products");
if (!productAssetDir.startsWith(`${target}${path.sep}`)) throw new Error("Unexpected mini-program product asset path");

const products = JSON.parse(await readFile(path.join(root, "products_clean.json"), "utf8"));
await rm(productAssetDir, { recursive: true, force: true });
await mkdir(productAssetDir, { recursive: true });

const catalog = [];
for (const product of products) {
  const source = product.img_e_thumb || product.img_b_thumb || product.img_a_thumb;
  const thumbName = `${product.code}.jpg`;
  if (source) {
    await sharp(path.join(root, source))
      .resize(180, 126, { fit: "cover", position: "centre", withoutEnlargement: false })
      .jpeg({ quality: 64, chromaSubsampling: "4:2:0", mozjpeg: true })
      .toFile(path.join(productAssetDir, thumbName));
  }
  catalog.push({
    code: product.code,
    wood: product.wood || "",
    series: product.series || "",
    structure: product.structure || "",
    spec: product.spec || "",
    board: product.board || "",
    surface: product.surface || "",
    base: product.base || "",
    grade: product.grade || "",
    model: product.model || "",
    status: product.metadata_status || "",
    thumbUrl: source ? `/assets/products/${thumbName}` : "",
  });
}

await mkdir(path.join(target, "data"), { recursive: true });
await mkdir(path.join(target, "assets"), { recursive: true });
await writeFile(path.join(target, "data", "products.js"), `module.exports = ${JSON.stringify(catalog)};\n`, "utf8");

await sharp(path.join(root, "logo", "logo.png"))
  .resize(220, 180, { fit: "inside", withoutEnlargement: true })
  .png({ palette: true, colours: 96, quality: 92, compressionLevel: 9 })
  .toFile(path.join(target, "assets", "logo.png"));

await sharp(path.join(root, "media", "motion-atelier-02-poster.jpg"))
  .resize({ width: 960, withoutEnlargement: true })
  .jpeg({ quality: 78, chromaSubsampling: "4:2:0", mozjpeg: true })
  .toFile(path.join(target, "assets", "login-floor.jpg"));

console.log(`Dealer mini program assets ready with ${catalog.length} products.`);
