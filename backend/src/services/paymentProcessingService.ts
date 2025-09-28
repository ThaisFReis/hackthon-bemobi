import { paymentTransactionService } from './paymentTransactionService';
import { contactLogService } from './contactLogService';



  // Check if message contains payment confirmation intent
  isPaymentConfirmation(message: string): boolean {
    const confirmationKeywords = [
      'sim', 'yes', 'confirmo', 'correto', 'certo', 'ok', 'está certo',
      'confirmar', 'processar', 'prosseguir', 'continuar'
    ];

    const lowerMessage = message.toLowerCase().trim();
    return confirmationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Check if AI response indicates payment processing
  isProcessingPayment(aiResponse: string): boolean {
    const processingKeywords = [
      'processando', 'processing', 'atualizando', 'aguarde', 'instante',
      'verificando', 'confirmando'
    ];

    const lowerResponse = aiResponse.toLowerCase();
    return processingKeywords.some(keyword => lowerResponse.includes(keyword));
  }

  // Check if AI response indicates successful payment
  isPaymentSuccess(aiResponse: string): boolean {
    const successKeywords = [
      'pronto', 'sucesso', 'atualizado com sucesso', 'cartão atualizado',
      'pagamento processado', 'tudo certo', '✅'
    ];

    const lowerResponse = aiResponse.toLowerCase();
    return successKeywords.some(keyword => lowerResponse.includes(keyword));
  }

  // Process payment with extracted card details
  async processPayment(customerId: string, paymentToken: string): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
  }> {
    try {
      console.log(`[PaymentProcessing] Starting payment process for customer ${customerId} with token`);

      // Here you would integrate with a real payment gateway using the paymentToken
      if (!paymentToken) {
        return {
          success: false,
          message: 'Token de pagamento inválido.'
        };
      }

      // Simulate payment processing delay
      console.log('[PaymentProcessing] Simulating payment processing delay...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[PaymentProcessing] Delay finished. Recording payment receipt...');

      // Create payment transaction record
      await paymentTransactionService.recordPaymentReceipt({
        customerId,
        amount: 49.90, // Default amount - should come from actual billing
        transactionDate: new Date(),
        externalId: `proc_${Date.now()}`,
        description: `Payment via chat - Token: ${paymentToken.slice(-4)}`
      });

      console.log(`[PaymentProcessing] Payment processed successfully for customer ${customerId}`);

      return {
        success: true,
        message: 'Pagamento processado com sucesso!',
        transactionId: `proc_${Date.now()}`
      };

    } catch (error) {
      console.error('[PaymentProcessing] Error processing payment:', error);
      return {
        success: false,
        message: 'Erro no processamento do pagamento. Tente novamente.'
      };
    }
  }

  // Validate card details
  private validateCardDetails(cardDetails: CardDetails): boolean {
    // Check card number length
    if (cardDetails.cardNumber.length < 13 || cardDetails.cardNumber.length > 19) {
      return false;
    }

    // Check expiry date
    const month = parseInt(cardDetails.expiryMonth);
    const year = parseInt(cardDetails.expiryYear);

    if (month < 1 || month > 12) {
      return false;
    }

    const currentDate = new Date();
    const expiryDate = new Date(year, month - 1);

    if (expiryDate <= currentDate) {
      return false;
    }

    // Check CVV length
    if (cardDetails.cvv.length < 3 || cardDetails.cvv.length > 4) {
      return false;
    }

    return true;
  }

  // Update contact log with payment resolution
  async updateContactWithPaymentResolution(customerId: string, sessionId: string): Promise<void> {
    try {
      await contactLogService.updateContactOutcome(
        customerId,
        sessionId,
        'PAYMENT_RESOLVED',
        'Payment successfully processed via AI chat',
        true
      );
    } catch (error) {
      console.error('Error updating contact log:', error);
    }
  }
}

export const paymentProcessingService = new PaymentProcessingService();