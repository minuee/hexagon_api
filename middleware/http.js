const axios = require("axios");

var http = async function (req, res, next) {
  req.http = axios;
  next();
};

module.exports = http;
