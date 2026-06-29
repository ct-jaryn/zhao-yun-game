const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function _ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function _readUsers() {
  _ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || [];
  } catch (err) {
    return [];
  }
}

function _writeUsers(users) {
  _ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function _hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function register(username, password) {
  const users = _readUsers();
  if (users.some(u => u.username === username)) {
    return { success: false, message: '用户名已存在' };
  }
  if (!username || username.length < 3 || username.length > 20) {
    return { success: false, message: '用户名长度应为 3-20 位' };
  }
  if (!password || password.length < 6 || password.length > 32) {
    return { success: false, message: '密码长度应为 6-32 位' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = _hashPassword(password, salt);
  const user = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    salt,
    createdAt: Date.now()
  };
  users.push(user);
  _writeUsers(users);
  return { success: true, userId: user.id, username: user.username };
}

function login(username, password) {
  const users = _readUsers();
  const user = users.find(u => u.username === username);
  if (!user) return { success: false, message: '用户名或密码错误' };
  const hash = _hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return { success: false, message: '用户名或密码错误' };
  }
  return { success: true, userId: user.id, username: user.username };
}

function getUserById(id) {
  const users = _readUsers();
  const user = users.find(u => u.id === id);
  if (!user) return null;
  return { id: user.id, username: user.username, createdAt: user.createdAt };
}

module.exports = { register, login, getUserById };
