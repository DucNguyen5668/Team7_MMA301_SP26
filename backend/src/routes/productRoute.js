const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const auth = require("../middleware/authMiddleware");

router.get("/search", productController.search);
router.get("/mine", auth, productController.getMyProducts);
router.post("/", auth, productController.createProduct);
router.get("/:id", productController.getProductById);

module.exports = router;
