const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const User = require("../models/User");

router.post("/push-token", authenticate, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Token không hợp lệ" });
    }

    // Chỉ chấp nhận Expo Push Token hợp lệ
    if (!token.startsWith("ExponentPushToken")) {
      return res.status(400).json({ message: "Không phải Expo Push Token" });
    }

    await User.findByIdAndUpdate(req.user, { pushToken: token });
    res.json({ success: true });
  } catch (err) {
    console.error("Save push token error:", err);
    res.status(500).json({ message: "Lỗi lưu push token" });
  }
});

router.delete("/push-token", authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user, { pushToken: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa push token" });
  }
});

module.exports = router;
