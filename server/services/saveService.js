const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'save.json');

let saveData = null;

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      saveData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('读取存档失败:', err.message);
    saveData = null;
  }
}

function save(data) {
  try {
    saveData = data;
    fs.writeFileSync(DATA_FILE, JSON.stringify(saveData, null, 2));
    return saveData;
  } catch (err) {
    console.error('保存存档失败:', err.message);
    throw err;
  }
}

function getSave() {
  return saveData;
}

load();

module.exports = { getSave, save };
