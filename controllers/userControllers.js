const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database/db');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');


const {
  uploadAvatarToS3,
  deleteAvatarFromS3
} = require('../utils/aws_s3');

// @ROUTE         GET user/avatar
// @DESCRIPTION   Get user's avatar
// @ACCESS        Private
async function getAvatar(req, res) {
  const userId = req.user.id;

  try {
    const [userAvatarRow] = await pool.query('SELECT avatar FROM user WHERE userId = ?', [userId]);
    return res.status(200).json({ avatar: userAvatarRow[0].avatar });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         POST user/avatar
// @DESCRIPTION   Upload user's avatar
// @ACCESS        Private
async function uploadAvatar(req, res) {
  const userId = req.user.id;
  const MIME_TYPE_MAP = {
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/jpeg': 'jpeg'
  };
  try {
    const avatarFileName = `${uuidv4()}.${MIME_TYPE_MAP[req.file.mimetype]}`;
    const [previousFile] = await pool.query('SELECT avatar FROM user WHERE userId = ?', [userId]);
    if (previousFile[0].avatar) {
      deleteAvatarFromS3(previousFile[0].avatar);
      console.log(`file ${previousFile[0].avatar} was deleted!`);
    };

    await pool.query(`UPDATE user SET avatar = ? WHERE userId = ?`, [avatarFileName, userId]);
    uploadAvatarToS3(avatarFileName, Buffer.from(req.file.buffer, 'base64'));
    return res.status(200).json({ avatar: avatarFileName });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         PUT user
// @DESCRIPTION   Edit User's profile
// @ACCESS        Private
async function editUser(req, res) {
  const userId = req.user.id;
  const { firstName, lastName, currentPassword } = req.body;
  let { newPassword } = req.body;
  let isCurrentPasswordMatch;
  try {
    const [isUserExist] = await pool.query('SELECT userId FROM user WHERE userId = ?', [userId]);

    if (!isUserExist[0]) {
      return res.status(400).json({ errorMsg: 'The user does not exist.' });
    }

    if (currentPassword && newPassword) {
      const [userPasswordRow] = await pool.query('SELECT password FROM user WHERE userId = ?', [userId]);
      isCurrentPasswordMatch = await bcrypt.compare(currentPassword, userPasswordRow[0].password);

      if (!isCurrentPasswordMatch) {
        return res.status(400).json({ errorMsg: 'Current password does not match.' });
      }

      newPassword = await bcrypt.hash(newPassword, 10);

      await pool.query(`UPDATE user SET firstName = ?, lastName = ?, password = '?' WHERE userId = ?`,
        [firstName, lastName, newPassword, userId]);
    } else {
      await pool.query('UPDATE user SET firstName = ?, lastName = ? WHERE userId = ?',
        [firstName, lastName, userId]);
    }
    return res.status(200).json({ successMsg: 'User profile successfully updated' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         DELETE user
// @DESCRIPTION   Delete user's account and all of its related information
// @ACCESS        Private
async function deleteUser(req, res) {
  const userId = req.user.id;
  try {
    const [isUserExist] = await pool.query('SELECT userId FROM user WHERE userId = ?', [userId]);

    if (!isUserExist[0]) {
      return res.status(400).json({ errorMsg: 'The user does not exist.' });
    }

    await pool.query('DELETE FROM cash WHERE userId = ?', [userId]);
    await pool.query('DELETE FROM stock WHERE userId = ?', [userId]);
    await pool.query('DELETE FROM defaultPortfolio WHERE userId = ?', [userId]);
    await pool.query('DELETE FROM portfolio WHERE userId = ?', [userId]);
    await pool.query('DELETE FROM user WHERE userId = ?', [userId]);

    res.status(200).json({ successMsg: 'The account successfully deleted!' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

module.exports = {
  getAvatar,
  uploadAvatar,
  editUser,
  deleteUser
};