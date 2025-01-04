const cors = require("cors");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://funny-chaja-458311.netlify.app/", // Frontend URL
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.get("/", (req, res) => {
  res.send("WELCOME TO HELL PROGRAMMING");
});

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Assign gender to the current user
  let gender;
  if (waitingUser) {
    // If there's a waiting user, assign opposite gender
    gender = waitingUser.gender === "male" ? "female" : "male";

    // Join the current user with the waiting user
    socket.join(waitingUser.id);
    socket.join(socket.id);

    // Notify both users about the chat start and assign genders
    io.to(waitingUser.id).emit("chat_start", {
      partnerId: socket.id,
      gender: waitingUser.gender,
    });
    io.to(socket.id).emit("chat_start", {
      partnerId: waitingUser.id,
      gender: gender,
    });

    // Reset the waiting user
    waitingUser = null;
  } else {
    // If no one is waiting, this user will be the waiting user, and we assign them "male"
    gender = "male";
    waitingUser = socket;
    waitingUser.gender = gender; // Save the gender of the waiting user
  }

  // Listen for incoming messages
  socket.on("message", (data) => {
    io.to(data.partnerId).emit("message", {
      senderId: socket.id,
      text: data.text,
      gender: gender, // Include gender in the message
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (waitingUser === socket) {
      waitingUser = null;
    } else {
      io.to(socket.id).emit("chat_end");
    }
  });
});

const PORT = process.env.PORT || 4400;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
