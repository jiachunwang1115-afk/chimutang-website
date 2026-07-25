const products = require("../data/products");
const content = require("../data/quote-content");
const { buildExportModel } = require("./export-model");
const { buildImagePdf } = require("./pdf-writer");

const WIDTH = 1280;
const HEIGHT = 720;
const C = {
  paper: "#f7f3ec",
  white: "#fffdf9",
  ink: "#2e251f",
  brown: "#5b3928",
  accent: "#9a6741",
  muted: "#75685e",
  line: "#d9d2cb",
  pale: "#eae2d8",
};

function setText(ctx, size, color = C.ink, align = "left", bold = false) {
  ctx.setFillStyle(color);
  ctx.setFontSize(size);
  ctx.setTextAlign(align);
  ctx.setTextBaseline("top");
  if ("font" in ctx) ctx.font = `${bold ? "600 " : ""}${size}px sans-serif`;
}

function textWidth(ctx, text, size) {
  const measured = typeof ctx.measureText === "function" ? ctx.measureText(text) : null;
  return measured?.width || String(text).length * size;
}

function wrapLines(ctx, text, maxWidth, size, maxLines = 20) {
  const paragraphs = String(text || "").split(/\n/);
  const lines = [];
  paragraphs.forEach((paragraph) => {
    let current = "";
    for (const character of paragraph || " ") {
      const next = current + character;
      if (current && textWidth(ctx, next, size) > maxWidth) {
        lines.push(current);
        current = character;
      } else {
        current = next;
      }
      if (lines.length >= maxLines) return;
    }
    if (lines.length < maxLines && current.trim()) lines.push(current);
  });
  return lines.slice(0, maxLines);
}

function drawTextBlock(ctx, text, x, y, maxWidth, options = {}) {
  const size = options.size || 28;
  const lineHeight = options.lineHeight || Math.round(size * 1.55);
  setText(ctx, size, options.color || C.ink, options.align || "left", options.bold);
  const lines = wrapLines(ctx, text, maxWidth, size, options.maxLines || 20);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight, maxWidth));
  return y + lines.length * lineHeight;
}

function drawRule(ctx, x, y, width, color = C.line) {
  ctx.setStrokeStyle(color);
  ctx.setLineWidth(1);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
}

function drawImage(ctx, path, x, y, width, height) {
  if (!path) {
    ctx.setFillStyle(C.pale);
    ctx.fillRect(x, y, width, height);
    setText(ctx, 18, C.accent, "center", true);
    ctx.fillText("WOOD ALL", x + width / 2, y + height / 2 - 10);
    return;
  }
  ctx.drawImage(path, x, y, width, height);
}

function drawHeader(ctx, section, title, pageNumber) {
  ctx.setFillStyle(C.paper);
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  setText(ctx, 16, C.accent, "left", true);
  ctx.fillText(`WOOD ALL  ·  ${section}`, 70, 35);
  setText(ctx, 16, C.muted, "right");
  ctx.fillText(String(pageNumber).padStart(2, "0"), 1210, 35);
  drawTextBlock(ctx, title, 70, 82, 1100, { size: 40, lineHeight: 48, bold: true, maxLines: 1 });
  drawRule(ctx, 70, 158, 1140);
}

function drawFooter(ctx, pageNumber) {
  drawRule(ctx, 70, 680, 1140);
  setText(ctx, 12, C.muted);
  ctx.fillText("痴木堂私定木作  ·  本文件仅供本项目沟通确认", 70, 691);
  setText(ctx, 12, C.muted, "right");
  ctx.fillText(String(pageNumber).padStart(2, "0"), 1210, 691);
}

function drawCover(ctx, model) {
  drawImage(ctx, "/assets/login-floor.jpg", 0, 0, WIDTH, HEIGHT);
  ctx.setGlobalAlpha(0.58);
  ctx.setFillStyle("#211814");
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.setGlobalAlpha(1);
  setText(ctx, 18, C.white, "left", true);
  ctx.fillText("WOOD ALL  ·  PRIVATE QUOTATION", 78, 60);
  drawTextBlock(ctx, model.draft.project.name, 78, 190, 650, { size: 58, lineHeight: 70, color: C.white, bold: true, maxLines: 2 });
  setText(ctx, 28, C.white);
  ctx.fillText("原木地板私定报价提案", 82, 335);
  drawRule(ctx, 82, 405, 460, "#b99b82");
  setText(ctx, 19, "#e8ddd2");
  ctx.fillText(model.draft.project.address || "项目所在地待确认", 82, 430);
  ctx.fillText(`报价日期  ${model.draft.project.quoteDate}`, 82, 470);
  ctx.setFillStyle(C.white);
  ctx.fillRect(1020, 50, 180, 130);
  drawImage(ctx, "/assets/logo.png", 1042, 66, 136, 96);
  setText(ctx, 17, C.white, "right");
  ctx.fillText("一份报价，也是一份关于空间、材料与交付的共同确认。", 1190, 642);
}

