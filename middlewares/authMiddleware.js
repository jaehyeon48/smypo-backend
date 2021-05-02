const jwt = require('jsonwebtoken');
const pool = require('../database/db');
require('dotenv').config();

// not use refresh token method for now
async function authMiddleware(req, res, next) {
  // UART for User Authentication Refresh Token
  // UAAT for User Authentication Access Token
  // const refreshToken = req.cookies.UART;
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
    // if (refreshToken !== null && error.name === 'TokenExpiredError') {
    //   const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    //   const [refreshFromDB] = await pool.query('SELECT token FROM refreshToken WHERE userId = ?', [decodedRefresh.user.id]);
    //   // if the current refresh token from the user is the same as refresh token in the DB,
    //   // issue a new access token
    //   if (refreshToken === refreshFromDB[0].token) {
    //     const jwtPayload = {
    //       user: { id: decodedRefresh.user.id }
    //     };
    //     const newAccessToken = jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });
    //     /* !!!!!!!!!!!!!!! sameSite should be 'strict' in production mode. !!!!!!!!!!!!!!! */
    //     res.cookie('UAAT', newAccessToken, { httpOnly: true, sameSite: process.env.SAME_SITE, secure: true });
    //     req.user = decodedRefresh.user;
    //     next();
    //   }
    // } else {
    //   return res.status(401).json({ errorMsg: 'Token is invalid' });
    // }
    return res.status(401).json({ errorMsg: 'Token is invalid' });
  }
}

module.exports = authMiddleware;