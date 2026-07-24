import { buildDeckModel, centsToYuan, normalizeSeriesName } from "./quote-core.mjs";

const CDN_BASE = "https://cdn.jsdelivr.net/gh/jiachunwang1115-afk/chimutang-website@ec37226/product-assets/catalog/";
const TITLE_FONT = "Noto Serif SC";
const BODY_FONT = "Noto Sans SC";
const LATIN_FONT = "Aptos";
const W = 13.333;
const H = 7.5;
const C = {
  paper: "F3EFE8",
  paperLight: "FAF8F4",
  ink: "241F1B",
  brown: "5A3827",
  wood: "9A6741",
  clay: "B98A62",
  line: "D8CFC5",
  muted: "746B63",
  white: "FFFDF9",
  soft: "E9E2D9",
  sage: "697064",
};

const currency = (cents) => new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
}).format(centsToYuan(cents)).replace("CN¥", "¥");

const dateText = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : String(value || "");
};

const safeName = (value) => String(value || "项目")
  .replace(/[\\/:*?"<>|]/g, "-")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 40) || "项目";

const imageSource = (asset) => asset?.data ? { data: asset.data } : { path: asset?.path };

function containRect(asset, x, y, w, h) {
  const ratio = Number(asset?.width) > 0 && Number(asset?.height) > 0
    ? Number(asset.width) / Number(asset.height)
    : w / h;
  if (ratio >= w / h) {
    const fittedH = w / ratio;
    return { x, y: y + (h - fittedH) / 2, w, h: fittedH };
  }
  const fittedW = h * ratio;
  return { x: x + (w - fittedW) / 2, y, w: fittedW, h };
}

function addImage(slide, asset, x, y, w, h, mode = "cover") {
  if (!asset) {
    slide.addShape("rect", { x, y, w, h, fill: { color: C.soft }, line: { color: C.line, width: 0.6 } });
    slide.addText("图片暂未载入", {
      x: x + 0.2, y: y + h / 2 - 0.15, w: w - 0.4, h: 0.3,
      fontFace: BODY_FONT, fontSize: 14, color: C.muted, align: "center", margin: 0,
    });
    return;
  }
  const source = imageSource(asset);
  if (mode === "contain") {
    slide.addImage({ ...source, ...containRect(asset, x, y, w, h) });
    return;
  }
  slide.addImage({ ...source, x, y, w, h });
}

function addPageChrome(slide, section, page, dark = false, x = 0.68) {
  const color = dark ? "E6DDD4" : C.muted;
  slide.addText("WOOD ALL  /  PRIVATE PROPOSAL", {
    x, y: 0.28, w: 4.5, h: 0.2, fontFace: LATIN_FONT, fontSize: 9,
    color, charSpacing: 1.2, margin: 0,
  });
  slide.addText(`${section}  ${String(page).padStart(2, "0")}`, {
    x: 10.75, y: 0.28, w: 1.9, h: 0.2, fontFace: LATIN_FONT, fontSize: 9,
    color, align: "right", charSpacing: 0.7, margin: 0,
  });
}

function addSlideTitle(slide, eyebrow, title, subtitle = "") {
  slide.addText(eyebrow, {
    x: 0.7, y: 0.72, w: 4.1, h: 0.22, fontFace: LATIN_FONT, fontSize: 10,
    color: C.wood, charSpacing: 1.6, margin: 0,
  });
  slide.addText(title, {
    x: 0.68, y: 1.03, w: 9.0, h: 0.62, fontFace: TITLE_FONT, fontSize: 36,
    bold: false, color: C.ink, margin: 0, fit: "shrink", breakLine: false,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 9.35, y: 1.16, w: 3.3, h: 0.28, fontFace: BODY_FONT, fontSize: 14,
      color: C.muted, align: "right", margin: 0, fit: "shrink",
    });
  }
  slide.addShape("line", { x: 0.7, y: 1.78, w: 11.95, h: 0, line: { color: C.line, width: 0.8 } });
}

function addLabelValue(slide, label, value, x, y, w, options = {}) {
  slide.addText(label, {
    x, y, w, h: 0.2, fontFace: BODY_FONT, fontSize: 10,
    color: options.dark ? "CFC0B4" : C.muted, margin: 0,
  });
  slide.addText(value || "-", {
    x, y: y + 0.28, w, h: options.h || 0.4, fontFace: options.latin ? LATIN_FONT : BODY_FONT,
    fontSize: options.size || 17, bold: false, color: options.dark ? C.white : C.ink,
    margin: 0, valign: "top", fit: "shrink",
  });
}

function addSectionCopy(slide, number, title, text, x, y, w, dark = false) {
  const ink = dark ? C.white : C.ink;
  const muted = dark ? "D9CCC1" : C.muted;
  slide.addText(number, {
    x, y, w: 0.42, h: 0.22, fontFace: LATIN_FONT, fontSize: 11,
    color: dark ? "D6B18E" : C.wood, margin: 0,
  });
  slide.addShape("line", { x: x + 0.55, y: y + 0.12, w: 0.6, h: 0, line: { color: dark ? "8A6954" : C.line, width: 1 } });
  slide.addText(title, {
    x: x + 1.35, y: y - 0.05, w: w - 1.35, h: 0.4,
    fontFace: TITLE_FONT, fontSize: 22, color: ink, margin: 0, fit: "shrink",
  });
  slide.addText(text, {
    x: x + 1.35, y: y + 0.56, w: w - 1.35, h: 0.9,
    fontFace: BODY_FONT, fontSize: 17, color: muted, margin: 0,
    breakLine: true, valign: "top", fit: "shrink",
  });
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
      const key = `${absolute}|${options.format || "jpeg"}|${options.maxWidth || 1600}|${options.aspectRatio || "auto"}`;
      if (cache.has(key)) return cache.get(key);
      try {
        const response = await fetch(absolute, { method: "GET", credentials: "omit", cache: "force-cache" });
        if (!response.ok) continue;
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        let sx = 0;
        let sy = 0;
        let sourceWidth = bitmap.width;
        let sourceHeight = bitmap.height;
        const targetRatio = Number(options.aspectRatio);
        if (targetRatio > 0) {
          if (bitmap.width / bitmap.height > targetRatio) {
            sourceWidth = bitmap.height * targetRatio;
            sx = (bitmap.width - sourceWidth) / 2;
          } else {
            sourceHeight = bitmap.width / targetRatio;
            sy = (bitmap.height - sourceHeight) / 2;
          }
        }
        const scale = Math.min(1, (options.maxWidth || 1600) / sourceWidth, (options.maxHeight || 1200) / sourceHeight);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(sourceWidth * scale));
        canvas.height = Math.max(1, Math.round(sourceHeight * scale));
        const context = canvas.getContext("2d", { alpha: options.format === "png" });
        if (options.format !== "png") {
          context.fillStyle = "#F3EFE8";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(bitmap, sx, sy, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const data = canvas.toDataURL(options.format === "png" ? "image/png" : "image/jpeg", options.quality || 0.86);
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
  const firstProduct = model.products[0];
  const heroCandidates = firstProduct?.sceneCandidates?.length ? firstProduct.sceneCandidates : brand.image;
  const result = {
    hero: await provider(heroCandidates, { maxWidth: 1600, maxHeight: 1600, aspectRatio: (W - 5.75) / H }),
    logo: await provider(brand.logo, { format: "png", maxWidth: 900, maxHeight: 700 }),
    brand: await provider(brand.image, { maxWidth: 1200, maxHeight: 1600, aspectRatio: (W - 7.88) / H }),
    coverBrand: await provider(brand.image, { maxWidth: 1800, maxHeight: 1600, aspectRatio: (W - 4.92) / H }),
    backBrand: await provider(brand.image, { maxWidth: 1920, maxHeight: 1000, aspectRatio: W / 5.45 }),
    series: new Map(),
    products: new Map(),
  };
  await Promise.all(model.series.map(async (series) => {
    result.series.set(series.key, await provider(series.representativeImage, { maxWidth: 1200, maxHeight: 1600, aspectRatio: 7.15 / H }));
  }));
  await Promise.all(model.products.map(async (product) => {
    const [scene, detail, texture] = await Promise.all([
      provider(product.sceneCandidates, { maxWidth: 1600, maxHeight: 1100, aspectRatio: 7.15 / 4.65 }),
      provider(product.detailCandidates, { maxWidth: 1000, maxHeight: 600, aspectRatio: 3.45 / 1.36 }),
      provider(product.textureCandidates, { maxWidth: 1000, maxHeight: 600, aspectRatio: 3.47 / 1.36 }),
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
  pptx.subject = "原木地板私定提案";
  pptx.title = "痴木堂原木地板私定提案";
  pptx.lang = "zh-CN";
  pptx.theme = { headFontFace: TITLE_FONT, bodyFontFace: BODY_FONT, lang: "zh-CN" };
  return pptx;
}

function coverSlide(pptx, model, assets, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.ink };
  addImage(slide, assets.coverBrand, 4.9, 0, W - 4.9, H, "cover");
  slide.addShape("rect", { x: 0, y: 0, w: 4.98, h: H, fill: { color: C.ink }, line: { color: C.ink } });
  slide.addShape("rect", { x: 4.9, y: 0, w: 0.08, h: H, fill: { color: C.clay }, line: { color: C.clay } });
  slide.addText("WOOD ALL", {
    x: 0.72, y: 0.48, w: 1.8, h: 0.22, fontFace: LATIN_FONT, fontSize: 10,
    color: "D7B89E", charSpacing: 1.6, margin: 0,
  });
  slide.addText("私定报价", {
    x: 0.68, y: 2.72, w: 3.7, h: 0.78, fontFace: TITLE_FONT, fontSize: 46,
    bold: false, color: C.white, margin: 0, fit: "shrink", breakLine: false,
  });
  slide.addText(model.draft.project.name || "客户项目", {
    x: 0.72, y: 4.48, w: 3.45, h: 0.38, fontFace: BODY_FONT, fontSize: 19,
    color: "E8DDD4", margin: 0, fit: "shrink",
  });
  slide.addText(dateText(model.draft.project.quoteDate), {
    x: 0.72, y: 6.68, w: 1.6, h: 0.22, fontFace: LATIN_FONT, fontSize: 10,
    color: "B9A79B", margin: 0,
  });
  return slide;
}

function projectSlide(pptx, model, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paperLight };
  addPageChrome(slide, "PROJECT", page);
  addSlideTitle(slide, "PROJECT / 项目判断", "先读懂空间，再选择木材", model.draft.project.city || "项目需求");
  const needs = model.draft.project.needs || "空间的尺度、光线与日常使用，共同决定木材应有的色泽、纹理与结构。";
  const advice = model.draft.project.advice || "先建立整体木色，再以板型、表面与铺装方向，校准每个空间的气质。";
  const city = String(model.draft.project.city || "").trim();
  const address = String(model.draft.project.address || "").trim();
  const projectLocation = address.includes(city) ? address : [city, address].filter(Boolean).join(" · ");
  addSectionCopy(slide, "01", "本案所求", needs, 0.72, 2.35, 5.65);
  addSectionCopy(slide, "02", "我们的判断", advice, 6.78, 2.35, 5.85);
  slide.addShape("line", { x: 0.72, y: 5.18, w: 11.9, h: 0, line: { color: C.line, width: 0.8 } });
  addLabelValue(slide, "客户 / 项目", model.draft.project.name, 0.72, 5.62, 3.3, { size: 20 });
  addLabelValue(slide, "项目地址", projectLocation || "待补充", 4.35, 5.62, 4.2, { size: 16 });
  addLabelValue(slide, "方案有效期", `${dateText(model.draft.project.quoteDate)} — ${dateText(model.draft.project.validUntil)}`, 9.0, 5.62, 3.0, { size: 16, latin: true });
  return slide;
}

function brandSlide(pptx, model, assets, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addImage(slide, assets.brand, 7.88, 0, W - 7.88, H, "cover");
  slide.addShape("rect", { x: 0, y: 0, w: 7.92, h: H, fill: { color: C.paper }, line: { color: C.paper } });
  addPageChrome(slide, "BRAND", page);
  slide.addText("WOOD ALL / 痴木堂", {
    x: 0.72, y: 0.86, w: 3.2, h: 0.24, fontFace: LATIN_FONT, fontSize: 10,
    color: C.wood, charSpacing: 1.7, margin: 0,
  });
  slide.addText(model.content.brand.headline, {
    x: 0.7, y: 1.35, w: 6.45, h: 1.05, fontFace: TITLE_FONT, fontSize: 38,
    bold: false, color: C.ink, margin: 0, fit: "shrink",
  });
  slide.addText(model.content.brand.summary, {
    x: 0.72, y: 2.68, w: 6.2, h: 0.9, fontFace: BODY_FONT, fontSize: 18,
    color: C.muted, margin: 0, fit: "shrink", breakLine: true,
  });
  (model.content.brand.proofs || []).slice(0, 3).forEach((proof, index) => {
    const item = typeof proof === "string" ? { title: String(index + 1).padStart(2, "0"), text: proof } : proof;
    const y = 4.0 + index * 0.86;
    slide.addShape("line", { x: 0.72, y: y - 0.12, w: 6.25, h: 0, line: { color: C.line, width: 0.8 } });
    slide.addText(item.title, { x: 0.72, y, w: 1.35, h: 0.3, fontFace: BODY_FONT, fontSize: 16, color: C.brown, margin: 0, fit: "shrink" });
    slide.addText(item.text, { x: 2.0, y, w: 4.85, h: 0.34, fontFace: BODY_FONT, fontSize: 16, color: C.ink, margin: 0, fit: "shrink" });
  });
  return slide;
}

function seriesSlide(pptx, series, asset, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paperLight };
  addImage(slide, asset, 0, 0, 7.15, H, "cover");
  slide.addShape("rect", { x: 7.12, y: 0, w: W - 7.12, h: H, fill: { color: C.paperLight }, line: { color: C.paperLight } });
  addPageChrome(slide, "SERIES", page, false, 7.72);
  slide.addText(series.key || "WOOD ALL SERIES", {
    x: 7.72, y: 0.9, w: 4.8, h: 0.26, fontFace: BODY_FONT, fontSize: 10,
    color: C.wood, margin: 0, fit: "shrink",
  });
  slide.addText(series.shortName || series.key, {
    x: 7.68, y: 1.32, w: 4.75, h: 0.66, fontFace: TITLE_FONT, fontSize: 40,
    bold: false, color: C.ink, margin: 0, fit: "shrink",
  });
  slide.addText(series.tagline || "让木材自然进入空间", {
    x: 7.72, y: 2.25, w: 4.75, h: 0.65, fontFace: TITLE_FONT, fontSize: 23,
    color: C.brown, margin: 0, fit: "shrink",
  });
  slide.addText(series.summary || "", {
    x: 7.72, y: 3.08, w: 4.75, h: 0.9, fontFace: BODY_FONT, fontSize: 17,
    color: C.muted, margin: 0, fit: "shrink", breakLine: true,
  });
  (series.features || []).slice(0, 3).forEach((feature, index) => {
    const item = typeof feature === "string" ? { title: String(index + 1).padStart(2, "0"), text: feature } : feature;
    const y = 4.35 + index * 0.75;
    slide.addShape("line", { x: 7.72, y: y - 0.14, w: 4.75, h: 0, line: { color: C.line, width: 0.8 } });
    slide.addText(item.title, { x: 7.72, y, w: 1.3, h: 0.28, fontFace: BODY_FONT, fontSize: 15, color: C.brown, margin: 0, fit: "shrink" });
    slide.addText(item.text, { x: 9.02, y, w: 3.35, h: 0.34, fontFace: BODY_FONT, fontSize: 15, color: C.ink, margin: 0, fit: "shrink" });
  });
  return slide;
}

function productSlide(pptx, product, asset, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paperLight };
  addPageChrome(slide, "PRODUCT", page);
  addImage(slide, asset?.scene, 0.68, 0.92, 7.15, 4.65, "cover");
  slide.addText(product.seriesKey, {
    x: 8.42, y: 0.92, w: 3.8, h: 0.23, fontFace: BODY_FONT, fontSize: 10,
    color: C.wood, margin: 0, fit: "shrink",
  });
  slide.addText(product.code, {
    x: 8.38, y: 1.34, w: 4.15, h: 0.62, fontFace: TITLE_FONT, fontSize: 38,
    color: C.ink, margin: 0, fit: "shrink", breakLine: false,
  });
  slide.addText(product.wood || "原木地板", {
    x: 8.42, y: 2.08, w: 3.8, h: 0.4, fontFace: BODY_FONT, fontSize: 20,
    color: C.brown, margin: 0, fit: "shrink",
  });
  slide.addShape("line", { x: 8.42, y: 2.75, w: 4.15, h: 0, line: { color: C.line, width: 0.8 } });
  slide.addText("所见，是选材的依据", {
    x: 8.42, y: 3.05, w: 3.8, h: 0.35, fontFace: TITLE_FONT, fontSize: 20,
    color: C.ink, margin: 0,
  });
  slide.addText("场景、细节与纹理均取自真实产品图库；最终以实物选样确认木色与天然差异。", {
    x: 8.42, y: 3.55, w: 4.0, h: 0.72, fontFace: BODY_FONT, fontSize: 15,
    color: C.muted, margin: 0, fit: "shrink", breakLine: true,
  });
  const specs = [
    ["板型", product.board], ["表面", product.surface],
    ["结构", product.structure], ["规格", product.spec],
    ["基材", product.base], ["等级", product.grade],
  ];
  specs.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    addLabelValue(slide, label, value || "-", 8.42 + col * 2.05, 4.55 + row * 0.68, 1.75, { size: 14, h: 0.28 });
  });
  addImage(slide, asset?.detail, 0.68, 5.78, 3.45, 1.36, "cover");
  addImage(slide, asset?.texture, 4.36, 5.78, 3.47, 1.36, "cover");
  slide.addText(product.metadata_status === "待确认" ? "产品资料状态：待确认" : "产品资料已核验", {
    x: 8.42, y: 6.88, w: 3.4, h: 0.2, fontFace: BODY_FONT, fontSize: 10,
    color: product.metadata_status === "待确认" ? C.wood : C.sage, margin: 0,
  });
  return slide;
}

function addFlatRow(slide, values, widths, y, options = {}) {
  const x0 = options.x || 0.72;
  const height = options.h || 0.56;
  const fill = options.fill || C.paperLight;
  const color = options.color || C.ink;
  const fontSize = options.fontSize || 14;
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  slide.addShape("rect", { x: x0, y, w: totalWidth, h: height, fill: { color: fill }, line: { color: fill } });
  slide.addShape("line", { x: x0, y: y + height, w: totalWidth, h: 0, line: { color: options.line || C.line, width: 0.6 } });
  let x = x0;
  values.forEach((value, index) => {
    const w = widths[index];
    slide.addText(String(value ?? ""), {
      x: x + 0.08, y: y + 0.04, w: w - 0.16, h: height - 0.08,
      fontFace: BODY_FONT, fontSize, color, bold: Boolean(options.bold),
      align: options.align?.[index] || "left", valign: "mid", margin: 0, fit: "shrink",
    });
    x += w;
  });
}

function configurationSlide(pptx, model, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paperLight };
  addPageChrome(slide, "CONFIGURATION", page);
  addSlideTitle(slide, "SPACE / 空间配置", "空间有别，木色相连", `${model.totals.totalBillableArea.toFixed(2)} m² 计价面积`);
  const widths = [1.35, 1.75, 1.55, 1.2, 1.05, 4.99];
  addFlatRow(slide, ["空间", "产品型号", "系列", "净面积", "损耗", "选材备注"], widths, 2.18, {
    h: 0.55, fill: C.ink, line: C.ink, color: C.white, bold: true, fontSize: 13,
  });
  model.lines.forEach((line, index) => {
    const product = line.product || {};
    addFlatRow(slide, [
      line.room,
      line.productCode,
      normalizeSeriesName(product.series).split("（")[0],
      `${line.netArea.toFixed(2)} m²`,
      `${line.wasteRate}%`,
      line.note || "与整体空间关系协调确认",
    ], widths, 2.73 + index * 0.52, { h: 0.52, fill: index % 2 ? C.paper : C.paperLight, fontSize: 13 });
  });
  slide.addText("计价面积 = 净面积 ×（1 + 损耗率）", {
    x: 0.72, y: 6.87, w: 4.5, h: 0.22, fontFace: BODY_FONT, fontSize: 11,
    color: C.muted, margin: 0,
  });
  return slide;
}

function quoteSlide(pptx, model, quotePage, index, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paperLight };
  addPageChrome(slide, "QUOTATION", page);
  addSlideTitle(
    slide,
    "QUOTATION / 报价明细",
    index ? `本案报价 · 续 ${index + 1}` : "本案报价，清晰到每一项",
    quotePage.isLast ? `报价总额 ${currency(model.totals.totalCents)}` : "明细续页",
  );
  const widths = [1.12, 1.48, 0.92, 0.72, 1.08, 1.1, 1.28, 4.19];
  addFlatRow(slide, ["空间", "型号", "净面积", "损耗", "计价面积", "单价", "金额", "备注"], widths, 2.15, {
    h: 0.55, fill: C.ink, line: C.ink, color: C.white, bold: true, fontSize: 12,
  });
  quotePage.lines.forEach((line, rowIndex) => {
    addFlatRow(slide, [
      line.room,
      line.productCode,
      line.netArea.toFixed(2),
      `${line.wasteRate}%`,
      line.billableArea.toFixed(2),
      currency(line.unitPriceCents),
      currency(line.amountCents),
      line.note || "-",
    ], widths, 2.7 + rowIndex * 0.55, { h: 0.55, fill: rowIndex % 2 ? C.paper : C.paperLight, fontSize: 12 });
  });
  if (quotePage.isLast) {
    const items = [
      ["地板", model.totals.materialCents],
      ...model.totals.optionalItems.map((item) => [item.label, item.cents]),
      ...(model.totals.discountCents ? [["优惠", -model.totals.discountCents]] : []),
      [model.totals.taxMode === "included" ? `含税额 ${model.totals.taxRate}%` : `税额 ${model.totals.taxRate}%`, model.totals.taxCents],
    ];
    slide.addShape("line", { x: 0.72, y: 6.02, w: 11.9, h: 0, line: { color: C.ink, width: 1 } });
    slide.addText(items.map(([label, cents]) => `${label}  ${cents < 0 ? "-" : ""}${currency(Math.abs(cents))}`).join("    "), {
      x: 0.72, y: 6.27, w: 8.35, h: 0.5, fontFace: BODY_FONT, fontSize: 12,
      color: C.muted, margin: 0, fit: "shrink",
    });
    slide.addText("报价总额", { x: 9.35, y: 6.22, w: 1.0, h: 0.22, fontFace: BODY_FONT, fontSize: 11, color: C.muted, margin: 0 });
    slide.addText(currency(model.totals.totalCents), {
      x: 9.35, y: 6.48, w: 3.28, h: 0.42, fontFace: LATIN_FONT, fontSize: 27,
      color: C.brown, align: "right", margin: 0, fit: "shrink",
    });
  }
  return slide;
}

