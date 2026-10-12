import multer from "multer";
import path from "path";
import fs from "fs";
import { config } from "../config.js";
import { validation } from "../errors/app-error.js";
import { ALLOWED_UPLOAD_EXTENSIONS, isAllowedUpload } from "../validation/upload.validation.js";


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

// the path stored for a file is relative to the public folder, with forward slashes
export const storedFilePath = (file: Express.Multer.File): string =>
    path.relative(path.join(process.cwd(), "public"), file.path).replace(/\\/g, "/");

export const upload = multer({
    storage,
    limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
    // runs before anything is written to disk, so a rejected type leaves no file behind
    fileFilter: (req, file, cb) => {
        if (!isAllowedUpload(file.originalname, file.mimetype)) {
            return cb(validation(`File type not allowed. Allowed types: ${ALLOWED_UPLOAD_EXTENSIONS.join(", ")}`));
        }
        return cb(null, true);
    },
});