function drawProject(ctx, model, pageNumber) {
  drawHeader(ctx, "PROJECT", "从真实需求，建立选材判断", pageNumber);
  setText(ctx, 18, C.accent, "left", true);
  ctx.fillText("项目需求", 74, 190);
  drawTextBlock(ctx, model.draft.project.needs || "待结合空间尺度、采光条件、地暖环境与日常使用方式进一步确认。", 74, 230, 500, {
    size: 25, lineHeight: 40, maxLines: 5,
  });
  setText(ctx, 18, C.accent, "left", true);
  ctx.fillText("选材建议", 662, 190);
  drawTextBlock(ctx, model.draft.project.advice || "以实物样板为基准，在木种、结构、色泽与板型之间取得适合本项目的平衡。", 662, 230, 540, {
    size: 25, lineHeight: 40, maxLines: 5,
  });
  const stats = [
    ["空间配置", `${model.lines.length} 项`],
    ["净面积", `${model.totals.totalNetArea} m²`],
    ["计价面积", `${model.totals.totalBillableArea} m²`],
    ["有效期至", model.draft.project.validUntil],
  ];
  stats.forEach(([label, value], index) => {
    const x = 74 + index * 290;
    ctx.setFillStyle(C.white);
    ctx.setStrokeStyle(C.line);
    ctx.fillRect(x, 480, 258, 130);
    ctx.strokeRect(x, 480, 258, 130);
    setText(ctx, 15, C.muted);
    ctx.fillText(label, x + 18, 500);
    setText(ctx, 28, C.brown, "left", true);
    ctx.fillText(value, x + 18, 548);
  });
  drawFooter(ctx, pageNumber);
}

function drawBrand(ctx, model, pageNumber) {
  drawHeader(ctx, "BRAND", model.content.brand.headline.replace(/\n/g, " "), pageNumber);
  drawTextBlock(ctx, model.content.brand.summary, 74, 190, 510, { size: 24, lineHeight: 38, maxLines: 4 });
  drawImage(ctx, "/assets/login-floor.jpg", 74, 360, 540, 304);
  const proofs = model.content.brand.proofs || [];
  proofs.slice(0, 3).forEach((proof, index) => {
    const y = 198 + index * 138;
    setText(ctx, 15, C.accent);
    ctx.fillText(`0${index + 1}`, 670, y);
    setText(ctx, 27, C.ink, "left", true);
    ctx.fillText(proof.title, 742, y - 4);
    drawTextBlock(ctx, proof.text, 742, y + 42, 430, { size: 18, lineHeight: 28, color: C.muted, maxLines: 2 });
    if (index < 2) drawRule(ctx, 670, y + 112, 500);
  });
  drawFooter(ctx, pageNumber);
}

function drawSeries(ctx, series, pageNumber) {
  drawHeader(ctx, "SERIES", `${series.shortName}｜${series.tagline}`, pageNumber);
  drawImage(ctx, series.image, 74, 190, 540, 378);
  setText(ctx, 30, C.brown, "left", true);
  ctx.fillText(series.name, 665, 205);
  drawTextBlock(ctx, series.summary, 665, 270, 510, { size: 23, lineHeight: 36, maxLines: 4 });
  const features = series.features || [];
  features.slice(0, 3).forEach((feature, index) => {
    const y = 430 + index * 64;
    setText(ctx, 17, C.accent, "left", true);
    ctx.fillText(feature.title, 665, y);
    drawTextBlock(ctx, feature.text, 815, y, 360, { size: 17, lineHeight: 26, color: C.muted, maxLines: 2 });
  });
  drawFooter(ctx, pageNumber);
}

function drawProduct(ctx, product, pageNumber) {
  drawHeader(ctx, "PRODUCT", `${product.code}｜${product.wood || "天然木材"}`, pageNumber);
  drawImage(ctx, product.thumbUrl, 74, 190, 540, 378);
  setText(ctx, 17, C.accent, "left", true);
  ctx.fillText(product.seriesShort, 665, 198);
  setText(ctx, 40, C.brown, "left", true);
  ctx.fillText(product.code, 665, 240);
  setText(ctx, 21, C.muted);
  ctx.fillText(`${product.wood || "木种待确认"}  ·  ${product.board || product.structure || "板型待确认"}`, 665, 305);
  product.facts.slice(0, 8).forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 665 + column * 260;
    const y = 372 + row * 57;
    setText(ctx, 14, C.muted);
    ctx.fillText(label, x, y);
    setText(ctx, 17, C.ink, "left", true);
    ctx.fillText(String(value).slice(0, 16), x + 72, y - 2);
  });
  setText(ctx, 16, C.muted);
  ctx.fillText(`适用空间  ${product.rooms.join("、")}`, 74, 618);
  drawFooter(ctx, pageNumber);
}

function drawQuote(ctx, model, quotePage, pageNumber) {
  drawHeader(ctx, "QUOTATION", `产品与费用明细${quotePage.pageIndex ? "（续）" : ""}`, pageNumber);
  const columns = [
    ["空间", 115], ["产品型号", 175], ["计价面积", 120], ["损耗", 80],
    ["单价", 125], ["产品金额", 150], ["说明", 305],
  ];
  const x0 = 74;
  const y0 = 190;
  let x = x0;
  columns.forEach(([label, width]) => {
    ctx.setFillStyle(C.brown);
    ctx.fillRect(x, y0, width, 46);
    setText(ctx, 15, C.white, "center", true);
    ctx.fillText(label, x + width / 2, y0 + 13);
    x += width;
  });
  quotePage.rows.forEach((line, rowIndex) => {
    const y = y0 + 46 + rowIndex * 60;
    x = x0;
    const values = [
      line.room,
      `${line.product.code} ${line.product.wood || ""}`,
      `${line.billableArea} m²`,
      `${line.wasteRate}%`,
      line.unitPriceText,
      line.amountText,
      line.note || `${line.seriesShort} ${line.product.board || line.product.structure || ""}`,
    ];
    columns.forEach(([, width], columnIndex) => {
      ctx.setFillStyle(rowIndex % 2 ? "#fbf8f3" : C.white);
      ctx.setStrokeStyle(C.line);
      ctx.fillRect(x, y, width, 60);
      ctx.strokeRect(x, y, width, 60);
      setText(ctx, columnIndex === 6 ? 13 : 14, columnIndex === 5 ? C.brown : C.ink, columnIndex >= 2 && columnIndex <= 5 ? "right" : "left", columnIndex === 1 || columnIndex === 5);
      const tx = columnIndex >= 2 && columnIndex <= 5 ? x + width - 8 : x + 8;
      const value = String(values[columnIndex] || "");
      ctx.fillText(value.length > 24 ? `${value.slice(0, 23)}…` : value, tx, y + 20, width - 16);
      x += width;
    });
  });
  setText(ctx, 16, C.muted);
  ctx.fillText(`净面积 ${model.totals.totalNetArea} m²  ·  计价面积 ${model.totals.totalBillableArea} m²`, 74, 606);
  if (quotePage.isLast) {
    setText(ctx, 16, C.muted, "right");
    ctx.fillText("报价总额", 1015, 600);
    setText(ctx, 34, C.brown, "right", true);
    ctx.fillText(model.totalText, 1210, 590);
  }
  drawFooter(ctx, pageNumber);
}

function drawService(ctx, model, pageNumber) {
  drawHeader(ctx, "SERVICE", model.content.service.headline, pageNumber);
  drawTextBlock(ctx, model.content.service.summary, 74, 190, 1000, { size: 23, lineHeight: 34, color: C.muted, maxLines: 2 });
  (model.content.service.steps || []).slice(0, 4).forEach((step, index) => {
    const x = 74 + index * 290;
    ctx.setFillStyle(C.white);
    ctx.setStrokeStyle(C.line);
    ctx.fillRect(x, 300, 258, 240);
    ctx.strokeRect(x, 300, 258, 240);
    setText(ctx, 16, C.accent);
    ctx.fillText(`0${index + 1}`, x + 18, 324);
    setText(ctx, 27, C.ink, "left", true);
    ctx.fillText(step.title, x + 18, 385);
    drawTextBlock(ctx, step.text, x + 18, 447, 220, { size: 18, lineHeight: 30, color: C.muted, maxLines: 3 });
  });
  setText(ctx, 23, C.brown, "left", true);
  ctx.fillText("从第一次选择到最终完成面，每一步都回到同一份已确认的信息。", 74, 605);
  drawFooter(ctx, pageNumber);
}

