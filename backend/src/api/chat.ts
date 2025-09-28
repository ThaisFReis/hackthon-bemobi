import express from 'express';
import { LangchainGeminiService } from '../services/langchainGeminiService';
import { prisma } from '../lib/prisma';
import ChatMessage from '../models/chatMessage';
import ChatSession from '../models/chatSession';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage as PrismaChatMessage, ChatSession as PrismaChatSession } from '@prisma/client';


const router = express.Router();
const langchainGeminiService = new LangchainGeminiService();

// Create a new chat session for agent activation
router.post('/create-session', async (req, res) => {
  try {
    const { customerId, customerName, paymentIssue } = req.body;

    if (!customerId || !customerName) {
      return res.status(400).json({ error: 'Customer ID and name are required' });
    }

    // Busca dados completos do cliente do banco
    const dbCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        riskFactors: true,
        chatSessions: true,
        paymentTransactions: true
      }
    });

    if (!dbCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Converte para formato do AI service
    const enhancedCustomerData = {
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
      currentPaymentStatus: 'PENDING' // Default status since paymentStatus doesn't exist yet
    };

    console.log('--- Dados do Cliente para IA ---');
    console.log(JSON.stringify(enhancedCustomerData, null, 2));
    console.log('----------------------------------');

    // Cria sessão no banco
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

    // 1. GERA E SALVA MENSAGEM INICIAL
    const initialMessage = await langchainGeminiService.generateInitialMessage(chatSession, enhancedCustomerData);

    await prisma.chatMessage.create({
      data: {
        chatSessionId: dbChatSession.id,
        sender: 'AI',
        content: initialMessage.content,
        messageType: 'TEXT'
      }
    });

    // 2. GERA E SALVA INVOICE CARD (AUTOMATICAMENTE)
    const invoiceCardMessage = langchainGeminiService.generateInvoiceCardMessage(chatSession, enhancedCustomerData);

    await prisma.chatMessage.create({
      data: {
        chatSessionId: dbChatSession.id,
        sender: 'AI',
        content: invoiceCardMessage.content,
        messageType: 'TEXT'
      }
    });

    console.log('✅ Mensagens salvas no banco:');
    console.log('1. Inicial:', initialMessage.content);
    console.log('2. Invoice Card:', invoiceCardMessage.content);

    // 3. EMITE PARA CLIENTES VIA SOCKET
    const io = req.app.get('io');
    
    // Emite mensagem inicial
    io.to(dbChatSession.id).emit('chat-initiated', {
      sessionId: dbChatSession.id,
      customerName,
      initialMessage
    });

    // Emite invoice card após delay pequeno
    setTimeout(() => {
      console.log('🃏 Enviando invoice card via Socket.IO...');
      io.to(dbChatSession.id).emit('receive-message', invoiceCardMessage);
    }, 1000);

    return res.json({
      sessionId: dbChatSession.id,
      chatSession,
      initialMessage,
      invoiceCardMessage, // Retorna também para debug
      customerData: enhancedCustomerData
    });

  } catch (error) {
    console.error('Error creating chat session:', error);
    return res.status(500).json({ error: 'Failed to create chat session' });
  }
});

