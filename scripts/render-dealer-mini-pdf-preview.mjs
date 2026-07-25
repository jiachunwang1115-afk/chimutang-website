import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const output = path.join(root, ".tmp", "dealer-mini-pdf-preview");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const packageRoot = path.join(output, "mini-package");
await cp(path.join(root, "dealer-miniprogram"), packageRoot, { recursive: true });
await writeFile(path.join(packageRoot, "package.json"), '{"type":"commonjs"}\n', "utf8");
const miniRequire = createRequire(path.join(packageRoot, "test.cjs"));
const quote = miniRequire("./utils/quote.js");
const products = miniRequire("./data/products.js");
const content = miniRequire("./data/quote-content.js");
const { buildExportModel } = miniRequire("./utils/export-model.js");
const { buildImagePdf } = miniRequire("./utils/pdf-writer.js");

const draft = quote.createDraft({
  project: {
    name: "镜湖府王宅",
    address: "绍兴市越城区镜湖府",
    needs: "客餐厅与走廊连续铺装，重视自然采光下的木纹层次、整体尺度与日常耐用。",
    advice: "以低饱和木色衔接石材与暖白墙面，主空间保持完整连续，卧室在同一色阶内降低纹理对比。",
  },
  lines: [
    { room: "客餐厅", productCode: products[0].code, netArea: 42.6, wasteRate: 5, unitPrice: 1280, note: "主空间连续铺装" },
    { room: "主卧", productCode: products[1].code, netArea: 18.4, wasteRate: 5, unitPrice: 1180, note: "与公共区保持同一色阶" },
    { room: "书房", productCode: products[2].code, netArea: 12.8, wasteRate: 6, unitPrice: 1380, note: "控制纹理起伏" },
    { room: "次卧", productCode: products[3].code, netArea: 15.2, wasteRate: 5, unitPrice: 1120, note: "柔和低对比木色" },
  ],
});
const totals = quote.calculate(draft);
const model = buildExportModel(draft, totals, products, content);
const source = await readFile(path.join(root, "dealer-miniprogram", "utils", "pdf-export.js"), "utf8");

const assetPaths = new Set([
  "/assets/login-floor.jpg",
  "/assets/logo.png",
  ...model.products.map((product) => product.thumbUrl).filter(Boolean),
  ...model.series.map((series) => series.image).filter(Boolean),
]);
const assets = {};
for (const assetPath of assetPaths) {
  const local = path.join(root, "dealer-miniprogram", assetPath.replace(/^\//, ""));
  const bytes = await readFile(local);
  const mime = assetPath.endsWith(".png") ? "image/png" : "image/jpeg";
  assets[assetPath] = `data:${mime};base64,${bytes.toString("base64")}`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent('<canvas id="preview"></canvas>');
await page.evaluate(({ modelData, assetData }) => {
  window.__model = modelData;
  window.__assetData = assetData;
  window.module = { exports: {} };
  window.require = (request) => {
    if (request === "../data/products") return [];
    if (request === "../data/quote-content") return {};
    if (request === "./export-model") return { buildExportModel: () => ({}) };
    if (request === "./pdf-writer") return { buildImagePdf: () => new Uint8Array() };
    throw new Error(`Unexpected require: ${request}`);
  };
}, { modelData: model, assetData: assets });
await page.addScriptTag({ content: source });
await page.evaluate(async () => {
  window.__images = {};
  await Promise.all(Object.entries(window.__assetData).map(([key, sourceValue]) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      window.__images[key] = image;
      resolve();
    };
    image.onerror = reject;
    image.src = sourceValue;
  })));
});

async function renderVariant(variant) {
  const result = await page.evaluate(({ variantName }) => {
    const canvas = document.getElementById("preview");
    const format = module.exports.FORMATS[variantName];
    const pages = module.exports.buildPages(window.__model, variantName);
    const renderer = variantName === "mobile"
      ? module.exports.__test.drawMobilePage
      : module.exports.__test.drawDesktopPage;
    canvas.width = format.width;
    canvas.height = format.height;
    const context = canvas.getContext("2d");
    const adapter = {
      setFillStyle(value) { context.fillStyle = value; },
      setStrokeStyle(value) { context.strokeStyle = value; },
      setLineWidth(value) { context.lineWidth = value; },
      setFontSize(size) { context.font = `${size}px sans-serif`; },
      setTextAlign(value) { context.textAlign = value; },
      setTextBaseline(value) { context.textBaseline = value; },
      setGlobalAlpha(value) { context.globalAlpha = value; },
      beginPath() { context.beginPath(); },
      moveTo(...args) { context.moveTo(...args); },
      lineTo(...args) { context.lineTo(...args); },
      stroke() { context.stroke(); },
      fillRect(...args) { context.fillRect(...args); },
      strokeRect(...args) { context.strokeRect(...args); },
      fillText(...args) { context.fillText(...args); },
      measureText(...args) { return context.measureText(...args); },
      drawImage(sourceValue, ...args) { context.drawImage(window.__images[sourceValue], ...args); },
    };
    Object.defineProperty(adapter, "font", {
      get() { return context.font; },
      set(value) { context.font = value; },
    });
    const rendered = [];
    pages.forEach((pdfPage, index) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      renderer(adapter, window.__model, pdfPage, index + 1);
      rendered.push({
        kind: pdfPage.kind,
        data: canvas.toDataURL("image/jpeg", 0.9),
      });
    });
    return rendered;
  }, { variantName: variant });

  const images = [];
  for (let index = 0; index < result.length; index += 1) {
    const bytes = Buffer.from(result[index].data.split(",")[1], "base64");
    const filename = `${variant}-${String(index + 1).padStart(2, "0")}-${result[index].kind}.jpg`;
    await writeFile(path.join(output, filename), bytes);
    images.push({
      bytes: new Uint8Array(bytes),
      width: variant === "mobile" ? 900 : 1280,
      height: variant === "mobile" ? 1600 : 720,
    });
  }
  const pageWidth = variant === "mobile" ? 900 : 1280;
  const pageHeight = variant === "mobile" ? 1600 : 720;
  await writeFile(path.join(output, `woodall-${variant}-sample.pdf`), buildImagePdf(images, pageWidth, pageHeight));

  const thumbWidth = variant === "mobile" ? 225 : 320;
  const thumbHeight = variant === "mobile" ? 400 : 180;
  const columns = variant === "mobile" ? 5 : 4;
  const rows = Math.ceil(result.length / columns);
  const tiles = await Promise.all(result.map(async (item) => {
    const input = Buffer.from(item.data.split(",")[1], "base64");
    return sharp(input).resize(thumbWidth, thumbHeight, { fit: "contain", background: "#ddd8d0" }).jpeg({ quality: 84 }).toBuffer();
  }));
  await sharp({
    create: {
      width: columns * thumbWidth,
      height: rows * thumbHeight,
      channels: 3,
      background: "#d7d2ca",
    },
  }).composite(tiles.map((input, index) => ({
    input,
    left: (index % columns) * thumbWidth,
    top: Math.floor(index / columns) * thumbHeight,
  }))).jpeg({ quality: 88 }).toFile(path.join(output, `${variant}-montage.jpg`));
}

await renderVariant("mobile");
await renderVariant("desktop");
await browser.close();

console.log(output);
