const { Server } = require('socket.io');
const tokenService = require('./services/token.service');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  // Only authenticated users can connect; each user joins a private room
  io.use((socket, next) => {
    try {
      const payload = tokenService.verifyAccessToken(socket.handshake.auth?.token);
      socket.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  return io;
};

const notifyUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId.toString()}`).emit(event, payload);
};

module.exports = { initSocket, notifyUser };
