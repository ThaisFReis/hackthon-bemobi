export type AccountStatus = 'active' | 'at-risk' | 'resolved' | 'churned';
export type RiskCategory = 'expiring-card' | 'failed-payment' | 'multiple-failures' | null;
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

interface PaymentMethod {
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

interface InterventionRecord {
  date: string;
  outcome: string;
  notes?: string;
}

interface CustomerData {
  id?: string | null;
  name?: string;
  email?: string;
  phone?: string | null;
  accountStatus?: AccountStatus;
  riskCategory?: RiskCategory;
  riskSeverity?: RiskSeverity;
  lastPaymentDate?: string | null;
  accountValue?: number;
  customerSince?: string | null;
  lastModified?: string;
  serviceProvider?: string;
  serviceType?: string;
  billingCycle?: string;
  nextBillingDate?: string;
  paymentMethod?: PaymentMethod;
  riskFactors?: string[];
  interventionHistory?: InterventionRecord[];
}

class Customer {
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

  constructor(data: CustomerData = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.email = data.email || '';
    this.phone = data.phone || null;
    this.accountStatus = data.accountStatus || 'active';
    this.riskCategory = data.riskCategory || null;
    this.riskSeverity = data.riskSeverity || 'low';
    this.lastPaymentDate = data.lastPaymentDate || null;
    this.accountValue = data.accountValue || 0;
    this.customerSince = data.customerSince || null;
    this.lastModified = data.lastModified || new Date().toISOString();
    this.serviceProvider = data.serviceProvider || '';
    this.serviceType = data.serviceType || '';
    this.billingCycle = data.billingCycle || 'monthly';
    this.nextBillingDate = data.nextBillingDate || null;
    this.paymentMethod = data.paymentMethod || null;
    this.riskFactors = data.riskFactors || [];
    this.interventionHistory = data.interventionHistory || [];
  }

  static ACCOUNT_STATUSES: AccountStatus[] = ['active', 'at-risk', 'resolved', 'churned'];
  static RISK_CATEGORIES: Exclude<RiskCategory, null>[] = ['expiring-card', 'failed-payment', 'multiple-failures'];
  static RISK_SEVERITIES: RiskSeverity[] = ['low', 'medium', 'high', 'critical'];

