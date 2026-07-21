import { buildDeckModel, centsToYuan, normalizeSeriesName } from "./quote-core.mjs";

const CDN_BASE = "https://cdn.jsdelivr.net/gh/jiachunwang1115-afk/chimutang-website@ec37226/product-assets/catalog/";
const FONT = "Microsoft YaHei";
const W = 13.333;
const H = 7.5;
const C = {
  paper: "F5F0E8",
  paperLight: "FBF8F2",
  ink: "2E251F",
  brown: "5B3928",
  wood: "A36F46",
  clay: "B98A62",
  line: "D8CCBE",
  muted: "796B60",
  white: "FFFDF8",
  green: "68715C",
};

const currency = (cents) => new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
}).format(centsToYuan(cents));

const dateText = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : String(value || "");
};

const safeName = (value) => String(value || "项目").replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim().slice(0, 40) || "项目";

function addImage(slide, asset, x, y, w, h, mode = "cover") {
  if (!asset) {
    slide.addShape("rect", { x, y, w, h, fill: { color: "E7DED3" }, line: { color: "D4C6B7", width: 0.8 } });
    slide.addText("图片未载入\n产品参数仍可编辑", { x: x + 0.2, y: y + h / 2 - 0.3, w: w - 0.4, h: 0.6, fontFace: FONT, fontSize: 14, color: C.muted, align: "center", valign: "mid", margin: 0 });
    return;
  }
  const source = asset.data ? { data: asset.data } : { path: asset.path };
  slide.addImage({ ...source, x, y, w, h, sizing: { type: mode, w, h } });
}

function addImageVeil(slide, x, y, w, h, transparency = 35) {
  slide.addShape("rect", { x, y, w, h, fill: { color: "1D1713", transparency }, line: { color: "1D1713", transparency: 100 } });
}

function addPageChrome(slide, section, page, dark = false) {
  const color = dark ? C.white : C.muted;
  slide.addText("WOOD ALL  ·  PRIVATE QUOTATION", { x: 0.62, y: 0.28, w: 4.7, h: 0.2, fontFace: FONT, fontSize: 10, bold: true, color, charSpacing: 1.2, margin: 0 });
  slide.addText(`${section}   ${String(page).padStart(2, "0")}`, { x: 10.9, y: 0.28, w: 1.8, h: 0.2, fontFace: FONT, fontSize: 10, color, align: "right", margin: 0 });
}

function addSlideTitle(slide, eyebrow, title, subtitle = "") {
  slide.addText(eyebrow, { x: 0.68, y: 0.72, w: 3.8, h: 0.24, fontFace: FONT, fontSize: 11, bold: true, color: C.wood, charSpacing: 1.6, margin: 0 });
  slide.addText(title, { x: 0.66, y: 1.02, w: 8.7, h: 0.58, fontFace: FONT, fontSize: 36, bold: true, color: C.ink, margin: 0, breakLine: false });
  if (subtitle) slide.addText(subtitle, { x: 9.2, y: 1.1, w: 3.45, h: 0.38, fontFace: FONT, fontSize: 15, color: C.muted, align: "right", margin: 0, fit: "shrink" });
  slide.addShape("line", { x: 0.68, y: 1.72, w: 12.0, h: 0, line: { color: C.line, width: 1 } });
}

function addLabelValue(slide, label, value, x, y, w, options = {}) {
  slide.addText(label, { x, y, w, h: 0.2, fontFace: FONT, fontSize: 10, bold: true, color: options.dark ? "D7C7B8" : C.muted, charSpacing: 0.8, margin: 0 });
  slide.addText(value || "-", { x, y: y + 0.25, w, h: options.h || 0.42, fontFace: FONT, fontSize: options.size || 18, bold: options.bold || false, color: options.dark ? C.white : C.ink, margin: 0, valign: "top", fit: "shrink" });
}

function asCandidateList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function productUrls(candidate) {
  if (typeof candidate === "string") return [candidate];
  const urls = [];
  if (candidate?.src) {
    const src = String(candidate.src);
    urls.push(/^(https?:|data:|\/|product-assets\/|media\/|logo\/)/.test(src) ? src : `${CDN_BASE}${src}`);
  }
  if (candidate?.thumb) urls.push(candidate.thumb);
  return urls;
}

