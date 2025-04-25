"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const category_controller_1 = __importDefault(require("../controllers/category.controller"));
const auth_middleware_1 = require("../Middlewares/auth.middleware");
const router = express_1.default.Router();
// router.post("/add", verifyJWT, productController.addProduct);
router.get("", auth_middleware_1.verifyJWT, category_controller_1.default.getAllCategory);
exports.default = router;
