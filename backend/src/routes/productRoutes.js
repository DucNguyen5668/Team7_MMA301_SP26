const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const controller = require("../controllers/productController");

// POST product
router.post("/", controller.createProduct);

module.exports = router;
