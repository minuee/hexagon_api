const express = require("express");
const app = express.Router();

const { sendCMSExcel } = require("../lib/excel");
const firebase = require("../middleware/firebase");
const { dateToYMDString, dateToYMString } = require("../lib/dateUtil");
const { isNull } = require("../lib/util");
const { Workbook } = require("exceljs");
const AWS = require("aws-sdk");
const keyData = require("../key/awsconfig.json");

const s3 = new AWS.S3({
    accessKeyId: keyData.AccessKeyId, // user 만들면서 지급받은 키값
    secretAccessKey: keyData.secretAccessKey,
    region: "ap-northeast-1",
});

app.get("/member/list", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);
    let sort_item = isNull(req.query.sort_item, "reg");
    let term_start = isNull(req.query.term_start, 0);
    let term_end = isNull(req.query.term_end, 0);
    let sort_type = isNull(req.query.sort_type, "DESC");
    let special_code = isNull(req.query.special_code, null);
    const is_approval = isNull(req.query.is_approval, null);
    const is_excel = isNull(req.query.is_excel, false);

    const current = page;

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    if (special_code == "A001") {
        special_code = null;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.003",
            {
                page,
                paginate,
                search_word,
                sort_item,
                term_start,
                term_end,
                sort_type,
                special_code,
                is_approval,
                is_excel,
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (is_excel == true || is_excel == "true") {
            if (selectResult.length > 0) {
                const url = await sendCMSExcel(req, selectResult, [
                    { header: "이름", key: "name", width: 15 },
                    { header: "코드값", key: "special_code", width: 15 },
                    { header: "구매총액", key: "total_amount", width: 15 },
                    { header: "리워드잔액", key: "remain_reward", width: 15 },
                    { header: "등급", key: "grade_code", width: 10 },
                ]);
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "회원목록 조회",
                    url,
                });
                return;
            } else {
                res.status(200).json({
                    code: "2004",
                    msg: "엑셀 추출 실패",
                    desc: "회원목록 조회",
                });
            }
        }

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "회원목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    userList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "회원목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    userList: selectResult,
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
            desc: "회원목록",
            err: String(err),
        });
    }
});

app.get("/member/view/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);

    if (member_pk === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.004",
            { member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "유저 상세 정보 조회",
            data: { userDetail: selectResult[0] },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "회원 상세정보 조회",
            err: String(err),
        });
    }
});

app.get("/member/reward/list/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let today = Date.now();
    today = Math.floor(today / 1000);

    const current = page;

    if (member_pk == null || [page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.005",
            { member_pk, page, paginate },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery2 = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.049",
            { member_pk, today },
            { language: "sql", indent: " " }
        );

        const selectResult2 = await req.sequelize.query(selectQuery2, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery3 = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.050",
            { member_pk, today },
            { language: "sql", indent: " " }
        );

        const selectResult3 = await req.sequelize.query(selectQuery3, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "회원 리워드 리스트",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    totalReward: selectResult2[0].sum_remain_point,
                    demiseExpected: selectResult3,
                    userRewardHistory: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "회원 리워드 리스트",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    totalReward: 0,
                    demiseExpected: selectResult3,
                    userRewardHistory: selectResult,
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
            desc: "회원 리워드 리스트",
            err: String(err),
        });
    }
});

app.get("/member/reward/view/:pointlog_pk", async (req, res) => {
    const pointlog_pk = isNull(req.params.pointlog_pk, null);

    if ([pointlog_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.051",
            { pointlog_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "회원적립금 상세조회",
            data: {
                reserveDetail: selectResult[0],
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "회원적립금 상세조회",
            err: String(err),
        });
    }
});

app.put("/member/approval", async (req, res) => {
    const member_array = isNull(req.body.member_array, null);
    let member = [];
    let targetArray = [];
    let targetMember = [];
    const today = Date.now();
    const todayYear = new Date(today).getFullYear();
    const todayMonth = new Date(today).getMonth();
    const todayDate = new Date(today).getDate();
    let gradeStart = new Date(todayYear, todayMonth, todayDate);
    let gradeEnd = new Date(todayYear, todayMonth + 3, 0);
    gradeStart = dateToYMDString(gradeStart);
    gradeEnd = dateToYMDString(gradeEnd);

    if (member_array === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        for (const m of member_array) {
            member.push(m.member_pk);
        }

        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.001",
            { member, gradeStart, gradeEnd },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.063",
            { member },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (updateResult[1] == 0) {
            transaction.rollback();
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "유저 회원가입 승인",
            });
        } else {
            if (selectResult.length > 0) {
                const content = "회원 초대포인트";
                const reward_point = 50000;
                const reward_gubun = "p";
                const reward_type = "Invite";

                const insertQuery2 = req.mybatisMapper.getStatement(
                    "CMS",
                    "HAX.CMS.INSERT.018",
                    {
                        selectResult,
                        content,
                        reward_point,
                        reward_gubun,
                        reward_type,
                    },
                    { language: "sql", indent: " " }
                );

                const insertResult2 = await req.sequelize.query(insertQuery2, {
                    type: req.sequelize.QueryTypes.INSERT,
                    transaction,
                });
            }
            if (updateResult.length > 0) {
                const title = "[슈퍼바인더]회원가입 승인안내";
                const body = "가입승인이 완료되었습니다. 감사합니다.";
                const routeName = "Approval";
                const routeIdx = 0;
                const img_url = null;
                for (const token of updateResult) {
                    targetArray.push(token.push_token);
                    targetMember.push({ member_pk: token.member_pk });
                }
                if (targetArray.length > 1) {
                    let fnsArray = await firebase.sendMultiMessage(
                        targetArray,
                        title,
                        body,
                        routeName,
                        routeIdx,
                        img_url
                    );
                } else {
                    const TargetToken = targetArray[0];
                    let fns = await firebase.sendMessage(
                        TargetToken,
                        title,
                        body,
                        routeName,
                        routeIdx,
                        img_url
                    );
                }

                const insertQuery = req.mybatisMapper.getStatement(
                    "CMS",
                    "HAX.CMS.INSERT.016",
                    {
                        gubun: routeName,
                        target: targetMember,
                        routeIdx,
                    },
                    { language: "sql", indent: " " }
                );

                const insertResult = await req.sequelize.query(insertQuery, {
                    type: req.sequelize.QueryTypes.INSERT,
                    transaction,
                });
            }
            transaction.commit();
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "유저 회원가입 승인",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "유저 회원가입 승인",
            err: String(err),
        });
    }
});

app.put("/member/modify/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    const company_type = isNull(req.body.company_type, null);
    const company_class = isNull(req.body.company_class, null);
    const company_address = isNull(req.body.company_address, null);
    const company_zipcode = isNull(req.body.company_zipcode, null);
    const company_ceo = isNull(req.body.company_ceo, null);
    const company_phone = isNull(req.body.company_phone, null);
    const email = isNull(req.body.email, null);
    const is_approval = isNull(req.body.is_approval, null);
    const new_approval = isNull(req.body.new_approval, null);
    const img_url = isNull(req.body.img_url, null);
    const agent_code = isNull(req.body.agent_code, null);
    const is_newSalesman = isNull(req.body.is_newSalesman, null);
    let targetMember = [];
    const today = Date.now();
    const todayYear = new Date(today).getFullYear();
    const todayMonth = new Date(today).getMonth();
    const todayDate = new Date(today).getDate();
    let gradeStart = new Date(todayYear, todayMonth, todayDate);
    let gradeEnd = new Date(todayYear, todayMonth + 3, 0);
    gradeStart = dateToYMDString(gradeStart);
    gradeEnd = dateToYMDString(gradeEnd);

    if (
        [
            member_pk,
            company_type,
            company_class,
            company_address,
            company_ceo,
            company_phone,
            email,
            img_url,
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

        if (
            (is_approval == false && new_approval == true) ||
            (is_approval == "false" && new_approval == "true")
        ) {
            const updateQuery2 = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.UPDATE.020",
                {
                    member_pk,
                    company_type,
                    company_class,
                    company_address,
                    company_zipcode,
                    company_ceo,
                    company_phone,
                    email,
                    img_url,
                    is_approval,
                    agent_code,
                    gradeStart,
                    gradeEnd,
                },
                { language: "sql", indent: " " }
            );

            const updateResult2 = await req.sequelize.query(updateQuery2, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            if (updateResult2.length > 0) {
                const selectQuery = req.mybatisMapper.getStatement(
                    "CMS",
                    "HAX.CMS.SELECT.061",
                    { member_pk: updateResult2[0].member_pk },
                    { language: "sql", indent: " " }
                );

                const selectResult = await req.sequelize.query(selectQuery, {
                    type: req.sequelize.QueryTypes.SELECT,
                    transaction,
                });

                const selectQuery2 = req.mybatisMapper.getStatement(
                    "CMS",
                    "HAX.CMS.SELECT.062",
                    { member_pk },
                    { language: "sql", indent: " " }
                );

                const selectResult2 = await req.sequelize.query(selectQuery2, {
                    type: req.sequelize.QueryTypes.SELECT,
                    transaction,
                });

                if (selectResult2.length > 0) {
                    const content = "회원 초대포인트";
                    const reward_point = 50000;
                    const reward_gubun = "p";
                    const reward_type = "Invite";
                    const special_code = selectResult2[0].member_pk;

                    const insertQuery3 = req.mybatisMapper.getStatement(
                        "CMS",
                        "HAX.CMS.INSERT.017",
                        {
                            member_pk: selectResult2[0].member_pk,
                            content,
                            reward_point,
                            reward_gubun,
                            reward_type,
                            special_code,
                        },
                        { language: "sql", indent: " " }
                    );

                    const insertResult3 = await req.sequelize.query(
                        insertQuery3,
                        {
                            type: req.sequelize.QueryTypes.INSERT,
                            transaction,
                        }
                    );
                }

                if (selectResult.length > 0) {
                    const title = "[슈퍼바인더]회원가입 승인안내";
                    const body = "가입승인이 완료되었습니다. 감사합니다.";
                    const routeName = "Approval";
                    const routeIdx = 0;
                    const img_url2 = null;
                    const TargetToken = selectResult[0].push_token;
                    targetMember.push({ member_pk: selectResult[0].member_pk });

                    let fns = await firebase.sendMessage(
                        TargetToken,
                        title,
                        body,
                        routeName,
                        routeIdx,
                        img_url2
                    );

                    const insertQuery4 = req.mybatisMapper.getStatement(
                        "CMS",
                        "HAX.CMS.INSERT.016",
                        {
                            gubun: routeName,
                            target: targetMember,
                            routeIdx,
                        },
                        { language: "sql", indent: " " }
                    );

                    const insertResult4 = await req.sequelize.query(
                        insertQuery4,
                        {
                            type: req.sequelize.QueryTypes.INSERT,
                            transaction,
                        }
                    );
                }

                if (is_newSalesman == true) {
                    const insertQuery = req.mybatisMapper.getStatement(
                        "V1",
                        "HAX.V1.INSERT.004",
                        {
                            member_pk: updateResult2[0].member_pk,
                            agent_code,
                        },
                        { language: "sql", indent: " " }
                    );

                    const insertResult = await req.sequelize.query(
                        insertQuery,
                        {
                            type: req.sequelize.QueryTypes.INSERT,
                            transaction,
                        }
                    );

                    if (updateResult2[1] == 0 || insertResult[1] == 0) {
                        transaction.rollback();
                        res.status(200).json({
                            code: "2004",
                            msg: "처리 실패",
                            desc: "회원 정보 수정",
                        });
                    } else {
                        transaction.commit();
                        res.status(200).json({
                            code: "0000",
                            msg: "성공",
                            desc: "회원 정보 수정",
                        });
                    }
                } else {
                    if (updateResult2[1] == 0) {
                        transaction.rollback();
                        res.status(200).json({
                            code: "2004",
                            msg: "처리 실패",
                            desc: "회원 정보 수정",
                        });
                    } else {
                        transaction.commit();
                        res.status(200).json({
                            code: "0000",
                            msg: "성공",
                            desc: "회원 정보 수정",
                        });
                    }
                }
            } else {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "회원 정보 수정",
                });
            }
        } else {
            const updateQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.UPDATE.002",
                {
                    member_pk,
                    company_type,
                    company_class,
                    company_address,
                    company_zipcode,
                    company_ceo,
                    company_phone,
                    email,
                    img_url,
                    agent_code,
                },
                { language: "sql", indent: " " }
            );

            const updateResult = await req.sequelize.query(updateQuery, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            if (updateResult.length > 0) {
                if (is_newSalesman == true) {
                    const insertQuery2 = req.mybatisMapper.getStatement(
                        "V1",
                        "HAX.V1.INSERT.004",
                        {
                            member_pk: updateResult[0].member_pk,
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

                    if (updateResult[1] == 0 || insertResult2[1] == 0) {
                        transaction.rollback();
                        res.status(200).json({
                            code: "2004",
                            msg: "처리 실패",
                            desc: "회원 정보 수정",
                        });
                    } else {
                        transaction.commit();
                        res.status(200).json({
                            code: "0000",
                            msg: "성공",
                            desc: "회원 정보 수정",
                        });
                    }
                } else {
                    if (updateResult[1] == 0) {
                        transaction.rollback();
                        res.status(200).json({
                            code: "2004",
                            msg: "처리 실패",
                            desc: "회원 정보 수정",
                        });
                    } else {
                        transaction.commit();
                        res.status(200).json({
                            code: "0000",
                            msg: "성공",
                            desc: "회원 정보 수정",
                        });
                    }
                }
            } else {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "회원 정보 수정",
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
            desc: "회원 정보 수정",
            err: String(err),
        });
    }
});

