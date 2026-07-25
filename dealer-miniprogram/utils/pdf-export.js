const products = require("../data/products");
const content = require("../data/quote-content");
const { buildExportModel } = require("./export-model");
const { buildImagePdf } = require("./pdf-writer");

const FORMATS = {
  desktop: {
    width: 1280,
    height: 720,
    canvasId: "quoteExportCanvasDesktop",
    label: "电脑阅览版",
  },
  mobile: {
    width: 900,
    height: 1600,
    canvasId: "quoteExportCanvasMobile",
    label: "手机阅览版",
  },
};

const C = {
  paper: "#f3efe8",
  paperLight: "#faf8f4",
  white: "#fffdf9",
  ink: "#241f1b",
  brown: "#5a3827",
  accent: "#9a6741",
  clay: "#b98a62",
  muted: "#746b63",
  line: "#d8cfc5",
  pale: "#e9e2d9",
  darkMuted: "#cdbcb0",
};

const IMAGE_SIZES = {
  "/assets/login-floor.jpg": [960, 540],
  "/assets/logo.png": [220, 156],
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

function drawRule(ctx, x, y, width, color = C.line, lineWidth = 1) {
  ctx.setStrokeStyle(color);
  ctx.setLineWidth(lineWidth);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
}

function imageSize(path) {
  if (IMAGE_SIZES[path]) return IMAGE_SIZES[path];
  if (/\/assets\/products\//.test(String(path))) return [320, 224];
  return [320, 224];
}

function drawImageCover(ctx, path, x, y, width, height) {
  if (!path) {
    ctx.setFillStyle(C.pale);
    ctx.fillRect(x, y, width, height);
    setText(ctx, Math.max(16, Math.round(width / 28)), C.accent, "center", true);
    ctx.fillText("WOOD ALL", x + width / 2, y + height / 2 - 10);
    return;
  }
  const [sourceWidth, sourceHeight] = imageSize(path);
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;
  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }
  ctx.drawImage(path, sx, sy, sw, sh, x, y, width, height);
}

function drawImageContain(ctx, path, x, y, width, height) {
  if (!path) return;
  const [sourceWidth, sourceHeight] = imageSize(path);
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  ctx.drawImage(path, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawBox(ctx, x, y, width, height, fill = C.white, stroke = C.line) {
  ctx.setFillStyle(fill);
  ctx.fillRect(x, y, width, height);
  if (stroke) {
    ctx.setStrokeStyle(stroke);
    ctx.setLineWidth(1);
    ctx.strokeRect(x, y, width, height);
  }
}

function projectLocation(model) {
  const address = String(model.draft.project.address || "").trim();
  const city = String(model.draft.project.city || "").trim();
  if (!city || address.includes(city)) return address || city || "项目所在地待确认";
  return `${city} · ${address}`;
}

function buildPages(model, variant) {
  const quoteSize = variant === "mobile" ? 3 : 6;
  const quotePages = [];
  for (let index = 0; index < model.lines.length; index += quoteSize) {
    quotePages.push({
      rows: model.lines.slice(index, index + quoteSize),
      pageIndex: quotePages.length,
      isLast: index + quoteSize >= model.lines.length,
    });
  }
  return [
    { kind: "cover" },
    { kind: "project" },
    { kind: "brand" },
    ...model.series.map((series) => ({ kind: "series", series })),
    ...model.products.map((product) => ({ kind: "product", product })),
    ...quotePages.map((quotePage) => ({ kind: "quote", quotePage })),
    { kind: "service" },
    { kind: "terms" },
    { kind: "backCover" },
  ];
}

function drawDesktopHeader(ctx, section, title, pageNumber) {
  ctx.setFillStyle(C.paperLight);
  ctx.fillRect(0, 0, FORMATS.desktop.width, FORMATS.desktop.height);
  setText(ctx, 16, C.accent, "left", true);
  ctx.fillText(`WOOD ALL  ·  ${section}`, 70, 35);
  setText(ctx, 16, C.muted, "right");
  ctx.fillText(String(pageNumber).padStart(2, "0"), 1210, 35);
  drawTextBlock(ctx, title, 70, 82, 1100, { size: 40, lineHeight: 48, bold: true, maxLines: 1 });
  drawRule(ctx, 70, 158, 1140);
}

function drawDesktopFooter(ctx, pageNumber) {
  drawRule(ctx, 70, 680, 1140);
  setText(ctx, 12, C.muted);
  ctx.fillText("痴木堂私定木作  ·  本文件仅供本项目沟通确认", 70, 691);
  setText(ctx, 12, C.muted, "right");
  ctx.fillText(String(pageNumber).padStart(2, "0"), 1210, 691);
}

function drawDesktopCover(ctx, model) {
  ctx.setFillStyle(C.ink);
  ctx.fillRect(0, 0, 1280, 720);
  drawImageCover(ctx, "/assets/login-floor.jpg", 478, 0, 802, 720);
  ctx.setFillStyle(C.ink);
  ctx.fillRect(0, 0, 486, 720);
  ctx.setFillStyle(C.clay);
  ctx.fillRect(478, 0, 8, 720);
  setText(ctx, 16, "#d7b89e", "left", true);
  ctx.fillText("WOOD ALL", 70, 52);
  drawTextBlock(ctx, "私定报价", 66, 264, 345, { size: 58, lineHeight: 70, color: C.white, bold: true, maxLines: 1 });
  drawTextBlock(ctx, model.draft.project.name || "客户项目", 70, 438, 330, {
    size: 28,
    lineHeight: 38,
    color: "#e8ddd4",
    maxLines: 2,
  });
  setText(ctx, 15, "#b9a79b");
  ctx.fillText(model.draft.project.quoteDate || "", 70, 644);
}

function drawDesktopProject(ctx, model, pageNumber) {
  drawDesktopHeader(ctx, "PROJECT", "先读懂空间，再选择木材", pageNumber);
  setText(ctx, 18, C.accent, "left", true);
  ctx.fillText("01  本案所求", 74, 190);
  drawTextBlock(ctx, model.draft.project.needs || "待结合空间尺度、采光条件、地暖环境与日常使用方式进一步确认。", 74, 232, 500, {
    size: 24,
    lineHeight: 38,
    maxLines: 5,
  });
  setText(ctx, 18, C.accent, "left", true);
  ctx.fillText("02  我们的判断", 662, 190);
  drawTextBlock(ctx, model.draft.project.advice || "以实物样板为基准，在木种、结构、色泽与板型之间取得适合本项目的平衡。", 662, 232, 540, {
    size: 24,
    lineHeight: 38,
    maxLines: 5,
  });
  const stats = [
    ["项目", model.draft.project.name],
    ["项目地址", projectLocation(model)],
    ["计价面积", `${model.totals.totalBillableArea} m²`],
    ["有效期至", model.draft.project.validUntil],
  ];
  stats.forEach(([label, value], index) => {
    const x = 74 + index * 290;
    drawBox(ctx, x, 480, 258, 130);
    setText(ctx, 15, C.muted);
    ctx.fillText(label, x + 18, 500);
    drawTextBlock(ctx, value, x + 18, 548, 220, {
      size: index === 1 ? 18 : 25,
      lineHeight: 28,
      color: C.brown,
      bold: true,
      maxLines: 2,
    });
  });
  drawDesktopFooter(ctx, pageNumber);
}

function drawDesktopBrand(ctx, model, pageNumber) {
  drawDesktopHeader(ctx, "BRAND", model.content.brand.headline.replace(/\n/g, " "), pageNumber);
  drawTextBlock(ctx, model.content.brand.summary, 74, 190, 510, { size: 24, lineHeight: 38, maxLines: 4 });
  drawImageCover(ctx, "/assets/login-floor.jpg", 74, 360, 540, 304);
  (model.content.brand.proofs || []).slice(0, 3).forEach((proof, index) => {
    const y = 198 + index * 138;
    setText(ctx, 15, C.accent);
    ctx.fillText(`0${index + 1}`, 670, y);
    setText(ctx, 27, C.ink, "left", true);
    ctx.fillText(proof.title, 742, y - 4);
    drawTextBlock(ctx, proof.text, 742, y + 42, 430, { size: 18, lineHeight: 28, color: C.muted, maxLines: 2 });
    if (index < 2) drawRule(ctx, 670, y + 112, 500);
  });
  drawDesktopFooter(ctx, pageNumber);
}

function drawDesktopSeries(ctx, series, pageNumber) {
  drawDesktopHeader(ctx, "SERIES", `${series.shortName}｜${series.tagline}`, pageNumber);
  drawImageCover(ctx, series.image, 74, 190, 540, 378);
  setText(ctx, 30, C.brown, "left", true);
  ctx.fillText(series.name, 665, 205);
  drawTextBlock(ctx, series.summary, 665, 270, 510, { size: 23, lineHeight: 36, maxLines: 4 });
  (series.features || []).slice(0, 3).forEach((feature, index) => {
    const y = 430 + index * 64;
    setText(ctx, 17, C.accent, "left", true);
    ctx.fillText(feature.title, 665, y);
    drawTextBlock(ctx, feature.text, 815, y, 360, { size: 17, lineHeight: 26, color: C.muted, maxLines: 2 });
  });
  drawDesktopFooter(ctx, pageNumber);
}

function drawDesktopProduct(ctx, product, pageNumber) {
  drawDesktopHeader(ctx, "PRODUCT", `${product.code}｜${product.wood || "天然木材"}`, pageNumber);
  drawImageCover(ctx, product.thumbUrl, 74, 190, 540, 378);
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
  drawDesktopFooter(ctx, pageNumber);
}

function drawDesktopQuote(ctx, model, quotePage, pageNumber) {
  drawDesktopHeader(ctx, "QUOTATION", `产品与费用明细${quotePage.pageIndex ? "（续）" : ""}`, pageNumber);
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
      drawBox(ctx, x, y, width, 60, rowIndex % 2 ? "#fbf8f3" : C.white);
      const align = columnIndex >= 2 && columnIndex <= 5 ? "right" : "left";
      setText(ctx, columnIndex === 6 ? 13 : 14, columnIndex === 5 ? C.brown : C.ink, align, columnIndex === 1 || columnIndex === 5);
      const tx = align === "right" ? x + width - 8 : x + 8;
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
  drawDesktopFooter(ctx, pageNumber);
}

function drawDesktopService(ctx, model, pageNumber) {
  drawDesktopHeader(ctx, "SERVICE", model.content.service.headline, pageNumber);
  drawTextBlock(ctx, model.content.service.summary, 74, 190, 1000, { size: 23, lineHeight: 34, color: C.muted, maxLines: 2 });
  (model.content.service.steps || []).slice(0, 4).forEach((step, index) => {
    const x = 74 + index * 290;
    drawBox(ctx, x, 300, 258, 240);
    setText(ctx, 16, C.accent);
    ctx.fillText(`0${index + 1}`, x + 18, 324);
    setText(ctx, 27, C.ink, "left", true);
    ctx.fillText(step.title, x + 18, 385);
    drawTextBlock(ctx, step.text, x + 18, 447, 220, { size: 18, lineHeight: 30, color: C.muted, maxLines: 3 });
  });
  setText(ctx, 23, C.brown, "left", true);
  ctx.fillText("从第一次选择到最终完成面，每一步都回到同一份已确认的信息。", 74, 605);
  drawDesktopFooter(ctx, pageNumber);
}

function drawDesktopTerms(ctx, model, pageNumber) {
  drawDesktopHeader(ctx, "CONFIRMATION", "确认方案，进入复尺与选样", pageNumber);
  drawTextBlock(ctx, model.content.quote.scopeNote, 74, 190, 680, { size: 22, lineHeight: 34, color: C.muted, maxLines: 2 });
  setText(ctx, 26, C.brown, "left", true);
  ctx.fillText("报价条款", 74, 285);
  drawTextBlock(ctx, model.draft.terms, 74, 335, 690, { size: 20, lineHeight: 33, maxLines: 5 });
  drawTextBlock(ctx, model.content.quote.naturalMaterialNote, 74, 535, 690, { size: 16, lineHeight: 26, color: C.muted, maxLines: 3 });
  drawBox(ctx, 820, 205, 390, 385);
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
  setText(ctx, 17, C.ink, "left", true);
  ctx.fillText(model.content.contact.website, 1030, 488);
  setText(ctx, 15, C.muted);
  ctx.fillText("痴木堂  WOOD ALL", 852, 548);
  drawDesktopFooter(ctx, pageNumber);
}

function drawDesktopBackCover(ctx, model) {
  ctx.setFillStyle(C.ink);
  ctx.fillRect(0, 0, 1280, 720);
  drawImageCover(ctx, "/assets/login-floor.jpg", 0, 0, 1280, 520);
  ctx.setFillStyle(C.ink);
  ctx.fillRect(0, 518, 1280, 202);
  drawBox(ctx, 1060, 34, 160, 112, C.paperLight, null);
  drawImageContain(ctx, "/assets/logo.png", 1076, 44, 128, 92);
  setText(ctx, 18, C.white, "left", true);
  ctx.fillText("痴木堂  WOOD ALL", 70, 580);
  setText(ctx, 14, C.darkMuted, "right");
  ctx.fillText(model.content.contact.website.replace(/^www\./, ""), 1210, 578);
  ctx.fillText(model.content.contact.phone, 1210, 616);
}

function drawDesktopPage(ctx, model, page, pageNumber) {
  if (page.kind === "cover") return drawDesktopCover(ctx, model);
  if (page.kind === "project") return drawDesktopProject(ctx, model, pageNumber);
  if (page.kind === "brand") return drawDesktopBrand(ctx, model, pageNumber);
  if (page.kind === "series") return drawDesktopSeries(ctx, page.series, pageNumber);
  if (page.kind === "product") return drawDesktopProduct(ctx, page.product, pageNumber);
  if (page.kind === "quote") return drawDesktopQuote(ctx, model, page.quotePage, pageNumber);
  if (page.kind === "service") return drawDesktopService(ctx, model, pageNumber);
  if (page.kind === "terms") return drawDesktopTerms(ctx, model, pageNumber);
  return drawDesktopBackCover(ctx, model);
}

function drawMobileHeader(ctx, section, title, pageNumber) {
  ctx.setFillStyle(C.paperLight);
  ctx.fillRect(0, 0, 900, 1600);
  setText(ctx, 22, C.accent, "left", true);
  ctx.fillText(`WOOD ALL  ·  ${section}`, 60, 50);
  setText(ctx, 22, C.muted, "right");
  ctx.fillText(String(pageNumber).padStart(2, "0"), 840, 50);
  drawTextBlock(ctx, title, 60, 112, 780, { size: 46, lineHeight: 58, bold: true, maxLines: 2 });
  drawRule(ctx, 60, 224, 780);
}

function drawMobileFooter(ctx, pageNumber) {
  drawRule(ctx, 60, 1530, 780);
  setText(ctx, 17, C.muted);
  ctx.fillText("痴木堂私定木作  ·  项目沟通文件", 60, 1550);
  setText(ctx, 17, C.muted, "right");
  ctx.fillText(String(pageNumber).padStart(2, "0"), 840, 1550);
}

function drawMobileCover(ctx, model) {
  ctx.setFillStyle(C.ink);
  ctx.fillRect(0, 0, 900, 1600);
  drawImageCover(ctx, "/assets/login-floor.jpg", 0, 0, 900, 610);
  ctx.setFillStyle(C.clay);
  ctx.fillRect(0, 606, 900, 8);
  setText(ctx, 20, "#d7b89e", "left", true);
  ctx.fillText("WOOD ALL  ·  PRIVATE QUOTATION", 60, 690);
  drawTextBlock(ctx, "私定报价", 56, 810, 720, { size: 76, lineHeight: 90, color: C.white, bold: true, maxLines: 1 });
  drawTextBlock(ctx, model.draft.project.name || "客户项目", 60, 1010, 720, {
    size: 40,
    lineHeight: 54,
    color: "#e8ddd4",
    maxLines: 2,
  });
  drawRule(ctx, 60, 1190, 180, "#8a6954", 2);
  drawTextBlock(ctx, projectLocation(model), 60, 1240, 700, {
    size: 25,
    lineHeight: 38,
    color: C.darkMuted,
    maxLines: 2,
  });
  setText(ctx, 21, "#b9a79b");
  ctx.fillText(`报价日期  ${model.draft.project.quoteDate || ""}`, 60, 1395);
  setText(ctx, 18, "#9f8d81", "right");
  ctx.fillText("一份关于空间、材料与交付的共同确认", 840, 1510);
}

function drawMobileProject(ctx, model, pageNumber) {
  drawMobileHeader(ctx, "PROJECT", "先读懂空间，再选择木材", pageNumber);
  setText(ctx, 22, C.accent, "left", true);
  ctx.fillText("01  本案所求", 60, 280);
  drawTextBlock(ctx, model.draft.project.needs || "待结合空间尺度、采光条件、地暖环境与日常使用方式进一步确认。", 60, 332, 780, {
    size: 31,
    lineHeight: 50,
    maxLines: 5,
  });
  drawRule(ctx, 60, 620, 780);
  setText(ctx, 22, C.accent, "left", true);
  ctx.fillText("02  我们的判断", 60, 672);
  drawTextBlock(ctx, model.draft.project.advice || "以实物样板为基准，在木种、结构、色泽与板型之间取得适合本项目的平衡。", 60, 724, 780, {
    size: 31,
    lineHeight: 50,
    maxLines: 5,
  });
  const stats = [
    ["项目", model.draft.project.name],
    ["项目地址", projectLocation(model)],
    ["计价面积", `${model.totals.totalBillableArea} m²`],
    ["有效期至", model.draft.project.validUntil],
  ];
  stats.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 60 + column * 400;
    const y = 1040 + row * 190;
    drawBox(ctx, x, y, 380, 164);
    setText(ctx, 19, C.muted);
    ctx.fillText(label, x + 22, y + 22);
    drawTextBlock(ctx, value, x + 22, y + 67, 336, {
      size: index === 1 ? 24 : 29,
      lineHeight: 38,
      color: C.brown,
      bold: true,
      maxLines: 2,
    });
  });
  drawMobileFooter(ctx, pageNumber);
}

function drawMobileBrand(ctx, model, pageNumber) {
  drawMobileHeader(ctx, "BRAND", model.content.brand.headline.replace(/\n/g, " "), pageNumber);
  drawTextBlock(ctx, model.content.brand.summary, 60, 280, 780, { size: 29, lineHeight: 46, maxLines: 4 });
  drawImageCover(ctx, "/assets/login-floor.jpg", 60, 500, 780, 438);
  (model.content.brand.proofs || []).slice(0, 3).forEach((proof, index) => {
    const y = 1000 + index * 145;
    setText(ctx, 20, C.accent);
    ctx.fillText(`0${index + 1}`, 60, y);
    setText(ctx, 30, C.ink, "left", true);
    ctx.fillText(proof.title, 135, y - 4);
    drawTextBlock(ctx, proof.text, 135, y + 48, 680, { size: 23, lineHeight: 34, color: C.muted, maxLines: 2 });
    if (index < 2) drawRule(ctx, 135, y + 116, 680);
  });
  drawMobileFooter(ctx, pageNumber);
}

function drawMobileSeries(ctx, series, pageNumber) {
  drawMobileHeader(ctx, "SERIES", `${series.shortName}｜${series.tagline}`, pageNumber);
  drawImageCover(ctx, series.image, 60, 280, 780, 546);
  setText(ctx, 23, C.accent, "left", true);
  ctx.fillText(series.shortName, 60, 880);
  setText(ctx, 42, C.brown, "left", true);
  ctx.fillText(series.name, 60, 925);
  drawTextBlock(ctx, series.summary, 60, 1005, 780, { size: 29, lineHeight: 45, maxLines: 4 });
  (series.features || []).slice(0, 3).forEach((feature, index) => {
    const y = 1230 + index * 82;
    setText(ctx, 23, C.accent, "left", true);
    ctx.fillText(feature.title, 60, y);
    drawTextBlock(ctx, feature.text, 250, y, 580, { size: 23, lineHeight: 34, color: C.muted, maxLines: 2 });
  });
  drawMobileFooter(ctx, pageNumber);
}

function drawMobileProduct(ctx, product, pageNumber) {
  drawMobileHeader(ctx, "PRODUCT", `${product.code}｜${product.wood || "天然木材"}`, pageNumber);
  drawImageCover(ctx, product.thumbUrl, 60, 280, 780, 546);
  setText(ctx, 22, C.accent, "left", true);
  ctx.fillText(product.seriesShort, 60, 880);
  setText(ctx, 54, C.brown, "left", true);
  ctx.fillText(product.code, 60, 925);
  setText(ctx, 27, C.muted);
  ctx.fillText(`${product.wood || "木种待确认"}  ·  ${product.board || product.structure || "板型待确认"}`, 60, 1010);
  product.facts.slice(0, 8).forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 60 + column * 400;
    const y = 1100 + row * 78;
    setText(ctx, 19, C.muted);
    ctx.fillText(label, x, y);
    setText(ctx, 24, C.ink, "left", true);
    ctx.fillText(String(value).slice(0, 16), x + 105, y - 3);
  });
  drawTextBlock(ctx, `适用空间  ${product.rooms.join("、")}`, 60, 1430, 780, {
    size: 21,
    lineHeight: 32,
    color: C.muted,
    maxLines: 2,
  });
  drawMobileFooter(ctx, pageNumber);
}

