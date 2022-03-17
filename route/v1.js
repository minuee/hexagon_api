const express = require("express");
const app = express.Router();

const { isNull } = require("../lib/util");

const AWS = require("aws-sdk");
const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const keyData = require("../key/awsconfig.json");
var jwt = require("jsonwebtoken");
const key = require("../key/key.json");

const s3 = new AWS.S3({
    accessKeyId: keyData.AccessKeyId, // user 만들면서 지급받은 키값
    secretAccessKey: keyData.secretAccessKey,
    region: "ap-northeast-1",
});

const imageFilter = function (req, file, cb) {
    if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|gif|heic)$/)) {
        console.log(file.originalname.toLowerCase());
        console.log("file_console");
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};

const upload = multer({
    fileFilter: imageFilter,
    storage: multerS3({
        limits: {
            fieldSize: 1024 * 1024 * 25,
        },
        s3: s3,
        bucket: "hg-prod-file",
        contentType: multerS3.AUTO_CONTENT_TYPE, // 자동을 콘텐츠 타입 세팅
        acl: "public-read",
        key: function (req, file, cb) {
            try {
                if (req.path.indexOf("single") != -1) {
                    cb(
                        null,
                        "public/" +
                            req.body.folder +
                            "/" +
                            Date.now() +
                            "_s1" +
                            path.extname(file.originalname)
                    );
                } else if (req.path.indexOf("multiple") != -1) {
                    cb(
                        null,
                        "public/" +
                            req.body.folder +
                            "/" +
                            Date.now() +
                            "_m" +
                            req.files.img.length +
                            path.extname(file.originalname)
                    );
                }
            } catch (error) {
                console.error(error);
            }
        },
    }),
});

app.get("/commoncode", async (req, res) => {
    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.012",
            { language: "sql", indent: " " }
        );

        const selectQuery2 = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.013",
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectResult2 = await req.sequelize.query(selectQuery2, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "코드 뱅크 및 공용 코드",
            data: {
                common: selectResult2,
                codebank: selectResult,
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "코드 뱅크 및 공용 코드",
            err: String(err),
        });
    }
});

app.post("/send/sms", async (req, res) => {
    const form_phone = isNull(req.body.form_phone, null);
    const form_code = isNull(req.body.form_code, null);

    if ([form_phone, form_code].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    const param = {
        phone: form_phone,
        msg: "[헥사곤] 인증번호 [" + form_code + "]를 입력해주세요.",
        title: "헥사곤 인증문자입니다.",
    };

    try {
        const sendSms = await req.sms.sendSMS(param);

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "코드 발송",
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "코드 발송",
            err: String(err),
        });
    }
});

app.get("/auth/codelist", async (req, res) => {
    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.015",
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "6자리코드현황조회",
            data: selectResult,
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "6자리코드현황조회",
            err: String(err),
        });
    }
});

