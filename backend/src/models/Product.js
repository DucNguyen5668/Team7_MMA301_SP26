// models/Product.js

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      maxlength: 1500,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    condition: {
      type: String,
      enum: ["new", "used"],
      default: "used",
    },

    status: {
      type: String,
      enum: ["active", "sold", "hidden"],
      default: "active",
    },

    views: {
      type: Number,
      default: 0,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Product", productSchema);