function drawTerms(ctx, model, pageNumber) {
  drawHeader(ctx, "CONFIRMATION", "确认报价范围，进入下一步", pageNumber);
  drawTextBlock(ctx, model.content.quote.scopeNote, 74, 190, 680, { size: 22, lineHeight: 34, color: C.muted, maxLines: 2 });
  setText(ctx, 26, C.brown, "left", true);
  ctx.fillText("报价条款", 74, 285);
  drawTextBlock(ctx, model.draft.terms, 74, 335, 690, { size: 20, lineHeight: 33, maxLines: 5 });
  drawTextBlock(ctx, model.content.quote.naturalMaterialNote, 74, 535, 690, { size: 16, lineHeight: 26, color: C.muted, maxLines: 3 });
  ctx.setFillStyle(C.white);
  ctx.setStrokeStyle(C.line);
  ctx.fillRect(820, 205, 390, 385);
  ctx.strokeRect(820, 205, 390, 385);
  setText(ctx, 28, C.ink, "left", true);
  ctx.fillText("总部联系", 852, 242);
  setText(ctx, 15, C.muted);
  ctx.fillText("电话", 852, 330);
  setText(ctx, 28, C.brown);
  ctx.fillText(model.content.contact.phone, 852, 365);
  setText(ctx, 15, C.muted);
  ctx.fillText("微信", 852, 450);
  ctx.fillText("官网", 1030, 450);
  setText(ctx, 21, C.ink, "left", true);
  ctx.fillText(model.content.contact.wechat, 852, 485);
  ctx.fillText(model.content.contact.website, 1030, 485);
  drawImage(ctx, "/assets/logo.png", 1052, 505, 115, 82);
  drawFooter(ctx, pageNumber);
}

function drawPage(ctx, model, page, pageNumber) {
  if (page.kind === "cover") return drawCover(ctx, model);
  if (page.kind === "project") return drawProject(ctx, model, pageNumber);
  if (page.kind === "brand") return drawBrand(ctx, model, pageNumber);
  if (page.kind === "series") return drawSeries(ctx, page.series, pageNumber);
  if (page.kind === "product") return drawProduct(ctx, page.product, pageNumber);
  if (page.kind === "quote") return drawQuote(ctx, model, page.quotePage, pageNumber);
  if (page.kind === "service") return drawService(ctx, model, pageNumber);
  return drawTerms(ctx, model, pageNumber);
}

function drawCanvas(ctx) {
  return new Promise((resolve) => ctx.draw(false, () => setTimeout(resolve, 24)));
}

function canvasToJpeg(canvasId, scope) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvasId,
      x: 0,
      y: 0,
      width: WIDTH,
      height: HEIGHT,
      destWidth: WIDTH,
      destHeight: HEIGHT,
      fileType: "jpg",
      quality: 0.88,
      success: resolve,
      fail: (error) => reject(new Error(error.errMsg || "PDF 页面生成失败")),
    }, scope);
  });
}

function readFileBytes(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      success: (result) => resolve(new Uint8Array(result.data)),
      fail: (error) => reject(new Error(error.errMsg || "PDF 页面读取失败")),
    });
  });
}

async function generatePdf(draft, totals, scope, onProgress) {
  const model = buildExportModel(draft, totals, products, content);
  const images = [];
  for (let index = 0; index < model.pages.length; index += 1) {
    const ctx = wx.createCanvasContext("quoteExportCanvas", scope);
    drawPage(ctx, model, model.pages[index], index + 1);
    await drawCanvas(ctx);
    const temp = await canvasToJpeg("quoteExportCanvas", scope);
    const bytes = await readFileBytes(temp.tempFilePath);
    images.push({ bytes, width: WIDTH, height: HEIGHT });
    if (onProgress) onProgress(index + 1, model.pages.length);
  }
  return buildImagePdf(images);
}

module.exports = {
  generatePdf,
};
