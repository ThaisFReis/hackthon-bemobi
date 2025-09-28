import React, { useState, useEffect } from 'react';
import {
  FunnelChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  PieChart,
  Pie
} from 'recharts';

interface FlowStep {
  name: string;
  value: number;
  fill: string;
  dropoffRate?: number;
}

interface ConversationPattern {
  pattern: string;
  frequency: number;
  outcome: string;
  averageMessages: number;
  successRate: number;
}

interface DropoffAnalysis {
  step: string;
  totalReached: number;
  dropped: number;
  continued: number;
  dropoffRate: number;
}

interface PatternAnalysis {
  successFactors: string[];
  failurePatterns: string[];
  optimalContactTimes: number[];
  effectivePrompts: Array<{
    prompt: string;
    successRate: number;
    usageCount: number;
  }>;
  customerResponsePatterns: Array<{
    pattern: string;
    frequency: number;
    outcome: string;
  }>;
}


const ConversationFlowAnalysis: React.FC = () => {
  const [flowData, setFlowData] = useState<FlowStep[]>([]);
  const [patterns, setPatterns] = useState<PatternAnalysis | null>(null);
  const [dropoffData, setDropoffData] = useState<DropoffAnalysis[]>([]);
  const [conversationPatterns, setConversationPatterns] = useState<ConversationPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchFlowAnalysisData();
  }, [timeRange]);

  const fetchFlowAnalysisData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
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

      // Fetch pattern analysis
      const patternsResponse = await fetch(
        `https://hackthon-bemobi-1.onrender.com1/api/analytics/patterns?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (patternsResponse.ok) {
        const patternsData = await patternsResponse.json();
        setPatterns(patternsData.data);
      }

      // Mock conversation flow data - in reality this would come from the analytics API
      setFlowData([
        { name: 'Initial Contact', value: 1000, fill: '#8884d8' },
        { name: 'Engagement', value: 850, fill: '#82ca9d', dropoffRate: 15 },
        { name: 'Issue Recognition', value: 720, fill: '#ffc658', dropoffRate: 15.3 },
        { name: 'Solution Discussion', value: 580, fill: '#ff7300', dropoffRate: 19.4 },
        { name: 'Payment Agreement', value: 420, fill: '#d084d0', dropoffRate: 27.6 },
        { name: 'Payment Completed', value: 320, fill: '#82ca9d', dropoffRate: 23.8 }
      ]);

      // Mock dropoff analysis
      setDropoffData([
        { step: 'Initial Contact', totalReached: 1000, dropped: 150, continued: 850, dropoffRate: 15 },
        { step: 'Engagement', totalReached: 850, dropped: 130, continued: 720, dropoffRate: 15.3 },
        { step: 'Issue Recognition', totalReached: 720, dropped: 140, continued: 580, dropoffRate: 19.4 },
        { step: 'Solution Discussion', totalReached: 580, dropped: 160, continued: 420, dropoffRate: 27.6 },
        { step: 'Payment Agreement', totalReached: 420, dropped: 100, continued: 320, dropoffRate: 23.8 }
      ]);

      // Mock conversation patterns
      setConversationPatterns([
        {
          pattern: 'Quick Agreement',
          frequency: 180,
          outcome: 'success',
          averageMessages: 3.2,
          successRate: 92.5
        },
        {
          pattern: 'Price Negotiation',
          frequency: 145,
          outcome: 'mixed',
          averageMessages: 8.7,
          successRate: 65.8
        },
        {
          pattern: 'Technical Questions',
          frequency: 95,
          outcome: 'success',
          averageMessages: 5.8,
          successRate: 78.9
        },
        {
          pattern: 'Immediate Rejection',
          frequency: 85,
          outcome: 'failure',
          averageMessages: 1.5,
          successRate: 12.3
        },
        {
          pattern: 'Multiple Objections',
          frequency: 67,
          outcome: 'failure',
          averageMessages: 12.4,
          successRate: 28.4
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching flow analysis data:', error);
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getPatternColor = (outcome: string) => {
    switch (outcome) {
      case 'success': return '#10B981';
      case 'mixed': return '#F59E0B';
      case 'failure': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-300">Loading conversation flow analysis...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Conversation Flow Analysis</h2>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          {(['7d', '30d', '90d'] as const).map((range) => (
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

      {/* Conversion Funnel */}
      <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Conversation Conversion Funnel</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={400}>
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => [
                  `${value} customers`,
                  name
                ]}
              />
              <Funnel
                dataKey="value"
                data={flowData}
                isAnimationActive
              >
                <LabelList position="center" fill="#fff" stroke="none" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>

          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-300">Step Analysis</h4>
            {flowData.map((step) => (
              <div key={step.name} className="bg-white/5 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-200 font-medium">{step.name}</span>
                  <span className="text-gray-300">{step.value} customers</span>
                </div>
                {step.dropoffRate && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Drop-off rate:</span>
                    <span className={`font-medium ${
                      step.dropoffRate > 25 ? 'text-red-300' :
                      step.dropoffRate > 15 ? 'text-yellow-300' :
                      'text-green-300'
                    }`}>
                      {formatPercentage(step.dropoffRate)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drop-off Analysis */}
      <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Drop-off Points Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dropoffData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="step" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="continued" stackId="a" fill="#10B981" name="Continued" />
            <Bar dataKey="dropped" stackId="a" fill="#EF4444" name="Dropped" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversation Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pattern Distribution */}
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Conversation Patterns</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={conversationPatterns as any}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ pattern, frequency }) => `${pattern}: ${frequency}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="frequency"
              >
                {conversationPatterns.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getPatternColor(entry.outcome)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pattern Success Rates */}
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Pattern Success Rates</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversationPatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="pattern" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => [`${value}%`, 'Success Rate']}
              />
              <Bar
                dataKey="successRate"
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Success & Failure Factors */}
      {patterns && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Success Factors */}
          <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Success Factors</h3>
            <div className="space-y-3">
              {patterns.successFactors.map((factor, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Failure Patterns */}
          <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Common Failure Patterns</h3>
            <div className="space-y-3">
              {patterns.failurePatterns.map((pattern, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-gray-300">{pattern}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Pattern Analysis Table */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-gray-200">Detailed Pattern Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Pattern</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Avg Messages</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Success Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {conversationPatterns.map((pattern) => (
                <tr key={pattern.pattern} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                    {pattern.pattern}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {pattern.frequency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {pattern.averageMessages.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pattern.successRate >= 80 ? 'bg-green-500/20 text-green-300' :
                      pattern.successRate >= 50 ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {formatPercentage(pattern.successRate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className={`w-3 h-3 rounded-full ${
                      pattern.outcome === 'success' ? 'bg-green-400' :
                      pattern.outcome === 'mixed' ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`}></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optimal Contact Times */}
      {patterns && patterns.optimalContactTimes.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Optimal Contact Times</h3>
          <div className="grid grid-cols-3 gap-4">
            {patterns.optimalContactTimes.map((hour, index) => (
              <div key={hour} className="text-center">
                <div className="text-2xl font-bold text-blue-300">
                  {hour}:00 - {hour + 1}:00
                </div>
                <div className="text-sm text-gray-400">
                  Peak Success Window #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationFlowAnalysis;