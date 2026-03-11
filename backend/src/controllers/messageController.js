const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  try {
    const { convId } = req.params;
    const userId = req.user;
    const limit = parseInt(req.query.limit) || 20;
    const before = req.query.before; // id của tin nhắn cũ nhất hiện tại

    const conversation = await Conversation.findOne({
      _id: convId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Build query
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

    res.json({
      messages,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};