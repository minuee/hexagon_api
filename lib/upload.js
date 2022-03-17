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
                    "public/tto" +
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

exports.upload = multer({ upload: upload });