export async function createBrowserImageProvider() {
  const cache = new Map();
  return async (candidates, options = {}) => {
    const urls = asCandidateList(candidates).flatMap(productUrls);
    for (const url of urls) {
      const absolute = /^(https?:|data:)/.test(url) ? url : new URL(url, window.location.href).href;
      const key = `${absolute}|${options.format || "jpeg"}|${options.maxWidth || 1600}`;
      if (cache.has(key)) return cache.get(key);
      try {
        const response = await fetch(absolute, { method: "GET", credentials: "omit", cache: "force-cache" });
        if (!response.ok) continue;
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        const scale = Math.min(1, (options.maxWidth || 1600) / bitmap.width, (options.maxHeight || 1200) / bitmap.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d", { alpha: options.format === "png" });
        if (options.format !== "png") {
          context.fillStyle = "#F5F0E8";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const data = canvas.toDataURL(options.format === "png" ? "image/png" : "image/jpeg", options.quality || 0.84);
        const result = { data, width: canvas.width, height: canvas.height, source: absolute };
        cache.set(key, result);
        return result;
      } catch {
        // Continue to the next real image candidate.
      }
    }
    return null;
  };
}

async function prepareAssets(model, provider) {
  const brand = model.content.brand;
  const result = {
    logo: await provider(brand.logo, { format: "png", maxWidth: 700, maxHeight: 320 }),
    brand: await provider(brand.image, { maxWidth: 1600, maxHeight: 1200 }),
    series: new Map(),
    products: new Map(),
  };
  await Promise.all(model.series.map(async (series) => {
    result.series.set(series.key, await provider(series.representativeImage, { maxWidth: 1600, maxHeight: 1200 }));
  }));
  await Promise.all(model.products.map(async (product) => {
    const [scene, detail, texture] = await Promise.all([
      provider(product.sceneCandidates, { maxWidth: 1700, maxHeight: 1200 }),
      provider(product.detailCandidates, { maxWidth: 1200, maxHeight: 1000 }),
      provider(product.textureCandidates, { maxWidth: 1200, maxHeight: 1000 }),
    ]);
    result.products.set(product.code, { scene, detail, texture });
  }));
  return result;
}

function createPpt(PptxCtor) {
  const pptx = new PptxCtor();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "痴木堂 WOOD ALL";
  pptx.company = "痴木堂 WOOD ALL";
  pptx.subject = "客户私定报价方案";
  pptx.title = "痴木堂私定报价方案";
  pptx.lang = "zh-CN";
  pptx.theme = {
    headFontFace: FONT,
    bodyFontFace: FONT,
    lang: "zh-CN",
  };
  return pptx;
}

function coverSlide(pptx, model, assets, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.brown };
  const hero = assets.products.get(model.products[0]?.code)?.scene || assets.brand;
  addImage(slide, hero, 0, 0, W, H, "cover");
  addImageVeil(slide, 0, 0, W, H, 37);
  addPageChrome(slide, "PROPOSAL", page, true);
  if (assets.logo) addImage(slide, assets.logo, 0.65, 0.62, 1.45, 0.62, "contain");
  else slide.addText("痴木堂\nWOOD ALL", { x: 0.66, y: 0.62, w: 1.7, h: 0.65, fontFace: FONT, fontSize: 18, bold: true, color: C.white, margin: 0 });
  slide.addText("私定报价方案", { x: 0.68, y: 2.25, w: 6.5, h: 0.82, fontFace: FONT, fontSize: 54, bold: true, color: C.white, margin: 0, breakLine: false });
  slide.addText(model.draft.project.name || "客户项目", { x: 0.7, y: 3.24, w: 6.3, h: 0.55, fontFace: FONT, fontSize: 26, color: C.white, margin: 0, fit: "shrink" });
  slide.addShape("line", { x: 0.7, y: 4.08, w: 1.2, h: 0, line: { color: "D4AA7D", width: 3 } });
  slide.addText("以真实产品、明确范围与专业交付，完成一次可核验的选材决策。", { x: 0.7, y: 4.38, w: 5.5, h: 0.65, fontFace: FONT, fontSize: 18, color: C.white, breakLine: true, margin: 0, fit: "shrink" });
  addLabelValue(slide, "报价日期", dateText(model.draft.project.quoteDate), 9.0, 5.7, 1.7, { dark: true, size: 16 });
  addLabelValue(slide, "有效期至", dateText(model.draft.project.validUntil), 10.9, 5.7, 1.7, { dark: true, size: 16 });
  return slide;
}

function projectSlide(pptx, model, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paperLight };
  addPageChrome(slide, "PROJECT", page);
  addSlideTitle(slide, "01  PROJECT BRIEF", "先理解空间，再决定木材", model.draft.project.city || "项目需求");
  addLabelValue(slide, "客户 / 项目", model.draft.project.name, 0.72, 2.08, 3.7, { size: 24, bold: true });
  addLabelValue(slide, "项目地址", [model.draft.project.city, model.draft.project.address].filter(Boolean).join(" · ") || "待补充", 0.72, 3.08, 3.7, { h: 0.72, size: 16 });
  addLabelValue(slide, "方案有效期", `${dateText(model.draft.project.quoteDate)} — ${dateText(model.draft.project.validUntil)}`, 0.72, 4.08, 3.7, { size: 16 });
  slide.addShape("rect", { x: 4.7, y: 2.04, w: 3.8, h: 3.9, fill: { color: "EAE1D6" }, line: { color: "EAE1D6" } });
  slide.addText("项目需求", { x: 5.05, y: 2.38, w: 2.8, h: 0.35, fontFace: FONT, fontSize: 24, bold: true, color: C.brown, margin: 0 });
  slide.addText(model.draft.project.needs || "结合空间功能、采光、风格与日常使用方式，确认木地板的视觉方向与性能重点。", { x: 5.05, y: 3.0, w: 3.05, h: 2.3, fontFace: FONT, fontSize: 17, color: C.ink, breakLine: true, valign: "top", margin: 0.02, fit: "shrink" });
  slide.addShape("rect", { x: 8.75, y: 2.04, w: 3.86, h: 3.9, fill: { color: C.brown }, line: { color: C.brown } });
  slide.addText("选材建议", { x: 9.1, y: 2.38, w: 2.8, h: 0.35, fontFace: FONT, fontSize: 24, bold: true, color: C.white, margin: 0 });
  slide.addText(model.draft.project.advice || "本方案以真实图库与完整参数为依据，兼顾空间连续性、木材天然表现和后续交付范围。", { x: 9.1, y: 3.0, w: 3.08, h: 2.3, fontFace: FONT, fontSize: 17, color: C.white, breakLine: true, valign: "top", margin: 0.02, fit: "shrink" });
  return slide;
}