app.post("/auth/signup", async (req, res) => {
    const user_id = isNull(req.body.user_id, null);
    const email = isNull(req.body.email, null);
    const phone = isNull(req.body.phone, null);
    const special_code = isNull(req.body.special_code, null);
    const img_url = isNull(req.body.img_url, null);
    const name = isNull(req.body.name, null);
    const agent_code = isNull(req.body.agent_code, null);
    const company_name = isNull(req.body.company_name, null);
    const company_type = isNull(req.body.company_type, null);
    const business_code = isNull(req.body.business_code, null);
    const company_class = isNull(req.body.company_class, null);
    const company_address = isNull(req.body.company_address, null);
    const company_zipcode = isNull(req.body.company_zipcode, null);
    const company_ceo = isNull(req.body.company_ceo, null);
    const company_phone = isNull(req.body.company_phone, null);
    const code_img = isNull(req.body.code_img, null);
    const password = isNull(req.body.password, null);
    const grade_start = isNull(req.body.grade_start, null);
    const grade_end = isNull(req.body.grade_end, null);
    const recomm_code = isNull(req.body.recomm_code, null);
    const device_id = isNull(req.body.device_id, null);
    const device_model = isNull(req.body.device_model, null);
    const os_type = isNull(req.body.os_type, null);
    const push_token = isNull(req.body.push_token, null);
    const enc_key = "hexagon2021@)@!";

    if (
        [
            user_id,
            email,
            phone,
            special_code,
            img_url,
            name,
            company_type,
            company_name,
            company_class,
            company_ceo,
            company_phone,
            password,
            grade_start,
            grade_end,
            business_code,
        ].includes(null)
    ) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
            returnData: req.body,
        });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.014",
            { user_id },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        // const selectQuery2 = req.mybatisMapper.getStatement(
        //     "V1",
        //     "HAX.V1.SELECT.017",
        //     { recomm_code },
        //     { language: "sql", indent: " " }
        // );

        // const selectResult2 = await req.sequelize.query(selectQuery2, {
        //     type: req.sequelize.QueryTypes.SELECT,
        // });

        const selectQuery3 = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.019",
            { agent_code },
            { language: "sql", indent: " " }
        );

        const selectResult3 = await req.sequelize.query(selectQuery3, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery4 = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.020",
            { special_code },
            { language: "sql", indent: " " }
        );

        const selectResult4 = await req.sequelize.query(selectQuery4, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult4.length > 0) {
            res.status(200).json({
                code: "1020",
                msg: "스페셜 코드 중복",
                desc: "회원가입",
            });
            return;
        }

        // if (recomm_code != null) {
        //     if (selectResult2.length == 0) {
        //         res.status(200).json({
        //             code: "1021",
        //             msg: "유효하지 않은 추천인 코드",
        //             desc: "회원가입",
        //         });
        //         return;
        //     }
        // }

        if (agent_code != null) {
            if (selectResult3.length == 0) {
                res.status(200).json({
                    code: "1022",
                    msg: "유효하지 않은 영업사원 코드",
                    desc: "회원가입",
                });
                return;
            }
        }

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "1016",
                msg: "아이디 중복",
                desc: "회원가입",
            });
            return;
        } else {
            const insertQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.INSERT.002",
                {
                    user_id,
                    password,
                    email,
                    phone,
                    special_code,
                    img_url,
                    name,
                    agent_code,
                    company_name,
                    company_type,
                    business_code,
                    company_class,
                    company_address,
                    company_zipcode,
                    company_ceo,
                    company_phone,
                    code_img,
                    enc_key,
                    grade_start,
                    grade_end,
                    device_id,
                    device_model,
                    os_type,
                    push_token,
                    recomm_code,
                },
                { language: "sql", indent: " " }
            );

            const insertResult = await req.sequelize.query(insertQuery, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            if (insertResult.length > 0) {
                if (selectResult3.length > 0) {
                    const insertQuery2 = req.mybatisMapper.getStatement(
                        "V1",
                        "HAX.V1.INSERT.004",
                        {
                            member_pk: insertResult[0].member_pk,
                            agent_code,
                        },
                        { language: "sql", indent: " " }
                    );

                    const insertResult2 = await req.sequelize.query(
                        insertQuery2,
                        {
                            type: req.sequelize.QueryTypes.INSERT,
                            transaction,
                        }
                    );

                    if (insertResult[1] == 0 || insertResult2[1] == 0) {
                        transaction.rollback();
                        res.status(200).json({
                            code: "2004",
                            msg: "처리실패",
                            desc: "회원가입",
                        });
                    } else {
                        transaction.commit();
                        res.status(200).json({
                            code: "0000",
                            msg: "성공",
                            desc: "회원가입",
                            member_pk: insertResult[0].member_pk,
                        });
                    }
                } else {
                    if (insertResult[1] == 0) {
                        transaction.rollback();
                        res.status(200).json({
                            code: "2004",
                            msg: "처리실패",
                            desc: "회원가입",
                        });
                    } else {
                        transaction.commit();
                        res.status(200).json({
                            code: "0000",
                            msg: "성공",
                            desc: "회원가입",
                            member_pk: insertResult[0].member_pk,
                        });
                    }
                }
            } else {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리실패",
                    desc: "회원가입",
                });
            }
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "회원가입",
            err: String(err),
        });
    }
});

app.post("/auth/signin", async (req, res) => {
    const user_id = isNull(req.body.user_id, null);
    const password = isNull(req.body.password, null);
    const enc_key = "hexagon2021@)@!";
    let token = null;

    if ([user_id, password].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.014",
            { user_id },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery2 = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.016",
            { user_id, password, enc_key },
            { language: "sql", indent: " " }
        );

        const selectResult2 = await req.sequelize.query(selectQuery2, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery3 = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.021",
            { user_id },
            { language: "sql", indent: " " }
        );

        const selectResult3 = await req.sequelize.query(selectQuery3, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            if (selectResult3.length > 0) {
                if (selectResult2.length > 0) {
                    token = req.signToken(
                        (id = {
                            user_id,
                            member_pk: selectResult2[0].member_pk,
                            name: selectResult2[0].name,
                            email: selectResult2[0].email,
                            phone: selectResult2[0].phone,
                            is_salesman: selectResult2[0].is_salesman,
                            grade_code: selectResult2[0].grade_code,
                            grade_name: selectResult2[0].grade_name,
                            grade_rate: selectResult2[0].grade_rate,
                            special_code: selectResult2[0].special_code,
                        })
                    );
                    res.status(200).json({
                        code: "0000",
                        msg: "성공",
                        desc: "로그인",
                        token: token,
                    });
                } else {
                    res.status(200).json({
                        code: "1015",
                        msg: "비밀번호가 일치하지 않음",
                        desc: "로그인",
                    });
                }
            } else {
                res.status(200).json({
                    code: "1003",
                    msg: "사용중지된 아이디",
                    desc: "로그인",
                });
            }
        } else {
            res.status(200).json({
                code: "1014",
                msg: "가입한 아이디가 없음",
                desc: "로그인",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "로그인",
            err: String(err),
        });
    }
});

app.get("/id-check", async (req, res) => {
    const user_id = isNull(req.query.user_id, null);

    if ([user_id].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.014",
            { user_id },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "1016",
                msg: "아이디 중복",
                desc: "아이디 중복체크",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "아이디 중복체크",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "아이디 중복체크",
            err: String(err),
        });
    }
});

