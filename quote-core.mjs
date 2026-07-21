export const QUOTE_DRAFT_VERSION = 1;
export const MAX_QUOTE_LINES = 8;

const SERIES_ALIASES = {
  "境系列": "境系列（阿兹慕）",
  "森系列": "森系列（大板屋）",
  "悦系列": "悦系列（多诺米亚）",
  "墨系列": "墨系列（莫马）",
};

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const roundArea = (value) => Math.round((numberValue(value) + Number.EPSILON) * 100) / 100;
export const yuanToCents = (value) => Math.round((numberValue(value) + Number.EPSILON) * 100);
export const centsToYuan = (value) => numberValue(value) / 100;

export function normalizeSeriesName(series) {
  const value = String(series || "").trim();
  if (SERIES_ALIASES[value]) return SERIES_ALIASES[value];
  const shortName = value.split("（")[0];
  return SERIES_ALIASES[shortName] || value;
}

export function createDraft(overrides = {}) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const valid = new Date(now);
  valid.setDate(valid.getDate() + 15);
  const stamp = now.toISOString();
  const id = overrides.id || (globalThis.crypto?.randomUUID?.() || `quote-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  return {
    version: QUOTE_DRAFT_VERSION,
    id,
    title: overrides.title || "未命名报价",
    customTitle: Boolean(overrides.customTitle),
    createdAt: overrides.createdAt || stamp,
    updatedAt: overrides.updatedAt || stamp,
    project: {
      name: "",
      city: "",
      address: "",
      quoteDate: date,
      validUntil: valid.toISOString().slice(0, 10),
      needs: "",
      advice: "",
      ...(overrides.project || {}),
    },
    tax: { mode: "included", rate: 13, ...(overrides.tax || {}) },
    discount: { type: "percent", value: 0, ...(overrides.discount || {}) },
    fees: {
      accessoryUnitPrice: 0,
      installationUnitPrice: 0,
      transportAmount: 0,
      otherAmount: 0,
      otherLabel: "",
      ...(overrides.fees || {}),
    },
    terms: overrides.terms || "本报价以最终复尺面积与确认方案为结算依据；天然木材存在合理色差、结疤与纹理差异，具体以实物选样为准。",
    lines: Array.isArray(overrides.lines) ? overrides.lines.slice(0, MAX_QUOTE_LINES) : [],
  };
}

export function migrateDraft(raw) {
  if (!raw || typeof raw !== "object") return createDraft();
  const source = raw.version === QUOTE_DRAFT_VERSION ? raw : { ...raw, version: QUOTE_DRAFT_VERSION };
  return createDraft({
    ...source,
    project: source.project || {},
    tax: source.tax || {},
    discount: source.discount || {},
    fees: source.fees || {},
    lines: Array.isArray(source.lines) ? source.lines : [],
  });
}

export function calculateQuote(draft) {
  const lines = (draft?.lines || []).slice(0, MAX_QUOTE_LINES).map((line, index) => {
    const netArea = roundArea(Math.max(0, numberValue(line.netArea)));
    const wasteRate = Math.max(0, numberValue(line.wasteRate));
    const billableArea = roundArea(netArea * (1 + wasteRate / 100));
    const unitPriceCents = yuanToCents(Math.max(0, numberValue(line.unitPrice)));
    const amountCents = Math.round(billableArea * unitPriceCents);
    return { ...line, index, netArea, wasteRate, billableArea, unitPriceCents, amountCents };
  });

  const totalNetArea = roundArea(lines.reduce((sum, line) => sum + line.netArea, 0));
  const totalBillableArea = roundArea(lines.reduce((sum, line) => sum + line.billableArea, 0));
  const materialCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const accessoryCents = Math.round(totalBillableArea * yuanToCents(draft?.fees?.accessoryUnitPrice));
  const installationCents = Math.round(totalBillableArea * yuanToCents(draft?.fees?.installationUnitPrice));
  const transportCents = yuanToCents(draft?.fees?.transportAmount);
  const otherCents = yuanToCents(draft?.fees?.otherAmount);
  const subtotalCents = materialCents + accessoryCents + installationCents + transportCents + otherCents;

  const discountType = draft?.discount?.type === "fixed" ? "fixed" : "percent";
  const discountValue = Math.max(0, numberValue(draft?.discount?.value));
  const rawDiscount = discountType === "fixed"
    ? yuanToCents(discountValue)
    : Math.round(subtotalCents * Math.min(100, discountValue) / 100);
  const discountCents = Math.min(subtotalCents, rawDiscount);
  const discountedCents = subtotalCents - discountCents;

  const taxMode = draft?.tax?.mode === "excluded" ? "excluded" : "included";
  const taxRate = Math.max(0, numberValue(draft?.tax?.rate));
  const taxCents = taxMode === "excluded"
    ? Math.round(discountedCents * taxRate / 100)
    : taxRate > 0
      ? Math.round(discountedCents * taxRate / (100 + taxRate))
      : 0;
  const totalCents = taxMode === "excluded" ? discountedCents + taxCents : discountedCents;

  const optionalItems = [
    { key: "accessory", label: "辅材费", cents: accessoryCents },
    { key: "installation", label: "安装费", cents: installationCents },
    { key: "transport", label: "运输费", cents: transportCents },
    { key: "other", label: String(draft?.fees?.otherLabel || "其他费用").trim() || "其他费用", cents: otherCents },
  ].filter((item) => item.cents > 0);

  return {
    lines,
    totalNetArea,
    totalBillableArea,
    materialCents,
    accessoryCents,
    installationCents,
    transportCents,
    otherCents,
    optionalItems,
    subtotalCents,
    discountCents,
    discountedCents,
    taxCents,
    totalCents,
    taxMode,
    taxRate,
    discountType,
    discountValue,
  };
}

export function validateDraft(draft, catalog = []) {
  const errors = [];
  const catalogCodes = new Set(catalog.map((product) => product.code));
  if (!String(draft?.project?.name || "").trim()) {
    errors.push({ path: "project.name", message: "请填写客户或项目名称" });
  }
  const lines = Array.isArray(draft?.lines) ? draft.lines : [];
  if (!lines.length) errors.push({ path: "lines", message: "请至少添加一条产品明细" });
  if (lines.length > MAX_QUOTE_LINES) errors.push({ path: "lines", message: `每单最多 ${MAX_QUOTE_LINES} 条明细` });
  lines.slice(0, MAX_QUOTE_LINES).forEach((line, index) => {
    const prefix = `lines.${index}`;
    if (!String(line.room || "").trim()) errors.push({ path: `${prefix}.room`, message: `第 ${index + 1} 条请填写空间名称` });
    if (!String(line.productCode || "").trim()) errors.push({ path: `${prefix}.productCode`, message: `第 ${index + 1} 条请选择产品型号` });
    else if (catalogCodes.size && !catalogCodes.has(line.productCode)) errors.push({ path: `${prefix}.productCode`, message: `第 ${index + 1} 条产品型号不在现有产品库中` });
    if (!(numberValue(line.netArea) > 0)) errors.push({ path: `${prefix}.netArea`, message: `第 ${index + 1} 条净面积必须大于 0` });
    if (!(numberValue(line.unitPrice) > 0)) errors.push({ path: `${prefix}.unitPrice`, message: `第 ${index + 1} 条产品单价必须大于 0` });
    if (numberValue(line.wasteRate) < 0) errors.push({ path: `${prefix}.wasteRate`, message: `第 ${index + 1} 条损耗率不能为负数` });
  });
  if (numberValue(draft?.fees?.otherAmount) > 0 && !String(draft?.fees?.otherLabel || "").trim()) {
    errors.push({ path: "fees.otherLabel", message: "填写其他费用后，请补充费用说明" });
  }
  if (draft?.tax?.mode === "excluded" && numberValue(draft?.tax?.rate) < 0) {
    errors.push({ path: "tax.rate", message: "税率不能为负数" });
  }
  return errors;
}

function mediaCandidates(product, preferredRole) {
  const roleOrder = [preferredRole, ...["E", "B", "A"].filter((role) => role !== preferredRole)];
  const gallery = Array.isArray(product?.gallery) ? product.gallery : [];
  const candidates = [];
  roleOrder.forEach((role) => {
    gallery.filter((image) => image.role === role).forEach((image) => {
      if (image.src) candidates.push({ src: image.src, thumb: image.thumb, role, width: image.width, height: image.height });
    });
  });
  return candidates;
}

export function buildDeckModel(draft, catalog, content) {
  const totals = calculateQuote(draft);
  const catalogByCode = new Map(catalog.map((product) => [product.code, product]));
  const lines = totals.lines.map((line) => ({ ...line, product: catalogByCode.get(line.productCode) || null }));
  const products = [];
  const productCodes = new Set();
  lines.forEach((line) => {
    if (line.product && !productCodes.has(line.product.code)) {
      productCodes.add(line.product.code);
      products.push({
        ...line.product,
        seriesKey: normalizeSeriesName(line.product.series),
        sceneCandidates: mediaCandidates(line.product, "E"),
        detailCandidates: mediaCandidates(line.product, "B"),
        textureCandidates: mediaCandidates(line.product, "A"),
      });
    }
  });
  const series = [];
  const seriesKeys = new Set();
  products.forEach((product) => {
    if (!seriesKeys.has(product.seriesKey)) {
      seriesKeys.add(product.seriesKey);
      series.push({ key: product.seriesKey, ...(content?.series?.[product.seriesKey] || {}) });
    }
  });
  const quotePages = [];
  for (let index = 0; index < lines.length; index += 6) {
    quotePages.push({ lines: lines.slice(index, index + 6), isLast: index + 6 >= lines.length });
  }
  return {
    draft,
    totals,
    lines,
    products,
    series,
    quotePages,
    content,
    generatedAt: new Date().toISOString(),
  };
}
