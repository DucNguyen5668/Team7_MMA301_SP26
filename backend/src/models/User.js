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
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    bio: { type: String, default: "" },
    role: { type: String, default: "user" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
