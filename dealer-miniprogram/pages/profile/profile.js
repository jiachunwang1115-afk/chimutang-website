const api = require("../../utils/api");
const quoteUtil = require("../../utils/quote");

Page({
  data: { user: {} },
  async onShow() {
    try { const result = await api.session(); this.setData({ user: result.user }); }
    catch { wx.reLaunch({ url: "/pages/login/login" }); }
  },
  async logout() { await api.logout(); getApp().globalData.user = null; wx.reLaunch({ url: "/pages/login/login" }); },
  goHome() { wx.reLaunch({ url: "/pages/home/home" }); },
  goHistory() { wx.navigateTo({ url: "/pages/history/history" }); },
  newQuote() { wx.setStorageSync("woodallEditQuote", quoteUtil.createDraft()); wx.navigateTo({ url: "/pages/quote/quote" }); },
});
