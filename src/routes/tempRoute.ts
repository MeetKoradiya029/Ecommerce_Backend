import express from "express";
import tempController from "../controllers/tempController";
const router = express.Router();



router.get("/json", tempController.jsonProcess);

export default router