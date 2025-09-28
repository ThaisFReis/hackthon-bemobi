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

export interface PaymentMethod {
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
}
