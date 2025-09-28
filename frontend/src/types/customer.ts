export type AccountStatus = 'active' | 'at-risk' | 'resolved' | 'churned';
export type RiskCategory = 'failed-payment' | 'multiple-failures' | 'payment-failed' | null;
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PaymentMethod {
  id: string;
  cardType: string;
  lastFourDigits: string;
  expiryMonth: number;
  expiryYear: number;
  status: string;
  failureCount: number;
  lastFailureDate?: string;
  lastSuccessDate?: string;
}

export interface InterventionRecord {
  date: string;
  outcome: string;
  notes?: string;
}

export interface Customer {
  id: string | null;
  name: string;
  email: string;
  phone: string | null;
  accountStatus: AccountStatus;
  riskCategory: RiskCategory;
  riskSeverity: RiskSeverity;
  lastPaymentDate: string | null;
  accountValue: number;
  customerSince: string | null;
  lastModified: string;
  serviceProvider: string;
  serviceType: string;
  billingCycle: string;
  nextBillingDate: string | null;
  paymentMethod: PaymentMethod | null;
  riskFactors: string[];
  interventionHistory: InterventionRecord[];
}
