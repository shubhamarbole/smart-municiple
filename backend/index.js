import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import prisma from './prismaClient.js';
import authRoutes from './routes/auth.js';
import issueRoutes from './routes/issues.js';
import departmentRoutes from './routes/departments.js';
import complaintRoutes from './routes/complaints.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Make io accessible to all route handlers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── Public Routes ──────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);       // public – no auth required

// ─── Internal Staff Routes ──────────────────────────────
app.use('/api/issues', issueRoutes);               // authenticated internal team
app.use('/api/departments', departmentRoutes);     // authenticated internal team

// ─── Admin Protected Routes ─────────────────────────────
app.use('/api/admin', adminRoutes);                // ADMIN role only

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Public Complaint API: http://localhost:${PORT}/api/complaints`);
  console.log(`🔐 Admin API:            http://localhost:${PORT}/api/admin/*`);
});
