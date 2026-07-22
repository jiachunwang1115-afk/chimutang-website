import { DealerCloudClient } from "./dealer-cloud.mjs?v=20260722-2";

const api = new DealerCloudClient();
const refs = {
  authShell: document.getElementById("authShell"),
  loginForm: document.getElementById("loginForm"),
  passwordForm: document.getElementById("passwordForm"),
  authMessage: document.getElementById("authMessage"),
  accountName: document.getElementById("accountName"),
  logout: document.getElementById("logoutButton"),
  tabs: [...document.querySelectorAll("[data-view]")],
  quotesView: document.getElementById("quotesView"),
  usersView: document.getElementById("usersView"),
  quoteSearch: document.getElementById("quoteSearch"),
  quoteBody: document.getElementById("quoteTableBody"),
  quoteEmpty: document.getElementById("quoteEmpty"),
  userBody: document.getElementById("userTableBody"),
  createUser: document.getElementById("createUserForm"),
  activeUsers: document.getElementById("activeUserMetric"),
  quoteMetric: document.getElementById("quoteMetric"),
  amountMetric: document.getElementById("amountMetric"),
  latestMetric: document.getElementById("latestMetric"),
  credentialDialog: document.getElementById("credentialDialog"),
  credentialUsername: document.getElementById("credentialUsername"),
  credentialPassword: document.getElementById("credentialPassword"),
  copyCredential: document.getElementById("copyCredentialButton"),
  quoteDialog: document.getElementById("quoteDialog"),
  quoteDetail: document.getElementById("quoteDetail"),
  toast: document.getElementById("toast"),
};

let currentUser = null;
let users = [];
let quotes = [];
let toastTimer = null;

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
const money = (cents) => new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(Number(cents || 0) / 100);
const shortDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};

function showToast(message) {
  clearTimeout(toastTimer);
  refs.toast.textContent = message;
  refs.toast.hidden = false;
  toastTimer = setTimeout(() => { refs.toast.hidden = true; }, 3000);
}

function showAuth(mode, message = "") {
  refs.loginForm.hidden = mode !== "login";
  refs.passwordForm.hidden = mode !== "password";
  refs.authMessage.textContent = message;
  requestAnimationFrame(() => (mode === "password" ? refs.passwordForm.elements.currentPassword : refs.loginForm.elements.username)?.focus());
}

function completeAuth(user) {
  if (user.role !== "admin") {
    location.replace("dealer-quote.html");
    return;
  }
  currentUser = user;
  refs.accountName.textContent = user.displayName;
  refs.authShell.hidden = true;
  document.body.classList.remove("auth-pending");
  loadDashboard();
}