function drawMobileQuote(ctx, model, quotePage, pageNumber) {
  drawMobileHeader(ctx, "QUOTATION", `产品与费用明细${quotePage.pageIndex ? "（续）" : ""}`, pageNumber);
  quotePage.rows.forEach((line, index) => {
    const y = 280 + index * 330;
    drawBox(ctx, 60, y, 780, 290, index % 2 ? "#f8f4ee" : C.white);
    setText(ctx, 21, C.accent, "left", true);
    ctx.fillText(line.room || `空间 ${index + 1}`, 86, y + 28);
    setText(ctx, 38, C.brown, "left", true);
    ctx.fillText(line.product.code, 86, y + 70);
    setText(ctx, 22, C.muted);
    ctx.fillText(`${line.seriesShort} · ${line.product.wood || "天然木材"}`, 86, y + 126);
    setText(ctx, 19, C.muted);
    ctx.fillText(`计价面积  ${line.billableArea} m²  ·  损耗 ${line.wasteRate}%`, 86, y + 174);
    ctx.fillText(`产品单价  ${line.unitPriceText}`, 86, y + 211);
    setText(ctx, 19, C.muted, "right");
    ctx.fillText("产品金额", 812, y + 30);
    setText(ctx, 34, C.brown, "right", true);
    ctx.fillText(line.amountText, 812, y + 68);
    drawRule(ctx, 86, y + 245, 726);
    drawTextBlock(ctx, `选材说明  ${line.note || line.product.board || line.product.structure || "以实物样板为准"}`, 86, y + 255, 726, {
      size: 18,
      lineHeight: 26,
      color: C.muted,
      maxLines: 1,
    });
  });
  const summaryY = 280 + quotePage.rows.length * 330 + 12;
  setText(ctx, 21, C.muted);
  ctx.fillText(`净面积 ${model.totals.totalNetArea} m²`, 60, summaryY);
  ctx.fillText(`计价面积 ${model.totals.totalBillableArea} m²`, 60, summaryY + 42);
  if (quotePage.isLast) {
    setText(ctx, 20, C.muted, "right");
    ctx.fillText("报价总额", 840, summaryY);
    setText(ctx, 46, C.brown, "right", true);
    ctx.fillText(model.totalText, 840, summaryY + 38);
  }
  drawMobileFooter(ctx, pageNumber);
}

