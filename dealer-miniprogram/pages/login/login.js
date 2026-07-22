const api = require("../../utils/api");

Page({
  data: { mode: "login", username: "", password: "", currentPassword: "", nextPassword: "", confirmPassword: "", submitting: false, message: "" },
  onLoad() {
    api.session().then((result) => {
      if (result.user.mustChangePassword) this.setData({ mode: "password" });
      else this.enter(result.user);
    }).catch(() => null);
  },
  onInput(event) { this.setData({ [event.currentTarget.dataset.field]: event.detail.value }); },
  async login() {
    if (!this.data.username || !this.data.password) { this.setData({ message: "请输入账号和密码" }); return; }
    this.setData({ submitting: true, message: "" });
    try {
      const result = await api.login(this.data.username.trim(), this.data.password);
      if (result.user.mustChangePassword) this.setData({ mode: "password", currentPassword: this.data.password, password: "" });
      else this.enter(result.user);
    } catch (error) { this.setData({ message: error.message }); }
    finally { this.setData({ submitting: false }); }
  },
  async changePassword() {
    if (this.data.nextPassword.length < 12) { this.setData({ message: "新密码至少需要 12 位" }); return; }
    if (this.data.nextPassword !== this.data.confirmPassword) { this.setData({ message: "两次输入的新密码不一致" }); return; }
    this.setData({ submitting: true, message: "" });
    try {
      const result = await api.changePassword(this.data.currentPassword, this.data.nextPassword);
      this.enter(result.user);
    } catch (error) { this.setData({ message: error.message }); }
    finally { this.setData({ submitting: false }); }
  },
  enter(user) {
    getApp().globalData.user = user;
    wx.reLaunch({ url: "/pages/home/home" });
  },
});
