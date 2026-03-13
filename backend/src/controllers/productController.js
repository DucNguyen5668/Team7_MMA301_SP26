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

module.exports.productDetail = async (req, res) => {
  try {
    const { userId } = req.query;

    const product = await Product.findById(req.params.id).populate(
      "ownerId",
      "fullName email",
    );

    // kiểm tra nếu userId tồn tại và KHÔNG phải owner
    if (userId && product.ownerId.toString() !== userId.toString()) {
      product.views += 1;
      await product.save();
    }

    res.json(product);
  } catch (error) {
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
