const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
  {
    ratedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ratingUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: 500,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

RatingSchema.index(
  { ratedUser: 1, ratingUser: 1, conversation: 1 },
  { unique: true, sparse: true },
);

module.exports = mongoose.model("Rating", RatingSchema);
