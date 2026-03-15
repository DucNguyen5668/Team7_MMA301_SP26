const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  try {
    const { convId } = req.params;
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 20;
    const before = req.query.before;

    const conversation = await Conversation.findOne({
      _id: convId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const query = { conversation: convId };

    if (before) {
      const pivotMessage = await Message.findById(before).lean();
      if (pivotMessage) {
        query.createdAt = { $lt: pivotMessage.createdAt };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "fullName")
      .lean();

    // Strip video data — chỉ giữ thumbnail để FlatList không bị nặng
    const sanitized = messages.map((msg) => {
      if (msg.attachment?.type === "video") {
        return {
          ...msg,
          attachment: {
            type: msg.attachment.type,
            thumbnail: msg.attachment.thumbnail,
          },
        };
      }
      return msg;
    });

    res.json({
      messages: sanitized,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVideoData = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId).lean();

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    if (message.attachment?.type !== "video" || !message.attachment?.data) {
      return res.status(400).json({ message: "Tin nhắn không phải video" });
    }

    res.json({ data: message.attachment.data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
