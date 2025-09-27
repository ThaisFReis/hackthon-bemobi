import express from 'express';
import Customer from '../models/customer';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Load customers from JSON file
function loadCustomersFromJSON(): Customer[] {
  try {
    const dataPath = path.join(__dirname, '../../data/mockCustomers.json');
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const customers = jsonData.customers.map((customerData: any) => {
      return new Customer(customerData);
    });

    console.log(`Loaded ${customers.length} customers from JSON file`);
    return customers;
  } catch (error) {
    console.error('Error loading customers from JSON:', error);

    // Fallback to minimal data if JSON fails to load
    return [
      new Customer({
        id: 'cust_fallback',
        name: 'Fallback Customer',
        email: 'fallback@example.com',
        accountStatus: 'at-risk',
        riskCategory: 'failed-payment',
        riskSeverity: 'medium',
        accountValue: 5000,
        customerSince: '2023-01-01T00:00:00.000Z',
        lastPaymentDate: '2025-01-01T00:00:00.000Z',
        serviceProvider: 'Generic Provider',
        serviceType: 'Basic Service'
      })
    ];
  }
}

// Load customers on module initialization
const mockCustomers: Customer[] = loadCustomersFromJSON();

// Get all customers
router.get('/', (req, res) => {
  return res.json(mockCustomers);
});

// Get customers by status
router.get('/status/:status', (req, res) => {
  const { status } = req.params;
  const filteredCustomers = mockCustomers.filter(customer => customer.accountStatus === status);
  return res.json(filteredCustomers);
});

// Get specific customer
router.get('/:customerId', (req, res) => {
  const { customerId } = req.params;
  const customer = mockCustomers.find(c => c.id === customerId);

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  return res.json(customer);
});

export default router;