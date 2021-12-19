var AWS = require("aws-sdk");
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
});

var cognito = async function (req, res, next) {
  req.cognito = cognitoidentityserviceprovider;
  next();
};

module.exports = cognito;