function bindAuth() {
  let lastPassword = "";
  refs.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = refs.loginForm.querySelector("button[type='submit']");
    button.disabled = true;
    refs.authMessage.textContent = "正在验证账号…";
    try {
      const username = refs.loginForm.elements.username.value.trim();
      const password = refs.loginForm.elements.password.value;
      const result = await api.login(username, password);
      lastPassword = password;
      refs.loginForm.elements.password.value = "";
      if (result.user.mustChangePassword) {
        refs.passwordForm.elements.currentPassword.value = password;
        showAuth("password");
      } else completeAuth(result.user);
    } catch (error) {
      refs.authMessage.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  refs.passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const next = refs.passwordForm.elements.nextPassword.value;
    const confirm = refs.passwordForm.elements.confirmPassword.value;
    if (next !== confirm) {
      refs.authMessage.textContent = "两次输入的新密码不一致";
      return;
    }
    const button = refs.passwordForm.querySelector("button[type='submit']");
    button.disabled = true;
    try {
      const current = refs.passwordForm.elements.currentPassword.value || lastPassword;
      const result = await api.changePassword(current, next);
      completeAuth(result.user);
    } catch (error) {
      refs.authMessage.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

function renderMetrics() {
  refs.activeUsers.textContent = String(users.filter((user) => user.active && user.role === "dealer").length);
  refs.quoteMetric.textContent = String(quotes.length);
  refs.amountMetric.textContent = money(quotes.reduce((sum, quote) => sum + Number(quote.totalCents || 0), 0));
  refs.latestMetric.textContent = quotes[0] ? shortDate(quotes[0].updatedAt) : "—";
}

function renderUsers() {
  refs.userBody.innerHTML = users.map((user) => `
    <tr data-user-id="${escapeHtml(user.id)}">
      <td><strong>${escapeHtml(user.displayName)}</strong><small>${user.mustChangePassword ? "等待首次修改密码" : "已完成密码设置"}</small></td>
      <td>${escapeHtml(user.username)}</td>
      <td>${user.role === "admin" ? "总部管理员" : "经销商"}</td>
      <td><span class="status-label${user.active ? "" : " is-disabled"}">${user.active ? "使用中" : "已停用"}</span></td>
      <td>${escapeHtml(shortDate(user.lastLoginAt))}</td>
      <td><div class="row-actions"><button type="button" data-user-action="reset">重置密码</button><button class="${user.active ? "is-danger" : ""}" type="button" data-user-action="toggle">${user.active ? "停用" : "启用"}</button></div></td>
    </tr>`).join("");
}

function filteredQuotes() {
  const query = refs.quoteSearch.value.trim().toLowerCase();
  if (!query) return quotes;
  return quotes.filter((quote) => [quote.dealerName, quote.projectName, quote.city, quote.title].some((value) => String(value || "").toLowerCase().includes(query)));
}

function renderQuotes() {
  const visible = filteredQuotes();
  refs.quoteEmpty.hidden = visible.length > 0;
  refs.quoteBody.innerHTML = visible.map((quote) => `
    <tr data-quote-id="${escapeHtml(quote.id)}">
      <td><strong>${escapeHtml(quote.dealerName)}</strong></td>
      <td><strong>${escapeHtml(quote.projectName || quote.title || "未命名报价")}</strong><small>${escapeHtml(quote.quoteDate || "")}</small></td>
      <td>${escapeHtml(quote.city || "—")}</td>
      <td>${Number(quote.totalBillableArea || 0).toFixed(2)} m²</td>
      <td><strong>${escapeHtml(money(quote.totalCents))}</strong></td>
      <td>${escapeHtml(shortDate(quote.updatedAt))}</td>
    </tr>`).join("");
}

async function loadDashboard() {
  try {
    const [userResult, quoteResult] = await Promise.all([api.listUsers(), api.listAdminQuotes()]);
    users = userResult.users || [];
    quotes = quoteResult.quotes || [];
    renderMetrics();
    renderUsers();
    renderQuotes();
  } catch (error) {
    showToast(error.message);
  }
}

function showCredential(username, password) {
  refs.credentialUsername.textContent = username;
  refs.credentialPassword.textContent = password;
  refs.credentialDialog.showModal();
}

async function openQuote(id) {
  try {
    const { quote } = await api.getAdminQuote(id);
    const lines = quote.draft?.lines || [];
    refs.quoteDetail.innerHTML = `
      <span class="eyebrow">QUOTATION DETAIL</span>
      <div class="quote-detail-head"><h2>${escapeHtml(quote.projectName || quote.title)}</h2><strong class="quote-detail-total">${escapeHtml(money(quote.totalCents))}</strong></div>
      <div class="quote-detail-meta"><span>经销商：${escapeHtml(quote.dealerName)}</span><span>城市：${escapeHtml(quote.city || "—")}</span><span>报价日期：${escapeHtml(quote.quoteDate || "—")}</span><span>更新时间：${escapeHtml(shortDate(quote.updatedAt))}</span></div>
      <table class="detail-lines"><thead><tr><th>空间</th><th>产品型号</th><th>净面积</th><th>损耗</th><th>单价</th></tr></thead><tbody>${lines.map((line) => `<tr><td>${escapeHtml(line.room)}</td><td>${escapeHtml(line.productCode)}</td><td>${Number(line.netArea || 0).toFixed(2)} m²</td><td>${Number(line.wasteRate || 0)}%</td><td>¥${Number(line.unitPrice || 0).toFixed(2)}</td></tr>`).join("")}</tbody></table>`;
    refs.quoteDialog.showModal();
  } catch (error) {
    showToast(error.message);
  }
}

function bindDashboard() {
  refs.tabs.forEach((tab) => tab.addEventListener("click", () => {
    refs.tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    refs.quotesView.hidden = tab.dataset.view !== "quotes";
    refs.usersView.hidden = tab.dataset.view !== "users";
  }));
  refs.quoteSearch.addEventListener("input", renderQuotes);
  refs.quoteBody.addEventListener("click", (event) => {
    const row = event.target.closest("[data-quote-id]");
    if (row) openQuote(row.dataset.quoteId);
  });
  refs.createUser.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = refs.createUser.querySelector("button[type='submit']");
    button.disabled = true;
    try {
      const result = await api.createUser({
        displayName: refs.createUser.elements.displayName.value,
        username: refs.createUser.elements.username.value,
        role: refs.createUser.elements.role.value,
      });
      refs.createUser.reset();
      showCredential(result.user.username, result.temporaryPassword);
      await loadDashboard();
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
    }
  });
  refs.userBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-user-action]");
    if (!button) return;
    const id = button.closest("[data-user-id]").dataset.userId;
    const user = users.find((item) => item.id === id);
    if (!user) return;
    button.disabled = true;
    try {
      if (button.dataset.userAction === "reset") {
        const result = await api.updateUser(id, { action: "reset_password" });
        showCredential(user.username, result.temporaryPassword);
      } else {
        await api.updateUser(id, { action: "set_active", active: !user.active });
        showToast(`${user.displayName}已${user.active ? "停用" : "启用"}`);
      }
      await loadDashboard();
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
    }
  });
  refs.copyCredential.addEventListener("click", async () => {
    const text = `痴木堂经销商账号\n账号：${refs.credentialUsername.textContent}\n临时密码：${refs.credentialPassword.textContent}\n登录地址：https://www.woodall.design/dealer-quote`;
    await navigator.clipboard.writeText(text);
    showToast("登录信息已复制");
  });
  refs.logout.addEventListener("click", async () => {
    await api.logout().catch(() => null);
    location.reload();
  });
}

async function init() {
  bindAuth();
  bindDashboard();
  try {
    const result = await api.session();
    if (result.user.mustChangePassword) showAuth("password");
    else completeAuth(result.user);
  } catch (error) {
    showAuth("login", error.status === 503 ? "系统正在初始化，请稍后刷新页面" : "");
  }
}

init();
