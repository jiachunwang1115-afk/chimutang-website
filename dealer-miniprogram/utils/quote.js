const MAX_LINES = 8;

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundArea(value) {
  return Math.round((numberValue(value) + Number.EPSILON) * 100) / 100;
}

function yuanToCents(value) {
  return Math.round((numberValue(value) + Number.EPSILON) * 100);
}

function uuid() {
  return `quote-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function blankLine() {
  return { room: "", productCode: "", netArea: "", wasteRate: 5, unitPrice: "", note: "" };
}

function createDraft(overrides = {}) {
  const stamp = new Date().toISOString();
  return {
    version: 1,
    id: overrides.id || uuid(),
    title: overrides.title || "未命名报价",
    customTitle: Boolean(overrides.customTitle),
    createdAt: overrides.createdAt || stamp,
    updatedAt: overrides.updatedAt || stamp,
    project: {
      name: "",
      city: "",
      address: "",
      quoteDate: dateAfter(0),
      validUntil: dateAfter(15),
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
    lines: Array.isArray(overrides.lines) && overrides.lines.length ? overrides.lines.slice(0, MAX_LINES) : [blankLine()],
  };
}

function migrateDraft(raw) {
  if (!raw || typeof raw !== "object") return createDraft();
  return createDraft({
    ...raw,
    version: 1,
    project: raw.project || {},
    tax: raw.tax || {},
    discount: raw.discount || {},
    fees: raw.fees || {},
    lines: Array.isArray(raw.lines) ? raw.lines : [],
  });
}

function calculate(draft) {
  const source = migrateDraft(draft);
  const lines = source.lines.slice(0, MAX_LINES).map((line, index) => {
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
  const accessoryCents = Math.round(totalBillableArea * yuanToCents(source.fees.accessoryUnitPrice));
  const installationCents = Math.round(totalBillableArea * yuanToCents(source.fees.installationUnitPrice));
  const transportCents = yuanToCents(source.fees.transportAmount);
  const otherCents = yuanToCents(source.fees.otherAmount);
  const subtotalCents = materialCents + accessoryCents + installationCents + transportCents + otherCents;

  const discountType = source.discount.type === "fixed" ? "fixed" : "percent";
  const discountValue = Math.max(0, numberValue(source.discount.value));
  const rawDiscount = discountType === "fixed"
    ? yuanToCents(discountValue)
    : Math.round(subtotalCents * Math.min(100, discountValue) / 100);
  const discountCents = Math.min(subtotalCents, rawDiscount);
  const discountedCents = subtotalCents - discountCents;

  const taxMode = source.tax.mode === "excluded" ? "excluded" : "included";
  const taxRate = Math.max(0, numberValue(source.tax.rate));
  const taxCents = taxMode === "excluded"
    ? Math.round(discountedCents * taxRate / 100)
    : taxRate > 0 ? Math.round(discountedCents * taxRate / (100 + taxRate)) : 0;
  const totalCents = taxMode === "excluded" ? discountedCents + taxCents : discountedCents;

  return {
    lines,
    totalNetArea,
    totalBillableArea,
    materialCents,
    accessoryCents,
    installationCents,
    transportCents,
    otherCents,
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

function validate(draft, products = []) {
  const errors = [];
  const codes = new Set(products.map((product) => product.code));
  if (!String(draft?.project?.name || "").trim()) errors.push({ path: "project", message: "请填写客户或项目名称" });
  const lines = Array.isArray(draft?.lines) ? draft.lines : [];
  if (!lines.length) errors.push({ path: "lines", message: "请至少添加一条产品明细" });
  if (lines.length > MAX_LINES) errors.push({ path: "lines", message: `每单最多 ${MAX_LINES} 条产品明细` });
  lines.slice(0, MAX_LINES).forEach((line, index) => {
    if (!String(line.room || "").trim()) errors.push({ path: `line-${index}`, message: `第 ${index + 1} 条请填写空间名称` });
    if (!String(line.productCode || "").trim()) errors.push({ path: `line-${index}`, message: `第 ${index + 1} 条请选择产品型号` });
    else if (codes.size && !codes.has(line.productCode)) errors.push({ path: `line-${index}`, message: `第 ${index + 1} 条产品型号不在产品库中` });
    if (!(numberValue(line.netArea) > 0)) errors.push({ path: `line-${index}`, message: `第 ${index + 1} 条净面积必须大于 0` });
    if (!(numberValue(line.unitPrice) > 0)) errors.push({ path: `line-${index}`, message: `第 ${index + 1} 条单价必须大于 0` });
    if (numberValue(line.wasteRate) < 0) errors.push({ path: `line-${index}`, message: `第 ${index + 1} 条损耗率不能为负数` });
  });
  if (numberValue(draft?.fees?.otherAmount) > 0 && !String(draft?.fees?.otherLabel || "").trim()) {
    errors.push({ path: "fees", message: "填写其他费用后，请补充费用说明" });
  }
  return errors;
}

function duplicateDraft(draft) {
  const source = migrateDraft(draft);
  return createDraft({
    ...source,
    id: undefined,
    title: `${source.title || source.project.name || "未命名报价"}（副本）`,
    customTitle: true,
    createdAt: undefined,
    updatedAt: undefined,
  });
}

module.exports = {
  MAX_LINES,
  blankLine,
  calculate,
  createDraft,
  duplicateDraft,
  migrateDraft,
  roundArea,
  validate,
  yuanToCents,
};
