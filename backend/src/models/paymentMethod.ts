export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover';
export type PaymentMethodStatus = 'active' | 'expired' | 'failed' | 'invalid' | 'inactive';
export type FailureReason =
  | 'card_declined'
  | 'insufficient_funds'
  | 'expired_card'
  | 'invalid_cvc'
  | 'processing_error'
  | 'lost_card'
  | 'stolen_card'
  | null;

interface PaymentMethodData {
  id?: string | null;
  customerId?: string | null;
  cardType?: CardType | null;
  lastFourDigits?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  status?: PaymentMethodStatus;
  failureCount?: number;
  lastFailureDate?: string | null;
  lastSuccessDate?: string | null;
  lastFailureReason?: FailureReason;
  stripePaymentMethodId?: string | null;
  stripeCustomerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

class PaymentMethod {
  id: string | null;
  customerId: string | null;
  cardType: CardType | null;
  lastFourDigits: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  status: PaymentMethodStatus;
  failureCount: number;
  lastFailureDate: string | null;
  lastSuccessDate: string | null;
  lastFailureReason: FailureReason;
  stripePaymentMethodId: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;

  constructor(data: PaymentMethodData = {}) {
    this.id = data.id || null;
    this.customerId = data.customerId || null;
    this.cardType = data.cardType || null;
    this.lastFourDigits = data.lastFourDigits || null;
    this.expiryMonth = data.expiryMonth || null;
    this.expiryYear = data.expiryYear || null;
    this.status = data.status || 'active';
    this.failureCount = data.failureCount || 0;
    this.lastFailureDate = data.lastFailureDate || null;
    this.lastSuccessDate = data.lastSuccessDate || null;
    this.lastFailureReason = data.lastFailureReason || null;
    this.stripePaymentMethodId = data.stripePaymentMethodId || null;
    this.stripeCustomerId = data.stripeCustomerId || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static CARD_TYPES: CardType[] = ['visa', 'mastercard', 'amex', 'discover'];
  static STATUSES: PaymentMethodStatus[] = ['active', 'expired', 'failed', 'invalid', 'inactive'];
  static FAILURE_REASONS: Exclude<FailureReason, null>[] = [
    'card_declined',
    'insufficient_funds',
    'expired_card',
    'invalid_cvc',
    'processing_error',
    'lost_card',
    'stolen_card'
  ];

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.id) {
      errors.push('Payment method ID is required');
    }

    if (!this.customerId) {
      errors.push('Customer ID is required');
    }

    if (!this.cardType) {
      errors.push('Card type is required');
    } else if (!PaymentMethod.CARD_TYPES.includes(this.cardType)) {
      errors.push(`Card type must be one of: ${PaymentMethod.CARD_TYPES.join(', ')}`);
    }

    if (!this.lastFourDigits) {
      errors.push('Last four digits are required');
    } else if (!/^\d{4}$/.test(this.lastFourDigits)) {
      errors.push('Last four digits must be exactly 4 numeric characters');
    }

    if (!this.expiryMonth || !Number.isInteger(this.expiryMonth)) {
      errors.push('Expiry month is required and must be a number');
    } else if (this.expiryMonth < 1 || this.expiryMonth > 12) {
      errors.push('Expiry month must be between 1 and 12');
    }

    if (!this.expiryYear || !Number.isInteger(this.expiryYear)) {
      errors.push('Expiry year is required and must be a number');
    } else if (this.expiryYear < new Date().getFullYear()) {
      errors.push('Expiry year must be current year or future');
    }

    if (!PaymentMethod.STATUSES.includes(this.status)) {
      errors.push(`Status must be one of: ${PaymentMethod.STATUSES.join(', ')}`);
    }

    if (!Number.isInteger(this.failureCount) || this.failureCount < 0) {
      errors.push('Failure count must be a non-negative integer');
    }

    if (this.lastFailureReason && !PaymentMethod.FAILURE_REASONS.includes(this.lastFailureReason)) {
      errors.push(`Failure reason must be one of: ${PaymentMethod.FAILURE_REASONS.join(', ')}`);
    }

    if (this.lastFailureDate && !this.isValidDate(this.lastFailureDate)) {
      errors.push('Last failure date must be valid date format');
    }

    if (this.lastSuccessDate && !this.isValidDate(this.lastSuccessDate)) {
      errors.push('Last success date must be valid date format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isExpired(): boolean {
    if (!this.expiryYear || !this.expiryMonth) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (this.expiryYear < currentYear) {
      return true;
    }

    if (this.expiryYear === currentYear && this.expiryMonth < currentMonth) {
      return true;
    }

    return false;
  }

  isExpiringSoon(monthsAhead = 3): boolean {
    if (this.isExpired()) {
      return true;
    }
    if (!this.expiryYear || !this.expiryMonth) return false;

    const now = new Date();
    const futureDate = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1);
    const expiryDate = new Date(this.expiryYear, this.expiryMonth - 1, 1);

    return expiryDate <= futureDate;
  }

  recordFailure(reason: FailureReason, timestamp: string | null = null) {
    this.failureCount += 1;
    this.lastFailureDate = timestamp || new Date().toISOString();
    this.lastFailureReason = reason;
    this.updatedAt = new Date().toISOString();

    if (reason === 'expired_card') {
      this.status = 'expired';
    } else if (reason === 'lost_card' || reason === 'stolen_card') {
      this.status = 'invalid';
    } else if (this.failureCount >= 3) {
      this.status = 'failed';
    }
  }

