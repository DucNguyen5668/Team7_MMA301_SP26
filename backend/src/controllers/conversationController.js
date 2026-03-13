const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user;
    const { filter, search } = req.query;

    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "fullName avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .lean();

    let result = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          readBy: { $nin: [userId] },
        });

        const opponent = conv.participants.find(
          (p) => p._id.toString() !== userId.toString(),
        );

        switch (conv.lastMessage.type) {
          case "image":
            conv.lastMessage.content = "Đã gửi 1 ảnh";
            break;
          case "video":
            conv.lastMessage.content = "Đã gửi 1 video";
            break;
          case "file":
            conv.lastMessage.content = "Đã gửi 1 file";
            break;
          default:
            break;
        }

        return {
          _id: conv._id,
          opponent: opponent || null,
          lastMessage: conv.lastMessage || null,
          updatedAt: conv.updatedAt,
          unreadCount,
        };
      }),
    );

    if (filter === "unread") {
      result = result.filter((c) => c.unreadCount > 0);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.opponent?.fullName?.toLowerCase().includes(q),
      );
    }

    res.json(result);
  } catch (error) {
    console.log("error", error);
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
    console.log("error", error);

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
    console.log("error", error);

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
    console.log("error", error);

    res.status(500).json({ message: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json([]);
    }

    const regex = new RegExp(q.trim(), "i");

    const users = await User.find({
      _id: { $ne: req.user },
      $or: [{ fullName: regex }, { email: regex }],
    })
      .select("_id fullName email avatar")
      .limit(20)
      .lean();

    res.json(users);
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ message: "Lỗi tìm kiếm người dùng" });
  }
};
