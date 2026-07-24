import { calculateQuote, createDraft, validateDraft, MAX_QUOTE_LINES, migrateDraft } from "./quote-core.mjs";
import { DraftRepository } from "./quote-drafts.mjs";
import { generatePdf, generatePptx } from "./quote-ppt.mjs?v=20260724-1";
import { DealerCloudClient } from "./dealer-cloud.mjs?v=20260722-2";

const refs = {
  form: document.getElementById("quoteForm"),
  lines: document.getElementById("quoteLines"),
  history: document.getElementById("historyList"),
  historyPanel: document.getElementById("historyPanel"),
  historyToggle: document.getElementById("historyToggleButton"),
  popover: document.getElementById("productPopover"),
  saveState: document.getElementById("saveState"),
  totalNetArea: document.getElementById("totalNetArea"),
  totalBillableArea: document.getElementById("totalBillableArea"),
  breakdown: document.getElementById("summaryBreakdown"),
  grandTotal: document.getElementById("grandTotal"),
  taxSummary: document.getElementById("taxSummary"),
  validation: document.getElementById("validationSummary"),
  status: document.getElementById("generationStatus"),
  toast: document.getElementById("toast"),
  addLine: document.getElementById("addLineButton"),
  generate: document.getElementById("generateButton"),
  generatePdf: document.getElementById("generatePdfButton"),
  summaryGenerate: document.getElementById("summaryGenerateButton"),
  summaryGeneratePdf: document.getElementById("summaryGeneratePdfButton"),
  mobileGenerate: document.getElementById("mobileGenerateButton"),
  mobileGeneratePdf: document.getElementById("mobileGeneratePdfButton"),
  mobileGrandTotal: document.getElementById("mobileGrandTotal"),
  mobileTotalLabel: document.getElementById("mobileTotalLabel"),
  discountSuffix: document.getElementById("discountSuffix"),
  newDraft: document.getElementById("newDraftButton"),
  duplicateDraft: document.getElementById("duplicateDraftButton"),
  renameDraft: document.getElementById("renameDraftButton"),
  deleteDraft: document.getElementById("deleteDraftButton"),
  authShell: document.getElementById("authShell"),
  loginForm: document.getElementById("loginForm"),
  passwordForm: document.getElementById("passwordForm"),
  authMessage: document.getElementById("authMessage"),
  accountActions: document.getElementById("accountActions"),
  accountName: document.getElementById("accountName"),
  adminLink: document.getElementById("adminLink"),
  logout: document.getElementById("logoutButton"),
  privacyTitle: document.getElementById("privacyTitle"),
  privacyText: document.getElementById("privacyText"),
};

const cloud = new DealerCloudClient();
const mobileMedia = window.matchMedia("(max-width: 760px)");
const numberFields = new Set([
  "fees.accessoryUnitPrice", "fees.installationUnitPrice", "fees.transportAmount", "fees.otherAmount",
  "discount.value", "tax.rate",
]);
let catalog = [];
let content = null;
let catalogByCode = new Map();
let draft = null;
let saveTimer = null;
let toastTimer = null;
let activePicker = null;
let pickerResults = [];
let pickerIndex = 0;
let repository = null;
let currentUser = null;
let cloudSaveTimer = null;
let cloudReady = false;
let localOnlyMode = false;

const blankLine = () => ({ room: "", productCode: "", netArea: "", wasteRate: 5, unitPrice: "", note: "" });
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
const money = (cents) => new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 2 }).format(cents / 100);
const shortSeries = (series) => String(series || "").split("（")[0];
const downloadButtons = () => [refs.generate, refs.generatePdf, refs.summaryGenerate, refs.summaryGeneratePdf, refs.mobileGenerate, refs.mobileGeneratePdf];

function setHistoryExpanded(expanded) {
  refs.historyPanel.classList.toggle("is-collapsed", !expanded);
  refs.historyToggle.setAttribute("aria-expanded", String(expanded));
  refs.historyToggle.textContent = expanded ? "收起" : "展开";
}

function finishMobileNavigation() {
  if (!mobileMedia.matches) return;
  setHistoryExpanded(false);
  refs.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateEditingState() {
  const control = document.activeElement;
  const editing = mobileMedia.matches && control?.matches("input, textarea, select");
  document.body.classList.toggle("is-editing", Boolean(editing));
}

function setPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  parts.slice(0, -1).forEach((part) => {
    if (!cursor[part] || typeof cursor[part] !== "object") cursor[part] = {};
    cursor = cursor[part];
  });
  cursor[parts.at(-1)] = value;
}

