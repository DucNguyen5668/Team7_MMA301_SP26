const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const controller = require("../controllers/productController");

// POST product
router.post("/", controller.createProduct);
router.get("/", controller.renderProduct);
router.get("/owner/:userId", controller.getProductByOwner);
router.get("/:id", controller.productDetail);
router.put("/:id", controller.editProductDetail);
router.get("/my", controller.manageMyProduct);
router.delete("/:id", controller.delete);

module.exports = router;
