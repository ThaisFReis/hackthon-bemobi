import ChatMessage from './chatMessage';

export type ChatSessionStatus =
  | 'initiated'
  | 'active'
  | 'in-progress'
  | 'payment-requested'
  | 'payment-processing'
  | 'completed'
  | 'abandoned';
export type ChatSessionOutcome =
  | 'payment-updated'
  | 'customer-declined'
  | 'technical-failure'
  | 'abandoned'
  | null;

interface ChatSessionData {
  id?: string;
  customerId: string;
  customerName?: string;
  adminUserId?: string;
  status?: ChatSessionStatus;
  startTime: Date;
  endTime?: Date | null;
  outcome?: ChatSessionOutcome;
  conversationHistory?: ChatMessage[];
  messages?: ChatMessage[];
  paymentAttempted?: boolean;
  resolutionTime?: number | null;
  paymentIssue?: string;
}

class ChatSession {
  id: string;
  customerId: string;
  customerName: string;
  adminUserId: string;
  status: ChatSessionStatus;
  startTime: Date;
  endTime: Date | null;
  outcome: ChatSessionOutcome;
  conversationHistory: ChatMessage[];
  messages: ChatMessage[];
  paymentAttempted: boolean;
  resolutionTime: number | null;
  paymentIssue: string;

  constructor({
    id = `sess_${Date.now()}`,
    customerId,
    customerName = '',
    adminUserId = 'default-admin',
    status = 'initiated',
    startTime,
    endTime,
    outcome,
    conversationHistory = [],
    messages = [],
    paymentAttempted = false,
    resolutionTime,
    paymentIssue = '',
  }: ChatSessionData) {
    if (!customerId || !startTime) {
      throw new Error('customerId and startTime are required for a chat session.');
    }

    this.id = id;
    this.customerId = customerId;
    this.customerName = customerName;
    this.adminUserId = adminUserId;
    this.status = status;
    this.startTime = startTime;
    this.endTime = endTime || null;
    this.outcome = outcome || null;
    this.conversationHistory = conversationHistory;
    this.messages = messages;
    this.paymentAttempted = paymentAttempted;
    this.resolutionTime = resolutionTime || null;
    this.paymentIssue = paymentIssue;

    this.validate();
  }

  validate() {
    if (this.endTime && this.endTime < this.startTime) {
      throw new Error('endTime cannot be before startTime.');
    }
    if (this.resolutionTime && this.resolutionTime < 0) {
      throw new Error('resolutionTime cannot be negative.');
    }
    if (this.resolutionTime && this.resolutionTime > 180) {
      throw new Error('resolutionTime cannot exceed 180 seconds.');
    }
  }
}

export default ChatSession;
