import express from "express";
import chatbotConteller from "../controllers/chat.controller"
import excelChatAssistanceController from "../controllers/excelBot.controller"


const router = express.Router();


router.post("/chatbot", chatbotConteller.chatBotAssistant);
router.post("/excelChat", excelChatAssistanceController.excelChatAssistance);


export default router;