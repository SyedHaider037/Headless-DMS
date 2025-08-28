import multer from "multer";
import path from "path";
import fs from "fs";


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDirectory = path.join(process.cwd(), "public","uploads");
        fs.mkdirSync(uploadDirectory, { recursive: true });
        cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueSurffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = path.basename(file.originalname, ext);
        cb(null, `${filename}-${uniqueSurffix}${ext}`);
    }
});

export const upload = multer({ storage });