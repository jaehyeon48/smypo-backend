const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const MIME_TYPE_MAP = {
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/jpeg': 'jpeg'
};

const fileUploadMiddleware = multer({
  limits: 500000, // 5KB
  fileFilter: (req, file, cb) => {
    const isValidExtension = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValidExtension ? null : new Error('Invalid mime-type!');
    cb(error, isValidExtension);
  }
});

module.exports = fileUploadMiddleware;