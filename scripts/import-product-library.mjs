import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceRoot = path.resolve(process.argv[2] || process.env.PRODUCT_LIBRARY_ROOT || "D:\\产品图库");
const catalogRoot = path.join(root, "product-assets", "catalog");
const productDataPath = path.join(root, "products_clean.json");

const SERIES = {
  "境系列（补充）": "境系列（阿兹慕）",
  "境系列（阿兹慕）": "境系列（阿兹慕）",
  "森系列（大板屋）": "森系列（大板屋）",
  "悦系列（多诺米亚）": "悦系列（多诺米亚）",
  "墨系列（莫马）": "墨系列（莫马）",
};

const SERIES_ORDER = ["境系列（阿兹慕）", "森系列（大板屋）", "悦系列（多诺米亚）", "墨系列（莫马）"];
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const ROLE_LABELS = { A: "纹理", B: "细节", E: "空间" };
const ROLE_ORDER = { E: 0, B: 1, A: 2 };
const OUTPUT_PARENT = path.join(root, "product-assets");

function naturalCompare(a, b) {
  return a.localeCompare(b, "zh-CN", { numeric: true, sensitivity: "base" });
}

function toWebPath(value) {
  return value.split(path.sep).join("/");
}

function getImageRole(filename) {
  const match = filename.match(/_([ABE])_(\d+)\s*\.(?:jpe?g|png)$/i);
  return {
    role: match ? match[1].toUpperCase() : "A",
    sourceIndex: match ? Number(match[2]) : 1,
  };
}

function getInternalModel(code, filename) {
  const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = filename.match(new RegExp(`^${escaped}_(.+?)_[ABE]_\\d+`, "i"));
  return match ? match[1].trim() : "";
}

function materialForCode(code) {
  const [prefix, variant = ""] = code.split("-");
  const material = variant.charAt(0).toUpperCase();
  if (material === "B") return prefix === "A3" ? "欧洲梣木" : "白蜡木";
  if (material === "H") return prefix.startsWith("B") ? "胡桃木" : "黑胡桃";
  if (material === "C") return "俄柞";
  if (material === "X") return prefix.startsWith("B") ? "欧橡" : "橡木";
  return "木种待确认";
}

function boardForCode(code) {
  const digits = (code.match(/(\d{3})$/) || [])[1] || "";
  if (digits.startsWith("3")) return "鱼骨拼";
  if (digits.startsWith("5")) return "人字拼";
  if (digits.startsWith("7")) return "中独幅";
  if (digits.startsWith("8") || digits.startsWith("9") || digits.startsWith("0")) return "大独幅";
  return "板型待确认";
}

function inferredSurface(code) {
  if (/^B3-X/i.test(code)) return "锯痕、倒角破坏";
  if (/^B9-B/i.test(code)) return "化染/锯痕";
  if (/^B9-C/i.test(code)) return "浅拉丝";
  return "拉丝";
}

function specTemplate(code) {
  if (/^A9-X7/i.test(code)) return { spec: "1200*192*14/0.6", length: 1200, width: 192, thickness: 14, base: "俄罗斯全桦", grade: "AB" };
  if (/^B3-X8/i.test(code)) return { spec: "2200*260*15/4.0", length: 2200, width: 260, thickness: 15, base: "云杉", grade: "自然级" };
  if (/^B9-B7/i.test(code)) return { spec: "1215*167*15/1.2", length: 1215, width: 167, thickness: 15, base: "全桉多层", grade: "AB级" };
  if (/^B9-C3/i.test(code)) return { spec: "800*125*14/1.2", length: 800, width: 125, thickness: 14, base: "进口全桦", grade: "A+级" };
  return { spec: "", length: null, width: null, thickness: null, base: "", grade: "" };
}

function inferMetadata(code, series) {
  const prefix = code.split("-")[0];
  const template = specTemplate(code);
  return {
    code,
    wood: materialForCode(code),
    board: boardForCode(code),
    surface: inferredSurface(code),
    structure: prefix.endsWith("3") ? "纯三层" : "多层实木",
    ...template,
    series,
  };
}

function cleanMetadata(product, code, series) {
  const source = product || inferMetadata(code, series);
  const nullableNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };
  return {
    code,
    wood: source.wood || materialForCode(code),
    board: source.board || boardForCode(code),
    surface: source.surface || inferredSurface(code),
    structure: source.structure || (code.split("-")[0].endsWith("3") ? "纯三层" : "多层实木"),
    spec: source.spec || "",
    thickness: nullableNumber(source.thickness),
    width: nullableNumber(source.width),
    length: nullableNumber(source.length),
    base: source.base || "",
    grade: source.grade || "",
    series,
  };
}

