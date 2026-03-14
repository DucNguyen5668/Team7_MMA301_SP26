const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: String,
    role: String,
    isVerified: Boolean,
    pushToken: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
