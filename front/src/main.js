const { randomUUID } = require("crypto");
const { app, BrowserWindow } = require("electron");
const io = require("socket.io-client");

let profileWindow, spacemapWindow;
const socketuuid = randomUUID();

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Connect to the server using Socket.io
  const socket = io("http://localhost:3000");

  socket.emit('joinRoom', { room: socketuuid})

  // Load your game HTML file through the server
  mainWindow.loadURL(`http://localhost:3000/login.html?socketuuid=${socketuuid}`);

  // Handle game-related events here
  // For example, socket.on('gameUpdate', handleGameUpdate);

  socket.on("loginSuccess", () => {
    console.log("Successful login, starting game")
    mainWindow.loadURL(`http://localhost:3000/game.html`)

  });

  mainWindow.on("closed", () => {
    // Disconnect from the server when the window is closed
    socket.disconnect();
  });
});
