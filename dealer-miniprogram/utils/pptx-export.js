const PptxGenJS = require("../vendor/pptxgenjs");
const products = require("../data/products");
const content = require("../data/quote-content");
const { buildExportModel } = require("./export-model");

const C = {
  paper: "F7F3EC",
  white: "FFFDF9",
  ink: "2E251F",
  brown: "5B3928",
  accent: "9A6741",
  muted: "75685E",
  line: "D9D2CB",
  pale: "EAE2D8",
};
const FONT = "Microsoft YaHei";
const SERIF = "SimSun";
const W = 13.333;
const H = 7.5;
const imageCache = new Map();

function addText(slide, text, options = {}) {
  slide.addText(String(text || ""), {
    fontFace: FONT,
    fontSize: 16,
    color: C.ink,
    margin: 0,
    breakLine: false,
    fit: "shrink",
    valign: "mid",
    ...options,
  });
}

function addRule(slide, x, y, w, color = C.line) {
  slide.addShape("line", { x, y, w, h: 0, line: { color, width: 0.7 } });
}

function readImageData(filePath) {
  if (!filePath) return "";
  if (imageCache.has(filePath)) return imageCache.get(filePath);
  const relative = String(filePath).replace(/^\/+/, "");
  const extension = relative.toLowerCase().endsWith(".png") ? "png" : "jpeg";
  const fs = wx.getFileSystemManager();
  let base64 = "";
  for (const candidate of [relative, `/${relative}`]) {
    try {
      base64 = fs.readFileSync(candidate, "base64");
      if (base64) break;
    } catch (error) {
      base64 = "";
    }
  }
  const data = base64 ? `data:image/${extension};base64,${base64}` : "";
  imageCache.set(filePath, data);
  return data;
}

function addImage(slide, filePath, x, y, w, h) {
  const data = readImageData(filePath);
  if (!data) {
    slide.addShape("rect", { x, y, w, h, line: { color: C.line }, fill: { color: C.pale } });
    addText(slide, "WOOD ALL", { x, y, w, h, align: "center", color: C.accent, fontSize: 11, bold: true });
    return;
  }
  slide.addImage({ data, x, y, w, h });
}

function setPaper(slide) {
  slide.background = { color: C.paper };
}

function addHeader(slide, section, title, pageNumber) {
  setPaper(slide);
  addText(slide, `WOOD ALL  ·  ${section}`, {
    x: 0.72, y: 0.35, w: 3.5, h: 0.24, fontSize: 9, bold: true, color: C.accent, charSpacing: 1.2,
  });
  addText(slide, String(pageNumber).padStart(2, "0"), {
    x: 11.86, y: 0.34, w: 0.72, h: 0.24, fontSize: 9, color: C.muted, align: "right",
  });
  addText(slide, title, {
    x: 0.72, y: 0.82, w: 11.85, h: 0.62, fontFace: SERIF, fontSize: 27, bold: true,
  });
  addRule(slide, 0.72, 1.62, 11.86);
}

function addFooter(slide, pageNumber) {
  addRule(slide, 0.72, 7.11, 11.86);
  addText(slide, "痴木堂私定木作  ·  本文件仅供本项目沟通确认", {
    x: 0.72, y: 7.18, w: 8.4, h: 0.16, fontSize: 7.5, color: C.muted,
  });
  addText(slide, String(pageNumber).padStart(2, "0"), {
    x: 11.8, y: 7.18, w: 0.78, h: 0.16, fontSize: 7.5, color: C.muted, align: "right",
  });
}

function coverSlide(pptx, model) {
  const slide = pptx.addSlide();
  slide.background = { color: C.brown };
  addImage(slide, "/assets/login-floor.jpg", 0, 0, W, H);
  slide.addShape("rect", { x: 0, y: 0, w: W, h: H, line: { transparency: 100 }, fill: { color: "1E1713", transparency: 34 } });
  slide.addShape("rect", { x: 0, y: 0, w: 7.35, h: H, line: { transparency: 100 }, fill: { color: "211814", transparency: 13 } });
  addText(slide, "WOOD ALL  ·  PRIVATE QUOTATION", {
    x: 0.82, y: 0.62, w: 4.8, h: 0.26, fontSize: 10, bold: true, color: C.white, charSpacing: 1.5,
  });
  addText(slide, model.draft.project.name, {
    x: 0.82, y: 2.04, w: 6.15, h: 1.2, fontFace: SERIF, fontSize: 37, bold: true, color: C.white,
  });
  addText(slide, "原木地板私定报价提案", {
    x: 0.84, y: 3.36, w: 4.8, h: 0.4, fontSize: 17, color: C.white,
  });
  addRule(slide, 0.84, 4.02, 4.86, "B99B82");
  addText(slide, model.draft.project.address || "项目所在地待确认", {
    x: 0.84, y: 4.22, w: 4.9, h: 0.32, fontSize: 11, color: "E8DDD2",
  });
  addText(slide, `报价日期  ${model.draft.project.quoteDate}`, {
    x: 0.84, y: 4.62, w: 4.9, h: 0.28, fontSize: 10, color: "E8DDD2",
  });
  slide.addShape("rect", { x: 10.64, y: 0.55, w: 1.85, h: 1.37, line: { transparency: 100 }, fill: { color: C.white, transparency: 5 } });
  addImage(slide, "/assets/logo.png", 10.86, 0.72, 1.42, 1.01);
  addText(slide, "一份报价，也是一份关于空间、材料与交付的共同确认。", {
    x: 7.78, y: 6.45, w: 4.7, h: 0.35, fontSize: 11, color: C.white, align: "right",
  });
}

function projectSlide(pptx, model, pageNumber) {
  const slide = pptx.addSlide();
  addHeader(slide, "PROJECT", "从真实需求，建立选材判断", pageNumber);
  addText(slide, "项目需求", { x: 0.76, y: 1.94, w: 2.2, h: 0.3, fontSize: 12, bold: true, color: C.accent });
  addText(slide, model.draft.project.needs || "待结合空间尺度、采光条件、地暖环境与日常使用方式进一步确认。", {
    x: 0.76, y: 2.36, w: 5.35, h: 1.62, fontSize: 16, breakLine: true, valign: "top", lineSpacingMultiple: 1.12,
  });
  addText(slide, "选材建议", { x: 6.74, y: 1.94, w: 2.2, h: 0.3, fontSize: 12, bold: true, color: C.accent });
  addText(slide, model.draft.project.advice || "以实物样板为基准，在木种、结构、色泽与板型之间取得适合本项目的平衡。", {
    x: 6.74, y: 2.36, w: 5.6, h: 1.62, fontSize: 16, breakLine: true, valign: "top", lineSpacingMultiple: 1.12,
  });
  const stats = [
    ["空间配置", `${model.lines.length} 项`],
    ["净面积", `${model.totals.totalNetArea} m²`],
    ["计价面积", `${model.totals.totalBillableArea} m²`],
    ["有效期至", model.draft.project.validUntil],
  ];
  stats.forEach(([label, value], index) => {
    const x = 0.76 + index * 2.96;
    slide.addShape("rect", { x, y: 4.7, w: 2.62, h: 1.35, line: { color: C.line, width: 0.6 }, fill: { color: C.white } });
    addText(slide, label, { x: x + 0.18, y: 4.92, w: 2.24, h: 0.22, fontSize: 9, color: C.muted });
    addText(slide, value, { x: x + 0.18, y: 5.3, w: 2.24, h: 0.38, fontSize: 18, bold: true, color: C.brown });
  });
  addFooter(slide, pageNumber);
}

