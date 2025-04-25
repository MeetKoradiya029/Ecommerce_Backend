import { Request, Response } from 'express';
import { getDistance } from 'geolib';



const verifyEmployeeLocation = async (req: Request, res: Response) => {

    const { action, latitude, longitude } = req.body;



    try {

        // 23.0120478, 72.5028868 // User Location
        // 23.0184181, 72.5048887 // Office Location

        let allowedDistance = 50; // in meters 

        const userCoord = {
            latitude: latitude,
            longitude: longitude
        }
        const officeCoords: any = {
            latitude: 23.0149609,
            longitude: 72.5038823
        }

        console.log("req.body >>>", req.body);

        const distance = await getDistance(userCoord, officeCoords, 0.01);


        if (distance <= allowedDistance) {
            return res.status(200).json({
                success: true,
                message: `Successfully verified. You are within the allowed range.`,
                distance
            });
        } else {
            return res.status(400).json({
                success: false,
                message: `You are too far from the office to ${action}.`,
                distance
            });
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }

}

export default {
    verifyEmployeeLocation
}   