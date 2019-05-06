var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer = require('multer');
var cors = require('cors')
var fs = require('fs');
var os = require('os');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY})

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public')
  },
  filename: function (req, file, cb) {
    fileExtension = file.originalname.split(/[. ]+/).pop();
    if (['jpg', 'png'].includes(fileExtension)) {
      cb(null, 'corpus' + Date.now() + '.' + fileExtension);
    }
  }
})
var upload = multer({ storage: storage });

var indexRouter = require('./routes/index');

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.post('/upload', upload.single('fileKey'), function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");  
  res.json({ "msg": "saved " + req.file.filename });
});

app.post('/save', function (req, res, next) {
  var label = req.body.image.replace(getHostname(req), '') + ' ' + req.body.food + ' ' + req.body.spicy + os.EOL;
  fs.appendFile('label.txt', label, function (err) {
    if (err) throw err;
    console.log('Updated labels!');
  });
  res.setHeader("Access-Control-Allow-Origin", "*");  
  res.json({ "msg": "saved"});
});

app.get('/train', function (req, res) {
  var itemsResponse = {items : []};
  var labels = '';
  try {
    labels = fs.readFileSync('label.txt', 'utf8');
  } catch (err) {
    console.log('labels file does not exist');
  }
  fs.readdirSync('public/').forEach(file => {
    if (file.includes('corpus') && !labels.includes(file)) {
      itemsResponse.items.push({
        train: true,
        image: getHostname(req) + file,
        food: null,
        spicy: null,
      });
    }
  });
  res.setHeader("Access-Control-Allow-Origin", "*");  
  res.json(itemsResponse);
});

app.get('/corpus', function (req, res) {
  var total = 0;
  var trained = 0; 
  var labels = '';
  try {
    labels = fs.readFileSync('label.txt', 'utf8');
  } catch (err) {
    console.log('labels file does not exist');
  }
  fs.readdirSync('public/').forEach(file => {
    if (file.includes('corpus')) {
      total++;
      if (labels.includes(file)) {
        trained++;
      }
    }
  });
  res.setHeader("Access-Control-Allow-Origin", "*");  
  res.json({total: total, trained: trained, trained_ratio: trained/total, untrained: total - trained, untrained_ratio: (total - trained)/total });
});

app.get('/s3signedurl', function(req, res) {
  var fileurls = [];

  const signed_url_ttl = 60 * 60;
  const bucket_name = process.env.S3_BUCKET_NAME;
  const file_name = 'corpus' + Date.now() + '.' + req.body.file_type; 
  const content_type = 'image/' + req.body.file_type;

  const params = {Bucket: bucket_name, Key: file_name, Expires: signed_url_ttl, ACL: 'bucket-owner-full-control', ContentType: content_type};

  s3.getSignedUrl('putObject', params, function(err, url) {
    if (err) {
      console.log('Error getting signed URL from S3.');
      res.json({ success: false, message: 'Signed ULR error', urls: fileurls});
    } else {
      filesurls[0] = url;
      console.log('Signed URL: ', fileurls[0]);
      res.json({success: true, message: 'AWS S3 Signed URL generated successfully.', urls: fileurls})
    }
  });
});

function getHostname(req) {
  return req.protocol + '://' + req.get('host') + '/';
}

module.exports = app;
