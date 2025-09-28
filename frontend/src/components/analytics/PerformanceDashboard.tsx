import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface PerformanceMetric {
  period: string;
  totalConversations: number;
  successRate: number;
  averageResolutionTime: number;
  tokenUsage: {
    total: number;
    average: number;
    cost: number;
  };
  revenueMetrics: {
    totalRecovered: number;
    averagePerConversation: number;
    roi: number;
  };
  customerSegments: Record<string, {
    conversations: number;
    successRate: number;
    averageValue: number;
  }>;
}

interface RealTimeMetrics {
  activeConversations: number;
  successRateToday: number;
  revenueRecoveredToday: number;
  averageResponseTime: number;
  queueHealth: string;
  alertsCount: number;
}


const PerformanceDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [realTimeData, setRealTimeData] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [alerts, setAlerts] = useState<Array<{
    type: 'warning' | 'critical';
    title: string;
    description: string;
    value: number;
    threshold: number;
  }>>([]);
  const [realtimePatterns, setRealtimePatterns] = useState<any>(null);

  useEffect(() => {
    fetchAnalyticsData();
    fetchRealTimeData();
    fetchRealtimePatterns();

    // Set up real-time updates
    const interval = setInterval(() => {
      fetchRealTimeData();
      fetchRealtimePatterns();
    }, 30000);

    // Set up Server-Sent Events for real-time monitoring
    const eventSource = new EventSource('https://hackthon-bemobi-1.onrender.com/api/analytics/monitor/subscribe');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update') {
          setRealTimeData(data.data);
          setAlerts(data.data.alerts || []);
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const response = await fetch(
        `https://hackthon-bemobi-1.onrender.com/api/analytics/performance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&granularity=day`
      );

      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch('https://hackthon-bemobi-1.onrender.com/api/analytics/realtime');
      if (response.ok) {
        const data = await response.json();
        setRealTimeData(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setLoading(false);
    }
  };

  const fetchRealtimePatterns = async () => {
    try {
      const response = await fetch('https://hackthon-bemobi-1.onrender.com/api/analytics/patterns/realtime');
      if (response.ok) {
        const data = await response.json();
        setRealtimePatterns(data.data);
      }
    } catch (error) {
      console.error('Error fetching realtime patterns:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Prepare chart data
  const successRateData = performanceData.map(item => ({
    date: formatDate(item.period),
    successRate: item.successRate,
    conversations: item.totalConversations
  }));

  const revenueData = performanceData.map(item => ({
    date: formatDate(item.period),
    revenue: item.revenueMetrics.totalRecovered,
    roi: item.revenueMetrics.roi
  }));

  const tokenUsageData = performanceData.map(item => ({
    date: formatDate(item.period),
    tokens: item.tokenUsage.total,
    cost: item.tokenUsage.cost
  }));

  // Aggregate customer segments data
  const segmentData = performanceData.length > 0 ? Object.entries(
    performanceData[performanceData.length - 1].customerSegments
  ).map(([segment, data]) => ({
    name: segment.replace('_', ' ').toUpperCase(),
    conversations: data.conversations,
    successRate: data.successRate,
    value: data.averageValue
  })) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-300">Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Performance Analytics</h2>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          {(['24h', '7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-500/50 text-white border border-blue-400/50'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              alert.type === 'critical'
                ? 'bg-red-500/10 border-red-500 text-red-300'
                : 'bg-yellow-500/10 border-yellow-500 text-yellow-300'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{alert.title}</h4>
                  <p className="text-sm opacity-80">{alert.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{alert.value.toFixed(1)}</div>
                  <div className="text-xs">Threshold: {alert.threshold}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Real-time metrics cards */}
      {realTimeData && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10">
            <h3 className="text-sm font-medium text-gray-400">Active Chats</h3>
            <p className="text-2xl font-bold text-blue-300">{realTimeData.activeConversations}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10">
            <h3 className="text-sm font-medium text-gray-400">Success Rate Today</h3>
            <p className="text-2xl font-bold text-green-300">
              {formatPercentage(realTimeData.successRateToday)}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10">
            <h3 className="text-sm font-medium text-gray-400">Revenue Today</h3>
            <p className="text-2xl font-bold text-yellow-300">
              {formatCurrency(realTimeData.revenueRecoveredToday)}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10">
            <h3 className="text-sm font-medium text-gray-400">Avg Response Time</h3>
            <p className="text-2xl font-bold text-purple-300">
              {realTimeData.averageResponseTime.toFixed(1)}s
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10">
            <h3 className="text-sm font-medium text-gray-400">Queue Health</h3>
            <p className={`text-2xl font-bold ${
              realTimeData.queueHealth === 'healthy' ? 'text-green-300' : 'text-red-300'
            }`}>
              {realTimeData.queueHealth}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg p-4 rounded-xl border border-white/10">
            <h3 className="text-sm font-medium text-gray-400">Alerts</h3>
            <p className={`text-2xl font-bold ${
              realTimeData.alertsCount === 0 ? 'text-green-300' : 'text-red-300'
            }`}>
              {realTimeData.alertsCount}
            </p>
          </div>
        </div>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Rate Trend */}
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Success Rate & Conversations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={successRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis yAxisId="rate" domain={[0, 100]} stroke="#9CA3AF" />
              <YAxis yAxisId="count" orientation="right" stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                yAxisId="rate"
                type="monotone"
                dataKey="successRate"
                stroke="#10B981"
                strokeWidth={2}
                name="Success Rate (%)"
              />
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="conversations"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Conversations"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue & ROI */}
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Revenue Recovery & ROI</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis yAxisId="revenue" stroke="#9CA3AF" />
              <YAxis yAxisId="roi" orientation="right" stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Revenue') return formatCurrency(value);
                  if (name === 'ROI') return formatPercentage(value);
                  return value;
                }}
              />
              <Legend />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.3}
                name="Revenue"
              />
              <Line
                yAxisId="roi"
                type="monotone"
                dataKey="roi"
                stroke="#EF4444"
                strokeWidth={2}
                name="ROI (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Token Usage & Costs */}
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">AI Token Usage & Costs</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tokenUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis yAxisId="tokens" stroke="#9CA3AF" />
              <YAxis yAxisId="cost" orientation="right" stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'Cost') return formatCurrency(value);
                  return value.toLocaleString();
                }}
              />
              <Legend />
              <Bar
                yAxisId="tokens"
                dataKey="tokens"
                fill="#8B5CF6"
                name="Tokens"
              />
              <Bar
                yAxisId="cost"
                dataKey="cost"
                fill="#EC4899"
                name="Cost"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Segments */}
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Customer Segments Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, conversations }) => `${name}: ${conversations}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="conversations"
              >
                {segmentData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'conversations') return `${value} conversations`;
                  return value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed segments table */}
      {segmentData.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-gray-200">Customer Segment Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Segment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Conversations</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Success Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Avg Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {segmentData.map((segment) => (
                  <tr key={segment.name} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                      {segment.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {segment.conversations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        segment.successRate >= 80 ? 'bg-green-500/20 text-green-300' :
                        segment.successRate >= 60 ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {formatPercentage(segment.successRate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatCurrency(segment.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className={`w-3 h-3 rounded-full ${
                        segment.successRate >= 80 ? 'bg-green-400' :
                        segment.successRate >= 60 ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`}></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Real-time patterns */}
      {realtimePatterns && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Trends */}
          <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Hourly Success Trends (Today)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={realtimePatterns.hourlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="successRate"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Success Rate (%)"
                />
                <Line
                  type="monotone"
                  dataKey="conversations"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Conversations"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Emerging Patterns */}
          <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Emerging Patterns</h3>
            <div className="space-y-3">
              {realtimePatterns.emergingPatterns?.map((pattern: any, index: number) => (
                <div key={index} className="bg-white/5 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-200 font-medium">{pattern.pattern}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pattern.impact === 'positive' ? 'bg-green-500/20 text-green-300' :
                      pattern.impact === 'high_revenue' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {pattern.impact.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Frequency: {pattern.frequency} occurrences
                  </div>
                </div>
              ))}
              {(!realtimePatterns.emergingPatterns || realtimePatterns.emergingPatterns.length === 0) && (
                <div className="text-center text-gray-400 py-4">
                  No significant patterns detected yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;