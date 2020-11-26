const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const fileUploadMiddleware = require('../middlewares/fileUploadMiddleware');

const {
  uploadAvatar,
  editUser,
  deleteUser
} = require('../controllers/userControllers');


// @ROUTE         POSt api/user/avatar
// @DESCRIPTION   Upload user's avatar
// @ACCESS        Private
router.post('/avatar', [
  authMiddleware,
  fileUploadMiddleware.single('avatar')
], uploadAvatar);

// @ROUTE         PUT api/user
// @DESCRIPTION   Edit User's profile
// @ACCESS        Private
router.put('/', authMiddleware, editUser);


// @ROUTE         DELETE api/user
// @DESCRIPTION   Delete user's account and all of its related information
// @ACCESS        Private
router.delete('/', authMiddleware, deleteUser);

module.exports = router;