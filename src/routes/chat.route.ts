import express from "express";
import chatbotConteller from "../controllers/chat.controller"


const router = express.Router();


router.post("/chatbot", chatbotConteller.chatBotAssistant);


export default router;