function serviceSlide(pptx, model, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addPageChrome(slide, "DELIVERY", page);
  addSlideTitle(slide, "DELIVERY / 服务交付", model.content.service.headline, "全周期服务");
  slide.addText(model.content.service.summary, {
    x: 0.72, y: 2.08, w: 8.7, h: 0.55, fontFace: BODY_FONT, fontSize: 17,
    color: C.muted, margin: 0, fit: "shrink",
  });
  slide.addShape("line", { x: 0.95, y: 3.48, w: 10.96, h: 0, line: { color: C.line, width: 1 } });
  model.content.service.steps.forEach((step, index) => {
    const x = 0.72 + index * 3.02;
    slide.addShape("ellipse", { x: x + 0.12, y: 3.34, w: 0.28, h: 0.28, fill: { color: index === 3 ? C.brown : C.paper }, line: { color: index === 3 ? C.brown : C.wood, width: 1.2 } });
    slide.addText(String(index + 1).padStart(2, "0"), { x, y: 2.98, w: 0.5, h: 0.22, fontFace: LATIN_FONT, fontSize: 11, color: C.wood, align: "center", margin: 0 });
    slide.addText(step.title, { x, y: 3.9, w: 2.45, h: 0.42, fontFace: TITLE_FONT, fontSize: 22, color: C.ink, margin: 0, fit: "shrink" });
    slide.addText(step.text, { x, y: 4.62, w: 2.5, h: 0.9, fontFace: BODY_FONT, fontSize: 15, color: C.muted, margin: 0, fit: "shrink", breakLine: true });
  });
  slide.addText("同一份确认，贯穿选材、报价与交付。", {
    x: 0.72, y: 6.4, w: 5.5, h: 0.38, fontFace: TITLE_FONT, fontSize: 20,
    color: C.brown, margin: 0,
  });
  return slide;
}

