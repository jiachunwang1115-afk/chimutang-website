const api = require("../../utils/api");
const quoteUtil = require("../../utils/quote");
const amount = (cents) => `¥${(Number(cents || 0) / 100).toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;

Page({
  data: { quotes: [], visibleQuotes: [], query: "", localMode: false, loading: true },
  onShow() {
    this.load();
  },
  async load() {
    this.setData({ loading: true });
    try {
      const result = await api.listQuotes();
      const quotes = (result.quotes || []).map((item) => ({
        ...item,
        amountText: amount(item.totalCents),
        dateText: (item.updatedAt || "").slice(0, 10),
      }));
      this.setData({ quotes, visibleQuotes: this.filterQuotes(quotes, this.data.query), localMode: api.mode() === api.LOCAL_MODE });
    } catch (error) {
      if (error.status === 401) wx.reLaunch({ url: "/pages/login/login" });
      else wx.showToast({ title: error.message, icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },
  filterQuotes(quotes, query) {
    const text = String(query || "").trim().toLowerCase();
    return quotes.filter((item) => !text || [item.projectName, item.city, item.title]
      .some((value) => String(value || "").toLowerCase().includes(text)));
  },
  search(event) {
    const query = event.detail.value;
    this.setData({ query, visibleQuotes: this.filterQuotes(this.data.quotes, query) });
  },
  open(event) {
    wx.navigateTo({ url: `/pages/quote/quote?id=${encodeURIComponent(event.currentTarget.dataset.id)}` });
  },
  create() {
    wx.setStorageSync("woodallEditQuote", quoteUtil.createDraft());
    wx.navigateTo({ url: "/pages/quote/quote" });
  },
  async duplicate(event) {
    const source = this.data.quotes.find((item) => item.id === event.currentTarget.dataset.id)?.draft;
    if (!source) return;
    const copy = quoteUtil.duplicateDraft(source);
    try {
      await api.saveQuote(copy);
      wx.showToast({ title: "已复制报价", icon: "success" });
      await this.load();
    } catch (error) {
      wx.showToast({ title: error.message, icon: "none" });
    }
  },
  delete(event) {
    const id = event.currentTarget.dataset.id;
    const quote = this.data.quotes.find((item) => item.id === id);
    wx.showModal({
      title: "删除报价",
      content: `确认删除“${quote?.projectName || quote?.title || "未命名报价"}”？`,
      confirmColor: "#9a352d",
      success: async (result) => {
        if (!result.confirm) return;
        try {
          await api.deleteQuote(id);
          await this.load();
          wx.showToast({ title: "已删除", icon: "success" });
        } catch (error) {
          wx.showToast({ title: error.message, icon: "none" });
        }
      },
    });
  },
  goHome() {
    wx.reLaunch({ url: "/pages/home/home" });
  },
  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  },
});
