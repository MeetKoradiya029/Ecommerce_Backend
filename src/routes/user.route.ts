import express from "express";
import { isAdmin } from "../Middlewares/admin.middleware";
import { verifyJWT } from "../Middlewares/auth.middleware";
import userController from "../controllers/user.controller";
import addressController from "../controllers/address.controller";


const router = express.Router();

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/logout", verifyJWT, userController.logout);
router.get("/getAllUsers", verifyJWT, isAdmin,  userController.getAllUsers)
router.get("/getUserById", verifyJWT, userController.getUserById)
router.put("/updateUser", verifyJWT, userController.updateUser)

// User Address Routes
router.post("/saveAddress", verifyJWT, addressController.saveUserAddress);
router.get("/addressByUserId",verifyJWT, addressController.getUserAddressByUserId);
router.get("/address",verifyJWT, addressController.getUserAddressById);
router.put("/updateAddress",verifyJWT, addressController.updateUserAddress);
// router.post("/getActoviaGroupById", userController.getActoviaGroupById);

export default router;
