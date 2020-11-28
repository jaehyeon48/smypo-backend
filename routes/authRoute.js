const express = require('express');
const router = express.Router();

const {
  checkAuthController,
  logoutController,
  loginController,
  signUpController
} = require('../controllers/authControllers');

const authMiddleware = require('../middlewares/authMiddleware');

// @ROUTE         GET auth
// @DESCRIPTION   check authentication
// @ACCESS        Private
router.get('/', authMiddleware, checkAuthController);


// @ROUTE         GET auth/logout
// @DESCRIPTION   Logout the user
// @ACCESS        Private
router.get('/logout', authMiddleware, logoutController);


// @ROUTE         POST auth/login
// @DESCRIPTION   Login user
// @ACCESS        Public
router.post('/login', loginController);


// @ROUTE         POST auth/signup
// @DESCRIPTION   Register user
// @ACCESS        Public
router.post('/signup', signUpController);

module.exports = router;