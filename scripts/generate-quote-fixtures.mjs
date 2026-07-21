import { access, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import PptxGenJS from "pptxgenjs";
import { createDraft } from "../quote-core.mjs";
import { generatePptx } from "../quote-ppt.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = process.env.QUOTE_FIXTURE_DIR || path.join(os.tmpdir(), "codex-presentations", "dealer-quote-generator", "fixtures");
await mkdir(output, { recursive: true });
const fixtureAssets = path.join(output, "cropped-assets");
await mkdir(fixtureAssets, { recursive: true });
const catalog = JSON.parse(await readFile(path.join(root, "products_clean.json"), "utf8"));
const content = JSON.parse(await readFile(path.join(root, "quote-content.json"), "utf8"));

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    const bundled = path.join(
      process.env.HOME || os.homedir(),
      ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules",
      ".pnpm", "sharp@0.34.5", "node_modules", "sharp", "lib", "index.js",
    );
    return (await import(pathToFileURL(bundled).href)).default;
  }
}

const sharp = await loadSharp();

const localProvider = async (candidates, options = {}) => {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  for (const candidate of list) {
    const source = candidate?.src
      ? (/^(product-assets|media|logo)\//.test(candidate.src)
        ? candidate.src
        : `product-assets/catalog/${candidate.src.replace(/^product-assets\/catalog\//, "")}`)
      : "";
    const paths = typeof candidate === "string" ? [candidate] : [candidate?.thumb, source];
    for (const relative of paths.filter(Boolean)) {
      if (/^https?:/.test(relative)) continue;
      const file = path.join(root, relative);
      try {
        await access(file);
        if (Number(options.aspectRatio) > 0) {
          const ratio = Number(options.aspectRatio);
          const maxWidth = options.maxWidth || 1600;
          const maxHeight = options.maxHeight || 1200;
          let width = Math.min(maxWidth, Math.round(maxHeight * ratio));
          let height = Math.round(width / ratio);
          if (height > maxHeight) {
            height = maxHeight;
            width = Math.round(height * ratio);
          }
          const hash = createHash("sha1").update(`${file}|${width}|${height}`).digest("hex").slice(0, 16);
          const cropped = path.join(fixtureAssets, `${hash}.jpg`);
          try {
            await access(cropped);
          } catch {
            await sharp(file).resize(width, height, { fit: "cover", position: "centre" }).jpeg({ quality: 88 }).toFile(cropped);
          }
          return { path: cropped, width, height };
        }
        return { path: file, width: candidate?.width, height: candidate?.height };
      } catch { /* next candidate */ }
    }
  }
  return null;
};

const makeLine = (product, index, overrides = {}) => ({
  room: ["客厅", "餐厅", "主卧", "次卧", "书房", "衣帽间", "走廊", "茶室"][index] || `空间${index + 1}`,
  productCode: product.code,
  netArea: 18 + index * 3.25,
  wasteRate: 5,
  unitPrice: 980 + index * 55,
  note: `${product.wood}与空间采光、家具色彩协调确认`,
  ...overrides,
});

const firstBySeries = [...new Set(catalog.map((product) => product.series))].map((series) => catalog.find((product) => product.series === series));
const fixtures = [
  {
    name: "single-product.pptx",
    draft: createDraft({ project: { name: "镜湖府单品方案", city: "绍兴", needs: "客餐厅连续铺装，偏暖木色，重视自然纹理与日常耐用。", advice: "以统一型号建立公共空间连续性，损耗按 5% 预估。" }, lines: [makeLine(catalog[0], 0)], fees: { accessoryUnitPrice: 48, installationUnitPrice: 85 }, tax: { mode: "included", rate: 13 } }),
  },
  {
    name: "four-series.pptx",
    draft: createDraft({ project: { name: "四系列选材比较", city: "杭州", needs: "在四个空间比较不同系列的视觉与工艺侧重。", advice: "每个空间以采光、尺度和家具材质为依据分别选型。" }, lines: firstBySeries.map(makeLine), discount: { type: "percent", value: 3 }, tax: { mode: "excluded", rate: 13 } }),
  },
  {
    name: "eight-lines.pptx",
    draft: createDraft({ project: { name: "全屋八空间方案", city: "上海", needs: "全屋不同空间保持木色关系，同时兼顾主空间表现与卧室舒适度。", advice: "重复产品自动合并产品介绍，报价明细按每页六行续页。" }, lines: Array.from({ length: 8 }, (_, index) => makeLine(catalog[index % 4], index)), fees: { accessoryUnitPrice: 55, installationUnitPrice: 98, transportAmount: 1800, otherAmount: 600, otherLabel: "楼层搬运" }, discount: { type: "fixed", value: 5000 }, tax: { mode: "included", rate: 13 } }),
  },
];

for (const fixture of fixtures) {
  const result = await generatePptx({ draft: fixture.draft, catalog, content, PptxCtor: PptxGenJS, imageProvider: localProvider, outputFile: path.join(output, fixture.name) });
  console.log(`${fixture.name}: ${result.slideCount} slides`);
}

console.log(`Quote fixtures: ${output}`);
