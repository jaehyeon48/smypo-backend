const express = require('express');
const router = express.Router();

const {
  checkAuthController,
  logoutController,
  loginController,
  signUpController
} = require('../controllers/authControllers');

const authMiddleware = require('../middlewares/authMiddleware');

// @ROUTE         GET api/auth
// @DESCRIPTION   check authentication
// @ACCESS        Private
router.get('/', authMiddleware, checkAuthController);


// @ROUTE         GET api/auth/logout
// @DESCRIPTION   Logout the user
// @ACCESS        Private
router.get('/logout', authMiddleware, logoutController);


// @ROUTE         POST api/auth/login
// @DESCRIPTION   Login user
// @ACCESS        Public
router.post('/login', loginController);


// @ROUTE         POST api/auth/signup
// @DESCRIPTION   Register user
// @ACCESS        Public
router.post('/signup', signUpController);

module.exports = router;