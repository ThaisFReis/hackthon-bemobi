import Customer from '../models/customer';
import { LangchainGeminiService } from './langchainGeminiService';
import { TemplateService } from './templateService';
import ChatSession from '../models/chatSession';
import ChatMessage from '../models/chatMessage';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// CustomerData interface matching LangchainGeminiService
interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceProvider: string;
  serviceType: string;
  accountValue: number;
  paymentMethod: {
    id: string;
    cardType: string;
    lastFourDigits: string;
    expiryMonth: number;
    expiryYear: number;
    status: string;
    failureCount: number;
    lastFailureDate?: string;
    lastSuccessDate?: string;
  };
  riskCategory: string;
  riskSeverity?: string;
  lastPaymentDate: string;
  nextBillingDate: string;
}


interface QueuedCustomer {
  customer: Customer;
  priority: number;
  urgencyScore: number;
  queuedAt: Date;
  lastContactedAt?: Date;
  contactAttempts: number;
  nextContactTime?: Date;
}

interface QueueConfig {
  enabled: boolean;
  maxConcurrentSessions: number;
  processingIntervalMs: number;
  maxContactsPerDay: number;
  quietHoursStart: number; // 22 = 10 PM
  quietHoursEnd: number;   // 8 = 8 AM
  minTimeBetweenContacts: number; // hours
}

export class QueueService {
  private queue: QueuedCustomer[] = [];
  private activeSessions = new Map<string, ChatSession>();
  private processingTimer: ReturnType<typeof setInterval> | null = null;
  private aiService: LangchainGeminiService;
  private templateService: TemplateService;
  private config: QueueConfig = {
    enabled: false,
    maxConcurrentSessions: 3,
    processingIntervalMs: 30000, // 30 seconds
    maxContactsPerDay: 1,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    minTimeBetweenContacts: 4 // 4 hours minimum between contacts
  };

  constructor(aiService: LangchainGeminiService) {
    this.aiService = aiService;
    this.templateService = new TemplateService();

    console.log(`QueueService initialized with AI service: ${aiService.constructor.name}`);
  }

