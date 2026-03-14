// sockets/chatSocket.js
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

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
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
    console.log("Push response:", res);
  } catch (err) {
    console.error("Batch push error:", err?.message);
  }
}

function chatSocket(io, socket) {
  const userId = socket.user;

  socket.join(`user:${userId}`);
  socket.data.userId = userId;

  socket.on("sendMessage", async (data) => {
    const {
      conversationId,
      content = "",
      type = "text",
      attachment = null,
    } = data;

    try {
      // 1️⃣ lấy conversation
      const conv = await Conversation.findById(conversationId).lean();

      if (
        !conv ||
        !conv.participants.map((p) => p.toString()).includes(userId.toString())
      ) {
        socket.emit("error", { msg: "Không có quyền" });
        return;
      }

      // 2️⃣ check conversation mới
      // const isNewConversation = !conv.lastMessage;

      // 3️⃣ tạo message
      const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        content,
        type,
        attachment,
        readBy: [userId],
      });

      // 4️⃣ update conversation
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
      });

      // 5️⃣ emit realtime message cho room
      io.to(conversationId.toString()).emit("newMessage", {
        _id: message._id,
        conversation: conversationId,
        sender: userId,
        content,
        type,
        attachment,
        createdAt: message.createdAt,
        readBy: message.readBy,
      });

      // 6️⃣ lấy sender info
      const sender = await User.findById(userId)
        .select("fullName avatar")
        .lean();

      const senderName = sender?.fullName || "Ai đó";

      // 7️⃣ body notification
      let notifBody = content || "";
      if (type === "image") notifBody = "Đã gửi 1 ảnh 🖼️";
      else if (type === "video") notifBody = "Đã gửi 1 video 🎥";
      else if (type === "file") notifBody = "Đã gửi 1 file 📎";

      // 8️⃣ participants khác
      const otherParticipants = conv.participants.filter(
        (p) => p.toString() !== userId.toString(),
      );

      const otherUsers = await User.find({ _id: { $in: otherParticipants } })
        .select("_id pushToken")
        .lean();

      // 9️⃣ sockets đang trong room
      const socketsInRoom = await io
        .in(conversationId.toString())
        .fetchSockets();

      console.log("Sockets in room:", socketsInRoom);

      const userIdsInRoom = new Set(
        socketsInRoom.map((s) => s.data?.userId).filter(Boolean),
      );

      console.log("User IDs in room:", userIdsInRoom);

      const pushPayloads = [];

      for (const participant of otherUsers) {
        const participantId = participant._id.toString();
        console.log("Participant ID:", participantId);
        const isInRoom = userIdsInRoom.has(participantId);
        console.log("Is in room:", isInRoom);

        const unreadCount = await _countUnreadForConversation(
          conversationId,
          participantId,
        );
        console.log("Unread count:", unreadCount);

        io.to(`user:${participantId}`).emit("conversationUpdated", {
          conversationId,

          opponent: {
            _id: sender?._id ?? userId,
            fullName: senderName,
            avatar: sender?.avatar,
          },

          lastMessage: {
            content,
            type,
            createdAt: message.createdAt,
          },

          updatedAt: message.createdAt,
          unreadCount,
        });

        console.log("Pushing to participant:", participantId);
        console.log("Push token:", participant.pushToken);
        if (!isInRoom && participant.pushToken) {
          pushPayloads.push({
            pushToken: participant.pushToken,
            title: senderName,
            body: notifBody,
            data: {
              conversationId: conversationId.toString(),
              type: "new_message",
            },
          });
        }
      }

      console.log("Push payloads:", pushPayloads);
      // 🚀 send push
      if (pushPayloads.length > 0) {
        sendPushNotifications(pushPayloads).catch(() => {});
      }
    } catch (err) {
      console.error("sendMessage error:", err);
      socket.emit("error", { msg: "Lỗi gửi tin" });
    }
  });

  socket.on("deleteMessage", async ({ messageId, conversationId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit("error", { msg: "Tin nhắn không tồn tại" });
        return;
      }
      if (message.sender.toString() !== userId.toString()) {
        socket.emit("error", { msg: "Không có quyền xóa tin nhắn này" });
        return;
      }
      await Message.findByIdAndDelete(messageId);
      io.to(conversationId.toString()).emit("messageDeleted", {
        messageId,
        conversationId,
      });
    } catch (err) {
      console.error("deleteMessage error:", err);
      socket.emit("error", { msg: "Lỗi xóa tin nhắn" });
    }
  });

  socket.on("joinConversation", async (convId) => {
    socket.join(convId.toString());

    try {
      await _markConversationAsRead(convId, userId);

      const conv = await Conversation.findById(convId).lean();
      if (!conv) return;

      const otherParticipants = conv.participants.filter(
        (p) => p.toString() !== userId.toString(),
      );

      // update inbox của chính user
      io.to(`user:${userId}`).emit("conversationUpdated", {
        conversationId: convId,
        unreadCount: 0,
      });

      // notify người kia message đã read
      for (const participantId of otherParticipants) {
        io.to(`user:${participantId}`).emit("messagesRead", {
          conversationId: convId,
          readBy: userId,
        });
      }
    } catch (err) {
      console.error("joinConversation error:", err);
    }
  });

  // ─── Leave Conversation Room
  socket.on("leaveConversation", (convId) => {
    // console.log("User left conversation:", convId);
    socket.leave(convId.toString());
  });

}

async function _markConversationAsRead(convId, userId) {
  await Message.updateMany(
    {
      conversation: convId,
      sender: { $ne: userId },
      readBy: { $nin: [userId] },
    },
    { $addToSet: { readBy: userId } },
  );
}

async function _countUnreadForConversation(convId, userId) {
  return Message.countDocuments({
    conversation: convId,
    sender: { $ne: userId },
    readBy: { $nin: [userId] },
  });
}

module.exports = chatSocket;