function brandSlide(pptx, model, assets, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addPageChrome(slide, "BRAND", page);
  addImage(slide, assets.brand, 7.7, 0, 5.633, H, "cover");
  slide.addShape("rect", { x: 0, y: 0, w: 7.9, h: H, fill: { color: C.paper }, line: { color: C.paper } });
  slide.addText("WOOD ALL", { x: 0.72, y: 0.86, w: 2.4, h: 0.25, fontFace: FONT, fontSize: 11, bold: true, color: C.wood, charSpacing: 2.2, margin: 0 });
  slide.addText(model.content.brand.headline, { x: 0.7, y: 1.32, w: 6.25, h: 0.86, fontFace: FONT, fontSize: 38, bold: true, color: C.ink, margin: 0, fit: "shrink" });
  slide.addText(model.content.brand.summary, { x: 0.72, y: 2.45, w: 5.9, h: 1.1, fontFace: FONT, fontSize: 18, color: C.muted, breakLine: true, margin: 0, fit: "shrink" });
  model.content.brand.proofs.forEach((proof, index) => {
    const y = 4.0 + index * 0.8;
    slide.addText(String(index + 1).padStart(2, "0"), { x: 0.72, y, w: 0.45, h: 0.25, fontFace: FONT, fontSize: 13, bold: true, color: C.wood, margin: 0 });
    slide.addShape("line", { x: 1.22, y: y + 0.12, w: 0.42, h: 0, line: { color: C.clay, width: 1.5 } });
    slide.addText(proof, { x: 1.82, y: y - 0.04, w: 4.95, h: 0.54, fontFace: FONT, fontSize: 16, color: C.ink, margin: 0, fit: "shrink" });
  });
  return slide;
}

