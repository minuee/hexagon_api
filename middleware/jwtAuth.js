var jwt = require("jsonwebtoken");
const TokenGenerator = require("../lib/token-generator");
const keyData = require("../key/key.json");

const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    api_version: "2012-08-10",
});

const getToken = (user_id, key_id, expiresIn) => {
    const tokenGen = new TokenGenerator(keyData.privateKey, keyData.publicKey, {
        algorithm: "HS256",
        keyid: key_id,
        noTimestamp: false,
    });

    // db와 통신이 필요하다면 여기에
    return tokenGen.sign(
        {
            iat: Date.now(),
        },
        {
            audience: "myaud",
            issuer: "myissuer",
            jwtid: Date.now().toString(),
            subject: user_id,
            expiresIn,
        }
    );
};

const tokenRefresh = (key_id, token, expiresIn) => {
    const tokenGen = new TokenGenerator(keyData.privateKey, keyData.publicKey, {
        algorithm: "HS256",
        keyid: key_id,
        noTimestamp: false,
    });

    return tokenGen.refresh(token, {
        verify: { audience: "myaud", issuer: "myissuer", expiresIn },
        jwtid: key_id,
    });
};

const isAuthenticated = async function (req, res, next) {
    // res.header('Access-Control-Allow-Origin', '*');
    // res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE');
    // res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    // res.header('Access-Control-Allow-Credentials', true);

    console.log(">>>>>>>>>>>>>>>>>>> req.path : " + req.path);
    console.log(
        ">>>>>>>>>>>>>>>>>>> req.session : " + JSON.stringify(req.session)
    );
    console.log(">>>>>>>>>>>>>>>>>>> req.method : " + req.method);
    console.log(">>>>>>>>>>>>>>>>>>> req.path : " + req.path);
    
    const excludeRefresh = () => {
        console.log(">>>>>>>>>>>>>>>>>>> excludeRefresh");
        return req.path == "/v1/AUTH_REFRESH";
    };

    const exclude0 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude0");
        return (
            req.method == "POST" && req.path.indexOf("/v1/auth/sign-up") == 0
        );
    };

    const exclude1 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude1");
        return req.method == "POST" && req.path.indexOf("/v1/send_sms") == 0;
    };

    const exclude2 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude2");
        return req.method == "GET" && req.path.indexOf("/v1/commoncode") == 0;
    };

    const exclude3 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude3");
        return req.method == "GET" && req.path.indexOf("/auth/codelist") == 0;
    };

    //   const exclude4 = () =>{
    //     console.log('>>>>>>>>>>>>>>>>>>> exclude4');
    //     return (req.method == "GET" && req.path.indexOf('/shuttleb/cms/img_upload') == 0);
    //   }

    //   const exclude5 = () =>{
    //     console.log('>>>>>>>>>>>>>>>>>>> exclude5');
    //     return (req.method == "GET" && req.path.indexOf('/shuttleb/cms/SHUTTLEB_CMS_API_00001_1') == 0);
    //   }

    //   const exclude6 = () =>{
    //     console.log('>>>>>>>>>>>>>>>>>>> exclude6');
    //     return (req.method == "GET" && req.path.indexOf('/shuttleb/cms/SHUTTLEB_CMS_API_00002') == 0);
    //   }

    //   const exclude7 = () =>{
    //     console.log('>>>>>>>>>>>>>>>>>>> exclude7');
    //     return (req.method == "GET" && req.path.indexOf('/shuttleb/cms/SHUTTLEB_CMS_API_00003') == 0);
    //   }

    let decodedWithHeader = "";
    let decodedHeader = "";
    let decoded = "";

    if (excludeRefresh()) {
        // req.body.refreshToken;
        // req.headers.authorization
        let userRefreshToken = req.body.refreshToken;
        decodedWithHeader = jwt.decode(userRefreshToken, { complete: true });
        decoded = decodedWithHeader.payload;
        decodedHeader = decodedWithHeader.header;

        console.log(decodedWithHeader);
        console.log(decoded);
        console.log(decodedHeader);

        const user_id = decoded.sub;

        console.log(Date.now());
        console.log(decoded.exp);

        if (Date.now() - decoded.exp > 30 * 24 * 60 * 60 * 1000) {
            res.status(401).send({
                msg: "expired",
                code: "REFRESH_TOKEN_EXPIRED",
            });
            return;
        }

        const pk = user_id;
        const sk = "USER_INFO";

        let params = {
            TableName: "PK-S-SK-S",
            Key: {
                PK: pk,
                SK: sk,
            },
        };

        let userInfo = await docClient.get(params).promise();
        console.log(userInfo);

        if (decodedHeader.kid !== userInfo.Item.TOKEN_KEY) {
            res.status(401).send({
                msg: "expired",
                code: "REFRESH_TOKEN_EXPIRED",
            });
            return;
        }

        if (userRefreshToken !== userInfo.Item.RT) {
            res.status(401).send({
                msg: "expired",
                code: "REFRESH_TOKEN_EXPIRED",
            });
            return;
        }

        let accessToken = getToken(
            userInfo.Item.PK,
            userInfo.Item.TOKEN_KEY,
            60 * 60 * 1000
        );

        res.json({ accessToken, userRefreshToken });

        return;
    }

    if (exclude0() || exclude1() || exclude2() || exclude3) {
        next();
        console.log(">>>>>>>>>>>>>>>>>>> next");
        return;
    }

    console.log(">>>>>>>>>>>>>>>>> pass ");

    try {
        console.log(">>>>>>>>>>>>>>>>> privateKey : " + keyData.privateKey);
        console.log(
            ">>>>>>>>>>>>>>>>> authorization : " + req.headers.authorization
        );

        if (!req.headers.authorization) {
            res.status(401).send({ msg: "jwt expired", code: "TOKEN_INVALID" });
            return;
        }

        const isVisitor = req.headers.authorization === "VISITOR";
        req.isVisitor = isVisitor;

        if (isVisitor) {
            // req.user_id = decoded.sub;
            // req.user_email = userInfo.Item.USER_EMAIL.toLowerCase();
            // req.user_no = userInfo.Item.USER_NO;
            // req.signup_cd_id = userInfo.Item.SIGNUP_CD_ID;
            // req.mobile_no = userInfo.Item.MOBILE_NO;
        } else {
            decodedWithHeader = jwt.decode(req.headers.authorization, {
                complete: true,
            });
            decoded = decodedWithHeader.payload;
            decodedHeader = decodedWithHeader.header;

            console.log(decodedWithHeader);
            console.log(decoded);
            console.log(decodedHeader);

            const user_id = decoded.sub;
            console.log(Date.now());
            console.log(decoded.exp);

            if (Date.now() - decoded.exp > 60 * 60 * 1000) {
                res.status(401).send({
                    msg: "expired",
                    code: "ACCESS_TOKEN_EXPIRED",
                });
                return;
            }

            const pk = user_id;
            const sk = "USER_INFO";

            let params = {
                TableName: "PK-S-SK-S",
                Key: {
                    PK: pk,
                    SK: sk,
                },
            };

            let userInfo = await docClient.get(params).promise();

            if (decodedHeader.kid !== userInfo.Item.TOKEN_KEY) {
                res.status(401).send({
                    msg: "expired",
                    code: "ACCESS_TOKEN_EXPIRED",
                });
                return;
            }

            // console.log(userInfo);
            console.log(userInfo.Item);

            req.user_id = decoded.sub;

            req.user_email = userInfo.Item.EMAIL;
            req.user_no = userInfo.Item.USER_NO;
            req.signup_cd_id = userInfo.Item.SIGNUP_CD_ID;
            req.mobile_no = userInfo.Item.MOBILE_NO;
        }
    } catch (err) {
        console.log(err);
        if (err !== undefined && err !== null) {
            if ("jwt expired" == err.message) {
                res.status(401).send({ msg: "jwt expired" });
                return;
            } else {
                res.status(401).send({ msg: "잘못된 토큰 정보" });
                return;
            }
        } else {
            res.status(401).send({ msg: "잘못된 토큰 정보" });
            return;
        }
    }

    // req.decoded = decoded;

    next();
};

var auth = async function (req, res, next) {
    req.getToken = getToken;
    req.tokenRefresh = tokenRefresh;
    isAuthenticated(req, res, next);
};

module.exports = auth;
