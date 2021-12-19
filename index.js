const awsServerlessExpress = require("aws-serverless-express");
const app = require("./server");

const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => {
  console.log("prod");
  console.log(`EVENT: ${JSON.stringify(event)}`);
  awsServerlessExpress.proxy(server, event, context);
};
