const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set');
}

const generateToken = (payload) => jwt.sign(payload, jwtSecret, {
  algorithm: 'HS256',
  expiresIn: '24h',
});

const verifyToken = (token) => jwt.verify(token, jwtSecret, {
  algorithms: ['HS256'],
});

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !/^Bearer\s+[^\s]+$/i.test(authHeader)) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const token = authHeader.slice(7).trim();

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const superAdminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!req.user || req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: Super Admin access required' });
    }
    return next();
  });
};

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  superAdminMiddleware,
};