// app.post("/img/single", upload.single("img"), async (req, res) => {
app.post(
    "/img/single",
    upload.fields([{ name: "img", maxCount: 1 }, { name: "folder" }]),
    async (req, res) => {
        const img = isNull(req.files.img, null);
        // const img = isNull(req.file, null);
        console.log(img);

        if ([img].includes(null)) {
            res.status(200).json({
                code: "2005",
                msg: "유효하지 않은 파라미터",
                returnData: req.files,
            });
            return;
        }

        let insert_img = img[0].location;
        const insert_imgArray = insert_img.split("/");
        insert_img =
            insert_imgArray[3] +
            "/" +
            insert_imgArray[4] +
            "/" +
            insert_imgArray[5];

        try {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이미지(싱글)",
                data: "/" + insert_img,
            });
        } catch (err) {
            if (err) {
                console.error(err);
            }
            res.status(200).json({
                code: "9999",
                msg: "기타 서버 에러",
                desc: "이미지(싱글)",
                err: String(err),
            });
        }
    }
);

// app.post("/img/multiple", upload.array("img"), async (req, res) => {

app.post(
    "/img/multiple",
    upload.fields([{ name: "img", maxCount: 5 }, { name: "folder" }]),
    async (req, res) => {
        const img = isNull(req.files.img, null);
        let img_array = [];
        console.log(img);

        if (img == false || img == null) {
            res.status(200).json({
                code: "2005",
                msg: "유효하지 않은 파라미터",
                returnData: req.files,
            });
            return;
        }

        for (const e of img) {
            let img_location = null;
            let location = null;
            img_location = e.location.split("/");
            location =
                img_location[3] + "/" + img_location[4] + "/" + img_location[5];
            img_array.push(e.originalname, "/" + location);
        }

        // img_array.push(img[0].location);

        try {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이미지(다중)",
                data: img_array,
            });
        } catch (err) {
            if (err) {
                console.error(err);
            }
            res.status(200).json({
                code: "9999",
                msg: "기타 서버 에러",
                desc: "이미지(다중)",
                err: String(err),
            });
        }
    }
);

app.patch("/member/modify/phone/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    const phone = isNull(req.body.phone, null);

    if ([member_pk, phone].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.UPDATE.003",
            { member_pk, phone },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "회원 전화번호 재설정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "회원 전화번호 재설정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "회원 전화번호 재설정",
            err: String(err),
        });
    }
});

app.patch("/member/password/modify/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    const password = isNull(req.body.password, null);
    const enc_key = "hexagon2021@)@!";

    if ([member_pk, password].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.039",
            { member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            const updateQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.UPDATE.004",
                { member_pk, password, enc_key },
                { language: "sql", indent: " " }
            );

            const updateResult = await req.sequelize.query(updateQuery, {
                type: req.sequelize.QueryTypes.UPDATE,
            });

            if (updateResult[1] == 0) {
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "회원 비밀번호 재설정",
                });
            } else {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "회원 비밀번호 재설정",
                });
            }
        } else {
            res.status(200).json({
                code: "1014",
                msg: "가입한 아이디가 없음",
                desc: "회원 비밀번호 재설정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "회원 비밀번호 재설정",
            err: String(err),
        });
    }
});

app.post("/auth/refreshtoken", async (req, res) => {
    const member_pk = isNull(req.body.member_pk, null);
    const token = isNull(req.body.token, null);
    let refreshToken = null;

    if ([member_pk, token].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }
    try {
        refreshToken = req.refreshToken(
            (id = { member_pk: member_pk, token: token })
        );

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "AccessToken 재발행",
            token: refreshToken,
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "AccessToken 재발행",
            err: String(err),
        });
    }
});

app.post("/refresh-token", async (req, res) => {
    // REFRESH TOKEN
    let authorization = req.headers.authorization;
    if (authorization === undefined) {
        res.status(200).json({ code: "1001", msg: "권한 없음" });
        return;
    } else {
        var token = await req.refreshToken(req, res);
        // res.json({ code: "0000", msg: "성공", token: token });
    }
});

app.get("/test", async (req, res) => {
    const start = Date.now();
    const start2 = Math.floor(start / 1000);
    let d = Date.UTC(1970, 0, 2);

    const selectQuery = req.mybatisMapper.getStatement(
        "V1",
        "HAX.V1.SELECT.099",
        { language: "sql", indent: " " }
    );

    const selectResult = await req.sequelize.query(selectQuery, {
        type: req.sequelize.QueryTypes.SELECT,
    });

    res.status(200).json({
        code: "0000",
        msg: "성공",
        desc: "test",
        time: start,
        time2: start2,
        time3: d,
        data: selectResult,
    });
});

app.get("/cart/list/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);

    if ([member_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.010",
            { member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "장바구니목록 조회",
            data: {
                cartList: selectResult,
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "장바구니목록 조회",
            err: String(err),
        });
    }
});

app.post("/cart/eachadd", async (req, res) => {
    const product_pk = isNull(req.body.product_pk, null);
    let quantity = isNull(req.body.quantity, null);
    let unit_type = isNull(req.body.unit_type, null);
    const member_pk = isNull(req.body.member_pk, null);

    if ([product_pk, member_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    if (unit_type === null) {
        unit_type = "Each";
    }

    if (quantity === null) {
        quantity = 1;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const insertQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.INSERT.001",
            {
                product_pk,
                quantity,
                unit_type,
                member_pk,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.INSERT,
            transaction,
        });

        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.025",
            { member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (insertResult[1] == 0) {
            transaction.rollback();
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "장바구니 등록(개별)",
            });
        } else {
            transaction.commit();
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "장바구니 등록(개별)",
                data: {
                    totalCount:
                        selectResult.length > 0 ? selectResult[0].total : 0,
                },
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "장바구니 등록(개별)",
            err: String(err),
        });
    }
});