function brandSlide(pptx, model, pageNumber) {
  const slide = pptx.addSlide();
  addHeader(slide, "BRAND", model.content.brand.headline.replace(/\n/g, " "), pageNumber);
  addText(slide, model.content.brand.summary, {
    x: 0.76, y: 1.93, w: 5.25, h: 1.3, fontSize: 15, breakLine: true, valign: "top", lineSpacingMultiple: 1.12,
  });
  addImage(slide, "/assets/login-floor.jpg", 0.76, 3.48, 5.58, 3.14);
  const proofs = model.content.brand.proofs.length ? model.content.brand.proofs : [
    { title: "真实可见", text: "每个型号对应实拍与产品参数" },
    { title: "选择有据", text: "从采光、尺度与使用方式判断" },
    { title: "交付有度", text: "面积、损耗与服务边界逐项确认" },
  ];
  proofs.forEach((proof, index) => {
    const y = 1.96 + index * 1.46;
    addText(slide, `0${index + 1}`, { x: 6.92, y, w: 0.5, h: 0.24, fontSize: 9, color: C.accent });
    addText(slide, proof.title, { x: 7.56, y: y - 0.05, w: 2.2, h: 0.35, fontSize: 17, bold: true });
    addText(slide, proof.text, { x: 7.56, y: y + 0.42, w: 4.62, h: 0.55, fontSize: 11.5, color: C.muted, valign: "top" });
    if (index < proofs.length - 1) addRule(slide, 6.92, y + 1.12, 5.28);
  });
  addFooter(slide, pageNumber);
}

function seriesSlide(pptx, model, series, pageNumber) {
  const slide = pptx.addSlide();
  addHeader(slide, "SERIES", `${series.shortName}｜${series.tagline}`, pageNumber);
  addImage(slide, series.image, 0.76, 1.94, 5.58, 3.91);
  addText(slide, series.name, { x: 6.86, y: 2.02, w: 5.2, h: 0.48, fontSize: 20, bold: true, color: C.brown });
  addText(slide, series.summary, {
    x: 6.86, y: 2.72, w: 5.2, h: 1.05, fontSize: 14, breakLine: true, valign: "top", lineSpacingMultiple: 1.1,
  });
  const features = series.features.length ? series.features : [
    { title: "材料判断", text: "围绕木种、结构与使用方式建立选择" },
    { title: "空间协调", text: "结合采光、尺度与家具材质确定深浅" },
    { title: "交付确认", text: "以实物样板与现场复尺作为最终依据" },
  ];
  features.slice(0, 3).forEach((feature, index) => {
    const y = 4.12 + index * 0.76;
    addText(slide, feature.title, { x: 6.86, y, w: 1.42, h: 0.28, fontSize: 10.5, bold: true, color: C.accent });
    addText(slide, feature.text, { x: 8.42, y, w: 3.74, h: 0.36, fontSize: 10.5, color: C.muted });
  });
  addFooter(slide, pageNumber);
}

function productSlide(pptx, model, product, pageNumber) {
  const slide = pptx.addSlide();
  addHeader(slide, "PRODUCT", `${product.code}｜${product.wood || "天然木材"}`, pageNumber);
  addImage(slide, product.thumbUrl, 0.76, 1.94, 5.58, 3.91);
  addText(slide, product.seriesShort, { x: 6.86, y: 1.96, w: 2.4, h: 0.28, fontSize: 10, bold: true, color: C.accent });
  addText(slide, product.code, { x: 6.86, y: 2.36, w: 3.7, h: 0.54, fontSize: 25, bold: true, color: C.brown });
  addText(slide, `${product.wood || "木种待确认"}  ·  ${product.board || product.structure || "板型待确认"}`, {
    x: 6.86, y: 3.02, w: 5.25, h: 0.34, fontSize: 13, color: C.muted,
  });
  const facts = product.facts.slice(0, 8);
  facts.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 6.86 + column * 2.72;
    const y = 3.72 + row * 0.63;
    addText(slide, label, { x, y, w: 0.74, h: 0.22, fontSize: 8.5, color: C.muted });
    addText(slide, value, { x: x + 0.78, y: y - 0.02, w: 1.82, h: 0.28, fontSize: 10.5, bold: true });
  });
  addText(slide, `适用空间  ${product.rooms.join("、")}`, {
    x: 0.76, y: 6.16, w: 5.58, h: 0.34, fontSize: 10.5, color: C.muted,
  });
  if (product.status) {
    addText(slide, product.status, {
      x: 10.72, y: 6.14, w: 1.42, h: 0.34, fontSize: 9, color: product.status === "已核验" ? C.accent : "9A352D", align: "right",
    });
  }
  addFooter(slide, pageNumber);
}

