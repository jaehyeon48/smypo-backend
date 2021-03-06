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
      deleteAvatarFromS3(previousFile[0].avatar, userId);
      console.log(`file ${previousFile[0].avatar} was deleted!`);
    };

    await pool.query(`UPDATE user SET avatar = ? WHERE userId = ?`, [avatarFileName, userId]);
    uploadAvatarToS3(avatarFileName, Buffer.from(req.file.buffer, 'base64'), userId);
    new Promise(resolve => setTimeout(resolve, 500)); // wait 500ms for the latency while saving the image into S3
    return res.status(200).json({ avatar: avatarFileName });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         POST user/confirm-password
// @DESCRIPTION   Confirm user's password
// @ACCESS        Private
async function confirmPassword(req, res) {
  const userId = req.user.id;
  const { confirmPassword } = req.body;

  try {
    const [userPasswordRow] = await pool.query('SELECT password FROM user WHERE userId = ?', [userId]);
    isCurrentPasswordMatch = await bcrypt.compare(confirmPassword, userPasswordRow[0].password);

    if (!isCurrentPasswordMatch) {
      return res.status(200).json(-2);
    }
    res.status(200).json(0);
  } catch (error) {
    console.error(error);
    res.status(200).json(-1);
  }
}

// @ROUTE         PUT user/profile
// @DESCRIPTION   Edit User's profile
// @ACCESS        Private
async function editUser(req, res) {
  const userId = req.user.id;
  const { firstName, lastName, username } = req.body;
  try {
    const [isUserExist] = await pool.query('SELECT userId FROM user WHERE userId = ?', [userId]);

    if (!isUserExist[0]) {
      return res.status(400).json({ errorMsg: 'The user does not exist.' });
    }
    await pool.query(`
    UPDATE user 
    SET firstName = ?, lastName = ?, username = ?
    WHERE userId = ?`, [firstName, lastName, username, userId]);
    return res.status(200).json({ successMsg: 'User profile successfully updated' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         PUT user/password
// @DESCRIPTION   Edit User's profile
// @ACCESS        Private
async function editPassword(req, res) {
  const userId = req.user.id;
  const { currentPassword } = req.body;
  let { newPassword } = req.body;

  try {
    const [userPasswordRow] = await pool.query('SELECT password FROM user WHERE userId = ?', [userId]);
    isCurrentPasswordMatch = await bcrypt.compare(currentPassword, userPasswordRow[0].password);

    if (!isCurrentPasswordMatch) {
      return res.status(200).json(-2);
    }

    newPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(`UPDATE user SET password = ? WHERE userId = ?`,
      [newPassword, userId]);
    res.status(200).json(0);
  } catch (error) {
    console.log(error);
    res.status(200).json(-1);
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
      return res.status(200).json(-2);
    }

    // delete avatar
    const [previousFile] = await pool.query('SELECT avatar FROM user WHERE userId = ?', [userId]);
    if (previousFile[0].avatar) {
      deleteAvatarFromS3(previousFile[0].avatar, userId);
    };

    await pool.query('DELETE FROM dailyRecord WHERE userId = ?', [userId]);
    await pool.query('DELETE FROM cash WHERE userId = ?', [userId]);
    await pool.query('DELETE FROM realizedStock WHERE userId = ?', [userId]);
    await pool.query('DELETE FROM stock WHERE userId = ?', [userId]);
    await pool.query('DELETE FROM defaultPortfolio WHERE userId = ?', [userId]);
    await pool.query('DELETE FROM portfolio WHERE userId = ?', [userId]);
    await pool.query('DELETE FROM user WHERE userId = ?', [userId]);

    res.status(200).json(0);
  } catch (error) {
    console.log(error);
    return res.status(200).json(-1);
  }
}


// @ROUTE         DELETE user/avatar
// @DESCRIPTION   Delete user's avatar
// @ACCESS        Private
async function deleteAvatar(req, res) {
  const userId = req.user.id;

  try {
    const [previousFile] = await pool.query('SELECT avatar FROM user WHERE userId = ?', [userId]);
    if (previousFile[0].avatar) {
      deleteAvatarFromS3(previousFile[0].avatar, userId);
    };
    res.status(200).json(0);
  } catch (error) {
    console.log(error);
    res.status(200).json(-1);
  }
}

module.exports = {
  getAvatar,
  uploadAvatar,
  editUser,
  editPassword,
  confirmPassword,
  deleteUser,
  deleteAvatar
};