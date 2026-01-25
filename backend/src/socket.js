import { setupGameRoomHandlers } from './controllers/multiplayerController.js';

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Game room handlers
    setupGameRoomHandlers(socket, io);

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}