function termsSlide(pptx, model, page) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paperLight };
  slide.addShape("rect", { x: 8.55, y: 0, w: W - 8.55, h: H, fill: { color: C.brown }, line: { color: C.brown } });
  addPageChrome(slide, "CONFIRMATION", page);
  slide.addText("CONFIRMATION / 方案确认", {
    x: 0.72, y: 0.9, w: 3.3, h: 0.22, fontFace: LATIN_FONT, fontSize: 10,
    color: C.wood, charSpacing: 1.5, margin: 0,
  });
  slide.addText("确认方案，\n进入复尺与选样", {
    x: 0.68, y: 1.35, w: 6.9, h: 1.28, fontFace: TITLE_FONT, fontSize: 40,
    color: C.ink, margin: 0, fit: "shrink", breakLine: true,
  });
  slide.addText(model.content.quote.scopeNote, {
    x: 0.72, y: 2.92, w: 6.85, h: 0.55, fontFace: BODY_FONT, fontSize: 16,
    color: C.muted, margin: 0, fit: "shrink",
  });
  const steps = model.content.quote.confirmationSteps || [];
  steps.slice(0, 3).forEach((step, index) => {
    const y = 3.82 + index * 0.74;
    slide.addText(String(index + 1).padStart(2, "0"), { x: 0.72, y, w: 0.45, h: 0.22, fontFace: LATIN_FONT, fontSize: 11, color: C.wood, margin: 0 });
    slide.addText(step.title, { x: 1.35, y: y - 0.03, w: 1.35, h: 0.3, fontFace: BODY_FONT, fontSize: 16, color: C.brown, margin: 0, fit: "shrink" });
    slide.addText(step.text, { x: 2.8, y: y - 0.03, w: 4.7, h: 0.38, fontFace: BODY_FONT, fontSize: 15, color: C.ink, margin: 0, fit: "shrink" });
  });
  slide.addShape("line", { x: 0.72, y: 6.18, w: 7.1, h: 0, line: { color: C.line, width: 0.8 } });
  slide.addText("报价说明", { x: 0.72, y: 6.43, w: 1.0, h: 0.22, fontFace: BODY_FONT, fontSize: 11, color: C.muted, margin: 0 });
  slide.addText(model.draft.terms, { x: 1.72, y: 6.38, w: 6.1, h: 0.5, fontFace: BODY_FONT, fontSize: 13, color: C.muted, margin: 0, fit: "shrink" });
  slide.addText("痴木堂", { x: 9.12, y: 1.05, w: 2.5, h: 0.48, fontFace: TITLE_FONT, fontSize: 28, color: C.white, margin: 0 });
  slide.addText("WOOD ALL", { x: 9.15, y: 1.66, w: 2.4, h: 0.24, fontFace: LATIN_FONT, fontSize: 11, color: "D8C6B7", charSpacing: 2.2, margin: 0 });
  slide.addShape("line", { x: 9.15, y: 2.3, w: 2.85, h: 0, line: { color: "8A6954", width: 0.8 } });
  slide.addText("让木材的真实，\n成为空间的分寸。", { x: 9.12, y: 2.72, w: 3.2, h: 0.9, fontFace: TITLE_FONT, fontSize: 22, color: C.white, margin: 0, breakLine: true });
  addLabelValue(slide, "电话", model.content.contact.phone, 9.15, 4.45, 2.8, { dark: true, size: 18, latin: true });
  addLabelValue(slide, "微信", model.content.contact.wechat, 9.15, 5.27, 1.4, { dark: true, size: 17, latin: true });
  addLabelValue(slide, "官网", model.content.contact.website.replace(/^www\./, ""), 10.72, 5.27, 1.8, { dark: true, size: 14, latin: true });
  slide.addText(model.content.quote.naturalMaterialNote, {
    x: 9.15, y: 6.35, w: 3.15, h: 0.54, fontFace: BODY_FONT, fontSize: 11,
    color: "C9B7A8", margin: 0, fit: "shrink", breakLine: true,
  });
  return slide;
}

