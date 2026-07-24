const DIGITS = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

const UNITS = {
  十: 10,
  百: 100,
  千: 1000,
  万: 10000,
};

function parseChineseInteger(value) {
  let total = 0;
  let section = 0;
  let number = 0;
  for (const char of value) {
    if (Object.prototype.hasOwnProperty.call(DIGITS, char)) {
      number = DIGITS[char];
      continue;
    }
    const unit = UNITS[char];
    if (!unit) continue;
    if (unit === 10000) {
      section = (section + number) * unit;
      total += section;
      section = 0;
      number = 0;
    } else {
      section += (number || 1) * unit;
      number = 0;
    }
  }
  return total + section + number;
}

function parseChineseNumber(value) {
  const parts = String(value || "").split("点");
  const integer = parseChineseInteger(parts[0]);
  if (!parts[1]) return integer;
  const decimals = [...parts[1]]
    .map((char) => DIGITS[char])
    .filter((digit) => digit !== undefined)
    .join("");
  return Number(`${integer}.${decimals || "0"}`);
}

function extractNumericValue(value) {
  const text = String(value || "")
    .replace(/[０-９]/g, (digit) => String(digit.charCodeAt(0) - 0xfee0))
    .replace(/,/g, "");
  const arabic = text.match(/-?\d+(?:\.\d+)?/);
  if (arabic) return Number(arabic[0]);
  const chinese = text.match(/[零〇一二两三四五六七八九十百千万点]+/);
  if (!chinese) return "";
  const number = parseChineseNumber(chinese[0]);
  return Number.isFinite(number) ? number : "";
}

function cleanRecognizedText(value, keepPunctuation = false) {
  const text = String(value || "").trim();
  if (keepPunctuation) return text;
  return text.replace(/[。！!？?，,；;]+$/g, "").trim();
}

function mergeRecognizedText(current, incoming, multiline) {
  const before = String(current || "").trim();
  const next = String(incoming || "").trim();
  if (!before) return next;
  if (!next || before.includes(next)) return before;
  return `${before}${multiline ? "\n" : "；"}${next}`;
}

module.exports = {
  cleanRecognizedText,
  extractNumericValue,
  mergeRecognizedText,
  parseChineseNumber,
};
