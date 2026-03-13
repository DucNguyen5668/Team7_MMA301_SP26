const Product = require("../models/Product");

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
