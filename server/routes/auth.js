const express = require('express');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function _issueToken(userId, username) {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  const result = authService.register(username, password);
  if (!result.success) {
    return res.status(400).json(result);
  }
  const token = _issueToken(result.userId, result.username);
  res.json({ success: true, token, userId: result.userId, username: result.username });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const result = authService.login(username, password);
  if (!result.success) {
    return res.status(401).json(result);
  }
  const token = _issueToken(result.userId, result.username);
  res.json({ success: true, token, userId: result.userId, username: result.username });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = authService.getUserById(req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  res.json({ success: true, data: user });
});

module.exports = router;
