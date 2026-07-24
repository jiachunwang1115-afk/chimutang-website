import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDeckModel, calculateQuote, createDraft, validateDraft } from "../quote-core.mjs";
import { ACTIVE_DRAFT_KEY, DRAFT_STORAGE_KEY, DraftRepository } from "../quote-drafts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(path.join(root, "products_clean.json"), "utf8"));
const content = JSON.parse(await readFile(path.join(root, "quote-content.json"), "utf8"));
const quotePptSource = await readFile(path.join(root, "quote-ppt.mjs"), "utf8");

assert.match(quotePptSource, /function backCoverSlide\(/, "报价 PPT 必须包含独立封底");
assert.match(quotePptSource, /backCoverSlide\(pptx, model, assets\)/, "独立封底必须加入生成流程");
assert.match(quotePptSource, /const TITLE_FONT = "Noto Serif SC"/, "报价标题必须使用品牌宋体");

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const line = (overrides = {}) => ({ room: "客厅", productCode: catalog[0].code, netArea: 10, wasteRate: 5, unitPrice: 100, note: "主空间连续铺装", ...overrides });
const draft = createDraft({ project: { name: "计算测试" }, lines: [line()] });

{
  const result = calculateQuote(draft);
  assert.equal(result.lines[0].billableArea, 10.5, "计价面积应包含 5% 损耗");
  assert.equal(result.materialCents, 105000, "材料金额应按分计算");
  assert.equal(result.totalCents, 105000, "含税输入不应重复加税");
  assert.equal(result.taxCents, 12080, "含税额应从总额中拆分");
}

{
  const result = calculateQuote(createDraft({
    project: { name: "费用与未税" },
    lines: [line()],
    fees: { accessoryUnitPrice: 10, installationUnitPrice: 20, transportAmount: 50, otherAmount: 30, otherLabel: "楼层搬运" },
    discount: { type: "percent", value: 10 },
    tax: { mode: "excluded", rate: 13 },
  }));
  assert.equal(result.subtotalCents, 144500);
  assert.equal(result.discountCents, 14450);
  assert.equal(result.taxCents, 16907);
  assert.equal(result.totalCents, 146957);
  assert.deepEqual(result.optionalItems.map((item) => item.label), ["辅材费", "安装费", "运输费", "楼层搬运"]);
}

{
  const percent = calculateQuote(createDraft({ project: { name: "比例优惠" }, lines: [line()], discount: { type: "percent", value: 10 } }));
  const fixed = calculateQuote(createDraft({ project: { name: "固定优惠" }, lines: [line()], discount: { type: "fixed", value: 100 } }));
  assert.equal(percent.discountCents, 10500);
  assert.equal(fixed.discountCents, 10000);
}

{
  const lines = Array.from({ length: 8 }, (_, index) => line({ room: `空间${index + 1}`, netArea: index + 1 }));
  const result = calculateQuote(createDraft({ project: { name: "八条明细" }, lines }));
  assert.equal(result.lines.length, 8);
  assert.equal(result.totalNetArea, 36);
  assert.equal(result.optionalItems.length, 0, "空可选费用应隐藏");
}

{
  const result = calculateQuote(createDraft({ project: { name: "小数舍入" }, lines: [line({ netArea: 0.1, unitPrice: 0.1 })] }));
  assert.equal(result.lines[0].billableArea, 0.11);
  assert.equal(result.materialCents, 1);
}

{
  const invalid = createDraft({ lines: [{ ...line(), room: "", productCode: "", netArea: 0, unitPrice: 0 }] });
  const paths = validateDraft(invalid, catalog).map((error) => error.path);
  assert(paths.includes("project.name"));
  assert(paths.includes("lines.0.room"));
  assert(paths.includes("lines.0.productCode"));
  assert(paths.includes("lines.0.netArea"));
  assert(paths.includes("lines.0.unitPrice"));
  const otherFee = createDraft({ project: { name: "其他费用" }, lines: [line()], fees: { otherAmount: 20 } });
  assert(validateDraft(otherFee, catalog).some((error) => error.path === "fees.otherLabel"));
}

{
  const repeated = createDraft({ project: { name: "去重" }, lines: [line(), line({ room: "卧室" })] });
  const model = buildDeckModel(repeated, catalog, content);
  assert.equal(model.products.length, 1, "重复产品只生成一张产品页");
  assert.equal(model.series.length, 1, "重复系列只生成一张系列页");
  assert.equal(model.quotePages.length, 1);
}

{
  const seriesProducts = [...new Set(catalog.map((product) => product.series))].map((series) => catalog.find((product) => product.series === series));
  const seriesDraft = createDraft({ project: { name: "四系列" }, lines: seriesProducts.map((product, index) => line({ room: `空间${index + 1}`, productCode: product.code })) });
  const model = buildDeckModel(seriesDraft, catalog, content);
  assert.equal(model.series.length, 4, "四个在售系列都应被识别");
  assert.equal(model.products.length, 4);
  const pending = catalog.find((product) => product.metadata_status === "待确认");
  assert(pending, "产品库应保留待确认产品");
  assert.equal(validateDraft(createDraft({ project: { name: "待确认可用" }, lines: [line({ productCode: pending.code })] }), catalog).length, 0);
  const missingMedia = { ...catalog[0], code: "MISSING-MEDIA", gallery: [], img_a: "", img_b: "", img_e: "" };
  const missingModel = buildDeckModel(createDraft({ project: { name: "缺图回退" }, lines: [line({ productCode: missingMedia.code })] }), [missingMedia], content);
  assert.equal(missingModel.products[0].sceneCandidates.length, 0);
}

{
  const storage = new MemoryStorage();
  const repo = new DraftRepository(storage);
  const first = repo.create({ project: { name: "草稿 A" }, lines: [line()] });
  assert.equal(repo.get(first.id).project.name, "草稿 A");
  assert.equal(repo.active(), first.id);
  const duplicate = repo.duplicate(first.id);
  assert.notEqual(duplicate.id, first.id);
  assert.match(duplicate.title, /副本/);
  const renamed = repo.rename(duplicate.id, "客户复核版");
  assert.equal(renamed.title, "客户复核版");
  repo.delete(first.id);
  assert.equal(repo.get(first.id), null);
  storage.setItem(DRAFT_STORAGE_KEY, "{bad json");
  assert.deepEqual(repo.list(), [], "损坏数据应安全回退");
  storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify([{ id: "legacy", version: 0, name: "旧草稿", project: { name: "旧项目" }, lines: [line()] }]));
  assert.equal(repo.list()[0].version, 1, "旧草稿应迁移到 V1");
  storage.setItem(ACTIVE_DRAFT_KEY, "legacy");
  assert.equal(repo.active(), "legacy");
}

console.log(`Dealer quote tests passed: ${catalog.length} products, 4 series, calculations, drafts and deck model.`);
