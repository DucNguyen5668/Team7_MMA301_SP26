const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: String,
    type: {
      type: String,
      enum: ["text", "image", "location", "video", "product"],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", MessageSchema);
