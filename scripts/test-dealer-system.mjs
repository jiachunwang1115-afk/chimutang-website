import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
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

const initialPassword = await hashPassword("WA-Bgf27oJaAcPP9dzk", "IunpOIairu8ob9DFQtDq1Q", 120000);
assert.equal(initialPassword.hash, "VnZaujockTFyM9bhG91J4R7S65WMLuqps9M81Pky_6c", "初始管理员密码哈希必须匹配");

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

for (const [htmlFile, jsFile] of [["dealer-quote.html", "dealer-quote.js"], ["dealer-admin.html", "dealer-admin.js"]]) {
  const [html, js] = await Promise.all([readFile(path.join(root, htmlFile), "utf8"), readFile(path.join(root, jsFile), "utf8")]);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  const referencedIds = [...js.matchAll(/getElementById\("([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual(referencedIds.filter((id) => !ids.has(id)), [], `${jsFile} 不应引用缺失的页面元素`);
}

console.log(`Dealer system tests passed: authentication, totals, ${miniConfig.pages.length} mini-program pages and ${miniProducts.length} products.`);
