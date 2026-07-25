const DEFAULT_CONTENT = {
  brand: {
    name: "痴木堂",
    englishName: "WOOD ALL",
    positioning: "高端原木地板定制",
    headline: "让木材的真实，成为空间的分寸",
    summary: "尊重每一块木材的天然差异，也以可核验的产品、参数与交付标准，让这份差异被准确地带入空间。",
    proofs: [],
  },
  series: {},
  service: { headline: "把选择，落到完成面", summary: "", steps: [] },
  contact: { company: "痴木堂 WOOD ALL", phone: "0575-85666148", wechat: "deku", website: "www.woodall.design" },
  quote: {
    scopeNote: "本提案所列产品、面积与服务范围，是后续复尺、选样与合同确认的依据。",
    naturalMaterialNote: "天然木材存在合理色差、纹理与结疤差异，最终以确认样与到货实物为准。",
    confirmationSteps: [],
  },
};

function money(cents) {
  return `¥${(Number(cents || 0) / 100).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortSeries(value) {
  return String(value || "").split("（")[0] || "系列待确认";
}

function buildSummaryItems(draft, totals) {
  return [
    { label: "产品金额", value: money(totals.materialCents), visible: true },
    { label: "辅材费", value: money(totals.accessoryCents), visible: totals.accessoryCents > 0 },
    { label: "安装费", value: money(totals.installationCents), visible: totals.installationCents > 0 },
    { label: "运输费", value: money(totals.transportCents), visible: totals.transportCents > 0 },
    { label: draft.fees.otherLabel || "其他费用", value: money(totals.otherCents), visible: totals.otherCents > 0 },
    { label: "折扣", value: `-${money(totals.discountCents)}`, visible: totals.discountCents > 0 },
    {
      label: `税额（${totals.taxRate}%）`,
      value: money(totals.taxCents),
      visible: totals.taxMode === "excluded" && totals.taxCents > 0,
    },
  ].filter((item) => item.visible);
}

function productFacts(product) {
  return [
    ["木种", product.wood],
    ["结构", product.structure],
    ["规格", product.spec],
    ["板型", product.board],
    ["表面", product.surface],
    ["基材", product.base],
    ["等级", product.grade],
    ["厂方型号", product.model],
  ].filter((item) => item[1]);
}

function buildExportModel(draft, totals, products, content = DEFAULT_CONTENT) {
  const copy = {
    ...DEFAULT_CONTENT,
    ...content,
    brand: { ...DEFAULT_CONTENT.brand, ...(content.brand || {}) },
    service: { ...DEFAULT_CONTENT.service, ...(content.service || {}) },
    contact: { ...DEFAULT_CONTENT.contact, ...(content.contact || {}) },
    quote: { ...DEFAULT_CONTENT.quote, ...(content.quote || {}) },
    series: content.series || {},
  };
  const productByCode = new Map(products.map((product) => [product.code, product]));
  const lines = totals.lines.map((calculated, index) => {
    const source = draft.lines[index] || {};
    const product = productByCode.get(source.productCode) || { code: source.productCode };
    return {
      ...source,
      ...calculated,
      product,
      seriesName: product.series || "系列待确认",
      seriesShort: shortSeries(product.series),
      amountText: money(calculated.amountCents),
      unitPriceText: money(calculated.unitPriceCents),
    };
  });

  const uniqueProducts = [];
  const seenProducts = new Set();
  lines.forEach((line) => {
    if (!line.product.code || seenProducts.has(line.product.code)) return;
    seenProducts.add(line.product.code);
    uniqueProducts.push({
      ...line.product,
      seriesShort: shortSeries(line.product.series),
      facts: productFacts(line.product),
      rooms: lines.filter((item) => item.product.code === line.product.code).map((item) => item.room),
    });
  });

  const uniqueSeries = [];
  const seenSeries = new Set();
  uniqueProducts.forEach((product) => {
    const name = product.series || "系列待确认";
    if (seenSeries.has(name)) return;
    seenSeries.add(name);
    const seriesCopy = copy.series[name] || {};
    uniqueSeries.push({
      name,
      shortName: seriesCopy.shortName || shortSeries(name),
      tagline: seriesCopy.tagline || "以木材本真，回应空间尺度",
      summary: seriesCopy.summary || "从木种、结构与表面工艺出发，建立适合项目采光、尺度与使用方式的材料关系。",
      features: Array.isArray(seriesCopy.features) ? seriesCopy.features : [],
      image: product.thumbUrl || "",
    });
  });

  const quotePages = [];
  for (let index = 0; index < lines.length; index += 6) {
    quotePages.push({
      rows: lines.slice(index, index + 6),
      pageIndex: quotePages.length,
      isLast: index + 6 >= lines.length,
    });
  }

  const pages = [
    { kind: "cover" },
    { kind: "project" },
    { kind: "brand" },
    ...uniqueSeries.map((series) => ({ kind: "series", series })),
    ...uniqueProducts.map((product) => ({ kind: "product", product })),
    ...quotePages.map((quotePage) => ({ kind: "quote", quotePage })),
    { kind: "service" },
    { kind: "terms" },
  ];

  return {
    draft,
    totals,
    content: copy,
    lines,
    products: uniqueProducts,
    series: uniqueSeries,
    quotePages,
    summaryItems: buildSummaryItems(draft, totals),
    totalText: money(totals.totalCents),
    pages,
  };
}

function safeFileName(projectName, extension) {
  const project = String(projectName || "未命名项目")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 36) || "未命名项目";
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `痴木堂-${project}-${stamp}-私定报价.${extension}`;
}

module.exports = {
  buildExportModel,
  money,
  safeFileName,
  shortSeries,
};