function getPath(target, path) {
  return path.split(".").reduce((value, key) => value?.[key], target);
}

function showToast(message) {
  clearTimeout(toastTimer);
  refs.toast.textContent = message;
  refs.toast.hidden = false;
  toastTimer = setTimeout(() => { refs.toast.hidden = true; }, 3200);
}

function setSaveState(text, saving = false) {
  refs.saveState.classList.toggle("is-saving", saving);
  refs.saveState.lastChild.textContent = text;
}

function setAuthMode(mode, message = "") {
  refs.loginForm.hidden = mode !== "login";
  refs.passwordForm.hidden = mode !== "password";
  refs.authMessage.textContent = message;
  const target = mode === "password"
    ? refs.passwordForm.elements.currentPassword
    : refs.loginForm.elements.username;
  requestAnimationFrame(() => target?.focus());
}

function finishAuthentication(user) {
  currentUser = user;
  repository = new DraftRepository(globalThis.localStorage, user.id);
  const migrationKey = "woodallDealerQuoteLegacyMigratedV1";
  if (!localStorage.getItem(migrationKey) && repository.list().length === 0) {
    const legacy = new DraftRepository(globalThis.localStorage);
    legacy.list().forEach((item) => repository.import(item));
    localStorage.setItem(migrationKey, user.id);
  }
  refs.accountName.textContent = user.displayName;
  refs.accountActions.hidden = false;
  refs.adminLink.hidden = user.role !== "admin";
  refs.authShell.hidden = true;
  document.body.classList.remove("auth-pending");
  document.body.classList.add("auth-ready");
}

function finishLocalMode() {
  localOnlyMode = true;
  currentUser = { id: "local-device", displayName: "本机模式", role: "dealer", mustChangePassword: false };
  repository = new DraftRepository(globalThis.localStorage);
  refs.accountActions.hidden = true;
  refs.privacyTitle.textContent = "本机报价";
  refs.privacyText.textContent = "报价仅保存在当前设备；总部数据服务启用后可继续同步。";
  refs.authShell.hidden = true;
  document.body.classList.remove("auth-pending");
  document.body.classList.add("auth-ready");
}

async function ensureAuthenticated() {
  return new Promise((resolve) => {
    let lastLoginPassword = "";
    const complete = (user) => {
      finishAuthentication(user);
      resolve(user);
    };

    refs.loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = refs.loginForm.querySelector("button[type='submit']");
      const username = refs.loginForm.elements.username.value.trim();
      const password = refs.loginForm.elements.password.value;
      button.disabled = true;
      refs.authMessage.textContent = "正在验证账号…";
      try {
        const result = await cloud.login(username, password);
        lastLoginPassword = password;
        refs.loginForm.elements.password.value = "";
        if (result.user.mustChangePassword) {
          refs.passwordForm.elements.currentPassword.value = password;
          setAuthMode("password");
        } else {
          complete(result.user);
        }
      } catch (error) {
        refs.authMessage.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });

    refs.passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = refs.passwordForm.querySelector("button[type='submit']");
      const currentPassword = refs.passwordForm.elements.currentPassword.value || lastLoginPassword;
      const nextPassword = refs.passwordForm.elements.nextPassword.value;
      const confirmPassword = refs.passwordForm.elements.confirmPassword.value;
      if (nextPassword !== confirmPassword) {
        refs.authMessage.textContent = "两次输入的新密码不一致";
        return;
      }
      button.disabled = true;
      refs.authMessage.textContent = "正在更新密码…";
      try {
        const result = await cloud.changePassword(currentPassword, nextPassword);
        complete(result.user);
      } catch (error) {
        refs.authMessage.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });

    cloud.session().then((result) => {
      if (result.user.mustChangePassword) setAuthMode("password");
      else complete(result.user);
    }).catch((error) => {
      if (error.code === "INVALID_RESPONSE" || error.status >= 500) {
        finishLocalMode();
        resolve(currentUser);
      } else {
        setAuthMode("login");
      }
    });
  });
}