app.post("/cart/arrayadd", async (req, res) => {
    const data_array = isNull(req.body.data_array, null);
    const product_pk = isNull(req.body.product_pk, null);
    const member_pk = isNull(req.body.member_pk, null);
    let insert_array = [];

    if (
        [member_pk, data_array, product_pk].includes(null) ||
        data_array == false
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const deleteQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.DELETE.003",
            { member_pk, product_pk },
            { language: "sql", indent: " " }
        );

        const deleteResult = await req.sequelize.query(deleteQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        const insertQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.INSERT.005",
            {
                member_pk,
                data_array,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (insertResult.length > 0) {
            for (const e of insertResult) {
                insert_array.push(e.cart_pk);
            }

            const selectQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.SELECT.022",
                { insert_array },
                { language: "sql", indent: " " }
            );

            const selectResult = await req.sequelize.query(selectQuery, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            const selectQuery2 = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.SELECT.025",
                { member_pk },
                { language: "sql", indent: " " }
            );

            const selectResult2 = await req.sequelize.query(selectQuery2, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            if (insertResult[1] == 0) {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "장바구니 등록(배열)",
                });
            } else {
                transaction.commit();
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "장바구니 등록(배열)",
                    data: {
                        cartList: selectResult,
                        totalCount:
                            selectResult2.length > 0
                                ? selectResult2[0].total
                                : 0,
                    },
                });
            }
        } else {
            transaction.rollback();
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "장바구니 등록(배열)",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "장바구니 등록(배열)",
            err: String(err),
        });
    }
});

app.delete("/cart/remove/:cart_pk/:member_pk", async (req, res) => {
    const cart_pk = isNull(req.params.cart_pk, null);
    const member_pk = isNull(req.params.member_pk, null);

    if ([cart_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const deleteQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.DELETE.001",
            { cart_pk },
            { language: "sql", indent: " " }
        );

        const deleteResult = await req.sequelize.query(deleteQuery, {
            type: req.sequelize.QueryTypes.DELETE,
            transaction,
        });

        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.025",
            { member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (deleteResult == false) {
            transaction.rollback();
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "장바구니 삭제(개별)",
            });
        } else {
            transaction.commit();
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "장바구니 삭제(개별)",
                data: {
                    totalCount:
                        selectResult.length > 0 ? selectResult[0].total : 0,
                },
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "장바구니 삭제(개별)",
            err: String(err),
        });
    }
});

app.put("/cart/remove/product", async (req, res) => {
    const member_pk = isNull(req.body.member_pk, null);
    const data_array = isNull(req.body.data_array, null);

    if ([member_pk, data_array].includes(null) || data_array == false) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const deleteQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.DELETE.002",
            { member_pk, data_array },
            { language: "sql", indent: " " }
        );

        const deleteResult = await req.sequelize.query(deleteQuery, {
            type: req.sequelize.QueryTypes.DELETE,
            transaction,
        });

        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.025",
            { member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (deleteResult == false) {
            transaction.rollback();
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "장바구니 상품 삭제(개별,멀티)",
            });
        } else {
            transaction.commit();
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "장바구니 상품 삭제(개별,멀티)",
                data: {
                    totalCount:
                        selectResult.length > 0 ? selectResult[0].total : 0,
                },
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "장바구니 상품 삭제(개별,멀티)",
            err: String(err),
        });
    }
});

app.put("/cart/modify/quantity/:cart_pk", async (req, res) => {
    const cart_pk = isNull(req.params.cart_pk, null);
    const quantity = isNull(req.body.quantity, null);

    if ([cart_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.UPDATE.001",
            {
                cart_pk,
                quantity,
            },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "장바구니 구입수량 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "장바구니 구입수량 수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "장바구니 구입수량 수정",
            err: String(err),
        });
    }
});

app.get("/order/memberinfo/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    let today = Date.now();
    today = Math.floor(today / 1000);

    if ([member_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.023",
            { member_pk, today },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "주문 필요정보 조회",
            data: {
                userDetail: selectResult[0],
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "주문 필요정보 조회",
            err: String(err),
        });
    }
});

app.post("/member/delivery/regist", async (req, res) => {
    const member_pk = isNull(req.body.member_pk, null);
    const address = isNull(req.body.address, null);
    const addressDetail = isNull(req.body.addressDetail, null);
    const zipCode = isNull(req.body.zipCode, null);

    if ([member_pk, address, addressDetail, zipCode].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const insertQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.INSERT.006",
            {
                member_pk,
                address,
                addressDetail,
                zipCode,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (insertResult.length > 0) {
            const selectQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.SELECT.024",
                { memberdelivery_pk: insertResult[0].memberdelivery_pk },
                { language: "sql", indent: " " }
            );

            const selectResult = await req.sequelize.query(selectQuery, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            if (insertResult[1] == 0) {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "배송지 신규 등록",
                });
            } else {
                transaction.commit();
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "배송지 신규 등록",
                    data: { delivery: selectResult[0] },
                });
            }
        } else {
            transaction.rollback();
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "배송지 신규 등록",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "배송지 신규 등록",
            err: String(err),
        });
    }
});

app.get("/order/list/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));

    const current = page;

    if ([member_pk].includes(null) || [page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.006",
            { member_pk, page, paginate },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "주문목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    orderList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "주문목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    orderList: selectResult,
                },
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "주문목록 조회",
            err: String(err),
        });
    }
});

