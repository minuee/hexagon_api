const jwt = require("jsonwebtoken");

const keyData = require("../key/key.json");

const tokenGenerator = (user_id, callback) => {
    const token = jwt.sign(user_id, keyData.privateKey, {
        algorithm: "HS256",
        expiresIn: 60 * 60 * 24 * 7,
    });
    callback(token);
};

const isValid = (token, callback) => {
    jwt.verify(token, keyData.privateKey, (err, decode) => {
        if (err) {
            // console.log("=========Token Helper: Can't decode token")
            callback({ isValid: false });
        } else {
            const exp = new Date(decode.exp * 1000);
            const now = Date.now();
            const day = 60 * 60 * 24 * 1000;
            if (exp < now) {
                // console.log("=========Token Helper: Expired Token")
                callback({ isValid: false });
            } else if (exp < now + 5 * day) {
                // console.log("=========Token Helper: Generate New Token")
                const newToken = module.exports.generateToken(decode.user.id);
                callback({ isValid: true, token: newToken, user_id: decode });
            } else {
                // console.log("=========Token Helper: Token is valid")
                callback({ isValid: true, token: token, user_id: decode });
            }
        }
    });
};

const tokenHandler = (req, res, next) => {
    const { token } = req.query;

    if (token) {
        module.exports.isValid(token, (result) => {
            req.userInfo = result;
            next();
        });
    } else {
        req.userInfo = { isValid: false };
        next();
    }
};

module.export = {
    tokenGenerator,
    isValid,
    tokenHandler,
};
