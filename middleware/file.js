const express = require("express");
const app = express.Router();

const { isNull } = require("../lib/util");

const AWS = require("aws-sdk");
const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const keyData = require("../key/awsconfig.json");

const s3 = new AWS.S3({
    accessKeyId: keyData.AccessKeyId, // user 만들면서 지급받은 키값
    secretAccessKey: keyData.secretAccessKey,
    region: "ap-northeast-1",
});

const imageFilter = function (req, file, cb) {
    if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
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
            console.log(file);
            try {
                cb(
                    null,
                    file.folder +
                        file.originalname.split(".")[0] +
                        "-" +
                        Date.now() +
                        path.extname(file.originalname)
                );
            } catch (error) {
                console.error(error);
            }
        },
    }),
});

app.get("/grade/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);

    if (member_pk == null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.001",
            { member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            success: true,
            desc: "유저 등급입니다.",
            data: {
                userGrade: selectResult,
            },
        });
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

/**
 * @swagger
 * "/reward-list":
 *   get:
 *     tags: [reward]
 *     summary: "유저 적립금 목록 조회입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "page"
 *         description: "페이지입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *       - name: "paginate"
 *         description: "게시글 로우 수입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *       - name: "member_pk"
 *         description: "유저 고유 번호입니다."
 *         in: path
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "유저 적립금 목록 조회"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "유저 적립금 목록 조회"
 *             data:
 *               description: "결과입니다."
 *               type: array
 *               example: { "desc" : "회사 등록"}
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.get("/reward-list/:member_pk", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    const member_pk = isNull(req.params.member_pk, null);

    if ([page, paginate].includes(NaN) || member_pk == null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.002",
            { page, paginate, member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            success: true,
            desc: "유저 적립금 목록 조회",
            data: {
                userReward: selectResult,
            },
        });
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

/**
 * @swagger
 * "/notice-list":
 *   get:
 *     tags: [notice]
 *     summary: "공지사항 목록 조회입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "page"
 *         description: "페이지입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *       - name: "paginate"
 *         description: "게시글 로우 수입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "공지사항 목록 조회"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "공지사항 목록 조회"
 *             data:
 *               description: "결과입니다."
 *               type: array
 *               example: {"noticeList":[{"notice_no":"8","title":"테스트","notice_content":"안녕","start_dt":"1606206975","total":"2"},{"notice_no":"7","title":"테스트","notice_content":"안녕","start_dt":"1606206975","total":"2"}]}
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.get("/notice-list", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.003",
            { page, paginate },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            success: true,
            desc: "공지사항 목록 조회",
            data: {
                noticeList: selectResult,
            },
        });
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

/**
 * @swagger
 * "/notice/{notice_no}":
 *   get:
 *     tags: [notice]
 *     summary: "공지사항 상세정보 조회입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "notice_no"
 *         description: "공지사항 고유 번호입니다."
 *         in: path
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "공지사항 상세정보 조회"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "공지사항 상세정보 조회"
 *             data:
 *               description: "결과입니다."
 *               type: array
 *               example: {"noticeDetail":[{"title":"테스트","notice_content":"안녕","start_dt":"1606206975","img_no":"6","img_url":"test2"}]}
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.get("/notice/:notice_no", async (req, res) => {
    const notice_no = isNull(req.params.notice_no, null);

    if (notice_no === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }
    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.004",
            { notice_no },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            success: true,
            desc: "공지사항 상세정보 조회",
            data: {
                noticeDetail: selectResult,
            },
        });
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

/**
 * @swagger
 * "/mypage/{member_pk}":
 *   get:
 *     tags: [mypage]
 *     summary: "마이페이지 기본정보입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "member_pk"
 *         description: "유저 고유 번호입니다."
 *         in: path
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "마이페이지 기본정보"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "마이페이지 기본정보"
 *             data:
 *               description: "결과입니다."
 *               type: array
 *               example: {"noticeDetail":[{"title":"테스트","notice_content":"안녕","start_dt":"1606206975","img_no":"6","img_url":"test2"}]}
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.get("/mypage/:member_pk", async (req, res) => {
    const member_pk = isNull(req.params.member_pk, null);

    if (member_pk === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }
    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.005",
            { member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            success: true,
            desc: "마이페이지 기본정보",
            data: {
                mypageDefault: selectResult,
            },
        });
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

/**
 * @swagger
 * "/pay-list":
 *   get:
 *     tags: [pay]
 *     summary: "주문내역 목록 조회입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "page"
 *         description: "페이지입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *       - name: "paginate"
 *         description: "게시글 로우 수입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *       - name: "member_pk"
 *         description: "유저 고유 번호입니다."
 *         in: path
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "주문내역 목록 조회"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "주문내역 목록 조회"
 *             data:
 *               description: "결과입니다."
 *               type: array
 *               example: {"noticeList":[{"notice_no":"8","title":"테스트","notice_content":"안녕","start_dt":"1606206975","total":"2"},{"notice_no":"7","title":"테스트","notice_content":"안녕","start_dt":"1606206975","total":"2"}]}
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.get("/pay-list", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    const member_pk = isNull(req.params.member_pk, null);

    if ([page, paginate].includes(NaN) || member_pk == null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.006",
            { page, paginate, member_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            success: true,
            desc: "주문내역 목록 조회",
            data: {
                noticeList: selectResult,
            },
        });
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

/**
 * @swagger
 * "/company-list":
 *   get:
 *     tags: [company]
 *     summary: "회사 목록 조회입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "page"
 *         description: "페이지입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *       - name: "paginate"
 *         description: "게시글 로우 수입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "회사 목록 조회"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "회사 목록 조회"
 *             data:
 *               description: "결과입니다."
 *               type: array
 *               example: {"noticeList":[{"notice_no":"8","title":"테스트","notice_content":"안녕","start_dt":"1606206975","total":"2"},{"notice_no":"7","title":"테스트","notice_content":"안녕","start_dt":"1606206975","total":"2"}]}
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.get("/company-list", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.007",
            { page, paginate },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            success: true,
            desc: "회사 목록 조회",
            data: {
                companyList: selectResult,
            },
        });
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

/**
 * @swagger
 * "/product-list/{category_pk}":
 *   get:
 *     tags: [company]
 *     summary: "상품 목록 조회입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "page"
 *         description: "페이지입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *       - name: "paginate"
 *         description: "게시글 로우 수입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *       - name: "paginate"
 *         description: "회사 고유 번호입니다."
 *         in: path
 *         required: false
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "상품 목록 조회"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "상품 목록 조회"
 *             data:
 *               description: "결과입니다."
 *               type: array
 *               example: {"noticeList":[{"notice_no":"8","title":"테스트","notice_content":"안녕","start_dt":"1606206975","total":"2"},{"notice_no":"7","title":"테스트","notice_content":"안녕","start_dt":"1606206975","total":"2"}]}
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.get("/product-list/:category_pk", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));
    const category_pk = isNull(req.params.category_pk, null);

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.008",
            { page, paginate, category_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            success: true,
            desc: "상품 목록 조회",
            data: {
                productList: selectResult,
            },
        });
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

/**
 * @swagger
 * "/product/{product_pk}":
 *   get:
 *     tags: [product]
 *     summary: "상품 상세정보 조회입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "product_pk"
 *         description: "상품 고유 번호입니다."
 *         in: path
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "상품 상세정보 조회"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "상품 상세정보 조회"
 *             data:
 *               description: "결과입니다."
 *               type: array
 *               example: {"noticeDetail":[{"title":"테스트","notice_content":"안녕","start_dt":"1606206975","img_no":"6","img_url":"test2"}]}
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.get("/product/:product_pk", async (req, res) => {
    const product_pk = isNull(req.params.product_pk, null);

    if (product_pk === null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }
    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.009",
            { product_pk },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            success: true,
            desc: "공지사항 상세정보 조회",
            data: {
                noticeDetail: selectResult,
            },
        });
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

/**
 * @swagger
 * "/basket":
 *   post:
 *     tags: [basket]
 *     summary: "장바구니 담기입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "product_pk"
 *         description: "제품 고유 번호입니다."
 *         in: body
 *         required: true
 *         type: integer
 *         example: 1
 *       - name: "quantity"
 *         description: "제품 수량입니다."
 *         in: body
 *         required: true
 *         type: integer
 *         example: 8
 *       - name: "product_type"
 *         description: "상품 종류입니다."
 *         in: body
 *         required: true
 *         type: string
 *         example: "box"
 *       - name: "product_cost"
 *         description: "상품 가격입니다."
 *         in: body
 *         required: true
 *         type: integer
 *         example: 2000
 *       - name: "total_cost"
 *         description: "총 상품 가격입니다."
 *         in: body
 *         required: true
 *         type: integer
 *         example: 16000
 *       - name: "member_pk"
 *         description: "유저 고유 번호입니다."
 *         in: body
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "장바구니 담기"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "장바구니 담기"
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       403:
 *         description: "처리 실패"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.post("/basket", async (req, res) => {
    const product_pk = isNull(req.body.product_pk, null);
    const quantity = isNull(req.body.quantity, null);
    const product_type = isNull(req.body.product_type, null);
    const product_cost = isNull(req.body.product_cost, null);
    const total_cost = isNull(req.body.total_cost, null);
    const member_pk = isNull(req.body.member_pk, null);

    if (
        [
            product_pk,
            quantity,
            product_type,
            product_cost,
            total_cost,
            member_pk,
        ].includes(null)
    ) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const insertQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.INSERT.001",
            { img_url, type_code },
            { language: "sql", indent: " " }
        );

        const insertResult = await req.sequelize.query(insertQuery, {
            type: req.sequelize.QueryTypes.INSERT,
        });

        if (insertResult[1] == 0) {
            res.status(403).json({
                success: false,
                desc: "처리 실패",
            });
        } else {
            res.status(200).json({
                success: true,
                desc: "장바구니 담기",
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

/**
 * @swagger
 * "/basket-list":
 *   get:
 *     tags: [basket]
 *     summary: "장바구니 상품리스트 조회입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "page"
 *         description: "페이지입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *       - name: "paginate"
 *         description: "게시글 로우 수입니다."
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "장바구니 상품리스트 조회"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "장바구니 상품리스트 조회"
 *             data:
 *               description: "결과입니다."
 *               type: array
 *               example: {"noticeList":[{"notice_no":"8","title":"테스트","notice_content":"안녕","start_dt":"1606206975","total":"2"},{"notice_no":"7","title":"테스트","notice_content":"안녕","start_dt":"1606206975","total":"2"}]}
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.get("/basket-list", async (req, res) => {
    let page = parseInt(isNull(req.query.page, 1));
    const paginate = parseInt(isNull(req.query.paginate, 10));

    if ([page, paginate].includes(NaN)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    page = (page - 1) * paginate;

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.010",
            { page, paginate },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        res.status(200).json({
            success: true,
            desc: "장바구니 상품리스트 조회",
            data: {
                basketProductList: selectResult,
            },
        });
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

/**
 * @swagger
 * "/basket/{basket_no}":
 *   put:
 *     tags: [basket]
 *     summary: "장바구니 수량 수정입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "basket_no"
 *         description: "장바구니 고유 번호입니다."
 *         in: path
 *         required: true
 *         type: integer
 *         example: 1
 *       - name: "quantity"
 *         description: "상품 수량입니다."
 *         in: body
 *         required: true
 *         type: integer
 *         example: 1
 *       - name: "total_cost"
 *         description: "총 가격입니다."
 *         in: body
 *         required: true
 *         type: integer
 *         example: 10000
 *     responses:
 *       200:
 *         description: "장바구니 수량 수정"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "장바구니 수량 수정"
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       403:
 *         description: "처리 실패"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.put("/basket/:basket_no", async (req, res) => {
    const basket_no = isNull(req.params.basket_no, null);
    const quantity = isNull(req.body.quantity, null);
    const total_cost = isNull(req.body.total_cost, null);

    if ([basket_no, quantity, total_cost].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }
    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.UPDATE.001",
            { basket_no, quantity, total_cost },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.update,
        });

        if (updateResult[1] == 0) {
            res.status(403).json({
                success: false,
                desc: "처리 실패",
            });
        } else {
            res.status(200).json({
                success: true,
                desc: "장바구니 수량 수정",
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

/**
 * @swagger
 * "/basket/{basket_no}":
 *   delete:
 *     tags: [basket]
 *     summary: "장바구니 삭제입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "basket_no"
 *         description: "장바구니 고유 번호입니다."
 *         in: path
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "장바구니 삭제"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "장바구니 삭제"
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       403:
 *         description: "처리 실패"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.delete("/basket/:basket_no", async (req, res) => {
    const basket_no = isNull(req.params.basket_no, null);

    if ([basket_no].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }
    try {
        const updateQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.UPDATE.002",
            { basket_no },
            { language: "sql", indent: " " }
        );

        const updateResult = await req.sequelize.query(updateQuery, {
            type: req.sequelize.QueryTypes.update,
        });

        if (updateResult[1] == 0) {
            res.status(403).json({
                success: false,
                desc: "처리 실패",
            });
        } else {
            res.status(200).json({
                success: true,
                desc: "장바구니 삭제",
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

/**
 * @swagger
 * "/user-check/{company_regist}":
 *   get:
 *     tags: [user]
 *     summary: "사업자 등록번호 중복체크입니다."
 *     consumes: [application/json]
 *     produces: [application/json]
 *     parameters:
 *       - name: "company_regist"
 *         description: "사업자 등록번호입니다."
 *         in: path
 *         required: true
 *         type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: "사업자 등록번호 중복체크"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: true
 *             desc:
 *               description: "설명입니다."
 *               type: string
 *               example: "사용할 수 있는 아이디입니다."
 *       400:
 *         description: "잘못된 매개변수"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       403:
 *         description: "사용할 수 없는 아이디입니다."
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 *       500:
 *         description: "기타 서버 에러"
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               description: "성공 여부"
 *               type: boolean
 *               example: false
 */
app.get("/user-check/:company_regist", async (req, res) => {
    const company_regist = isNull(req.params.company_regist, null);

    if (company_regist == null) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    try {
        const selectQuery = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.011",
            { company_regist },
            { language: "sql", indent: " " }
        );

        const selectResult = await req.sequelize.query(selectQuery, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(403).json({
                success: false,
                desc: "사용할 수 없는 아이디입니다.",
            });
        } else {
            res.status(200).json({
                success: true,
                desc: "사용할 수 있는 아이디입니다.",
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

app.post("/send_sms", async (req, res) => {
    const form_phone = isNull(req.body.form_phone, null);
    const form_code = isNull(req.body.form_code, null);

    if ([form_phone, form_code].includes(null)) {
        res.status(200).json({ code: "2005", msg: "유효하지 않은 파라미터" });
        return;
    }

    const param = {
        phone: form_phone,
        msg: "[동네선수] 인증번호 [" + form_code + "]를 입력해주세요.",
        title: "동네선수 인증문자입니다.",
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
    const company_type = isNull(req.body.img_url, null);
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
    const enc_key = "hexagon2021@)@!";

    if (
        [
            user_id,
            password,
            email,
            phone,
            special_code,
            grade_start,
            grade_end,
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

        const selectQuery2 = req.mybatisMapper.getStatement(
            "V1",
            "HAX.V1.SELECT.017",
            { recomm_code },
            { language: "sql", indent: " " }
        );

        const selectResult2 = await req.sequelize.query(selectQuery2, {
            type: req.sequelize.QueryTypes.SELECT,
        });

        if (selectResult.length > 0) {
            res.status(200).json({
                code: "1016",
                msg: "아이디 중복",
                desc: "아이디 중복체크",
            });
            return;
        } else {
            if (selectResult2.length > 0) {
                const insertQuery2 = req.mybatisMapper.getStatement(
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
                    },
                    { language: "sql", indent: " " }
                );

                const insertResult2 = await req.sequelize.query(insertQuery2, {
                    type: req.sequelize.QueryTypes.INSERT,
                    transaction,
                });

                const member_pk = selectResult2[0].member_pk;

                const content = "친구초대";
                const reward_point = 50000;
                const reward_gubun = "p";
                const reward_type = "Invite";

                const insertQuery4 = req.mybatisMapper.getStatement(
                    "V1",
                    "HAX.V1.INSERT.003",
                    {
                        member_pk,
                        content,
                        reward_point,
                        reward_gubun,
                        reward_type,
                    },
                    { language: "sql", indent: " " }
                );

                const insertResult4 = await req.sequelize.query(insertQuery4, {
                    type: req.sequelize.QueryTypes.INSERT,
                    transaction,
                });

                if (insertResult2[1] == 0 || insertResult4[1] == 0) {
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
                    });
                }
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
                    },
                    { language: "sql", indent: " " }
                );

                const insertResult = await req.sequelize.query(insertQuery, {
                    type: req.sequelize.QueryTypes.INSERT,
                });

                if (insertResult[1] == 0) {
                    res.status(200).json({
                        code: "2004",
                        msg: "처리실패",
                        desc: "회원가입",
                    });
                } else {
                    res.status(200).json({
                        code: "0000",
                        msg: "성공",
                        desc: "회원가입",
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
            desc: "회원가입",
            err: String(err),
        });
    }
});

app.post("/auth/signin", async (req, res) => {
    const user_id = isNull(req.body.user_id, null);
    const password = isNull(req.body.password, null);
    const enc_key = "hexagon2021@)@!";

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

        if (selectResult.length > 0) {
            if (selectResult2.length > 0) {
                res.status(200).json({
                    code: "0000",
                    msg: "성공",
                    desc: "로그인",
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

app.post("/img/single", upload.single("img"), async (req, res) => {
    const img = isNull(req.file, null);

    if ([img].includes(null)) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
        });
        return;
    }

    const insert_img = img.location;

    try {
        res.status(200).json({
            code: "0000",
            msg: "성공",
            desc: "이미지(싱글)",
            data: insert_img,
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
});

app.post("/img/multiple", upload.array("img"), async (req, res) => {
    const img = isNull(req.files, null);
    let img_array = [];

    if (img == false) {
        res.status(200).json({
            code: "2005",
            msg: "유효하지 않은 파라미터",
        });
        return;
    }

    for (const e of img) {
        img_array.push(e.originalname, e.location);
    }

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

module.exports = app;
