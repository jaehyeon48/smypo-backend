const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
})

function uploadAvatarToS3(fileName, fileData, userId) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `avatars/${userId}/${fileName}`,
    ContentEncoding: 'base64',
    Body: fileData
  };

  s3.upload(params, (err, data) => {
    if (err) throw err;

    console.log('File uploaded successfully to the bucket!');
  });
}

function deleteAvatarFromS3(fileName, userId) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `avatars/${userId}/${fileName}`
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