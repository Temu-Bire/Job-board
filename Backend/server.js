import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import jobRoutes from './routes/jobs.routes.js';
import applicationRoutes from './routes/applications.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import statsRoutes from './routes/stats.routes.js';
import userRoutes from './routes/users.routes.js';
import messageRoutes from './routes/messages.routes.js';
import contactRoutes from './routes/contact.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initSocket } from './socket.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
initSocket(server);

// Middleware
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (curl/postman) and same-origin
    if (!origin) return callback(null, true);
    if (corsOrigins.length === 0) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Static uploads (avatar/resume)
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contact', contactRoutes);

// Serve Frontend
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../Frontend/dist')));

  // Any route that is not API will be redirected to index.html
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, '../Frontend', 'dist', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
