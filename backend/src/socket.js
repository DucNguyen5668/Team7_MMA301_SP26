const { Server } = require("socket.io");

const chatSocket = require("./sockets/chat.socket");
const socketAuth = require("./middleware/socketAuth");

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
    maxHttpBufferSize: 1e8,
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    chatSocket(io, socket);

    socket.on("disconnect", () => {
      // console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = initSocket;
