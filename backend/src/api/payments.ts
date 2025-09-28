import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Simulate a successful payment from a chat link
router.post('/simulate-chat-payment', async (req, res) => {
  try {
    const { customerId, sessionId, amount } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    console.log(`Simulating chat payment for customer ${customerId}`);

    // Use a mock amount or a default one if not provided
    const paymentAmount = amount || 50.0;

    // Check if customer exists, if not create a mock one
    let customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          id: customerId,
          name: 'Mock Customer',
          email: `customer-${customerId}@example.com`,
          phone: '+5511999999999',
          serviceProvider: 'Mock Provider',
          serviceType: 'Mock Service',
          accountValue: paymentAmount,
          riskCategory: 'PAYMENT_FAILED',
          riskSeverity: 'HIGH',
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          customerSince: new Date(),
        }
      });
    }

    // Create or find chat session
    let chatSession;
    if (sessionId) {
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId }
      });

      if (!chatSession) {
        chatSession = await prisma.chatSession.create({
          data: {
            id: sessionId,
            customerId,
            customerName: customer.name,
            status: 'ACTIVE',
            paymentIssue: 'Payment failed - simulating recovery',
          }
        });
      }
    }

    // Check if payment transaction already exists for this chat session
    let paymentTransaction;
    if (chatSession) {
      paymentTransaction = await prisma.paymentTransaction.findUnique({
        where: { chatSessionId: chatSession.id }
      });

      if (paymentTransaction) {
        // Update existing payment transaction
        paymentTransaction = await prisma.paymentTransaction.update({
          where: { chatSessionId: chatSession.id },
          data: {
            amount: paymentAmount,
            status: 'COMPLETED',
            paidDate: new Date(),
            description: 'Simulated payment via chat link (updated)',
          },
        });
      } else {
        // Create new payment transaction
        paymentTransaction = await prisma.paymentTransaction.create({
          data: {
            customerId,
            amount: paymentAmount,
            status: 'COMPLETED',
            paidDate: new Date(),
            description: 'Simulated payment via chat link',
            chatSessionId: chatSession.id,
          },
        });
      }
    } else {
      // Create payment transaction without chat session
      paymentTransaction = await prisma.paymentTransaction.create({
        data: {
          customerId,
          amount: paymentAmount,
          status: 'COMPLETED',
          paidDate: new Date(),
          description: 'Simulated payment via chat link',
          chatSessionId: null,
        },
      });
    }

    // Update the chat session status if it exists
    if (chatSession) {
      await prisma.chatSession.update({
        where: { id: chatSession.id },
        data: {
          status: 'COMPLETED',
          outcome: 'Payment successful',
          endTime: new Date(),
        },
      });
    }

    // Trigger AI to send payment confirmation message
    if (chatSession) {
      try {
        // Call the chat API to generate AI follow-up message
        const response = await fetch('https://hackthon-bemobi-1.onrender.com1/api/chat/payment-confirmed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: chatSession.id,
            customerId,
            amount: paymentAmount,
            paymentId: paymentTransaction.id
          }),
        });

        if (!response.ok) {
          console.error('Failed to trigger AI payment confirmation message');
        }
      } catch (error) {
        console.error('Error triggering AI payment confirmation:', error);
      }
    }

    return res.json({
      success: true,
      message: 'Payment simulated successfully',
      paymentTransaction,
    });

  } catch (error) {
    console.error('Error simulating chat payment:', error);
    return res.status(500).json({ error: 'Failed to simulate payment' });
  }
});

export default router;