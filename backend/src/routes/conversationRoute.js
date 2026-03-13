const express = require("express");
const router = express.Router();
const conversationController = require("../controllers/conversationController");
const authenticate = require("../middleware/authMiddleware");

router.use(authenticate);

router.get("/", conversationController.getConversations);
router.get("/:id", conversationController.getConversationById);
router.post("/", conversationController.createOrGetPrivateConversation);
router.put("/:convId/read", conversationController.markAsRead);

module.exports = router;
