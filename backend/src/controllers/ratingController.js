const Rating = require("../models/Rating");
const Conversation = require("../models/Conversation");

async function calculateUserStats(userId) {
  const ratings = await Rating.find({
    ratedUser: userId,
  }).lean();

  if (ratings.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    };
  }

  // Calculate average
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal

  // Calculate distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings.forEach((r) => {
    distribution[r.rating]++;
  });

  return {
    averageRating,
    totalRatings: ratings.length,
    ratingDistribution: distribution,
  };
}

exports.createRating = async (req, res) => {
  try {
    const { ratedUserId, conversationId, productId, rating, review } = req.body;
    const ratingUserId = req.user.id;

    // Validation
    if (!ratedUserId || !rating) {
      return res.status(400).json({
        message: "ratedUserId and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    // Prevent self-rating
    if (ratedUserId === ratingUserId) {
      return res.status(400).json({
        message: "You cannot rate yourself",
      });
    }

    // Verify conversation exists and user is participant (if conversationId provided)
    if (conversationId) {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $all: [ratingUserId, ratedUserId] },
      });

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found or you are not a participant",
        });
      }

      // Check if rating already exists for this conversation
      const existingRating = await Rating.findOne({
        ratedUser: ratedUserId,
        ratingUser: ratingUserId,
        conversation: conversationId,
      });

      if (existingRating) {
        return res.status(400).json({
          message: "You have already rated this user for this conversation",
        });
      }
    }

    // Create rating
    const newRating = await Rating.create({
      ratedUser: ratedUserId,
      ratingUser: ratingUserId,
      conversation: conversationId,
      product: productId,
      rating,
      review: review?.trim() || null,
    });

    // Populate rating user info
    await newRating.populate("ratingUser", "fullName avatar");

    res.status(201).json({
      message: "Rating created successfully",
      rating: newRating,
    });
  } catch (error) {
    console.error("Create rating error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get ratings with pagination
    const ratings = await Rating.find({
      ratedUser: userId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("ratingUser", "fullName avatar")
      .populate("product", "title")
      .lean();

    const total = await Rating.countDocuments({
      ratedUser: userId,
    });

    // Calculate stats from all ratings (not paginated)
    const stats = await calculateUserStats(userId);

    res.json({
      stats: {
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
        ratingDistribution: stats.ratingDistribution,
      },
      ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get user ratings error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await calculateUserStats(userId);

    res.json({
      averageRating: stats.averageRating,
      totalRatings: stats.totalRatings,
      ratingDistribution: stats.ratingDistribution,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;

    // Find rating
    const existingRating = await Rating.findById(ratingId);

    if (!existingRating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    // Verify ownership
    if (existingRating.ratingUser.toString() !== userId) {
      return res.status(403).json({
        message: "You can only update your own ratings",
      });
    }

    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          message: "Rating must be between 1 and 5",
        });
      }
      existingRating.rating = rating;
    }

    if (review !== undefined) {
      existingRating.review = review?.trim() || null;
    }

    await existingRating.save();

    res.json({
      message: "Rating updated successfully",
      rating: existingRating,
    });
  } catch (error) {
    console.error("Update rating error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const userId = req.user.id;

    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    // Verify ownership
    if (rating.ratingUser.toString() !== userId) {
      return res.status(403).json({
        message: "You can only delete your own ratings",
      });
    }

    await rating.deleteOne();

    res.json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error("Delete rating error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.canRate = async (req, res) => {
  try {
    const { conversationId, userId } = req.params;
    const currentUserId = req.user.id;

    // Check if conversation exists and both users are participants
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $all: [currentUserId, userId] },
    });

    if (!conversation) {
      return res.json({ canRate: false, reason: "Conversation not found" });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      ratedUser: userId,
      ratingUser: currentUserId,
      conversation: conversationId,
    });

    if (existingRating) {
      return res.json({
        canRate: false,
        reason: "Already rated",
        existingRating: {
          rating: existingRating.rating,
          review: existingRating.review,
          createdAt: existingRating.createdAt,
        },
      });
    }

    res.json({ canRate: true });
  } catch (error) {
    console.error("Can rate check error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMyRatings = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const ratings = await Rating.find({ ratingUser: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("ratedUser", "fullName avatar")
      .populate("product", "title")
      .lean();

    const total = await Rating.countDocuments({ ratingUser: userId });

    res.json({
      ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my ratings error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
