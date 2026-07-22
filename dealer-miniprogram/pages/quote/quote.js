const api = require("../../utils/api");
const quoteUtil = require("../../utils/quote");
const products = require("../../data/products");

const money = (cents) => `¥${(Number(cents || 0) / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortSeries = (value) => String(value || "").split("（")[0] || "系列待确认";
const productByCode = new Map(products.map((product) => [product.code, product]));
const seriesOptions = ["全部", ...new Set(products.map((product) => shortSeries(product.series)).filter(Boolean))];

function decorateProduct(product) {
  return {
    ...product,
    seriesShort: shortSeries(product.series),
    thumbUrl: product.thumbUrl || "",
    statusText: product.status || "资料待确认",
  };
}

function decorateLine(line) {
  const product = productByCode.get(line.productCode);
  return {
    ...line,
    productName: product ? `${product.code} · ${product.wood || "木种待确认"}` : "请选择产品型号",
    productMeta: product ? `${shortSeries(product.series)} · ${product.spec || product.structure || "规格待确认"}` : "按型号、木种或系列查找",
    productThumb: product?.thumbUrl || "",
    productStatus: product?.status || "",
  };
}

Page({
  data: {
    draft: null,
    totals: { lines: [] },
    totalText: "¥0.00",
    summaryItems: [],
    productPickerOpen: false,
    productResults: [],
    productQuery: "",
    activeProductIndex: -1,
    seriesOptions,
    activeSeries: "全部",
    discountTypeLabels: ["百分比折扣", "固定金额"],
    taxModeLabels: ["输入金额已含税", "输入金额未含税"],
    discountTypeIndex: 0,
    taxModeIndex: 0,
    saveState: "尚未保存",
    saving: false,
    localMode: false,
  },
  async onLoad(options) {
    let draft = wx.getStorageSync("woodallEditQuote") || quoteUtil.createDraft();
    if (options.id) {
      try {
        const result = await api.listQuotes();
        const id = decodeURIComponent(options.id);
        draft = result.quotes.find((item) => item.id === id)?.draft || draft;
      } catch (error) {
        wx.showToast({ title: error.message, icon: "none" });
      }
    }
    draft = quoteUtil.migrateDraft(draft);
    draft.lines = draft.lines.map(decorateLine);
    this.setData({
      draft,
      localMode: api.mode() === api.LOCAL_MODE,
      discountTypeIndex: draft.discount.type === "fixed" ? 1 : 0,
      taxModeIndex: draft.tax.mode === "excluded" ? 1 : 0,
    });
    this.recalculate();
  },
  onUnload() {
    clearTimeout(this.saveTimer);
    if (this.data.draft) wx.setStorageSync("woodallEditQuote", this.cleanDraft());
  },
  noop() {},
  cleanDraft() {
    const draft = JSON.parse(JSON.stringify(this.data.draft));
    draft.lines = draft.lines.map(({ productName, productMeta, productThumb, productStatus, ...line }) => line);
    if (!draft.customTitle && draft.project.name) draft.title = draft.project.name;
    draft.updatedAt = new Date().toISOString();
    return draft;
  },
  update() {
    this.recalculate();
    const draft = this.cleanDraft();
    wx.setStorageSync("woodallEditQuote", draft);
    this.setData({ saveState: this.data.localMode ? "已保存本机" : "等待同步" });
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveDraft(true), 1200);
  },
  recalculate() {
    const totals = quoteUtil.calculate(this.cleanDraft());
    const lines = totals.lines.map((line) => ({ ...line, amountText: money(line.amountCents) }));
    const summaryItems = [
      { key: "material", label: "产品金额", value: money(totals.materialCents), visible: true },
      { key: "accessory", label: "辅材费", value: money(totals.accessoryCents), visible: totals.accessoryCents > 0 },
      { key: "installation", label: "安装费", value: money(totals.installationCents), visible: totals.installationCents > 0 },
      { key: "transport", label: "运输费", value: money(totals.transportCents), visible: totals.transportCents > 0 },
      { key: "other", label: this.data.draft.fees.otherLabel || "其他费用", value: money(totals.otherCents), visible: totals.otherCents > 0 },
      { key: "discount", label: "折扣", value: `-${money(totals.discountCents)}`, visible: totals.discountCents > 0 },
      { key: "tax", label: `税额（${totals.taxRate}%）`, value: money(totals.taxCents), visible: totals.taxMode === "excluded" && totals.taxCents > 0 },
    ].filter((item) => item.visible);
    this.setData({ totals: { ...totals, lines }, totalText: money(totals.totalCents), summaryItems });
  },
  onProjectInput(event) {
    const draft = this.data.draft;
    draft.project[event.currentTarget.dataset.field] = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  onFeeInput(event) {
    const draft = this.data.draft;
    draft.fees[event.currentTarget.dataset.field] = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  onDiscountInput(event) {
    const draft = this.data.draft;
    draft.discount.value = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  onDiscountType(event) {
    const index = Number(event.detail.value);
    const draft = this.data.draft;
    draft.discount.type = index === 1 ? "fixed" : "percent";
    this.setData({ draft, discountTypeIndex: index });
    this.update();
  },
  onTaxInput(event) {
    const draft = this.data.draft;
    draft.tax.rate = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  onTaxMode(event) {
    const index = Number(event.detail.value);
    const draft = this.data.draft;
    draft.tax.mode = index === 1 ? "excluded" : "included";
    this.setData({ draft, taxModeIndex: index });
    this.update();
  },
  onTermsInput(event) {
    const draft = this.data.draft;
    draft.terms = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  onLineInput(event) {
    const index = Number(event.currentTarget.dataset.index);
    const draft = this.data.draft;
    draft.lines[index][event.currentTarget.dataset.field] = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  openProduct(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({
      activeProductIndex: index,
      productPickerOpen: true,
      productQuery: "",
      activeSeries: "全部",
      productResults: this.searchProducts("", "全部"),
    });
  },
  closeProduct() {
    this.setData({ productPickerOpen: false, activeProductIndex: -1, productResults: [], productQuery: "" });
  },
  onProductSearch(event) {
    const query = event.detail.value;
    this.setData({ productQuery: query, productResults: this.searchProducts(query, this.data.activeSeries) });
  },
  chooseSeries(event) {
    const series = event.currentTarget.dataset.series;
    this.setData({ activeSeries: series, productResults: this.searchProducts(this.data.productQuery, series) });
  },
  searchProducts(query, series) {
    const text = String(query || "").trim().toLowerCase();
    return products.filter((product) => {
      const seriesMatch = series === "全部" || shortSeries(product.series) === series;
      const textMatch = !text || [product.code, product.wood, product.series, product.structure, product.spec]
        .some((value) => String(value || "").toLowerCase().includes(text));
      return seriesMatch && textMatch;
    }).slice(0, 50).map(decorateProduct);
  },
  chooseProduct(event) {
    const product = productByCode.get(event.currentTarget.dataset.code);
    const index = this.data.activeProductIndex;
    if (!product || index < 0) return;
    const draft = this.data.draft;
    draft.lines[index] = decorateLine({ ...draft.lines[index], productCode: product.code });
    this.setData({ draft });
    this.closeProduct();
    this.update();
  },
  addLine() {
    if (this.data.draft.lines.length >= quoteUtil.MAX_LINES) return;
    const draft = this.data.draft;
    draft.lines.push(decorateLine(quoteUtil.blankLine()));
    this.setData({ draft });
    this.update();
  },
  removeLine(event) {
    const draft = this.data.draft;
    draft.lines.splice(Number(event.currentTarget.dataset.index), 1);
    if (!draft.lines.length) draft.lines.push(decorateLine(quoteUtil.blankLine()));
    this.setData({ draft });
    this.update();
  },
  moveLine(event) {
    const index = Number(event.currentTarget.dataset.index);
    const direction = Number(event.currentTarget.dataset.direction);
    const next = index + direction;
    const draft = this.data.draft;
    if (next < 0 || next >= draft.lines.length) return;
    [draft.lines[index], draft.lines[next]] = [draft.lines[next], draft.lines[index]];
    this.setData({ draft });
    this.update();
  },
  async manualSave() {
    const draft = this.cleanDraft();
    const errors = quoteUtil.validate(draft, products);
    if (errors.length) {
      const first = errors[0];
      wx.showModal({ title: "请完善报价", content: first.message, showCancel: false });
      wx.pageScrollTo({ selector: `#${first.path}`, duration: 260 });
      return;
    }
    await this.saveDraft(false);
  },
  async saveDraft(silent) {
    clearTimeout(this.saveTimer);
    this.setData({ saving: !silent, saveState: this.data.localMode ? "正在保存…" : "正在同步…" });
    try {
      const draft = this.cleanDraft();
      const result = await api.saveQuote(draft);
      const saved = result.quote?.draft || draft;
      wx.setStorageSync("woodallEditQuote", saved);
      this.setData({ saveState: this.data.localMode ? "已保存本机" : "已同步至总部" });
      if (!silent) wx.showToast({ title: this.data.localMode ? "已保存到本机" : "报价已同步", icon: "success" });
    } catch (error) {
      this.setData({ saveState: "已保存本机，等待同步" });
      wx.setStorageSync("woodallEditQuote", this.cleanDraft());
      if (!silent) wx.showToast({ title: error.message, icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  },
});
