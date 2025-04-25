"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = __importDefault(require("../controllers/product.controller"));
const auth_middleware_1 = require("../Middlewares/auth.middleware");
const admin_middleware_1 = require("../Middlewares/admin.middleware");
const router = express_1.default.Router();
router.get("", auth_middleware_1.verifyJWT, product_controller_1.default.getAllProducts);
router.post("/add", auth_middleware_1.verifyJWT, admin_middleware_1.isAdmin, product_controller_1.default.addProduct);
router.post("/edit", auth_middleware_1.verifyJWT, admin_middleware_1.isAdmin, product_controller_1.default.updateProduct);
router.delete("/delete", auth_middleware_1.verifyJWT, admin_middleware_1.isAdmin, product_controller_1.default.deleteProduct);
router.get("/productById", auth_middleware_1.verifyJWT, product_controller_1.default.getProductById);
router.get("/totalRecords", auth_middleware_1.verifyJWT, product_controller_1.default.getTotalRecordsForProducts);
exports.default = router;
