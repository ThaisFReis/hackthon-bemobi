import React, { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  Line
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, Target } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ROIAnalysis {
  period: string;
  costs: {
    aiOperations: number;
    infrastructure: number;
    development: number;
    total: number;
  };
  benefits: {
    revenueRecovered: number;
    customerRetention: number;
    operationalSavings: number;
    total: number;
  };
  roi: number;
  paybackPeriod: number;
  projectedAnnualBenefit: number;
}

interface BusinessMetric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  unit: string;
}

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: number;
}

interface ROITrend {
  month: string;
  roi: number;
  totalBenefit: number;
  totalCost: number;
  netBenefit: number;
}

const ROIDashboard: React.FC = () => {
  const [roiData, setRoiData] = useState<ROIAnalysis | null>(null);
  const [roiTrends, setRoiTrends] = useState<ROITrend[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetric[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '12m'>('90d');

  useEffect(() => {
    fetchROIData();
  }, [timeRange]);

  const fetchROIData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '12m':
          startDate.setMonth(startDate.getMonth() - 12);
          break;
      }

      const response = await fetch(
        `https://hackthon-bemobi-1.onrender.com1/api/analytics/roi?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setRoiData(data.data);
      }

      // Mock data for demonstration
      setRoiTrends([
        { month: 'Jan', roi: 120, totalBenefit: 50000, totalCost: 22000, netBenefit: 28000 },
        { month: 'Feb', roi: 135, totalBenefit: 62000, totalCost: 25000, netBenefit: 37000 },
        { month: 'Mar', roi: 150, totalBenefit: 75000, totalCost: 28000, netBenefit: 47000 },
        { month: 'Apr', roi: 165, totalBenefit: 85000, totalCost: 30000, netBenefit: 55000 },
        { month: 'May', roi: 180, totalBenefit: 95000, totalCost: 32000, netBenefit: 63000 },
        { month: 'Jun', roi: 195, totalBenefit: 105000, totalCost: 35000, netBenefit: 70000 }
      ]);

      setBusinessMetrics([
        {
          name: 'Customer Retention Rate',
          value: 87.5,
          change: 12.3,
          trend: 'up',
          target: 90,
          unit: '%'
        },
        {
          name: 'Revenue Recovery Rate',
          value: 73.2,
          change: 8.7,
          trend: 'up',
          target: 80,
          unit: '%'
        },
        {
          name: 'Average Resolution Time',
          value: 8.5,
          change: -15.2,
          trend: 'up',
          target: 7,
          unit: 'min'
        },
        {
          name: 'Customer Satisfaction',
          value: 4.2,
          change: 5.1,
          trend: 'up',
          target: 4.5,
          unit: '/5'
        },
        {
          name: 'Cost Per Resolution',
          value: 12.50,
          change: -22.8,
          trend: 'up',
          target: 10,
          unit: '$'
        },
        {
          name: 'Automation Rate',
          value: 92.1,
          change: 18.4,
          trend: 'up',
          target: 95,
          unit: '%'
        }
      ]);

      setCostBreakdown([
        { category: 'AI Operations', amount: 8500, percentage: 35, trend: 5.2 },
        { category: 'Infrastructure', amount: 6200, percentage: 26, trend: -2.1 },
        { category: 'Development', amount: 4800, percentage: 20, trend: 12.8 },
        { category: 'Monitoring & Support', amount: 2900, percentage: 12, trend: 3.5 },
        { category: 'Training & Optimization', amount: 1600, percentage: 7, trend: -8.3 }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching ROI data:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getMetricIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'customer retention rate':
      case 'customer satisfaction':
        return Users;
      case 'revenue recovery rate':
      case 'cost per resolution':
        return DollarSign;
      case 'average resolution time':
        return Clock;
      case 'automation rate':
        return Target;
      default:
        return TrendingUp;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-300">Loading ROI analysis...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h2 className="text-3xl font-bold text-white">ROI & Business Impact</h2>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          {(['30d', '90d', '12m'] as const).map((range) => (
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

      {/* ROI Summary Cards */}
      {roiData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-lg p-6 rounded-xl border border-green-400/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-green-200">Total ROI</h3>
                <p className="text-3xl font-bold text-green-300">{formatPercentage(roiData.roi)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-lg p-6 rounded-xl border border-blue-400/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-200">Total Benefits</h3>
                <p className="text-3xl font-bold text-blue-300">{formatCurrency(roiData.benefits.total)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-lg p-6 rounded-xl border border-purple-400/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-purple-200">Payback Period</h3>
                <p className="text-3xl font-bold text-purple-300">{roiData.paybackPeriod.toFixed(1)} mo</p>
              </div>
              <Clock className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 backdrop-blur-lg p-6 rounded-xl border border-yellow-400/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-200">Annual Projection</h3>
                <p className="text-3xl font-bold text-yellow-300">{formatCurrency(roiData.projectedAnnualBenefit)}</p>
              </div>
              <Target className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* ROI Trends */}
      <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">ROI Trends Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={roiTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis yAxisId="roi" orientation="left" stroke="#9CA3AF" />
            <YAxis yAxisId="amount" orientation="right" stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              formatter={(value: any, name: string) => {
                if (name === 'ROI') return [formatPercentage(value), name];
                return [formatCurrency(value), name];
              }}
            />
            <Legend />
            <Area
              yAxisId="amount"
              type="monotone"
              dataKey="totalBenefit"
              fill="#10B981"
              fillOpacity={0.3}
              stroke="#10B981"
              name="Total Benefits"
            />
            <Area
              yAxisId="amount"
              type="monotone"
              dataKey="totalCost"
              fill="#EF4444"
              fillOpacity={0.3}
              stroke="#EF4444"
              name="Total Costs"
            />
            <Line
              yAxisId="roi"
              type="monotone"
              dataKey="roi"
              stroke="#8B5CF6"
              strokeWidth={3}
              name="ROI (%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Business Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businessMetrics.map((metric) => {
          const Icon = getMetricIcon(metric.name);
          return (
            <div key={metric.name} className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <Icon className="h-6 w-6 text-blue-400" />
                <span className={`flex items-center text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {metric.trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {formatPercentage(Math.abs(metric.change))}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">{metric.name}</h3>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">
                  {metric.unit === '%' ? formatPercentage(metric.value) :
                   metric.unit === '$' ? formatCurrency(metric.value) :
                   `${metric.value}${metric.unit}`}
                </span>
                {metric.target && (
                  <span className="text-sm text-gray-400">
                    Target: {metric.unit === '%' ? formatPercentage(metric.target) :
                             metric.unit === '$' ? formatCurrency(metric.target) :
                             `${metric.target}${metric.unit}`}
                  </span>
                )}
              </div>
              {metric.target && (
                <div className="mt-3 bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      metric.value >= metric.target ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cost Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown Pie Chart */}
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={costBreakdown as any}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {costBreakdown.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => [formatCurrency(value), 'Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Trends */}
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Cost Category Trends</h3>
          <div className="space-y-4">
            {costBreakdown.map((cost, index) => (
              <div key={cost.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-gray-300">{cost.category}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-300">{formatCurrency(cost.amount)}</span>
                  <span className={`text-sm font-medium ${
                    cost.trend > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {cost.trend > 0 ? '+' : ''}{formatPercentage(cost.trend)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits vs Costs Comparison */}
      {roiData && (
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Benefits vs Costs Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Benefits Breakdown */}
            <div>
              <h4 className="text-md font-semibold text-gray-300 mb-3">Benefits Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Revenue Recovered</span>
                  <span className="text-green-300 font-medium">{formatCurrency(roiData.benefits.revenueRecovered)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Customer Retention Value</span>
                  <span className="text-green-300 font-medium">{formatCurrency(roiData.benefits.customerRetention)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Operational Savings</span>
                  <span className="text-green-300 font-medium">{formatCurrency(roiData.benefits.operationalSavings)}</span>
                </div>
                <div className="border-t border-gray-600 pt-2 flex justify-between items-center font-semibold">
                  <span className="text-gray-200">Total Benefits</span>
                  <span className="text-green-300">{formatCurrency(roiData.benefits.total)}</span>
                </div>
              </div>
            </div>

            {/* Costs Breakdown */}
            <div>
              <h4 className="text-md font-semibold text-gray-300 mb-3">Costs Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">AI Operations</span>
                  <span className="text-red-300 font-medium">{formatCurrency(roiData.costs.aiOperations)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Infrastructure</span>
                  <span className="text-red-300 font-medium">{formatCurrency(roiData.costs.infrastructure)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Development</span>
                  <span className="text-red-300 font-medium">{formatCurrency(roiData.costs.development)}</span>
                </div>
                <div className="border-t border-gray-600 pt-2 flex justify-between items-center font-semibold">
                  <span className="text-gray-200">Total Costs</span>
                  <span className="text-red-300">{formatCurrency(roiData.costs.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Benefit */}
          <div className="mt-6 p-4 bg-green-500/10 border border-green-400/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-200">Net Benefit</span>
              <span className="text-2xl font-bold text-green-300">
                {formatCurrency(roiData.benefits.total - roiData.costs.total)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ROIDashboard;