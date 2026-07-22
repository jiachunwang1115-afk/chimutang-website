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

function createDraft() {
  const stamp = new Date().toISOString();
  return {
    version: 1,
    id: uuid(),
    title: "未命名报价",
    createdAt: stamp,
    updatedAt: stamp,
    project: { name: "", city: "", address: "", quoteDate: dateAfter(0), validUntil: dateAfter(15), needs: "", advice: "" },
    tax: { mode: "included", rate: 13 },
    discount: { type: "percent", value: 0 },
    fees: { accessoryUnitPrice: 0, installationUnitPrice: 0, transportAmount: 0, otherAmount: 0, otherLabel: "" },
    terms: "本报价以最终复尺面积与确认方案为结算依据；天然木材存在合理色差、结疤与纹理差异，具体以实物选样为准。",
    lines: [blankLine()],
  };
}

function calculate(draft) {
  const roundArea = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  const cents = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100);
  const lines = draft.lines.map((line) => {
    const netArea = roundArea(line.netArea);
    const billableArea = roundArea(netArea * (1 + Number(line.wasteRate || 0) / 100));
    return { ...line, netArea, billableArea, amountCents: Math.round(billableArea * cents(line.unitPrice)) };
  });
  const totalNetArea = roundArea(lines.reduce((sum, line) => sum + line.netArea, 0));
  const totalBillableArea = roundArea(lines.reduce((sum, line) => sum + line.billableArea, 0));
  const materialCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const fees = Math.round(totalBillableArea * cents(draft.fees.accessoryUnitPrice))
    + Math.round(totalBillableArea * cents(draft.fees.installationUnitPrice))
    + cents(draft.fees.transportAmount) + cents(draft.fees.otherAmount);
  const subtotal = materialCents + fees;
  const discount = draft.discount.type === "fixed"
    ? Math.min(subtotal, cents(draft.discount.value))
    : Math.round(subtotal * Math.min(100, Number(draft.discount.value || 0)) / 100);
  const discounted = subtotal - discount;
  const tax = draft.tax.mode === "excluded" ? Math.round(discounted * Number(draft.tax.rate || 0) / 100) : 0;
  return { lines, totalNetArea, totalBillableArea, totalCents: discounted + tax };
}

module.exports = { blankLine, createDraft, calculate };