app.put("/member/device/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    const device_id = isNull(req.body.device_id, null);
    const device_model = isNull(req.body.device_model, null);
    const os_type = isNull(req.body.os_type, null);
    const push_token = isNull(req.body.push_token, null);

    if (member_pk === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.027",
            { member_pk, device_id, device_model, os_type, push_token },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "회원 디바이스정보 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "회원 디바이스정보 수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "회원 디바이스정보 수정",
            err: String(err),
        });
    }
});

app.get("/salesman/list", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);
    let sort_item = isNull(req.query.sort_item, "reg");
    let term_start = isNull(req.query.term_start, null);
    let term_end = isNull(req.query.term_end, null);
    let sort_type = isNull(req.query.sort_type, "DESC");
    const is_excel = isNull(req.query.is_excel, false);

    const current = page;

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.026",
            {
                page,
                paginate,
                search_word,
                sort_item,
                term_start,
                term_end,
                sort_type,
                is_excel,
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (is_excel == true || is_excel == "true") {
            if (selectResult.length > 0) {
                const url = await sendCMSExcel(req, selectResult, [
                    { header: "이름", key: "name", width: 15 },
                    { header: "코드값", key: "special_code", width: 15 },
                    { header: "구매대행액", key: "total_amount", width: 15 },
                    { header: "인센티브액", key: "total_incentive", width: 15 },
                    { header: "상태", key: "use_yn", width: 10 },
                ]);
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "회원목록 조회",
                    url,
                });
                return;
            } else {
                res.status(200).json({
                    code: "2004",
                    msg: "엑셀 추출 실패",
                    desc: "회원목록 조회",
                });
            }
        }

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "영업사원목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    salesmanList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "영업사원목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    salesmanList: selectResult,
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
            desc: "영업사원목록 조회",
            err: String(err),
        });
    }
});

app.post("/salesman/regist", async (req, res) => {
    const user_id = isNull(req.body.user_id, null);
    const name = isNull(req.body.name, null);
    const password = isNull(req.body.password, null);
    const email = isNull(req.body.email, null);
    const phone = isNull(req.body.phone, null);
    const incentive_2 = isNull(req.body.incentive_2, null);
    const incentive_3 = isNull(req.body.incentive_3, null);
    const is_salesman = true;
    const member_type = "Salesman";
    const enc_key = "hexagon2021@)@!";

    if ([user_id, name, password, email, phone].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.027",
            {
                language: "sql",
                indent: " ",
            }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            let code = selectResult[0].count;
            code = code.toString();
            const codeLength = code.length;
            let special_code = null;
            switch (codeLength) {
                case 1:
                    special_code = "S" + "00" + code;
                    break;
                case 2:
                    special_code = "S" + "0" + code;
                    break;
                case 3:
                    special_code = "S" + code;
                    break;
            }

            const insertQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.INSERT.007",
                {
                    user_id,
                    name,
                    password,
                    email,
                    phone,
                    incentive_2,
                    incentive_3,
                    is_salesman,
                    member_type,
                    enc_key,
                    special_code,
                },
                { language: "sql", indent: " " }
            );

            const insertResult = await req.sequelize.query(insertQuery, {
                type: req.sequelize.QueryTypes.INSERT,
            });

            if (insertResult[1] == 0) {
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "영업사원 등록",
                });
            } else {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "영업사원 등록",
                });
            }
        } else {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "영업사원 등록",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "영업사원 등록",
            err: String(err),
        });
    }
});

app.get("/salesman/view/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);

    if (member_pk === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.030",
            { member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "영업사원 상세정보 조회",
            data: { userDetail: selectResult[0] },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "영업사원 상세정보 조회",
            err: String(err),
        });
    }
});

app.get("/salesman/charge/list/:special_code", async (req, res) => {
    const special_code = isNull(req.params.special_code, null);
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);

    const current = page;

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    if ([page, paginate].includes(NaN) || special_code == null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.029",
            {
                page,
                paginate,
                search_word,
                special_code,
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "영업사원 담당 회원리스트 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    salesmanList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "영업사원 담당 회원리스트 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    salesmanList: selectResult,
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
            desc: "영업사원 담당 회원리스트 조회",
            err: String(err),
        });
    }
});

app.get("/salesman/incentive/month/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    // const today = Date.now();
    // const todayYear = new Date(today).getFullYear();
    // const todayMonth = new Date(today).getMonth();
    // let sales_month = null;
    const sales_month = isNull(req.query.sales_month, null);

    if ([member_pk, sales_month].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    // if (todayMonth >= 9) {
    //     sales_month = todayYear + "-" + (todayMonth + 1);
    // } else {
    //     sales_month = todayYear + "-" + "0" + (todayMonth + 1);
    // }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.058",
            {
                member_pk,
                sales_month,
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "영업사원목록 인센티브 조회(월별 구매내역)",
                data: {
                    monthData: selectResult[0].incentive[0],
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "영업사원목록 인센티브 조회(월별 구매내역)",
                data: {
                    monthData: selectResult,
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
            desc: "영업사원목록 인센티브 조회(월별 구매내역)",
            err: String(err),
        });
    }
});

app.put("/salesman/modify/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    const name = isNull(req.body.name, null);
    const password = isNull(req.body.password, null);
    const email = isNull(req.body.email, null);
    const phone = isNull(req.body.phone, null);
    const incentive_2 = isNull(req.body.incentive_2, null);
    const incentive_3 = isNull(req.body.incentive_3, null);
    const is_retired = isNull(req.body.is_retired, null);
    const enc_key = "hexagon2021@)@!";

    console.log(is_retired);

    if ([member_pk, name, email, phone, is_retired].includes(null)) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
        });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        if (is_retired == "false" || is_retired == false) {
            const updateQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.UPDATE.022",
                {
                    member_pk,
                    name,
                    password,
                    email,
                    phone,
                    incentive_2,
                    incentive_3,
                    enc_key,
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
                    desc: "영업사원 수정",
                });
            } else {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "영업사원 수정",
                });
            }
        } else {
            const updateQuery2 = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.UPDATE.023",
                {
                    member_pk,
                },
                { language: "sql", indent: " " }
            );

            const updateResult2 = await req.sequelize.query(updateQuery2, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });
            console.log(updateResult2);

            if (updateResult2.length > 0) {
                const insertQuery = req.mybatisMapper.getStatement(
                    "CMS",
                    "HAX.CMS.INSERT.009",
                    {
                        updateResult2,
                    },
                    { language: "sql", indent: " " }
                );

                const insertResult = await req.sequelize.query(insertQuery, {
                    type: req.sequelize.QueryTypes.INSERT,
                    transaction,
                });

                if (updateResult2[1] == 0 || insertResult[1] == 0) {
                    transaction.rollback();
                    res.status(200).json({
                        code: "2004",
                        msg: "처리 실패",
                        desc: "영업사원 삭제",
                    });
                } else {
                    transaction.commit();
                    res.status(200).json({
                        code: "0000",
                        msg: "성공",
                        desc: "영업사원 삭제",
                    });
                }
            } else {
                if (updateResult2[1] == 0) {
                    transaction.rollback();
                    res.status(200).json({
                        code: "2004",
                        msg: "처리 실패",
                        desc: "영업사원 삭제",
                    });
                } else {
                    transaction.commit();
                    res.status(200).json({
                        code: "0000",
                        msg: "성공",
                        desc: "영업사원 삭제",
                    });
                }
            }
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "영업사원 수정 및 삭제",
            err: String(err),
        });
    }
});

app.patch("/salesman/company/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    const agent_code = isNull(req.body.agent_code, null);

    if ([member_pk, agent_code].includes(null)) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
        });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.028",
            {
                agent_code,
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery2 = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.032",
            {
                member_pk,
                agent_code,
            },
            { language: "sql", indent: " " }
        );

        const selectResult2 = await req.sequelize.query(selectQuery2, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult2.length > 0) {
            res.status(200).json({
                code: "1023",
                msg: "동일한 영업사원 코드",
                desc: "담당 영업사원 수정",
            });
            return;
        }

        if (selectResult.length > 0) {
            const updateQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.UPDATE.026",
                {
                    member_pk,
                    agent_code,
                },
                { language: "sql", indent: " " }
            );

            const updateResult = await req.sequelize.query(updateQuery, {
                type: req.sequelize.QueryTypes.UPDATE,
                transaction,
            });

            const insertQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.INSERT.008",
                {
                    member_pk,
                    agent_code,
                },
                { language: "sql", indent: " " }
            );

            const insertResult = await req.sequelize.query(insertQuery, {
                type: req.sequelize.QueryTypes.INSERT,
                transaction,
            });

            if (updateResult[1] == 0 || insertResult[1] == 0) {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "담당 영업사원 수정",
                });
            } else {
                transaction.commit();
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "담당 영업사원 수정",
                });
            }
        } else {
            res.status(200).json({
                code: "1022",
                msg: "유효하지 않은 영업사원 코드",
                desc: "담당 영업사원 수정",
            });
            return;
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "담당 영업사원 수정",
            err: String(err),
        });
    }
});

app.patch("/salesman/modify/pass/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    const nowPassword = isNull(req.body.nowPassword, null);
    const newPassword = isNull(req.body.newPassword, null);
    const enc_key = "hexagon2021@)@!";

    if ([member_pk, nowPassword, newPassword].includes(null)) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
        });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.031",
            {
                member_pk,
                enc_key,
                nowPassword,
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            const updateQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.UPDATE.025",
                {
                    member_pk,
                    newPassword,
                    enc_key,
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
                    desc: "영업사원 비밀번호 수정",
                });
            } else {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "영업사원 비밀번호 수정",
                });
            }
        } else {
            res.status(200).json({
                code: "1002",
                msg: "현재 비밀번호가 틀렸음",
                desc: "영업사원 비밀번호 수정",
            });
            return;
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "영업사원 비밀번호 수정",
            err: String(err),
        });
    }
});

app.patch("/salesman/retire/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);

    if ([member_pk].includes(null)) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
        });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.023",
            {
                member_pk,
            },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (updateResult.length > 0) {
            const insertQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.INSERT.009",
                {
                    updateResult2: updateResult,
                },
                { language: "sql", indent: " " }
            );

            const insertResult = await req.sequelize.query(insertQuery, {
                type: req.sequelize.QueryTypes.INSERT,
                transaction,
            });

            if (updateResult[1] == 0 || insertResult[1] == 0) {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "영업사원 삭제",
                });
            } else {
                transaction.commit();
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "영업사원 삭제",
                });
            }
        } else {
            if (updateResult[1] == 0) {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "영업사원 삭제",
                });
            } else {
                transaction.commit();
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "영업사원 삭제",
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
            desc: "영업사원 삭제",
            err: String(err),
        });
    }
});

app.get("/category/list", async (req, res) => {
    // let page = parseInt(isNull(req.query.page, 1));
    // const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);
    const is_cms = isNull(req.query.is_cms, false);
    const is_excel = isNull(req.query.is_excel, false);
    const is_use = isNull(req.query.is_use, null);

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    // if ([page, paginate].includes(NaN)) {
    //     res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
    //     return;
    // }

    // page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.006",
            { search_word, is_cms, is_use },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery2 = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.021",
            { search_word, is_cms, is_use },
            { language: "sql", indent: " " }
        );

        const selectResult2 = await req.sequelize.query(selectQuery2, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (is_excel == true || is_excel == "true") {
            const categoryExcelQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.065",
                { search_word, is_cms },
                { language: "sql", indent: " " }
            );

            const categoryExcelResult = await req.sequelize.query(
                categoryExcelQuery,
                {
                    type: req.sequelize.QueryTypes.SELECT,
                }
            );

            if (categoryExcelResult.length > 0) {
                const url = await sendCMSExcel(req, categoryExcelResult, [
                    {
                        header: "카테고리구분",
                        key: "category_type_name",
                        width: 15,
                    },
                    { header: "카테고리명", key: "category_name", width: 15 },
                    { header: "상품수", key: "product_count", width: 15 },
                ]);
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "카테고리 목록 조회",
                    url,
                });
                return;
            } else {
                res.status(200).json({
                    code: "2004",
                    msg: "엑셀 추출 실패",
                    desc: "카테고리 목록 조회",
                });
            }
        }

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "카테고리 목록 조회",
            data: {
                categoryBrandList: selectResult,
                categoryNormalList: selectResult2,
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "카테고리 목록 조회",
            err: String(err),
        });
    }
});

app.get("/category/depth/list", async (req, res) => {
    // let page = parseInt(isNull(req.query.page, 1));
    // const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    // if ([page, paginate].includes(NaN)) {
    //     res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
    //     return;
    // }

    // page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.020",
            { search_word },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "카테고리 목록 조회",
            data: {
                categoryDepthList: selectResult,
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "카테고리 목록 조회",
            err: String(err),
        });
    }
});

app.get("/category/view/:category_pk", async (req, res) => {
    const category_pk = isNull(req.params.category_pk, null);
    const category_type = isNull(req.query.category_type, null);

    if ([category_pk, category_type].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        if (category_type == "B") {
            const selectQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.007",
                { category_pk },
                { language: "sql", indent: " " }
            );

            const selectResult = await req.sequelize.query(selectQuery, {
                type: req.sequelize.QueryTypes.SELECT,
            });

            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "카테고리 상세정보 조회",
                data: {
                    categoryDetail: selectResult[0],
                },
            });
        } else {
            const selectQuery2 = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.025",
                { category_pk },
                { language: "sql", indent: " " }
            );

            const selectResult2 = await req.sequelize.query(selectQuery2, {
                type: req.sequelize.QueryTypes.SELECT,
            });

            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "카테고리 상세정보 조회",
                data: {
                    categoryDetail: selectResult2[0],
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
            desc: "카테고리 상세정보 조회",
            err: String(err),
        });
    }
});

app.post("/category/regist", async (req, res) => {
    const category_name = isNull(req.body.category_name, null);
    const category_logo = isNull(req.body.category_logo, null);
    const category_type = isNull(req.body.category_type, null);
    const normalcategory_pk = isNull(req.body.normalcategory_pk, null);
    const reg_member = isNull(req.body.reg_member, null);

    if (
        [category_name, category_logo, category_type, reg_member].includes(null)
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        if (category_type == "N") {
            if (normalcategory_pk == null) {
                res.status(200).json({
                    code: "2007",
                    msg: "제품군 pk 필요",
                });
                return;
            }

            const selectQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.022",
                { normalcategory_pk },
                { language: "sql", indent: " " }
            );

            const selectResult = await req.sequelize.query(selectQuery, {
                type: req.sequelize.QueryTypes.SELECT,
            });

            if (selectResult.length > 0) {
                res.status(200).json({
                    code: "1017",
                    msg: "카테고리 번호 중복",
                    desc: "카테고리 등록",
                });
                return;
            }
        }

        if (category_type == "B") {
            const selectQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.023",
                { category_name },
                { language: "sql", indent: " " }
            );

            const selectResult = await req.sequelize.query(selectQuery, {
                type: req.sequelize.QueryTypes.SELECT,
            });

            if (selectResult.length > 0) {
                res.status(200).json({
                    code: "1018",
                    msg: "카테고리 명 중복",
                    desc: "카테고리 등록",
                });
                return;
            }
        }

        const insertQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.INSERT.001",
            {
                category_name,
                category_logo,
                category_type,
                normalcategory_pk,
                reg_member,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.INSERT,
        });

        if (insertResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "카테고리 등록",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "카테고리 등록",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "카테고리 등록",
            err: String(err),
        });
    }
});

app.put("/category/modify/:category_pk", async (req, res) => {
    const category_pk = isNull(req.params.category_pk, null);
    const category_name = isNull(req.body.category_name, null);
    const category_logo = isNull(req.body.category_logo, null);
    const category_seq = isNull(req.body.category_seq, null);
    const category_type = isNull(req.body.category_type, null);
    const normalcategory_pk = isNull(req.body.normalcategory_pk, null);
    const category_yn = isNull(req.body.category_yn, null);

    if (
        [
            category_pk,
            category_name,
            category_logo,
            category_type,
            category_seq,
            category_yn,
        ].includes(null)
    ) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
        });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.003",
            {
                category_pk,
                category_name,
                category_logo,
                category_seq,
                category_type,
                normalcategory_pk,
                category_yn,
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
                desc: "카테고리 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "카테고리 수정",
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
            desc: "카테고리 수정",
            err: String(err),
        });
    }
});

app.put("/category/seqmodify", async (req, res) => {
    const category_type = isNull(req.body.category_type, null);
    const category_array = isNull(req.body.category_array, null);

    if (
        [category_type, category_array].includes(null) ||
        category_array == false
    ) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터3",
            returnData: req.body,
        });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.018",
            {
                category_type,
                category_array,
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
                desc: "카테고리 정렬 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "카테고리 정렬 수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "카테고리 정렬 수정",
            err: String(err),
        });
    }
});

app.delete("/category/remove", async (req, res) => {
    const category_array = isNull(req.body.category_array, null);

    if (category_array === null || category_array == false) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
            returnData: req.body,
        });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.004",
            { category_array },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "카테고리 삭제",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "카테고리 삭제",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "카테고리 삭제",
            err: String(err),
        });
    }
});

app.get("/product/category/list", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);

    const current = page;

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.016",
            { page, paginate, search_word },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "카테고리 상품 선택",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    productCategory: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "회원목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    productCategory: selectResult,
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
            desc: "카테고리 상품 선택",
            err: String(err),
        });
    }
});

app.get("/product/list", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);
    const category_pk = isNull(req.query.category_pk, null);
    const sortItem = isNull(req.query.sortItem, "recomm");
    const is_excel = isNull(req.query.is_excel, false);
    const is_use = isNull(req.query.is_use, null);

    const current = page;

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.017",
            {
                page,
                paginate,
                search_word,
                category_pk,
                sortItem,
                is_excel,
                is_use,
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (is_excel == true || is_excel == "true") {
            if (selectResult.length > 0) {
                const url = await sendCMSExcel(req, selectResult, [
                    {
                        header: "카테고리구분",
                        key: "category_type_name",
                        width: 15,
                    },
                    { header: "카테고리명", key: "category_name", width: 15 },
                    { header: "상품명", key: "product_name", width: 30 },
                    { header: "낱개가격", key: "each_price", width: 15 },
                    { header: "박스가격", key: "box_price", width: 15 },
                    { header: "카톤가격", key: "carton_price", width: 15 },
                    {
                        header: "이벤트낱개가격",
                        key: "event_each_price",
                        width: 15,
                    },
                    {
                        header: "이벤트박스가격",
                        key: "event_box_price",
                        width: 15,
                    },
                    {
                        header: "이벤트카톤가격",
                        key: "event_carton_price",
                        width: 15,
                    },
                ]);
                console.log(selectResult);
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "상품목록 조회",
                    url,
                });
                return;
            } else {
                res.status(200).json({
                    code: "2004",
                    msg: "엑셀 추출 실패",
                    desc: "상품목록 조회",
                });
            }
        }

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "상품목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    productList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "상품목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    productList: selectResult,
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
            desc: "상품목록 조회",
            err: String(err),
        });
    }
});

app.get("/product/mdlist", async (req, res) => {
    
    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.MDRECOM",
            {
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });


        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "MD추천상품목록 조회",
                data: {
                    productList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "MD추천상품목록 조회",
                data: {
                    productList: selectResult,
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
            desc: "상품목록 조회",
            err: String(err),
        });
    }
});

app.get("/product/all", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    // let search_word = isNull(req.query.search_word, null);
    const category_pk = isNull(req.query.category_pk, null);

    const current = page;

    // if (search_word != null) {
    //     search_word = "%" + search_word + "%";
    // }

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.038",
            {
                page,
                paginate,
                category_pk,
                // ,search_word
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 상품목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    productList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 상품목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    productList: selectResult,
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
            desc: "이벤트 상품목록 조회",
            err: String(err),
        });
    }
});

app.get("/product/view/:product_pk", async (req, res) => {
    const product_pk = isNull(req.params.product_pk, null);

    if ([product_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.018",
            { product_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "상품 상세정보 조회",
            data: {
                productDetail: selectResult[0],
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "상품 상세정보 조회",
            err: String(err),
        });
    }
});

app.post("/product/regist", async (req, res) => {
    const product_name = isNull(req.body.product_name, null);
    const category_pk = isNull(req.body.category_pk, null);
    const material = isNull(req.body.material, null);
    const thumb_img = isNull(req.body.thumb_img, null);
    const detail_img1 = isNull(req.body.detail_img1, null);
    const detail_img2 = isNull(req.body.detail_img2, null);
    const detail_img3 = isNull(req.body.detail_img3, null);
    const detail_img4 = isNull(req.body.detail_img4, null);
    const each_price = isNull(req.body.each_price, null);
    const box_price = isNull(req.body.box_price, 0);
    const box_unit = isNull(req.body.box_unit, 0);
    const carton_price = isNull(req.body.carton_price, 0);
    const carton_unit = isNull(req.body.carton_unit, 0);
    const event_each_price = isNull(req.body.event_each_price, 0);
    const event_box_price = isNull(req.body.event_box_price, 0);
    const event_box_unit = isNull(req.body.event_box_unit, 0);
    const event_carton_price = isNull(req.body.event_carton_price, 0);
    const event_carton_unit = isNull(req.body.event_carton_unit, 0);
    const can_point = isNull(req.body.can_point, true);
    const is_nonpoint = isNull(req.body.is_nonpoint, null);
    const event_each_stock = isNull(req.body.event_each_stock, 0);
    const event_box_stock = isNull(req.body.event_box_stock, 0);
    const event_carton_stock = isNull(req.body.event_carton_stock, 0);
    let profit_box = 0;
    let profit_carton = 0;
    const reg_member = isNull(req.body.reg_member, null);
    const use_yn = isNull(req.body.use_yn, false);
    res.header("Access-Control-Allow-Origin", "*");

    if (
        [
            product_name,
            category_pk,
            thumb_img,
            detail_img1,
            is_nonpoint,
            each_price,
            reg_member,
            use_yn,
        ].includes(null)
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    if (box_price != 0 && box_unit != 0) {
        profit_box = box_unit * each_price - box_price;
    }

    if (carton_price != 0 && carton_unit != 0) {
        profit_carton = carton_unit * each_price - carton_price;
    }

    try {
        // const selectQuery = req.mybatisMapper.getStatement(
        //     "CMS",
        //     "HAX.CMS.SELECT.024",
        //     { product_name, category_pk },
        //     { language: "sql", indent: " " }
        // );

        // const selectResult = await req.sequelize.query(selectQuery, {
        //     type: req.sequelize.QueryTypes.SELECT,
        // });

        // if (selectResult.length > 0) {
        //     res.status(200).json({
        //         code: "1019",
        //         msg: "제품명 및 카테고리 중복",
        //         desc: "상품 등록",
        //     });
        //     return;
        // } else {
        const insertQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.INSERT.006",
            {
                product_name,
                category_pk,
                material,
                thumb_img,
                detail_img1,
                detail_img2,
                detail_img3,
                detail_img4,
                each_price,
                box_price,
                box_unit,
                carton_price,
                carton_unit,
                event_each_price,
                event_box_price,
                event_box_unit,
                event_carton_price,
                event_carton_unit,
                can_point,
                is_nonpoint,
                profit_box,
                profit_carton,
                event_each_stock,
                event_box_stock,
                event_carton_stock,
                reg_member,
                use_yn,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.INSERT,
        });

        if (insertResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "상품 등록",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "상품 등록",
            });
        }
        // }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "상품 등록",
            err: String(err),
        });
    }
});

app.put("/product/modify/:product_pk", async (req, res) => {
    const product_pk = isNull(req.params.product_pk, null);
    const product_name = isNull(req.body.product_name, null);
    const category_pk = isNull(req.body.category_pk, null);
    const material = isNull(req.body.material, null);
    const thumb_img = isNull(req.body.thumb_img, null);
    const detail_img1 = isNull(req.body.detail_img1, null);
    const detail_img2 = isNull(req.body.detail_img2, null);
    const detail_img3 = isNull(req.body.detail_img3, null);
    const detail_img4 = isNull(req.body.detail_img4, null);
    const each_price = isNull(req.body.each_price, null);
    const box_price = isNull(req.body.box_price, 0);
    const box_unit = isNull(req.body.box_unit, 0);
    const carton_price = isNull(req.body.carton_price, 0);
    const carton_unit = isNull(req.body.carton_unit, 0);
    const event_each_price = isNull(req.body.event_each_price, 0);
    const event_box_price = isNull(req.body.event_box_price, 0);
    const event_box_unit = isNull(req.body.event_box_unit, 0);
    const event_carton_price = isNull(req.body.event_carton_price, 0);
    const event_carton_unit = isNull(req.body.event_carton_unit, 0);
    const can_point = isNull(req.body.can_point, true);
    const is_nonpoint = isNull(req.body.is_nonpoint, null);
    const use_yn = isNull(req.body.use_yn, false);
    const is_soldout = isNull(req.body.is_soldout, false);
    const event_each_stock = isNull(req.body.event_each_stock, 0);
    const event_box_stock = isNull(req.body.event_box_stock, 0);
    const event_carton_stock = isNull(req.body.event_carton_stock, 0);
    let profit_box = 0;
    let profit_carton = 0;

    if (
        [
            product_pk,
            product_name,
            category_pk,
            thumb_img,
            detail_img1,
            is_nonpoint,
            each_price,
            use_yn,
        ].includes(null)
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    if (box_price != 0 && box_unit != 0) {
        profit_box = box_unit * each_price - box_price;
    }

    if (carton_price != 0 && carton_unit != 0) {
        profit_carton = carton_unit * each_price - carton_price;
    }

    try {
        // const selectQuery = req.mybatisMapper.getStatement(
        //     "CMS",
        //     "HAX.CMS.SELECT.024",
        //     { product_name, category_pk },
        //     { language: "sql", indent: " " }
        // );

        // const selectResult = await req.sequelize.query(selectQuery, {
        //     type: req.sequelize.QueryTypes.SELECT,
        // });

        // if (selectResult.length > 0) {
        //     res.status(200).json({
        //         code: "1019",
        //         msg: "제품명 및 카테고리 중복",
        //         desc: "상품 수정",
        //     });
        //     return;
        // } else {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.013",
            {
                product_pk,
                product_name,
                category_pk,
                material,
                thumb_img,
                detail_img1,
                detail_img2,
                detail_img3,
                detail_img4,
                each_price,
                box_price,
                box_unit,
                carton_price,
                carton_unit,
                event_each_price,
                event_box_price,
                event_box_unit,
                event_carton_price,
                event_carton_unit,
                can_point,
                is_nonpoint,
                profit_box,
                profit_carton,
                use_yn,
                is_soldout,
                event_each_stock,
                event_box_stock,
                event_carton_stock,
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
                desc: "상품 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "상품 수정",
            });
        }
        // }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "상품 수정",
            err: String(err),
        });
    }
});

app.patch("/product/soldout/:product_pk", async (req, res) => {
    const product_pk = isNull(req.params.product_pk, null);
    const soldout = isNull(req.body.soldout, null);

    if ([product_pk, soldout].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.021",
            {
                product_pk,
                soldout,
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
                desc: "상품 품절 처리",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "상품 품절 처리",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "상품 품절 처리",
            err: String(err),
        });
    }
});
/*  대체품 등록 */
app.patch("/product/measure/:product_pk", async (req, res) => {
    const product_pk = isNull(req.params.product_pk, null);
    const target_pk = isNull(req.body.target_pk, null);
    const process_mode = isNull(req.body.process_mode, null);

    if ([product_pk, target_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        let updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.MEASURE",
            {
                product_pk,
                target_pk,
            },
            { language: "sql", indent: " " }
        );
        if ( process_mode == 'remove') {
           updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.DELETE.MEASURE",
            {
                product_pk
            },
            { language: "sql", indent: " " }
        ); 
        }

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "상품 품절 처리",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "상품 품절 처리",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "상품 품절 처리",
            err: String(err),
        });
    }
});

app.put("/product/seqmodify", async (req, res) => {
    const category_pk = isNull(req.body.category_pk, null);
    const product_array = isNull(req.body.product_array, null);

    if ([category_pk, product_array].includes(null) || product_array == false) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
            returnData: req.body,
        });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.019",
            {
                category_pk,
                product_array,
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
                desc: "상품 정렬 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "상품 정렬 수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "상품 정렬 수정",
            err: String(err),
        });
    }
});

/* MD추천상품 정리 */
app.put("/product/mdrecom", async (req, res) => {
    const product_array = isNull(req.body.product_array, null);

    if ([product_array].includes(null) || product_array == false) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
            returnData: req.body,
        });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.MDRECOM",
            {
                product_array
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
                desc: "MD 추천상품수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "MD 추천상품수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "상품 정렬 수정",
            err: String(err),
        });
    }
});


app.delete("/product/remove", async (req, res) => {
    const product_array = isNull(req.body.product_array, null);

    if ([product_array].includes(null) || product_array == false) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.014",
            { product_array },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "제품 삭제",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "제품 삭제",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "제품 삭제",
            err: String(err),
        });
    }
});

app.get("/event/list", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);

    const current = page;

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.040",
            { page, paginate, search_word },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    eventList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    eventList: selectResult,
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
            desc: "이벤트목록 조회",
            err: String(err),
        });
    }
});

app.get("/event/list/now", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);
    let today = Date.now();
    today = Math.floor(today / 1000);

    const current = page;

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.056",
            { page, paginate, search_word, today },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "현재 이벤트목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    eventList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "현재 이벤트목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    eventList: selectResult,
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
            desc: "현재 이벤트목록 조회",
            err: String(err),
        });
    }
});

app.get("/event/list/stop", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);
    let today = Date.now();
    today = Math.floor(today / 1000);

    const current = page;

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.055",
            { page, paginate, search_word, today },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "지난 이벤트목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    eventList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "지난 이벤트목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    eventList: selectResult,
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
            desc: "지난 이벤트목록 조회",
            err: String(err),
        });
    }
});

app.get("/event/view/:event_pk", async (req, res) => {
    const event_pk = isNull(req.params.event_pk, null);

    if (event_pk === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.041",
            { event_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery2 = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.042",
            { event_pk },
            { language: "sql", indent: " " }
        );

        const selectResult2 = await req.sequelize.query(selectQuery2, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 상세정보 조회",
                data: {
                    eventDetail: {
                        event_pk: selectResult[0].event_pk,
                        event_gubun: selectResult[0].event_gubun,
                        start_dt: selectResult[0].start_dt,
                        end_dt: selectResult[0].end_dt,
                        use_yn: selectResult[0].use_yn,
                        title: selectResult[0].title,
                        reg_dt: selectResult[0].reg_dt,
                        product_array: selectResult2,
                    },
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 상세정보 조회",
                data: {
                    eventDetail: {
                        event_pk: null,
                        event_gubun: null,
                        start_dt: null,
                        end_dt: null,
                        use_yn: null,
                        title: null,
                        reg_dt: null,
                        product_array: selectResult2,
                    },
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
            desc: "이벤트 상세정보 조회",
            err: String(err),
        });
    }
});

app.post("/event/regist", async (req, res) => {
    const event_gubun = isNull(req.body.event_gubun, null);
    let start_dt = isNull(req.body.start_dt, null);
    let end_dt = isNull(req.body.end_dt, null);
    const title = isNull(req.body.title, null);
    const product = isNull(req.body.product, null);
    let temp_dt = null;

    if (
        [event_gubun, start_dt, title, product].includes(null) ||
        product == false
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    if (end_dt != null) {
        if (start_dt > end_dt) {
            temp_dt = end_dt;
            end_dt = start_dt;
            start_dt = temp_dt;
        }
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const insertQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.INSERT.011",
            {
                event_gubun,
                start_dt,
                end_dt,
                title,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (insertResult.length > 0) {
            const event_pk = insertResult[0].event_pk;

            const insertQuery2 = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.INSERT.012",
                {
                    event_pk,
                    product,
                },
                { language: "sql", indent: " " }
            );

            const insertResult2 = await req.sequelize.query(insertQuery2, {
                type: req.sequelize.QueryTypes.INSERT,
                transaction,
            });

            if (insertResult[1] == 0 || insertResult2[1] == 0) {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "이벤트 등록",
                });
            } else {
                transaction.commit();
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "이벤트 등록",
                });
            }
        } else {
            transaction.rollback();
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "이벤트 등록",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "이벤트 등록",
            err: String(err),
        });
    }
});

app.put("/event/modify/:event_pk", async (req, res) => {
    const event_pk = isNull(req.params.event_pk, null);
    const event_gubun = isNull(req.body.event_gubun, null);
    const start_dt = isNull(req.body.start_dt, null);
    const end_dt = isNull(req.body.end_dt, null);
    const title = isNull(req.body.title, null);
    const product = isNull(req.body.product, null);

    if (
        [event_pk, event_gubun, start_dt, title, product].includes(null) ||
        product == false
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.029",
            {
                event_pk,
                event_gubun,
                start_dt,
                end_dt,
                title,
            },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (updateResult.length > 0) {
            const event_pk2 = updateResult[0].event_pk;

            const insertQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.INSERT.013",
                {
                    event_pk2,
                    product,
                },
                { language: "sql", indent: " " }
            );

            const insertResult = await req.sequelize.query(insertQuery, {
                type: req.sequelize.QueryTypes.INSERT,
                transaction,
            });

            if (updateResult[1] == 0 || insertResult[1] == 0) {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "이벤트 수정",
                });
            } else {
                transaction.commit();
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "이벤트 수정",
                });
            }
        } else {
            transaction.rollback();
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "이벤트 수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "이벤트 수정",
            err: String(err),
        });
    }
});

app.patch("/event/stop/:event_pk", async (req, res) => {
    const event_pk = isNull(req.params.event_pk, null);

    if ([event_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.037",
            {
                event_pk,
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
                desc: "이벤트 중지",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 중지",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "이벤트 중지",
            err: String(err),
        });
    }
});

app.delete("/event/remove/:event_pk", async (req, res) => {
    const event_pk = isNull(req.params.event_pk, null);

    if ([event_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.033",
            {
                event_pk,
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
                desc: "이벤트 삭제",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 삭제",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "이벤트 삭제",
            err: String(err),
        });
    }
});

app.get("/banner/list", async (req, res) => {
    // let page = parseInt(isNull(req.query.page, 1));
    // const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);

    // const current = page;

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    // if ([page, paginate].includes(NaN)) {
    //     res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
    //     return;
    // }

    // page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.033",
            {
                // page, paginate,
                search_word,
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "배너목록 조회",
            data: {
                bannerList: selectResult,
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "배너목록 조회",
            err: String(err),
        });
    }
});

app.get("/banner/view/:banner_pk", async (req, res) => {
    const banner_pk = isNull(req.params.banner_pk, null);
    const inlink_type = isNull(req.query.inlink_type, null);
    const link_type = isNull(req.query.link_type, null);

    if ([banner_pk, link_type].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        if (link_type == "INLINK") {
            if (inlink_type == "PRODUCT") {
                const selectQuery = req.mybatisMapper.getStatement(
                    "CMS",
                    "HAX.CMS.SELECT.034",
                    { banner_pk },
                    { language: "sql", indent: " " }
                );

                const selectResult = await req.sequelize.query(selectQuery, {
                    type: req.sequelize.QueryTypes.SELECT,
                });

                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "배너 상세정보 조회(상품)",
                    data: { bannerDetail: selectResult[0] },
                });
            } else if (inlink_type == "CATEGORY") {
                const selectQuery2 = req.mybatisMapper.getStatement(
                    "CMS",
                    "HAX.CMS.SELECT.044",
                    { banner_pk },
                    { language: "sql", indent: " " }
                );

                const selectResult2 = await req.sequelize.query(selectQuery2, {
                    type: req.sequelize.QueryTypes.SELECT,
                });

                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "배너 상세정보 조회(카테고리)",
                    data: { bannerDetail: selectResult2[0] },
                });
            } else {
                const selectQuery4 = req.mybatisMapper.getStatement(
                    "CMS",
                    "HAX.CMS.SELECT.045",
                    { banner_pk },
                    { language: "sql", indent: " " }
                );

                const selectResult4 = await req.sequelize.query(selectQuery4, {
                    type: req.sequelize.QueryTypes.SELECT,
                });

                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "배너 상세정보 조회(이벤트)",
                    data: { bannerDetail: selectResult4[0] },
                });
            }
        } else {
            const selectQuery3 = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.043",
                { banner_pk },
                { language: "sql", indent: " " }
            );

            const selectResult3 = await req.sequelize.query(selectQuery3, {
                type: req.sequelize.QueryTypes.SELECT,
            });

            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "배너 상세정보 조회(OUTLINK)",
                data: { bannerDetail: selectResult3[0] },
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "배너 상세정보 조회",
            err: String(err),
        });
    }
});

app.post("/banner/regist", async (req, res) => {
    const inlink_type = isNull(req.body.inlink_type, null);
    const img_url = isNull(req.body.img_url, null);
    const display_seq = isNull(req.body.display_seq, null);
    const content = isNull(req.body.content, null);
    const title = isNull(req.body.title, null);
    const target_pk = isNull(req.body.target_pk, null);
    const target_url = isNull(req.body.target_url, null);
    const link_type = isNull(req.body.link_type, null);

    if ([link_type, img_url, title, content].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.039",
            {
                language: "sql",
                indent: " ",
            }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult[0].count >= 10) {
            res.status(200).json({
                code: "1026",
                msg: "배너 10개 초과",
                desc: "배너 등록",
            });
        } else {
            const insertQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.INSERT.010",
                {
                    inlink_type,
                    img_url,
                    display_seq,
                    content,
                    title,
                    target_pk,
                    target_url,
                    link_type,
                },
                { language: "sql", indent: " " }
            );

            const insertResult = await req.sequelize.query(insertQuery, {
                type: req.sequelize.QueryTypes.INSERT,
            });

            if (insertResult[1] == 0) {
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "배너 등록",
                });
            } else {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "배너 등록",
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
            desc: "배너 등록",
            err: String(err),
        });
    }
});

app.put("/banner/modify/:banner_pk", async (req, res) => {
    const banner_pk = isNull(req.params.banner_pk, null);
    const inlink_type = isNull(req.body.inlink_type, null);
    const img_url = isNull(req.body.img_url, null);
    const content = isNull(req.body.content, null);
    const title = isNull(req.body.title, null);
    const target_pk = isNull(req.body.target_pk, null);
    const target_url = isNull(req.body.target_url, null);
    const link_type = isNull(req.body.link_type, null);

    if ([banner_pk, link_type, img_url, title, content].includes(null)) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
        });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.028",
            {
                banner_pk,
                inlink_type,
                img_url,
                content,
                title,
                target_pk,
                target_url,
                link_type,
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
                desc: "배너 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "배너 수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "배너 수정",
            err: String(err),
        });
    }
});

app.put("/banner/seqmodify", async (req, res) => {
    const banner_array = isNull(req.body.banner_array, null);

    console.log(banner_array[0].display_seq);
    if ([banner_array].includes(null) || banner_array == false) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
            returnData: req.body,
        });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.032",
            {
                banner_array,
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
                desc: "배너 정렬 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "배너 정렬 수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "배너 정렬 수정",
            err: String(err),
        });
    }
});

app.delete("/banner/remove/:banner_pk", async (req, res) => {
    const banner_pk = isNull(req.params.banner_pk, null);

    if ([banner_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const deleteQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.DELETE.001",
            { banner_pk },
            { language: "sql", indent: " " }
        );

        const deleteResult = await req.sequelize.query(deleteQuery, {
            type: req.sequelize.QueryTypes.DELETE,
        });

        console.log(deleteResult);
        if (deleteResult == false) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "배너 삭제",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "배너 삭제",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "배너 삭제",
            err: String(err),
        });
    }
});

app.put("/banner/removes", async (req, res) => {
    const banner_array = isNull(req.body.banner_array, null);

    if ([banner_array].includes(null) || banner_array == false) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const deleteQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.DELETE.002",
            { banner_array },
            { language: "sql", indent: " " }
        );

        const deleteResult = await req.sequelize.query(deleteQuery, {
            type: req.sequelize.QueryTypes.DELETE,
        });

        if (deleteResult == false) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "배너 배열 삭제",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "배너 배열 삭제",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "배너 배열 삭제",
            err: String(err),
        });
    }
});

app.get("/notice/list", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);

    const current = page;

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.008",
            { page, paginate, search_word },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "공지사항목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    noticeList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "공지사항목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    noticeList: selectResult,
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
            desc: "공지사항목록 조회",
            err: String(err),
        });
    }
});

app.get("/notice/view/:notice_pk", async (req, res) => {
    const notice_pk = isNull(req.params.notice_pk, null);

    if (notice_pk === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }
    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.009",
            { notice_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        const selectQuery2 = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.064",
            { notice_pk },
            { language: "sql", indent: " " }
        );

        const selectResult2 = await req.sequelize.query(selectQuery2, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "공지사항 상세정보 조회",
                data: {
                    noticeDetail: selectResult[0],
                    pushLog: selectResult2,
                },
            });
        } else {
            res.status(200).json({
                code: "2001",
                msg: "조회된 데이터 없음",
                desc: "공지사항 상세정보 조회",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "공지사항 상세정보 조회",
            err: String(err),
        });
    }
});

app.post("/notice/regist", async (req, res) => {
    const title = isNull(req.body.title, null);
    const content = isNull(req.body.content, null);
    const start_dt = isNull(req.body.start_dt, null);
    const img_url = isNull(req.body.img_url, null);

    if ([title, content, start_dt].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const insertQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.INSERT.002",
            { title, content, start_dt, img_url },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (insertResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "공지사항 등록",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "공지사항 등록",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "공지사항 등록",
            err: String(err),
        });
    }
});

app.put("/notice/modify/:notice_pk", async (req, res) => {
    const notice_pk = isNull(req.params.notice_pk, null);
    const title = isNull(req.body.title, null);
    const content = isNull(req.body.content, null);
    const start_dt = isNull(req.body.start_dt, null);
    const img_url = isNull(req.body.img_url, null);

    if ([notice_pk, title, content, start_dt].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.005",
            { notice_pk, title, content, start_dt, img_url },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.INSERT,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "공지사항 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "공지사항 수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "공지사항 수정",
            err: String(err),
        });
    }
});

app.delete("/notice/remove/:notice_pk", async (req, res) => {
    const notice_pk = isNull(req.params.notice_pk, null);

    if (notice_pk === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }
    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.006",
            { notice_pk },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "공지사항 삭제",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "공지사항 삭제",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "공지사항 삭제",
            err: String(err),
        });
    }
});

app.get("/popup/list/now", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let today = Date.now();
    today = Math.floor(today / 1000);

    const current = page;

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.010",
            { page, paginate, today },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "팝업 현재목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    nowPopList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "팝업 현재목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    nowPopList: selectResult,
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
            desc: "팝업 현재목록 조회",
            err: String(err),
        });
    }
});

app.get("/popup/list/stop", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let today = Date.now();
    today = Math.floor(today / 1000);

    const current = page;

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.011",
            { page, paginate, today },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "팝업 지난목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    stopPopList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "팝업 지난목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    stopPopList: selectResult,
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
            desc: "팝업 지난목록 조회",
            err: String(err),
        });
    }
});

app.get("/popup/view/:popup_pk", async (req, res) => {
    const popup_pk = isNull(req.params.popup_pk, null);

    if ([popup_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.012",
            { popup_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "팝업 상세정보 조회",
            data: {
                popupDetail: selectResult[0],
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "팝업 상세정보 조회",
            err: String(err),
        });
    }
});

app.post("/popup/regist", async (req, res) => {
    const popup_gubun = isNull(req.body.popup_gubun, null);
    const popup_type = isNull(req.body.popup_type, null);
    const start_dt = isNull(req.body.start_dt, null);
    const img_url = isNull(req.body.img_url, null);
    const send_push = isNull(req.body.send_push, false);
    const end_dt = isNull(req.body.end_dt, null);
    const title = isNull(req.body.title, null);

    if ([popup_gubun, popup_type, start_dt, img_url, title].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const insertQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.INSERT.004",
            {
                popup_gubun,
                popup_type,
                start_dt,
                img_url,
                send_push,
                end_dt,
                title,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.INSERT,
        });

        if (insertResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "팝업 등록",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "팝업 등록",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "팝업 등록",
            err: String(err),
        });
    }
});

app.patch("/popup/stop/:popup_pk", async (req, res) => {
    const popup_pk = isNull(req.params.popup_pk, null);
    // const restart_dt = isNull(req.body.restart_dt, null);

    if ([popup_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        // if (end_dt == 0) {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.007",
            { popup_pk },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "팝업 중지",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "팝업 중지",
            });
        }
        // } else {
        // const updateQuery2 = req.mybatisMapper.getStatement(
        //     "CMS",
        //     "HAX.CMS.UPDATE.016",
        //     { popup_pk },
        //     { language: "sql", indent: " " }
        // );

        // const updateResult2 = await req.sequelize.query(updateQuery2, {
        //     type: req.sequelize.QueryTypes.UPDATE,
        // });

        // if (updateResult2[1] == 0) {
        //     res.status(200).json({
        //         code: "2004",
        //         msg: "처리 실패",
        //         desc: "팝업 재공지",
        //     });
        // } else {
        //     res.status(200).json({
        //         code: "0000",
        //         msg: "성공",
        //         desc: "팝업 재공지",
        //     });
        // }
        // }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "팝업 중지",
            err: String(err),
        });
    }
});

app.put("/popup/modify/:popup_pk", async (req, res) => {
    const popup_pk = isNull(req.params.popup_pk, null);
    const popup_gubun = isNull(req.body.popup_gubun, null);
    const popup_type = isNull(req.body.popup_type, null);
    const start_dt = isNull(req.body.start_dt, null);
    const img_url = isNull(req.body.img_url, null);
    const send_push = isNull(req.body.send_push, false);
    const end_dt = isNull(req.body.end_dt, null);
    const title = isNull(req.body.title, null);

    if (
        [popup_pk, popup_gubun, popup_type, start_dt, img_url, title].includes(
            null
        )
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.008",
            {
                popup_pk,
                popup_gubun,
                popup_type,
                start_dt,
                img_url,
                title,
                send_push,
                end_dt,
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
                desc: "팝업 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "팝업 수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "팝업 수정",
            err: String(err),
        });
    }
});

app.delete("/popup/remove/:popup_pk", async (req, res) => {
    const popup_pk = isNull(req.params.popup_pk, null);

    if ([popup_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.009",
            { popup_pk },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "팝업 삭제(개별)",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "팝업 삭제(개별)",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "팝업 삭제(개별)",
            err: String(err),
        });
    }
});

app.put("/popup/removes", async (req, res) => {
    const popup_array = isNull(req.body.popup_array, null);

    if ([popup_array].includes(null) || popup_array == false) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.034",
            { popup_array },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "팝업 삭제(다중)",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "팝업 삭제(다중)",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "팝업 삭제(다중)",
            err: String(err),
        });
    }
});

app.get("/popevent/list/now", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let today = Date.now();
    today = Math.floor(today / 1000);

    const current = page;

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.013",
            { page, paginate, today },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 팝업 현재목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    nowPopupEventList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 팝업 현재목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    nowPopupEventList: selectResult,
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
            desc: "이벤트 팝업 현재목록 조회",
            err: String(err),
        });
    }
});

app.get("/popevent/list/stop", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let today = Date.now();
    today = Math.floor(today / 1000);

    const current = page;

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.014",
            { page, paginate, today },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 팝업 지난목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    stopPopupEventList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 팝업 지난목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    stopPopupEventList: selectResult,
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
            desc: "이벤트 팝업 지난목록 조회",
            err: String(err),
        });
    }
});

app.get("/popevent/view/:popup_pk", async (req, res) => {
    const popup_pk = isNull(req.params.popup_pk, null);
    const inlink_type = isNull(req.query.inlink_type, null);

    if ([popup_pk, inlink_type].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        if (inlink_type == "EVENT") {
            const selectQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.015",
                { popup_pk },
                { language: "sql", indent: " " }
            );

            const selectResult = await req.sequelize.query(selectQuery, {
                type: req.sequelize.QueryTypes.SELECT,
            });

            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 팝업 상세정보 조회(이벤트)",
                data: {
                    popEventDetail: selectResult[0],
                },
            });
        } else {
            const selectQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.052",
                { popup_pk },
                { language: "sql", indent: " " }
            );

            const selectResult = await req.sequelize.query(selectQuery, {
                type: req.sequelize.QueryTypes.SELECT,
            });

            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 팝업 상세정보 조회(상품)",
                data: {
                    popEventDetail: selectResult[0],
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
            desc: "이벤트 팝업 상세정보 조회",
            err: String(err),
        });
    }
});

app.post("/popevent/regist", async (req, res) => {
    const popup_gubun = isNull(req.body.popup_gubun, null);
    const popup_type = isNull(req.body.popup_type, null);
    const start_dt = isNull(req.body.start_dt, null);
    const img_url = isNull(req.body.img_url, null);
    const send_push = isNull(req.body.send_push, false);
    const end_dt = isNull(req.body.end_dt, null);
    const title = isNull(req.body.title, null);
    const target_pk = isNull(req.body.target_pk, null);
    const inlink_type = isNull(req.body.inlink_type, null);

    if (
        [
            popup_gubun,
            popup_type,
            start_dt,
            img_url,
            title,
            target_pk,
            inlink_type,
        ].includes(null)
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const insertQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.INSERT.005",
            {
                popup_gubun,
                popup_type,
                start_dt,
                img_url,
                send_push,
                end_dt,
                title,
                target_pk,
                inlink_type,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.INSERT,
        });

        if (insertResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "이벤트 팝업 등록",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 팝업 등록",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "이벤트 팝업 등록",
            err: String(err),
        });
    }
});

app.patch("/popevent/stop/:popup_pk", async (req, res) => {
    const popup_pk = isNull(req.params.popup_pk, null);
    // const restart_dt = isNull(req.body.restart_dt, null);

    if ([popup_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        // if (end_dt == 0) {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.010",
            { popup_pk },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "이벤트 팝업 중지",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 팝업 중지",
            });
        }
        // } else {
        // const updateQuery = req.mybatisMapper.getStatement(
        //     "CMS",
        //     "HAX.CMS.UPDATE.017",
        //     { popup_pk },
        //     { language: "sql", indent: " " }
        // );

        // const updateResult = await req.sequelize.query(updateQuery, {
        //     type: req.sequelize.QueryTypes.UPDATE,
        // });

        // if (updateResult2[1] == 0) {
        //     res.status(200).json({
        //         code: "2004",
        //         msg: "처리 실패",
        //         desc: "이벤트 팝업 재공지",
        //     });
        // } else {
        //     res.status(200).json({
        //         code: "0000",
        //         msg: "성공",
        //         desc: "이벤트 팝업 재공지",
        //     });
        // }
        // }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "이벤트 팝업 중지",
            err: String(err),
        });
    }
});

app.put("/popevent/modify/:popup_pk", async (req, res) => {
    const popup_pk = isNull(req.params.popup_pk, null);
    const popup_gubun = isNull(req.body.popup_gubun, null);
    const popup_type = isNull(req.body.popup_type, null);
    const start_dt = isNull(req.body.start_dt, null);
    const img_url = isNull(req.body.img_url, null);
    const send_push = isNull(req.body.send_push, false);
    const end_dt = isNull(req.body.end_dt, null);
    const title = isNull(req.body.title, null);
    const target_pk = isNull(req.body.target_pk, null);
    const inlink_type = isNull(req.body.inlink_type, null);

    if (
        [
            popup_pk,
            popup_gubun,
            popup_type,
            start_dt,
            img_url,
            title,
            target_pk,
            inlink_type,
        ].includes(null)
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.012",
            {
                popup_pk,
                popup_gubun,
                popup_type,
                start_dt,
                img_url,
                send_push,
                end_dt,
                title,
                target_pk,
                inlink_type,
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
                desc: "이벤트 팝업 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 팝업 수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "이벤트 팝업 수정",
            err: String(err),
        });
    }
});

app.delete("/popevent/remove/:popup_pk", async (req, res) => {
    const popup_pk = isNull(req.params.popup_pk, null);

    if ([popup_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.011",
            { popup_pk },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "이벤트 팝업 삭제(개별)",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 팝업 삭제(개별)",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "이벤트 팝업 삭제(개별)",
            err: String(err),
        });
    }
});

app.put("/popevent/removes", async (req, res) => {
    const popup_array = isNull(req.body.popup_array, null);

    if ([popup_array].includes(null) || popup_array == false) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.034",
            { popup_array },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "이벤트 팝업 삭제(다중)",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "이벤트 팝업 삭제(다중)",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "이벤트 팝업 삭제(다중)",
            err: String(err),
        });
    }
});

app.get("/code-check", async (req, res) => {
    const special_code = isNull(req.query.special_code, null);

    if ([special_code].includes(null)) {
        res.status(200).json({
            code: "2005",
            desc: "유효하지 않은 파라미터",
        });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.019",
            { special_code },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "1013",
                msg: "추천인 코드 중복됨",
                desc: "코드 중복체크",
                data: {
                    specialCode: "코드가 중복되었습니다.",
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "코드 중복체크",
                data: {
                    specialCode: "코드가 중복되지 않았습니다.",
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
            desc: "코드 중복체크",
            err: String(err),
        });
    }
});

app.get("/coupon/list/ing", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    const member_pk = isNull(req.query.member_pk, null);
    let today = Date.now();
    today = Math.floor(today / 1000);

    const current = page;

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.035",
            { page, paginate, today, member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "사용가능한 쿠폰목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    validCouponList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "사용가능한 쿠폰목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    validCouponList: selectResult,
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
            desc: "사용가능한 쿠폰목록 조회",
            err: String(err),
        });
    }
});

app.get("/coupon/list/old", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let today = Date.now();
    today = Math.floor(today / 1000);

    const current = page;

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.036",
            { page, paginate, today },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "유효하지 않는 쿠폰목록 조회",
                currentPage: current,
                lastPage: Math.ceil(selectResult[0].total / paginate),
                total: selectResult[0].total,
                data: {
                    passCouponList: selectResult,
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "유효하지 않는 쿠폰목록 조회",
                currentPage: 0,
                lastPage: 0,
                total: 0,
                data: {
                    passCouponList: selectResult,
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
            desc: "유효하지 않는 쿠폰목록 조회",
            err: String(err),
        });
    }
});

app.get("/coupon/view/:coupon_pk", async (req, res) => {
    const coupon_pk = isNull(req.params.coupon_pk, null);

    if ([coupon_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.037",
            { coupon_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "쿠폰 상세정보 조회",
            data: {
                couponDetail: selectResult[0],
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "쿠폰 상세정보 조회",
            err: String(err),
        });
    }
});

app.post("/coupon/regist", async (req, res) => {
    const coupon_type = isNull(req.body.coupon_type, null);
    const price = isNull(req.body.price, null);
    const end_dt = isNull(req.body.end_dt, null);
    const target_array = isNull(req.body.target_array, null);
    const is_first = isNull(req.body.is_first, false);
    const issue_reason = isNull(req.body.issue_reason, null);

    if (
        [coupon_type, price, end_dt, target_array, issue_reason].includes(
            null
        ) ||
        target_array == false
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const insertQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.INSERT.003",
            {
                coupon_type,
                price,
                end_dt,
                target_array,
                is_first,
                issue_reason,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.INSERT,
        });

        if (insertResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "쿠폰 등록",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "쿠폰 등록",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "쿠폰 등록",
            err: String(err),
        });
    }
});

app.put("/coupon/modify/:coupon_pk", async (req, res) => {
    const coupon_pk = isNull(req.params.coupon_pk, null);
    const coupon_type = isNull(req.body.coupon_type, null);
    const price = isNull(req.body.price, null);
    const end_dt = isNull(req.body.end_dt, null);
    const member_pk = isNull(req.body.member_pk, null);
    const is_first = isNull(req.body.is_first, false);
    const update_reason = isNull(req.body.update_reason, null);

    if (
        [
            coupon_pk,
            coupon_type,
            price,
            end_dt,
            member_pk,
            update_reason,
        ].includes(null)
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.030",
            {
                coupon_pk,
                coupon_type,
                price,
                end_dt,
                member_pk,
                is_first,
                update_reason,
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
                desc: "쿠폰 수정",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "쿠폰 수정",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "쿠폰 수정",
            err: String(err),
        });
    }
});

app.delete("/coupon/remove/:coupon_pk", async (req, res) => {
    const coupon_pk = isNull(req.params.coupon_pk, null);

    if ([coupon_pk].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.UPDATE.031",
            { coupon_pk },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.UPDATE,
        });

        if (updateResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "쿠폰 삭제",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "쿠폰 삭제",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "쿠폰 삭제",
            err: String(err),
        });
    }
});

app.get("/order/list", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    let search_word = isNull(req.query.search_word, null);
    let term_start = isNull(req.query.term_start, null);
    let term_end = isNull(req.query.term_end, null);
    const sort_item = isNull(req.query.sort_item, "reg_dt");
    const sort_type = isNull(req.query.sort_type, "DESC");
    let special_code = isNull(req.query.special_code, null);
    const is_excel = isNull(req.query.is_excel, false);
    const member_pk = isNull(req.query.member_pk, null);
    const current = page;

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    if (special_code == "A001") {
        special_code = null;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.046",
            {
                page,
                paginate,
                search_word,
                term_start,
                term_end,
                sort_item,
                sort_type,
                special_code,
                is_excel,
                member_pk,
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (is_excel == true || is_excel == "true") {
            if (selectResult.length > 0) {
                const url = await sendCMSExcel(req, selectResult, [
                    { header: "구매번호", key: "order_no", width: 30 },
                    { header: "구매일자", key: "excelreg_dt", width: 15 },
                    { header: "회원명", key: "member_name", width: 15 },
                    { header: "구매액", key: "total_amount", width: 15 },
                    { header: "주문상태", key: "order_status_name", width: 15 },
                ]);
                console.log(selectResult);
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "구매내역 목록조회",
                    url,
                });
                return;
            } else {
                res.status(200).json({
                    code: "2004",
                    msg: "엑셀 추출 실패",
                    desc: "구매내역 목록조회",
                });
            }
        }

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "구매내역 목록조회",
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
                desc: "구매내역 목록조회",
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
            desc: "구매내역 목록조회",
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

        if (selectResult.length > 0) {
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

app.put("/order/modify/:order_pk", async (req, res) => {
    const order_pk = isNull(req.params.order_pk, null);
    const member_pk = isNull(req.body.member_pk, null);
    const nowOrderStatus = isNull(req.body.nowOrderStatus, null);
    const newOrderStatus = isNull(req.body.newOrderStatus, null);

    if ([order_pk, member_pk, nowOrderStatus].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        if (nowOrderStatus == "INCOME" && newOrderStatus == "TRANSING") {
            if ([newOrderStatus].includes(null)) {
                res.status(200).json({
                    code: "2005",
                    msg: "유효하지 않은 파라미터",
                });
                return;
            }

            const status_comment = "출고완료";
            const status_history_type = "TRANSING";

            const updateQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.UPDATE.035",
                {
                    order_pk,
                    member_pk,
                    newOrderStatus,
                    comment: status_comment,
                    history_type: status_history_type,
                },
                { language: "sql", indent: " " }
            );

            const updateResult = await req.sequelize.query(updateQuery, {
                type: req.sequelize.QueryTypes.UPDATE,
                transaction,
            });

            const selectQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.047",
                {
                    order_pk,
                },
                { language: "sql", indent: " " }
            );

            const selectResult = await req.sequelize.query(selectQuery, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            const selectQuery3 = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.059",
                {
                    order_pk,
                },
                { language: "sql", indent: " " }
            );

            const selectResult3 = await req.sequelize.query(selectQuery3, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            if (selectResult3.length > 0) {
                if (
                    (selectResult3[0].is_push == "true" &&
                        selectResult3[0].push_token != null) ||
                    (selectResult3[0].is_push == true &&
                        selectResult3[0].push_token != null)
                ) {
                    const title = "[슈퍼바인더알림]물품이 발송되었습니다.";
                    const body =
                        "[" +
                        selectResult3[0].name +
                        "]" +
                        selectResult3[0].subtitle +
                        "이 출고되었습니다.";
                    const TargetToken = selectResult3[0].push_token;
                    const routeName = "OrderDetailStack";
                    const routeIdx = order_pk;
                    const img_url = null;
                    let target = [];
                    target.push({ member_pk: selectResult3[0].member_pk });

                    let fcmresult = await firebase.sendMessage(
                        TargetToken,
                        title,
                        body,
                        routeName,
                        routeIdx,
                        img_url
                    );

                    const insertQuery3 = req.mybatisMapper.getStatement(
                        "CMS",
                        "HAX.CMS.INSERT.016",
                        {
                            gubun: routeName,
                            target,
                            routeIdx,
                        },
                        { language: "sql", indent: " " }
                    );

                    const insertResult3 = await req.sequelize.query(
                        insertQuery3,
                        {
                            type: req.sequelize.QueryTypes.INSERT,
                            transaction,
                        }
                    );
                }
            }

            if (selectResult.length > 0) {
                const reward_point = selectResult[0].reward_point;
                const reward_content = "상품주문 리워드";
                const reward_type = "Order";
                const reward_gubun = "p";

                const insertQuery = req.mybatisMapper.getStatement(
                    "CMS",
                    "HAX.CMS.INSERT.014",
                    {
                        member_pk,
                        content: reward_content,
                        reward_point,
                        reward_type,
                        reward_gubun,
                        order_pk,
                    },
                    { language: "sql", indent: " " }
                );

                const insertResult = await req.sequelize.query(insertQuery, {
                    type: req.sequelize.QueryTypes.INSERT,
                    transaction,
                });

                if (updateResult[1] == 0 || insertResult[1] == 0) {
                    transaction.rollback();
                    res.status(200).json({
                        code: "2004",
                        msg: "처리 실패",
                        desc: "구매내역 상태변경",
                    });
                } else {
                    transaction.commit();
                    res.status(200).json({
                        code: "0000",
                        msg: "성공",
                        desc: "구매내역 상태변경",
                    });
                }
            } else {
                if (updateResult[1] == 0) {
                    transaction.rollback();
                    res.status(200).json({
                        code: "2004",
                        msg: "처리 실패",
                        desc: "구매내역 상태변경",
                    });
                } else {
                    transaction.commit();
                    res.status(200).json({
                        code: "0000",
                        msg: "성공",
                        desc: "구매내역 상태변경",
                    });
                }
            }
        }

        if (nowOrderStatus == "CANCEL_B") {
            const selectQuery2 = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.048",
                {
                    order_pk,
                },
                { language: "sql", indent: " " }
            );

            const selectResult2 = await req.sequelize.query(selectQuery2, {
                type: req.sequelize.QueryTypes.SELECT,
            });

            const cancel_point = selectResult2[0].reward_point;
            const cancel_content = "주문취소에 따른 환급진행";
            const cancel_type = "Order";
            const cancel_gubun = "p";

            const insertQuery2 = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.INSERT.015",
                {
                    member_pk,
                    content: cancel_content,
                    reward_point: cancel_point,
                    reward_type: cancel_type,
                    reward_gubun: cancel_gubun,
                    order_pk,
                },
                { language: "sql", indent: " " }
            );

            const insertResult2 = await req.sequelize.query(insertQuery2, {
                type: req.sequelize.QueryTypes.INSERT,
            });

            if (insertResult2[1] == 0) {
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "환급처리",
                });
            } else {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "환급처리",
                });
            }
        }

        if (nowOrderStatus == "WAIT") {
            const cancel_comment = "주문취소";
            const cancel_history_type = "CANCEL_A";
            const cancel_status = "CANCEL_A";

            const updateQuery2 = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.UPDATE.035",
                {
                    order_pk,
                    member_pk,
                    newOrderStatus: cancel_status,
                    comment: cancel_comment,
                    history_type: cancel_history_type,
                },
                { language: "sql", indent: " " }
            );

            const updateResult2 = await req.sequelize.query(updateQuery2, {
                type: req.sequelize.QueryTypes.UPDATE,
            });

            if (updateResult2[1] == 0) {
                res.status(200).json({
                    code: "2004",
                    msg: "처리 실패",
                    desc: "주문취소처리",
                });
            } else {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "주문취소처리",
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
            desc: "구매내역 상태변경 및 환급처리 및 주문취소처리",
            err: String(err),
        });
    }
});

app.get("/home/analyst/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);
    let today = Date.now();
    let startDay = new Date(today);
    let endDay = new Date(today);
    startDay = startDay.setHours(0, 0, 0, 0);
    endDay = endDay.setHours(23, 59, 59, 0);
    startDay = Math.floor(startDay / 1000);
    endDay = Math.floor(endDay / 1000);

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.053",
            { startDay, endDay, member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult[0].rank_data != null) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "통계 데이터(홈)",
                data: {
                    rank_data: selectResult[0].rank_data,
                    today_sales: selectResult[0].today_sales[0],
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "통계 데이터(홈)",
                data: {
                    rank_data: null,
                    today_sales: null,
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
            desc: "통계 데이터(홈)",
            err: String(err),
        });
    }
});

app.get("/salesman/home/analyst/:special_code", async (req, res) => {
    const special_code = isNull(req.params.special_code, null);
    let today = Date.now();
    let startDay = new Date(today);
    let endDay = new Date(today);
    startDay = startDay.setHours(0, 0, 0, 0);
    endDay = endDay.setHours(23, 59, 59, 0);
    startDay = Math.floor(startDay / 1000);
    endDay = Math.floor(endDay / 1000);

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "CMS",
            "HAX.CMS.SELECT.054",
            { startDay, endDay, special_code },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult[0].rank_data != null) {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "통계 데이터(홈)(영업사원)",
                data: {
                    rank_data: selectResult[0].rank_data,
                    today_sales: selectResult[0].today_sales[0],
                },
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "통계 데이터(홈)(영업사원)",
                data: {
                    rank_data: null,
                    today_sales: null,
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
            desc: "통계 데이터(홈)(영업사원)",
            err: String(err),
        });
    }
});

app.post("/fcmsend/arrays", async (req, res) => {
    //const sleep = (ms) => {
    //return new Promise(resolve=>{
    //setTimeout(resolve,ms)
    //})
    //}
    const sendTitle = isNull(req.body.sendTitle, null);
    const sendBody = isNull(req.body.sendBody, null);
    let TargetArray = [];
    const sendRouteName = "OrderDetailStack";
    const sendRouteIdx = 1;
    // TargetToken =
    //     "dAaWu8ewRSC_U8J4FyXPCL:APA91bG7U0az1vSF00jj_dYHHSo05FQ5YMrCEZ9eeQTPZ88xwSXGIJlbeGGZP4u9OD6PT2MWeYXtIcqycFmFpAtHQRoNBkaE_IOr3fJEa2gHD0rFeWsDqCmeVQlTwD0QdqeHWCLQD6kc";

    if (sendTitle === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    } else {
        try {
            const selectQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.060",
                {
                    language: "sql",
                    indent: " ",
                }
            );

            const selectResult = await req.sequelize.query(selectQuery, {
                type: req.sequelize.QueryTypes.SELECT,
            });
            if (selectResult.length > 0) {
                for (const token of selectResult) {
                    TargetArray.push(token.push_token);
                }
                console.log(TargetArray);
                let fns = await firebase.sendMultiMessage(
                    TargetArray,
                    sendTitle,
                    sendBody,
                    sendRouteName,
                    sendRouteIdx
                );
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                });
            }
        } catch (err) {
            if (err) {
                console.error(err);
            }
            res.status(200).json({
                code: "9999",
                msg: "기타 서버 에러",
                err: String(err),
                returndata: TargetArray,
            });
        }
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

        if (selectResult.length > 0) {
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

app.post("/test", async (req, res) => {
    const today = Date.now();
    const todayYear = new Date(today).getFullYear();
    const todayMonth = new Date(today).getMonth();
    const todayDate = new Date(today).getDate();
    let startDay = new Date(todayYear, todayMonth - 3, 1);
    let endDay = new Date(todayYear, todayMonth, todayDate - 1);
    startDay = startDay.setHours(0, 0, 0, 0);
    endDay = endDay.setHours(23, 59, 59, 0);
    startDay = Math.floor(startDay / 1000);
    endDay = Math.floor(endDay / 1000);
    let gradeStart = new Date(todayYear, todayMonth, todayDate);
    let gradeEnd = new Date(todayYear, todayMonth + 3, 0);
    gradeStart = dateToYMDString(gradeStart);
    gradeEnd = dateToYMDString(gradeEnd);
    let test = new Date(todayYear, todayMonth);
    test = dateToYMString(test);
    let form = new Date(today);
    let to = new Date(today);
    form = form.setHours(0, 0, 0, 0);
    to = to.setHours(23, 59, 59, 0);
    form = Math.floor(form / 1000);
    to = Math.floor(to / 1000);

    res.status(200).json({
        data: {
            today,
            startDay,
            endDay,
            todayMonth,
            gradeStart,
            gradeEnd,
            test,
            form,
            to,
        },
    });

    try {
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "테스트용",
            err: String(err),
        });
    }
});

app.post("/test2", async (req, res) => {
    const member_pk = isNull(req.body.member_pk, null);
    const new_grade = isNull(req.body.new_grade, null);
    const coupon = isNull(req.body.coupon, null);

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "SCHEDULER",
            "HAX.SCHEDULER.SELECT.003",
            {
                coupon,
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            data: {
                selectResult,
            },
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "테스트용2",
            err: String(err),
        });
    }
});

app.post("/test/pushsend", async (req, res) => {
    const routeName = isNull(req.body.routeName, null);
    const routeIdx = isNull(req.body.routeIdx, null);
    const title = isNull(req.body.title, null);
    const comment = isNull(req.body.comment, null);
    const TargetToken = isNull(req.body.TargetToken, null);
    const img_url = isNull(req.body.img_url, null);

    if ([routeName, routeIdx, title, comment, TargetToken].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        let fns = await firebase.sendMessage(
            TargetToken,
            title,
            comment,
            routeName,
            routeIdx,
            img_url
        );

        res.status(200).json({
            code: "0000",
            msg: "성공",
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "푸쉬 테스트",
            err: String(err),
        });
    }
});

app.post("/pushsend", async (req, res) => {
    const routeName = isNull(req.body.routeName, null);
    const routeIdx = isNull(req.body.routeIdx, null);
    const title = isNull(req.body.title, null);
    const comment = isNull(req.body.comment, null);
    let targetArray = [];
    let targetMember = [];
    const img_url = isNull(req.body.img_url, null);

    if ([routeName, routeIdx, title, comment].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        if (routeName == "NoticeDetailStack") {
            const selectQuery = req.mybatisMapper.getStatement(
                "CMS",
                "HAX.CMS.SELECT.060",
                {
                    language: "sql",
                    indent: " ",
                }
            );

            const selectResult = await req.sequelize.query(selectQuery, {
                type: req.sequelize.QueryTypes.SELECT,
                transaction,
            });

            if (selectResult.length > 0) {
                for (const nt of selectResult) {
                    targetArray.push(nt.push_token);
                    targetMember.push({ member_pk: nt.member_pk });
                }

                if (targetArray.length > 1) {
                    let fnsArray = await firebase.sendMultiMessage(
                        targetArray,
                        title,
                        comment,
                        routeName,
                        routeIdx,
                        img_url
                    );
                } else {
                    const TargetToken = targetArray[0];
                    let fns = await firebase.sendMessage(
                        TargetToken,
                        title,
                        comment,
                        routeName,
                        routeIdx,
                        img_url
                    );
                }

                const updateQuery = req.mybatisMapper.getStatement(
                    "CMS",
                    "HAX.CMS.UPDATE.036",
                    {
                        routeIdx,
                    },
                    { language: "sql", indent: " " }
                );

                const updateResult = await req.sequelize.query(updateQuery, {
                    type: req.sequelize.QueryTypes.UPDATE,
                    transaction,
                });

                const insertQuery = req.mybatisMapper.getStatement(
                    "CMS",
                    "HAX.CMS.INSERT.016",
                    { gubun: routeName, target: targetMember, routeIdx },
                    { language: "sql", indent: " " }
                );

                const insertResult = await req.sequelize.query(insertQuery, {
                    type: req.sequelize.QueryTypes.INSERT,
                    transaction,
                });

                transaction.commit();
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "푸쉬 수동 발송",
                });
            } else {
                transaction.rollback();
                res.status(200).json({
                    code: "2001",
                    msg: "조회된 데이터 없음",
                    desc: "푸쉬 수동 발송",
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
            desc: "푸쉬 수동 발송",
            err: String(err),
        });
    }
});

app.post("/test/excel", async (req, res) => {
    // 엑셀 다운로드
    const list_type = isNull(req.body.list_type, null);

    const sort_item = isNull(req.body.sort_item, null);
    const sort_type = isNull(req.body.sort_type, "DESC");
    let search_word = isNull(req.body.search_word, null);
    const is_approval = isNull(req.body.is_approval, null);
    const special_code = isNull(req.body.special_code, null);
    const term_start = isNull(req.body.term_start, null);
    const term_end = isNull(req.body.term_end, null);

    if (search_word != null) {
        search_word = "%" + search_word + "%";
    }

    let mybatisQueryId = null;

    const workbook = new Workbook();
    const sheet = workbook.addWorksheet("cms.download");

    switch (list_type) {
        //회원
        case "U":
            mybatisQueryId = "HAX.CMS.SELECT.003";
            sheet.columns = [
                { header: "이름", key: "name", width: 15 },
                {
                    header: "코드값",
                    key: "special_code",
                    width: 15,
                },
                {
                    header: "구매총액",
                    key: "total_amount",
                    width: 15,
                },
                {
                    header: "리워드잔액",
                    key: "remain_reward",
                    width: 15,
                },
                { header: "등급", key: "grade_code", width: 15 },
            ];

            break;
        //잘못된 매개변수
        default:
            res.status(200).json({
                code: "2005",
                msg: "유효하지 않은 파라미터",
            });
            return;
    }

    const selectListQuery = req.mybatisMapper.getStatement(
        "CMS",
        mybatisQueryId,
        {
            search_word,
            special_code,
            is_approval,
            sort_item,
            sort_type,
            page: 0,
            is_excel: true,
            term_start,
            term_end,
        },
        { language: "sql", indent: "  " }
    );

    try {
        const selectListResults = await req.sequelize.query(selectListQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        sheet.addRows(selectListResults);
        console.log(selectListResults);

        //스타일 가공
        sheet.eachRow((row, number) => {
            row.alignment = { horizontal: "center" };

            if (number == 1) {
                row.eachCell(cell => {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "D9D9D9" },
                    };
                    cell.font = { bold: true };
                });
            }
        });
        console.log(workbook);
        console.log(sheet);

        res.setHeader(
            "Content-Type",
            // "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "vnd.ms-excel"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + "cms.download.xlsx"
        );

        return workbook.xlsx.write(res).then(function () {
            res.status(200).end();
        });
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "엑셀 테스트",
            err: String(err),
        });
    }
});

app.post("/delete/excel", async (req, res) => {
    // 엑셀 삭제
    const key = isNull(req.body.key, null);

    if ([key].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        s3.deleteObject(
            {
                Bucket: "hg-prod-file/public/excel", // 사용자 버켓 이름
                Key: key, // 버켓 내 경로
            },
            (err, data) => {
                if (err) {
                    throw err;
                }
                console.log("s3 deleteObject ", data);
            }
        );
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "엑셀 테스트",
            err: String(err),
        });
    }
});

module.exports = app;
