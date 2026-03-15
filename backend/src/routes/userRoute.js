const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");

router.get("/me", auth, userController.getMe);
router.put("/me", auth, userController.updateProfile);
router.put("/password", auth, userController.changePassword);
router.put("/avatar", auth, userController.uploadAvatar);

module.exports = router;
