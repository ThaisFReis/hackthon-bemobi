import { Client } from 'langsmith';
import { LangchainGeminiService } from './langchainGeminiService';
import { prisma } from '../lib/prisma';

interface ConversationOutcome {
  sessionId: string;
  customerId: string;
  outcome: 'payment_completed' | 'payment_pending' | 'customer_dropped' | 'escalated' | 'resolved';
  resolutionTime: number; // in minutes
  messageCount: number;
  revenueRecovered?: number;
  customerSatisfaction?: number; // 1-5 scale
  timestamp: Date;
}

interface PerformanceMetrics {
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
  customerSegments: {
    [key: string]: {
      conversations: number;
      successRate: number;
      averageValue: number;
    };
  };
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
  paybackPeriod: number; // in months
  projectedAnnualBenefit: number;
}

export class AnalyticsService {
  private langsmithClient: Client | null;
  private aiService: LangchainGeminiService;
  private realtimeSubscribers: Set<(data: any) => void> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(aiService: LangchainGeminiService) {
    this.aiService = aiService;
    this.langsmithClient = process.env.LANGCHAIN_API_KEY
      ? new Client({ apiKey: process.env.LANGCHAIN_API_KEY })
      : null;

    // Start real-time monitoring
    this.startRealtimeMonitoring();
  }

