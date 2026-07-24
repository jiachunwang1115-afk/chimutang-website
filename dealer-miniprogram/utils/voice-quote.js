const ROOM_NAMES = [
  "客餐厅",
  "客厅",
  "餐厅",
  "主卧",
  "次卧",
  "儿童房",
  "男孩房",
  "女孩房",
  "老人房",
  "父母房",
  "书房",
  "茶室",
  "衣帽间",
  "玄关",
  "走廊",
  "过道",
  "楼梯间",
  "地下室",
  "影音室",
  "多功能厅",
  "起居室",
  "厨房",
  "阳台",
];

const DIGITS = {
  零: "0",
  〇: "0",
  一: "1",
  二: "2",
  两: "2",
  三: "3",
  四: "4",
  五: "5",
  六: "6",
  七: "7",
  八: "8",
  九: "9",
};

function normalizeTranscript(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/横杠|减号|短横线|杠/g, "-")
    .replace(/[零〇一二两三四五六七八九]/g, (digit) => DIGITS[digit] || digit)
    .replace(/(\d)点(?=\d)/g, "$1.")
    .replace(/\s+/g, "");
}

function cleanCapture(value) {
  return String(value || "")
    .replace(/^(?:是|为|叫|位于|在|有|需要|使用|采用|选择|铺设|铺装)+/, "")
    .replace(/(?:然后|另外|同时|其中)$/, "")
    .trim();
}

function firstCapture(text, pattern) {
  const match = text.match(pattern);
  return match ? cleanCapture(match[1]) : "";
}

function numberCapture(text, pattern) {
  const value = firstCapture(text, pattern);
  if (!value) return "";
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : "";
}

function productAliases(products) {
  const aliases = [];
  const modelCounts = new Map();
  products.forEach((product) => {
    const model = normalizeTranscript(product.model);
    if (model) modelCounts.set(model, (modelCounts.get(model) || 0) + 1);
  });
  products.forEach((product) => {
    const code = normalizeTranscript(product.code);
    if (code) aliases.push({ token: code, product, priority: 2 });
    const model = normalizeTranscript(product.model);
    if (model && modelCounts.get(model) === 1) aliases.push({ token: model, product, priority: 1 });
  });
  return aliases.sort((a, b) => b.token.length - a.token.length || b.priority - a.priority);
}

function findProductMatches(text, products) {
  const matches = [];
  productAliases(products).forEach((alias) => {
    let from = 0;
    while (from < text.length) {
      const index = text.indexOf(alias.token, from);
      if (index < 0) break;
      const end = index + alias.token.length;
      const overlaps = matches.some((match) => index < match.end && end > match.index);
      if (!overlaps) matches.push({ index, end, product: alias.product, token: alias.token });
      from = end;
    }
  });
  return matches.sort((a, b) => a.index - b.index);
}

function delimiterBefore(text, index) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (/[，,。；;\n]/.test(text[cursor])) return cursor + 1;
  }
  return 0;
}

function chunkEnd(text, current, next) {
  if (!next) return text.length;
  for (let cursor = next.index - 1; cursor > current.end; cursor -= 1) {
    if (/[，,。；;\n]/.test(text[cursor])) return cursor;
  }
  return next.index;
}

function detectRoom(prefix) {
  let room = "";
  let position = -1;
  ROOM_NAMES.forEach((name) => {
    const index = prefix.lastIndexOf(name);
    if (index >= position) {
      position = index;
      room = name;
    }
  });
  return room;
}

function parseLine(text, match, next) {
  const start = delimiterBefore(text, match.index);
  const end = chunkEnd(text, match, next);
  const chunk = text.slice(start, end);
  const localProductIndex = Math.max(0, match.index - start);
  const beforeProduct = chunk.slice(0, localProductIndex);
  const afterProduct = chunk.slice(localProductIndex + match.token.length);
  return {
    room: detectRoom(beforeProduct),
    productCode: match.product.code,
    netArea: numberCapture(afterProduct, /(\d+(?:\.\d+)?)(?:平方米|平米|平方|㎡|M2|平)/),
    wasteRate: numberCapture(afterProduct, /(?:损耗率?|加损耗)(?:是|为)?(\d+(?:\.\d+)?)%?/),
    unitPrice: numberCapture(afterProduct, /(?:产品)?(?:单价|价格|每平(?:方)?)(?:是|为)?(\d+(?:\.\d+)?)/),
    note: firstCapture(afterProduct, /(?:选材)?备注(?:是|为)?([^，。；;\n]+)/),
    productName: `${match.product.code} · ${match.product.wood || "木种待确认"}`,
    productMeta: match.product.series || "",
  };
}

