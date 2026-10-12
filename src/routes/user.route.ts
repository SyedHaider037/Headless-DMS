import express from "express";
import { RegisterUser, loginUser, logoutUser, refreshToken } from "../controllers/user.controller.js";
import { verifyAuthToken } from "../middlewares/jwt.middleware.js";

const router = express.Router();

router.route("/register").post(RegisterUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyAuthToken, logoutUser);
router.route("/refreshToken").post(refreshToken);
export default router;