function queueCloudSave(snapshot = draft) {
  if (!cloudReady || !snapshot) return;
  clearTimeout(cloudSaveTimer);
  const payload = structuredClone(snapshot);
  setSaveState("本机已保存，正在同步…", true);
  cloudSaveTimer = setTimeout(async () => {
    try {
      await cloud.saveQuote(payload);
      setSaveState("已同步至总部", false);
    } catch (error) {
      setSaveState("已保存本机，等待同步", false);
      console.error("Quote cloud sync failed", error);
    }
  }, 520);
}

async function hydrateCloudDrafts() {
  if (localOnlyMode) {
    setSaveState("已保存到本机", false);
    return;
  }
  try {
    const result = await cloud.listQuotes();
    for (const item of result.quotes || []) {
      const local = repository.get(item.id);
      if (!local || String(item.updatedAt) > String(local.updatedAt)) repository.import(item.draft);
    }
    cloudReady = true;
    setSaveState("已连接总部", false);
  } catch (error) {
    cloudReady = true;
    setSaveState("仅保存本机", false);
    console.error("Quote cloud hydration failed", error);
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  setSaveState("正在保存…", true);
  saveTimer = setTimeout(saveDraft, 420);
}

function saveDraft() {
  if (!draft) return;
  draft = repository.save(draft);
  setSaveState("已保存到本机", false);
  renderHistory();
  queueCloudSave(draft);
}

function renderHistory() {
  const items = repository.list();
  refs.history.innerHTML = items.length ? items.map((item) => {
    const updated = new Date(item.updatedAt);
    const date = Number.isNaN(updated.getTime()) ? "" : updated.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    const lines = item.lines?.filter((line) => line.productCode).length || 0;
    return `<button class="history-item${item.id === draft.id ? " is-active" : ""}" type="button" data-draft-id="${escapeHtml(item.id)}"><strong>${escapeHtml(item.title || item.project?.name || "未命名报价")}</strong><span>${escapeHtml(date)} · ${lines} 条产品</span></button>`;
  }).join("") : '<div class="product-empty">暂无历史报价</div>';
}

function loadDraft(next) {
  draft = migrateDraft(next);
  if (!draft.lines.length) draft.lines = [blankLine()];
  repository.setActive(draft.id);
  renderForm();
  renderHistory();
  renderSummary();
  clearValidation();
  refs.status.textContent = "";
}

function renderForm() {
  refs.form.querySelectorAll("[name]").forEach((element) => {
    const name = element.name;
    if (name.startsWith("tax.mode")) return;
    const value = getPath(draft, name);
    element.value = value ?? "";
  });
  refs.form.querySelectorAll('input[name="tax.mode"]').forEach((input) => { input.checked = input.value === draft.tax.mode; });
  refs.discountSuffix.textContent = draft.discount.type === "fixed" ? "元" : "%";
  renderLines();
}

function renderLines() {
  refs.lines.innerHTML = draft.lines.map((line, index) => {
    const product = catalogByCode.get(line.productCode);
    const totals = calculateQuote({ ...draft, lines: [line] }).lines[0];
    const productMeta = product
      ? `<span>${escapeHtml(shortSeries(product.series))} · ${escapeHtml(product.wood || "木种待补充")} · ${escapeHtml(product.spec || "规格待补充")}</span>${product.metadata_status === "待确认" ? '<em class="status-badge">资料待确认</em>' : ""}`
      : "<span>输入型号或木种搜索现有 138 款产品</span>";
    return `<div class="quote-line" data-line-index="${index}">
      <div class="line-product">
        <div class="line-field"><label>空间</label><input data-line-field="room" value="${escapeHtml(line.room)}" placeholder="客厅" aria-label="第 ${index + 1} 条空间名称"></div>
        <div class="line-field product-picker"><label>产品型号</label><input class="product-search" data-product-search="${index}" value="${escapeHtml(line.productCode)}" placeholder="搜索型号" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="productPopover"></div>
        <div class="product-meta">${productMeta}</div>
      </div>
      <div class="line-field"><label>净面积（m²）</label><input data-line-field="netArea" type="number" min="0" step="0.01" inputmode="decimal" value="${escapeHtml(line.netArea)}" placeholder="0.00"></div>
      <div class="line-field"><label>损耗率（%）</label><input data-line-field="wasteRate" type="number" min="0" step="0.1" inputmode="decimal" value="${escapeHtml(line.wasteRate)}"></div>
      <div class="line-field"><label>计价面积</label><output class="line-area-output" data-line-area>${totals.billableArea.toFixed(2)} m²</output></div>
      <div class="line-field"><label>单价（元 / m²）</label><input data-line-field="unitPrice" type="number" min="0" step="0.01" inputmode="decimal" value="${escapeHtml(line.unitPrice)}" placeholder="0.00"></div>
      <div class="line-field line-note"><label>选材备注</label><input data-line-field="note" value="${escapeHtml(line.note)}" placeholder="空间搭配或选择理由"></div>
      <div class="line-actions">
        <button type="button" data-line-action="up" aria-label="上移第 ${index + 1} 条" title="上移" ${index === 0 ? "disabled" : ""}>↑</button>
        <button type="button" data-line-action="down" aria-label="下移第 ${index + 1} 条" title="下移" ${index === draft.lines.length - 1 ? "disabled" : ""}>↓</button>
        <button class="remove-line" type="button" data-line-action="remove" aria-label="删除第 ${index + 1} 条" title="删除">×</button>
      </div>
    </div>`;
  }).join("");
  refs.addLine.disabled = draft.lines.length >= MAX_QUOTE_LINES;
  document.getElementById("lineLimit").textContent = `已添加 ${draft.lines.length} / ${MAX_QUOTE_LINES} 条空间 / 产品明细`;
}

function renderSummary() {
  const totals = calculateQuote(draft);
  refs.totalNetArea.textContent = `${totals.totalNetArea.toFixed(2)} m²`;
  refs.totalBillableArea.textContent = `${totals.totalBillableArea.toFixed(2)} m²`;
  const rows = [
    ["地板金额", totals.materialCents, ""],
    ...totals.optionalItems.map((item) => [item.label, item.cents, ""]),
    ...(totals.discountCents ? [["优惠", -totals.discountCents, "is-discount"]] : []),
    [totals.taxMode === "included" ? `含税额（${totals.taxRate}%）` : `税额（${totals.taxRate}%）`, totals.taxCents, ""],
  ];
  refs.breakdown.innerHTML = rows.map(([label, cents, className]) => `<dt class="${className}">${escapeHtml(label)}</dt><dd class="${className}">${cents < 0 ? "-" : ""}${money(Math.abs(cents))}</dd>`).join("");
  refs.grandTotal.textContent = money(totals.totalCents);
  refs.mobileGrandTotal.textContent = money(totals.totalCents);
  refs.taxSummary.textContent = totals.taxMode === "included" ? `输入金额视为含税，税率 ${totals.taxRate}%` : `输入金额未税，另加 ${totals.taxRate}% 税额`;
  draft.lines.forEach((line, index) => {
    const output = refs.lines.querySelector(`[data-line-index="${index}"] [data-line-area]`);
    if (output) output.textContent = `${totals.lines[index].billableArea.toFixed(2)} m²`;
  });
}

function clearValidation() {
  refs.validation.hidden = true;
  refs.validation.textContent = "";
  document.querySelectorAll(".has-error").forEach((element) => element.classList.remove("has-error"));
  document.querySelectorAll(".field-error").forEach((element) => element.remove());
}

function markError(error) {
  const lineMatch = error.path.match(/^lines\.(\d+)\.(.+)$/);
  let holder = null;
  if (lineMatch) {
    const line = refs.lines.querySelector(`[data-line-index="${lineMatch[1]}"]`);
    if (lineMatch[2] === "productCode") holder = line?.querySelector(".product-picker");
    else holder = line?.querySelector(`[data-line-field="${lineMatch[2]}"]`)?.closest(".line-field");
  } else {
    const field = refs.form.querySelector(`[name="${CSS.escape(error.path)}"]`);
    holder = field?.closest(".field");
  }
  if (holder) {
    holder.classList.add("has-error");
    const message = document.createElement("span");
    message.className = "field-error";
    message.textContent = error.message;
    holder.appendChild(message);
  }
  return holder;
}

function showValidation(errors) {
  clearValidation();
  if (!errors.length) return true;
  refs.validation.hidden = false;
  refs.validation.textContent = errors.slice(0, 4).map((error) => error.message).join("；");
  let first = null;
  errors.forEach((error) => { first ||= markError(error); });
  first?.scrollIntoView({ behavior: "smooth", block: "center" });
  first?.querySelector("input, textarea, select")?.focus({ preventScroll: true });
  return false;
}

function updateMainField(event) {
  const element = event.target;
  if (!element.name || element.closest(".quote-line")) return;
  let value = element.type === "radio" ? (element.checked ? element.value : getPath(draft, element.name)) : element.value;
  if (numberFields.has(element.name)) value = value === "" ? 0 : Number(value);
  setPath(draft, element.name, value);
  if (element.name === "project.name" && !draft.customTitle) draft.title = value.trim() || "未命名报价";
  if (element.name === "discount.type") refs.discountSuffix.textContent = value === "fixed" ? "元" : "%";
  renderSummary();
  scheduleSave();
}

function updateLineField(event) {
  const input = event.target.closest("[data-line-field]");
  if (!input) return;
  const index = Number(input.closest(".quote-line").dataset.lineIndex);
  const field = input.dataset.lineField;
  draft.lines[index][field] = input.type === "number" ? (input.value === "" ? "" : Number(input.value)) : input.value;
  renderSummary();
  scheduleSave();
}

function positionPopover(input) {
  const rect = input.getBoundingClientRect();
  if (mobileMedia.matches) {
    const viewport = window.visualViewport;
    const viewportWidth = viewport?.width || window.innerWidth;
    const viewportHeight = viewport?.height || window.innerHeight;
    const offsetLeft = viewport?.offsetLeft || 0;
    const offsetTop = viewport?.offsetTop || 0;
    const width = Math.max(280, viewportWidth - 16);
    const estimatedHeight = Math.min(340, Math.max(144, pickerResults.length * 68));
    const height = Math.min(estimatedHeight, Math.max(144, viewportHeight * .52));
    const left = offsetLeft + Math.max(8, (viewportWidth - width) / 2);
    const top = offsetTop + Math.max(8, viewportHeight - height - 8);
    Object.assign(refs.popover.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, maxHeight: `${height}px` });
    return;
  }
  const width = Math.min(420, window.innerWidth - 24);
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
  const estimatedHeight = Math.min(310, Math.max(80, pickerResults.length * 62));
  const below = window.innerHeight - rect.bottom;
  const top = below > estimatedHeight + 12 ? rect.bottom + 4 : Math.max(12, rect.top - estimatedHeight - 4);
  Object.assign(refs.popover.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, maxHeight: "310px" });
}

