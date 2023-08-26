const { app, BrowserWindow } = require("electron");
const io = require("socket.io-client");

let profileWindow, spacemapWindow

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  // Connect to the server using Socket.io
  const socket = io("http://localhost:3000");

  // Load your game HTML file through the server
  mainWindow.loadURL("http://localhost:3000/login.html");

  // Handle game-related events here
  // For example, socket.on('gameUpdate', handleGameUpdate);

  socket.on("loginSuccess", () => {
    profileWindow = new BrowserWindow({
      parent: mainWindow,
      show: false,
    });
    spacemapWindow = new BrowserWindow({ parent: mainWindow, show: false });
    profileWindow.loadURL("http://localhost:3000/profileWindow.html");
    spacemapWindow.loadURL("http://localhost:3000/spacemapWindow.html");
    profileWindow.once('ready-to-show', () => {
      profileWindow.show();
    });
    spacemapWindow.once('ready-to-show', () => {
      spacemapWindow.show();
    })
  });

  mainWindow.on("closed", () => {
    // Disconnect from the server when the window is closed
    socket.disconnect();
  });
});