function seriesSlide(pptx, series, asset, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paperLight };
  addPageChrome(slide, "SERIES", page);
  addImage(slide, asset, 0, 0, 6.3, H, "cover");
  slide.addShape("rect", { x: 6.05, y: 0, w: 7.283, h: H, fill: { color: C.paperLight }, line: { color: C.paperLight } });
  slide.addText("WOOD ALL SERIES", { x: 6.65, y: 0.86, w: 2.8, h: 0.24, fontFace: FONT, fontSize: 11, bold: true, color: C.wood, charSpacing: 1.6, margin: 0 });
  slide.addText(series.shortName || series.key, { x: 6.62, y: 1.25, w: 5.9, h: 0.72, fontFace: FONT, fontSize: 42, bold: true, color: C.ink, margin: 0, fit: "shrink" });
  slide.addText(series.tagline || "系列价值", { x: 6.65, y: 2.12, w: 5.8, h: 0.5, fontFace: FONT, fontSize: 20, color: C.brown, margin: 0, fit: "shrink" });
  slide.addText(series.summary || "", { x: 6.65, y: 2.85, w: 5.65, h: 1.0, fontFace: FONT, fontSize: 17, color: C.muted, margin: 0, fit: "shrink" });
  (series.features || []).slice(0, 3).forEach((feature, index) => {
    const y = 4.26 + index * 0.72;
    slide.addShape("ellipse", { x: 6.68, y: y + 0.05, w: 0.18, h: 0.18, fill: { color: C.wood }, line: { color: C.wood } });
    slide.addText(feature, { x: 7.05, y, w: 5.2, h: 0.46, fontFace: FONT, fontSize: 16, color: C.ink, margin: 0, fit: "shrink" });
  });
  return slide;
}

function productSlide(pptx, product, asset, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paperLight };
  addPageChrome(slide, "PRODUCT", page);
  addSlideTitle(slide, product.seriesKey, `${product.code} · ${product.wood || "原木地板"}`, product.metadata_status === "待确认" ? "资料状态：待确认" : "资料已核验");
  addImage(slide, asset?.scene, 6.4, 1.94, 6.25, 3.42, "cover");
  addImage(slide, asset?.detail, 6.4, 5.55, 2.98, 1.32, "cover");
  addImage(slide, asset?.texture, 9.62, 5.55, 3.03, 1.32, "cover");
  slide.addText("从参数到真实木纹，完整核验本次选材", { x: 0.72, y: 2.08, w: 4.95, h: 0.74, fontFace: FONT, fontSize: 24, bold: true, color: C.brown, margin: 0, fit: "shrink" });
  const specs = [
    ["木种", product.wood], ["板型", product.board],
    ["表面", product.surface], ["结构", product.structure],
    ["规格", product.spec], ["基材", product.base],
    ["等级", product.grade], ["产品型号", product.model || product.code],
  ];
  specs.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 0.72 + col * 2.65;
    const y = 3.08 + row * 0.74;
    addLabelValue(slide, label, value || "-", x, y, 2.2, { size: 16, h: 0.32 });
  });
  slide.addText("天然木材的色差、纹理与结疤具有个体差异，最终以确认样品与到货实物为准。", { x: 0.72, y: 6.34, w: 5.15, h: 0.5, fontFace: FONT, fontSize: 13, color: C.muted, margin: 0, fit: "shrink" });
  return slide;
}

function addTableRow(slide, values, widths, y, options = {}) {
  let x = 0.68;
  values.forEach((value, index) => {
    const w = widths[index];
    slide.addShape("rect", { x, y, w, h: options.h || 0.56, fill: { color: options.fill || C.paperLight }, line: { color: options.line || C.line, width: 0.6 } });
    slide.addText(String(value ?? ""), { x: x + 0.08, y: y + 0.04, w: w - 0.16, h: (options.h || 0.56) - 0.08, fontFace: FONT, fontSize: options.fontSize || 15, bold: options.bold || false, color: options.color || C.ink, align: options.align?.[index] || "left", valign: "mid", margin: 0 });
    x += w;
  });
}

function configurationSlide(pptx, model, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paperLight };
  addPageChrome(slide, "CONFIGURATION", page);
  addSlideTitle(slide, "SPACE & PRODUCT", "让每个空间都有明确的产品依据", `${model.totals.totalBillableArea.toFixed(2)} m² 计价面积`);
  const widths = [1.55, 2.05, 1.65, 1.15, 1.25, 4.35];
  addTableRow(slide, ["空间", "产品型号", "系列", "净面积", "损耗", "选材备注"], widths, 2.05, { h: 0.58, fill: C.brown, line: C.brown, color: C.white, bold: true, fontSize: 14 });
  model.lines.forEach((line, index) => {
    const product = line.product || {};
    addTableRow(slide, [line.room, line.productCode, normalizeSeriesName(product.series).split("（")[0], `${line.netArea.toFixed(2)} m²`, `${line.wasteRate}%`, line.note || "与整体空间方案协调确认"], widths, 2.63 + index * 0.52, { h: 0.52, fill: index % 2 ? "F1EBE3" : C.paperLight, fontSize: 14 });
  });
  slide.addText("计价面积 = 净面积 ×（1 + 损耗率）", { x: 0.7, y: 6.96, w: 4.6, h: 0.22, fontFace: FONT, fontSize: 12, color: C.muted, margin: 0 });
  return slide;
}

