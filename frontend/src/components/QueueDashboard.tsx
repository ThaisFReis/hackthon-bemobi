import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { QueueStatus, QueueConfig } from '../types/queue';

// ... (interfaces remain the same)

const QueueDashboard: React.FC = () => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [socket, setSocket] = useState<Socket | null>(null);
  const [configEditing, setConfigEditing] = useState(false);
  const [tempConfig, setTempConfig] = useState<QueueConfig | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io('http://localhost:3001');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to queue monitoring');
      socketInstance.emit('join-queue-monitoring');
    });

    socketInstance.on('queue-status', (status: QueueStatus) => {
      console.log('Queue status from socket:', status);
      setQueueStatus(status);
      setLoading(false);
    });

    socketInstance.on('queue-event', (eventData: { event: string; data: any }) => {
      console.log('Queue event:', eventData);
      // Refresh status after queue events
      fetchQueueStatus();
    });

    // Initial fetch
    fetchQueueStatus();

    return () => {
      socketInstance.disconnect();
    };
  }, [socket]);

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/queue/status');
      if (response.ok) {
        const status = await response.json();
        setQueueStatus(status);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching queue status:', error);
    }
  };

  const handleStartAutonomous = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/queue/start', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error starting autonomous mode:', error);
    }
  };

  const handleStopAutonomous = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/queue/stop', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error stopping autonomous mode:', error);
    }
  };

  const handleRefreshQueue = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/queue/refresh', {
        method: 'POST',
      });
      if (response.ok) {
        await fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error refreshing queue:', error);
    }
  };

  const handleUpdateConfig = async () => {
    if (!tempConfig) return;

    try {
      const response = await fetch('http://localhost:3001/api/queue/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: tempConfig }),
      });
      if (response.ok) {
        setConfigEditing(false);
        await fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const handleRemoveFromQueue = async (customerId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/queue/remove-customer/${customerId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error removing customer from queue:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-300">Loading queue status...</div>
      </div>
    );
  }

  if (!queueStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-red-400">Failed to load queue status</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h2 className="text-3xl font-bold text-white">AI Queue Management</h2>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={handleRefreshQueue}
            className="px-4 py-2 bg-blue-500/50 text-white rounded-lg hover:bg-blue-500/80 border border-blue-400/50 transition"
          >
            Refresh Queue
          </button>
          {queueStatus.config.enabled ? (
            <button
              onClick={handleStopAutonomous}
              className="px-4 py-2 bg-red-500/50 text-white rounded-lg hover:bg-red-500/80 border border-red-400/50 transition"
            >
              Stop Autonomous Mode
            </button>
          ) : (
            <button
              onClick={handleStartAutonomous}
              className="px-4 py-2 bg-green-500/50 text-white rounded-lg hover:bg-green-500/80 border border-green-400/50 transition"
            >
              Start Autonomous Mode
            </button>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Glassmorphism Stat Cards */}
        <div className="bg-white/5 backdrop-blur-lg p-5 rounded-xl border border-white/10">
          <h3 className="text-sm font-medium text-gray-400">Queue Length</h3>
          <p className="text-3xl font-bold text-blue-300">{queueStatus.stats.queueLength}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-lg p-5 rounded-xl border border-white/10">
          <h3 className="text-sm font-medium text-gray-400">Active Sessions</h3>
          <p className="text-3xl font-bold text-green-300">{queueStatus.stats.activeSessionsCount}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-lg p-5 rounded-xl border border-white/10">
          <h3 className="text-sm font-medium text-gray-400">Available Slots</h3>
          <p className="text-3xl font-bold text-orange-300">{queueStatus.stats.availableSlots}</p>
        </div>
        <div className="bg-white/5 backdrop-blur-lg p-5 rounded-xl border border-white/10">
          <h3 className="text-sm font-medium text-gray-400">Status</h3>
          <p className={`text-2xl font-bold ${queueStatus.config.enabled ? 'text-green-300' : 'text-red-300'}`}>
            {queueStatus.config.enabled ? 'Active' : 'Stopped'}
          </p>
          {queueStatus.config.enabled && (
            <p className="text-xs text-gray-400">
              {queueStatus.stats.isProcessingActive ? 'Processing' : 'In quiet hours'}
            </p>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Configuration</h3>
          <button
            onClick={() => {
              setConfigEditing(!configEditing);
              setTempConfig(queueStatus.config);
            }}
            className="px-3 py-1 bg-gray-500/50 text-white rounded-lg hover:bg-gray-500/80 border border-gray-400/50 transition"
          >
            {configEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {configEditing && tempConfig ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <label className="block text-sm font-medium mb-1">Max Concurrent Sessions</label>
              <input
                type="number"
                value={tempConfig.maxConcurrentSessions}
                onChange={(e) => setTempConfig({...tempConfig, maxConcurrentSessions: parseInt(e.target.value)})}
                className="mt-1 block w-full bg-white/10 border-white/20 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Processing Interval (seconds)</label>
              <input
                type="number"
                value={tempConfig.processingIntervalMs / 1000}
                onChange={(e) => setTempConfig({...tempConfig, processingIntervalMs: parseInt(e.target.value) * 1000})}
                className="mt-1 block w-full bg-white/10 border-white/20 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Contacts Per Day</label>
              <input
                type="number"
                value={tempConfig.maxContactsPerDay}
                onChange={(e) => setTempConfig({...tempConfig, maxContactsPerDay: parseInt(e.target.value)})}
                className="mt-1 block w-full bg-white/10 border-white/20 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Hours Between Contacts</label>
              <input
                type="number"
                value={tempConfig.minTimeBetweenContacts}
                onChange={(e) => setTempConfig({...tempConfig, minTimeBetweenContacts: parseInt(e.target.value)})}
                className="mt-1 block w-full bg-white/10 border-white/20 rounded-md px-3 py-2"
              />
            </div>
            <div className="md:col-span-2 flex space-x-4">
              <button
                onClick={handleUpdateConfig}
                className="px-4 py-2 bg-green-500/50 text-white rounded-lg hover:bg-green-500/80 border border-green-400/50 transition"
              >
                Save Configuration
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
            <div>
              <span className="font-medium text-gray-400">Max Sessions:</span> {queueStatus.config.maxConcurrentSessions}
            </div>
            <div>
              <span className="font-medium text-gray-400">Interval:</span> {queueStatus.config.processingIntervalMs / 1000}s
            </div>
            <div>
              <span className="font-medium text-gray-400">Max/Day:</span> {queueStatus.config.maxContactsPerDay}
            </div>
            <div>
              <span className="font-medium text-gray-400">Min Between:</span> {queueStatus.config.minTimeBetweenContacts}h
            </div>
          </div>
        )}
      </div>

      {/* Priority Queue */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-gray-200">Priority Queue ({queueStatus.queue.length} customers)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Attempts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Last Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {queueStatus.queue.map((customer, index) => (
                <tr key={customer.customerId} className={`transition-colors hover:bg-white/5 ${index < 3 ? 'bg-yellow-500/10' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-200">{customer.customerName}</div>
                    <div className="text-sm text-gray-400">{customer.customerId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.priority >= 80 ? 'bg-red-500/20 text-red-300' :
                      customer.priority >= 60 ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {customer.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {customer.riskCategory?.replace('-', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    R$ {(customer.accountValue / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {customer.contactAttempts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {customer.lastContactedAt ? formatTime(customer.lastContactedAt) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleRemoveFromQueue(customer.customerId)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {queueStatus.queue.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No customers in queue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Sessions */}
      {queueStatus.config.enabled && queueStatus.activeSessions.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-gray-200">Active Sessions ({queueStatus.activeSessions.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* ... (table head similar to priority queue) ... */}
              <tbody className="divide-y divide-white/10">
                {queueStatus.activeSessions.map((session) => (
                  <tr key={session.sessionId} className="transition-colors hover:bg-white/5">
                    {/* ... (table cells similar to priority queue) ... */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueDashboard;