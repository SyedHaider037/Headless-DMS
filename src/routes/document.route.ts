import express from "express";
import { verifyAuthToken } from "../middlewares/jwt.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { canCreateReadDocument } from "../middlewares/canCreate&ReadDocument.middleware.js";
import { canChangeDocument } from "../middlewares/canChangeDocument.middleware.js";
import { 
    uploadDocument,
    getAllDocuments,
    getDocumentById,
    deleteDocumentById,
    updateDocument,
    searchDocuments,
    generateDownloadLink,
    downloadDocument
} from "../controllers/document.controller.js";

const router = express.Router();

router.route("/search").get(verifyAuthToken, canCreateReadDocument("READ_DOCUMENT"), searchDocuments);

router.route("/").post(verifyAuthToken, canCreateReadDocument("CREATE_DOCUMENT"), upload.single("file"), uploadDocument);
router.route("/").get(verifyAuthToken, canCreateReadDocument("READ_DOCUMENT"), getAllDocuments);
router.route("/:id").get(verifyAuthToken, canCreateReadDocument("READ_DOCUMENT"), getDocumentById);
router.route("/:id").delete(verifyAuthToken, canChangeDocument("DELETE_DOCUMENT"), deleteDocumentById);
router.route("/:id").patch(verifyAuthToken, canChangeDocument("UPDATE_DOCUMENT"), upload.none(), updateDocument);


router.route("/:id/download").get(verifyAuthToken, canCreateReadDocument("READ_DOCUMENT") , generateDownloadLink);
router.route("/download/:token").get(downloadDocument);

export default router;