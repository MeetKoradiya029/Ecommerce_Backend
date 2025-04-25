"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_middleware_1 = require("../Middlewares/admin.middleware");
const auth_middleware_1 = require("../Middlewares/auth.middleware");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const address_controller_1 = __importDefault(require("../controllers/address.controller"));
const router = express_1.default.Router();
router.post("/register", user_controller_1.default.registerUser);
router.post("/login", user_controller_1.default.loginUser);
router.get("/logout", auth_middleware_1.verifyJWT, user_controller_1.default.logout);
router.get("/getAllUsers", auth_middleware_1.verifyJWT, admin_middleware_1.isAdmin, user_controller_1.default.getAllUsers);
router.get("/getUserById", auth_middleware_1.verifyJWT, user_controller_1.default.getUserById);
router.put("/updateUser", auth_middleware_1.verifyJWT, user_controller_1.default.updateUser);
// User Address Routes
router.post("/saveAddress", auth_middleware_1.verifyJWT, address_controller_1.default.saveUserAddress);
router.get("/addressByUserId", auth_middleware_1.verifyJWT, address_controller_1.default.getUserAddressByUserId);
router.get("/address", auth_middleware_1.verifyJWT, address_controller_1.default.getUserAddressById);
router.put("/updateAddress", auth_middleware_1.verifyJWT, address_controller_1.default.updateUserAddress);
// router.post("/getActoviaGroupById", userController.getActoviaGroupById);
exports.default = router;
