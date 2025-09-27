import Customer from '../models/customer';
import { AIChatService } from './aiChatService';
import { TemplateService } from './templateService';
import ChatSession from '../models/chatSession';
import { v4 as uuidv4 } from 'uuid';

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
  private processingTimer: NodeJS.Timer | null = null;
  private aiChatService: AIChatService;
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

  constructor(aiChatService: AIChatService) {
    this.aiChatService = aiChatService;
    this.templateService = new TemplateService();
  }

  // Calculate enhanced priority score for a customer using TemplateService
  private calculatePriorityScore(customer: Customer): { priority: number; urgencyScore: number } {
    // Use the template service's enhanced priority calculation
    const priority = this.templateService.calculatePriority(customer);

    // Calculate urgency score for queue ordering
    const urgencyScore = customer.calculateRiskScore();

    return { priority, urgencyScore };
  }

  // Add customer to queue or update existing entry
  public addCustomerToQueue(customer: Customer): void {
    const existingIndex = this.queue.findIndex(qc => qc.customer.id === customer.id);
    const { priority, urgencyScore } = this.calculatePriorityScore(customer);

    if (existingIndex >= 0) {
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
    if (!this.templateService.shouldTriggerIntervention(queuedCustomer.customer)) {
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
      const lastInterventionDate = new Date(lastIntervention.date);
      const hoursSinceLastIntervention = (now.getTime() - lastInterventionDate.getTime()) / (1000 * 60 * 60);

      // Don't contact again within 24 hours if last intervention failed
      if (lastIntervention.outcome === 'failed' || lastIntervention.outcome === 'no_answer') {
        if (hoursSinceLastIntervention < 24) {
          return false;
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

    // Determine payment issue based on risk category
    let paymentIssue = 'payment-failure';
    if (customer.riskCategory === 'expiring-card') {
      paymentIssue = 'card-expiring-soon';
    } else if (customer.riskCategory === 'multiple-failures') {
      paymentIssue = 'multiple-payment-failures';
    }

    // Create chat session
    const chatSession = new ChatSession({
      id: sessionId,
      customerId: customer.id!,
      customerName: customer.name,
      status: 'active',
      startTime: new Date(),
      paymentIssue
    });

    // Store customer data for AI access
    (chatSession as any).customerData = customer;

    // Generate initial AI message using template service
    const initialMessage = await this.aiChatService.generateInitialMessage(chatSession, customer);

    // Store initial message in session
    if (!chatSession.messages) {
      chatSession.messages = [];
    }
    chatSession.messages.push(initialMessage);

    // Add to active sessions
    this.activeSessions.set(sessionId, chatSession);

    // Update queue entry
    queuedCustomer.lastContactedAt = new Date();
    queuedCustomer.contactAttempts++;

    console.log(`Autonomous contact initiated: ${customer.name} (${customer.id}) - Priority: ${queuedCustomer.priority} - Provider: ${customer.serviceProvider}`);

    // Emit event for real-time updates (will be connected to Socket.io)
    this.emitQueueEvent('contact-initiated', {
      sessionId,
      customer,
      queuedCustomer,
      initialMessage
    });
  }

  // Refresh queue with latest customer data
  public async refreshQueue(customers: Customer[]): Promise<void> {
    // Remove customers who are no longer at-risk
    this.queue = this.queue.filter(qc => {
      const updated = customers.find(c => c.id === qc.customer.id);
      return updated && updated.requiresIntervention();
    });

    // Add or update customers who need intervention
    customers
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
}