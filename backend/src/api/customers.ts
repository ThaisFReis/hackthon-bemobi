import express from 'express';
import { prisma } from '../lib/prisma';
import Customer from '../models/customer';

const router = express.Router();

// Helper function to convert database customer to Customer model
function convertDbCustomerToModel(dbCustomer: any): Customer {
  return new Customer({
    id: dbCustomer.id,
    name: dbCustomer.name,
    email: dbCustomer.email,
    phone: dbCustomer.phone,
    accountStatus: dbCustomer.accountStatus.toLowerCase().replace('_', '-'),
    riskCategory: dbCustomer.riskCategory.toLowerCase().replace('_', '-'),
    riskSeverity: dbCustomer.riskSeverity.toLowerCase(),
    lastPaymentDate: dbCustomer.lastPaymentDate?.toISOString(),
    accountValue: Number(dbCustomer.accountValue),
    customerSince: dbCustomer.customerSince.toISOString(),
    serviceProvider: dbCustomer.serviceProvider,
    serviceType: dbCustomer.serviceType,
    billingCycle: dbCustomer.billingCycle.toLowerCase(),
    nextBillingDate: dbCustomer.nextBillingDate.toISOString(),
    paymentMethod: dbCustomer.paymentMethods?.[0] ? {
      id: dbCustomer.paymentMethods[0].id,
      cardType: dbCustomer.paymentMethods[0].cardType?.toLowerCase() || '',
      lastFourDigits: '****', // Don't expose real data
      expiryMonth: 0, // Don't expose real data
      expiryYear: 0, // Don't expose real data
      status: dbCustomer.paymentMethods[0].status.toLowerCase(),
      failureCount: dbCustomer.paymentMethods[0].failureCount,
      lastFailureDate: dbCustomer.paymentMethods[0].lastFailureDate?.toISOString(),
      lastSuccessDate: dbCustomer.paymentMethods[0].lastSuccessDate?.toISOString()
    } : undefined,
    riskFactors: dbCustomer.riskFactors?.map((rf: any) => rf.factor) || [],
    interventionHistory: dbCustomer.interventions?.map((intervention: any) => ({
      date: intervention.date.toISOString(),
      outcome: intervention.outcome.toLowerCase(),
      notes: intervention.notes
    })) || []
  });
}

// Get all customers
router.get('/', async (req, res) => {
  try {
    const dbCustomers = await prisma.customer.findMany({
      include: {
        paymentMethods: true,
        riskFactors: true,
        interventions: true,
        paymentStatus: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const customers = dbCustomers.map(convertDbCustomerToModel);
    return res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customers by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const accountStatus = status.toUpperCase().replace('-', '_');

    const dbCustomers = await prisma.customer.findMany({
      where: {
        accountStatus: accountStatus as any
      },
      include: {
        paymentMethods: true,
        riskFactors: true,
        interventions: true,
        paymentStatus: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const customers = dbCustomers.map(convertDbCustomerToModel);
    return res.json(customers);
  } catch (error) {
    console.error('Error fetching customers by status:', error);
    return res.status(500).json({ error: 'Failed to fetch customers by status' });
  }
});

// Get specific customer
router.get('/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const dbCustomer = await prisma.customer.findUnique({
      where: {
        id: customerId
      },
      include: {
        paymentMethods: true,
        riskFactors: true,
        interventions: {
          orderBy: {
            date: 'desc'
          }
        },
        paymentStatus: true
      }
    });

    if (!dbCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = convertDbCustomerToModel(dbCustomer);
    return res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

export default router;