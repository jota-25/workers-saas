import { Router } from "express";
import { register } from "./auth.controller.js";
import { login } from "./auth.controller.js";
import { loginLimiter } from "../../middlewares/rateLimit.middleware.js";
import { refreshToken } from "./auth.controller.js";
import { verifyEmail } from "./auth.controller.js";
import { forgotPassword , logout } from "./auth.controller.js";
import { resetPassword } from "./auth.controller.js";
import { activityLogger } from "../../middlewares/activity.middleware.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { getInviteInfo } from "./auth.controller.js";
import { acceptInvite } from "./auth.controller.js";
import { requireLevel } from "../../middlewares/requireLevel.middleware.js";


const router = Router();

router.post("/register", register);

router.get("/verify-email", verifyEmail);

router.get("/invite/:token", getInviteInfo);

router.post("/accept-invite", acceptInvite);

router.post("/login", loginLimiter, activityLogger("LOGIN","auth"), login);

router.post("/refresh", refreshToken);



router.post("/forgot-password", forgotPassword);

router.post("/reset-password", activityLogger("PASSWORD_RESET","auth"), resetPassword);


router.post("/logout", verifyToken, logout);

/*router.get(
  "/test",
  verifyToken,
  requireLevel(90),
  (req, res) => {

    console.log(req.user);

    res.json({
      message: "Acceso permitido",
      user: req.user,
    });

  }
);  */ // solo era para probar si el refreshToken si guardaba el token con los datos como el rol, ya que el redis guardara en cache el rol y usara el token para sacarlo 




export default router;

