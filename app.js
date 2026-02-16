const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set Static Folder
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

// Run when client connects
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', {
      user: 'System',
      text: `Welcome to ChatCord, ${user.username}!`,
      time: new Date().toLocaleTimeString()
    });

    // Broadcast when a user connects
    socket.broadcast.to(user.room).emit('message', {
      user: 'System',
      text: `${user.username} has joined the chat`,
      time: new Date().toLocaleTimeString()
    });

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chat messages
  socket.on('message', (msgData) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      // Send message IMMEDIATELY to all users
      io.to(user.room).emit('message', msgData);
    } else {
      io.emit('message', msgData);
    }
  });

  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit('message', {
        user: 'System',
        text: `${user.username} has left the chat`,
        time: new Date().toLocaleTimeString()
      });

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
    console.log('Client disconnected');
  });
});

//  Port
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
