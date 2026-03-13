const jwt = require("jsonwebtoken");

function socketAuth(socket, next) {
  const authHeader = socket.handshake.auth?.token;
  if (!authHeader) {
    return next(new Error("Unauthorized"));
  }

  try {
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
    socket.user = decoded.id; // object chứa id
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new Error("TokenExpired"));
    }
    return next(new Error("InvalidToken"));
  }
}

module.exports = socketAuth;
