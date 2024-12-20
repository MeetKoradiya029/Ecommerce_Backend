import express from "express";
import categoryController from "../controllers/category.controller";
import { verifyJWT } from "../Middlewares/auth.middleware";
const router = express.Router();

// router.post("/add", verifyJWT, productController.addProduct);
router.get("", verifyJWT, categoryController.getAllCategory);


export default router;