function drawMobileService(ctx, model, pageNumber) {
  drawMobileHeader(ctx, "SERVICE", model.content.service.headline, pageNumber);
  drawTextBlock(ctx, model.content.service.summary, 60, 280, 780, { size: 29, lineHeight: 45, color: C.muted, maxLines: 3 });
  (model.content.service.steps || []).slice(0, 4).forEach((step, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 60 + column * 400;
    const y = 520 + row * 380;
    drawBox(ctx, x, y, 380, 330);
    setText(ctx, 21, C.accent);
    ctx.fillText(`0${index + 1}`, x + 24, y + 28);
    setText(ctx, 36, C.ink, "left", true);
    ctx.fillText(step.title, x + 24, y + 105);
    drawTextBlock(ctx, step.text, x + 24, y + 175, 330, { size: 26, lineHeight: 42, color: C.muted, maxLines: 3 });
  });
  drawTextBlock(ctx, "从第一次选择到最终完成面，每一步都回到同一份已确认的信息。", 60, 1340, 780, {
    size: 29,
    lineHeight: 45,
    color: C.brown,
    bold: true,
    maxLines: 2,
  });
  drawMobileFooter(ctx, pageNumber);
}

function drawMobileTerms(ctx, model, pageNumber) {
  drawMobileHeader(ctx, "CONFIRMATION", "确认方案，进入复尺与选样", pageNumber);
  drawTextBlock(ctx, model.content.quote.scopeNote, 60, 280, 780, { size: 27, lineHeight: 42, color: C.muted, maxLines: 3 });
  (model.content.quote.confirmationSteps || []).slice(0, 3).forEach((step, index) => {
    const y = 450 + index * 140;
    setText(ctx, 20, C.accent);
    ctx.fillText(`0${index + 1}`, 60, y);
    setText(ctx, 29, C.brown, "left", true);
    ctx.fillText(step.title, 140, y - 5);
    drawTextBlock(ctx, step.text, 330, y - 3, 500, { size: 24, lineHeight: 36, maxLines: 2 });
    if (index < 2) drawRule(ctx, 140, y + 100, 690);
  });
  setText(ctx, 29, C.brown, "left", true);
  ctx.fillText("报价条款", 60, 895);
  drawTextBlock(ctx, model.draft.terms, 60, 950, 780, { size: 24, lineHeight: 38, maxLines: 5 });
  drawTextBlock(ctx, model.content.quote.naturalMaterialNote, 60, 1170, 780, { size: 21, lineHeight: 34, color: C.muted, maxLines: 3 });
  drawBox(ctx, 60, 1300, 780, 180, C.brown, C.brown);
  setText(ctx, 21, "#d8c6b7");
  ctx.fillText("总部联系", 90, 1330);
  setText(ctx, 31, C.white, "left", true);
  ctx.fillText(model.content.contact.phone, 90, 1375);
  setText(ctx, 21, "#d8c6b7", "right");
  ctx.fillText(`微信 ${model.content.contact.wechat}`, 810, 1335);
  ctx.fillText(model.content.contact.website, 810, 1382);
  drawMobileFooter(ctx, pageNumber);
}

