const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user;

    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "fullName avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .lean();

    // For each conversation, count messages not read by current user
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          readBy: { $nin: [userId] },
        });
        return { ...conv, unreadCount };
      }),
    );

    res.json(withUnread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;

    const conv = await Conversation.findOne({
      _id: id,
      participants: userId,
    })
      .populate("participants", "fullName email")
      .populate("lastMessage")
      .lean();

    if (!conv) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json(conv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOrGetPrivateConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    // Sort để đảm bảo unique
    const participantIds = [currentUserId, userId].sort();

    let conversation = await Conversation.findOne({
      participants: { $all: participantIds, $size: 2 },
    })
      .populate("participants", "fullName email")
      .populate("lastMessage");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: participantIds,
        updatedAt: new Date(),
      });

      await conversation.populate("participants", "fullName email");
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { convId } = req.params;
    const userId = req.user;

    const conversation = await Conversation.findOne({
      _id: convId,
      participants: userId,
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await Message.updateMany(
      {
        conversation: convId,
        sender: { $ne: userId },
        readBy: { $nin: [userId] },
      },
      { $addToSet: { readBy: userId } },
    );

    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
