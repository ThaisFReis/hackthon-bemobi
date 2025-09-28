import { PaymentMethod } from '../types/paymentMethod';

class PaymentService {
  async updatePaymentMethod(customerId: string, cardDetails: object): Promise<PaymentMethod> {
    const response = await fetch('https://hackthon-bemobi-1.onrender.com/api/payments/update-method', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId, cardDetails }),
    });

    if (!response.ok) {
      throw new Error('Failed to update payment method');
    }

    return response.json();
  }
}

export default new PaymentService();
