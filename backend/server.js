const { server } = require("./src/app");

server.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});
