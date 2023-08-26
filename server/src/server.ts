import express = require("express");
import cors = require("cors");
import http = require("http");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { Server } from "socket.io";
import path = require("path");
import {
  getUserByUsername,
  setupDatabaseConnection,
  updateUserLoginTime,
  UserCredentials,
} from "./db/db";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

setupDatabaseConnection();

const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'web' directory (one level higher)
app.use(express.static(path.join(__dirname, "..", "web")));

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "web", "html", "login.html"));
});

app.get("/game.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "web", "html", "game.html"));
});

app.post("/login", (req, res) => {
  const { username, password, socketuuid } = req.body;
  console.log(req.body)
  let userCredentials: UserCredentials;
  Promise.resolve(
    getUserByUsername(username).then((user) => {
      userCredentials = user[0];
      if (
        username === userCredentials.username &&
        password === userCredentials.password
      ) {
        res.json({ success: true, message: "Login successful" });
        io.to(socketuuid).emit('loginSuccess');
        console.log(`Emitting to ${socketuuid} that login is success`)
        updateUserLoginTime(userCredentials.username);
      } else {
        res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
    })
  );
});

io.on("connection", (socket) => {
  socket.on('joinRoom', ({ room }) => {
    socket.join(room);
    console.log(`User connected, joining ${room}`)
  });

  io.on('login', () => {

  })

  // Handle game-related events here
  // For example, socket.on('gameUpdate', handleGameUpdate);

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
