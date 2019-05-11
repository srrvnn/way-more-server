const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
const bucket_name = process.env.S3_BUCKET_NAME;

const api = {
  getSignedUrl: function(extension, content_type, cb) {
    const params = {
      Bucket: bucket_name,
      Key: "corpus" + Date.now() + "." + extension,
      Expires: 60 * 60,
      ACL: "bucket-owner-full-control",
      ContentType: content_type
    };

    s3.getSignedUrl("putObject", params, function(err, url) {
      if (err) {
        cb({ err: err });
      } else {
        cb(url);
      }
    });
  },
  listObjects: function(cb) {
    const params = {
      Bucket: bucket_name
    };
    s3.listObjects(params, function(err, data) {
      if (err) {
        cb({ err: err });
      } else {
        cb(data.Contents);
      }
    });
  }
};

module.exports = api;