function backCoverSlide(pptx, model, assets) {
  const slide = pptx.addSlide();
  slide.background = { color: C.ink };
  addImage(slide, assets.backBrand, 0, 0, W, 5.45, "cover");
  slide.addShape("rect", { x: 0, y: 5.42, w: W, h: H - 5.42, fill: { color: C.ink }, line: { color: C.ink } });
  if (assets.logo) addImage(slide, assets.logo, 11.35, 0.48, 1.18, 0.9, "contain");
  slide.addText("痴木堂  WOOD ALL", {
    x: 0.72, y: 6.0, w: 3.1, h: 0.28, fontFace: BODY_FONT, fontSize: 14,
    color: C.white, margin: 0,
  });
  slide.addText(model.content.contact.website.replace(/^www\./, ""), {
    x: 9.72, y: 6.02, w: 2.85, h: 0.22, fontFace: LATIN_FONT, fontSize: 10,
    color: "CDBCB0", align: "right", margin: 0,
  });
  slide.addText(model.content.contact.phone, {
    x: 9.72, y: 6.42, w: 2.85, h: 0.22, fontFace: LATIN_FONT, fontSize: 10,
    color: "CDBCB0", align: "right", margin: 0,
  });
  return slide;
}

function buildDeckSlides(pptx, model, assets) {
  let page = 1;
  coverSlide(pptx, model, assets, page++);
  projectSlide(pptx, model, page++);
  brandSlide(pptx, model, assets, page++);
  model.series.forEach((series) => seriesSlide(pptx, series, assets.series.get(series.key), page++));
  model.products.forEach((product) => productSlide(pptx, product, assets.products.get(product.code), page++));
  configurationSlide(pptx, model, page++);
  model.quotePages.forEach((quotePage, index) => quoteSlide(pptx, model, quotePage, index, page++));
  serviceSlide(pptx, model, page++);
  termsSlide(pptx, model, page++);
  backCoverSlide(pptx, model, assets);
  page += 1;
  return page - 1;
}

