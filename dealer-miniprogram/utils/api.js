const BASE_URL = "https://www.woodall.design/api/dealer";
let sessionToken = "";

function setToken(token) {
  sessionToken = token || "";
  if (sessionToken) wx.setStorageSync("woodallDealerToken", sessionToken);
  else wx.removeStorageSync("woodallDealerToken");
}

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method: options.method || "GET",
      data: options.data,
      header: {
        "content-type": "application/json",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }
        const error = new Error(response.data?.error?.message || "服务暂时不可用");
        error.code = response.data?.error?.code || "REQUEST_FAILED";
        error.status = response.statusCode;
        if (response.statusCode === 401) setToken("");
        reject(error);
      },
      fail(error) { reject(new Error(error.errMsg || "网络连接失败")); },
    });
  });
}

async function login(username, password) {
  const result = await request("/auth/login", { method: "POST", data: { username, password, client: "miniprogram" } });
  setToken(result.sessionToken);
  return result;
}

function logout() {
  return request("/auth/logout", { method: "POST", data: {} }).catch(() => null).then(() => setToken(""));
}

module.exports = {
  setToken,
  request,
  login,
  logout,
  session: () => request("/auth/session"),
  changePassword: (currentPassword, nextPassword) => request("/auth/change-password", { method: "POST", data: { currentPassword, nextPassword } }),
  listQuotes: () => request("/quotes"),
  saveQuote: (draft) => request(`/quotes/${encodeURIComponent(draft.id)}`, { method: "PUT", data: { draft } }),
  deleteQuote: (id) => request(`/quotes/${encodeURIComponent(id)}`, { method: "DELETE", data: {} }),
};
