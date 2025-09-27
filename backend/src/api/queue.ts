import express from 'express';
import { QueueService } from '../services/queueService';
import Customer from '../models/customer';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Get queue service instance from app
const getQueueService = (req: express.Request): QueueService => {
  return req.app.get('queueService');
};

// Get current queue status
router.get('/status', (req, res) => {
  try {
    const queueService = getQueueService(req);
    const status = queueService.getQueueStatus();
    return res.json(status);
  } catch (error) {
    console.error('Error getting queue status:', error);
    return res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// Start autonomous mode
router.post('/start', (req, res) => {
  try {
    const queueService = getQueueService(req);
    queueService.startAutonomousMode();
    return res.json({ message: 'Autonomous mode started', status: 'active' });
  } catch (error) {
    console.error('Error starting autonomous mode:', error);
    return res.status(500).json({ error: 'Failed to start autonomous mode' });
  }
});

// Stop autonomous mode
router.post('/stop', (req, res) => {
  try {
    const queueService = getQueueService(req);
    queueService.stopAutonomousMode();
    return res.json({ message: 'Autonomous mode stopped', status: 'inactive' });
  } catch (error) {
    console.error('Error stopping autonomous mode:', error);
    return res.status(500).json({ error: 'Failed to stop autonomous mode' });
  }
});

// Update queue configuration
router.post('/config', (req, res) => {
  try {
    const queueService = getQueueService(req);
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Configuration object is required' });
    }

    queueService.updateConfig(config);
    return res.json({ message: 'Configuration updated', config });
  } catch (error) {
    console.error('Error updating queue config:', error);
    return res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Load customers from JSON file
function loadCustomersFromJSON(): Customer[] {
  try {
    const dataPath = path.join(__dirname, '../../data/mockCustomers.json');
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const customers = jsonData.customers.map((customerData: any) => {
      return new Customer(customerData);
    });

    return customers;
  } catch (error) {
    console.error('Error loading customers from JSON:', error);
    return [];
  }
}

// Refresh queue with latest customer data
router.post('/refresh', async (req, res) => {
  try {
    const queueService = getQueueService(req);

    // Load latest customer data directly from JSON
    const customers = loadCustomersFromJSON();
    await queueService.refreshQueue(customers);

    const atRiskCustomers = customers.filter((c: any) => c.requiresIntervention());
    return res.json({
      message: 'Queue refreshed',
      totalCustomers: customers.length,
      queueLength: atRiskCustomers.length
    });
  } catch (error) {
    console.error('Error refreshing queue:', error);
    return res.status(500).json({ error: 'Failed to refresh queue' });
  }
});

// Add specific customer to queue (manual override)
router.post('/add-customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const queueService = getQueueService(req);

    // Load customer data directly from JSON
    const customers = loadCustomersFromJSON();
    const customer = customers.find(c => c.id === customerId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    queueService.addCustomerToQueue(customer);

    return res.json({ message: 'Customer added to queue', customerId });
  } catch (error) {
    console.error('Error adding customer to queue:', error);
    return res.status(500).json({ error: 'Failed to add customer to queue' });
  }
});

// Remove customer from queue
router.delete('/remove-customer/:customerId', (req, res) => {
  try {
    const { customerId } = req.params;
    const queueService = getQueueService(req);

    queueService.removeCustomerFromQueue(customerId);

    return res.json({ message: 'Customer removed from queue', customerId });
  } catch (error) {
    console.error('Error removing customer from queue:', error);
    return res.status(500).json({ error: 'Failed to remove customer from queue' });
  }
});

// Close active session (when chat is completed)
router.post('/close-session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const queueService = getQueueService(req);

    queueService.removeActiveSession(sessionId);

    return res.json({ message: 'Session closed', sessionId });
  } catch (error) {
    console.error('Error closing session:', error);
    return res.status(500).json({ error: 'Failed to close session' });
  }
});

export default router;