function quoteSlide(pptx, model, quotePage, index, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paperLight };
  addPageChrome(slide, "QUOTATION", page);
  addSlideTitle(slide, "PRIVATE QUOTATION", index ? `报价明细 · 续 ${index + 1}` : "报价明细", quotePage.isLast ? `合计 ${currency(model.totals.totalCents)}` : "明细续页");
  const widths = [1.32, 1.68, 1.0, 0.86, 1.16, 1.26, 1.48, 3.24];
  addTableRow(slide, ["空间", "型号", "净面积", "损耗", "计价面积", "单价", "金额", "备注"], widths, 2.03, { h: 0.58, fill: C.brown, line: C.brown, color: C.white, bold: true, fontSize: 13 });
  quotePage.lines.forEach((line, rowIndex) => {
    addTableRow(slide, [line.room, line.productCode, line.netArea.toFixed(2), `${line.wasteRate}%`, line.billableArea.toFixed(2), currency(line.unitPriceCents).replace("CN¥", "¥"), currency(line.amountCents).replace("CN¥", "¥"), line.note || "-"], widths, 2.61 + rowIndex * 0.57, { h: 0.57, fill: rowIndex % 2 ? "F1EBE3" : C.paperLight, fontSize: 13 });
  });
  if (quotePage.isLast) {
    const items = [
      ["地板金额", model.totals.materialCents],
      ...model.totals.optionalItems.map((item) => [item.label, item.cents]),
      ...(model.totals.discountCents ? [["优惠", -model.totals.discountCents]] : []),
      [model.totals.taxMode === "included" ? `含税额（${model.totals.taxRate}%）` : `税额（${model.totals.taxRate}%）`, model.totals.taxCents],
    ];
    const startY = 6.15 - Math.min(3, items.length) * 0.3;
    slide.addText(items.map(([label, cents]) => `${label}  ${cents < 0 ? "-" : ""}${currency(Math.abs(cents))}`).join("    "), { x: 0.72, y: startY, w: 8.1, h: 0.62, fontFace: FONT, fontSize: 13, color: C.muted, margin: 0, fit: "shrink" });
    slide.addShape("rect", { x: 9.25, y: 5.62, w: 3.4, h: 1.18, fill: { color: C.brown }, line: { color: C.brown } });
    slide.addText("报价总额", { x: 9.56, y: 5.84, w: 1.0, h: 0.22, fontFace: FONT, fontSize: 12, color: "DACABC", margin: 0 });
    slide.addText(currency(model.totals.totalCents), { x: 9.55, y: 6.15, w: 2.75, h: 0.38, fontFace: FONT, fontSize: 24, bold: true, color: C.white, align: "right", margin: 0, fit: "shrink" });
  }
  return slide;
}

function serviceSlide(pptx, model, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addPageChrome(slide, "SERVICE", page);
  addSlideTitle(slide, "DELIVERY", model.content.service.headline, "全周期服务");
  slide.addText(model.content.service.summary, { x: 0.72, y: 2.05, w: 8.8, h: 0.6, fontFace: FONT, fontSize: 17, color: C.muted, margin: 0, fit: "shrink" });
  model.content.service.steps.forEach((step, index) => {
    const x = 0.72 + index * 3.02;
    slide.addText(String(index + 1).padStart(2, "0"), { x, y: 3.02, w: 0.55, h: 0.3, fontFace: FONT, fontSize: 15, bold: true, color: C.wood, margin: 0 });
    slide.addShape("line", { x, y: 3.48, w: 2.46, h: 0, line: { color: index === 3 ? C.brown : C.line, width: index === 3 ? 3 : 1 } });
    slide.addText(step.title, { x, y: 3.82, w: 2.55, h: 0.48, fontFace: FONT, fontSize: 24, bold: true, color: C.ink, margin: 0, fit: "shrink" });
    slide.addText(step.text, { x, y: 4.58, w: 2.55, h: 1.15, fontFace: FONT, fontSize: 16, color: C.muted, margin: 0, fit: "shrink" });
  });
  slide.addText("选材、报价与交付使用同一套信息", { x: 0.72, y: 6.48, w: 5.2, h: 0.42, fontFace: FONT, fontSize: 20, bold: true, color: C.brown, margin: 0 });
  return slide;
}