function quoteSlide(pptx, model, quotePage, pageNumber) {
  const slide = pptx.addSlide();
  const continuation = quotePage.pageIndex ? "（续）" : "";
  addHeader(slide, "QUOTATION", `产品与费用明细${continuation}`, pageNumber);
  const columns = [
    ["空间", 1.16], ["产品型号", 1.82], ["计价面积", 1.2], ["损耗", 0.82],
    ["单价", 1.25], ["产品金额", 1.55], ["说明", 3.04],
  ];
  const x0 = 0.76;
  const y0 = 1.94;
  let x = x0;
  columns.forEach(([label, width]) => {
    slide.addShape("rect", { x, y: y0, w: width, h: 0.48, line: { color: C.brown, width: 0.5 }, fill: { color: C.brown } });
    addText(slide, label, { x: x + 0.06, y: y0, w: width - 0.12, h: 0.48, fontSize: 9, bold: true, color: C.white, align: "center" });
    x += width;
  });
  quotePage.rows.forEach((line, rowIndex) => {
    const y = y0 + 0.48 + rowIndex * 0.62;
    x = x0;
    const values = [
      line.room,
      `${line.product.code}\n${line.product.wood || ""}`,
      `${line.billableArea} m²`,
      `${line.wasteRate}%`,
      line.unitPriceText,
      line.amountText,
      line.note || `${line.seriesShort} · ${line.product.board || line.product.structure || ""}`,
    ];
    columns.forEach(([, width], columnIndex) => {
      slide.addShape("rect", { x, y, w: width, h: 0.62, line: { color: C.line, width: 0.45 }, fill: { color: rowIndex % 2 ? "FBF8F3" : C.white } });
      addText(slide, values[columnIndex], {
        x: x + 0.07, y: y + 0.04, w: width - 0.14, h: 0.54,
        fontSize: columnIndex === 6 ? 8.2 : 8.7,
        bold: columnIndex === 1 || columnIndex === 5,
        color: columnIndex === 5 ? C.brown : C.ink,
        align: [2, 3, 4, 5].includes(columnIndex) ? "right" : "left",
      });
      x += width;
    });
  });
  const noteY = 5.95;
  addText(slide, `净面积 ${model.totals.totalNetArea} m²  ·  计价面积 ${model.totals.totalBillableArea} m²`, {
    x: 0.78, y: noteY, w: 5.3, h: 0.28, fontSize: 10, color: C.muted,
  });
  if (quotePage.isLast) {
    const summary = model.summaryItems.map((item) => `${item.label} ${item.value}`).join("  ·  ");
    addText(slide, summary, { x: 0.78, y: 6.32, w: 7.5, h: 0.28, fontSize: 8.5, color: C.muted });
    addText(slide, "报价总额", { x: 9.26, y: 5.84, w: 1.12, h: 0.25, fontSize: 9.5, color: C.muted, align: "right" });
    addText(slide, model.totalText, { x: 10.52, y: 5.75, w: 2.02, h: 0.5, fontSize: 23, bold: true, color: C.brown, align: "right" });
  } else {
    addText(slide, "明细将在下一页继续", { x: 9.2, y: 6.05, w: 3.3, h: 0.28, fontSize: 10, color: C.accent, align: "right" });
  }
  addFooter(slide, pageNumber);
}

function serviceSlide(pptx, model, pageNumber) {
  const slide = pptx.addSlide();
  addHeader(slide, "SERVICE", model.content.service.headline, pageNumber);
  addText(slide, model.content.service.summary, {
    x: 0.76, y: 1.94, w: 7.3, h: 0.52, fontSize: 14, color: C.muted,
  });
  const steps = model.content.service.steps.length ? model.content.service.steps : [
    { title: "现场复尺", text: "核对面积、基层与收口条件" },
    { title: "实物选样", text: "确认木色、纹理与允许差异" },
    { title: "施工交底", text: "锁定铺装方向、损耗与施工边界" },
    { title: "铺装交付", text: "按确认方案完成并说明维护" },
  ];
  steps.slice(0, 4).forEach((step, index) => {
    const x = 0.76 + index * 2.97;
    slide.addShape("rect", { x, y: 3.0, w: 2.62, h: 2.48, line: { color: C.line, width: 0.6 }, fill: { color: C.white } });
    addText(slide, `0${index + 1}`, { x: x + 0.2, y: 3.24, w: 0.7, h: 0.26, fontSize: 10, color: C.accent });
    addText(slide, step.title, { x: x + 0.2, y: 3.78, w: 2.18, h: 0.4, fontSize: 17, bold: true });
    addText(slide, step.text, { x: x + 0.2, y: 4.48, w: 2.18, h: 0.58, fontSize: 11, color: C.muted, valign: "top" });
  });
  addText(slide, "从第一次选择到最终完成面，每一步都回到同一份已确认的信息。", {
    x: 0.76, y: 6.14, w: 8.2, h: 0.35, fontFace: SERIF, fontSize: 16, color: C.brown,
  });
  addFooter(slide, pageNumber);
}

