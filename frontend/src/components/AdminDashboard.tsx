import React, { useEffect, useState } from 'react';
import { Customer } from '../types/customer';
import CustomerCard from './CustomerCard';
import QueueDashboard from './QueueDashboard';
import { Users, List } from 'lucide-react'; // Using lucide-react for icons

const AdminDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'manual' | 'queue'>('queue');

  useEffect(() => {
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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-100">Admin Dashboard</h1>

          {/* Glassmorphism Tab Navigation */}
          <div className="mt-4 sm:mt-0 flex items-center bg-white/10 backdrop-blur-lg rounded-xl p-1 space-x-1 border border-white/20">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
                activeTab === 'queue'
                  ? 'bg-white/20 text-white shadow-md'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <List className="w-5 h-5 mr-2" />
              AI Queue Management
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
                activeTab === 'manual'
                  ? 'bg-white/20 text-white shadow-md'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <Users className="w-5 h-5 mr-2" />
              Manual Controls
            </button>
          </div>
        </header>

        <main>
          {activeTab === 'queue' ? (
            <QueueDashboard />
          ) : (
            <div>
              {activeSessions.length > 0 && (
                <div className="mb-8 p-5 bg-blue-900/30 backdrop-blur-lg border border-blue-400/30 rounded-xl shadow-lg">
                  <h2 className="text-lg font-semibold text-blue-200 mb-2">Manual Chat Sessions</h2>
                  <p className="text-blue-300">
                    {activeSessions.length} session(s) currently active.
                  </p>
                  <div className="mt-3 space-y-2">
                    {activeSessions.map((sessionId, index) => (
                      <div key={sessionId} className="text-sm text-blue-200 bg-blue-500/20 rounded px-3 py-1">
                        <span className="font-semibold">Session {index + 1}:</span> {sessionId}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-200">At-Risk Customers</h2>
                <p className="text-gray-400 mt-1">
                  Manually trigger AI conversations with specific customers. Note: The AI Queue Management
                  handles these automatically based on priority.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;