const api = require("../../utils/api");
const quoteUtil = require("../../utils/quote");

Page({
  data: { user: {}, localMode: false, syncText: "正在连接" },
  async onShow() {
    try {
      const result = await api.session();
      const localMode = api.mode() === api.LOCAL_MODE;
      this.setData({ user: result.user, localMode, syncText: localMode ? "仅保存在当前手机" : "已连接痴木堂总部" });
    } catch {
      wx.reLaunch({ url: "/pages/login/login" });
    }
  },
  async logout() {
    await api.logout();
    getApp().globalData.user = null;
    getApp().globalData.mode = "cloud";
    wx.reLaunch({ url: "/pages/login/login" });
  },
  copyWebsite() {
    wx.setClipboardData({ data: "https://www.woodall.design/dealer-quote.html", success: () => wx.showToast({ title: "网页地址已复制", icon: "success" }) });
  },
  goHome() {
    wx.reLaunch({ url: "/pages/home/home" });
  },
  goHistory() {
    wx.navigateTo({ url: "/pages/history/history" });
  },
  newQuote() {
    wx.setStorageSync("woodallEditQuote", quoteUtil.createDraft());
    wx.navigateTo({ url: "/pages/quote/quote" });
  },
});
