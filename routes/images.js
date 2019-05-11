const db = require("../db");
const aws = require("../aws");
const express = require("express");
var router = express.Router();

router.get("/untrained", function(req, res, next) {
  var responseObject = { items: [] };
  var trainedImageUrls = {};

  db.selectLabel(function(result) {
    if (result.err) {
      res.json({
        message: "GET untrianed images error",
        err: result.err
      });
    }

    result.forEach(function(row) {
      trainedImageUrls[row["image_url"]] = true;
    });

    aws.listObjects(function(data) {
      if (data.err) {
        res.json({
          message: "GET untrianed images error",
          err: result.err
        });
      }

      data.forEach(function(content) {
        if (trainedImageUrls[content.Key]) {
          return;
        }
        responseObject.items.push({
          untrained: true,
          image_url:
            "https://s3.amazonaws.com/" +
            process.env.S3_BUCKET_NAME +
            "/" +
            content.Key,
          food_label: null,
          spicy_label: null
        });
      });

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.json(responseObject);
    });
  });
});

router.get("/", function(req, res, next) {
  var total = 0;
  var trained = 0;

  db.selectLabel(function(result) {
    if (result.err) {
      res.json({
        message: "GET untrianed images error",
        err: result.err
      });
    }

    trained = result.length;

    aws.listObjects(function(data) {
      if (data.err) {
        res.json({
          message: "GET untrianed images error",
          err: result.err
        });
      }

      total = data.length;

      responseObject = calculatRatios(total, trained);
      responseObject.images = [];

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.json(responseObject);
    });
  });
});

router.post("/", function(req, res, next) {
  aws.getSignedUrl(req.query.extension, req.query.content_type, function(url) {
    if (url.err) {
      console.error("Error generating signed URL from S3.");
      res.json({
        err: true,
        message: "Signed AWS URL error"
      });
    } else {
      res.json({
        message: "Success generating AWS S3 Signed URL.",
        url: url
      });
    }
  });
});

function calculatRatios(total, trained) {
  return {
    total: total,
    trained: trained,
    trained_ratio: trained / total,
    untrained: total - trained,
    untrained_ratio: (total - trained) / total
  };
}

module.exports = router;
