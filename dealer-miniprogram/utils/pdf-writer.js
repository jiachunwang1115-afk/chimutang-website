function ascii(value) {
  const text = String(value);
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) bytes[index] = text.charCodeAt(index) & 0xff;
  return bytes;
}

function concat(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function buildImagePdf(images, pageWidth = 960, pageHeight = 540) {
  if (!images.length) throw new Error("没有可写入 PDF 的页面");
  const objectCount = 2 + images.length * 3;
  const objects = new Array(objectCount + 1);
  const pageIds = [];

  objects[1] = ascii("<< /Type /Catalog /Pages 2 0 R >>");
  images.forEach((image, index) => {
    const pageId = 3 + index * 3;
    const imageId = pageId + 1;
    const contentId = pageId + 2;
    pageIds.push(pageId);
    const content = ascii(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im${index + 1} Do\nQ\n`);
    objects[pageId] = ascii(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] `
      + `/Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> `
      + `/Contents ${contentId} 0 R >>`,
    );
    objects[imageId] = concat([
      ascii(
        `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} `
        + `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`,
      ),
      image.bytes,
      ascii("\nendstream"),
    ]);
    objects[contentId] = concat([
      ascii(`<< /Length ${content.length} >>\nstream\n`),
      content,
      ascii("endstream"),
    ]);
  });
  objects[2] = ascii(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);

  const parts = [ascii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  const offsets = new Array(objectCount + 1).fill(0);
  let cursor = parts[0].length;
  for (let id = 1; id <= objectCount; id += 1) {
    offsets[id] = cursor;
    const part = concat([ascii(`${id} 0 obj\n`), objects[id], ascii("\nendobj\n")]);
    parts.push(part);
    cursor += part.length;
  }
  const xrefOffset = cursor;
  const xref = [
    `xref\n0 ${objectCount + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  ].join("");
  parts.push(ascii(xref));
  return concat(parts);
}

module.exports = { buildImagePdf };