app.get("/order/view/:order_pk", async (req, res) => {
    const order_pk = isNull(req.params.order_pk, null);

    if (order_pk === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.029",
            { order_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery2 = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.030",
            { order_pk },
            { language: "sql", indent: " " }
        );

        const selectResult2 = await req.sequelize.query(selectQuery2, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery3 = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.031",
            { order_pk },
            { language: "sql", indent: " " }
        );

        const selectResult3 = await req.sequelize.query(selectQuery3, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery4 = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.038",
            { order_pk },
            { language: "sql", indent: " " }
        );

        const selectResult4 = await req.sequelize.query(selectQuery4, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult2.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "구매내역 상세정보 조회",
                data: {
                    product: selectResult[0].product,
                    orderBase: selectResult2[0],
                    settleInfo: selectResult3[0],
                    orderLog: selectResult4[0],
                },
            });
        } else {
            res.status(200).json({
                code: "2001",
                msg: "조회된 데이터 없음",
                desc: "구매내역 상세정보 조회",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "구매내역 상세정보 조회",
            err: String(err),
        });
    }
});

app.post("/order/cart/clone", async (req, res) => {
    const cart_array = isNull(req.body.cart_array, null);

    if ([cart_array].includes(null) || cart_array == false) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const insertQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.INSERT.011",
            {
                cart_array,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.INSERT,
            transaction,
        });

        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.025",
            { member_pk: cart_array[0].member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (insertResult[1] == 0) {
            transaction.rollback();
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "장바구니 다시담기",
            });
        } else {
            transaction.commit();
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "장바구니 다시담기",
                data: {
                    totalCount:
                        selectResult.length > 0 ? selectResult[0].total : 0,
                },
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "장바구니 다시담기",
            err: String(err),
        });
    }
});

app.patch("/order/cancel/:order_pk", async (req, res) => {
    const order_pk = isNull(req.params.order_pk, null);
    const comment = "주문취소";
    const history_type = "CANCEL_A";

    if ([order_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.UPDATE.008",
            {
                order_pk,
                comment,
                history_type,
            },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "주문취소",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "주문취소",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "주문취소",
            err: String(err),
        });
    }
});

app.get("/order/point/check/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    const point = isNull(req.query.point, null);
    const coupon_pk = isNull(req.query.coupon_pk, null);
    let today = Date.now();
    today = Math.floor(today / 1000);

    if ([member_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        if (point != null && coupon_pk != null) {
            const pointSelectQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.SELECT.026",
                { member_pk, today, point },
                { language: "sql", indent: " " }
            );

            const pointSelectResult = await req.sequelize.query(
                pointSelectQuery,
                {
                    type: req.sequelize.QueryTypes.SELECT,
                }
            );

            const couponSelectQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.SELECT.027",
                { member_pk, today, coupon_pk },
                { language: "sql", indent: " " }
            );

            const couponSelectResult = await req.sequelize.query(
                couponSelectQuery,
                {
                    type: req.sequelize.QueryTypes.SELECT,
                }
            );

            if (
                pointSelectResult[0].point_check == true &&
                couponSelectResult.length > 0
            ) {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "쿠폰 및 포인트 사용여부",
                });
            } else if (
                pointSelectResult[0].point_check == true &&
                couponSelectResult.length == 0
            ) {
                res.status(200).json({
                    code: "3024",
                    msg: "이미 사용하거나 없는 쿠폰",
                    desc: "쿠폰 및 포인트 사용여부",
                });
            } else if (
                pointSelectResult[0].point_check == false &&
                couponSelectResult.length > 0
            ) {
                res.status(200).json({
                    code: "3023",
                    msg: "포인트 부족",
                    desc: "쿠폰 및 포인트 사용여부",
                });
            } else {
                res.status(200).json({
                    code: "2006",
                    msg: "처리할 데이터 없음",
                    desc: "쿠폰 및 포인트 사용여부",
                });
            }
        } else if (point != null) {
            const pointCheckQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.SELECT.026",
                { member_pk, today, point },
                { language: "sql", indent: " " }
            );

            const pointCheckResult = await req.sequelize.query(
                pointCheckQuery,
                {
                    type: req.sequelize.QueryTypes.SELECT,
                }
            );
            if (pointCheckResult[0].point_check == true) {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "쿠폰 및 포인트 사용여부",
                });
            } else {
                res.status(200).json({
                    code: "3023",
                    msg: "포인트 부족",
                    desc: "쿠폰 및 포인트 사용여부",
                });
            }
        } else if (coupon_pk != null) {
            const couponCheckQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.SELECT.027",
                { member_pk, today, coupon_pk },
                { language: "sql", indent: " " }
            );

            const couponCheckResult = await req.sequelize.query(
                couponCheckQuery,
                {
                    type: req.sequelize.QueryTypes.SELECT,
                }
            );
            if (couponCheckResult.length > 0) {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "쿠폰 및 포인트 사용여부",
                });
            } else {
                res.status(200).json({
                    code: "3024",
                    msg: "이미 사용하거나 없는 쿠폰",
                    desc: "쿠폰 및 포인트 사용여부",
                });
            }
        } else {
            res.status(200).json({
                code: "2006",
                msg: "처리할 데이터 없음",
                desc: "쿠폰 및 포인트 사용여부",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "쿠폰 및 포인트 사용여부",
            err: String(err),
        });
    }
});

app.post("/order/regist", async (req, res) => {
    const memberIdx = isNull(req.body.memberIdx, null);
    const orderBase = isNull(req.body.orderBase, null);
    const orderDetail = isNull(req.body.orderDetail, null);
    const orderProduct = isNull(req.body.orderProduct, null);
    const cart_array = isNull(req.body.cart_array, null);
    let usePoint = isNull(req.body.usePoint, 0);
    const useCoupon = isNull(req.body.useCoupon, null);
    const comment = "주문완료";
    const history_type = "ORDER";
    let today = Date.now();
    today = Math.floor(today / 1000);

    if (
        [memberIdx, orderBase, orderProduct, cart_array].includes(null) ||
        orderBase == false ||
        orderProduct == false ||
        cart_array == false
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const insertQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.INSERT.007",
            {
                memberIdx,
                orderBase,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (insertResult.length > 0) {
            const order_pk = insertResult[0].order_pk;
            let insertResult2 = [null, null];
            if (orderBase.settle_type !== "point") {
                const insertQuery2 = req.mybatisMapper.getStatement(
                    "V1",
                    "HAX.V1.INSERT.008",
                    {
                        orderDetail,
                        order_pk,
                    },
                    { language: "sql", indent: " " }
                );

                insertResult2 = await req.sequelize.query(insertQuery2, {
                    type: req.sequelize.QueryTypes.INSERT,
                    transaction,
                });

                if (insertResult2[1] == 0) {
                    transaction.rollback();
                    res.status(200).json({
                        code: "2004",
                        msg: "처리 실패",
                        desc: "주문정보 등록",
                    });
                }
            }

            const insertQuery3 = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.INSERT.009",
                {
                    order_pk,
                    orderProduct,
                },
                { language: "sql", indent: " " }
            );

            const insertResult3 = await req.sequelize.query(insertQuery3, {
                type: req.sequelize.QueryTypes.INSERT,
                transaction,
            });

            const deleteQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.DELETE.004",
                { memberIdx, cart_array },
                { language: "sql", indent: " " }
            );

            const deleteResult = await req.sequelize.query(deleteQuery, {
                type: req.sequelize.QueryTypes.DELETE,
                transaction,
            });

            const updateQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.UPDATE.005",
                {
                    memberIdx,
                    orderBase,
                },
                { language: "sql", indent: " " }
            );

            const updateResult = await req.sequelize.query(updateQuery, {
                type: req.sequelize.QueryTypes.UPDATE,
                transaction,
            });

            const insertQuery4 = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.INSERT.010",
                {
                    order_pk,
                    comment,
                    history_type,
                },
                { language: "sql", indent: " " }
            );

            const insertResult4 = await req.sequelize.query(insertQuery4, {
                type: req.sequelize.QueryTypes.INSERT,
                transaction,
            });

            if (orderBase.settle_type != null) {
                if (
                    orderBase.settle_type == "card" ||
                    orderBase.settle_type == "phone" ||
                    orderBase.settle_type == "point"
                ) {
                    const twoComment = "입금완료";
                    const twoHistoryType = "INCOME";
                    const insertQuery5 = req.mybatisMapper.getStatement(
                        "V1",
                        "HAX.V1.INSERT.010",
                        {
                            order_pk,
                            comment: twoComment,
                            history_type: twoHistoryType,
                        },
                        { language: "sql", indent: " " }
                    );

                    const insertResult5 = await req.sequelize.query(
                        insertQuery5,
                        {
                            type: req.sequelize.QueryTypes.INSERT,
                            transaction,
                        }
                    );
                }
            }

            if (useCoupon != null) {
                if (useCoupon.coupon_pk != null) {
                    const updateQuery2 = req.mybatisMapper.getStatement(
                        "V1",
                        "HAX.V1.UPDATE.006",
                        { useCoupon, order_pk },
                        { language: "sql", indent: " " }
                    );

                    const updateResult2 = await req.sequelize.query(
                        updateQuery2,
                        {
                            type: req.sequelize.QueryTypes.UPDATE,
                            transaction,
                        }
                    );
                }
            }

            const updateQuery3 = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.UPDATE.010",
                { orderProduct },
                { language: "sql", indent: " " }
            );

            const updateResult3 = await req.sequelize.query(updateQuery3, {
                type: req.sequelize.QueryTypes.UPDATE,
                transaction,
            });

            if (usePoint > 0) {
                const selectQuery = req.mybatisMapper.getStatement(
                    "V1",
                    "HAX.V1.SELECT.028",
                    { memberIdx, usePoint, today },
                    { language: "sql", indent: "" }
                );

                const selectResult = await req.sequelize.query(selectQuery, {
                    type: req.sequelize.QueryTypes.SELECT,
                    transaction,
                });

                if (selectResult.length > 0) {
                    let newRemainPoint = 0;
                    for (const reserve of selectResult) {
                        if (reserve.remain_point < usePoint) {
                            // 작은경우는 계속 반복해야한다}
                            newRemainPoint = 0;
                            usePoint = usePoint - reserve.remain_point;
                            //여기서 해당 tb_reserve_pk의 remain_point정보 업데으트
                            /* 여기서업데이트 및 log 인서트 */
                            const updateQuery4 = req.mybatisMapper.getStatement(
                                "V1",
                                "HAX.V1.UPDATE.007",
                                {
                                    memberIdx,
                                    reserve_pk: reserve.reserve_pk,
                                    remain_point: 0,
                                    use_point: reserve.remain_point,
                                    order_pk,
                                    reward_gubun: "m",
                                },
                                { language: "sql", indent: " " }
                            );

                            const updateResult4 = await req.sequelize.query(
                                updateQuery4,
                                {
                                    type: req.sequelize.QueryTypes.UPDATE,
                                    transaction,
                                }
                            );
                        } else {
                            // 당근 나머지는 포인트가 그거나 남는경우
                            newRemainPoint = reserve.remain_point - usePoint;
                            //여기서 해당 tb_reserve_pk의 remain_point정보 업데으트
                            /* 여기서업데이트 및 log 인서트 */
                            const updateQuery5 = req.mybatisMapper.getStatement(
                                "V1",
                                "HAX.V1.UPDATE.007",
                                {
                                    memberIdx,
                                    reserve_pk: reserve.reserve_pk,
                                    remain_point: newRemainPoint,
                                    use_point: usePoint,
                                    order_pk,
                                    reward_gubun: "m",
                                },
                                { language: "sql", indent: " " }
                            );

                            const updateResult5 = await req.sequelize.query(
                                updateQuery5,
                                {
                                    type: req.sequelize.QueryTypes.UPDATE,
                                    transaction,
                                }
                            );
                        }
                    }
                } else {
                    //실제로는 오류 절대로 일어날수 없는 경우
                    res.status(200).json({
                        code: "9999",
                        msg: "기타 서버 에러",
                        desc: "주문정보 등록",
                        err: String(err),
                    });
                }
            }

            const selectQuery2 = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.SELECT.025",
                { member_pk: memberIdx },
                { language: "sql", indent: " " }
            );

            const selectResult2 = await req.sequelize.query(selectQuery2, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            if (
                insertResult[1] == 0 ||
                deleteResult == false ||
                insertResult3[1] == 0 ||
                updateResult[1] == 0 ||
                insertResult4[1] == 0 ||
                (insertResult2[1] == 0 && orderBase.settle_type != "point")
            ) {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "주문정보 등록",
                });
            } else {
                transaction.commit();

                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "주문정보 등록",
                    data: {
                        cartTotalCount:
                            selectResult2.length > 0
                                ? selectResult2[0].total
                                : 0,
                    },
                });
            }
        } else {
            transaction.rollback();
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "주문정보 등록",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "주문정보 등록",
            err: String(err),
        });
    }
});

