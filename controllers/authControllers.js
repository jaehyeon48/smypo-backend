const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../database/db');


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


// @ROUTE         GET auth/logout
// @DESCRIPTION   Logout the user
// @ACCESS        Private
function logoutController(req, res) {
  res.status(200).cookie('token', '', { httpOnly: true, sameSite: 'none', secure: true, maxAge: '-1' }).json({ successMsg: 'Successfully logged out' });
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

    // create refresh token
    const refreshToken = jwt.sign(jwtPayload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
    const accessToken = jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });
    /* !!!!!!!!!!!!!!! sameSite should be 'strict' in production mode. !!!!!!!!!!!!!!! */
    // UART for User Authentication Refresh Token
    // UAAT for User Authentication Access Token
    res.cookie('UART', refreshToken, { httpOnly: true, sameSite: 'none', secure: true });
    res.cookie('UAAT', refreshToken, { httpOnly: true, sameSite: 'none', secure: true });
    res.send(200).json({ successMsg: 'Login Success' });
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

    jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' }, (err, token) => {
      if (err) throw err;
      res.status(201).cookie('token', token, { httpOnly: true, sameSite: 'none', secure: true }).json({ successMsg: 'User successfully created.' });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

module.exports = {
  checkAuthController,
  logoutController,
  loginController,
  signUpController,
};