import React, { useEffect, useState } from 'react';
import Customer from '../../../../backend/src/models/customer';
import CustomerCard from './CustomerCard';
import QueueDashboard from './QueueDashboard';

const AdminDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'manual' | 'queue'>('queue');

  useEffect(() => {
    // Fetch at-risk customers from the API
    const fetchCustomers = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/customers');
        const data = await response.json();
        setCustomers(data.filter((c: Customer) => c.accountStatus === 'at-risk'));
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, []);

  const handleChatTriggered = (sessionId: string) => {
    setActiveSessions(prev => [...prev, sessionId]);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'queue'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI Queue Management
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manual Controls
          </button>
        </div>
      </div>

      {activeTab === 'queue' ? (
        <QueueDashboard />
      ) : (
        <div>
          {activeSessions.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Manual Chat Sessions</h2>
              <p className="text-blue-600">
                {activeSessions.length} session(s) currently active
              </p>
              <div className="mt-2 space-y-1">
                {activeSessions.map((sessionId, index) => (
                  <div key={sessionId} className="text-sm text-blue-700">
                    Session {index + 1}: {sessionId}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">At-Risk Customers</h2>
            <p className="text-gray-600 mb-4">
              Manually trigger AI conversations with specific customers. Note: The AI Queue Management
              handles these automatically based on priority.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onChatTriggered={handleChatTriggered}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;