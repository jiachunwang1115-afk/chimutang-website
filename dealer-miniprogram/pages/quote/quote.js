const api = require("../../utils/api");
const quoteUtil = require("../../utils/quote");
const products = require("../../data/products");
const quoteCopy = require("../../data/quote-copy");
const voiceQuote = require("../../utils/voice-quote");

const money = (cents) => `¥${(Number(cents || 0) / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortSeries = (value) => String(value || "").split("（")[0] || "系列待确认";
const productByCode = new Map(products.map((product) => [product.code, product]));
const seriesOptions = ["全部", ...new Set(products.map((product) => shortSeries(product.series)).filter(Boolean))];

function decorateProduct(product) {
  return {
    ...product,
    seriesShort: shortSeries(product.series),
    thumbUrl: product.thumbUrl || "",
    statusText: product.status || "资料待确认",
  };
}

function decorateLine(line) {
  const product = productByCode.get(line.productCode);
  return {
    ...line,
    productName: product ? `${product.code} · ${product.wood || "木种待确认"}` : "请选择产品型号",
    productMeta: product ? `${shortSeries(product.series)} · ${product.spec || product.structure || "规格待确认"}` : "按型号、木种或系列查找",
    productThumb: product?.thumbUrl || "",
    productStatus: product?.status || "",
  };
}

function lineHasContent(line) {
  return Boolean(
    String(line.room || "").trim()
    || String(line.productCode || "").trim()
    || Number(line.netArea) > 0
    || Number(line.unitPrice) > 0
    || String(line.note || "").trim(),
  );
}

function buildVoiceReview(parsed) {
  const projectLabels = {
    name: "客户 / 项目",
    city: "城市",
    address: "项目地址",
    needs: "项目需求",
    advice: "选材建议",
  };
  const feeLabels = {
    accessoryUnitPrice: "辅材单价",
    installationUnitPrice: "安装单价",
    transportAmount: "运输费",
    otherAmount: "其他费用",
    otherLabel: "其他费用说明",
  };
  const projectItems = Object.entries(parsed.project)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({ key: `project-${key}`, label: projectLabels[key], value }));
  const feeItems = Object.entries(parsed.fees)
    .filter(([key, value]) => key === "otherLabel" ? Boolean(value) : value !== "")
    .map(([key, value]) => ({
      key: `fee-${key}`,
      label: feeLabels[key],
      value: key === "otherLabel" ? value : `${value} 元${key.includes("UnitPrice") ? "/m²" : ""}`,
    }));
  if (parsed.discount) {
    feeItems.push({
      key: "discount",
      label: "折扣",
      value: parsed.discount.type === "fixed" ? `${parsed.discount.value} 元` : `${parsed.discount.value}%`,
    });
  }
  if (parsed.tax) {
    feeItems.push({
      key: "tax",
      label: "税费",
      value: `${parsed.tax.mode === "excluded" ? "未税另加" : "已含税"} ${parsed.tax.rate}%`,
    });
  }
  return { projectItems, feeItems };
}

Page({
  data: {
    draft: null,
    totals: { lines: [] },
    totalText: "¥0.00",
    summaryItems: [],
    productPickerOpen: false,
    productResults: [],
    productQuery: "",
    activeProductIndex: -1,
    seriesOptions,
    activeSeries: "全部",
    discountTypeLabels: ["百分比折扣", "固定金额"],
    taxModeLabels: ["输入金额已含税", "输入金额未含税"],
    discountTypeIndex: 0,
    taxModeIndex: 0,
    saveState: "尚未保存",
    saving: false,
    localMode: false,
    copyPickerOpen: false,
    copyPickerTitle: "",
    copySuggestions: [],
    copyTarget: null,
    voiceSheetOpen: false,
    voiceAvailable: true,
    voiceRecording: false,
    voiceRecognizing: false,
    voiceTranscript: "",
    voicePreview: null,
    voiceProjectItems: [],
    voiceFeeItems: [],
    voiceLines: [],
    voiceWarnings: [],
  },
  async onLoad(options) {
    let draft = wx.getStorageSync("woodallEditQuote") || quoteUtil.createDraft();
    if (options.id) {
      try {
        const result = await api.listQuotes();
        const id = decodeURIComponent(options.id);
        draft = result.quotes.find((item) => item.id === id)?.draft || draft;
      } catch (error) {
        wx.showToast({ title: error.message, icon: "none" });
      }
    }
    draft = quoteUtil.migrateDraft(draft);
    draft.lines = draft.lines.map(decorateLine);
    this.setData({
      draft,
      localMode: api.mode() === api.LOCAL_MODE,
      discountTypeIndex: draft.discount.type === "fixed" ? 1 : 0,
      taxModeIndex: draft.tax.mode === "excluded" ? 1 : 0,
    });
    this.initVoiceRecognition();
    this.recalculate();
  },
  onUnload() {
    clearTimeout(this.saveTimer);
    clearTimeout(this.voiceParseTimer);
    if (this.data.voiceRecording && this.voiceManager) this.voiceManager.stop();
    if (this.data.draft) wx.setStorageSync("woodallEditQuote", this.cleanDraft());
  },
  onHide() {
    if (this.data.voiceRecording && this.voiceManager) this.voiceManager.stop();
  },
  noop() {},
  jumpToSection(event) {
    wx.pageScrollTo({ selector: `#${event.currentTarget.dataset.target}`, duration: 240 });
  },
  openCopySuggestions(event) {
    const type = event.currentTarget.dataset.type;
    const group = quoteCopy[type];
    if (!group) return;
    this.setData({
      copyPickerOpen: true,
      copyPickerTitle: group.title,
      copySuggestions: group.items,
      copyTarget: {
        type,
        index: event.currentTarget.dataset.index === undefined
          ? -1
          : Number(event.currentTarget.dataset.index),
      },
    });
  },
  closeCopySuggestions() {
    this.setData({
      copyPickerOpen: false,
      copyPickerTitle: "",
      copySuggestions: [],
      copyTarget: null,
    });
  },
  applyCopySuggestion(event) {
    const target = this.data.copyTarget;
    const suggestion = this.data.copySuggestions.find((item) => item.id === event.currentTarget.dataset.id);
    if (!target || !suggestion) return;
    const draft = this.data.draft;
    let current = "";
    if (target.type === "needs" || target.type === "advice") current = draft.project[target.type] || "";
    else if (target.type === "terms") current = draft.terms || "";
    else if (target.type === "lineNote" && draft.lines[target.index]) current = draft.lines[target.index].note || "";
    if (current.includes(suggestion.text)) {
      wx.showToast({ title: "该文案已加入", icon: "none" });
      return;
    }
    const separator = target.type === "lineNote" ? "；" : "\n";
    const next = current.trim() ? `${current.trim()}${separator}${suggestion.text}` : suggestion.text;
    if (target.type === "needs" || target.type === "advice") draft.project[target.type] = next;
    else if (target.type === "terms") draft.terms = next;
    else if (target.type === "lineNote" && draft.lines[target.index]) draft.lines[target.index].note = next;
    this.setData({ draft });
    this.update();
    wx.showToast({ title: "已加入报价", icon: "success" });
  },
  initVoiceRecognition() {
    if (this.voiceManager) return true;
    try {
      if (typeof requirePlugin !== "function") throw new Error("语音插件不可用");
      const plugin = requirePlugin("WechatSI");
      const manager = plugin.getRecordRecognitionManager();
      manager.onStart = () => {
        this.setData({ voiceRecording: true, voiceRecognizing: true });
      };
      manager.onRecognize = (result) => {
        const text = String(result?.result || "").trim();
        if (text) this.setData({ voiceTranscript: text });
      };
      manager.onStop = (result) => {
        const text = String(result?.result || this.data.voiceTranscript || "").trim();
        this.setData({ voiceRecording: false, voiceRecognizing: false, voiceTranscript: text });
        if (!text) {
          wx.showToast({ title: "没有听清，请再说一次", icon: "none" });
          return;
        }
        this.parseVoiceTranscript(text);
      };
      manager.onError = (error) => {
        const messages = {
          "-30003": "没有听清，请靠近手机再说一次",
          "-30004": "没有识别到有效内容",
          "-30006": "录音已超时，请分段口述",
        };
        const message = messages[String(error?.retcode)] || "语音识别失败，请稍后重试";
        this.setData({ voiceRecording: false, voiceRecognizing: false });
        wx.showToast({ title: message, icon: "none", duration: 2600 });
      };
      this.voiceManager = manager;
      return true;
    } catch (error) {
      this.setData({ voiceAvailable: false });
      return false;
    }
  },
  openVoiceSheet() {
    const available = this.initVoiceRecognition();
    this.setData({ voiceSheetOpen: true, voiceAvailable: available });
  },
  closeVoiceSheet() {
    if (this.data.voiceRecording && this.voiceManager) this.voiceManager.stop();
    this.setData({ voiceSheetOpen: false, voiceRecording: false, voiceRecognizing: false });
  },
  toggleVoiceRecording() {
    if (this.data.voiceRecording) {
      if (this.voiceManager) this.voiceManager.stop();
      this.setData({ voiceRecording: false, voiceRecognizing: true });
      return;
    }
    if (!this.initVoiceRecognition()) {
      wx.showModal({
        title: "语音服务未启用",
        content: "请先在小程序后台添加“微信同声传译”插件，再重新打开体验版。",
        showCancel: false,
      });
      return;
    }
    wx.authorize({
      scope: "scope.record",
      success: () => {
        this.setData({
          voiceTranscript: "",
          voicePreview: null,
          voiceProjectItems: [],
          voiceFeeItems: [],
          voiceLines: [],
          voiceWarnings: [],
          voiceRecognizing: true,
        });
        this.voiceManager.start({ duration: 60000, lang: "zh_CN" });
      },
      fail: () => {
        wx.showModal({
          title: "需要麦克风权限",
          content: "语音填写只在口述期间使用麦克风，不保存录音。请在设置中允许麦克风权限。",
          confirmText: "去设置",
          success: (result) => {
            if (result.confirm) wx.openSetting();
          },
        });
      },
    });
  },
  onVoiceTranscriptInput(event) {
    const voiceTranscript = event.detail.value;
    this.setData({ voiceTranscript });
    clearTimeout(this.voiceParseTimer);
    this.voiceParseTimer = setTimeout(() => this.parseVoiceTranscript(voiceTranscript), 500);
  },
  parseVoiceText() {
    this.parseVoiceTranscript(this.data.voiceTranscript, true);
  },
  parseVoiceTranscript(transcript, notify = false) {
    const parsed = voiceQuote.parseVoiceQuote(transcript, products);
    const review = buildVoiceReview(parsed);
    this.setData({
      voicePreview: parsed,
      voiceProjectItems: review.projectItems,
      voiceFeeItems: review.feeItems,
      voiceLines: parsed.lines,
      voiceWarnings: parsed.warnings,
    });
    if (notify) {
      wx.showToast({
        title: parsed.hasData ? "已重新解析" : "暂未识别到可填写内容",
        icon: "none",
      });
    }
  },
  applyVoicePreview() {
    const parsed = this.data.voicePreview;
    if (!parsed?.hasData) {
      wx.showToast({ title: "请先口述或输入报价内容", icon: "none" });
      return;
    }
    const draft = this.data.draft;
    Object.entries(parsed.project).forEach(([key, value]) => {
      if (value) draft.project[key] = value;
    });
    if (parsed.lines.length) {
      const existingLines = draft.lines.filter(lineHasContent);
      const recognizedLines = parsed.lines.map((line) => decorateLine({
        ...quoteUtil.blankLine(),
        room: line.room,
        productCode: line.productCode,
        netArea: line.netArea,
        wasteRate: line.wasteRate === "" ? 5 : line.wasteRate,
        unitPrice: line.unitPrice,
        note: line.note,
      }));
      draft.lines = [...existingLines, ...recognizedLines].slice(0, quoteUtil.MAX_LINES);
    }
    Object.entries(parsed.fees).forEach(([key, value]) => {
      if (value !== "") draft.fees[key] = value;
    });
    if (parsed.discount) draft.discount = { ...draft.discount, ...parsed.discount };
    if (parsed.tax) draft.tax = { ...draft.tax, ...parsed.tax };
    if (!draft.lines.length) draft.lines = [decorateLine(quoteUtil.blankLine())];
    this.setData({
      draft,
      discountTypeIndex: draft.discount.type === "fixed" ? 1 : 0,
      taxModeIndex: draft.tax.mode === "excluded" ? 1 : 0,
      voiceSheetOpen: false,
      voiceRecording: false,
      voiceRecognizing: false,
    });
    this.update();
    wx.pageScrollTo({ selector: "#project", duration: 260 });
    wx.showToast({ title: "已填入，请核对", icon: "success" });
  },
  cleanDraft() {
    const draft = JSON.parse(JSON.stringify(this.data.draft));
    draft.lines = draft.lines.map(({ productName, productMeta, productThumb, productStatus, ...line }) => line);
    if (!draft.customTitle && draft.project.name) draft.title = draft.project.name;
    draft.updatedAt = new Date().toISOString();
    return draft;
  },
  update() {
    this.recalculate();
    const draft = this.cleanDraft();
    wx.setStorageSync("woodallEditQuote", draft);
    this.setData({ saveState: this.data.localMode ? "已保存本机" : "等待同步" });
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveDraft(true), 1200);
  },
  recalculate() {
    const totals = quoteUtil.calculate(this.cleanDraft());
    const lines = totals.lines.map((line) => ({ ...line, amountText: money(line.amountCents) }));
    const summaryItems = [
      { key: "material", label: "产品金额", value: money(totals.materialCents), visible: true },
      { key: "accessory", label: "辅材费", value: money(totals.accessoryCents), visible: totals.accessoryCents > 0 },
      { key: "installation", label: "安装费", value: money(totals.installationCents), visible: totals.installationCents > 0 },
      { key: "transport", label: "运输费", value: money(totals.transportCents), visible: totals.transportCents > 0 },
      { key: "other", label: this.data.draft.fees.otherLabel || "其他费用", value: money(totals.otherCents), visible: totals.otherCents > 0 },
      { key: "discount", label: "折扣", value: `-${money(totals.discountCents)}`, visible: totals.discountCents > 0 },
      { key: "tax", label: `税额（${totals.taxRate}%）`, value: money(totals.taxCents), visible: totals.taxMode === "excluded" && totals.taxCents > 0 },
    ].filter((item) => item.visible);
    this.setData({ totals: { ...totals, lines }, totalText: money(totals.totalCents), summaryItems });
  },
  onProjectInput(event) {
    const draft = this.data.draft;
    draft.project[event.currentTarget.dataset.field] = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  onFeeInput(event) {
    const draft = this.data.draft;
    draft.fees[event.currentTarget.dataset.field] = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  onDiscountInput(event) {
    const draft = this.data.draft;
    draft.discount.value = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  onDiscountType(event) {
    const index = Number(event.detail.value);
    const draft = this.data.draft;
    draft.discount.type = index === 1 ? "fixed" : "percent";
    this.setData({ draft, discountTypeIndex: index });
    this.update();
  },
  onTaxInput(event) {
    const draft = this.data.draft;
    draft.tax.rate = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  onTaxMode(event) {
    const index = Number(event.detail.value);
    const draft = this.data.draft;
    draft.tax.mode = index === 1 ? "excluded" : "included";
    this.setData({ draft, taxModeIndex: index });
    this.update();
  },
  onTermsInput(event) {
    const draft = this.data.draft;
    draft.terms = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  onLineInput(event) {
    const index = Number(event.currentTarget.dataset.index);
    const draft = this.data.draft;
    draft.lines[index][event.currentTarget.dataset.field] = event.detail.value;
    this.setData({ draft });
    this.update();
  },
  openProduct(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({
      activeProductIndex: index,
      productPickerOpen: true,
      productQuery: "",
      activeSeries: "全部",
      productResults: this.searchProducts("", "全部"),
    });
  },
  closeProduct() {
    this.setData({ productPickerOpen: false, activeProductIndex: -1, productResults: [], productQuery: "" });
  },
  onProductSearch(event) {
    const query = event.detail.value;
    this.setData({ productQuery: query, productResults: this.searchProducts(query, this.data.activeSeries) });
  },
  chooseSeries(event) {
    const series = event.currentTarget.dataset.series;
    this.setData({ activeSeries: series, productResults: this.searchProducts(this.data.productQuery, series) });
  },
  searchProducts(query, series) {
    const text = String(query || "").trim().toLowerCase();
    return products.filter((product) => {
      const seriesMatch = series === "全部" || shortSeries(product.series) === series;
      const textMatch = !text || [product.code, product.wood, product.series, product.structure, product.spec]
        .some((value) => String(value || "").toLowerCase().includes(text));
      return seriesMatch && textMatch;
    }).slice(0, 50).map(decorateProduct);
  },
  chooseProduct(event) {
    const product = productByCode.get(event.currentTarget.dataset.code);
    const index = this.data.activeProductIndex;
    if (!product || index < 0) return;
    const draft = this.data.draft;
    draft.lines[index] = decorateLine({ ...draft.lines[index], productCode: product.code });
    this.setData({ draft });
    this.closeProduct();
    this.update();
  },
  addLine() {
    if (this.data.draft.lines.length >= quoteUtil.MAX_LINES) return;
    const draft = this.data.draft;
    draft.lines.push(decorateLine(quoteUtil.blankLine()));
    this.setData({ draft });
    this.update();
  },
  removeLine(event) {
    const draft = this.data.draft;
    draft.lines.splice(Number(event.currentTarget.dataset.index), 1);
    if (!draft.lines.length) draft.lines.push(decorateLine(quoteUtil.blankLine()));
    this.setData({ draft });
    this.update();
  },
  moveLine(event) {
    const index = Number(event.currentTarget.dataset.index);
    const direction = Number(event.currentTarget.dataset.direction);
    const next = index + direction;
    const draft = this.data.draft;
    if (next < 0 || next >= draft.lines.length) return;
    [draft.lines[index], draft.lines[next]] = [draft.lines[next], draft.lines[index]];
    this.setData({ draft });
    this.update();
  },
  async manualSave() {
    const draft = this.cleanDraft();
    const errors = quoteUtil.validate(draft, products);
    if (errors.length) {
      const first = errors[0];
      wx.showModal({ title: "请完善报价", content: first.message, showCancel: false });
      wx.pageScrollTo({ selector: `#${first.path}`, duration: 260 });
      return;
    }
    await this.saveDraft(false);
  },
  async saveDraft(silent) {
    clearTimeout(this.saveTimer);
    this.setData({ saving: !silent, saveState: this.data.localMode ? "正在保存…" : "正在同步…" });
    try {
      const draft = this.cleanDraft();
      const result = await api.saveQuote(draft);
      const saved = result.quote?.draft || draft;
      wx.setStorageSync("woodallEditQuote", saved);
      this.setData({ saveState: this.data.localMode ? "已保存本机" : "已同步至总部" });
      if (!silent) wx.showToast({ title: this.data.localMode ? "已保存到本机" : "报价已同步", icon: "success" });
    } catch (error) {
      this.setData({ saveState: "已保存本机，等待同步" });
      wx.setStorageSync("woodallEditQuote", this.cleanDraft());
      if (!silent) wx.showToast({ title: error.message, icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  },
});
