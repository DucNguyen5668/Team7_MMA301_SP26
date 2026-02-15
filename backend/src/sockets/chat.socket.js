const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

function chatSocket(io, socket) {
  const userId = socket.user;
  console.log("User connected:", userId);

  socket.on("sendMessage", async (data) => {
    const { conversationId, content, type = "text" } = data;
    
    try {
      // Validate quyền gửi (user là participant)
      const conv = await Conversation.findById(conversationId);
      if (!conv || !conv.participants.includes(userId)) {
        socket.emit("error", { msg: "Không có quyền" });
        return;
      }

      // Tạo message
      const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        content,
        type,
        createdAt: new Date(),
      });

      // Update conversation (lastMessage + updatedAt)
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        updatedAt: new Date(),
      });

      // Emit realtime tới room = conversationId
      io.to(conversationId.toString()).emit("newMessage", {
        _id: message._id,
        conversation: conversationId,
        sender: userId,
        content,
        type,
        createdAt: message.createdAt,
      });
    } catch (err) {
      socket.emit("error", { msg: "Lỗi gửi tin" });
    }
  });

  // Khi user join chat → join room
  socket.on("joinConversation", (convId) => {
    console.log("User joined conversation:", convId);
    socket.join(convId.toString());
  });
}

module.exports = chatSocket;
