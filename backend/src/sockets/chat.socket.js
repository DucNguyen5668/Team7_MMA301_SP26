const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

function chatSocket(io, socket) {
  const userId = socket.user;
  console.log("User connected:", userId);

  // ─── Personal user room ────────────────────────────────────────────────────
  // Join immediately on connect so unread pushes reach this user
  // even when they're on the inbox screen (not inside any conversation)
  socket.join(`user:${userId}`);

  socket.on("sendMessage", async (data) => {
    const {
      conversationId,
      content = "",
      type = "text",
      attachment = null,
    } = data;

    try {
      const conv = await Conversation.findById(conversationId);
      if (
        !conv ||
        !conv.participants.map((p) => p.toString()).includes(userId.toString())
      ) {
        socket.emit("error", { msg: "Không có quyền" });
        return;
      }

      const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        content,
        type,
        attachment,
        readBy: [userId],
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
      });

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

      // notify unread count
      const otherParticipants = conv.participants.filter(
        (p) => p.toString() !== userId.toString(),
      );

      for (const participantId of otherParticipants) {
        const unreadCount = await _countUnreadForConversation(
          conversationId,
          participantId,
        );

        io.to(`user:${participantId}`).emit("unreadUpdate", {
          conversationId,
          unreadCount,
        });
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

      // Chỉ cho phép người gửi xóa tin của mình
      if (message.sender.toString() !== userId.toString()) {
        socket.emit("error", { msg: "Không có quyền xóa tin nhắn này" });
        return;
      }

      await Message.findByIdAndDelete(messageId);

      // Notify all participants in the conversation
      io.to(conversationId.toString()).emit("messageDeleted", {
        messageId,
        conversationId,
      });
    } catch (err) {
      console.error("deleteMessage error:", err);
      socket.emit("error", { msg: "Lỗi xóa tin nhắn" });
    }
  });

  // ─── Join Conversation Room ────────────────────────────────────────────────
  socket.on("joinConversation", async (convId) => {
    console.log("User joined conversation:", convId, "| userId:", userId);
    socket.join(convId.toString());

    try {
      // Mark all unread messages in this conversation as read by current user
      await _markConversationAsRead(convId, userId);

      // Tell this client their unread count for this conversation is now 0
      socket.emit("markedAsRead", { conversationId: convId });

      // Notify other participants that their messages were seen
      const conv = await Conversation.findById(convId).lean();
      if (conv) {
        const otherParticipants = conv.participants.filter(
          (p) => p.toString() !== userId.toString(),
        );
        for (const participantId of otherParticipants) {
          io.to(`user:${participantId}`).emit("messagesRead", {
            conversationId: convId,
            readBy: userId,
          });
        }
      }
    } catch (err) {
      console.error("joinConversation error:", err);
    }
  });

  // ─── Leave Conversation Room ───────────────────────────────────────────────
  socket.on("leaveConversation", (convId) => {
    console.log("User left conversation:", convId);
    socket.leave(convId.toString());
  });

  // ─── Disconnect ───────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Mark all messages in a conversation as read by a specific user.
 * Only marks messages NOT sent by that user that they haven't read yet.
 */
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

/**
 * Count unread messages in a single conversation for a specific user.
 * Used to push accurate badge counts to the inbox after a new message arrives.
 */
async function _countUnreadForConversation(convId, userId) {
  return Message.countDocuments({
    conversation: convId,
    sender: { $ne: userId },
    readBy: { $nin: [userId] },
  });
}

/**
 * Count total unread messages across ALL conversations for a user.
 * Useful for a global app badge count.
 */
async function _countTotalUnreadForUser(userId) {
  const conversations = await Conversation.find({
    participants: userId,
  }).lean();

  let total = 0;
  for (const conv of conversations) {
    const count = await Message.countDocuments({
      conversation: conv._id,
      sender: { $ne: userId },
      readBy: { $nin: [userId] },
    });
    total += count;
  }
  return total;
}

module.exports = chatSocket;
