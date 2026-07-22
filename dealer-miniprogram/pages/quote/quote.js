const api = require("../../utils/api");
const quoteUtil = require("../../utils/quote");
const products = require("../../data/products");

const amount = (cents) => `¥${(Number(cents || 0) / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

Page({
  data: { draft: null, totals: { lines: [] }, totalText: "¥0.00", productResults: [], activeProductIndex: -1, saveState: "尚未保存", saving: false },
  async onLoad(options) {
    let draft = wx.getStorageSync("woodallEditQuote") || quoteUtil.createDraft();
    if (options.id) {
      try {
        const result = await api.listQuotes();
        draft = result.quotes.find((item) => item.id === options.id)?.draft || draft;
      } catch (error) { wx.showToast({ title: error.message, icon: "none" }); }
    }
    draft.lines = (draft.lines?.length ? draft.lines : [quoteUtil.blankLine()]).map((line) => ({ ...line, productQuery: line.productCode || "" }));
    this.setData({ draft });
    this.recalculate();
  },
  onUnload() { if (this.data.draft) wx.setStorageSync("woodallEditQuote", this.cleanDraft()); },
  cleanDraft() {
    const draft = JSON.parse(JSON.stringify(this.data.draft));
    draft.lines = draft.lines.map(({ productQuery, ...line }) => line);
    draft.updatedAt = new Date().toISOString();
    return draft;
  },
  update() {
    this.recalculate();
    wx.setStorageSync("woodallEditQuote", this.cleanDraft());
    this.setData({ saveState: "已保存本机" });
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(true), 900);
  },
  recalculate() {
    const totals = quoteUtil.calculate(this.cleanDraft());
    this.setData({ totals, totalText: amount(totals.totalCents) });
  },
  onProjectInput(event) {
    const draft = this.data.draft;
    draft.project[event.currentTarget.dataset.field] = event.detail.value;
    this.setData({ draft }); this.update();
  },
  onFeeInput(event) {
    const draft = this.data.draft;
    draft.fees[event.currentTarget.dataset.field] = event.detail.value;
    this.setData({ draft }); this.update();
  },
  onLineInput(event) {
    const index = Number(event.currentTarget.dataset.index);
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;
    const draft = this.data.draft;
    draft.lines[index][field] = value;
    if (field === "productQuery") {
      const query = value.trim().toLowerCase();
      const exact = products.find((product) => product.code.toLowerCase() === query);
      draft.lines[index].productCode = exact?.code || "";
      this.setData({ productResults: this.searchProducts(query), activeProductIndex: index });
    }
    this.setData({ draft }); this.update();
  },
  openProduct(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({ activeProductIndex: index, productResults: this.searchProducts(this.data.draft.lines[index].productQuery || "") });
  },
  searchProducts(query) {
    const text = String(query || "").toLowerCase();
    return products.filter((product) => !text || [product.code, product.wood, product.series].some((value) => String(value).toLowerCase().includes(text))).slice(0, 8);
  },
  chooseProduct(event) {
    const product = products.find((item) => item.code === event.currentTarget.dataset.code);
    const index = this.data.activeProductIndex;
    if (!product || index < 0) return;
    const draft = this.data.draft;
    draft.lines[index].productCode = product.code;
    draft.lines[index].productQuery = product.code;
    this.setData({ draft, productResults: [], activeProductIndex: -1 }); this.update();
  },
  addLine() {
    if (this.data.draft.lines.length >= 8) return;
    const draft = this.data.draft;
    draft.lines.push({ ...quoteUtil.blankLine(), productQuery: "" });
    this.setData({ draft }); this.update();
  },
  removeLine(event) {
    const draft = this.data.draft;
    draft.lines.splice(Number(event.currentTarget.dataset.index), 1);
    if (!draft.lines.length) draft.lines.push({ ...quoteUtil.blankLine(), productQuery: "" });
    this.setData({ draft, productResults: [], activeProductIndex: -1 }); this.update();
  },
  async saveNow(silent = false) {
    clearTimeout(this.saveTimer);
    this.setData({ saving: !silent, saveState: "正在同步…" });
    try {
      const draft = this.cleanDraft();
      await api.saveQuote(draft);
      wx.setStorageSync("woodallEditQuote", draft);
      this.setData({ saveState: "已同步至总部" });
      if (!silent) wx.showToast({ title: "报价已保存", icon: "success" });
    } catch (error) {
      this.setData({ saveState: "已保存本机，等待同步" });
      if (!silent) wx.showToast({ title: error.message, icon: "none" });
    } finally { this.setData({ saving: false }); }
  },
});
