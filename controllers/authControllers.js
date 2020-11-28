const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../database/db');


// @ROUTE         GET auth
// @DESCRIPTION   check authentication
// @ACCESS        Private
async function checkAuthController(req, res) {
  try {
    const [userRow] = await pool.query(`SELECT userId, firstName, lastName, email, avatar, theme FROM users WHERE userId = '${req.user.id}'`);

    return res.status(200).json(userRow[0]);
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
    const [userRow] = await pool.query(`SELECT userId, password FROM users WHERE email = '${email}'`);

    if (userRow[0] === undefined) {
      return res.status(400).json({ errorMsg: 'Email or password is invalid.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, userRow[0].password);

    if (!isPasswordMatch) {
      return res.status(400).json({ errorMsg: 'Email or password is invalid.' });
    }

    const jwtPayload = {
      user: { id: userRow[0].userId }
    };

    jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '12h' }, (err, token) => { // set expiresIn 12h for testing purpose.
      if (err) throw err;
      res.status(200).cookie('token', token, { httpOnly: true, sameSite: 'none', secure: true }).json({ successMsg: 'Login success.' });
    });
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

    jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '12h' }, (err, token) => { // set expiresIn 12h for testing purpose.
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