"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyJWT = async (req, res, next) => {
    var _a, _b;
    try {
        const pool = await req.sql;
        const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({
                flag: 0,
                message: "Unauthorized Request"
            });
        }
        const verifiedToken = jsonwebtoken_1.default.verify(token, "meet");
        console.log("verifiedtoken data >>>", verifiedToken === null || verifiedToken === void 0 ? void 0 : verifiedToken.id);
        if (!verifiedToken) {
            return res.status(401).json({
                flag: 0,
                message: "Unauthorized Access"
            });
        }
        const user_id = verifiedToken === null || verifiedToken === void 0 ? void 0 : verifiedToken.id;
        const user = await pool.request()
            .query(`SELECT * FROM Ecommerce_Users WHERE id = ${user_id}`);
        console.log("user from id >>>", user.recordset);
        if (((_b = user === null || user === void 0 ? void 0 : user.recordset) === null || _b === void 0 ? void 0 : _b.length) === 0) {
            return res.status(401).json({
                flag: 0,
                message: "Unauthorized Access"
            });
        }
        req.user = user.recordset[0];
        next();
    }
    catch (error) {
        console.log("error >>> in middleware >>", error);
        return res.status(500).json({
            flag: 0,
            message: error.message
        });
    }
};
exports.verifyJWT = verifyJWT;
