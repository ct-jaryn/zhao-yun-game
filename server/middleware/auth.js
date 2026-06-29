const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'zhaoyun-game-default-secret-change-me';

function _verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: '未提供登录凭证' });
  }
  const decoded = _verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: '登录凭证无效或已过期' });
  }
  req.userId = decoded.userId;
  req.username = decoded.username;
  next();
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    const decoded = _verifyToken(token);
    if (decoded) {
      req.userId = decoded.userId;
      req.username = decoded.username;
    }
  }
  next();
}

module.exports = { authMiddleware, optionalAuthMiddleware, JWT_SECRET };
