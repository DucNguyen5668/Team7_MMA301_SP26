const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  try {
    const { convId } = req.params;
    const userId = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findOne({
      _id: convId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const total = await Message.countDocuments({ conversation: convId });
    const totalPages = Math.ceil(total / limit);

    const messages = await Message.find({ conversation: convId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "fullName")
      .lean();

    res.json({
      messages: messages, // cũ → mới
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