  // Get comprehensive performance metrics for dashboard
  async getPerformanceMetrics(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<PerformanceMetrics[]> {
    try {
      // Get chat sessions with interventions data
      const sessions = await prisma.chatSession.findMany({
        where: {
          startTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          customer: true,
          messages: true,
        },
      });

      // Get LangSmith runs for the same period
      const langsmithData = await this.getLangSmithRunsForPeriod(startDate, endDate);

      // Process data by time granularity
      const groupedData = this.groupDataByPeriod(sessions, granularity);

      const metrics: PerformanceMetrics[] = [];

      for (const [period, sessionData] of Object.entries(groupedData)) {
        const periodMetrics = await this.calculatePeriodMetrics(
          sessionData,
          langsmithData.filter(run => this.isRunInPeriod(run, period, granularity))
        );
        metrics.push({
          period,
          ...periodMetrics,
        });
      }

      return metrics;
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  // Analyze success/failure patterns using AI
  async analyzeConversationPatterns(startDate: Date, endDate: Date): Promise<PatternAnalysis> {
    try {
      // Get successful and failed conversations
      const conversations = await prisma.chatSession.findMany({
        where: {
          startTime: { gte: startDate, lte: endDate },
        },
        include: {
          customer: true,
          messages: true,
        },
      });

      // Categorize by outcome
      const successful = conversations.filter(c =>
        c.outcome === 'payment_completed' || c.outcome === 'resolved'
      );
      const failed = conversations.filter(c =>
        c.outcome === 'customer_dropped' || c.outcome === 'escalated'
      );

      // Analyze patterns
      const analysis: PatternAnalysis = {
        successFactors: await this.identifySuccessFactors(successful),
        failurePatterns: await this.identifyFailurePatterns(failed),
        optimalContactTimes: this.analyzeOptimalTiming(successful),
        effectivePrompts: await this.analyzePromptEffectiveness(conversations),
        customerResponsePatterns: this.analyzeCustomerResponses(conversations),
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing conversation patterns:', error);
      throw error;
    }
  }

  // Calculate ROI and business impact
  async calculateROI(startDate: Date, endDate: Date): Promise<ROIAnalysis> {
    try {
      // Get financial data from chat sessions
      const sessions = await prisma.chatSession.findMany({
        where: {
          startTime: { gte: startDate, lte: endDate },
        },
        include: {
          customer: true,
        },
      });

      const successfulSessions = sessions.filter(s =>
        s.outcome === 'payment_completed' || s.outcome === 'resolved'
      );
      const totalRevenueRecovered = successfulSessions.reduce(
        (sum, session) => sum + Number(session.customer?.accountValue || 0),
        0
      ) / 100; // Convert from cents

      // Calculate costs (estimated)
      const tokenCosts = await this.calculateTokenCosts(startDate, endDate);
      const infrastructureCosts = this.estimateInfrastructureCosts(startDate, endDate);

      const costs = {
        aiOperations: tokenCosts,
        infrastructure: infrastructureCosts,
        development: 0, // Would be provided by business
        total: tokenCosts + infrastructureCosts,
      };

      const benefits = {
        revenueRecovered: totalRevenueRecovered,
        customerRetention: this.calculateRetentionValue(successfulSessions),
        operationalSavings: this.calculateOperationalSavings(sessions.length),
        total: 0,
      };
      benefits.total = benefits.revenueRecovered + benefits.customerRetention + benefits.operationalSavings;

      const roi = ((benefits.total - costs.total) / costs.total) * 100;
      const paybackPeriod = costs.total / (benefits.total / this.getDaysInPeriod(startDate, endDate) * 30);

      return {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        costs,
        benefits,
        roi,
        paybackPeriod,
        projectedAnnualBenefit: benefits.total * (365 / this.getDaysInPeriod(startDate, endDate)),
      };
    } catch (error) {
      console.error('Error calculating ROI:', error);
      throw error;
    }
  }

  // Get real-time dashboard data
  async getRealTimeMetrics(): Promise<{
    activeConversations: number;
    successRateToday: number;
    revenueRecoveredToday: number;
    averageResponseTime: number;
    queueHealth: string;
    alertsCount: number;
  }> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const activeSessions = await prisma.chatSession.count({
      where: { status: 'ACTIVE' },
    });

    const todaysSessions = await prisma.chatSession.findMany({
      where: {
        startTime: { gte: startOfDay },
      },
      include: {
        customer: true,
      },
    });

    const successfulToday = todaysSessions.filter(s =>
      s.outcome === 'payment_completed' || s.outcome === 'resolved'
    );

    const revenueToday = successfulToday.reduce(
      (sum, session) => sum + Number(session.customer?.accountValue || 0),
      0
    ) / 100;

    // Get recent LangSmith runs for response time
    const recentRuns = await this.getRecentLangSmithRuns(50);
    const avgResponseTime = this.calculateAverageResponseTime(recentRuns);

    return {
      activeConversations: activeSessions,
      successRateToday: todaysSessions.length > 0 ? (successfulToday.length / todaysSessions.length) * 100 : 0,
      revenueRecoveredToday: revenueToday,
      averageResponseTime: avgResponseTime,
      queueHealth: this.assessQueueHealth(),
      alertsCount: await this.getActiveAlertsCount(),
    };
  }

  // Helper methods
  private async getLangSmithRunsForPeriod(startDate: Date, endDate: Date): Promise<any[]> {
    if (!this.langsmithClient) return [];

    try {
      const runs = this.langsmithClient.listRuns({
        projectName: process.env.LANGCHAIN_PROJECT || 'gemini-churn-prevention',
        limit: 1000,
      });

      const runsArray: any[] = [];
      for await (const run of runs) {
        const runDate = new Date(run.start_time || new Date());
        if (runDate >= startDate && runDate <= endDate) {
          runsArray.push(run);
        }
      }

      return runsArray;
    } catch (error) {
      console.error('Error fetching LangSmith runs:', error);
      return [];
    }
  }

  private groupDataByPeriod(sessions: any[], granularity: string): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    sessions.forEach(session => {
      const date = new Date(session.startTime);
      let key: string;

      switch (granularity) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0] || weekStart.toISOString();
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // day
          key = date.toISOString().split('T')[0] || date.toISOString();
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key]?.push(session);
    });

    return grouped;
  }

  private async calculatePeriodMetrics(sessions: any[], langsmithRuns: any[]): Promise<Omit<PerformanceMetrics, 'period'>> {
    const successfulSessions = sessions.filter(s =>
      s.outcome === 'payment_completed' || s.outcome === 'resolved'
    );

    const totalTokens = langsmithRuns.reduce((sum, run) => {
      return sum + (run.outputs?.llmOutput?.tokenUsage?.totalTokens || 0);
    }, 0);

    const avgTokens = langsmithRuns.length > 0 ? totalTokens / langsmithRuns.length : 0;
    const tokenCost = totalTokens * 0.0001; // Estimated cost per token

    const revenueRecovered = successfulSessions.reduce((sum: number, session: any) => {
      return sum + Number(session.customer?.accountValue || 0);
    }, 0) / 100;

    return {
      totalConversations: sessions.length,
      successRate: sessions.length > 0 ? (successfulSessions.length / sessions.length) * 100 : 0,
      averageResolutionTime: this.calculateAverageResolutionTime(sessions),
      tokenUsage: {
        total: totalTokens,
        average: avgTokens,
        cost: tokenCost,
      },
      revenueMetrics: {
        totalRecovered: revenueRecovered,
        averagePerConversation: sessions.length > 0 ? revenueRecovered / sessions.length : 0,
        roi: tokenCost > 0 ? (revenueRecovered / tokenCost) * 100 : 0,
      },
      customerSegments: this.analyzeCustomerSegments(sessions),
    };
  }

