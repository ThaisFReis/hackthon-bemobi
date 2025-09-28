import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import { Brain, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react';

interface PromptVariant {
  id: string;
  name: string;
  template: string;
  successRate: number;
  usageCount: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  isActive: boolean;
  createdAt: string;
}

interface ABTestResult {
  variantA: string;
  variantB: string;
  conversionRateA: number;
  conversionRateB: number;
  sampleSizeA: number;
  sampleSizeB: number;
  confidenceLevel: number;
  statisticalSignificance: boolean;
  winner: 'A' | 'B' | 'inconclusive';
  improvementPercentage: number;
}

interface OptimizationInsight {
  type: 'success' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  confidence: number;
}

interface PerformanceFactors {
  factor: string;
  impact: number;
  correlation: number;
  priority: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PatternOptimization: React.FC = () => {
  const [promptVariants, setPromptVariants] = useState<PromptVariant[]>([]);
  const [abTestResults, setAbTestResults] = useState<ABTestResult[]>([]);
  const [insights, setInsights] = useState<OptimizationInsight[]>([]);
  const [performanceFactors, setPerformanceFactors] = useState<PerformanceFactors[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOptimizationData();
  }, []);

  const fetchOptimizationData = async () => {
    try {
      // Mock data - in reality this would come from the analytics API
      setPromptVariants([
        {
          id: 'prompt_1',
          name: 'Empathetic Approach',
          template: 'Olá {name}! Entendemos que situações financeiras podem ser desafiadoras...',
          successRate: 87.5,
          usageCount: 245,
          avgResponseTime: 2.3,
          customerSatisfaction: 4.2,
          isActive: true,
          createdAt: '2024-01-15'
        },
        {
          id: 'prompt_2',
          name: 'Direct Payment Focus',
          template: 'Oi {name}! Temos uma pendência no seu pagamento que precisa ser resolvida...',
          successRate: 73.2,
          usageCount: 189,
          avgResponseTime: 1.8,
          customerSatisfaction: 3.8,
          isActive: true,
          createdAt: '2024-01-20'
        },
        {
          id: 'prompt_3',
          name: 'Solution-Oriented',
          template: 'Olá {name}! Vamos resolver juntos a questão do seu pagamento de forma rápida...',
          successRate: 91.3,
          usageCount: 156,
          avgResponseTime: 2.1,
          customerSatisfaction: 4.5,
          isActive: true,
          createdAt: '2024-02-01'
        },
        {
          id: 'prompt_4',
          name: 'Benefit Highlight',
          template: 'Oi {name}! Para manter todos os benefícios do seu plano ativo...',
          successRate: 68.9,
          usageCount: 98,
          avgResponseTime: 2.5,
          customerSatisfaction: 3.9,
          isActive: false,
          createdAt: '2024-01-10'
        }
      ]);

      setAbTestResults([
        {
          variantA: 'Empathetic Approach',
          variantB: 'Solution-Oriented',
          conversionRateA: 87.5,
          conversionRateB: 91.3,
          sampleSizeA: 245,
          sampleSizeB: 156,
          confidenceLevel: 95,
          statisticalSignificance: true,
          winner: 'B',
          improvementPercentage: 4.3
        },
        {
          variantA: 'Direct Payment Focus',
          variantB: 'Empathetic Approach',
          conversionRateA: 73.2,
          conversionRateB: 87.5,
          sampleSizeA: 189,
          sampleSizeB: 245,
          confidenceLevel: 99,
          statisticalSignificance: true,
          winner: 'B',
          improvementPercentage: 19.5
        }
      ]);

      setInsights([
        {
          type: 'success',
          title: 'High-Performing Prompt Identified',
          description: 'Solution-Oriented approach shows 91.3% success rate with high customer satisfaction',
          impact: 'high',
          actionable: true,
          confidence: 95
        },
        {
          type: 'opportunity',
          title: 'Response Time Optimization',
          description: 'Reducing response time by 0.3s could improve success rate by 8-12%',
          impact: 'medium',
          actionable: true,
          confidence: 78
        },
        {
          type: 'warning',
          title: 'Underperforming Segment',
          description: 'Benefit Highlight prompt shows declining performance in telecom segment',
          impact: 'medium',
          actionable: true,
          confidence: 82
        },
        {
          type: 'opportunity',
          title: 'Peak Performance Window',
          description: 'Conversations between 2-4 PM show 15% higher success rates',
          impact: 'high',
          actionable: true,
          confidence: 91
        }
      ]);

      setPerformanceFactors([
        { factor: 'Response Speed', impact: 85, correlation: 0.78, priority: 1 },
        { factor: 'Personalization', impact: 92, correlation: 0.82, priority: 1 },
        { factor: 'Empathy Level', impact: 88, correlation: 0.75, priority: 2 },
        { factor: 'Solution Focus', impact: 90, correlation: 0.80, priority: 1 },
        { factor: 'Timing', impact: 76, correlation: 0.65, priority: 3 },
        { factor: 'Message Length', impact: 72, correlation: 0.58, priority: 3 }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching optimization data:', error);
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'opportunity': return Target;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'opportunity': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-300">Loading optimization analysis...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Pattern Analysis & Optimization</h2>
        <button className="mt-4 sm:mt-0 px-4 py-2 bg-purple-500/50 text-white rounded-lg hover:bg-purple-500/80 border border-purple-400/50 transition">
          <Zap className="inline h-4 w-4 mr-2" />
          Auto-Optimize
        </button>
      </div>

      {/* AI Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const Icon = getInsightIcon(insight.type);
          return (
            <div key={index} className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
              <div className="flex items-start space-x-4">
                <Icon className={`h-6 w-6 mt-1 ${getInsightColor(insight.type)}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-200">{insight.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      insight.impact === 'high' ? 'bg-red-500/20 text-red-300' :
                      insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-gray-300 mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Confidence: {insight.confidence}%
                    </span>
                    {insight.actionable && (
                      <button className="text-sm text-blue-400 hover:text-blue-300">
                        Take Action →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prompt Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Rate Comparison */}
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Prompt Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={promptVariants}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => [
                  `${value}%`,
                  'Success Rate'
                ]}
              />
              <Bar dataKey="successRate" fill="#8884d8" radius={[4, 4, 0, 0]}>
                {promptVariants.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isActive ? '#10B981' : '#6B7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Satisfaction vs Success Rate */}
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Satisfaction vs Success Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={promptVariants}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                dataKey="successRate"
                name="Success Rate"
                unit="%"
                stroke="#9CA3AF"
              />
              <YAxis
                type="number"
                dataKey="customerSatisfaction"
                name="Customer Satisfaction"
                unit="/5"
                stroke="#9CA3AF"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => [
                  name === 'successRate' ? `${value}%` : `${value}/5`,
                  name === 'successRate' ? 'Success Rate' : 'Customer Satisfaction'
                ]}
              />
              <Scatter dataKey="customerSatisfaction" fill="#8884d8">
                {promptVariants.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Factors Radar Chart */}
      <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Key Performance Factors</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={performanceFactors}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="factor" stroke="#9CA3AF" />
              <PolarRadiusAxis stroke="#9CA3AF" />
              <Radar
                name="Impact Score"
                dataKey="impact"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.3}
              />
              <Radar
                name="Correlation"
                dataKey="correlation"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.2}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>

          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-300">Factor Analysis</h4>
            {performanceFactors
              .sort((a, b) => a.priority - b.priority)
              .map((factor) => (
                <div key={factor.factor} className="bg-white/5 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-200 font-medium">{factor.factor}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      factor.priority === 1 ? 'bg-red-500/20 text-red-300' :
                      factor.priority === 2 ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      Priority {factor.priority}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Impact: {factor.impact}/100</span>
                    <span>Correlation: {factor.correlation.toFixed(2)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* A/B Test Results */}
      <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">A/B Test Results</h3>
        <div className="space-y-4">
          {abTestResults.map((test, index) => (
            <div key={index} className="bg-white/5 p-6 rounded-lg">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Test Overview */}
                <div className="lg:col-span-1">
                  <h4 className="text-md font-semibold text-gray-300 mb-3">
                    {test.variantA} vs {test.variantB}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Winner:</span>
                      <span className={`font-medium ${
                        test.winner === 'A' ? 'text-blue-300' :
                        test.winner === 'B' ? 'text-green-300' :
                        'text-yellow-300'
                      }`}>
                        {test.winner === 'A' ? test.variantA :
                         test.winner === 'B' ? test.variantB :
                         'Inconclusive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Improvement:</span>
                      <span className="text-green-300">+{test.improvementPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Confidence:</span>
                      <span className="text-gray-300">{test.confidenceLevel}%</span>
                    </div>
                  </div>
                </div>

                {/* Conversion Rates */}
                <div className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart
                      data={[
                        {
                          name: test.variantA,
                          rate: test.conversionRateA,
                          samples: test.sampleSizeA
                        },
                        {
                          name: test.variantB,
                          rate: test.conversionRateB,
                          samples: test.sampleSizeB
                        }
                      ]}
                      layout="horizontal"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" />
                      <YAxis type="category" dataKey="name" stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => [
                          `${value}%`,
                          'Conversion Rate'
                        ]}
                      />
                      <Bar dataKey="rate" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {test.statisticalSignificance && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-green-300 font-medium">
                      Statistically Significant Result
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Details Table */}
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-gray-200">Detailed Prompt Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Prompt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Success Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Usage Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Avg Response Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Satisfaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {promptVariants.map((prompt) => (
                <tr key={prompt.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-200">{prompt.name}</div>
                    <div className="text-sm text-gray-400 max-w-xs truncate">
                      {prompt.template}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      prompt.successRate >= 85 ? 'bg-green-500/20 text-green-300' :
                      prompt.successRate >= 75 ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {prompt.successRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {prompt.usageCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {prompt.avgResponseTime}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {prompt.customerSatisfaction}/5
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className={`w-3 h-3 rounded-full ${
                      prompt.isActive ? 'bg-green-400' : 'bg-gray-400'
                    }`}></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatternOptimization;