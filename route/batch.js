const express = require("express");
const app = express.Router();

const firebase = require("../middleware/firebase");
const { dateToYMDString, dateToYMString } = require("../lib/dateUtil");

/*영업사원 정산 매월 1일 00:01*/
app.get("/salesman/incentive", async (req, res) => {
    const today = Date.now();
    const todayYear = new Date(today).getFullYear();
    const todayMonth = new Date(today).getMonth();
    let startDay = new Date(todayYear, todayMonth - 1, 1);
    // let endDay = new Date(todayYear, todayMonth, 0);
    startDay = startDay.setHours(0, 0, 0, 0);
    // endDay = endDay.setHours(23, 59, 59, 0);
    startDay = Math.floor(startDay / 1000);
    // endDay = Math.floor(endDay / 1000);
    const testDay = Math.floor(today / 1000);
    let sales_month = new Date(todayYear, todayMonth - 1);
    const now = Math.floor(today / 1000);
    sales_month = dateToYMString(sales_month);

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const selectQuery = req.mybatisMapper.getStatement(
            "SCHEDULER",
            "HAX.SCHEDULER.SELECT.001",
            { startDay, endDay: testDay },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        const insertQuery = req.mybatisMapper.getStatement(
            "SCHEDULER",
            "HAX.SCHEDULER.INSERT.001",
            {
                selectResult,
                sales_month,
                now,
            },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.INSERT,
            transaction,
        });

        if (insertResult[1] == 0) {
            transaction.rollback();
            res.status(200).json({
                code: "2004",
                msg: "실패",
                desc: "영업사원 정산",
            });
        } else {
            transaction.commit();
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "영업사원 정산",
                data: {
                    incentiveList: selectResult,
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
            desc: "영업사원 정산",
            err: String(err),
        });
    }
});

/*회원등급 정산 매월 1일 00:10*/
app.get("/member/grade/calculate", async (req, res) => {
    const today = Date.now();
    const todayYear = new Date(today).getFullYear();
    const todayMonth = new Date(today).getMonth();
    const todayDate = new Date(today).getDate();
    let startDay = new Date(todayYear, todayMonth - 3, 1);
    // let endDay = new Date(todayYear, todayMonth, 0);
    const todayTest = new Date(todayYear, todayMonth, todayDate);
    const gradeTermStart = dateToYMDString(startDay);
    // const gradeTermEnd = dateToYMDString(endDay);
    const TestgradeTermEnd = dateToYMDString(todayTest);
    startDay = startDay.setHours(0, 0, 0, 0);
    // endDay = endDay.setHours(23, 59, 59, 0);
    startDay = Math.floor(startDay / 1000);
    // endDay = Math.floor(endDay / 1000);
    const testDay = Math.floor(today / 1000);
    let gradeStart = new Date(todayYear, todayMonth, 1);
    let gradeEnd = new Date(todayYear, todayMonth + 3, 0);
    gradeStart = dateToYMDString(gradeStart);
    gradeEnd = dateToYMDString(gradeEnd);
    const platinumGrade = 9000000;
    const goldGrade = 5000000;
    const silverGrade = 3000000;

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const selectQuery = req.mybatisMapper.getStatement(
            "SCHEDULER",
            "HAX.SCHEDULER.SELECT.002",
            {
                platinumGrade,
                goldGrade,
                silverGrade,
                startDay,
                endDay: testDay,
            },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (selectResult.length > 0) {
            const insertQuery = req.mybatisMapper.getStatement(
                "SCHEDULER",
                "HAX.SCHEDULER.INSERT.002",
                {
                    selectResult,
                    gradeStart,
                    gradeEnd,
                    gradeTermStart,
                    gradeTermEnd: TestgradeTermEnd,
                },
                { language: "sql", indent: " " }
            );

            const insertResult = await req.sequelize.query(insertQuery, {
                type: req.sequelize.QueryTypes.INSERT,
                transaction,
            });

            const insertQuery2 = req.mybatisMapper.getStatement(
                "SCHEDULER",
                "HAX.SCHEDULER.INSERT.003",
                {
                    selectResult,
                },
                { language: "sql", indent: " " }
            );

            const insertResult2 = await req.sequelize.query(insertQuery2, {
                type: req.sequelize.QueryTypes.INSERT,
                transaction,
            });

            if (insertResult[1] == 0) {
                transaction.rollback();
                res.status(200).json({
                    code: "2004",
                    msg: "실패",
                    desc: "등급 정산",
                });
            } else {
                transaction.commit();
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "등급 정산",
                    data: {
                        grade: selectResult,
                    },
                });
            }
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "등급 정산",
                data: {
                    grade: selectResult,
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
            desc: "등급 정산",
            err: String(err),
        });
    }
});

