const fs = require('fs');
const path = require('path');
const { writeJsonAtomic } = require('../utils/file');

const SAVES_DIR = path.join(__dirname, '..', 'data', 'saves');
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

if (!fs.existsSync(SAVES_DIR)) {
  fs.mkdirSync(SAVES_DIR, { recursive: true });
}

function getFilePath(userId) {
  const safe = String(userId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (!safe) return null;
  return path.join(SAVES_DIR, `${safe}.json`);
}

function upload(userId, saveData) {
  try {
    const filePath = getFilePath(userId);
    if (!filePath) return { success: false, message: '无效用户标识' };

    const payload = JSON.stringify(saveData);
    if (payload.length > MAX_SIZE) return { success: false, message: '存档数据过大' };

    writeJsonAtomic(filePath, saveData);
    return { success: true, message: '存档已上传', updatedAt: Date.now() };
  } catch (err) {
    return { success: false, message: '存档写入失败' };
  }
}

function download(userId) {
  try {
    const filePath = getFilePath(userId);
    if (!filePath) return { success: false, message: '无效用户标识' };
    if (!fs.existsSync(filePath)) return { success: false, message: '未找到云存档' };
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return { success: true, data };
  } catch (err) {
    return { success: false, message: '读取云存档失败' };
  }
}

module.exports = { upload, download };
