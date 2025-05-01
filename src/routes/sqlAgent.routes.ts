import express from "express";
import { sqlAgentChatBot } from "../controllers/sqlAgent.controller";

const router = express.Router();

router.post("/sql", sqlAgentChatBot);

export default router;