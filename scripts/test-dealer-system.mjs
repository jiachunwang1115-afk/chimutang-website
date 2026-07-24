import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { calculateQuote, createDraft } from "../quote-core.mjs";
import { calculateServerTotals, createTemporaryPassword, hashPassword, isValidUsername, sanitizeDraft, verifyPassword } from "../worker/dealer-api.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

assert(isValidUsername("shaoxing_01"));
assert(!isValidUsername("ab"));
assert(!isValidUsername("中文账号"));

const temporaryPassword = createTemporaryPassword();
assert.match(temporaryPassword, /^WA-[A-Za-z0-9]{16}$/);
const passwordRecord = await hashPassword(temporaryPassword);
assert(await verifyPassword(temporaryPassword, passwordRecord.salt, passwordRecord.hash, passwordRecord.iterations));
assert.equal(await verifyPassword(`${temporaryPassword}x`, passwordRecord.salt, passwordRecord.hash, passwordRecord.iterations), false);

const draft = createDraft({
  id: "quote-system-test",
  project: { name: "总部同步测试", city: "绍兴" },
  lines: [{ room: "客厅", productCode: "A3-B802", netArea: 20, wasteRate: 5, unitPrice: 680, note: "连续铺装" }],
  fees: { accessoryUnitPrice: 15, installationUnitPrice: 30, transportAmount: 500 },
  discount: { type: "percent", value: 5 },
  tax: { mode: "excluded", rate: 13 },
});
const sanitized = sanitizeDraft({ ...draft, unknown: "drop", lines: [...draft.lines, ...Array(12).fill(draft.lines[0])] });
assert.equal(sanitized.lines.length, 8);
assert.equal("unknown" in sanitized, false);
const clientTotals = calculateQuote(sanitized);
const serverTotals = calculateServerTotals(sanitized);
assert.equal(serverTotals.totalCents, clientTotals.totalCents, "服务端与网页端总价必须一致");
assert.equal(serverTotals.totalBillableArea, clientTotals.totalBillableArea);

const miniRoot = path.join(root, "dealer-miniprogram");
const miniConfig = JSON.parse(await readFile(path.join(miniRoot, "app.json"), "utf8"));
const miniTags = new Set(["view", "text", "image", "button", "input", "textarea", "picker", "scroll-view", "label", "block"]);
for (const page of miniConfig.pages) {
  for (const extension of ["js", "json", "wxml", "wxss"]) await access(path.join(miniRoot, `${page}.${extension}`));
  const wxml = await readFile(path.join(miniRoot, `${page}.wxml`), "utf8");
  for (const [, tag] of wxml.matchAll(/<\/?([a-z][\w-]*)\b/g)) assert(miniTags.has(tag), `不支持的小程序标签: ${tag}`);
}
const miniProductSource = await readFile(path.join(miniRoot, "data", "products.js"), "utf8");
const miniProducts = JSON.parse(miniProductSource.replace(/^module\.exports\s*=\s*/, "").replace(/;\s*$/, ""));
assert.equal(miniProducts.length, 138);
assert(miniProducts.every((product) => product.code));
assert(miniProducts.every((product) => product.thumbUrl?.startsWith("/assets/products/")), "小程序产品应使用包内真实缩略图");
for (const product of miniProducts) await access(path.join(miniRoot, product.thumbUrl.slice(1)));
const quoteCopySource = await readFile(path.join(miniRoot, "data", "quote-copy.js"), "utf8");
const quoteCopyModule = { exports: {} };
vm.runInNewContext(quoteCopySource, { module: quoteCopyModule, exports: quoteCopyModule.exports });
assert.deepEqual(Object.keys(quoteCopyModule.exports), ["needs", "advice", "lineNote", "terms"]);
for (const group of Object.values(quoteCopyModule.exports)) {
  assert(group.items.length >= 5, `${group.title}至少需要五条参考文案`);
  assert.equal(new Set(group.items.map((item) => item.id)).size, group.items.length, `${group.title}的文案 ID 不得重复`);
  assert(group.items.every((item) => item.title && item.text.length >= 20), `${group.title}的文案应完整可用`);
}

