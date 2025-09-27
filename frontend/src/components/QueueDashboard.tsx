import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface QueuedCustomer {
  customerId: string;
  customerName: string;
  priority: number;
  urgencyScore: number;
  queuedAt: string;
  lastContactedAt?: string;
  contactAttempts: number;
  riskCategory: string;
  accountValue: number;
}

interface ActiveSession {
  sessionId: string;
  customerId: string;
  customerName: string;
  startTime: string;
  status: string;
}

interface QueueConfig {
  enabled: boolean;
  maxConcurrentSessions: number;
  processingIntervalMs: number;
  maxContactsPerDay: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  minTimeBetweenContacts: number;
}

interface QueueStats {
  queueLength: number;
  activeSessionsCount: number;
  availableSlots: number;
  isProcessingActive: boolean;
}

interface QueueStatus {
  queue: QueuedCustomer[];
  activeSessions: ActiveSession[];
  config: QueueConfig;
  stats: QueueStats;
}

const QueueDashboard: React.FC = () => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
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
  }, []);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading queue status...</div>
      </div>
    );
  }

  if (!queueStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-red-600">Failed to load queue status</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Queue Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRefreshQueue}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Queue
          </button>
          {queueStatus.config.enabled ? (
            <button
              onClick={handleStopAutonomous}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Stop Autonomous Mode
            </button>
          ) : (
            <button
              onClick={handleStartAutonomous}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Start Autonomous Mode
            </button>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Queue Length</h3>
          <p className="text-2xl font-bold text-blue-600">{queueStatus.stats.queueLength}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Active Sessions</h3>
          <p className="text-2xl font-bold text-green-600">{queueStatus.stats.activeSessionsCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Available Slots</h3>
          <p className="text-2xl font-bold text-orange-600">{queueStatus.stats.availableSlots}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-500">Status</h3>
          <p className={`text-lg font-bold ${queueStatus.config.enabled ? 'text-green-600' : 'text-red-600'}`}>
            {queueStatus.config.enabled ? 'Active' : 'Stopped'}
          </p>
          {queueStatus.config.enabled && (
            <p className="text-xs text-gray-500">
              {queueStatus.stats.isProcessingActive ? 'Processing' : 'In quiet hours'}
            </p>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Configuration</h3>
          <button
            onClick={() => {
              setConfigEditing(!configEditing);
              setTempConfig(queueStatus.config);
            }}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {configEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {configEditing && tempConfig ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Concurrent Sessions</label>
              <input
                type="number"
                value={tempConfig.maxConcurrentSessions}
                onChange={(e) => setTempConfig({...tempConfig, maxConcurrentSessions: parseInt(e.target.value)})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Processing Interval (seconds)</label>
              <input
                type="number"
                value={tempConfig.processingIntervalMs / 1000}
                onChange={(e) => setTempConfig({...tempConfig, processingIntervalMs: parseInt(e.target.value) * 1000})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Contacts Per Day</label>
              <input
                type="number"
                value={tempConfig.maxContactsPerDay}
                onChange={(e) => setTempConfig({...tempConfig, maxContactsPerDay: parseInt(e.target.value)})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Hours Between Contacts</label>
              <input
                type="number"
                value={tempConfig.minTimeBetweenContacts}
                onChange={(e) => setTempConfig({...tempConfig, minTimeBetweenContacts: parseInt(e.target.value)})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div className="md:col-span-2 flex space-x-4">
              <button
                onClick={handleUpdateConfig}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save Configuration
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Max Sessions:</span> {queueStatus.config.maxConcurrentSessions}
            </div>
            <div>
              <span className="font-medium">Interval:</span> {queueStatus.config.processingIntervalMs / 1000}s
            </div>
            <div>
              <span className="font-medium">Max/Day:</span> {queueStatus.config.maxContactsPerDay}
            </div>
            <div>
              <span className="font-medium">Min Between:</span> {queueStatus.config.minTimeBetweenContacts}h
            </div>
          </div>
        )}
      </div>

      {/* Priority Queue */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Priority Queue ({queueStatus.queue.length} customers)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {queueStatus.queue.map((customer, index) => (
                <tr key={customer.customerId} className={index < 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.customerName}</div>
                    <div className="text-sm text-gray-500">{customer.customerId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.priority >= 80 ? 'bg-red-100 text-red-800' :
                      customer.priority >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {customer.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.riskCategory?.replace('-', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {(customer.accountValue / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.contactAttempts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.lastContactedAt ? formatTime(customer.lastContactedAt) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleRemoveFromQueue(customer.customerId)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {queueStatus.queue.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No customers in queue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Sessions - Only show when autonomous mode is active and has sessions */}
      {queueStatus.config.enabled && queueStatus.activeSessions.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Active Sessions ({queueStatus.activeSessions.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queueStatus.activeSessions.map((session) => (
                  <tr key={session.sessionId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{session.customerName}</div>
                      <div className="text-sm text-gray-500">{session.customerId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {session.sessionId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(session.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => window.open(`/chat/${session.sessionId}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Chat
                      </button>
                    </td>
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