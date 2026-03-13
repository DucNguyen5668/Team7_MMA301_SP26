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
