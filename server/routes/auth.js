const express = require('express');
const { authMiddleware, issueToken } = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;

function ok(res, data) {
  return res.json({ success: true, ...data });
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function validateCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    return '用户名和密码必须为字符串';
  }
  if (!username || username.length < 3 || username.length > 20) {
    return '用户名长度应为 3-20 位';
  }
  if (!USERNAME_RE.test(username)) {
    return '用户名只能包含字母、数字、下划线和中文';
  }
  if (!password || password.length < 6 || password.length > 32) {
    return '密码长度应为 6-32 位';
  }
  return null;
}

router.post('/register', (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const err = validateCredentials(username, password);
    if (err) return fail(res, 400, err);

    const result = authService.register(username, password);
    if (!result.success) {
      return fail(res, 400, result.message);
    }
    const token = issueToken(result.userId, result.username);
    return ok(res, { token, userId: result.userId, username: result.username });
  } catch (err) {
    next(err);
  }
});

router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const err = validateCredentials(username, password);
    if (err) return fail(res, 400, err);

    const result = authService.login(username, password);
    if (!result.success) {
      return fail(res, 401, result.message);
    }
    const token = issueToken(result.userId, result.username);
    return ok(res, { token, userId: result.userId, username: result.username });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, (req, res, next) => {
  try {
    const user = authService.getUserById(req.userId);
    if (!user) {
      return fail(res, 404, '用户不存在');
    }
    return ok(res, { data: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
