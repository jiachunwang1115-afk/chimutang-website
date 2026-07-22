const quoteUtil = require("./quote");

const BASE_URL = "https://www.woodall.design/api/dealer";
const TOKEN_KEY = "woodallDealerToken";
const MODE_KEY = "woodallDealerMode";
const LOCAL_QUOTES_KEY = "woodallMiniQuotesV1";
const LOCAL_MODE = "local";
const LOCAL_USER = {
  id: "local-preview",
  username: "local_preview",
  displayName: "本机体验",
  role: "dealer",
  mustChangePassword: false,
  localOnly: true,
};

let sessionToken = "";
let currentMode = wx.getStorageSync(MODE_KEY) === LOCAL_MODE ? LOCAL_MODE : "cloud";

function setToken(token) {
  sessionToken = token || "";
  if (sessionToken) wx.setStorageSync(TOKEN_KEY, sessionToken);
  else wx.removeStorageSync(TOKEN_KEY);
}

function setMode(mode) {
  currentMode = mode === LOCAL_MODE ? LOCAL_MODE : "cloud";
  if (currentMode === LOCAL_MODE) wx.setStorageSync(MODE_KEY, LOCAL_MODE);
  else wx.removeStorageSync(MODE_KEY);
}

function mode() {
  return currentMode;
}

function cloudRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${path}`,
      method: options.method || "GET",
      data: options.data,
      timeout: 10000,
      header: {
        "content-type": "application/json",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300 && response.data && typeof response.data === "object") {
          resolve(response.data);
          return;
        }
        const unavailable = response.statusCode >= 500 || typeof response.data !== "object";
        const error = new Error(unavailable ? "总部账号服务尚未开放" : (response.data?.error?.message || "服务暂时不可用"));
        error.code = unavailable ? "API_UNAVAILABLE" : (response.data?.error?.code || "REQUEST_FAILED");
        error.status = unavailable ? 503 : response.statusCode;
        if (response.statusCode === 401) setToken("");
        reject(error);
      },
      fail(error) {
        const requestError = new Error(error.errMsg || "网络连接失败");
        requestError.code = "NETWORK_ERROR";
        requestError.status = 503;
        reject(requestError);
      },
    });
  });
}

function readLocalQuotes() {
  try {
    const value = wx.getStorageSync(LOCAL_QUOTES_KEY);
    const parsed = Array.isArray(value) ? value : [];
    return parsed.map(quoteUtil.migrateDraft).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  } catch {
    return [];
  }
}

function writeLocalQuotes(quotes) {
  wx.setStorageSync(LOCAL_QUOTES_KEY, quotes.slice(0, 100));
}

function quoteSummary(draft) {
  const totals = quoteUtil.calculate(draft);
  return {
    id: draft.id,
    title: draft.title,
    projectName: draft.project.name,
    city: draft.project.city,
    dealerName: LOCAL_USER.displayName,
    totalNetArea: totals.totalNetArea,
    totalBillableArea: totals.totalBillableArea,
    totalCents: totals.totalCents,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    draft,
  };
}

function leaveLocalMode() {
  setMode("cloud");
}

async function login(username, password) {
  setMode("cloud");
  const result = await cloudRequest("/auth/login", { method: "POST", data: { username, password, client: "miniprogram" } });
  if (!result.user || !result.sessionToken) {
    const error = new Error("账号服务返回异常，请稍后再试");
    error.code = "INVALID_RESPONSE";
    error.status = 503;
    throw error;
  }
  setToken(result.sessionToken);
  return result;
}

function session() {
  if (currentMode === LOCAL_MODE) return Promise.resolve({ user: LOCAL_USER, mode: LOCAL_MODE });
  return cloudRequest("/auth/session");
}

function logout() {
  if (currentMode === LOCAL_MODE) {
    leaveLocalMode();
    setToken("");
    return Promise.resolve();
  }
  return cloudRequest("/auth/logout", { method: "POST", data: {} }).catch(() => null).then(() => setToken(""));
}

function listQuotes() {
  if (currentMode === LOCAL_MODE) return Promise.resolve({ quotes: readLocalQuotes().map(quoteSummary), mode: LOCAL_MODE });
  return cloudRequest("/quotes");
}

function saveQuote(draft) {
  if (currentMode === LOCAL_MODE) {
    const normalized = quoteUtil.migrateDraft({ ...draft, updatedAt: new Date().toISOString() });
    const quotes = readLocalQuotes().filter((item) => item.id !== normalized.id);
    quotes.unshift(normalized);
    writeLocalQuotes(quotes);
    return Promise.resolve({ quote: quoteSummary(normalized), mode: LOCAL_MODE });
  }
  return cloudRequest(`/quotes/${encodeURIComponent(draft.id)}`, { method: "PUT", data: { draft } });
}

function deleteQuote(id) {
  if (currentMode === LOCAL_MODE) {
    writeLocalQuotes(readLocalQuotes().filter((draft) => draft.id !== id));
    return Promise.resolve({ ok: true, mode: LOCAL_MODE });
  }
  return cloudRequest(`/quotes/${encodeURIComponent(id)}`, { method: "DELETE", data: {} });
}

module.exports = {
  BASE_URL,
  LOCAL_MODE,
  deleteQuote,
  leaveLocalMode,
  listQuotes,
  login,
  logout,
  mode,
  request: cloudRequest,
  saveQuote,
  session,
  setToken,
  changePassword: (currentPassword, nextPassword) => cloudRequest("/auth/change-password", { method: "POST", data: { currentPassword, nextPassword } }),
};
