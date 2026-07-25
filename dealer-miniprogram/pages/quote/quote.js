const api = require("../../utils/api");
const quoteUtil = require("../../utils/quote");
const products = require("../../data/products");
const quoteCopy = require("../../data/quote-copy");
const voiceField = require("../../utils/voice-field");
const fileExport = require("../../utils/file-export");

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

function combinedLocation(project) {
  const city = String(project?.city || "").trim();
  const address = String(project?.address || "").trim();
  if (!city) return address;
  if (!address) return city;
  return address.includes(city) ? address : `${city} ${address}`;
}

function cityFromLocation(value) {
  const text = String(value || "").trim();
  const municipality = text.match(/^(北京市|上海市|天津市|重庆市)/);
  if (municipality) return municipality[1];
  const city = text.match(/^([\u4e00-\u9fa5]{2,8}(?:市|自治州|地区|盟))/);
  return city ? city[1] : "";
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
    voiceAvailable: true,
    voiceRecording: false,
    voiceRecognizing: false,
    voiceTargetKey: "",
    exportKind: "",
    exportState: "生成后可直接预览、转发或保存到手机",
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
    draft.project.address = combinedLocation(draft.project);
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
    if (this.data.voiceRecording && this.voiceManager) {
      this.voiceCancelled = true;
      this.restoreVoiceTarget();
      this.voiceManager.stop();
    }
    if (this.data.draft) wx.setStorageSync("woodallEditQuote", this.cleanDraft());
  },
  onHide() {
    if (this.data.voiceRecording && this.voiceManager) {
      this.voiceCancelled = true;
      this.restoreVoiceTarget();
      this.voiceManager.stop();
    }
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
        if (text) {
          this.voiceLiveText = text;
          this.previewVoiceFieldResult(text);
        }
      };
      manager.onStop = (result) => {
        const cancelled = this.voiceCancelled;
        const text = String(result?.result || this.voiceLiveText || "").trim();
        this.voiceCancelled = false;
        this.setData({ voiceRecording: false, voiceRecognizing: false });
        if (cancelled) {
          this.restoreVoiceTarget();
          this.voiceTarget = null;
          this.setData({ voiceTargetKey: "" });
          return;
        }
        if (!text) {
          this.voiceTarget = null;
          this.setData({ voiceTargetKey: "" });
          wx.showToast({ title: "没有听清，请再说一次", icon: "none" });
          return;
        }
        this.applyVoiceFieldResult(text);
      };
      manager.onError = (error) => {
        const messages = {
          "-30003": "没有听清，请靠近手机再说一次",
          "-30004": "没有识别到有效内容",
          "-30006": "录音已超时，请分段口述",
        };
        const message = messages[String(error?.retcode)] || "语音识别失败，请稍后重试";
        this.restoreVoiceTarget();
        this.voiceTarget = null;
        this.setData({ voiceRecording: false, voiceRecognizing: false, voiceTargetKey: "" });
        wx.showToast({ title: message, icon: "none", duration: 2600 });
      };
      this.voiceManager = manager;
      return true;
    } catch (error) {
      this.setData({ voiceAvailable: false });
      return false;
    }
  },
  startFieldVoice(event) {
    const dataset = event.currentTarget.dataset;
    const key = dataset.key;
    if (this.data.voiceRecording) {
      if (key === this.data.voiceTargetKey && this.voiceManager) {
        this.voiceManager.stop();
        this.setData({ voiceRecording: false, voiceRecognizing: true });
      } else {
        wx.showToast({ title: "请先结束当前语音输入", icon: "none" });
      }
      return;
    }
    if (this.data.voiceRecognizing) {
      wx.showToast({ title: "正在识别，请稍候", icon: "none" });
      return;
    }
    if (!this.initVoiceRecognition()) {
      wx.showModal({
        title: "语音服务未启用",
        content: "微信语音服务暂时不可用，请重新打开小程序后再试。",
        showCancel: false,
      });
      return;
    }
    const target = {
      key,
      scope: dataset.scope,
      field: dataset.field,
      mode: dataset.mode || "short",
      index: dataset.index === undefined ? -1 : Number(dataset.index),
    };
    target.baseValue = this.readVoiceTargetValue(target);
    this.voiceTarget = target;
    this.voiceLiveText = "";
    this.voiceCancelled = false;
    this.setData({ voiceTargetKey: key });
    wx.authorize({
      scope: "scope.record",
      success: () => {
        this.setData({ voiceRecognizing: true });
        this.voiceManager.start({ duration: 30000, lang: "zh_CN" });
        wx.showToast({ title: "正在听，再点一次结束", icon: "none", duration: 1300 });
      },
      fail: () => {
        this.voiceTarget = null;
        this.setData({ voiceTargetKey: "" });
        wx.showModal({
          title: "需要麦克风权限",
          content: "语音输入只在口述期间使用麦克风，不保存录音。请在设置中允许麦克风权限。",
          confirmText: "去设置",
          success: (result) => {
            if (result.confirm) wx.openSetting();
          },
        });
      },
    });
  },
  readVoiceTargetValue(target) {
    const draft = this.data.draft;
    if (target.scope === "project") return draft.project[target.field] || "";
    if (target.scope === "location") return draft.project.address || "";
    if (target.scope === "line" && draft.lines[target.index]) return draft.lines[target.index][target.field] || "";
    if (target.scope === "fees") return draft.fees[target.field] || "";
    if (target.scope === "discount") return draft.discount.value || "";
    if (target.scope === "tax") return draft.tax.rate || "";
    if (target.scope === "terms") return draft.terms || "";
    return "";
  },
  writeVoiceTargetValue(target, value, mergeWithBase = true) {
    if (!target) return;
    const draft = this.data.draft;
    const separatorIsNewline = target.scope !== "line";
    const nextValue = target.mode === "long" && mergeWithBase
      ? voiceField.mergeRecognizedText(target.baseValue, value, separatorIsNewline)
      : value;
    if (target.scope === "project") {
      draft.project[target.field] = nextValue;
    } else if (target.scope === "location") {
      draft.project.address = nextValue;
      const city = cityFromLocation(nextValue);
      if (city || !String(nextValue || "").trim()) draft.project.city = city;
    } else if (target.scope === "line" && draft.lines[target.index]) {
      draft.lines[target.index][target.field] = nextValue;
    } else if (target.scope === "fees") {
      draft.fees[target.field] = nextValue;
    } else if (target.scope === "discount") {
      draft.discount.value = nextValue;
    } else if (target.scope === "tax") {
      draft.tax.rate = nextValue;
    } else if (target.scope === "terms") {
      draft.terms = nextValue;
    }
    this.setData({ draft });
  },
  previewVoiceFieldResult(transcript) {
    const target = this.voiceTarget;
    if (!target) return;
    const value = target.mode === "number"
      ? voiceField.extractNumericValue(transcript)
      : voiceField.cleanRecognizedText(transcript, target.mode === "long");
    if (value !== "") this.writeVoiceTargetValue(target, value);
  },
  restoreVoiceTarget() {
    if (!this.voiceTarget) return;
    this.writeVoiceTargetValue(this.voiceTarget, this.voiceTarget.baseValue, false);
  },
  applyVoiceFieldResult(transcript) {
    const target = this.voiceTarget;
    if (!target) return;
    const value = target.mode === "number"
      ? voiceField.extractNumericValue(transcript)
      : voiceField.cleanRecognizedText(transcript, target.mode === "long");
    if (value === "") {
      this.restoreVoiceTarget();
      this.voiceTarget = null;
      this.setData({ voiceTargetKey: "" });
      wx.showToast({
        title: target.mode === "number" ? "没有识别到数字，请重试" : "没有识别到有效文字",
        icon: "none",
      });
      return;
    }
    this.writeVoiceTargetValue(target, value);
    this.voiceTarget = null;
    this.setData({ voiceTargetKey: "" });
    this.update();
    wx.showToast({ title: "已填入当前字段", icon: "success" });
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
  onLocationInput(event) {
    const draft = this.data.draft;
    const location = event.detail.value;
    draft.project.address = location;
    const city = cityFromLocation(location);
    if (city || !String(location || "").trim()) draft.project.city = city;
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
  validateForExport() {
    const draft = this.cleanDraft();
    const errors = quoteUtil.validate(draft, products);
    if (!errors.length) return draft;
    const first = errors[0];
    wx.showModal({ title: "请完善报价", content: first.message, showCancel: false });
    wx.pageScrollTo({ selector: `#${first.path}`, duration: 260 });
    return null;
  },
  async exportFile(event) {
    const kind = event.currentTarget.dataset.kind;
    if (!["pdf", "pptx"].includes(kind) || this.data.exportKind) return;
    const draft = this.validateForExport();
    if (!draft) return;
    const isPdf = kind === "pdf";
    this.setData({
      exportKind: kind,
      exportState: isPdf ? "正在整理 PDF 页面…" : "正在生成可编辑 PPT…",
    });
    wx.showLoading({ title: "正在生成", mask: true });
    try {
      await this.saveDraft(true);
      await new Promise((resolve) => setTimeout(resolve, 80));
      const totals = quoteUtil.calculate(draft);
      let bytes;
      if (isPdf) {
        const { generatePdf } = require("../../utils/pdf-export");
        bytes = await generatePdf(draft, totals, this, (current, total) => {
          this.setData({ exportState: `正在生成 PDF（${current}/${total}）` });
        });
      } else {
        const { generatePptx } = require("../../utils/pptx-export");
        bytes = await generatePptx(draft, totals);
      }
      wx.hideLoading();
      this.setData({ exportState: "文件已生成，正在打开预览…" });
      const result = await fileExport.writeAndOpen(draft.project.name, kind, bytes);
      this.setData({ exportState: `${result.fileName} 已生成` });
    } catch (error) {
      wx.hideLoading();
      const message = String(error?.message || error?.errMsg || "文件生成失败")
        .replace(/^Error:\s*/i, "")
        .slice(0, 180);
      this.setData({ exportState: "生成未完成，报价草稿已保留" });
      wx.showModal({
        title: "暂未生成文件",
        content: `${message}\n\n报价内容已经保存，可以稍后重新生成。`,
        showCancel: false,
      });
    } finally {
      this.setData({ exportKind: "" });
    }
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
