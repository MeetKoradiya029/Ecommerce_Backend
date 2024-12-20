


import fs from "fs";

export const fileMiddleware = async (req: any, res: any, next: any) => {
  try {
    const files = req.files;

    // Check if files were uploaded
    if (!files) {
      return next();
    }

    const errors: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validate each uploaded file
    for (const file of files) {
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        errors.push(`Invalid file type: ${file.originalname}`);
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`File too large: ${file.originalname}`);
      }
    }

    // Handle validation errors
    
    // Move uploaded files to destination directory
    const destinationDir = './public/temp/';
    for (const file of files) {
      const filePath = `${destinationDir}${file.originalname}`;
      fs.writeFileSync(filePath, file.buffer);
      file.path = filePath;
    }



    if (errors.length > 0) {
      // Remove uploaded files
      for (const file of files) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ error: errors });
    }


    // Attach files to the request object
    req.files = files;
    console.log("Uploaded files:", req.files);

    // Proceed to the next middleware or route handler
    next();
  } catch (error: any) {
    console.log("Error in file upload:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};














// import multer from "multer"
// import fs from "fs"


// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './public/temp/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.originalname);
//   }
// });

// const upload = multer({ storage: storage });


// export const multerMiddleware = async (req:any, res:any, next:any) => {

//   console.log("req =---------- in multer middlwware-", req);

//   try {

//     if (req?.files) {
      
      
//       upload.array('images', 5)(req, res, (err) => {
//         if (err) {

          
//           console.log("********** error in upload to multer**********", err);
          
//           return res.status(400).json({ error: err.message });
//         }
    
//         // Retrieve uploaded files
//         const files = req.files;
//         const errors:Array<any> = [];
    
//         // Validate file types and sizes
//         files.forEach((file:any) => {
//           const allowedTypes = ['image/jpeg', 'image/png'];
//           const maxSize = 5 * 1024 * 1024; // 5MB
    
//           if (!allowedTypes.includes(file.mimetype)) {
//             console.log("invalid file type>>>>>>>>>>");
            
//             errors.push(`Invalid file type: ${file.originalname}`);
//           }
    
//           if (file.size > maxSize) {
//             console.log("File too large >>>>>>>>>>");
//             errors.push(`File too large: ${file.originalname}`);
//           }
//         });
    
//         // Handle validation errors
//         if (errors.length > 0) {
//           // Remove uploaded files
//           files.forEach((file:any) => {
//             fs.unlinkSync(file.path);
//           });
    
//           return res.status(400).json({ errors });
//         }
    
//         // Attach files to the request object
//         req.files = files;
//         console.log("req >>> files >>", req?.files);
        
//         // Proceed to the next middleware or route handler
//         next();
//       });
//     } else {
//       next();
//     }
 
//   } catch (error:any) {
//     console.log("Error in multer >>>>>>", error);
    
//     return res.status(500).json({ message: "Internal Server Error", error: error.message});
//   }
//   // Use multer upload instance
  
// }