  recordSuccess(timestamp: string | null = null) {
    this.lastSuccessDate = timestamp || new Date().toISOString();
    this.failureCount = 0;
    this.lastFailureDate = null;
    this.lastFailureReason = null;
    this.status = 'active';
    this.updatedAt = new Date().toISOString();
  }

  deactivate() {
    this.status = 'inactive';
    this.updatedAt = new Date().toISOString();
  }

  getCardTypeDisplay(): string {
    const displayNames: Record<CardType, string> = {
      'visa': 'Visa',
      'mastercard': 'Mastercard',
      'amex': 'American Express',
      'discover': 'Discover'
    };

    return this.cardType ? displayNames[this.cardType] || this.cardType : '';
  }

  getMaskedCardNumber(): string {
    return `**** **** **** ${this.lastFourDigits}`;
  }

  getFormattedExpiry(): string {
    if (!this.expiryMonth || !this.expiryYear) return '';
    const month = this.expiryMonth.toString().padStart(2, '0');
    const year = this.expiryYear.toString().slice(-2);
    return `${month}/${year}`;
  }

  getFailureRate(): number {
    if (!this.lastSuccessDate && this.failureCount > 0) {
      return 100;
    }

    if (this.failureCount === 0) {
      return 0;
    }

    return Math.min(100, this.failureCount * 25);
  }

  needsReplacement(): boolean {
    return (
      this.isExpired() ||
      this.isExpiringSoon(2) ||
      this.status === 'failed' ||
      this.status === 'invalid' ||
      this.failureCount >= 3
    );
  }

  getStatusDescription(): string {
    const descriptions: Record<PaymentMethodStatus, string> = {
      'active': 'Active and working',
      'expired': 'Card has expired',
      'failed': 'Multiple payment failures',
      'invalid': 'Card is invalid or blocked',
      'inactive': 'Replaced by newer payment method'
    };

    return this.status ? descriptions[this.status] || 'Unknown status' : '';
  }

  toJSON(): object {
    return {
      id: this.id,
      customerId: this.customerId,
      cardType: this.cardType,
      cardTypeDisplay: this.getCardTypeDisplay(),
      lastFourDigits: this.lastFourDigits,
      maskedCardNumber: this.getMaskedCardNumber(),
      expiryMonth: this.expiryMonth,
      expiryYear: this.expiryYear,
      formattedExpiry: this.getFormattedExpiry(),
      status: this.status,
      statusDescription: this.getStatusDescription(),
      failureCount: this.failureCount,
      lastFailureDate: this.lastFailureDate,
      lastSuccessDate: this.lastSuccessDate,
      lastFailureReason: this.lastFailureReason,
      stripePaymentMethodId: this.stripePaymentMethodId,
      stripeCustomerId: this.stripeCustomerId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isExpired: this.isExpired(),
      isExpiringSoon: this.isExpiringSoon(),
      needsReplacement: this.needsReplacement(),
      failureRate: this.getFailureRate()
    };
  }

  static fromJSON(json: PaymentMethodData): PaymentMethod {
    return new PaymentMethod(json);
  }

  static fromStripePaymentMethod(stripeData: any, customerId: string): PaymentMethod {
    const paymentMethodId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new PaymentMethod({
      id: paymentMethodId,
      customerId: customerId,
      cardType: stripeData.card.brand,
      lastFourDigits: stripeData.card.last4,
      expiryMonth: stripeData.card.exp_month,
      expiryYear: stripeData.card.exp_year,
      status: 'active',
      stripePaymentMethodId: stripeData.id,
      stripeCustomerId: stripeData.customer,
      lastSuccessDate: new Date().toISOString()
    });
  }

  static createMockPaymentMethod(mockData: PaymentMethodData): PaymentMethod {
    const defaults = {
      id: `pm_mock_${Date.now()}`,
      customerId: 'cust_test_001',
      cardType: 'visa' as CardType,
      lastFourDigits: '4242',
      expiryMonth: 12,
      expiryYear: new Date().getFullYear() + 2,
      status: 'active' as PaymentMethodStatus,
      stripePaymentMethodId: `pm_stripe_mock_${Date.now()}`
    };

    return new PaymentMethod({ ...defaults, ...mockData });
  }

  isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static findProblematicMethods(paymentMethods: PaymentMethod[]): PaymentMethod[] {
    return paymentMethods.filter(pm =>
      pm.needsReplacement() ||
      pm.failureCount > 0 ||
      pm.status !== 'active'
    );
  }

  static getMostReliable(paymentMethods: PaymentMethod[]): PaymentMethod | null {
    const activeMethods = paymentMethods.filter(pm =>
      pm.status === 'active' && !pm.isExpired()
    );

    if (activeMethods.length === 0) {
      return null;
    }

    return activeMethods.sort((a, b) => {
      const failureDiff = a.getFailureRate() - b.getFailureRate();
      if (failureDiff !== 0) return failureDiff;

      const aSuccess = new Date(a.lastSuccessDate || 0);
      const bSuccess = new Date(b.lastSuccessDate || 0);
      return bSuccess.getTime() - aSuccess.getTime();
    })[0] || null;
  }
}

export default PaymentMethod;