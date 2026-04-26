import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let ioInstance = null;

export const initSocket = (httpServer) => {
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  ioInstance = new Server(httpServer, {
    cors: {
      origin: corsOrigins.length > 0 ? corsOrigins : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 120_000,
    pingInterval: 25_000,
    connectTimeout: 60_000,
  });

  ioInstance.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.join(`user:${decoded.id}`);
      next();
    } catch (err) {
      // If auth fails, we still let the socket connect but without a user room.
      next();
    }
  });

  ioInstance.on('connection', () => {
    // No-op; per-user rooms are handled in the auth middleware above.
  });

  return ioInstance;
};

export const getIO = () => ioInstance;

