import { beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';

// Test environment setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

  // Mock external services during tests
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
  process.env.AI_API_KEY = 'sk-mock_ai_key';

  console.log('Test environment initialized');
});

afterAll(async () => {
  console.log('Test environment cleanup completed');
});

beforeEach(() => {
  // Clear any mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test if needed
});

// Global test utilities
export const createMockCustomer = (overrides = {}) => ({
  id: 'cust_test_001',
  name: 'Test Customer',
  email: 'test@example.com',
  accountStatus: 'at-risk',
  riskSeverity: 'medium',
  lastPaymentDate: '2025-08-15',
  accountValue: 49.99,
  customerSince: '2023-01-15',
  ...overrides,
});

export const createMockChatSession = (overrides = {}) => ({
  id: 'session_test_001',
  customerId: 'cust_test_001',
  adminUserId: 'admin_001',
  status: 'initiated',
  startTime: new Date().toISOString(),
  paymentAttempted: false,
  ...overrides,
});

export const createMockPaymentMethod = (overrides = {}) => ({
  id: 'pm_test_001',
  customerId: 'cust_test_001',
  cardType: 'visa',
  lastFourDigits: '4242',
  expiryMonth: 12,
  expiryYear: 2027,
  status: 'active',
  failureCount: 0,
  ...overrides,
});

// Helper to wait for async operations in tests
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));