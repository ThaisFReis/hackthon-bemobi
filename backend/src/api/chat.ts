import express from 'express';
import { LangchainGeminiService } from '../services/langchainGeminiService';
import { prisma } from '../lib/prisma';
import ChatMessage from '../models/chatMessage';
import ChatSession from '../models/chatSession';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const langchainGeminiService = new LangchainGeminiService();

// Create a new chat session for agent activation
router.post('/create-session', async (req, res) => {
  try {
    const { customerId, customerName, paymentIssue } = req.body;

    if (!customerId || !customerName) {
      return res.status(400).json({ error: 'Customer ID and name are required' });
    }

    // Fetch complete customer data from database
    const dbCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        paymentMethods: true,
        riskFactors: true,
        interventions: true,
        paymentStatus: true
      }
    });

    if (!dbCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Convert to format expected by AI service
    const customerData = {
      id: dbCustomer.id,
      name: dbCustomer.name,
      email: dbCustomer.email,
      phone: dbCustomer.phone,
      serviceProvider: dbCustomer.serviceProvider,
      serviceType: dbCustomer.serviceType,
      accountValue: Number(dbCustomer.accountValue),
      riskCategory: dbCustomer.riskCategory.toLowerCase().replace('_', '-'),
      riskSeverity: dbCustomer.riskSeverity?.toLowerCase(),
      lastPaymentDate: dbCustomer.lastPaymentDate?.toISOString() || '',
      nextBillingDate: dbCustomer.nextBillingDate.toISOString(),
      paymentMethod: dbCustomer.paymentMethods?.[0] ? {
        id: dbCustomer.paymentMethods[0].id,
        cardType: dbCustomer.paymentMethods[0].cardType || '',
        lastFourDigits: '****', // Don't expose real data
        expiryMonth: 0,
        expiryYear: 0,
        status: dbCustomer.paymentMethods[0].status.toLowerCase(),
        failureCount: dbCustomer.paymentMethods[0].failureCount,
        lastFailureDate: dbCustomer.paymentMethods[0].lastFailureDate?.toISOString(),
        lastSuccessDate: dbCustomer.paymentMethods[0].lastSuccessDate?.toISOString()
      } : {
        id: '',
        cardType: '',
        lastFourDigits: '',
        expiryMonth: 0,
        expiryYear: 0,
        status: '',
        failureCount: 0
      }
    };

    // Create chat session in database
    const dbChatSession = await prisma.chatSession.create({
      data: {
        id: uuidv4(),
        customerId,
        customerName,
        status: 'ACTIVE',
        paymentIssue: paymentIssue || 'unknown'
      }
    });

    const chatSession = new ChatSession({
      id: dbChatSession.id,
      customerId,
      customerName,
      status: 'active',
      startTime: dbChatSession.startTime,
      paymentIssue: dbChatSession.paymentIssue || 'unknown'
    });

    // Generate initial AI message with complete customer data
    const initialMessage = await langchainGeminiService.generateInitialMessage(chatSession, customerData);

    // Store the initial message in database
    await prisma.chatMessage.create({
      data: {
        chatSessionId: dbChatSession.id,
        sender: 'AI' as any,
        content: initialMessage.content,
        messageType: 'TEXT' as any
      }
    });

    // Emit to connected clients via Socket.io
    const io = req.app.get('io');
    io.to(dbChatSession.id).emit('chat-initiated', {
      sessionId: dbChatSession.id,
      customerName,
      initialMessage
    });

    return res.json({
      sessionId: dbChatSession.id,
      chatSession,
      initialMessage
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return res.status(500).json({ error: 'Failed to create chat session' });
  }
});

