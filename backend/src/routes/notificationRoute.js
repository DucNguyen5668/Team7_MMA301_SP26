const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/auth");
const User = require("../models/User");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function sendPushNotification(pushToken, { title, body, data = {} }) {
  if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return;

  try {
    await fetch(
      EXPO_PUSH_URL,

      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          to: pushToken,
          sound: "default",
          title,
          body,
          data,
          // Hiển thị badge number trên icon app (iOS)
          badge: 1,
        }),
      },
    );
  } catch (err) {
    // Không throw — lỗi push không nên block luồng chính
    console.error(
      "Push notification error:",
      err?.response?.data || err.message,
    );
  }
}

async function sendPushNotifications(notifications) {
  const valid = notifications.filter(
    (n) => n.pushToken && n.pushToken.startsWith("ExponentPushToken"),
  );
  if (!valid.length) return;

  const messages = valid.map(({ pushToken, title, body, data = {} }) => ({
    to: pushToken,
    sound: "default",
    title,
    body,
    data,
    badge: 1,
  }));

  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error("Batch push error:", err?.response?.data || err.message);
  }
}

// POST /users/push-token — lưu push token
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

// DELETE /users/push-token  — xóa token khi logout
router.delete("/push-token", authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user, { pushToken: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa push token" });
  }
});