class CanvasSlide {
  constructor() {
    this.background = { color: C.paperLight };
    this.commands = [];
  }

  addText(text, options) {
    this.commands.push({ type: "text", text: String(text ?? ""), options: { ...options } });
  }

  addShape(shape, options) {
    this.commands.push({ type: "shape", shape, options: { ...options } });
  }

  addImage(options) {
    this.commands.push({ type: "image", options: { ...options } });
  }
}

class CanvasDeck {
  constructor() {
    this.slides = [];
  }

  addSlide() {
    const slide = new CanvasSlide();
    this.slides.push(slide);
    return slide;
  }
}

const cssColor = (value, fallback = "#000000") => value ? `#${String(value).replace(/^#/, "")}` : fallback;

function wrapCanvasText(context, text, maxWidth, allowWrap) {
  const paragraphs = String(text).split("\n");
  const lines = [];
  paragraphs.forEach((paragraph) => {
    if (!allowWrap || !paragraph) {
      lines.push(paragraph);
      return;
    }
    let line = "";
    for (const character of paragraph) {
      const candidate = line + character;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  });
  return lines.length ? lines : [""];
}

function canvasTextLayout(context, text, options, pxPerInch) {
  const width = Number(options.w || 0) * pxPerInch;
  const height = Number(options.h || 0.3) * pxPerInch;
  const allowWrap = options.breakLine !== false;
  let fontSize = Number(options.fontSize || 18);
  let lines = [];
  let lineHeight = 0;
  while (fontSize >= 9) {
    const fontPx = fontSize * pxPerInch / 72;
    const weight = options.bold ? 700 : 400;
    const family = options.fontFace || BODY_FONT;
    context.font = `${weight} ${fontPx}px "${family}", "Microsoft YaHei", sans-serif`;
    lines = wrapCanvasText(context, text, Math.max(1, width), allowWrap);
    lineHeight = fontPx * 1.28;
    const widest = Math.max(...lines.map((line) => context.measureText(line).width), 0);
    const fits = widest <= width + 0.5 && lines.length * lineHeight <= height + 0.5;
    if (fits || options.fit !== "shrink") break;
    fontSize -= 0.5;
  }
  return { lines, lineHeight, fontSize };
}

async function loadCanvasImage(source, cache) {
  if (!source) return null;
  if (cache.has(source)) return cache.get(source);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("PDF 图片载入失败"));
    image.src = source;
  });
  cache.set(source, promise);
  return promise;
}