// Get active chat sessions
router.get('/sessions', async (req, res) => {
  try {
    const dbSessions = await prisma.chatSession.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    const sessions = dbSessions.map(session => ({
      id: session.id,
      customerId: session.customerId,
      customerName: session.customerName,
      status: session.status.toLowerCase(),
      startTime: session.startTime,
      endTime: session.endTime,
      paymentIssue: session.paymentIssue,
      messages: session.messages.map(msg => ({
        chatSessionId: msg.chatSessionId,
        sender: msg.sender.toLowerCase(),
        content: msg.content,
        timestamp: msg.timestamp,
        messageType: msg.messageType.toLowerCase()
      }))
    }));

    return res.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Get specific chat session
router.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const dbSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });

    if (!dbSession) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    const session = {
      id: dbSession.id,
      customerId: dbSession.customerId,
      customerName: dbSession.customerName,
      status: dbSession.status.toLowerCase(),
      startTime: dbSession.startTime,
      endTime: dbSession.endTime,
      paymentIssue: dbSession.paymentIssue,
      messages: dbSession.messages.map(msg => ({
        chatSessionId: msg.chatSessionId,
        sender: msg.sender.toLowerCase(),
        content: msg.content,
        timestamp: msg.timestamp,
        messageType: msg.messageType.toLowerCase()
      }))
    };

    return res.json(session);
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return res.status(500).json({ error: 'Failed to fetch chat session' });
  }
});

router.post('/ai-response', async (req, res) => {
  try {
    const { session, message, history } = req.body;

    // Basic validation
    if (!session || !session.id || !message || !message.content) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Store user message in database
    await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: 'CUSTOMER' as any,
        content: message.content,
        messageType: 'TEXT' as any
      }
    });

    // Create a ChatMessage instance from the received message data
    const userMessage = new ChatMessage({
      chatSessionId: session.id,
      sender: message.sender,
      content: message.content,
      timestamp: new Date(message.timestamp),
      messageType: message.messageType,
    });

    // Reconstruct history messages as ChatMessage instances
    const chatHistory: ChatMessage[] = history ? history.map((msg: any) => new ChatMessage({
      chatSessionId: msg.chatSessionId,
      sender: msg.sender,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      messageType: msg.messageType,
    })) : [];

    const aiResponse = await langchainGeminiService.generateResponse(chatHistory, userMessage);

    // Store AI response in database
    await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: 'AI' as any,
        content: aiResponse.content,
        messageType: 'TEXT' as any
      }
    });

    // Emit the AI response via Socket.io
    const io = req.app.get('io');
    io.to(session.id).emit('receive-message', aiResponse);

    return res.json(aiResponse);
  } catch (error) {
    console.error('Error in chat AI response:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message endpoint
router.post('/send-message', async (req, res) => {
  try {
    const { sessionId, content, sender } = req.body;

    if (!sessionId || !content || !sender) {
      return res.status(400).json({ error: 'Session ID, content, and sender are required' });
    }

    // Check if session exists in database
    const dbSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });

    if (!dbSession) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // Store message in database
    const dbMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        sender: sender.toUpperCase() as any,
        content,
        messageType: 'TEXT'
      }
    });

    const message = new ChatMessage({
      chatSessionId: sessionId,
      sender,
      content,
      timestamp: dbMessage.timestamp,
      messageType: sender === 'customer' ? 'question' : 'response',
    });

    // Emit message via Socket.io
    const io = req.app.get('io');
    io.to(sessionId).emit('receive-message', message);

    // If it's a customer message, generate AI response
    if (sender === 'customer') {
      // Convert database messages to ChatMessage instances for AI service
      const chatHistory = dbSession.messages.map(msg => new ChatMessage({
        chatSessionId: msg.chatSessionId,
        sender: msg.sender.toLowerCase() as any,
        content: msg.content,
        timestamp: msg.timestamp,
        messageType: msg.messageType.toLowerCase() as any
      }));

      const aiResponse = await langchainGeminiService.generateResponse(chatHistory, message);

      // Store AI response in database
      await prisma.chatMessage.create({
        data: {
          chatSessionId: sessionId,
          sender: 'AI' as any,
          content: aiResponse.content,
          messageType: 'TEXT' as any
        }
      });

      io.to(sessionId).emit('receive-message', aiResponse);

      return res.json({ userMessage: message, aiResponse });
    } else {
      return res.json({ message });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
