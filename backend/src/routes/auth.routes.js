import { Router } from "express";
import { register } from "../controllers/auth.controller.js";
import { login } from "../controllers/auth.controller.js";
import { loginLimiter } from "../middlewares/rateLimit.middleware.js";
import { refreshToken } from "../controllers/auth.controller.js";
import { verifyEmail } from "../controllers/auth.controller.js";
import { forgotPassword , logout } from "../controllers/auth.controller.js";
import { resetPassword } from "../controllers/auth.controller.js";
import { activityLogger } from "../middlewares/activity.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { getInvite } from "../controllers/auth.controller.js";
import { acceptInvite } from "../controllers/auth.controller.js";


const router = Router();

router.post("/register", register);

router.get("/verify-email", verifyEmail);

router.get("/invite/:token", getInvite);

router.post("/accept-invite", acceptInvite);

router.post("/login", loginLimiter, activityLogger("LOGIN","auth"), login);

router.post("/refresh", refreshToken);

router.get("/verify-email", verifyEmail);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", activityLogger("PASSWORD_RESET","auth"), resetPassword);


router.post("/logout", verifyToken, logout);






export default router;

