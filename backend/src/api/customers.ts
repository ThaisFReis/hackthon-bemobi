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
        riskFactors: true,
        interventions: true,
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
        riskFactors: true,
        interventions: true,
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
        riskFactors: true,
        interventions: {
          orderBy: {
            date: 'desc'
          }
        },
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