  static STATE_TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
    'active': ['at-risk'],
    'at-risk': ['resolved', 'churned'],
    'resolved': ['at-risk'],
    'churned': []
  };

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.id) {
      errors.push('Customer ID is required');
    }

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Customer name is required');
    }

    if (!this.email || this.email.trim().length === 0) {
      errors.push('Email address is required');
    }

    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Email address must be valid format');
    }

    if (!Customer.ACCOUNT_STATUSES.includes(this.accountStatus)) {
      errors.push(`Account status must be one of: ${Customer.ACCOUNT_STATUSES.join(', ')}`);
    }

    if (this.accountStatus === 'at-risk') {
      if (!this.riskCategory) {
        errors.push('Risk category is required for at-risk customers');
      } else if (!Customer.RISK_CATEGORIES.includes(this.riskCategory)) {
        errors.push(`Risk category must be one of: ${Customer.RISK_CATEGORIES.join(', ')}`);
      }
    }

    if (!Customer.RISK_SEVERITIES.includes(this.riskSeverity)) {
      errors.push(`Risk severity must be one of: ${Customer.RISK_SEVERITIES.join(', ')}`);
    }

    if (typeof this.accountValue !== 'number' || this.accountValue < 0) {
      errors.push('Account value must be a positive number');
    }

    if (this.lastPaymentDate && !this.isValidDate(this.lastPaymentDate)) {
      errors.push('Last payment date must be valid date format');
    }

    if (this.customerSince && !this.isValidDate(this.customerSince)) {
      errors.push('Customer since date must be valid date format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  canTransitionTo(newStatus: AccountStatus): boolean {
    const allowedTransitions = Customer.STATE_TRANSITIONS[this.accountStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  transitionTo(newStatus: AccountStatus, reason: string | null = null): { success: boolean; error?: string; previousStatus?: AccountStatus; newStatus?: AccountStatus; reason?: string | null; timestamp?: string; } {
    if (!this.canTransitionTo(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${this.accountStatus} to ${newStatus}. Valid transitions: ${Customer.STATE_TRANSITIONS[this.accountStatus].join(', ')}`
      };
    }

    const previousStatus = this.accountStatus;
    this.accountStatus = newStatus;
    this.lastModified = new Date().toISOString();

    if (newStatus === 'resolved' || newStatus === 'churned') {
      this.riskCategory = null;
      this.riskSeverity = 'low';
    }

    return {
      success: true,
      previousStatus,
      newStatus,
      reason,
      timestamp: this.lastModified
    };
  }

  requiresIntervention(): boolean {
    return this.accountStatus === 'at-risk' && this.riskCategory !== null;
  }

  calculateRiskScore(): number {
    if (this.accountStatus !== 'at-risk') {
      return 0;
    }

    let baseScore = 0;

    switch (this.riskCategory) {
      case 'multiple-failures':
        baseScore = 85;
        break;
      case 'failed-payment':
        baseScore = 70;
        break;
      case 'expiring-card':
        baseScore = 40;
        break;
      default:
        baseScore = 20;
    }

    const severityMultiplier: Record<RiskSeverity, number> = {
      'low': 0.7,
      'medium': 1.0,
      'high': 1.4,
      'critical': 1.8
    };

    // Enhanced value calculation (values are in cents in the JSON)
    const valueBonus = Math.min(this.accountValue / 10000, 25); // Scale for larger values

    // Payment method failure bonus
    const failureBonus = this.paymentMethod ? Math.min(this.paymentMethod.failureCount * 5, 15) : 0;

    // Risk factors bonus
    const riskFactorBonus = Math.min(this.riskFactors.length * 2, 10);

    const finalScore = Math.min(100, baseScore * (severityMultiplier[this.riskSeverity] || 1.0) + valueBonus + failureBonus + riskFactorBonus);
    return Math.round(finalScore);
  }

  getStatusDescription(): string {
    const descriptions: Record<AccountStatus, string> = {
      'active': 'Active account with no issues',
      'at-risk': `At risk - ${this.riskCategory ? this.riskCategory.replace('-', ' ') : 'unknown issue'}`,
      'resolved': 'Issue resolved successfully',
      'churned': 'Customer has churned'
    };

    return descriptions[this.accountStatus] || 'Unknown status';
  }

  toJSON(): object {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      accountStatus: this.accountStatus,
      riskCategory: this.riskCategory,
      riskSeverity: this.riskSeverity,
      lastPaymentDate: this.lastPaymentDate,
      accountValue: this.accountValue,
      customerSince: this.customerSince,
      lastModified: this.lastModified,
      serviceProvider: this.serviceProvider,
      serviceType: this.serviceType,
      billingCycle: this.billingCycle,
      nextBillingDate: this.nextBillingDate,
      paymentMethod: this.paymentMethod,
      riskFactors: this.riskFactors,
      interventionHistory: this.interventionHistory,
      riskScore: this.calculateRiskScore(),
      statusDescription: this.getStatusDescription(),
      requiresIntervention: this.requiresIntervention()
    };
  }

  static fromJSON(json: CustomerData): Customer {
    return new Customer(json);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static createAtRiskCustomer(basicInfo: { name: string; email: string; riskCategory: RiskCategory; accountValue?: number; riskSeverity?: RiskSeverity; customerSince?: string; lastPaymentDate?: string; }): Customer {
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Customer({
      id: customerId,
      name: basicInfo.name,
      email: basicInfo.email,
      accountStatus: 'at-risk',
      riskCategory: basicInfo.riskCategory,
      riskSeverity: basicInfo.riskSeverity || 'medium',
      accountValue: basicInfo.accountValue || 0,
      customerSince: basicInfo.customerSince || new Date().toISOString(),
      lastPaymentDate: basicInfo.lastPaymentDate
    });
  }

  static findHighRiskCustomers(customers: Customer[]): Customer[] {
    return customers
      .filter(customer => customer.requiresIntervention())
      .sort((a, b) => b.calculateRiskScore() - a.calculateRiskScore());
  }
}

export default Customer;