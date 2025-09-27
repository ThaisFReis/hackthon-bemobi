import express from 'express';
import { AIChatService } from '../services/aiChatService';
import ChatMessage from '../models/chatMessage';
import ChatSession from '../models/chatSession';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const aiChatService = new AIChatService();

// Store active chat sessions in memory (in production, use a database)
const activeSessions = new Map<string, ChatSession>();

// Create a new chat session for agent activation
router.post('/create-session', async (req, res) => {
  try {
    const { customerId, customerName, paymentIssue } = req.body;

    if (!customerId || !customerName) {
      return res.status(400).json({ error: 'Customer ID and name are required' });
    }

    // Fetch complete customer data
    const customerResponse = await fetch(`http://localhost:3001/api/customers/${customerId}`);
    let customerData = null;

    if (customerResponse.ok) {
      customerData = await customerResponse.json();
    } else {
      console.warn(`Could not fetch customer data for ${customerId}, using basic info`);
    }

    const sessionId = uuidv4();
    const chatSession = new ChatSession({
      id: sessionId,
      customerId,
      customerName,
      status: 'active',
      startTime: new Date(),
      paymentIssue: paymentIssue || 'unknown'
    });

    // Store customer data in session for AI access
    if (customerData) {
      (chatSession as any).customerData = customerData;
    }

    activeSessions.set(sessionId, chatSession);

    // Generate initial AI message with complete customer data
    const initialMessage = await aiChatService.generateInitialMessage(chatSession, customerData);

    // Store the initial message in the session
    if (!chatSession.messages) {
      chatSession.messages = [];
    }
    chatSession.messages.push(initialMessage);

    // Emit to connected clients via Socket.io
    const io = req.app.get('io');
    io.to(sessionId).emit('chat-initiated', {
      sessionId,
      customerName,
      initialMessage
    });

    return res.json({
      sessionId,
      chatSession,
      initialMessage
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return res.status(500).json({ error: 'Failed to create chat session' });
  }
});

// Get active chat sessions
router.get('/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.values());
  return res.json(sessions);
});

// Get specific chat session
router.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  return res.json(session);
});

router.post('/ai-response', async (req, res) => {
  try {
    const { session, message, history } = req.body;

    // Basic validation
    if (!session || !session.id || !message || !message.content) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

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

    const aiResponse = await aiChatService.generateResponse(chatHistory, userMessage);

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

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    const message = new ChatMessage({
      chatSessionId: sessionId,
      sender,
      content,
      timestamp: new Date(),
      messageType: sender === 'customer' ? 'question' : 'response',
    });

    // Add message to session history
    if (!session.messages) {
      session.messages = [];
    }
    session.messages.push(message);

    // Emit message via Socket.io
    const io = req.app.get('io');
    io.to(sessionId).emit('receive-message', message);

    // If it's a customer message, generate AI response
    if (sender === 'customer') {
      const aiResponse = await aiChatService.generateResponse(session.messages, message);
      session.messages.push(aiResponse);
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
