const express = require("express");
const Product = require("../models/Product");

// POST product
module.exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, condition, ownerId, categoryId, image } =
      req.body;

    const product = new Product({
      title,
      description,
      price,
      condition,
      ownerId,
      categoryId,
      image,
    });

    const savedProduct = await product.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({
      message: "Không thể tạo sản phẩm",
      error: error.message,
    });
  }
};

module.exports.renderProduct = async (req, res) => {
  const { excludeOwner } = req.query;

  let filter = {};

  if (excludeOwner) {
    filter.ownerId = { $ne: excludeOwner };
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });

  res.json(products);
};

module.exports.manageMyProduct = async (req, res) => {
  const { userId } = req.query;

  const products = await Product.find({ ownerId: userId }).sort({
    createdAt: -1,
  });

  res.json(products);
};

// module.exports.productDetail = async (req, res) => {
//   try {
//     const { userId } = req.query;

//     const product = await Product.findById(req.params.id).populate(
//       "ownerId",
//       "fullName email",
//     );

//     console.log("Product ID:", req.params.id);
//     console.log("Query userId:", req.query.userId);
//     console.log("Owner ID:", product.ownerId.toString());
//     console.log(
//       "Is owner?",
//       product.ownerId.toString() === req.query.userId?.toString(),
//     );

//     // kiểm tra nếu userId tồn tại và KHÔNG phải owner
//     if (userId && product.ownerId.toString() !== userId.toString()) {
//       product.views += 1;
//       await product.save();
//     }

//     // res.json(product);
//     res.send("ok");
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

module.exports.productDetail = async (req, res) => {
  try {
    const { userId } = req.query;

    const product = await Product.findById(req.params.id)
      .populate("ownerId", "fullName email")
      .select("+createdAt");

    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    console.log("Product ID:", req.params.id);
    console.log("Query userId:", req.query.userId);

    // Lấy ownerId dưới dạng string hex đúng cách
    const ownerIdStr = product.ownerId._id.toString(); // ← lấy _id từ object populated
    console.log("Owner ID string:", ownerIdStr);

    // So sánh an toàn
    const isOwner = userId && ownerIdStr === userId.toString().trim();

    console.log("Is owner?", isOwner);

    if (!isOwner) {
      product.views += 1;
      await product.save();
      console.log("View increased to:", product.views);
    } else {
      console.log("View NOT increased (owner or no userId)");
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
module.exports.getProductByOwner = async (req, res) => {
  try {
    const products = await Product.find({
      ownerId: req.params.userId,
    });

    res.json(products);
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports.editProductDetail = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.json(product);
};

module.exports.delete = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};
