import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "dealer-miniprogram");
const temp = await mkdtemp(path.join(os.tmpdir(), "woodall-mini-export-"));
const target = path.join(temp, "dealer-miniprogram");

try {
  await cp(source, target, { recursive: true });
  await writeFile(path.join(target, "package.json"), '{"type":"commonjs"}\n', "utf8");

  globalThis.wx = {
    getFileSystemManager() {
      return {
        readFileSync(filePath, encoding) {
          const relative = String(filePath).replace(/^[/\\]+/, "");
          return require("node:fs").readFileSync(path.join(target, relative), encoding);
        },
      };
    },
  };

  const require = createRequire(path.join(target, "test.cjs"));
  const quote = require("./utils/quote.js");
  const products = require("./data/products.js");
  const content = require("./data/quote-content.js");
  const { buildExportModel } = require("./utils/export-model.js");
  const { buildImagePdf } = require("./utils/pdf-writer.js");
  const { generatePptx } = require("./utils/pptx-export.js");

  const draft = quote.createDraft({
    project: {
      name: "镜湖府王宅",
      address: "绍兴市越城区镜湖府",
      needs: "客餐厅连续铺装，重视自然采光下的木纹层次与日常耐用。",
      advice: "以低饱和木色衔接石材与暖白墙面，保持公共空间的完整尺度。",
    },
    lines: [
      { room: "客餐厅", productCode: products[0].code, netArea: 42.6, wasteRate: 5, unitPrice: 1280, note: "主空间连续铺装" },
      { room: "主卧", productCode: products[1].code, netArea: 18.4, wasteRate: 5, unitPrice: 1180, note: "与公共区保持同一色阶" },
    ],
  });
  const totals = quote.calculate(draft);
  const model = buildExportModel(draft, totals, products, content);
  assert.equal(model.lines.length, 2);
  assert.equal(model.products.length, 2);
  assert.equal(model.quotePages.length, 1);
  assert(model.pages.length >= 9);

  const pptx = await generatePptx(draft, totals);
  assert(pptx instanceof Uint8Array);
  assert.equal(String.fromCharCode(...pptx.slice(0, 4)), "PK\u0003\u0004");
  assert(pptx.length > 100_000);

  const jpeg = new Uint8Array(await readFile(path.join(target, "assets", "login-floor.jpg")));
  const pdf = buildImagePdf([{ bytes: jpeg, width: 960, height: 540 }]);
  assert.equal(String.fromCharCode(...pdf.slice(0, 8)), "%PDF-1.4");
  assert(pdf.length > jpeg.length);

  if (process.env.WOODALL_EXPORT_FIXTURE) {
    const outputDir = path.resolve(process.env.WOODALL_EXPORT_FIXTURE);
    await cp(target, path.join(outputDir, "mini-package"), { recursive: true });
    await writeFile(path.join(outputDir, "woodall-mini-sample.pptx"), pptx);
    await writeFile(path.join(outputDir, "woodall-pdf-writer-sample.pdf"), pdf);
  }

  console.log(`Mini export tests passed: ${model.pages.length} pages, PPTX ${pptx.length} bytes, PDF ${pdf.length} bytes.`);
} finally {
  delete globalThis.wx;
  await rm(temp, { recursive: true, force: true });
}
