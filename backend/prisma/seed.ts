// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import mockData from '../data/mockCustomers.json';

const prisma = new PrismaClient();

// Helper function to map string values to enum values
function mapToEnum(value: string, enumMapping: Record<string, string>): string {
  const upperValue = value.toUpperCase().replace(/-/g, '_');
  return enumMapping[upperValue] || enumMapping[value] || value;
}

// Enum mappings
const accountStatusMap: Record<string, string> = {
  'ACTIVE': 'ACTIVE',
  'AT_RISK': 'AT_RISK',
  'AT-RISK': 'AT_RISK',
  'CHURNED': 'CHURNED',
  'SUSPENDED': 'SUSPENDED'
};

const riskCategoryMap: Record<string, string> = {
  'PAYMENT_FAILED': 'PAYMENT_FAILED',
  'PAYMENT-FAILED': 'PAYMENT_FAILED',
  'FAILED_PAYMENT': 'PAYMENT_FAILED',
  'FAILED-PAYMENT': 'PAYMENT_FAILED',
  'MULTIPLE_FAILURES': 'MULTIPLE_FAILURES',
  'MULTIPLE-FAILURES': 'MULTIPLE_FAILURES',
  'EXPIRING_CARD': 'HIGH_VALUE',
  'EXPIRING-CARD': 'HIGH_VALUE',
  'HIGH_VALUE': 'HIGH_VALUE',
  'LOW_ENGAGEMENT': 'LOW_ENGAGEMENT',
  'NONE': 'LOW_ENGAGEMENT'
};

const riskSeverityMap: Record<string, string> = {
  'LOW': 'LOW',
  'MEDIUM': 'MEDIUM',
  'HIGH': 'HIGH',
  'CRITICAL': 'CRITICAL'
};

const billingCycleMap: Record<string, string> = {
  'MONTHLY': 'MONTHLY',
  'QUARTERLY': 'QUARTERLY',
  'YEARLY': 'YEARLY'
};

const paymentStatusMap: Record<string, string> = {
  'SUCCESS': 'SUCCESS',
  'FAILED': 'FAILED',
  'PENDING': 'PENDING',
  'BLOCKED': 'BLOCKED',
  'ACTIVE': 'SUCCESS',
  'EXPIRING_SOON': 'PENDING'
};

const failureReasonMap: Record<string, string> = {
  'INSUFFICIENT_FUNDS': 'INSUFFICIENT_FUNDS',
  'CARD_EXPIRED': 'CARD_EXPIRED',
  'CARD_DECLINED': 'CARD_DECLINED',
  'INVALID_CARD': 'INVALID_CARD',
  'BANK_ERROR': 'BANK_ERROR',
  'UNKNOWN': 'UNKNOWN'
};

const cardTypeMap: Record<string, string> = {
  'VISA': 'VISA',
  'MASTERCARD': 'MASTERCARD',
  'AMEX': 'AMEX',
  'ELO': 'ELO',
  'HIPERCARD': 'HIPERCARD'
};

const interventionOutcomeMap: Record<string, string> = {
  'SUCCESS': 'SUCCESS',
  'FAILED': 'FAILED',
  'NO_ANSWER': 'NO_ANSWER',
  'SCHEDULED': 'SCHEDULED'
};

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.intervention.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.riskFactor.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.paymentStatus.deleteMany();
  await prisma.customer.deleteMany();

  console.log('👥 Seeding customers...');

  for (const customerData of mockData.customers) {
    console.log(`✅ Creating customer: ${customerData.name}`);

    const customer = await prisma.customer.create({
      data: {
        id: customerData.id,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        serviceProvider: customerData.serviceProvider,
        serviceType: customerData.serviceType,
        accountValue: customerData.accountValue,
        riskCategory: mapToEnum(customerData.riskCategory, riskCategoryMap) as any,
        riskSeverity: mapToEnum(customerData.riskSeverity || 'medium', riskSeverityMap) as any,
        accountStatus: mapToEnum(customerData.accountStatus, accountStatusMap) as any,
        billingCycle: mapToEnum(customerData.billingCycle || 'monthly', billingCycleMap) as any,
        lastPaymentDate: customerData.lastPaymentDate ? new Date(customerData.lastPaymentDate) : null,
        nextBillingDate: new Date(customerData.nextBillingDate),
        customerSince: new Date(customerData.customerSince),
      }
    });

    // Create payment status
    if (customerData.paymentStatus) {
      await prisma.paymentStatus.create({
        data: {
          customerId: customer.id,
          status: mapToEnum(customerData.paymentStatus.status, paymentStatusMap) as any,
          failureCount: customerData.paymentStatus.failureCount || 0,
          lastFailureDate: customerData.paymentStatus.lastFailureDate
            ? new Date(customerData.paymentStatus.lastFailureDate)
            : null,
          lastSuccessDate: customerData.paymentStatus.lastSuccessDate
            ? new Date(customerData.paymentStatus.lastSuccessDate)
            : null,
          failureReason: customerData.paymentStatus.failureReason
            ? mapToEnum(customerData.paymentStatus.failureReason, failureReasonMap) as any
            : null,
        }
      });
    }

    // Create payment method (tokenized, no sensitive data)
    if ((customerData as any).paymentMethod) {
      const paymentMethod = (customerData as any).paymentMethod;
      await prisma.paymentMethod.create({
        data: {
          customerId: customer.id,
          paymentToken: `token_${paymentMethod.id}`, // Simulated token
          cardType: paymentMethod.cardType ? mapToEnum(paymentMethod.cardType, cardTypeMap) as any : null,
          cardBrand: paymentMethod.cardType ? paymentMethod.cardType.toUpperCase() : null,
          status: mapToEnum(paymentMethod.status || 'pending', paymentStatusMap) as any,
          failureCount: paymentMethod.failureCount || 0,
          lastFailureDate: paymentMethod.lastFailureDate
            ? new Date(paymentMethod.lastFailureDate)
            : null,
          lastSuccessDate: paymentMethod.lastSuccessDate
            ? new Date(paymentMethod.lastSuccessDate)
            : null,
          isDefault: true,
          processorId: `processor_${paymentMethod.id}`,
          fingerprint: `fp_${Math.random().toString(36).substring(2, 11)}`,
        }
      });
    }

    // Create risk factors
    if ((customerData as any).riskFactors && Array.isArray((customerData as any).riskFactors)) {
      for (const factor of (customerData as any).riskFactors) {
        await prisma.riskFactor.create({
          data: {
            customerId: customer.id,
            factor: factor,
            weight: Math.random() * 2 + 0.5, // Random weight between 0.5 and 2.5
          }
        });
      }
    }

    // Create intervention history
    if ((customerData as any).interventionHistory && Array.isArray((customerData as any).interventionHistory)) {
      for (const intervention of (customerData as any).interventionHistory) {
        await prisma.intervention.create({
          data: {
            customerId: customer.id,
            date: new Date(intervention.date),
            outcome: mapToEnum(intervention.outcome, interventionOutcomeMap) as any,
            notes: intervention.notes,
            revenueRecovered: intervention.outcome === 'success' ? Math.floor(Math.random() * 5000) : null,
            agentId: `agent_${Math.floor(Math.random() * 100)}`,
            duration: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
          }
        });
      }
    }
  }

  console.log('🎉 Database seeded successfully!');
  console.log(`📊 Created ${mockData.customers.length} customers with all related data`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());