assert.equal(miniConfig.plugins?.WechatSI?.provider, "wx069ba97219f66d99", "语音填写必须使用微信同声传译插件");
assert.equal(miniConfig.permission?.["scope.record"]?.desc.includes("报价"), true, "录音权限必须说明报价用途");
const voiceFieldSource = await readFile(path.join(miniRoot, "utils", "voice-field.js"), "utf8");
const voiceFieldModule = { exports: {} };
vm.runInNewContext(voiceFieldSource, {
  module: voiceFieldModule,
  exports: voiceFieldModule.exports,
  Math,
  Number,
  String,
  Boolean,
  Array,
  Object,
  RegExp,
});
const voiceField = voiceFieldModule.exports;
assert.equal(voiceField.extractNumericValue("单价980元"), 980);
assert.equal(voiceField.extractNumericValue("三十五点五平方"), 35.5);
assert.equal(voiceField.extractNumericValue("九百八十元"), 980);
assert.equal(voiceField.cleanRecognizedText("绍兴市越城区镜湖府。"), "绍兴市越城区镜湖府");
assert.equal(voiceField.mergeRecognizedText("需要地暖", "重视采光", true), "需要地暖\n重视采光");

const miniQuoteSource = await readFile(path.join(miniRoot, "utils", "quote.js"), "utf8");
const miniQuoteModule = { exports: {} };
vm.runInNewContext(miniQuoteSource, { module: miniQuoteModule, exports: miniQuoteModule.exports, Date, Math, Number, String, Boolean, Array, Set });
const miniQuote = miniQuoteModule.exports;
const miniDraft = miniQuote.createDraft({
  id: "mini-quote-test",
  project: { name: "小程序计价测试", city: "绍兴" },
  lines: [{ room: "客厅", productCode: "A3-B802", netArea: 20, wasteRate: 5, unitPrice: 680, note: "连续铺装" }],
  fees: { accessoryUnitPrice: 15, installationUnitPrice: 30, transportAmount: 500 },
  discount: { type: "percent", value: 5 },
  tax: { mode: "excluded", rate: 13 },
});
const miniTotals = miniQuote.calculate(miniDraft);
const singleClientTotals = calculateQuote(createDraft({
  id: "mini-quote-test",
  project: { name: "小程序计价测试", city: "绍兴" },
  lines: [{ room: "客厅", productCode: "A3-B802", netArea: 20, wasteRate: 5, unitPrice: 680, note: "连续铺装" }],
  fees: { accessoryUnitPrice: 15, installationUnitPrice: 30, transportAmount: 500 },
  discount: { type: "percent", value: 5 },
  tax: { mode: "excluded", rate: 13 },
}));
assert.equal(miniTotals.totalCents, singleClientTotals.totalCents, "小程序与网页端总价必须一致");
assert.equal(miniTotals.totalBillableArea, singleClientTotals.totalBillableArea);
assert.equal(miniQuote.validate(miniDraft, miniProducts).length, 0);
assert(miniQuote.validate(miniQuote.createDraft(), miniProducts).length >= 5, "空报价必须被完整校验");