  // Convert Customer to CustomerData format
  private convertCustomerToCustomerData(customer: Customer): CustomerData | null {
    if (!customer.id || !customer.paymentMethod) {
      return null;
    }

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      serviceProvider: customer.serviceProvider || '',
      serviceType: customer.serviceType || '',
      accountValue: customer.accountValue || 0,
      paymentMethod: {
        id: customer.paymentMethod.id,
        cardType: customer.paymentMethod.cardType,
        lastFourDigits: customer.paymentMethod.lastFourDigits,
        expiryMonth: customer.paymentMethod.expiryMonth,
        expiryYear: customer.paymentMethod.expiryYear,
        status: customer.paymentMethod.status,
        failureCount: customer.paymentMethod.failureCount,
        lastFailureDate: customer.paymentMethod.lastFailureDate,
        lastSuccessDate: customer.paymentMethod.lastSuccessDate,
      },
      riskCategory: customer.riskCategory || '',
      riskSeverity: customer.riskSeverity,
      lastPaymentDate: customer.lastPaymentDate || '',
      nextBillingDate: customer.nextBillingDate || '',
    };
  }

  // Calculate enhanced priority score for a customer using TemplateService
  private calculatePriorityScore(customer: Customer): { priority: number; urgencyScore: number } {
    // Convert Customer to CustomerData for template service
    const customerData = this.convertCustomerToCustomerData(customer);

    // Use the template service's enhanced priority calculation if conversion succeeds
    const priority = customerData
      ? this.templateService.calculatePriority(customerData)
      : 50; // Default priority if conversion fails

    // Calculate urgency score for queue ordering
    const urgencyScore = customer.calculateRiskScore();

    return { priority, urgencyScore };
  }

  // Add customer to queue or update existing entry
  public addCustomerToQueue(customer: Customer): void {
    const existingIndex = this.queue.findIndex(qc => qc.customer.id === customer.id);
    const { priority, urgencyScore } = this.calculatePriorityScore(customer);

    if (existingIndex >= 0 && this.queue[existingIndex]) {
      // Update existing queue entry
      this.queue[existingIndex].priority = priority;
      this.queue[existingIndex].urgencyScore = urgencyScore;
      this.queue[existingIndex].customer = customer;
    } else {
      // Add new queue entry
      const queuedCustomer: QueuedCustomer = {
        customer,
        priority,
        urgencyScore,
        queuedAt: new Date(),
        contactAttempts: 0
      };
      this.queue.push(queuedCustomer);
    }

    // Re-sort queue by priority
    this.sortQueue();
  }

  // Remove customer from queue
  public removeCustomerFromQueue(customerId: string): void {
    this.queue = this.queue.filter(qc => qc.customer.id !== customerId);
  }

  // Sort queue by priority (highest first)
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Primary sort: priority score
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }

      // Secondary sort: queue time (older first)
      return a.queuedAt.getTime() - b.queuedAt.getTime();
    });
  }

  // Check if it's appropriate time to contact customers
  private isContactingHoursActive(): boolean {
    const now = new Date();
    const hour = now.getHours();

    // Skip quiet hours
    if (hour >= this.config.quietHoursStart || hour < this.config.quietHoursEnd) {
      return false;
    }

    return true;
  }

  // Check if customer can be contacted now
  private canContactCustomer(queuedCustomer: QueuedCustomer): boolean {
    const now = new Date();

    // Check business rules first - should we trigger intervention?
    const customerData = this.convertCustomerToCustomerData(queuedCustomer.customer);
    if (!customerData || !this.templateService.shouldTriggerIntervention(customerData)) {
      return false;
    }

    // Check if customer has reached daily contact limit
    if (queuedCustomer.contactAttempts >= this.config.maxContactsPerDay) {
      return false;
    }

    // Check minimum time between contacts
    if (queuedCustomer.lastContactedAt) {
      const hoursSinceLastContact = (now.getTime() - queuedCustomer.lastContactedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastContact < this.config.minTimeBetweenContacts) {
        return false;
      }
    }

    // Check if customer is already in an active session
    const activeSession = Array.from(this.activeSessions.values())
      .find(session => session.customerId === queuedCustomer.customer.id);
    if (activeSession) {
      return false;
    }

    // Check intervention history to avoid over-contacting
    if (queuedCustomer.customer.interventionHistory && queuedCustomer.customer.interventionHistory.length > 0) {
      const lastIntervention = queuedCustomer.customer.interventionHistory[queuedCustomer.customer.interventionHistory.length - 1];
      if (lastIntervention && lastIntervention.date) {
        const lastInterventionDate = new Date(lastIntervention.date);
        const hoursSinceLastIntervention = (now.getTime() - lastInterventionDate.getTime()) / (1000 * 60 * 60);

        // Don't contact again within 24 hours if last intervention failed
        if (lastIntervention.outcome === 'failed' || lastIntervention.outcome === 'no_answer') {
          if (hoursSinceLastIntervention < 24) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // Process the queue and initiate contacts
  private async processQueue(): Promise<void> {
    if (!this.config.enabled || !this.isContactingHoursActive()) {
      return;
    }

    const currentActiveSessions = this.activeSessions.size;
    const availableSlots = this.config.maxConcurrentSessions - currentActiveSessions;

    if (availableSlots <= 0) {
      console.log('Queue processing skipped: no available session slots');
      return;
    }

    let contactsInitiated = 0;

    for (const queuedCustomer of this.queue) {
      if (contactsInitiated >= availableSlots) {
        break;
      }

      if (!this.canContactCustomer(queuedCustomer)) {
        continue;
      }

      try {
        await this.initiateContact(queuedCustomer);
        contactsInitiated++;
      } catch (error) {
        console.error(`Failed to initiate contact with customer ${queuedCustomer.customer.id}:`, error);
      }
    }

    if (contactsInitiated > 0) {
      console.log(`Queue processed: ${contactsInitiated} contacts initiated`);
    }
  }

  // Initiate contact with a customer
  private async initiateContact(queuedCustomer: QueuedCustomer): Promise<void> {
    const customer = queuedCustomer.customer;
    const sessionId = uuidv4();

    console.log(`=== Initiating Contact Debug ===`);
    console.log(`Customer: ${customer.name} (${customer.id})`);
    console.log(`AI Service: ${this.aiService.constructor.name}`);

    // Determine payment issue based on risk category
    let paymentIssue = 'payment-failure';
    if (customer.riskCategory === 'expiring-card') {
      paymentIssue = 'card-expiring-soon';
    } else if (customer.riskCategory === 'multiple-failures') {
      paymentIssue = 'multiple-payment-failures';
    }

    try {
      // Create chat session in database
      const dbChatSession = await prisma.chatSession.create({
        data: {
          id: sessionId,
          customerId: customer.id!,
          customerName: customer.name,
          status: 'ACTIVE',
          paymentIssue
        }
      });

      // Create chat session model for compatibility
      const chatSession = new ChatSession({
        id: sessionId,
        customerId: customer.id!,
        customerName: customer.name,
        status: 'active',
        startTime: dbChatSession.startTime,
        paymentIssue
      });

      // Store customer data for AI access
      (chatSession as any).customerData = customer;

      try {
        // Generate initial AI message using the AI service
        console.log('Generating initial message...');
        const customerData = this.convertCustomerToCustomerData(customer);
        const initialMessage = await this.aiService.generateInitialMessage(chatSession, customerData);
        console.log('Initial message generated:', initialMessage.content);

        // Store initial message in database
        await prisma.chatMessage.create({
          data: {
            chatSessionId: sessionId,
            sender: 'AI',
            content: initialMessage.content,
            messageType: 'TEXT'
          }
        });

        // Store initial message in session for compatibility
        if (!chatSession.messages) {
          chatSession.messages = [];
        }
        chatSession.messages.push(initialMessage);

        // Add to active sessions
        this.activeSessions.set(sessionId, chatSession);

        // Update queue entry
        queuedCustomer.lastContactedAt = new Date();
        queuedCustomer.contactAttempts++;

        // Create intervention record
        await prisma.intervention.create({
          data: {
            customerId: customer.id!,
            outcome: 'SCHEDULED',
            notes: `Autonomous contact initiated via queue service. Initial message: ${initialMessage.content.substring(0, 100)}...`,
            agentId: 'ai_queue_service'
          }
        });

        console.log(`Autonomous contact initiated: ${customer.name} (${customer.id}) - Priority: ${queuedCustomer.priority} - Provider: ${customer.serviceProvider}`);

        // Emit event for real-time updates (will be connected to Socket.io)
        this.emitQueueEvent('contact-initiated', {
          sessionId,
          customer,
          queuedCustomer,
          initialMessage
        });

      } catch (error) {
        console.error(`Error generating initial message for customer ${customer.id}:`, error);

        // Create fallback message if AI fails
        const fallbackContent = `Olá ${customer.name}! Aqui é da ${customer.serviceProvider}. Tivemos um problema com seu pagamento. Vamos resolver juntos?`;

        // Store fallback message in database
        await prisma.chatMessage.create({
          data: {
            chatSessionId: sessionId,
            sender: 'AI',
            content: fallbackContent,
            messageType: 'TEXT'
          }
        });

        const fallbackMessage = new ChatMessage({
          chatSessionId: sessionId,
          sender: 'ai',
          content: fallbackContent,
          timestamp: new Date(),
          messageType: 'greeting',
        });

        if (!chatSession.messages) {
          chatSession.messages = [];
        }
        chatSession.messages.push(fallbackMessage);
        this.activeSessions.set(sessionId, chatSession);

        queuedCustomer.lastContactedAt = new Date();
        queuedCustomer.contactAttempts++;

        // Create intervention record for fallback
        await prisma.intervention.create({
          data: {
            customerId: customer.id!,
            outcome: 'SCHEDULED',
            notes: `Autonomous contact initiated with fallback message due to AI error: ${error}`,
            agentId: 'ai_queue_service_fallback'
          }
        });

        this.emitQueueEvent('contact-initiated', {
          sessionId,
          customer,
          queuedCustomer,
          initialMessage: fallbackMessage
        });
      }
    } catch (dbError) {
      console.error(`Database error during contact initiation for customer ${customer.id}:`, dbError);
      throw dbError;
    }
  }

  // Refresh queue with latest customer data from database
  public async refreshQueue(customers?: Customer[]): Promise<void> {
    let customersToProcess: Customer[] = [];

    if (customers) {
      // Use provided customers (backward compatibility)
      customersToProcess = customers;
    } else {
      // Fetch customers from database
      try {
        const dbCustomers = await prisma.customer.findMany({
          where: {
            accountStatus: 'AT_RISK'
          },
          include: {
            paymentMethods: true,
            riskFactors: true,
            interventions: {
              orderBy: {
                date: 'desc'
              }
            },
            paymentStatus: true
          }
        });

        // Convert database customers to Customer model instances
        customersToProcess = dbCustomers.map(dbCustomer => new Customer({
          id: dbCustomer.id,
          name: dbCustomer.name,
          email: dbCustomer.email,
          phone: dbCustomer.phone,
          accountStatus: dbCustomer.accountStatus.toLowerCase().replace('_', '-') as any,
          riskCategory: dbCustomer.riskCategory.toLowerCase().replace('_', '-') as any,
          riskSeverity: dbCustomer.riskSeverity.toLowerCase() as any,
          lastPaymentDate: dbCustomer.lastPaymentDate?.toISOString(),
          accountValue: Number(dbCustomer.accountValue),
          customerSince: dbCustomer.customerSince.toISOString(),
          serviceProvider: dbCustomer.serviceProvider,
          serviceType: dbCustomer.serviceType,
          billingCycle: dbCustomer.billingCycle.toLowerCase(),
          nextBillingDate: dbCustomer.nextBillingDate.toISOString(),
          paymentMethod: dbCustomer.paymentMethods?.[0] ? {
            id: dbCustomer.paymentMethods[0].id,
            cardType: dbCustomer.paymentMethods[0].cardType?.toLowerCase() || '',
            lastFourDigits: '****', // Don't expose real data
            expiryMonth: 0,
            expiryYear: 0,
            status: dbCustomer.paymentMethods[0].status.toLowerCase(),
            failureCount: dbCustomer.paymentMethods[0].failureCount,
            lastFailureDate: dbCustomer.paymentMethods[0].lastFailureDate?.toISOString(),
            lastSuccessDate: dbCustomer.paymentMethods[0].lastSuccessDate?.toISOString()
          } : undefined,
          riskFactors: dbCustomer.riskFactors?.map(rf => rf.factor) || [],
          interventionHistory: dbCustomer.interventions?.map(intervention => ({
            date: intervention.date.toISOString(),
            outcome: intervention.outcome.toLowerCase(),
            notes: intervention.notes || ''
          })) || []
        }));

        console.log(`Fetched ${customersToProcess.length} at-risk customers from database`);
      } catch (error) {
        console.error('Error fetching customers from database:', error);
        return;
      }
    }

    // Remove customers who are no longer at-risk
    this.queue = this.queue.filter(qc => {
      const updated = customersToProcess.find(c => c.id === qc.customer.id);
      return updated && updated.requiresIntervention();
    });

    // Add or update customers who need intervention
    customersToProcess
      .filter(customer => customer.requiresIntervention())
      .forEach(customer => this.addCustomerToQueue(customer));
  }

  // Start autonomous queue processing
  public startAutonomousMode(): void {
    if (this.processingTimer) {
      this.stopAutonomousMode();
    }

    this.config.enabled = true;
    this.processingTimer = setInterval(() => {
      this.processQueue().catch(error => {
        console.error('Queue processing error:', error);
      });
    }, this.config.processingIntervalMs);

    console.log('Autonomous queue processing started');
    this.emitQueueEvent('autonomous-mode-started', { config: this.config });
  }

  // Stop autonomous queue processing
  public stopAutonomousMode(): void {
    this.config.enabled = false;

    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }

    console.log('Autonomous queue processing stopped');
    this.emitQueueEvent('autonomous-mode-stopped', {});
  }

  // Update configuration
  public updateConfig(newConfig: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Queue configuration updated:', this.config);
    this.emitQueueEvent('config-updated', { config: this.config });
  }

  // Get current queue status
  public getQueueStatus() {
    return {
      queue: this.queue.map(qc => ({
        customerId: qc.customer.id,
        customerName: qc.customer.name,
        priority: qc.priority,
        urgencyScore: qc.urgencyScore,
        queuedAt: qc.queuedAt,
        lastContactedAt: qc.lastContactedAt,
        contactAttempts: qc.contactAttempts,
        riskCategory: qc.customer.riskCategory,
        accountValue: qc.customer.accountValue
      })),
      activeSessions: Array.from(this.activeSessions.values()).map(session => ({
        sessionId: session.id,
        customerId: session.customerId,
        customerName: session.customerName,
        startTime: session.startTime,
        status: session.status
      })),
      config: this.config,
      stats: {
        queueLength: this.queue.length,
        activeSessionsCount: this.activeSessions.size,
        availableSlots: this.config.maxConcurrentSessions - this.activeSessions.size,
        isProcessingActive: this.config.enabled && this.isContactingHoursActive()
      }
    };
  }

  // Remove completed session
  public removeActiveSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  // Event emitter placeholder (will be connected to Socket.io)
  private emitQueueEvent(event: string, data: any): void {
    // This will be connected to Socket.io in the main server
    console.log(`Queue event: ${event}`, data);
  }

  // Set event emitter (to be called from server)
  public setEventEmitter(emitter: (event: string, data: any) => void): void {
    this.emitQueueEvent = emitter;
  }

  // Get the current AI service being used (for debugging)
  public getAIServiceInfo(): string {
    return this.aiService.constructor.name;
  }
}