app.post("/settle/iamport/modify", async (req, res) => {
    const { imp_uid, merchant_uid, status } = req.body;
    let order_pk = null;
    const comment = "입금완료";
    const history_type = "INCOME";

    // if ([merchant_uid, status].includes(null)) {
    //     res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
    //     return;
    // }

    // if (
    //     req.connection.remoteAddress === "52.78.100.19" ||
    //     req.connection.remoteAddress === "52.78.48.223"
    // ) {
    //     res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
    //     return;
    // }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        if (status == "paid") {
            const updateQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.UPDATE.009",
                {
                    merchant_uid,
                },
                { language: "sql", indent: " " }
            );

            const updateResult = await req.sequelize.query(updateQuery, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            if (updateResult.length > 0) {
                order_pk = updateResult[0].order_pk;

                const insertQuery = req.mybatisMapper.getStatement(
                    "V1",
                    "HAX.V1.INSERT.010",
                    {
                        order_pk,
                        comment,
                        history_type,
                    },
                    { language: "sql", indent: " " }
                );

                const insertResult = await req.sequelize.query(insertQuery, {
                    type: req.sequelize.QueryTypes.INSERT,
                    transaction,
                });
            }

            if (updateResult[1] == 0) {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "결제처리",
                });
            } else {
                transaction.commit();
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "결제처리",
                });
            }
        } else {
            res.status(200).json({
                code: "2099",
                msg: "처리대상외입니다.",
                desc: "결제처리",
                returnData: req.body,
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "결제처리",
            err: String(err),
        });
    }
});

app.get("/main/basedata/:member_pk", async (req, res) => {
    const member_pk = parseInt(isNull(req.params.member_pk, 0));
    let today = Date.now();
    today = Math.floor(today / 1000);

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.033",
            { member_pk, today },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "메인 목록 조회",
            today: today,
            data: selectResult[0],
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "메인 목록 조회",
            err: String(err),
        });
    }
});

app.get("/home/newarrival", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    const sortItem = isNull(req.query.sortItem, "new");

    const current = page;

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.036",
            { page, paginate, sortItem },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "메인 신제품 목록조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    newProductList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "메인 신제품 목록조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    newProductList: selectResult,
                },
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "메인 신제품 목록조회",
            err: String(err),
        });
    }
});

app.get("/home/bestlist", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    const sortItem = isNull(req.query.sortItem, "recomm");

    const current = page;

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.036",
            { page, paginate, sortItem: "new" },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery2 = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.037",
            { page, paginate, sortItem },
            { language: "sql", indent: " " }
        );

        const selectResult2 = await req.sequelize.query(selectQuery2, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult2.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "메인 베스트 제품 목록조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult2[0].total / paginate),
                total: selectResult2[0].total,
                data: {
                    bestProductList: selectResult2,
                },
            });
        } else {
            if (selectResult.length > 0) {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "메인 베스트 제품 목록조회",
                    currentPage: current,
                    lastPage: Math.ceil(selectResult[0].total / paginate),
                    total: selectResult[0].total,
                    data: {
                        bestProductList: selectResult,
                    },
                });
            } else {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "메인 베스트 제품 목록조회",
                    currentPage: 0,
                    lastPage: 0,
                    total: 0,
                    data: {
                        bestProductList: selectResult,
                    },
                });
            }
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "메인 베스트 제품 목록조회",
            err: String(err),
        });
    }
});