function termsSlide(pptx, model, assets, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.brown };
  addPageChrome(slide, "CONFIRMATION", page, true);
  if (assets.logo) {
    slide.addShape("rect", { x: 10.7, y: 0.58, w: 2.05, h: 0.92, fill: { color: C.paperLight }, line: { color: C.paperLight } });
    addImage(slide, assets.logo, 10.86, 0.7, 1.75, 0.68, "contain");
  }
  slide.addText("确认报价范围，进入下一步", { x: 0.72, y: 1.0, w: 7.6, h: 0.82, fontFace: FONT, fontSize: 42, bold: true, color: C.white, margin: 0, fit: "shrink" });
  slide.addText(model.content.quote.scopeNote, { x: 0.75, y: 2.05, w: 7.3, h: 0.52, fontFace: FONT, fontSize: 18, color: "E8DDD1", margin: 0, fit: "shrink" });
  slide.addShape("line", { x: 0.74, y: 2.92, w: 11.9, h: 0, line: { color: "8A6954", width: 1 } });
  slide.addText("报价条款", { x: 0.75, y: 3.34, w: 2.4, h: 0.42, fontFace: FONT, fontSize: 24, bold: true, color: C.white, margin: 0 });
  slide.addText(model.draft.terms, { x: 0.75, y: 4.02, w: 7.35, h: 1.55, fontFace: FONT, fontSize: 16, color: "E8DDD1", margin: 0, fit: "shrink" });
  slide.addText(model.content.quote.naturalMaterialNote, { x: 0.75, y: 5.92, w: 7.35, h: 0.58, fontFace: FONT, fontSize: 13, color: "CBB8A7", margin: 0, fit: "shrink" });
  slide.addShape("rect", { x: 8.75, y: 3.28, w: 3.9, h: 2.95, fill: { color: "3C2C23" }, line: { color: "6E5140", width: 1 } });
  slide.addText("总部联系", { x: 9.12, y: 3.66, w: 2.2, h: 0.35, fontFace: FONT, fontSize: 24, bold: true, color: C.white, margin: 0 });
  addLabelValue(slide, "电话", model.content.contact.phone, 9.12, 4.36, 2.9, { dark: true, size: 18 });
  addLabelValue(slide, "微信", model.content.contact.wechat, 9.12, 5.18, 1.35, { dark: true, size: 18 });
  addLabelValue(slide, "官网", model.content.contact.website.replace(/^www\./, ""), 10.45, 5.18, 1.85, { dark: true, size: 13 });
  return slide;
}

export async function generatePptx({ draft, catalog, content, PptxCtor = globalThis.PptxGenJS, imageProvider, outputFile } = {}) {
  if (!PptxCtor) throw new Error("PPTX 生成组件未加载，请刷新页面后重试");
  const model = buildDeckModel(draft, catalog, content);
  const provider = imageProvider || await createBrowserImageProvider();
  const assets = await prepareAssets(model, provider);
  const pptx = createPpt(PptxCtor);
  let page = 1;
  coverSlide(pptx, model, assets, page++);
  projectSlide(pptx, model, page++);
  brandSlide(pptx, model, assets, page++);
  model.series.forEach((series) => seriesSlide(pptx, series, assets.series.get(series.key), page++));
  model.products.forEach((product) => productSlide(pptx, product, assets.products.get(product.code), page++));
  configurationSlide(pptx, model, page++);
  model.quotePages.forEach((quotePage, index) => quoteSlide(pptx, model, quotePage, index, page++));
  serviceSlide(pptx, model, page++);
  termsSlide(pptx, model, assets, page++);

  const filename = outputFile || `痴木堂-${safeName(draft.project.name)}-${String(draft.project.quoteDate || "").replace(/-/g, "")}-私定报价.pptx`;
  await pptx.writeFile({ fileName: filename, compression: true });
  return { filename, slideCount: page - 1, model };
}
