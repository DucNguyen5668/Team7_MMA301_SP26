const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");
const authenticate = require("../middleware/authMiddleware");

router.use(authenticate);

router.post("/", ratingController.createRating);

router.get("/user/:userId", ratingController.getUserRatings);

router.delete("/:ratingId", ratingController.deleteRating);

module.exports = router;
