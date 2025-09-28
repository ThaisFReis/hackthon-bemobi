import { prisma } from '../lib/prisma';
import { customerCache } from './customerCacheService';

export interface PaymentReceiptData {
  customerId: string;
  amount: number;
  transactionDate: Date;
  externalId?: string;
  paymentMethodId?: string;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  description?: string;
}

export interface PaymentDueData {
  customerId: string;
  amount: number;
  dueDate: Date;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  gracePeriodEnd?: Date;
}

export class PaymentTransactionService {

  // Record a successful payment receipt
  async recordPaymentReceipt(data: PaymentReceiptData): Promise<void> {
    try {
      console.log(`Recording payment receipt for customer ${data.customerId}: R$ ${data.amount}`);

      // Create payment transaction record
      const transaction = await prisma.paymentTransaction.create({
        data: {
          customerId: data.customerId,
          amount: data.amount,
          status: 'COMPLETED',
          transactionDate: data.transactionDate,
          paidDate: data.transactionDate,
          paymentMethodId: data.paymentMethodId,
          billingPeriodStart: data.billingPeriodStart,
          billingPeriodEnd: data.billingPeriodEnd,
          description: data.description || 'Monthly subscription payment',
          externalId: data.externalId
        }
      });

      // Find and mark corresponding payment due as paid
      if (data.billingPeriodStart && data.billingPeriodEnd) {
        await this.markPaymentDueAsPaid(
          data.customerId,
          data.billingPeriodStart,
          data.billingPeriodEnd,
          data.amount,
          transaction.id
        );
      }

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
      const outstandingPayments = await prisma.paymentDue.count({
        where: {
          customerId,
          isPaid: false,
          dueDate: {
            lte: new Date() // Due date has passed
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
  async createPaymentDue(data: PaymentDueData): Promise<void> {
    try {
      await prisma.paymentDue.create({
        data: {
          customerId: data.customerId,
          amount: data.amount,
          dueDate: data.dueDate,
          billingPeriodStart: data.billingPeriodStart,
          billingPeriodEnd: data.billingPeriodEnd,
          gracePeriodEnd: data.gracePeriodEnd || this.calculateGracePeriod(data.dueDate),
          isOverdue: data.dueDate < new Date()
        }
      });

      console.log(`Payment due created for customer ${data.customerId}: R$ ${data.amount} due ${data.dueDate.toISOString()}`);
    } catch (error) {
      console.error('Error creating payment due:', error);
      throw error;
    }
  }

  // Mark payment due as paid
  private async markPaymentDueAsPaid(
    customerId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    paidAmount: number,
    transactionId: string
  ): Promise<void> {
    try {
      await prisma.paymentDue.updateMany({
        where: {
          customerId,
          billingPeriodStart,
          billingPeriodEnd,
          isPaid: false
        },
        data: {
          isPaid: true,
          paidDate: new Date(),
          paidAmount,
          paymentTransactionId: transactionId
        }
      });
    } catch (error) {
      console.error('Error marking payment due as paid:', error);
    }
  }

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
        prisma.paymentDue.findMany({
          where: {
            customerId,
            isPaid: false
          },
          orderBy: {
            dueDate: 'asc'
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