const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: [
        "Bất động sản",
        "Xe cộ",
        "Thú cưng",
        "Đồ gia dụng",
        "Việc làm",
        "Điện tử",
        "Khác",
      ],
      default: "Khác",
    },
    images: [{ type: String }],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    location: { type: String, default: "" },
    status: { type: String, enum: ["active", "sold", "hidden"], default: "active" },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
