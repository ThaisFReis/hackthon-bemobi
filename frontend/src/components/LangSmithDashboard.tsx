import React, { useState, useEffect } from 'react';
import ConversationFlowAnalysis from './analytics/ConversationFlowAnalysis';
import ROIDashboard from './analytics/ROIDashboard';
import PatternOptimization from './analytics/PatternOptimization';

interface LangSmithRun {
  id: string;
  name: string;
  status: string;
  startTime: string;
  endTime: string;
  inputs: any;
  outputs: any;
  error: any;
}

interface LangSmithStats {
  projectName: string;
  totalRuns: number;
  recentRuns: LangSmithRun[];
  successRate: number;
  error?: string;
}

interface LangSmithHealth {
  status: string;
  configured: boolean;
  message: string;
  timestamp: string;
  error?: string;
}

const LangSmithDashboard: React.FC = () => {
  const [stats, setStats] = useState<LangSmithStats | null>(null);
  const [health, setHealth] = useState<LangSmithHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'monitoring' | 'flows' | 'roi' | 'patterns'>('monitoring');

  useEffect(() => {
    fetchLangSmithData();
    const interval = setInterval(fetchLangSmithData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLangSmithData = async () => {
    try {
      const [statsResponse, healthResponse] = await Promise.all([
        fetch('http://localhost:3001/api/langsmith/stats'),
        fetch('http://localhost:3001/api/langsmith/health')
      ]);

      const statsData = await statsResponse.json();
      const healthData = await healthResponse.json();

      setStats(statsData);
      setHealth(healthData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching LangSmith data:', error);
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString();
  };

  const formatDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    return `${Math.round(duration / 1000)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-300">Loading LangSmith data...</div>
      </div>
    );
  }

  if (stats?.error || health?.error) {
    return (
      <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">LangSmith Monitoring</h2>
        <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4">
          <h3 className="text-red-300 font-semibold mb-2">Configuration Issue</h3>
          <p className="text-red-200">{stats?.error || health?.error || 'LangSmith is not properly configured'}</p>
          <p className="text-red-200 text-sm mt-2">
            Please ensure LANGCHAIN_API_KEY is set in your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 bg-white/5 backdrop-blur-lg rounded-lg p-1 border border-white/10">
          {[
            { key: 'monitoring', label: 'Basic Monitoring' },
            { key: 'flows', label: 'Conversation Flows' },
            { key: 'roi', label: 'ROI & Business Impact' },
            { key: 'patterns', label: 'Pattern Optimization' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-500/50 text-white border border-blue-400/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <div className={`w-3 h-3 rounded-full ${health?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-gray-300 text-sm">
            {health?.status === 'healthy' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'monitoring' && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-lg p-5 rounded-xl border border-white/10">
              <h3 className="text-sm font-medium text-gray-400">Project</h3>
              <p className="text-xl font-bold text-blue-300">{stats?.projectName || 'N/A'}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg p-5 rounded-xl border border-white/10">
              <h3 className="text-sm font-medium text-gray-400">Recent Runs</h3>
              <p className="text-3xl font-bold text-green-300">{stats?.totalRuns || 0}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg p-5 rounded-xl border border-white/10">
              <h3 className="text-sm font-medium text-gray-400">Success Rate</h3>
              <p className="text-3xl font-bold text-orange-300">
                {stats?.successRate ? Math.round(stats.successRate * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Recent Runs */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-gray-200">Recent AI Runs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Start Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Output Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {stats?.recentRuns?.map((run, index) => (
                    <tr key={run.id} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-200">{run.name}</div>
                        <div className="text-sm text-gray-400">{run.id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          run.error ? 'bg-red-500/20 text-red-300' :
                          run.status === 'success' ? 'bg-green-500/20 text-green-300' :
                          'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {run.error ? 'Error' : (run.status || 'Running')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatTime(run.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDuration(run.startTime, run.endTime)}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-gray-300 truncate">
                          {run.error ? (
                            <span className="text-red-300">{run.error}</span>
                          ) : run.outputs?.output ? (
                            run.outputs.output.substring(0, 50) + (run.outputs.output.length > 50 ? '...' : '')
                          ) : (
                            'No output'
                          )}
                        </div>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        No recent runs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configuration Info */}
          {health && (
            <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Configuration Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-400">Status:</span>
                  <span className={`ml-2 ${health.status === 'healthy' ? 'text-green-300' : 'text-red-300'}`}>
                    {health.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-400">Configured:</span>
                  <span className={`ml-2 ${health.configured ? 'text-green-300' : 'text-red-300'}`}>
                    {health.configured ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-400">Message:</span>
                  <span className="ml-2 text-gray-300">{health.message}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-400">Last Check:</span>
                  <span className="ml-2 text-gray-300">{formatTime(health.timestamp)}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}


      {activeTab === 'flows' && (
        <ConversationFlowAnalysis />
      )}

      {activeTab === 'roi' && (
        <ROIDashboard />
      )}

      {activeTab === 'patterns' && (
        <PatternOptimization />
      )}
    </div>
  );
};

export default LangSmithDashboard;