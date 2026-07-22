const api = require("./utils/api");

App({
  globalData: { user: null, mode: api.mode() },
  onLaunch() {
    api.leaveLocalMode();
    this.globalData.mode = api.mode();
    const token = wx.getStorageSync("woodallDealerToken");
    if (token) api.setToken(token);
  },
});
