const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const initSocket = require("./socket");
const http = require("http");

dotenv.config();
connectDB();

const authRoutes = require("./routes/authRoute");

const app = express();
const server = http.createServer(app); 
initSocket(server);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

module.exports = { app, server };