import express from "express";
import productController from "../controllers/product.controller";
import { verifyJWT } from "../Middlewares/auth.middleware";
import { isAdmin } from "../Middlewares/admin.middleware";
import { fileMiddleware } from "../Middlewares/multer.middleware";
const router = express.Router();

router.get("", verifyJWT, productController.getAllProducts);
router.post("/add", verifyJWT, isAdmin, productController.addProduct);
router.post("/edit",verifyJWT, isAdmin, productController.updateProduct);
router.delete("/delete", verifyJWT, isAdmin, productController.deleteProduct);
router.get("/productById", verifyJWT, productController.getProductById);
router.get("/totalRecords",verifyJWT, productController.getTotalRecordsForProducts)


export default router;