function searchProducts(query) {
  const needle = String(query || "").trim().toLowerCase();
  const scored = catalog.map((product) => {
    const code = product.code.toLowerCase();
    const haystack = [product.code, product.model, product.series, product.wood, product.board, product.surface].join(" ").toLowerCase();
    let score = needle ? (code === needle ? 0 : code.startsWith(needle) ? 1 : haystack.includes(needle) ? 2 : 99) : 3;
    return { product, score };
  }).filter((item) => item.score < 99).sort((a, b) => a.score - b.score || a.product.code.localeCompare(b.product.code)).slice(0, 10);
  return scored.map((item) => item.product);
}

function renderProductPopover() {
  if (!activePicker) return;
  pickerResults = searchProducts(activePicker.value);
  pickerIndex = Math.min(pickerIndex, Math.max(0, pickerResults.length - 1));
  refs.popover.innerHTML = pickerResults.length ? pickerResults.map((product, index) => {
    const image = product.img_e_thumb || product.img_b_thumb || product.img_a_thumb || "media/brand-story-wood-ring-lite.webp";
    return `<button class="product-option${index === pickerIndex ? " is-active" : ""}" type="button" role="option" aria-selected="${index === pickerIndex}" data-product-code="${escapeHtml(product.code)}"><img src="${escapeHtml(image)}" alt="" loading="lazy"><span><strong>${escapeHtml(product.code)} · ${escapeHtml(product.wood || "原木地板")}</strong><span>${escapeHtml(shortSeries(product.series))} · ${escapeHtml(product.structure || "结构待补充")} · ${escapeHtml(product.spec || "规格待补充")}</span></span><small>${escapeHtml(product.metadata_status || "资料待确认")}</small></button>`;
  }).join("") : '<div class="product-empty">没有匹配的现有产品</div>';
  refs.popover.hidden = false;
  activePicker.setAttribute("aria-expanded", "true");
  positionPopover(activePicker);
}

