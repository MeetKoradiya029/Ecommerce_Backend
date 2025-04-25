"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const seller_controller_1 = __importDefault(require("../controllers/seller.controller"));
const auth_middleware_1 = require("../Middlewares/auth.middleware");
router.post('/register', auth_middleware_1.verifyJWT, seller_controller_1.default.saveSeller);
exports.default = router;