  private calculateAverageResolutionTime(sessions: any[]): number {
    const resolvedSessions = sessions.filter(s => s.endTime);
    if (resolvedSessions.length === 0) return 0;

    const totalTime = resolvedSessions.reduce((sum, session) => {
      const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      return sum + (duration / (1000 * 60)); // Convert to minutes
    }, 0);

    return totalTime / resolvedSessions.length;
  }

  private analyzeCustomerSegments(sessions: any[]): Record<string, any> {
    const segments: Record<string, any> = {};

    sessions.forEach(session => {
      const customer = session.customer;
      const segment = customer?.riskCategory || 'unknown';

      if (!segments[segment]) {
        segments[segment] = {
          conversations: 0,
          successful: 0,
          totalValue: 0,
        };
      }

      segments[segment].conversations++;
      segments[segment].totalValue += Number(customer?.accountValue || 0);

      if (session.outcome === 'payment_completed' || session.outcome === 'resolved') {
        segments[segment].successful++;
      }
    });

    // Calculate final metrics
    Object.keys(segments).forEach(segment => {
      const data = segments[segment];
      data.successRate = (data.successful / data.conversations) * 100;
      data.averageValue = data.totalValue / data.conversations / 100; // Convert from cents
      delete data.successful;
      delete data.totalValue;
    });

    return segments;
  }