app.get("/home/eventlist", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    const sortItem = isNull(req.query.sortItem, "recomm");

    const current = page;

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.039",
            { page, paginate, sortItem },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "메인 베스트 제품 목록조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    bestProductList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "메인 베스트 제품 목록조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    bestProductList: selectResult,
                },
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "메인 베스트 제품 목록조회",
            err: String(err),
        });
    }
});

app.get("/search", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    const sortItem = isNull(req.query.sortItem, "recomm");

    const current = page;

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.039",
            { page, paginate, sortItem },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "메인 베스트 제품 목록조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    bestProductList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "메인 베스트 제품 목록조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    bestProductList: selectResult,
                },
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "메인 베스트 제품 목록조회",
            err: String(err),
        });
    }
});

app.patch("/member/modify/push/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    const is_push = isNull(req.body.is_push, null);

    if ([member_pk, is_push].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.UPDATE.011",
            { member_pk, is_push },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "회원 푸쉬 설정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "회원 푸쉬 설정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "회원 푸쉬 설정",
            err: String(err),
        });
    }
});

app.get("/member/check", async (req, res) => {
    const user_id = isNull(req.query.user_id, null);
    const auth_code = isNull(req.query.auth_code, null);

    if ([user_id, auth_code].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.014",
            { user_id },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery2 = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.021",
            { user_id },
            { language: "sql", indent: " " }
        );

        const selectResult2 = await req.sequelize.query(selectQuery2, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            if (selectResult2.length > 0) {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "계정찾기",
                    returnData: {
                        member_pk: selectResult2[0].member_pk,
                        userTel: selectResult2[0].phone,
                        authCode: auth_code,
                    },
                });
            } else {
                res.status(200).json({
                    code: "1003",
                    msg: "사용중지된 아이디",
                    desc: "계정찾기",
                });
            }
        } else {
            res.status(200).json({
                code: "1014",
                msg: "가입한 아이디가 없음",
                desc: "계정찾기",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "계정찾기",
            err: String(err),
        });
    }
});

app.patch("/member/retire/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);

    if ([member_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.UPDATE.012",
            { member_pk },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "회원 탈퇴",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "회원 탈퇴",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "회원 탈퇴",
            err: String(err),
        });
    }
});

app.get("/member/mygrade/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);

    if ([member_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.040",
            { member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "내정보, 등급정보",
            data: {
                couponCount: selectResult[0].coupon_count,
                myGrade: selectResult[0],
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "내정보, 등급정보",
            err: String(err),
        });
    }
});

app.post("/test2", async (req, res) => {
    const memberIdx = isNull(req.body.memberIdx, null);
    // let usePoint = isNull(req.body.usePoint, 0);
    let today = Date.now();
    today = Math.floor(today / 1000);

    let usePoint = 55000;
    const order_pk = 1;

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        if (usePoint > 0) {
            const selectQuery = req.mybatisMapper.getStatement(
                "V1",
                "HAX.V1.SELECT.028",
                { memberIdx, usePoint, today },
                { language: "sql", indent: "" }
            );

            const selectResult = await req.sequelize.query(selectQuery, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            if (selectResult.length > 0) {
                let newRemainPoint = 0;
                for (const reserve of selectResult) {
                    if (reserve.remain_point < usePoint) {
                        // 작은경우는 계속 반복해야한다}
                        newRemainPoint = 0;
                        usePoint = usePoint - reserve.remain_point;
                        //여기서 해당 tb_reserve_pk의 remain_point정보 업데으트
                        /* 여기서업데이트 및 log 인서트 */
                        const updateQuery3 = req.mybatisMapper.getStatement(
                            "V1",
                            "HAX.V1.UPDATE.007",
                            {
                                memberIdx,
                                reserve_pk: reserve.reserve_pk,
                                remain_point: 0,
                                use_point: reserve.remain_point,
                                order_pk,
                            },
                            { language: "sql", indent: " " }
                        );

                        const updateResult3 = await req.sequelize.query(
                            updateQuery3,
                            {
                                type: req.sequelize.QueryTypes.UPDATE,
                                transaction,
                            }
                        );
                    } else {
                        // 당근 나머지는 포인트가 그거나 남는경우
                        newRemainPoint = reserve.remain_point - usePoint;
                        //여기서 해당 tb_reserve_pk의 remain_point정보 업데으트
                        /* 여기서업데이트 및 log 인서트 */
                        const updateQuery4 = req.mybatisMapper.getStatement(
                            "V1",
                            "HAX.V1.UPDATE.007",
                            {
                                memberIdx,
                                reserve_pk: reserve.reserve_pk,
                                remain_point: newRemainPoint,
                                use_point: usePoint,
                                order_pk,
                            },
                            { language: "sql", indent: " " }
                        );

                        const updateResult4 = await req.sequelize.query(
                            updateQuery4,
                            {
                                type: req.sequelize.QueryTypes.UPDATE,
                                transaction,
                            }
                        );
                    }
                }
            } else {
                //실제로는 오류 절대로 일어날수 없는 경우
            }
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "주문정보 등록",
            err: String(err),
        });
    }
});

module.exports = app;