async function listProductFolders() {
  const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
  const products = [];
  for (const seriesEntry of entries.filter((entry) => entry.isDirectory() && SERIES[entry.name]).sort((a, b) => naturalCompare(a.name, b.name))) {
    const seriesPath = path.join(sourceRoot, seriesEntry.name);
    const productEntries = (await fs.readdir(seriesPath, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => naturalCompare(a.name, b.name));
    for (const productEntry of productEntries) {
      const productPath = path.join(seriesPath, productEntry.name);
      const imageFiles = (await fs.readdir(productPath, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
        .map((entry) => entry.name)
        .sort(naturalCompare);
      products.push({
        code: productEntry.name,
        sourceSeries: seriesEntry.name,
        series: SERIES[seriesEntry.name],
        productPath,
        imageFiles,
      });
    }
  }
  return products;
}

async function createImageAsset(sourcePath, destinationPath, width, quality) {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await sharp(sourcePath, { limitInputPixels: false, failOn: "none" })
    .rotate()
    .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 4, smartSubsample: true })
    .toFile(destinationPath);
}

async function processProduct(folder, existingProduct) {
  const destinationDir = path.join(catalogRoot, folder.code);
  const roleCounts = { A: 0, B: 0, E: 0 };
  const gallery = [];
  let correctedOrientationCount = 0;
  let model = "";

  const sourceImages = folder.imageFiles.map((filename) => {
    const roleInfo = getImageRole(filename);
    return { filename, ...roleInfo };
  }).sort((a, b) => {
    const roleDifference = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
    return roleDifference || a.sourceIndex - b.sourceIndex || naturalCompare(a.filename, b.filename);
  });

  for (const image of sourceImages) {
    roleCounts[image.role] += 1;
    const sequence = String(roleCounts[image.role]).padStart(2, "0");
    const basename = `${image.role.toLowerCase()}-${sequence}`;
    const sourcePath = path.join(folder.productPath, image.filename);
    const fullPath = path.join(destinationDir, `${basename}.webp`);
    const thumbPath = path.join(destinationDir, `${basename}-thumb.webp`);
    const sourceMetadata = await sharp(sourcePath, { limitInputPixels: false }).metadata();
    const originalOrientation = sourceMetadata.orientation || 1;
    if (originalOrientation !== 1) correctedOrientationCount += 1;
    if (!model) model = getInternalModel(folder.code, image.filename);

    await createImageAsset(sourcePath, fullPath, 1600, 82);
    await createImageAsset(fullPath, thumbPath, 560, 74);
    const outputMetadata = await sharp(fullPath).metadata();

    gallery.push({
      src: toWebPath(path.relative(root, fullPath)),
      thumb: toWebPath(path.relative(root, thumbPath)),
      role: image.role,
      label: `${ROLE_LABELS[image.role]} ${roleCounts[image.role]}`,
      width: outputMetadata.width,
      height: outputMetadata.height,
      orientation_fixed: originalOrientation !== 1,
    });
  }

  const metadata = cleanMetadata(existingProduct, folder.code, folder.series);
  const firstByRole = (role) => gallery.find((item) => item.role === role) || null;
  const imageA = firstByRole("A");
  const imageB = firstByRole("B") || imageA;
  const imageE = firstByRole("E") || imageB || imageA;

  return {
    product: {
      ...metadata,
      model,
      img_a: imageA?.src || "",
      img_b: imageB?.src || "",
      img_e: imageE?.src || "",
      img_a_thumb: imageA?.thumb || "",
      img_b_thumb: imageB?.thumb || "",
      img_e_thumb: imageE?.thumb || "",
      gallery,
      source_image_count: gallery.length,
      metadata_status: existingProduct ? "已核验" : "待确认",
    },
    correctedOrientationCount,
  };
}

async function main() {
  const resolvedParent = path.resolve(path.dirname(catalogRoot));
  if (resolvedParent !== path.resolve(OUTPUT_PARENT) || path.basename(catalogRoot) !== "catalog") {
    throw new Error(`Unsafe catalog output path: ${catalogRoot}`);
  }

  const existingProducts = JSON.parse(await fs.readFile(productDataPath, "utf8"));
  const existingByCode = new Map(existingProducts.map((product) => [product.code, product]));
  const folders = await listProductFolders();
  const emptyFolders = folders.filter((folder) => folder.imageFiles.length === 0);
  const importFolders = folders.filter((folder) => folder.imageFiles.length > 0);

  await fs.rm(catalogRoot, { recursive: true, force: true });
  await fs.mkdir(catalogRoot, { recursive: true });
  sharp.cache(false);
  sharp.concurrency(2);

  const imported = [];
  let correctedOrientationCount = 0;
  for (let index = 0; index < importFolders.length; index += 1) {
    const folder = importFolders[index];
    const result = await processProduct(folder, existingByCode.get(folder.code));
    imported.push(result.product);
    correctedOrientationCount += result.correctedOrientationCount;
    if ((index + 1) % 10 === 0 || index === importFolders.length - 1) {
      console.log(`Imported ${index + 1}/${importFolders.length} products`);
    }
  }

  imported.sort((a, b) => {
    const seriesDifference = SERIES_ORDER.indexOf(a.series) - SERIES_ORDER.indexOf(b.series);
    return seriesDifference || naturalCompare(a.code, b.code);
  });

  const report = {
    generated_at: new Date().toISOString(),
    totals: {
      product_folders: folders.length,
      imported_products: imported.length,
      empty_product_folders: emptyFolders.length,
      imported_images: imported.reduce((sum, product) => sum + product.source_image_count, 0),
      orientation_corrections: correctedOrientationCount,
      verified_metadata: imported.filter((product) => product.metadata_status === "已核验").length,
      inferred_metadata: imported.filter((product) => product.metadata_status === "待确认").length,
    },
    empty_products: emptyFolders.map((folder) => ({ code: folder.code, series: folder.series })),
    inferred_products: imported.filter((product) => product.metadata_status === "待确认").map((product) => product.code),
  };

  await fs.writeFile(productDataPath, `${JSON.stringify(imported, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(catalogRoot, "manifest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report.totals, null, 2));
}

await main();
