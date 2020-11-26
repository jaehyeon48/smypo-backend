const AWS = require('aws-sdk');
require('dotenv').config();

const ID = process.env.AWS_ID;
const SECRET = process.env.AWS_SECRET;

const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET
})

function uploadAvatarToS3(fileName, fileData) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `avatars/${fileName}`,
    ContentEncoding: 'base64',
    Body: fileData
  };

  s3.upload(params, (err, data) => {
    if (err) throw err;

    console.log('File uploaded successfully to the bucket!');
  });
}

function deleteAvatarFromS3(fileName) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `avatars/${fileName}`
  }

  s3.deleteObject(params, (err, data) => {
    if (err) throw err;
    else console.log('The avatar was successfully deleted from the bucket!');
  })
}

module.exports = {
  uploadAvatarToS3,
  deleteAvatarFromS3
};