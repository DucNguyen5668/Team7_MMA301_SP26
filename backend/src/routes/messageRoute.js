const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authenticate = require("../middleware/authMiddleware");

router.use(authenticate);

router.get("/:convId/messages", messageController.getMessages);

router.get("/:messageId/video", messageController.getVideoData);

module.exports = router;
