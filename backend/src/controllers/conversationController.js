const Conversation = require("../models/Conversation");

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id; 

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate("participants", "username email") 
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .lean();

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conv = await Conversation.findOne({
      _id: id,
      participants: userId
    })
      .populate("participants", "username email")
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
    const currentUserId = req.user.id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    // Sort để đảm bảo unique
    const participantIds = [currentUserId, userId].sort();

    let conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: participantIds, $size: 2 }
    })
      .populate("participants", "username email")
      .populate("lastMessage");

    if (!conversation) {
      conversation = await Conversation.create({
        type: "private",
        participants: participantIds,
        updatedAt: new Date()
      });

      await conversation.populate("participants", "username email");
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};