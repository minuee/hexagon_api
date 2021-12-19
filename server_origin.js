//------------------------------------------------
// require

var express = require("express");
var bodyParser = require("body-parser");
// var awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
// var { awsMiddleware, httpMiddleware } = require("@psyrenpark/express-lib");
const cors = require("cors");
// const swaggerUi = require("swagger-ui-express");
// const swaggerDocument = require("./swagger.json");

//------------------------------------------------
// env
const envJson = require(`${__dirname}/env/env.json`);
const uploadFilePath = envJson.uploadFilePath;
const port = envJson.port ? envJson.port : 3001;

var app = express();
// app.use(awsServerlessExpressMiddleware.eventContext());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var corsOptions = {
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://b2e4ceh3wj.execute-api.ap-northeast-1.amazonaws.com",
        "http://hg-prod-cms.s3-website-ap-northeast-1.amazonaws.com",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header(
//         "Access-Control-Allow-Headers",
//         "Origin, X-Requested-With, Content-Type, Accept"
//     );
//     next();
// });

// doc
const cms = require("./swagger.cms");
app.use("/v1/doc/cms", cms.middleware);
app.get("/v1/doc/cms", cms.response);

const v1 = require("./swagger.v1");
app.use("/v1", v1.middleware);
app.get("/v1", v1.response);

// app.use(require(`${__dirname}/middleware/db`));
// app.use(require(`${__dirname}/middleware/jwt`));
app.use(require(`${__dirname}/middleware/auth`));
// app.use(require(`${__dirname}/middleware/jwtAuth`));
// app.use(require(`${__dirname}/middleware/file`));
// app.use(require(`${__dirname}/middleware/http`));
// app.use(require(`${__dirname}/middleware/aws`));
// app.use(require(`${__dirname}/middleware/firebase`));
// app.use(require(`${__dirname}/middleware/googleapi`));
// app.use(require(`${__dirname}/middleware/appsyncExcuter`));

// 미들웨어 db와 auth 다음
// app.use(awsMiddleware); // aws 관련 함수
// app.use(httpMiddleware); // 통신 관련 함수

// // router
app.use("/v1", require(`${__dirname}/route/v1`));
app.use("/cms", require(`${__dirname}/route/cms`));
app.use("/v1/batch", require(`${__dirname}/route/batch`));
// app.use("/cdn/v1", require(`${__dirname}/route/cdn_v1`));

app.get("/", function (req, res) {
    res.send("Hello hexagon----");
});

app.listen(3000, function () {
    console.log("App started");
});

module.exports = app;

// app.disable('x-powered-by')
// init
// app.use(require(`${__dirname}/init/sequelizeInit`));

// logger
// app.use(require(`${__dirname}/logger/myLogger`));

// logger
// app.use(require(`${__dirname}/logger/myLogger`));

// exception
// var exception = require(`${__dirname}/exception/exception`);
// app.use(exception.logErrors);
// app.use(exception.clientErrorHandler);
// app.use(exception.errorHandler);

// middleware
// app.use(require(`${__dirname}/middleware/userAgentMiddleware`));
// app.use(require(`${__dirname}/middleware/authMiddleware`));
// app.use("/v1/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
