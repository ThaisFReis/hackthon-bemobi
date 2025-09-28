import { prisma } from '../lib/prisma';
import { customerCache } from './customerCacheService';

export interface PaymentReceiptData {
  customerId: string;
  amount: number;
  transactionDate: Date;
  description?: string;
}

export interface PendingPaymentData {
  customerId: string;
  amount: number;
  transactionDate: Date;
}

export class PaymentTransactionService {

  // Record a successful payment receipt
  async recordPaymentReceipt(data: PaymentReceiptData): Promise<void> {
    try {
      console.log(`Recording payment receipt for customer ${data.customerId}: R$ ${data.amount}`);

      // Create payment transaction record
      await prisma.paymentTransaction.create({
        data: {
          customerId: data.customerId,
          amount: data.amount,
          status: 'COMPLETED',
          transactionDate: data.transactionDate,
          paidDate: data.transactionDate,
          description: data.description || 'Monthly subscription payment',
        }
      });

      // Find and mark corresponding payment due as paid


      // Update customer status to active
      await prisma.customer.update({
        where: { id: data.customerId },
        data: {
          accountStatus: 'ACTIVE',
          riskCategory: 'LOW_ENGAGEMENT',
          riskSeverity: 'LOW',
          lastPaymentDate: data.transactionDate,
          nextBillingDate: this.calculateNextBillingDate(data.transactionDate)
        }
      });

      // Invalidate customer cache
      customerCache.invalidate(data.customerId);

      // Add contact restriction to prevent unnecessary contact
      await this.addPaymentResolvedRestriction(data.customerId);

      console.log(`Payment receipt recorded successfully for customer ${data.customerId}`);

    } catch (error) {
      console.error('Error recording payment receipt:', error);
      throw error;
    }
  }

  // Check if customer has outstanding payments
  async hasOutstandingPayments(customerId: string): Promise<boolean> {
    try {
      const outstandingPayments = await prisma.paymentTransaction.count({
        where: {
          customerId,
          status: {
            in: ['PENDING', 'FAILED']
          },
          transactionDate: {
            lte: new Date()
          }
        }
      });

      return outstandingPayments > 0;
    } catch (error) {
      console.error('Error checking outstanding payments:', error);
      return false; // Default to false to avoid over-contacting
    }
  }

  // Check if customer has recent successful payments
  async hasRecentPayment(customerId: string, daysBack: number = 7): Promise<boolean> {
    try {
      const recentPaymentDate = new Date();
      recentPaymentDate.setDate(recentPaymentDate.getDate() - daysBack);

      const recentPayments = await prisma.paymentTransaction.count({
        where: {
          customerId,
          status: 'COMPLETED',
          paidDate: {
            gte: recentPaymentDate
          }
        }
      });

      return recentPayments > 0;
    } catch (error) {
      console.error('Error checking recent payments:', error);
      return false;
    }
  }

  // Create payment due record
  async createPendingPayment(data: PendingPaymentData): Promise<void> {
    try {
      await prisma.paymentTransaction.create({
        data: {
          customerId: data.customerId,
          amount: data.amount,
          status: 'PENDING',
          transactionDate: data.transactionDate,
          description: 'Pending payment'
        }
      });

      console.log(`Pending payment created for customer ${data.customerId}: R$ ${data.amount} due ${data.transactionDate.toISOString()}`);
    } catch (error) {
      console.error('Error creating pending payment:', error);
      throw error;
    }
  }

  // Mark payment due as paid


  // Add contact restriction for resolved payments
  private async addPaymentResolvedRestriction(customerId: string): Promise<void> {
    try {
      // Deactivate any existing active restrictions
      await prisma.contactRestriction.updateMany({
        where: {
          customerId,
          isActive: true
        },
        data: {
          isActive: false,
          endDate: new Date()
        }
      });

      // Add new payment resolved restriction (24 hour cooldown)
      const endDate = new Date();
      endDate.setHours(endDate.getHours() + 24);

      await prisma.contactRestriction.create({
        data: {
          customerId,
          restrictionType: 'PAYMENT_RESOLVED',
          endDate,
          reason: 'Payment successfully received - temporary contact restriction',
          appliedBy: 'payment_system',
          metadata: {
            autoResolved: true,
            paymentReceivedDate: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error adding payment resolved restriction:', error);
    }
  }

  // Calculate next billing date (30 days from current date)
  private calculateNextBillingDate(fromDate: Date): Date {
    const nextBilling = new Date(fromDate);
    nextBilling.setDate(nextBilling.getDate() + 30);
    return nextBilling;
  }

  // Calculate grace period (7 days after due date)
  private calculateGracePeriod(dueDate: Date): Date {
    const gracePeriod = new Date(dueDate);
    gracePeriod.setDate(gracePeriod.getDate() + 7);
    return gracePeriod;
  }

  // Get customer payment summary
  async getCustomerPaymentSummary(customerId: string) {
    try {
      const [outstandingPayments, recentPayments, contactRestrictions] = await Promise.all([
        prisma.paymentTransaction.findMany({
          where: {
            customerId,
            status: {
              in: ['PENDING', 'FAILED']
            }
          },
          orderBy: {
            transactionDate: 'asc'
          }
        }),
        prisma.paymentTransaction.findMany({
          where: {
            customerId,
            status: 'COMPLETED'
          },
          orderBy: {
            paidDate: 'desc'
          },
          take: 5
        }),
        prisma.contactRestriction.findMany({
          where: {
            customerId,
            isActive: true,
            OR: [
              { endDate: null },
              { endDate: { gt: new Date() } }
            ]
          }
        })
      ]);

      return {
        hasOutstandingPayments: outstandingPayments.length > 0,
        outstandingPayments,
        recentPayments,
        contactRestrictions,
        canContact: contactRestrictions.length === 0,
        lastPaymentDate: recentPayments[0]?.paidDate || null
      };
    } catch (error) {
      console.error('Error getting customer payment summary:', error);
      return {
        hasOutstandingPayments: false,
        outstandingPayments: [],
        recentPayments: [],
        contactRestrictions: [],
        canContact: true,
        lastPaymentDate: null
      };
    }
  }
}

export const paymentTransactionService = new PaymentTransactionService();