import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Make io available to routes
app.set('io', io);

import chatRoutes from './api/chat';
import customerRoutes from './api/customers';
import queueRoutes from './api/queue';
import metricsRoutes from './api/metrics';
import metabaseRoutes from './api/metabase';
import { QueueService } from './services/queueService';
import { AIChatService } from './services/aiChatService';
import Customer from './models/customer';
import * as fs from 'fs';
import * as path from 'path';

// Initialize services
const aiChatService = new AIChatService();
const queueService = new QueueService(aiChatService);

// Make services available to routes
app.set('queueService', queueService);
app.set('aiChatService', aiChatService);

app.use('/api/chat', chatRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/metabase', metabaseRoutes);

// Connect queue service to Socket.io for real-time events
queueService.setEventEmitter((event: string, data: any) => {
  io.emit('queue-event', { event, data });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-chat', (chatSessionId) => {
    socket.join(chatSessionId);
    console.log(`User ${socket.id} joined chat session: ${chatSessionId}`);
  });

  // Join queue monitoring room
  socket.on('join-queue-monitoring', () => {
    socket.join('queue-monitoring');
    console.log(`User ${socket.id} joined queue monitoring`);

    // Send current queue status
    const queueStatus = queueService.getQueueStatus();
    socket.emit('queue-status', queueStatus);
  });

  socket.on('send-message', (data) => {
    socket.to(data.chatSessionId).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Load customers from JSON file
function loadCustomersFromJSON(): Customer[] {
  try {
    const dataPath = path.join(__dirname, '../data/mockCustomers.json');
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const customers = jsonData.customers.map((customerData: any) => {
      return new Customer(customerData);
    });

    console.log(`Loaded ${customers.length} customers from JSON file`);
    return customers;
  } catch (error) {
    console.error('Error loading customers from JSON:', error);
    return [];
  }
}

// Initialize queue with customer data on startup
const initializeQueue = async () => {
  try {
    const customers = loadCustomersFromJSON();
    await queueService.refreshQueue(customers);
    const atRiskCustomers = customers.filter((c: any) => c.requiresIntervention());
    console.log(`Queue initialized with ${atRiskCustomers.length} at-risk customers out of ${customers.length} total customers`);
  } catch (error) {
    console.error('Failed to initialize queue:', error);
  }
};

// Start server and initialize queue
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Initialize queue after a short delay to ensure server is ready
  setTimeout(initializeQueue, 2000);
});

export default app;
