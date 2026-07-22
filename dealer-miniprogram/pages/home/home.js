const api = require("../../utils/api");
const quoteUtil = require("../../utils/quote");

const amount = (cents) => `¥${(Number(cents || 0) / 100).toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const dateText = (value) => value ? value.slice(5, 10).replace("-", "/") : "—";

Page({
  data: {
    user: {},
    greeting: "今日好",
    quotes: [],
    quoteCount: 0,
    totalAmount: "¥0",
    totalArea: "0.00",
    localMode: false,
    statusText: "正在连接",
    loading: true,
  },
  onShow() {
    this.load();
  },
  async load() {
    this.setData({ loading: true });
    try {
      const [session, result] = await Promise.all([api.session(), api.listQuotes()]);
      const allQuotes = result.quotes || [];
      const list = allQuotes.slice(0, 5).map((item) => ({
        ...item,
        amountText: amount(item.totalCents),
        dateText: dateText(item.updatedAt),
      }));
      const localMode = api.mode() === api.LOCAL_MODE;
      this.setData({
        user: session.user,
        greeting: session.user.localOnly ? "开始一份新报价" : `${session.user.displayName}，你好`,
        quotes: list,
        quoteCount: allQuotes.length,
        totalAmount: amount(allQuotes.reduce((sum, item) => sum + Number(item.totalCents || 0), 0)),
        totalArea: allQuotes.reduce((sum, item) => sum + Number(item.totalBillableArea || 0), 0).toFixed(2),
        localMode,
        statusText: localMode ? "本机体验" : "已连接总部",
      });
    } catch (error) {
      if (error.status === 401) wx.reLaunch({ url: "/pages/login/login" });
      else wx.showToast({ title: error.message, icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },
  newQuote() {
    wx.setStorageSync("woodallEditQuote", quoteUtil.createDraft());
    wx.navigateTo({ url: "/pages/quote/quote" });
  },
  editQuote(event) {
    wx.navigateTo({ url: `/pages/quote/quote?id=${encodeURIComponent(event.currentTarget.dataset.id)}` });
  },
  goHistory() {
    wx.navigateTo({ url: "/pages/history/history" });
  },
  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  },
});
