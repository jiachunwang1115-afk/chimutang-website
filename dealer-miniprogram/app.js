const api = require("./utils/api");

App({
  globalData: { user: null },
  onLaunch() {
    const token = wx.getStorageSync("woodallDealerToken");
    if (token) api.setToken(token);
  },
});
