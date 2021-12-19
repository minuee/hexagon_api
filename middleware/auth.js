// server/middleware/auth.js

var jwt = require("jsonwebtoken");
const TokenGenerator = require("../lib/token-generator");
const keyData = require("../key/key.json");

const tokenGenerator = new TokenGenerator(
    keyData.privateKey,
    keyData.publicKey,
    {
        algorithm: "HS256",
        keyid: "1",
        noTimestamp: false,
        expiresIn: "12h",
    }
);

const signToken = (id, option) => {
    // db와 통신이 필요하다면 여기에
    return tokenGenerator.sign(
        {
            user_id: id.user_id,
            member_pk: id.member_pk,
            name: id.name,
            email: id.email,
            phone: id.phone,
            is_salesman: id.is_salesman,
            grade_code: id.grade_code,
            grade_name: id.grade_name,
            grade_rate: id.grade_rate,
            special_code: id.special_code,
        },
        {
            audience: id.member_pk,
            issuer: "superbinder",
            jwtid: id.member_pk,
            subject: "superbinder",
        }
    );
};

const refreshToken = (id, option) => {
    return tokenGenerator.sign(
        {
            member_pk: id.member_pk,
            token: id.token,
        },
        {
            issuer: "superbinder",
            subject: "superbinder",
        }
    );
};

// const refreshToken = async (req, res, next) => {
//     let token = req.headers.authorization;
//     try {
//         token = tokenGenerator.refresh(req.headers.authorization, {
//             user_id: req.body.user_id,
//         });
//     } catch (err) {
//         res.status(200).json({
//             code: "1025 ",
//             msg: "잘못된 토큰 정보",
//             err: err,
//         });
//         return;
//     }
//     return token;
// };

