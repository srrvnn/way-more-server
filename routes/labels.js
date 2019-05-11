var db = require("../db");
var express = require("express");
var router = express.Router();

router.post("/", function(req, res, next) {
  if (req.body.image_url == null || req.body.image_url.length < 1) {
    res.json({
      err: true,
      message: "Image URL malformed: " + req.body.image_url
    });
    return;
  }
  let label = {
    image_url: req.body.image_url.split("/").pop(),
    food_label: req.body.food_label,
    spicy_label: req.body.spicy_label
  };
  db.insertLabel(label, function(result) {
    if (result.err) {
      res.json({
        err: result.err,
        message: "POST labels error"
      });
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*"); // do we need this?
      res.json({label: result});
    }
  });
});

module.exports = router;
