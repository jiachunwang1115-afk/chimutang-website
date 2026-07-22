const api = require("../../utils/api");
const quoteUtil = require("../../utils/quote");
const amount = (cents) => `¥${(Number(cents || 0) / 100).toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;

Page({
  data: { quotes: [], visibleQuotes: [], query: "" },
  onShow() { this.load(); },
  async load() {
    try {
      const result = await api.listQuotes();
      const quotes = (result.quotes || []).map((item) => ({ ...item, amountText: amount(item.totalCents), dateText: (item.updatedAt || "").slice(0, 10) }));
      this.setData({ quotes, visibleQuotes: quotes });
    } catch (error) { if (error.status === 401) wx.reLaunch({ url: "/pages/login/login" }); }
  },
  search(event) {
    const query = event.detail.value.trim().toLowerCase();
    this.setData({ query, visibleQuotes: this.data.quotes.filter((item) => !query || [item.projectName, item.city, item.title].some((value) => String(value || "").toLowerCase().includes(query))) });
  },
  open(event) { wx.navigateTo({ url: `/pages/quote/quote?id=${encodeURIComponent(event.currentTarget.dataset.id)}` }); },
  create() { wx.setStorageSync("woodallEditQuote", quoteUtil.createDraft()); wx.navigateTo({ url: "/pages/quote/quote" }); },
  goHome() { wx.reLaunch({ url: "/pages/home/home" }); },
  goProfile() { wx.navigateTo({ url: "/pages/profile/profile" }); },
});
