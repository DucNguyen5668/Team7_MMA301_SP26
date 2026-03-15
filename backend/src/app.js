const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const initSocket = require("./socket");
const http = require("http");

dotenv.config();
connectDB();

const authRoutes = require("./routes/authRoute");
const conversationRoutes = require("./routes/conversationRoute");
const messageRoutes = require("./routes/messageRoute");
const ratingRoutes = require("./routes/ratingRoute");
const categoriesRoutes = require("./routes/categoryRoute");
const productRoutes = require("./routes/productRoute");
const notificationRoutes = require("./routes/notificationRoute");
const userRoutes = require("./routes/userRoute");

const app = express();
const server = http.createServer(app);
initSocket(server);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

module.exports = { app, server };