function openPicker(input) {
  if (activePicker && activePicker !== input) activePicker.setAttribute("aria-expanded", "false");
  activePicker = input;
  pickerIndex = 0;
  renderProductPopover();
}

function closePicker() {
  if (activePicker) activePicker.setAttribute("aria-expanded", "false");
  activePicker = null;
  refs.popover.hidden = true;
}

function selectProduct(code) {
  if (!activePicker) return;
  const index = Number(activePicker.dataset.productSearch);
  draft.lines[index].productCode = code;
  closePicker();
  renderLines();
  renderSummary();
  scheduleSave();
  refs.lines.querySelector(`[data-line-index="${index}"] [data-product-search]`)?.focus();
}

async function generate(kind = "pptx") {
  saveDraft();
  const errors = validateDraft(draft, catalog);
  if (!showValidation(errors)) {
    refs.status.textContent = "请先补全标出的字段，草稿已保留。";
    refs.status.classList.add("is-error");
    return;
  }
  const buttons = downloadButtons();
  buttons.forEach((button) => { button.disabled = true; });
  refs.status.classList.remove("is-error");
  refs.status.textContent = `正在整理真实产品图片与${kind === "pdf" ? "客户版 PDF" : "可编辑 PPT"}…`;
  refs.mobileTotalLabel.textContent = `正在生成 ${kind === "pdf" ? "PDF" : "PPT"}…`;
  try {
    const result = kind === "pdf"
      ? await generatePdf({ draft, catalog, content })
      : await generatePptx({ draft, catalog, content });
    refs.status.textContent = `已生成 ${result.slideCount} 页${kind === "pdf" ? "客户版 PDF" : "可编辑 PPT"}，报价已保存并同步。`;
    showToast(`${result.filename} 已开始下载`);
  } catch (error) {
    console.error(error);
    refs.status.textContent = `生成失败：${error?.message || "请检查网络后重试"}。草稿已保留。`;
    refs.status.classList.add("is-error");
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
    refs.mobileTotalLabel.textContent = "报价总额";
  }
}

