const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
  // UART for User Authentication Refresh Token
  // UAAT for User Authentication Access Token
  const refreshToken = req.cookies.UART;
  const accessToken = req.cookies.UAAT;

  if (!accessToken) {
    return res.status(401).json({ errorMsg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(401).json({ errorMsg: 'Token is invalid' });
  }
}

module.exports = authMiddleware;