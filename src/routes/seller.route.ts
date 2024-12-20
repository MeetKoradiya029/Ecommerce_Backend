import express  from "express";

const router =  express.Router();

import sallerControler from '../controllers/seller.controller'
import { verifyJWT } from "../Middlewares/auth.middleware";


router.post('/register', verifyJWT, sallerControler.saveSeller);


export default router;