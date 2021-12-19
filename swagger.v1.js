const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerDefinition = {
    info: {
        title: "헥사곤",
        version: "1.0.0",
        description: "헥사곤 API DOCUMENT",
    },
    host: "https://b2e4ceh3wj.execute-api.ap-northeast-1.amazonaws.com/hax-prod-api-stage/v1",
    basePath: "/",
};

const option = {
    swaggerDefinition,
    apis: [`${__dirname}/route/v1.js`],
};

// swagger-jsdoc 초기화.
const swaggerSpec = swaggerJSDoc(option);

module.exports = {
    serve: swaggerUi.serve,
    setup: swaggerUi.setup(swaggerSpec),
    middleware: swaggerUi.serveFiles(swaggerSpec, option),
    response: (req, res) =>
        res.send(swaggerUi.generateHTML(swaggerSpec, option)),
};

/**
app.use("/doc", user.middleware);
app.get("/doc", user.response);
 */