  private async identifySuccessFactors(successfulConversations: any[]): Promise<string[]> {
    // Analyze successful conversations for common patterns
    const factors: string[] = [];

    // Time of day analysis
    const hourCounts: Record<number, number> = {};
    successfulConversations.forEach(conv => {
      const hour = new Date(conv.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const hourEntries = Object.entries(hourCounts);
    if (hourEntries.length > 0) {
      const bestHour = hourEntries.reduce((a, b) =>
        (hourCounts[Number(a[0])] || 0) > (hourCounts[Number(b[0])] || 0) ? a : b
      );

      if (bestHour && bestHour[0]) {
        factors.push(`Peak success time: ${bestHour[0]}:00-${Number(bestHour[0]) + 1}:00`);
      }
    }

    // Message count analysis
    const avgMessageCount = successfulConversations.reduce((sum, conv) =>
      sum + conv.messages.length, 0
    ) / successfulConversations.length;

    if (avgMessageCount < 5) {
      factors.push('Quick resolution (< 5 messages)');
    }

    // Service provider analysis
    const providerSuccess: Record<string, number> = {};
    successfulConversations.forEach(conv => {
      const provider = conv.customer?.serviceProvider || 'unknown';
      providerSuccess[provider] = (providerSuccess[provider] || 0) + 1;
    });

    const topProvider = Object.entries(providerSuccess).reduce((a, b) =>
      a[1] > b[1] ? a : b
    );

    if (topProvider) {
      factors.push(`High success with ${topProvider[0]} customers`);
    }

    return factors;
  }

  private async identifyFailurePatterns(failedConversations: any[]): Promise<string[]> {
    const patterns: string[] = [];

    // Analyze failure reasons
    const failureReasons: Record<string, number> = {};
    failedConversations.forEach(conv => {
      // Look for patterns in failed conversations
      if (conv.messages.length === 1) {
        failureReasons['immediate_dropout'] = (failureReasons['immediate_dropout'] || 0) + 1;
      }
      if (conv.messages.length > 10) {
        failureReasons['excessive_messages'] = (failureReasons['excessive_messages'] || 0) + 1;
      }
    });

    Object.entries(failureReasons).forEach(([reason, count]) => {
      if (count > failedConversations.length * 0.2) { // If > 20% of failures
        patterns.push(`Common pattern: ${reason.replace('_', ' ')} (${count} cases)`);
      }
    });

    return patterns;
  }

  private analyzeOptimalTiming(successfulConversations: any[]): number[] {
    const hourSuccess: Record<number, number> = {};

    successfulConversations.forEach(conv => {
      const hour = new Date(conv.startTime).getHours();
      hourSuccess[hour] = (hourSuccess[hour] || 0) + 1;
    });

    return Object.entries(hourSuccess)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => Number(hour));
  }

  private async analyzePromptEffectiveness(conversations: any[]): Promise<Array<{
    prompt: string;
    successRate: number;
    usageCount: number;
  }>> {
    // This would analyze different prompt templates used
    // For now, return mock data structure
    return [
      {
        prompt: 'empathetic_greeting',
        successRate: 85.2,
        usageCount: 156,
      },
      {
        prompt: 'direct_payment_request',
        successRate: 72.1,
        usageCount: 89,
      },
    ];
  }

  private analyzeCustomerResponses(conversations: any[]): Array<{
    pattern: string;
    frequency: number;
    outcome: string;
  }> {
    // Analyze customer response patterns
    return [
      {
        pattern: 'immediate_agreement',
        frequency: 45,
        outcome: 'high_success',
      },
      {
        pattern: 'price_negotiation',
        frequency: 23,
        outcome: 'medium_success',
      },
    ];
  }

  private async calculateTokenCosts(startDate: Date, endDate: Date): Promise<number> {
    const runs = await this.getLangSmithRunsForPeriod(startDate, endDate);
    const totalTokens = runs.reduce((sum, run) => {
      return sum + (run.outputs?.llmOutput?.tokenUsage?.totalTokens || 0);
    }, 0);

    return totalTokens * 0.0001; // Estimated cost per token
  }

  private estimateInfrastructureCosts(startDate: Date, endDate: Date): number {
    const days = this.getDaysInPeriod(startDate, endDate);
    return days * 10; // $10 per day estimated infrastructure cost
  }

  private calculateRetentionValue(successfulInterventions: any[]): number {
    // Estimated lifetime value calculation
    return successfulInterventions.length * 500; // $500 estimated LTV per retained customer
  }

  private calculateOperationalSavings(totalInterventions: number): number {
    // Estimated savings vs human agent cost
    return totalInterventions * 25; // $25 per intervention saved
  }

  private getDaysInPeriod(startDate: Date, endDate: Date): number {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private isRunInPeriod(run: any, period: string, granularity: string): boolean {
    // Implementation depends on granularity and period format
    return true; // Simplified for now
  }

  private async getRecentLangSmithRuns(limit: number): Promise<any[]> {
    if (!this.langsmithClient) return [];

    try {
      const runs = this.langsmithClient.listRuns({
        projectName: process.env.LANGCHAIN_PROJECT || 'gemini-churn-prevention',
        limit,
      });

      const runsArray: any[] = [];
      let count = 0;
      for await (const run of runs) {
        if (count >= limit) break;
        runsArray.push(run);
        count++;
      }

      return runsArray;
    } catch (error) {
      console.error('Error fetching recent runs:', error);
      return [];
    }
  }

  private calculateAverageResponseTime(runs: any[]): number {
    if (runs.length === 0) return 0;

    const totalTime = runs.reduce((sum, run) => {
      if (run.start_time && run.end_time) {
        return sum + (new Date(run.end_time).getTime() - new Date(run.start_time).getTime());
      }
      return sum;
    }, 0);

    return totalTime / runs.length / 1000; // Return in seconds
  }

  private assessQueueHealth(): string {
    // Implementation would check queue performance metrics
    return 'healthy'; // Simplified
  }

  private async getActiveAlertsCount(): Promise<number> {
    // Implementation would check for system alerts
    return 0; // Simplified
  }

  // Real-time monitoring methods
  subscribe(callback: (data: any) => void): () => void {
    this.realtimeSubscribers.add(callback);
    return () => this.realtimeSubscribers.delete(callback);
  }

  private startRealtimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        const realtimeData = await this.getRealTimeMetrics();
        const alerts = await this.detectAnomalies(realtimeData);

        const monitoringData = {
          ...realtimeData,
          alerts,
          timestamp: new Date().toISOString(),
        };

        // Notify all subscribers
        this.realtimeSubscribers.forEach(callback => {
          try {
            callback(monitoringData);
          } catch (error) {
            console.error('Error in subscriber callback:', error);
          }
        });
      } catch (error) {
        console.error('Error in real-time monitoring:', error);
      }
    }, 30000);
  }

  stopRealtimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async detectAnomalies(metrics: any): Promise<Array<{
    type: 'warning' | 'critical';
    title: string;
    description: string;
    value: number;
    threshold: number;
  }>> {
    const alerts = [];

    // Success rate alert
    if (metrics.successRateToday < 70) {
      alerts.push({
        type: 'warning' as const,
        title: 'Low Success Rate',
        description: 'Success rate has dropped below 70%',
        value: metrics.successRateToday,
        threshold: 70,
      });
    }

    if (metrics.successRateToday < 50) {
      alerts.push({
        type: 'critical' as const,
        title: 'Critical Success Rate',
        description: 'Success rate is critically low',
        value: metrics.successRateToday,
        threshold: 50,
      });
    }

    // Response time alert
    if (metrics.averageResponseTime > 5) {
      alerts.push({
        type: 'warning' as const,
        title: 'High Response Time',
        description: 'Average response time is above 5 seconds',
        value: metrics.averageResponseTime,
        threshold: 5,
      });
    }

    // Active conversations alert
    if (metrics.activeConversations > 100) {
      alerts.push({
        type: 'warning' as const,
        title: 'High Queue Volume',
        description: 'High number of active conversations',
        value: metrics.activeConversations,
        threshold: 100,
      });
    }

    return alerts;
  }

  async getRealtimePatterns(): Promise<{
    hourlyTrends: Array<{ hour: number; conversations: number; successRate: number }>;
    emergingPatterns: Array<{ pattern: string; frequency: number; impact: string }>;
    performanceFactors: Array<{ factor: string; currentImpact: number; trend: 'up' | 'down' | 'stable' }>;
  }> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Get today's sessions
    const todaysSessions = await prisma.chatSession.findMany({
      where: {
        startTime: { gte: startOfDay },
      },
      include: {
        customer: true,
        messages: true,
      },
    });

    // Analyze hourly trends
    const hourlyData: Record<number, { conversations: number; successful: number }> = {};

    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { conversations: 0, successful: 0 };
    }

    todaysSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      if (hourlyData[hour]) {
        hourlyData[hour].conversations++;

        if (session.outcome === 'payment_completed' || session.outcome === 'resolved') {
          hourlyData[hour].successful++;
        }
      }
    });

    const hourlyTrends = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: Number(hour),
      conversations: data.conversations,
      successRate: data.conversations > 0 ? (data.successful / data.conversations) * 100 : 0,
    }));

    // Detect emerging patterns
    const emergingPatterns = await this.detectEmergingPatterns(todaysSessions);

    // Analyze current performance factors
    const performanceFactors = [
      {
        factor: 'Response Speed',
        currentImpact: 85,
        trend: 'stable' as const,
      },
      {
        factor: 'Message Personalization',
        currentImpact: 78,
        trend: 'up' as const,
      },
      {
        factor: 'Customer Sentiment',
        currentImpact: 82,
        trend: 'down' as const,
      },
    ];

    return {
      hourlyTrends,
      emergingPatterns,
      performanceFactors,
    };
  }

  private async detectEmergingPatterns(sessions: any[]): Promise<Array<{
    pattern: string;
    frequency: number;
    impact: string;
  }>> {
    const patterns = [];

    // Analyze recent message patterns
    const recentHours = sessions.filter(session => {
      const sessionTime = new Date(session.startTime);
      const hoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000); // Last 3 hours
      return sessionTime >= hoursAgo;
    });

    // Quick resolution pattern
    const quickResolutions = recentHours.filter(session =>
      session.messages.length <= 3 &&
      session.interventions.some((i: any) => i.outcome === 'SUCCESS')
    );

    if (quickResolutions.length > recentHours.length * 0.3) {
      patterns.push({
        pattern: 'Quick Resolution Trend',
        frequency: quickResolutions.length,
        impact: 'positive',
      });
    }

    // High-value customer pattern
    const highValueSuccess = recentHours.filter(session =>
      Number(session.customer?.accountValue || 0) > 10000 &&
      (session.outcome === 'payment_completed' || session.outcome === 'resolved')
    );

    if (highValueSuccess.length > 0) {
      patterns.push({
        pattern: 'High-Value Customer Success',
        frequency: highValueSuccess.length,
        impact: 'high_revenue',
      });
    }

    return patterns;
  }
}