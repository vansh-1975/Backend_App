// const multer=require("multer");
// const path=require("path");
// const crypto=require("crypto");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/images/uploads')
//   },
//   filename: function (req, file, cb) {
//     crypto.randomBytes(12,(err,name)=>{
//         const fn=name.toString("hex")+path.extname(file.originalname)
//         cb(null, fn);
//     })
//   }
// })

// const upload = multer({ storage: storage })
// module.exports=upload;




// config/multerconfig.js
const multer = require('multer');
const cloudinary = require('cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new Error('No file buffer provided'));
    }
    
    cloudinary.v2.uploader.upload_stream(
      {
        folder: 'profile_pics',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

module.exports = { upload, uploadToCloudinary };