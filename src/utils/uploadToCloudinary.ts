import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: "dptbxmeoa",
    api_key: "572813858736111",
    api_secret: "H3r8OSp6VoOUzsD24mYdDI9L1k4"
});

const uploadDir = './public/temp';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


export const uploadToCloudinary = async (reqImages:any) => {

    try {
        console.log(" local path in cloudinary >>>> ", reqImages);
        if (!reqImages) {
            return null;
        }

        const uploadedImages = await Promise.all(reqImages.map(async (file:any) => {

            const filePath = `${uploadDir}/${file.originalname}`;
                fs.writeFileSync(filePath, file.buffer);

            const result = await cloudinary.uploader.upload(filePath, { folder: 'product_images'});
        
            fs.unlinkSync(filePath);
            return result.secure_url;
          }));

          console.log("uploaded images >>>.", uploadedImages);
          
        return uploadedImages;

    } catch (error) {
        console.log("error in upload file ", error);
        // remove locally temp saved file on our server if upload operation got failed 
        return null
    }
}

