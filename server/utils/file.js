const fs = require('fs');
const path = require('path');

/**
 * 原子写入 JSON 文件：先写入临时文件，再重命名，避免写入过程中进程崩溃导致文件损坏。
 */
function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.tmp-${path.basename(filePath)}-${Date.now()}`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

module.exports = { writeJsonAtomic };
