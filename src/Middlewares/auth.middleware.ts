
import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken"


export const verifyJWT = async (req:any, res:any, next:any) => {
    
    try {
        const pool = await req.sql;
        const token =  req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                flag:0,
                message:"Unauthorized Request"
            })
        }

        const verifiedToken = jwt.verify(token, "meet") as JwtPayload;

        console.log("verifiedtoken data >>>", verifiedToken?.id) 
        

        if (!verifiedToken) {
            return res.status(401).json({
                flag:0,
                message:"Unauthorized Access"
            })
        }

        const user_id = verifiedToken?.id

        const user = await pool.request()
        .query(`SELECT * FROM Ecommerce_Users WHERE id = ${user_id}`)

        console.log("user from id >>>", user.recordset);
        

        if (user?.recordset?.length === 0) { 
            return res.status(401).json({
                flag:0,
                message: "Unauthorized Access"
            })
        }

        req.user = user.recordset[0]
        next();

    } catch (error:any) {
        console.log("error >>> in middleware >>", error);
        
        return res.status(500).json({
            flag:0,
            message:error.message
        })
    }
}
