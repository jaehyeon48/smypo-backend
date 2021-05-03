const express = require('express');
const router = express.Router();

const {
  checkAuthController,
  checkUsernameAvailability,
  checkEmailAvailability,
  checkAuthOnRouteChgController,
  logoutController,
  loginController,
  signUpController
} = require('../controllers/authControllers');

const authMiddleware = require('../middlewares/authMiddleware');

// @ROUTE         GET auth
// @DESCRIPTION   check authentication
// @ACCESS        Private
router.get('/', authMiddleware, checkAuthController);


// @ROUTE         POST auth/availability/username
// @DESCRIPTION   check the availability of a username when the new user is signing in
// @ACCESS        Public
router.post('/availability/username', checkUsernameAvailability);


// @ROUTE         POST auth/availability/email
// @DESCRIPTION   check the availability of a email when the new user is signing in
// @ACCESS        Public
router.post('/availability/email', checkEmailAvailability);


// @ROUTE         GET auth/route-change
// @DESCRIPTION   check authentication on every route change
// @ACCESS        Private
router.get('/route-change', authMiddleware, checkAuthOnRouteChgController);


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