async function renderCanvasSlide(slide, canvas, imageCache) {
  const context = canvas.getContext("2d");
  const pxPerInch = canvas.width / W;
  context.fillStyle = cssColor(slide.background?.color, cssColor(C.paperLight));
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (const command of slide.commands) {
    const options = command.options || {};
    const x = Number(options.x || 0) * pxPerInch;
    const y = Number(options.y || 0) * pxPerInch;
    const width = Number(options.w || 0) * pxPerInch;
    const height = Number(options.h || 0) * pxPerInch;
    if (command.type === "image") {
      const source = options.data || options.path;
      try {
        const image = await loadCanvasImage(source, imageCache);
        if (image) context.drawImage(image, x, y, width, height);
      } catch {
        context.fillStyle = cssColor(C.soft);
        context.fillRect(x, y, width, height);
      }
      continue;
    }
    if (command.type === "shape") {
      const fill = options.fill?.color;
      const line = options.line || {};
      context.beginPath();
      if (command.shape === "line") {
        context.moveTo(x, y);
        context.lineTo(x + width, y + height);
      } else if (command.shape === "ellipse") {
        context.ellipse(x + width / 2, y + height / 2, Math.abs(width / 2), Math.abs(height / 2), 0, 0, Math.PI * 2);
      } else {
        context.rect(x, y, width, height);
      }
      if (fill && Number(options.fill?.transparency || 0) < 100) {
        context.save();
        context.globalAlpha = 1 - Number(options.fill?.transparency || 0) / 100;
        context.fillStyle = cssColor(fill);
        context.fill();
        context.restore();
      }
      if (line.color && Number(line.transparency || 0) < 100) {
        context.save();
        context.globalAlpha = 1 - Number(line.transparency || 0) / 100;
        context.strokeStyle = cssColor(line.color);
        context.lineWidth = Math.max(0.5, Number(line.width || 1) * pxPerInch / 72);
        context.stroke();
        context.restore();
      }
      continue;
    }
    if (command.type === "text") {
      const layout = canvasTextLayout(context, command.text, options, pxPerInch);
      const fontPx = layout.fontSize * pxPerInch / 72;
      const weight = options.bold ? 700 : 400;
      const family = options.fontFace || BODY_FONT;
      context.font = `${weight} ${fontPx}px "${family}", "Microsoft YaHei", sans-serif`;
      context.fillStyle = cssColor(options.color, cssColor(C.ink));
      context.textBaseline = "top";
      let startY = y;
      const textHeight = layout.lines.length * layout.lineHeight;
      if (options.valign === "mid") startY = y + Math.max(0, (height - textHeight) / 2);
      if (options.valign === "bottom") startY = y + Math.max(0, height - textHeight);
      layout.lines.forEach((line, index) => {
        const measured = context.measureText(line).width;
        let textX = x;
        if (options.align === "center") textX = x + (width - measured) / 2;
        if (options.align === "right") textX = x + width - measured;
        context.fillText(line, textX, startY + index * layout.lineHeight);
      });
    }
  }
}

