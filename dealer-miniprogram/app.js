const api = require("./utils/api");

App({
  globalData: { user: null, mode: api.mode() },
  onLaunch() {
    const token = wx.getStorageSync("woodallDealerToken");
    if (token) api.setToken(token);
  },
});
