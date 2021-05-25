const jwt = require('jsonwebtoken');
const pool = require('../database/db');
require('dotenv').config();

// not use refresh token method for now
async function authMiddleware(req, res, next) {
  // UAAT for User Authentication Access Token
  const accessToken = req.cookies.UAAT;
  if (!accessToken) {
    return res.status(401).json({ errorMsg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded.user;
    const jwtPayload = {
      user: { id: decoded.user.id }
    };
    // renew access token
    const newAccessToken = jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    res.cookie('UAAT', newAccessToken, { httpOnly: true, sameSite: process.env.SAME_SITE, secure: true });
    next();
  } catch (error) {
    // if the access token has expired
    if (error.name === 'TokenExpiredError') {
      return res.status(200).json(-999);
    }
    return res.status(401).json({ errorMsg: 'Token is invalid' });
  }
}

module.exports = authMiddleware;