function bindEvents() {
  refs.form.addEventListener("input", (event) => {
    if (event.target.matches("[data-line-field]")) updateLineField(event);
    else if (!event.target.matches("[data-product-search]")) updateMainField(event);
  });
  refs.form.addEventListener("change", (event) => {
    if (event.target.name && !event.target.closest(".quote-line")) updateMainField(event);
  });
  refs.lines.addEventListener("focusin", (event) => {
    if (event.target.matches("[data-product-search]")) openPicker(event.target);
  });
  refs.lines.addEventListener("input", (event) => {
    if (!event.target.matches("[data-product-search]")) return;
    const exact = catalogByCode.get(event.target.value.trim().toUpperCase());
    const index = Number(event.target.dataset.productSearch);
    draft.lines[index].productCode = exact?.code || "";
    pickerIndex = 0;
    openPicker(event.target);
    scheduleSave();
  });
  refs.lines.addEventListener("keydown", (event) => {
    if (!event.target.matches("[data-product-search]")) return;
    if (event.key === "ArrowDown") { event.preventDefault(); pickerIndex = Math.min(pickerResults.length - 1, pickerIndex + 1); renderProductPopover(); }
    if (event.key === "ArrowUp") { event.preventDefault(); pickerIndex = Math.max(0, pickerIndex - 1); renderProductPopover(); }
    if (event.key === "Enter" && pickerResults[pickerIndex]) { event.preventDefault(); selectProduct(pickerResults[pickerIndex].code); }
    if (event.key === "Escape") closePicker();
  });
  refs.lines.addEventListener("click", (event) => {
    const button = event.target.closest("[data-line-action]");
    if (!button) return;
    const index = Number(button.closest(".quote-line").dataset.lineIndex);
    const action = button.dataset.lineAction;
    if (action === "remove") draft.lines.splice(index, 1);
    if (action === "up" && index > 0) [draft.lines[index - 1], draft.lines[index]] = [draft.lines[index], draft.lines[index - 1]];
    if (action === "down" && index < draft.lines.length - 1) [draft.lines[index + 1], draft.lines[index]] = [draft.lines[index], draft.lines[index + 1]];
    if (!draft.lines.length) draft.lines.push(blankLine());
    renderLines(); renderSummary(); scheduleSave();
  });
  refs.popover.addEventListener("pointerdown", (event) => {
    const option = event.target.closest("[data-product-code]");
    if (option) { event.preventDefault(); selectProduct(option.dataset.productCode); }
  });
  document.addEventListener("pointerdown", (event) => {
    if (activePicker && !refs.popover.contains(event.target) && event.target !== activePicker) closePicker();
  });
  window.addEventListener("resize", () => { if (activePicker) positionPopover(activePicker); });
  window.addEventListener("scroll", () => { if (activePicker) positionPopover(activePicker); }, true);
  window.visualViewport?.addEventListener("resize", () => { if (activePicker) positionPopover(activePicker); });
  window.visualViewport?.addEventListener("scroll", () => { if (activePicker) positionPopover(activePicker); });
  document.addEventListener("focusin", updateEditingState);
  document.addEventListener("focusout", () => requestAnimationFrame(updateEditingState));
  refs.addLine.addEventListener("click", () => {
    if (draft.lines.length >= MAX_QUOTE_LINES) return;
    draft.lines.push(blankLine()); renderLines(); renderSummary(); scheduleSave();
    refs.lines.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  [refs.generate, refs.summaryGenerate].forEach((button) => button.addEventListener("click", () => generate("pptx")));
  [refs.generatePdf, refs.summaryGeneratePdf].forEach((button) => button.addEventListener("click", () => generate("pdf")));
  refs.mobileGenerate.addEventListener("click", () => generate("pptx"));
  refs.mobileGeneratePdf.addEventListener("click", () => generate("pdf"));
  refs.historyToggle.addEventListener("click", () => setHistoryExpanded(refs.historyToggle.getAttribute("aria-expanded") !== "true"));
  refs.history.addEventListener("click", (event) => {
    const item = event.target.closest("[data-draft-id]");
    if (item) { saveDraft(); loadDraft(repository.get(item.dataset.draftId)); finishMobileNavigation(); }
  });
  refs.newDraft.addEventListener("click", () => { saveDraft(); loadDraft(repository.create({ lines: [blankLine()] })); finishMobileNavigation(); });
  refs.duplicateDraft.addEventListener("click", () => { const copy = repository.duplicate(draft.id); if (copy) { loadDraft(copy); showToast("已复制为新报价"); } });
  refs.renameDraft.addEventListener("click", () => {
    const title = window.prompt("报价名称", draft.title || draft.project.name || "未命名报价");
    if (title !== null) loadDraft(repository.rename(draft.id, title));
  });
  refs.deleteDraft.addEventListener("click", () => {
    if (!window.confirm(`删除“${draft.title || draft.project.name || "未命名报价"}”？此操作只影响当前设备。`)) return;
    const deletedId = draft.id;
    const remaining = repository.delete(deletedId);
    cloud.deleteQuote(deletedId).catch((error) => console.error("Cloud quote deletion failed", error));
    loadDraft(remaining[0] || repository.create({ lines: [blankLine()] }));
    showToast("报价已从本机删除");
  });
  window.addEventListener("beforeunload", saveDraft);
  refs.logout.addEventListener("click", async () => {
    saveDraft();
    await cloud.logout().catch(() => null);
    location.reload();
  });
  mobileMedia.addEventListener("change", (event) => {
    setHistoryExpanded(!event.matches);
    updateEditingState();
  });
}

async function init() {
  try {
    await ensureAuthenticated();
    const [catalogResponse, contentResponse] = await Promise.all([
      fetch("products_clean.json", { cache: "force-cache" }),
      fetch("quote-content.json", { cache: "no-cache" }),
    ]);
    if (!catalogResponse.ok || !contentResponse.ok) throw new Error("产品或品牌内容加载失败");
    [catalog, content] = await Promise.all([catalogResponse.json(), contentResponse.json()]);
    catalogByCode = new Map(catalog.map((product) => [product.code, product]));
    await hydrateCloudDrafts();
    const drafts = repository.list();
    const active = repository.get(repository.active());
    loadDraft(active || drafts[0] || repository.create({ lines: [blankLine()] }));
    setHistoryExpanded(!mobileMedia.matches);
    bindEvents();
    window.woodallQuoteApp = { getDraft: () => structuredClone(draft), calculate: () => calculateQuote(draft), generatePptx: () => generate("pptx"), generatePdf: () => generate("pdf"), catalog, content };
  } catch (error) {
    refs.status.textContent = `工作台加载失败：${error.message}。请刷新页面重试。`;
    refs.status.classList.add("is-error");
    downloadButtons().forEach((button) => { button.disabled = true; });
  }
}

init();
