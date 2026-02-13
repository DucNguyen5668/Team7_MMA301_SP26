const jwt = require("jsonwebtoken");

function socketAuth(socket, next) {
  const authHeader = socket.handshake.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new Error("Unauthorized"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // object chứa id
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new Error("TokenExpired"));
    }
    return next(new Error("InvalidToken"));
  }
}

module.exports = socketAuth;