/*입금기한초과처리 매일 00:05*/
app.get("/order/exceed", async (req, res) => {
    let today = Date.now();
    today = Math.floor(today / 1000);
    const comment = "입금기한초과로 인한 주문취소";
    const history_type = "CANCEL_B";

    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "SCHEDULER",
            "HAX.SCHEDULER.UPDATE.001",
            {
                today,
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
                desc: "입금 기한 초과 처리",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "입금 기한 초과 처리",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "입금 기한 초과 처리",
            err: String(err),
        });
    }
});

/*리워드 마감임박 알림 발송 매일 12:00*/
app.get("/reward/deadline", async (req, res) => {
    const today = Date.now();
    let startTerm = new Date(today);
    let endTerm = new Date(today);
    startTerm = startTerm.setHours(0, 0, 0, 0);
    endTerm = endTerm.setHours(23, 59, 59, 0);
    startTerm = Math.floor(startTerm / 1000);
    endTerm = Math.floor(endTerm / 1000);
    const day = 10;
    let title = null;
    let body = null;
    let targetMember = [];

    let transaction = null;

    try {
        transaction = await req.sequelize.transaction();

        const selectQuery = req.mybatisMapper.getStatement(
            "SCHEDULER",
            "HAX.SCHEDULER.SELECT.003",
            { startTerm, endTerm, day },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
            transaction,
        });

        if (selectResult.length > 0) {
            const routeName = "RewardDetailStack";
            const routeIdx = 0;
            for (const token of selectResult) {
                targetMember.push({ member_pk: token.member_pk });

                title = "[슈퍼바인더] 소멸 예정 리워드 안내";
                body =
                    token.member_name +
                    "님의 " +
                    "리워드 포인트 " +
                    token.remain_point +
                    "원이 사용기한 10일 남았습니다.";

                let fns = await firebase.sendMessage(
                    token.push_token,
                    title,
                    body,
                    routeName,
                    routeIdx
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

            transaction.commit();
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "리워드 마감임박",
            });
        } else {
            transaction.rollback();
            res.status(200).json({
                code: "2001",
                msg: "조회된 데이터 없음",
                desc: "리워드 마감임박",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "리워드 마감임박",
            err: String(err),
        });
    }
});

/*주문 수 저장*/
app.get("/order/count", async (req, res) => {
    try {
        const insertOrderCountQuery = req.mybatisMapper.getStatement(
            "SCHEDULER",
            "HAX.SCHEDULER.INSERT.999",
            { language: "sql", indent: " " }
        );

        const insertOrderCountResult = await req.sequelize.query(
            insertOrderCountQuery,
            {
                type: req.sequelize.QueryTypes.INSERT,
            }
        );

        if (insertOrderCountResult[1] == 0) {
            res.status(200).json({
                code: "2004",
                msg: "처리 실패",
                desc: "주문 수 저장",
            });
        } else {
            res.status(200).json({
                code: "0000",
                msg: "성공",
                desc: "주문 수 저장",
            });
        }
    } catch (err) {
        if (err) {
            console.error(err);
        }
        res.status(200).json({
            code: "9999",
            msg: "기타 서버 에러",
            desc: "주문 수 저장",
            err: String(err),
        });
    }
});

module.exports = app;
