var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var config = require("dotenv").config();
var app = express();

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/labels", require("./routes/labels"));
app.use("/images", require("./routes/images"));

// Use GET images/untrained
app.get("/train", function(req, res) {});

// Use GET images
app.get("/corpus", function(req, res) {});

// Use POST labels/
app.post("/save", function(req, res, next) {});

// use GET aws/signed
app.get("/s3signedurl", function(req, res) {});

module.exports = app;
