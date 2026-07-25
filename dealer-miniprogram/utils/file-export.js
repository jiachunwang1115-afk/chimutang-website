const { safeFileName } = require("./export-model");

function writeArrayBuffer(fileName, data) {
  const fs = wx.getFileSystemManager();
  const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
  const buffer = data instanceof ArrayBuffer
    ? data
    : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  return new Promise((resolve, reject) => {
    fs.writeFile({
      filePath,
      data: buffer,
      success: () => resolve(filePath),
      fail: (error) => reject(new Error(error.errMsg || "文件写入失败")),
    });
  });
}

function openDocument(filePath, fileType) {
  return new Promise((resolve, reject) => {
    wx.openDocument({
      filePath,
      fileType,
      showMenu: true,
      success: resolve,
      fail: (error) => reject(new Error(error.errMsg || "文件预览失败")),
    });
  });
}

async function writeAndOpen(projectName, extension, data) {
  const fileName = safeFileName(projectName, extension);
  const filePath = await writeArrayBuffer(fileName, data);
  await openDocument(filePath, extension);
  return { fileName, filePath };
}

module.exports = {
  openDocument,
  writeAndOpen,
  writeArrayBuffer,
};
