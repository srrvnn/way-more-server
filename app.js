var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer = require('multer');
var cors = require('cors')
var fs = require('fs');
var os = require('os');
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
  res.json({ "msg": "saved " + req.file.filename });
});

app.post('/save', function (req, res, next) {
  var label = req.body.image.replace(getHostname(req), '') + ' ' + req.body.food + ' ' + req.body.spicy + os.EOL;
  fs.appendFile('label.txt', label, function (err) {
    if (err) throw err;
    console.log('Updated labels!');
  });
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
  res.json({total: total, trained: trained, trained_ratio: trained/total, untrained: total - trained, untrained_ratio: (total - trained)/total });
});

function getHostname(req) {
  return req.protocol + '://' + req.get('host') + '/';
}

module.exports = app;