function parseVoiceQuote(transcript, products = []) {
  const text = normalizeTranscript(transcript);
  const matches = findProductMatches(text, products);
  const lines = matches.slice(0, 8).map((match, index) => parseLine(text, match, matches[index + 1]));

  const project = {
    name: firstCapture(text, /(?:客户|项目)(?:名称)?(?:叫|是|为)?[:：]?([^，。；;\n]{2,24})/),
    city: firstCapture(text, /(?:所在)?城市(?:是|为)?[:：]?([^，。；;\n]{2,12})/),
    address: firstCapture(text, /(?:项目)?地址(?:是|为|在)?[:：]?([^，。；;\n]{2,36})/),
    needs: firstCapture(text, /(?:项目)?需求(?:是|为)?[:：]?([^。；;\n]{2,100})/),
    advice: firstCapture(text, /(?:选材)?建议(?:是|为)?[:：]?([^。；;\n]{2,100})/),
  };

  const fees = {
    accessoryUnitPrice: numberCapture(text, /辅材(?:单价|费)?(?:是|为)?(\d+(?:\.\d+)?)/),
    installationUnitPrice: numberCapture(text, /安装(?:单价|费)?(?:是|为)?(\d+(?:\.\d+)?)/),
    transportAmount: numberCapture(text, /运输(?:费用|费)?(?:是|为)?(\d+(?:\.\d+)?)/),
    otherAmount: numberCapture(text, /其他(?:费用|费)?(?:是|为)?(\d+(?:\.\d+)?)/),
    otherLabel: firstCapture(text, /其他(?:费用|费)(?:说明|名称)(?:是|为)?([^，。；;\n]+)/),
  };

  const discountAmount = numberCapture(text, /(?:优惠|折扣金额)(?:是|为)?(\d+(?:\.\d+)?)元?/);
  const discountPercent = numberCapture(text, /(?:折扣|优惠)(?:比例)?(?:是|为)?(\d+(?:\.\d+)?)%/);
  const discountRate = numberCapture(text, /(\d(?:\.\d+)?)折/);
  const discount = discountAmount !== ""
    ? { type: "fixed", value: discountAmount }
    : discountPercent !== ""
      ? { type: "percent", value: discountPercent }
      : discountRate !== ""
        ? { type: "percent", value: Math.max(0, Math.min(100, 100 - discountRate * 10)) }
        : null;

  const taxRate = numberCapture(text, /(?:税率|另加税)(?:是|为)?(\d+(?:\.\d+)?)%?/);
  const tax = taxRate !== "" || /(?:含税|未税|不含税)/.test(text)
    ? { mode: /(?:未税|不含税|另加税)/.test(text) ? "excluded" : "included", rate: taxRate === "" ? 13 : taxRate }
    : null;

  const warnings = [];
  lines.forEach((line, index) => {
    const label = line.room || `第 ${index + 1} 条`;
    if (!line.room) warnings.push(`${label}未识别到空间名称`);
    if (!(Number(line.netArea) > 0)) warnings.push(`${label}未识别到净面积`);
    if (!(Number(line.unitPrice) > 0)) warnings.push(`${label}未识别到产品单价`);
  });
  if (!matches.length && text) warnings.push("未识别到产品库中的型号，请按“字母、数字、横杠”完整口述");

  const hasProject = Object.values(project).some(Boolean);
  const hasFees = Object.entries(fees).some(([key, value]) => key === "otherLabel" ? Boolean(value) : value !== "");
  return {
    transcript: String(transcript || "").trim(),
    project,
    lines,
    fees,
    discount,
    tax,
    warnings,
    hasData: hasProject || lines.length > 0 || hasFees || Boolean(discount) || Boolean(tax),
  };
}

module.exports = {
  normalizeTranscript,
  parseVoiceQuote,
};
