const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    register,
    login,
    me,
    updateProfile,
    handleAvatarUpload,
    uploadAvatar,
    requestPasswordChange,
    confirmPasswordChange,
    requestEmailVerification,
    confirmEmailVerification,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.patch("/profile", authMiddleware, updateProfile);
router.patch("/avatar", authMiddleware, handleAvatarUpload, uploadAvatar);
router.post("/password/request", authMiddleware, requestPasswordChange);
router.post("/password/confirm", authMiddleware, confirmPasswordChange);
router.post("/verify-email/request", authMiddleware, requestEmailVerification);
router.post("/verify-email/confirm", authMiddleware, confirmEmailVerification);
module.exports = router;