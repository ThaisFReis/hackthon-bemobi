export interface QueuedCustomer {
  customerId: string;
  customerName: string;
  priority: number;
  urgencyScore: number;
  queuedAt: string;
  lastContactedAt?: string;
  contactAttempts: number;
  riskCategory: string;
  accountValue: number;
}

export interface ActiveSession {
  sessionId: string;
  customerId: string;
  customerName: string;
  startTime: string;
  status: string;
}

export interface QueueStats {
  queueLength: number;
  activeSessionsCount: number;
  availableSlots: number;
  isProcessingActive: boolean;
}

export interface QueueConfig {
  enabled: boolean;
  maxConcurrentSessions: number;
  processingIntervalMs: number;
  maxContactsPerDay: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  minTimeBetweenContacts: number;
}

export interface QueueStatus {
  queue: QueuedCustomer[];
  activeSessions: ActiveSession[];
  config: QueueConfig;
  stats: QueueStats;
}
