const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: ["Xe cộ", "Đồ gia dụng", "Việc làm", "Điện tử", "Khác"],
      default: "Khác",
    },
    condition: {
      type: String,
      enum: ["new", "used"],
      default: "used",
    },
    images: [{ type: String }],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    location: { type: String, default: "" },
    status: { type: String, enum: ["active", "sold", "hidden"], default: "active" },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