// NOVO ENDPOINT: Trigger manual para invoice card (para testes)
router.post('/send-invoice-card/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Busca dados da sessão
    const dbSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        customer: true
      }
    });

    if (!dbSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Converte dados do cliente
    const customerData = {
      id: dbSession.customer.id,
      name: dbSession.customer.name,
      email: dbSession.customer.email,
      phone: dbSession.customer.phone,
      serviceProvider: dbSession.customer.serviceProvider,
      serviceType: dbSession.customer.serviceType,
      accountValue: Number(dbSession.customer.accountValue),
      riskCategory: dbSession.customer.riskCategory.toLowerCase().replace('_', '-'),
      lastPaymentDate: dbSession.customer.lastPaymentDate?.toISOString() || '',
      nextBillingDate: dbSession.customer.nextBillingDate.toISOString(),
    };

    // Cria objeto de sessão temporário
    const tempSession = {
      id: sessionId,
      customerName: dbSession.customerName
    };

    // Gera invoice card
    const invoiceCardMessage = langchainGeminiService.generateInvoiceCardMessage(tempSession, customerData);

    // Salva no banco
    await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        sender: 'AI',
        content: invoiceCardMessage.content,
        messageType: 'TEXT'
      }
    });

    // Emite via Socket.IO
    const io = req.app.get('io');
    io.to(sessionId).emit('receive-message', invoiceCardMessage);

    console.log('✅ Invoice card enviado manualmente para sessão:', sessionId);

    return res.json({
      success: true,
      message: 'Invoice card sent',
      invoiceCard: invoiceCardMessage
    });

  } catch (error) {
    console.error('Error sending invoice card:', error);
    return res.status(500).json({ error: 'Failed to send invoice card' });
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

    const sessions = dbSessions.map((session: PrismaChatSession & { messages: PrismaChatMessage[] }) => ({
      id: session.id,
      customerId: session.customerId,
      customerName: session.customerName,
      status: session.status.toLowerCase(),
      startTime: session.startTime,
      endTime: session.endTime,
      paymentIssue: session.paymentIssue,
      messages: session.messages.map((msg: PrismaChatMessage) => ({
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
      messages: dbSession.messages.map((msg: PrismaChatMessage) => ({
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

interface MessagePayload {
  chatSessionId: string;
  sender: 'CUSTOMER' | 'AI' | 'SYSTEM';
  content: string;
  timestamp: string;
  messageType: 'TEXT' | 'AUDIO' | 'SYSTEM' | 'PAYMENT_LINK' | 'DOCUMENT';
}

router.post('/ai-response', async (req, res) => {
  try {
    const { session, message, history }: { session: { id: string }, message: MessagePayload, history: MessagePayload[] } = req.body;

    // Basic validation
    if (!session || !session.id || !message || !message.content) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Store user message in database
    await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: 'CUSTOMER',
        content: message.content,
        messageType: 'TEXT'
      }
    });

    // Create a ChatMessage instance from the received message data
    const userMessage = new ChatMessage({
      chatSessionId: session.id,
      sender: message.sender as any,
      content: message.content,
      timestamp: new Date(message.timestamp),
      messageType: message.messageType as any,
    });

    // Reconstruct history messages as ChatMessage instances
    const chatHistory: ChatMessage[] = history ? history.map((msg: MessagePayload) => new ChatMessage({
      chatSessionId: msg.chatSessionId,
      sender: msg.sender as any,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      messageType: msg.messageType as any,
    })) : [];

    const aiResponse = await langchainGeminiService.generateResponse(chatHistory, userMessage);

    // Store AI response in database
    await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        sender: 'AI',
        content: aiResponse.content,
        messageType: 'TEXT'
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
        sender: sender.toUpperCase() === 'CUSTOMER' ? 'CUSTOMER' : 'AI',
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
      const chatHistory = dbSession.messages.map((msg: { chatSessionId: string; sender: string; content: string; timestamp: Date; messageType: string; }) => new ChatMessage({
        chatSessionId: msg.chatSessionId,
        sender: msg.sender.toLowerCase() as any,
        content: msg.content,
        timestamp: msg.timestamp,
        messageType: msg.messageType.toLowerCase() as any
      }));

      const aiResponse = await langchainGeminiService.generateResponse(chatHistory, message);

      // Check if the AI response contains the payment link to set the correct message type
      const messageType = aiResponse.content.includes('/api/payments/simulate-chat-payment')
        ? 'PAYMENT_LINK'
        : 'TEXT';

      // Store AI response in database
      await prisma.chatMessage.create({
        data: {
          chatSessionId: sessionId,
          sender: 'AI',
          content: aiResponse.content,
          messageType: messageType as 'TEXT' | 'PAYMENT_LINK',
        }
      });
      
      // Also update the messageType in the object being sent to the client
      (aiResponse as any).messageType = messageType;

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

// Handle payment confirmation and generate AI follow-up message
router.post('/payment-confirmed', async (req, res) => {
  try {
    const { sessionId, customerId, amount } = req.body;

    if (!sessionId || !customerId) {
      return res.status(400).json({ error: 'Session ID and Customer ID are required' });
    }

    // Get chat session and its history
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

    // Convert database messages to ChatMessage instances for AI service
    const chatHistory = dbSession.messages.map((msg: { chatSessionId: string; sender: string; content: string; timestamp: Date; messageType: string; }) => new ChatMessage({
      chatSessionId: msg.chatSessionId,
      sender: msg.sender.toLowerCase() as any,
      content: msg.content,
      timestamp: msg.timestamp,
      messageType: msg.messageType.toLowerCase() as any
    }));

    // Create a system message about payment confirmation
    const paymentConfirmationMessage = new ChatMessage({
      chatSessionId: sessionId,
      sender: 'SYSTEM' as any,
      content: `PAYMENT_CONFIRMED: Customer payment of R$ ${amount} was successfully processed. Please confirm the payment to the customer, thank them, and say goodbye to complete the interaction.`,
      timestamp: new Date(),
      messageType: 'SYSTEM' as any
    });

    console.log('=== Payment Confirmation Debug ===');
    console.log('Session ID:', sessionId);
    console.log('Payment Amount:', amount);
    console.log('Chat History Length:', chatHistory.length);
    console.log('Payment Confirmation Message:', paymentConfirmationMessage.content);
    console.log('===================================');

    // Generate AI response for payment confirmation
    const aiResponse = await langchainGeminiService.generateResponse(chatHistory, paymentConfirmationMessage);

    console.log('AI Response Generated:', aiResponse.content);
    console.log('===================================');

    // Store AI response in database
    await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        sender: 'AI',
        content: aiResponse.content,
        messageType: 'TEXT'
      }
    });

    // Emit the AI response via Socket.io
    const io = req.app.get('io');
    io.to(sessionId).emit('receive-message', aiResponse);

    return res.json({ success: true, aiResponse });
  } catch (error) {
    console.error('Error handling payment confirmation:', error);
    return res.status(500).json({ error: 'Failed to handle payment confirmation' });
  }
});

export default router;
