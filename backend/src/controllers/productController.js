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

    const product = await Product.findById(req.params.id)
      .populate("ownerId", "fullName email")
      .select("+createdAt");

    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    const ownerIdStr = product.ownerId._id.toString(); // ← lấy _id từ object populated

    // So sánh an toàn
    const isOwner = userId && ownerIdStr === userId.toString().trim();

    if (!isOwner) {
      product.views += 1;
      await product.save();
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

// GET /api/products/search?q=...&category=...&sortBy=...&minPrice=...&maxPrice=...
exports.search = async (req, res) => {
  try {
    const { q, category, sortBy, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    const filter = { status: "active" };

    // Text search
    if (q && q.trim()) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: "i" } },
        { description: { $regex: q.trim(), $options: "i" } },
      ];
    }

    // Category filter
    if (category && category !== "Tất cả") {
      filter.category = category;
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sort
    let sort = { createdAt: -1 }; // default: newest
    if (sortBy === "price_asc") sort = { price: 1 };
    else if (sortBy === "price_desc") sort = { price: -1 };
    else if (sortBy === "newest") sort = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate("seller", "fullName avatar"),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/mine
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.userId })
      .sort({ createdAt: -1 })
      .populate("seller", "fullName avatar");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, images, location } = req.body;

    const product = await Product.create({
      title,
      description,
      price,
      category,
      images: images || [],
      location,
      seller: req.userId,
    });

    await product.populate("seller", "fullName avatar");
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "seller",
      "fullName avatar phone email"
    );
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // Chỉ owner mới được sửa
    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({ message: "Không có quyền chỉnh sửa sản phẩm này" });
    }

    const { title, description, price, category, images, location, status, condition } = req.body;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { title, description, price, category, images, location, status, condition },
      { new: true, runValidators: true }
    ).populate("seller", "fullName avatar");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // Chỉ owner mới được xoá
    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({ message: "Không có quyền xoá sản phẩm này" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Xoá sản phẩm thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