const isAuthenticated = async function (req, res, next) {
    // res.header('Access-Control-Allow-Origin', '*');
    // res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE');
    // res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    // res.header('Access-Control-Allow-Credentials', true);

    // var whitePath = ["/token", "/auth"];
    console.log(">>>>>>>>>>>>>>>>>>> req.path : " + req.path);
    console.log(">>>>>>>>>>>>>>>>>>> req.method : " + req.method);
    console.log(">>>>>>>>>>>>>>>>>>> req.path : " + req.path);
    console.log(">>>>>>>>>>>>>>>>>>> req.header : " + req.headers[0]);

    const exclude0 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude0");
        return req.method == "GET" && req.path.indexOf("/v1/commoncode") == 0;
    };

    const exclude1 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude1");
        return req.method == "POST" && req.path.indexOf("/v1/send/sms") == 0;
    };

    const exclude2 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude2");
        return (
            req.method == "POST" &&
            req.path.indexOf("/v1/auth/refreshtoken") == 0
        );
    };

    const exclude3 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude3");
        return (
            req.method == "POST" &&
            req.path.indexOf("/v1/settle/iamport/modify") == 0
        );
    };

    const exclude4 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude4");
        return (
            req.method == "GET" &&
            req.path.indexOf("/v1/batch/salesman/incentive") == 0
        );
    };

    const exclude5 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude5");
        return (
            req.method == "GET" &&
            req.path.indexOf("/v1/batch/member/grade/calculate") == 0
        );
    };

    const exclude6 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude6");
        return (
            req.method == "GET" &&
            req.path.indexOf("/v1/batch/order/exceed") == 0
        );
    };

    const exclude7 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude7");
        return req.method == "POST" && req.path.indexOf("/v1/auth/signin") == 0;
    };

    const exclude8 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude8");
        return req.method == "GET" && req.path.indexOf("/v1/member/check") == 0;
    };

    const exclude9 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude9");
        return (
            req.method == "PATCH" &&
            req.path.indexOf("/v1/member/password/modify") == 0
        );
    };

    const exclude10 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude10");
        return (
            req.method == "PATCH" &&
            req.path.indexOf("/v1/member/modify/phone") == 0
        );
    };

    const exclude11 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude11");
        return req.method == "POST" && req.path.indexOf("/v1/auth/signup") == 0;
    };

    const exclude12 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude12");
        return req.method == "GET" && req.path.indexOf("/v1/id-check") == 0;
    };

    const exclude13 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude13");
        return (
            req.method == "GET" && req.path.indexOf("/v1/auth/codelist") == 0
        );
    };

    const exclude14 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude14");
        return req.method == "GET" && req.path.indexOf("/v1/code-check") == 0;
    };

    const exclude15 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude15");
        return (
            req.method == "PUT" && req.path.indexOf("/cms/member/device") == 0
        );
    };

    const exclude16 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude16");
        return req.method == "GET" && req.path.indexOf("/cms/order/list") == 0;
    };

    const exclude17 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude17");
        return (
            req.method == "GET" && req.path.indexOf("/cms/category/list") == 0
        );
    };

    const exclude18 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude18");
        return (
            req.method == "GET" &&
            req.path.indexOf("/cms/category/depth/list") == 0
        );
    };

    const exclude19 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude19");
        return (
            req.method == "GET" && req.path.indexOf("/cms/product/list") == 0
        );
    };

    const exclude20 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude20");
        return (
            req.method == "GET" && req.path.indexOf("/cms/event/list/now") == 0
        );
    };

    const exclude21 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude21");
        return req.method == "GET" && req.path.indexOf("/cms/event/view") == 0;
    };

    const exclude22 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude22");
        return req.method == "GET" && req.path.indexOf("/cms/banner/list") == 0;
    };

    const exclude23 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude23");
        return req.method == "GET" && req.path.indexOf("/cms/notice/view") == 0;
    };

    const exclude24 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude24");
        return (
            req.method == "GET" && req.path.indexOf("/v1/main/basedata") == 0
        );
    };

    const exclude25 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude25");
        return (
            req.method == "GET" && req.path.indexOf("/v1/home/newarrival") == 0
        );
    };

    const exclude26 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude26");
        return (
            req.method == "GET" && req.path.indexOf("/v1/home/bestlist") == 0
        );
    };

    const exclude27 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude27");
        return req.method == "GET" && req.path.indexOf("/v1/search") == 0;
    };

    const exclude28 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude28");
        return req.method == "GET" && req.path.indexOf("/v1/order/view") == 0;
    };

    const exclude29 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude29");
        return req.method == "POST" && req.path.indexOf("/v1/img/single") == 0;
    };

    const exclude30 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude30");
        return (
            req.method == "POST" && req.path.indexOf("/v1/img/multiple") == 0
        );
    };

    const exclude31 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude31");
        return (
            req.method == "GET" &&
            req.path.indexOf("/v1/batch/reward/deadline") == 0
        );
    };

    const exclude32 = () => {
        console.log(">>>>>>>>>>>>>>>>>>> exclude32");
        return (
            req.method == "GET" &&
            req.path.indexOf("/v1/batch/order/count") == 0
        );
    };

    if (
        exclude0() ||
        exclude1() ||
        exclude2() ||
        exclude3() ||
        exclude4() ||
        exclude5() ||
        exclude6() ||
        exclude7() ||
        exclude8() ||
        exclude9() ||
        exclude10() ||
        exclude11() ||
        exclude12() ||
        exclude13() ||
        exclude14() ||
        exclude15() ||
        exclude16() ||
        exclude17() ||
        exclude18() ||
        exclude19() ||
        exclude20() ||
        exclude21() ||
        exclude22() ||
        exclude23() ||
        exclude24() ||
        exclude25() ||
        exclude26() ||
        exclude27() ||
        exclude28() ||
        exclude29() ||
        exclude30() ||
        exclude31() ||
        exclude32()
    ) {
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

        var decoded = "";

        decoded = jwt.verify(req.headers.authorization, keyData.privateKey);
        console.log(decoded);
    } catch (err) {
        console.log(err);
        if (err !== undefined && err !== null) {
            if ("jwt expired" == err.message) {
                res.status(200).json({
                    code: "1024",
                    msg: "토큰 만료",
                    err: err,
                });
                return;
            } else {
                res.status(200).json({
                    code: "1025",
                    msg: "잘못된 토큰 정보",
                    err: err,
                });
                return;
            }
        } else {
            res.status(200).json({
                code: "1025",
                msg: "잘못된 토큰 정보",
                err: err,
            });
            return;
        }
    }

    req.decoded = decoded;

    next();
};

var auth = async function (req, res, next) {
    req.signToken = signToken;
    req.refreshToken = refreshToken;
    isAuthenticated(req, res, next);
};

module.exports = auth;
