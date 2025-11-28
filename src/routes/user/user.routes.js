import express from "express";
import {
  registerUser,
  loginUser,
  getProfile
} from "../../controllers/user.controller.js";

import { refreshToken,logoutUser } from "../../controllers/auth.controller.js";

import authenticateUser from "../../middlewares/authenticate.middleware.js";

const router = express.Router();

router.post("/register", registerUser);         
router.post("/login", loginUser);               

router.post("/refresh-token", refreshToken);


router.get("/profile", authenticateUser, getProfile);
router.post("/logout", logoutUser); 

export default router;
