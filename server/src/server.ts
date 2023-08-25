import express = require("express");
import cors = require("cors");
import http = require("http");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { Server } from "socket.io";
import path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'web' directory (one level higher)
app.use(express.static(path.join(__dirname, '..', 'web')))

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'web', 'html', 'login.html'));
  });

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  // Validate username and password (this is just an example)
  if (username === "user" && password === "pass") {
    res.json({ success: true, message: "Login successful" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle game-related events here
  // For example, socket.on('gameUpdate', handleGameUpdate);

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
