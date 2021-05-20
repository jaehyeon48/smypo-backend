const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const fileUploadMiddleware = require('../middlewares/fileUploadMiddleware');

const {
  uploadAvatar,
  editUser,
  editPassword,
  confirmPassword,
  deleteUser,
  deleteAvatar
} = require('../controllers/userControllers');


// @ROUTE         POSt api/user/avatar
// @DESCRIPTION   Upload user's avatar
// @ACCESS        Private
router.post('/avatar', [
  authMiddleware,
  fileUploadMiddleware.single('avatar')
], uploadAvatar);


// @ROUTE         POST user/confirm-password
// @DESCRIPTION   Confirm user's password
// @ACCESS        Private
router.post('/confirm-password', authMiddleware, confirmPassword);


// @ROUTE         PUT api/user/profile
// @DESCRIPTION   Edit User's profile
// @ACCESS        Private
router.put('/profile', authMiddleware, editUser);


// @ROUTE         PUT api/user/profile
// @DESCRIPTION   Edit User's profile
// @ACCESS        Private
router.put('/password', authMiddleware, editPassword);


// @ROUTE         DELETE api/user
// @DESCRIPTION   Delete user's account and all of its related information
// @ACCESS        Private
router.delete('/', authMiddleware, deleteUser);


// @ROUTE         DELETE user/avatar
// @DESCRIPTION   Delete user's avatar
// @ACCESS        Private
router.delete('/avatar', authMiddleware, deleteAvatar);

module.exports = router;