const miniStorage = new Map();
let miniEnvVersion = "trial";
const miniWx = {
  getStorageSync: (key) => miniStorage.get(key),
  setStorageSync: (key, value) => miniStorage.set(key, value),
  removeStorageSync: (key) => miniStorage.delete(key),
  getAccountInfoSync: () => ({ miniProgram: { envVersion: miniEnvVersion } }),
  request: () => { throw new Error("本机模式不应发起网络请求"); },
};
const miniApiSource = await readFile(path.join(miniRoot, "utils", "api.js"), "utf8");
const miniApiModule = { exports: {} };
vm.runInNewContext(miniApiSource, {
  module: miniApiModule,
  exports: miniApiModule.exports,
  require: (specifier) => specifier === "./quote" ? miniQuote : null,
  wx: miniWx,
  Promise,
  Date,
  JSON,
  Math,
  Number,
  String,
  Boolean,
  Array,
  Set,
  Map,
  Error,
  encodeURIComponent,
});
const miniApi = miniApiModule.exports;
miniApi.leaveLocalMode();
assert.equal(miniApi.mode(), "cloud", "小程序必须使用总部账号模式");
assert.equal("startLocalMode" in miniApi, false, "正式小程序不应暴露本机体验入口");
assert.deepEqual(
  { ...miniApi.demoCredentials() },
  { username: "woodall_demo", password: "WoodallDemo2026!" },
  "体验版应提供受环境限制的演示账号",
);
const demoLogin = await miniApi.login("woodall_demo", "WoodallDemo2026!");
assert.equal(demoLogin.user.localOnly, true, "体验版演示账号应进入本机模式");
assert.equal(miniApi.mode(), "local");
assert.equal((await miniApi.listQuotes()).mode, "local", "演示报价不应发起网络请求");
miniApi.leaveLocalMode();
miniEnvVersion = "release";
assert.equal(miniApi.demoCredentials(), null, "正式版必须关闭演示账号");
const loginWxml = await readFile(path.join(miniRoot, "pages", "login", "login.wxml"), "utf8");
assert.equal(loginWxml.includes("先体验报价功能"), false, "登录页不应提供绕过账号的体验入口");
assert.equal(loginWxml.includes("体验版演示账号"), true, "体验版应清楚说明数据仅保存在当前设备");
const [appWxss, homeWxml, homeWxss, quoteWxml, historyWxml] = await Promise.all([
  readFile(path.join(miniRoot, "app.wxss"), "utf8"),
  readFile(path.join(miniRoot, "pages", "home", "home.wxml"), "utf8"),
  readFile(path.join(miniRoot, "pages", "home", "home.wxss"), "utf8"),
  readFile(path.join(miniRoot, "pages", "quote", "quote.wxml"), "utf8"),
  readFile(path.join(miniRoot, "pages", "history", "history.wxml"), "utf8"),
]);
assert.match(appWxss, /overflow-x:\s*hidden/, "小程序根页面必须阻止横向溢出");
assert.match(appWxss, /repeat\(4,\s*minmax\(0,\s*1fr\)\)/, "底部导航必须使用可收缩列");
assert.equal(homeWxml.includes('class="quick-actions"'), false, "手机首页不应继续使用并排桌面操作卡");
assert.match(homeWxss, /\.home-actions\s*\{[^}]*display:\s*grid[^}]*\}/s, "首页主要操作应使用稳定单列");
assert.equal(quoteWxml.match(/data-target="/g)?.length, 4, "报价页必须提供四步快速导航");
assert.equal(quoteWxml.match(/bindtap="openCopySuggestions"/g)?.length, 4, "四类可编辑文案都应提供参考入口");
assert.equal(quoteWxml.includes("语音填写报价"), false, "报价页不应保留整单语音解析入口");
assert.equal(quoteWxml.match(/bindtap="startFieldVoice"/g)?.length, 8, "文字和备注字段应提供独立语音入口");
assert.equal(quoteWxml.includes('data-mode="number"'), false, "数字字段不应显示语音输入按钮");
assert.equal(quoteWxml.includes("项目所在地"), true, "城市和项目地址应合并为项目所在地");
assert.equal(quoteWxml.includes(">城市<"), false, "报价页不应要求单独填写城市");
assert.equal(historyWxml.includes("floating-add"), false, "历史页不应与底部报价入口重复");

for (const [htmlFile, jsFile] of [["dealer-quote.html", "dealer-quote.js"], ["dealer-admin.html", "dealer-admin.js"]]) {
  const [html, js] = await Promise.all([readFile(path.join(root, htmlFile), "utf8"), readFile(path.join(root, jsFile), "utf8")]);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  const referencedIds = [...js.matchAll(/getElementById\("([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual(referencedIds.filter((id) => !ids.has(id)), [], `${jsFile} 不应引用缺失的页面元素`);
}

console.log(`Dealer system tests passed: authentication, totals, ${miniConfig.pages.length} mini-program pages and ${miniProducts.length} products.`);