async function dataUrlBytes(dataUrl) {
  const response = await fetch(dataUrl);
  return new Uint8Array(await response.arrayBuffer());
}

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function generatePdf({ draft, catalog, content, imageProvider, outputFile } = {}) {
  if (!globalThis.PDFLib?.PDFDocument) throw new Error("PDF 生成组件未加载，请刷新页面后重试");
  const model = buildDeckModel(draft, catalog, content);
  const provider = imageProvider || await createBrowserImageProvider();
  const assets = await prepareAssets(model, provider);
  const canvasDeck = new CanvasDeck();
  const slideCount = buildDeckSlides(canvasDeck, model, assets);
  const pdf = await globalThis.PDFLib.PDFDocument.create();
  const imageCache = new Map();
  for (const slide of canvasDeck.slides) {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    await renderCanvasSlide(slide, canvas, imageCache);
    const jpeg = await pdf.embedJpg(await dataUrlBytes(canvas.toDataURL("image/jpeg", 0.9)));
    const page = pdf.addPage([W * 72, H * 72]);
    page.drawImage(jpeg, { x: 0, y: 0, width: W * 72, height: H * 72 });
  }
  const filename = outputFile || `痴木堂-${safeName(draft.project.name)}-${String(draft.project.quoteDate || "").replace(/-/g, "")}-私定报价.pdf`;
  const bytes = await pdf.save({ useObjectStreams: true });
  downloadBlob(new Blob([bytes], { type: "application/pdf" }), filename);
  return { filename, slideCount, model };
}

export async function generatePptx({ draft, catalog, content, PptxCtor = globalThis.PptxGenJS, imageProvider, outputFile } = {}) {
  if (!PptxCtor) throw new Error("PPTX 生成组件未加载，请刷新页面后重试");
  const model = buildDeckModel(draft, catalog, content);
  const provider = imageProvider || await createBrowserImageProvider();
  const assets = await prepareAssets(model, provider);
  const pptx = createPpt(PptxCtor);
  const slideCount = buildDeckSlides(pptx, model, assets);

  const filename = outputFile || `痴木堂-${safeName(draft.project.name)}-${String(draft.project.quoteDate || "").replace(/-/g, "")}-私定报价.pptx`;
  await pptx.writeFile({ fileName: filename, compression: true });
  return { filename, slideCount, model };
}
