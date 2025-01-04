const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const cors = require("cors");

app.use(cors());
app.get("/", (req, res) => {
  res.send("WELCOME TO HELL PROGRAMMING");
});

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Check if there's a waiting user
  if (waitingUser) {
    // Pair the current user with the waiting user
    socket.join(waitingUser);
    socket.join(socket.id);

    io.to(waitingUser).emit("chat_start", { partnerId: socket.id });
    io.to(socket.id).emit("chat_start", { partnerId: waitingUser });

    waitingUser = null; // Reset waiting user
  } else {
    waitingUser = socket.id; // Set the current user as waiting
  }

  // Handle messages
  socket.on("message", (data) => {
    io.to(data.partnerId).emit("message", {
      senderId: socket.id,
      text: data.text,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (waitingUser === socket.id) {
      waitingUser = null;
    } else {
      io.to(socket.id).emit("chat_end");
    }
  });
});

const PORT = 4400;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
