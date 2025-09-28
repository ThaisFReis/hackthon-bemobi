import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ["http://localhost:3000", "http://localhost:3002"],
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ["http://localhost:3000", "http://localhost:3002"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Make io available to routes
app.set('io', io);

import chatRoutes from './api/chat';
import customerRoutes from './api/customers';
import queueRoutes from './api/queue';
import paymentRoutes from './api/payments';
import langsmithRoutes from './api/langsmith';
import analyticsRoutes from './api/analytics';
import { QueueService } from './services/queueService';
import { LangchainGeminiService } from './services/langchainGeminiService';

// Initialize LangchainGeminiService
let aiChatService: LangchainGeminiService;

try {
  console.log('=== AI Service Initialization ===');

  // Check required API keys
  const hasGemini = !!process.env.GEMINI_API_KEY;

  console.log('API Keys status:');
  console.log('- GEMINI_API_KEY:', hasGemini ? 'PRESENT' : 'MISSING');
  console.log('- LANGCHAIN_API_KEY:', !!process.env.LANGCHAIN_API_KEY ? 'PRESENT (optional)' : 'MISSING (tracing disabled)');

  if (!hasGemini) {
    throw new Error('GEMINI_API_KEY is required for LangchainGeminiService. Please set this environment variable.');
  }

  console.log('Initializing LangchainGeminiService...');
  aiChatService = new LangchainGeminiService();
  console.log('✅ LangchainGeminiService initialized successfully');

} catch (error) {
  console.error('❌ Failed to initialize LangchainGeminiService:', error);
  console.error('Please ensure GEMINI_API_KEY is set in your environment variables.');
  process.exit(1);
}

// Initialize queue service
const queueService = new QueueService(aiChatService);

// Make services available to routes
app.set('queueService', queueService);
app.set('aiChatService', aiChatService);

// Add debug endpoint to check AI service status
app.get('/api/debug/ai-service', (req, res) => {
  res.json({
    service: 'LangchainGeminiService',
    timestamp: new Date().toISOString(),
    geminiModel: 'gemini-pro',
    langsmithEnabled: !!process.env.LANGCHAIN_API_KEY,
    queueService: queueService.getAIServiceInfo()
  });
});

app.use('/api/chat', chatRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/langsmith', langsmithRoutes);
app.use('/api/analytics', analyticsRoutes);

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

  // Join customer-specific room for real-time updates
  socket.on('join-customer-room', (customerId) => {
    socket.join(`customer-${customerId}`);
    console.log(`User ${socket.id} joined customer room: customer-${customerId}`);
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

// Initialize queue with customer data from database on startup
const initializeQueue = async () => {
  try {
    console.log('=== Queue Initialization ===');
    await queueService.refreshQueue(); // No parameters - will fetch from database
    const queueStatus = queueService.getQueueStatus();
    console.log(`✅ Queue initialized with ${queueStatus.queue.length} at-risk customers from database`);
    console.log(`AI Service in use: ${queueService.getAIServiceInfo()}`);
  } catch (error) {
    console.error('❌ Failed to initialize queue:', error);
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      ai: 'LangchainGeminiService',
      queue: 'QueueService',
      database: 'prisma',
      gemini: 'active',
      langsmith: !!process.env.LANGCHAIN_API_KEY ? 'enabled' : 'disabled'
    }
  });
});

// Start server and initialize queue
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log('===========================================');
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🤖 AI Service: LangchainGeminiService with Gemini Pro`);
  console.log(`🔧 LangSmith: ${!!process.env.LANGCHAIN_API_KEY ? 'Enabled' : 'Disabled'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 AI debug: http://localhost:${PORT}/api/debug/ai-service`);
  console.log('===========================================');

  // Initialize queue after a short delay to ensure server is ready
  setTimeout(initializeQueue, 2000);
});

export default app;