function drawMobileBackCover(ctx, model) {
  ctx.setFillStyle(C.ink);
  ctx.fillRect(0, 0, 900, 1600);
  drawImageCover(ctx, "/assets/login-floor.jpg", 0, 0, 900, 760);
  ctx.setFillStyle(C.ink);
  ctx.fillRect(0, 756, 900, 844);
  drawBox(ctx, 60, 840, 220, 156, C.paperLight, null);
  drawImageContain(ctx, "/assets/logo.png", 78, 854, 184, 130);
  drawTextBlock(ctx, "让木材的真实，\n成为空间的分寸。", 60, 1060, 700, {
    size: 48,
    lineHeight: 66,
    color: C.white,
    bold: true,
    maxLines: 3,
  });
  drawRule(ctx, 60, 1290, 170, "#8a6954", 2);
  setText(ctx, 24, C.darkMuted);
  ctx.fillText(model.content.contact.website.replace(/^www\./, ""), 60, 1350);
  ctx.fillText(model.content.contact.phone, 60, 1400);
  setText(ctx, 18, "#9f8d81", "right");
  ctx.fillText("WOOD ALL  ·  PRIVATE WOODWORK", 840, 1510);
}

function drawMobilePage(ctx, model, page, pageNumber) {
  if (page.kind === "cover") return drawMobileCover(ctx, model);
  if (page.kind === "project") return drawMobileProject(ctx, model, pageNumber);
  if (page.kind === "brand") return drawMobileBrand(ctx, model, pageNumber);
  if (page.kind === "series") return drawMobileSeries(ctx, page.series, pageNumber);
  if (page.kind === "product") return drawMobileProduct(ctx, page.product, pageNumber);
  if (page.kind === "quote") return drawMobileQuote(ctx, model, page.quotePage, pageNumber);
  if (page.kind === "service") return drawMobileService(ctx, model, pageNumber);
  if (page.kind === "terms") return drawMobileTerms(ctx, model, pageNumber);
  return drawMobileBackCover(ctx, model);
}

