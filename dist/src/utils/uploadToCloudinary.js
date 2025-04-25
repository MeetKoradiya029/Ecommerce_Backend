"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
cloudinary_1.v2.config({
    cloud_name: "dptbxmeoa",
    api_key: "572813858736111",
    api_secret: "H3r8OSp6VoOUzsD24mYdDI9L1k4"
});
const uploadDir = './public/temp';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir);
}
const uploadToCloudinary = async (reqImages) => {
    try {
        console.log(" local path in cloudinary >>>> ", reqImages);
        if (!reqImages) {
            return null;
        }
        const uploadedImages = await Promise.all(reqImages.map(async (file) => {
            const filePath = `${uploadDir}/${file.originalname}`;
            fs_1.default.writeFileSync(filePath, file.buffer);
            const result = await cloudinary_1.v2.uploader.upload(filePath, { folder: 'product_images' });
            fs_1.default.unlinkSync(filePath);
            return result.secure_url;
        }));
        console.log("uploaded images >>>.", uploadedImages);
        return uploadedImages;
    }
    catch (error) {
        console.log("error in upload file ", error);
        // remove locally temp saved file on our server if upload operation got failed 
        return null;
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
