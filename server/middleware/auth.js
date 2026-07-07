const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('缺少环境变量 JWT_SECRET，请在启动前设置强度足够的密钥');
}

const JWT_OPTIONS = { expiresIn: '7d' };
const JWT_VERIFY_OPTIONS = { algorithms: ['HS256'] };

function issueToken(userId, username) {
  return jwt.sign({ userId, username }, JWT_SECRET, JWT_OPTIONS);
}

function _verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, JWT_VERIFY_OPTIONS);
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

module.exports = { authMiddleware, optionalAuthMiddleware, issueToken };
