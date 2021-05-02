const bcrypt = require('bcryptjs');
const { response } = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../database/db');
require('dotenv').config();


// @ROUTE         GET auth
// @DESCRIPTION   check authentication
// @ACCESS        Private
async function checkAuthController(req, res) {
  const userId = req.user.id;
  try {
    const [userInfo] = await pool.query(`SELECT userId, firstName, lastName, email,
    avatar, theme, lang, currency FROM user WHERE userId = ?`, [userId]);

    return res.status(200).json(userInfo[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         GET auth/route-change
// @DESCRIPTION   check authentication on every route change
// @ACCESS        Private
async function checkAuthOnRouteChgController(req, res) {
  return res.send('success');
}


// @ROUTE         GET auth/logout
// @DESCRIPTION   Logout the user
// @ACCESS        Private
async function logoutController(req, res) {
  const userId = req.user.id;
  // Remove refresh token from the DB
  await pool.query('DELETE FROM refreshToken WHERE userId = ?', [userId]);
  /* !!!!!!!!!!!!!!! sameSite should be 'strict' in production mode. !!!!!!!!!!!!!!! */
  // not use refresh token for now
  // res.cookie('UART', '', { httpOnly: true, sameSite: process.env.SAME_SITE, secure: true, maxAge: '-1' });
  res.cookie('UAAT', '', { httpOnly: true, sameSite: process.env.SAME_SITE, secure: true, maxAge: '-1' });
  res.json({ successMsg: 'Successfully logged out' });
}


// @ROUTE         POST auth/login
// @DESCRIPTION   Login user
// @ACCESS        Public
async function loginController(req, res) {
  const { email, password } = req.body;

  try {
    const [userInfo] = await pool.query(`SELECT userId, password FROM user WHERE email = ?`, [email]);

    if (userInfo[0] === undefined) {
      return res.status(400).json({ errorMsg: 'Email or password is invalid.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, userInfo[0].password);

    if (!isPasswordMatch) {
      return res.status(400).json({ errorMsg: 'Email or password is invalid.' });
    }

    const jwtPayload = {
      user: { id: userInfo[0].userId }
    };

    // not use refresh token for now
    // create refresh token
    // const refreshToken = jwt.sign(jwtPayload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
    const accessToken = jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    // save refresh token into the DB
    // await pool.query('INSERT INTO refreshToken(userId, token) VALUES(?, ?)', [userInfo[0].userId, refreshToken]);
    /* !!!!!!!!!!!!!!! sameSite should be 'strict' in production mode. !!!!!!!!!!!!!!! */
    // UART for User Authentication Refresh Token
    // UAAT for User Authentication Access Token
    // res.cookie('UART', refreshToken, { httpOnly: true, sameSite: process.env.SAME_SITE, secure: true });
    res.cookie('UAAT', accessToken, { httpOnly: true, sameSite: process.env.SAME_SITE, secure: true });
    res.json({ successMsg: 'Login Success' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         POST auth/signup
// @DESCRIPTION   Register user
// @ACCESS        Public
async function signUpController(req, res) {
  const { firstName, lastName, email, password } = req.body;

  try {
    const checkExistUser = await pool.query(`SELECT userId FROM user WHERE email = ?`, [email]);

    if (checkExistUser[0].length !== 0) {
      return res.status(400).json({ errorMsg: 'User already exists!' });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await pool.query(`INSERT INTO user (firstName, lastName, email, password)
      VALUES (?, ?, ?, ?)` , [firstName, lastName, email, encryptedPassword]);

    const jwtPayload = {
      user: { id: newUser.insertId }
    };

    // not use refresh token for now
    // create refresh token
    // const refreshToken = jwt.sign(jwtPayload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
    const accessToken = jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    // save refresh token into the DB
    // await pool.query('INSERT INTO refreshToken(userId, token) VALUES(?, ?)', [userInfo[0].userId, refreshToken]);
    /* !!!!!!!!!!!!!!! sameSite should be 'strict' in production mode. !!!!!!!!!!!!!!! */
    // UART for User Authentication Refresh Token
    // UAAT for User Authentication Access Token
    // res.cookie('UART', refreshToken, { httpOnly: true, sameSite: process.env.SAME_SITE, secure: true });
    res.cookie('UAAT', accessToken, { httpOnly: true, sameSite: process.env.SAME_SITE, secure: true });
    res.json({ successMsg: 'Sign Up Success' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

module.exports = {
  checkAuthController,
  checkAuthOnRouteChgController,
  logoutController,
  loginController,
  signUpController,
};