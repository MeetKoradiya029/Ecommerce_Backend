import express from "express";
import userController from "../controllers/user.controller";
import { isAdmin } from "../Middlewares/admin.middleware";
import { verifyJWT } from "../Middlewares/auth.middleware";

const router = express.Router();

router.post('/saveUserAddress')

export default router;
