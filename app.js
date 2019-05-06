var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')
var fs = require('fs');
var os = require('os');
var AWS = require('aws-sdk');
var s3 = new AWS.S3({accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY})
require('dotenv').config();

var pg = require("pg");

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});
client.connect();


var app = express();
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/save', function (req, res, next) {
  var query = 'INSERT INTO waymo_spice_labels (image_url, food_label, spicy_label) VALUES (\'' + req.body.image.split('/').pop() + '\', ' + req.body.food + ', ' + req.body.spicy + ');';
  console.log(query);
  client.query(query, (err, result) => {
    if (err) throw err;
    for (let row of result.rows) {
      console.log(JSON.stringify(row));
    }
    res.setHeader("Access-Control-Allow-Origin", "*");  
    res.json({ "msg": "saved"});
  });
});

app.get('/train', function (req, res) {
  var itemsResponse = {items : []};
  var trainedItems = {};
  var query = 'SELECT image_url FROM waymo_spice_labels';
  console.log(query);
  client.query(query, (err, result) => {
    if (err) throw err;
    for (let row of result.rows) {
      trainedItems[row["image_url"]] = true;
    }
    

  var params = { 
    Bucket: 'waymo-spice-corpus',
   }
    s3.listObjects(params, function (err, data) {
      if(err)throw err;
      data.Contents.forEach(function(content) {
        if (!trainedItems[content.Key]) {
        itemsResponse.items.push({
          train: true,
          image: 'https://s3.amazonaws.com/' + data.Name + '/' + content.Key,
          food: null,
          spicy: null,
        });
      }
      });
      res.setHeader("Access-Control-Allow-Origin", "*");  
      res.json(itemsResponse);
     });
  });
});

app.get('/corpus', function (req, res) {
  var total = 0;
  var trained = 0; 

  client.query('SELECT image_url FROM waymo_spice_labels;', (err, result) => {
    if (err) throw err;
    for (let row of result.rows) {
      trained++;
    }
    var params = { 
      Bucket: 'waymo-spice-corpus',
     }
     
     s3.listObjects(params, function (err, data) {
      if(err)throw err;
      
      total = data.Contents.length;
      res.setHeader("Access-Control-Allow-Origin", "*");  
      res.json({total: total, trained: trained, trained_ratio: trained/total, untrained: total - trained, untrained_ratio: (total - trained)/total });
     });
  });
});

app.get('/s3signedurl', function(req, res) {
  var fileurls = [];

  const signed_url_ttl = 60 * 60;
  const bucket_name = process.env.S3_BUCKET_NAME;
  const file_name = 'corpus' + Date.now() + '.' + req.query.extension; 
  const content_type = req.query.content_type;

  const params = {Bucket: bucket_name, Key: file_name, Expires: signed_url_ttl, ACL: 'bucket-owner-full-control', ContentType: content_type};

  s3.getSignedUrl('putObject', params, function(err, url) {
    if (err) {
      console.log('Error getting signed URL from S3.');
      res.json({ success: false, message: 'Signed URL error', urls: fileurls});
    } else {
      fileurls[0] = url;
      console.log('Signed URL: ', fileurls[0]);
      res.json({success: true, message: 'AWS S3 Signed URL generated successfully.', urls: fileurls})
    }
  });
});

function getHostname(req) {
  return req.protocol + '://' + req.get('host') + '/';
}

module.exports = app;
