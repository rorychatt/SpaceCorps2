const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/login.html', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Validate username and password (this is just an example)
  if (username === 'user' && password === 'pass') {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle game-related events here
  // For example, socket.on('gameUpdate', handleGameUpdate);

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
