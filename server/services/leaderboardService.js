const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'leaderboard.json');
const MAX_RECORDS = 50;

let leaderboard = [];

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (Array.isArray(data)) leaderboard = data;
    }
  } catch (err) {
    console.error('读取排行榜失败:', err.message);
    leaderboard = [];
  }
}

function save() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(leaderboard, null, 2));
  } catch (err) {
    console.error('保存排行榜失败:', err.message);
  }
}

function getList(limit = 10) {
  return leaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, MAX_RECORDS)));
}

function addRecord(record) {
  const entry = {
    name: String(record.name || '无名英雄').slice(0, 20),
    score: Number(record.score) || 0,
    kills: Number(record.kills) || 0,
    wave: Number(record.wave) || 1,
    level: Number(record.level) || 1,
    time: Number(record.time) || 0,
    createdAt: Date.now()
  };
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.score - a.score);
  if (leaderboard.length > MAX_RECORDS) leaderboard = leaderboard.slice(0, MAX_RECORDS);
  save();
  return entry;
}

load();

module.exports = { getList, addRecord, save };
