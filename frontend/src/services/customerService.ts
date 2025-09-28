import { Customer } from '../types/customer';

class CustomerService {
  async getCustomers(): Promise<Customer[]> {
    const response = await fetch('https://hackthon-bemobi-1.onrender.com/api/customers');
    if (!response.ok) {
      throw new Error('Failed to fetch customers');
    }
    return response.json();
  }

  async updateCustomerStatus(customerId: string, status: string): Promise<Customer> {
    const response = await fetch(`https://hackthon-bemobi-1.onrender.com/api/customers/${customerId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error('Failed to update customer status');
    }
    return response.json();
  }
}

export default new CustomerService();