function drawCanvas(ctx) {
  return new Promise((resolve) => ctx.draw(false, () => setTimeout(resolve, 28)));
}

function canvasToJpeg(format, scope) {
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvasId: format.canvasId,
      x: 0,
      y: 0,
      width: format.width,
      height: format.height,
      destWidth: format.width,
      destHeight: format.height,
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

async function generatePdf(draft, totals, scope, options = {}, onProgress) {
  const variant = options.variant === "mobile" ? "mobile" : "desktop";
  const format = FORMATS[variant];
  const model = buildExportModel(draft, totals, products, content);
  const pages = buildPages(model, variant);
  const images = [];
  for (let index = 0; index < pages.length; index += 1) {
    const ctx = wx.createCanvasContext(format.canvasId, scope);
    if (variant === "mobile") drawMobilePage(ctx, model, pages[index], index + 1);
    else drawDesktopPage(ctx, model, pages[index], index + 1);
    await drawCanvas(ctx);
    const temp = await canvasToJpeg(format, scope);
    const bytes = await readFileBytes(temp.tempFilePath);
    images.push({ bytes, width: format.width, height: format.height });
    if (onProgress) onProgress(index + 1, pages.length);
  }
  return buildImagePdf(images, format.width, format.height);
}

module.exports = {
  FORMATS,
  buildPages,
  generatePdf,
  __test: {
    drawDesktopPage,
    drawMobilePage,
  },
};