function termsSlide(pptx, model, pageNumber) {
  const slide = pptx.addSlide();
  addHeader(slide, "CONFIRMATION", "确认报价范围，进入下一步", pageNumber);
  addText(slide, model.content.quote.scopeNote, {
    x: 0.76, y: 1.94, w: 7.1, h: 0.56, fontSize: 14, color: C.muted,
  });
  addText(slide, "报价条款", { x: 0.76, y: 2.82, w: 2.1, h: 0.35, fontSize: 17, bold: true, color: C.brown });
  addText(slide, model.draft.terms, {
    x: 0.76, y: 3.32, w: 7.0, h: 1.3, fontSize: 13, breakLine: true, valign: "top", lineSpacingMultiple: 1.1,
  });
  addText(slide, model.content.quote.naturalMaterialNote, {
    x: 0.76, y: 5.1, w: 7.0, h: 0.72, fontSize: 10.5, color: C.muted, valign: "top",
  });
  slide.addShape("rect", { x: 8.46, y: 2.04, w: 4.1, h: 3.86, line: { color: C.line, width: 0.6 }, fill: { color: C.white } });
  addText(slide, "总部联系", { x: 8.8, y: 2.42, w: 2.2, h: 0.4, fontSize: 18, bold: true });
  addText(slide, "电话", { x: 8.8, y: 3.25, w: 0.8, h: 0.23, fontSize: 9, color: C.muted });
  addText(slide, model.content.contact.phone, { x: 8.8, y: 3.57, w: 2.8, h: 0.38, fontSize: 17, color: C.brown });
  addText(slide, "微信", { x: 8.8, y: 4.35, w: 0.8, h: 0.23, fontSize: 9, color: C.muted });
  addText(slide, model.content.contact.wechat, { x: 8.8, y: 4.67, w: 1.25, h: 0.32, fontSize: 13, bold: true });
  addText(slide, "官网", { x: 10.44, y: 4.35, w: 0.8, h: 0.23, fontSize: 9, color: C.muted });
  addText(slide, model.content.contact.website, { x: 10.44, y: 4.67, w: 1.72, h: 0.32, fontSize: 11, bold: true });
  addImage(slide, "/assets/logo.png", 10.86, 5.04, 1.15, 0.82);
  addFooter(slide, pageNumber);
}

function buildPptx(model) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "痴木堂 WOOD ALL";
  pptx.company = "痴木堂";
  pptx.subject = `${model.draft.project.name} 私定报价`;
  pptx.title = `${model.draft.project.name}｜痴木堂私定报价`;
  pptx.lang = "zh-CN";
  pptx.theme = {
    headFontFace: FONT,
    bodyFontFace: FONT,
    lang: "zh-CN",
  };

  coverSlide(pptx, model);
  let pageNumber = 2;
  projectSlide(pptx, model, pageNumber++);
  brandSlide(pptx, model, pageNumber++);
  model.series.forEach((series) => seriesSlide(pptx, model, series, pageNumber++));
  model.products.forEach((product) => productSlide(pptx, model, product, pageNumber++));
  model.quotePages.forEach((quotePage) => quoteSlide(pptx, model, quotePage, pageNumber++));
  serviceSlide(pptx, model, pageNumber++);
  termsSlide(pptx, model, pageNumber);
  return pptx;
}

async function generatePptx(draft, totals) {
  const model = buildExportModel(draft, totals, products, content);
  const pptx = buildPptx(model);
  return pptx.write({ outputType: "uint8array", compression: true });
}

module.exports = {
  buildPptx,
  generatePptx,
};
