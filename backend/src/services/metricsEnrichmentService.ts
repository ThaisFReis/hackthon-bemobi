import { LangsmithService } from './langsmithService';

export class MetricsEnrichmentService {
  private langsmithService: LangsmithService;

  constructor(langsmithService: LangsmithService) {
    this.langsmithService = langsmithService;
  }

  /**
   * Enrich conversation data with human cost comparison
   * @param conversationData Raw conversation data
   * @returns Enriched data with human cost comparison
   */
  enrichWithHumanCostComparison(conversationData: any) {
    // Fixed cost for human agent per session (R$ 85)
    const humanCostPerSession = 85;
    
    // Calculate AI cost based on token usage
    // Assuming GPT-4 pricing: $0.03 per 1K prompt tokens, $0.06 per 1K completion tokens
    // Converting to BRL with an approximate exchange rate of 5.5 BRL to 1 USD
    const promptTokenCost = (conversationData.promptTokens / 1000) * 0.03 * 5.5;
    const completionTokenCost = (conversationData.completionTokens / 1000) * 0.06 * 5.5;
    const aiCostPerSession = promptTokenCost + completionTokenCost;
    
    return {
      ...conversationData,
      costComparison: {
        aiCost: aiCostPerSession,
        humanCost: humanCostPerSession,
        savings: humanCostPerSession - aiCostPerSession,
        savingsPercentage: ((humanCostPerSession - aiCostPerSession) / humanCostPerSession) * 100,
      },
    };
  }

  /**
   * Enrich data with NPS (Net Promoter Score) information
   * @param data Raw data
   * @param npsData NPS data to enrich with
   * @returns Enriched data with NPS information
   */
  enrichWithNPS(data: any, npsData: { score: number; feedbackCount: number }) {
    return {
      ...data,
      nps: {
        score: npsData.score,
        feedbackCount: npsData.feedbackCount,
        category: this.getNPSCategory(npsData.score),
      },
    };
  }

  /**
   * Get NPS category based on score
   * @param score NPS score (0-10)
   * @returns NPS category (Detractor, Passive, Promoter)
   */
  private getNPSCategory(score: number): string {
    if (score >= 0 && score <= 6) return 'Detractor';
    if (score >= 7 && score <= 8) return 'Passive';
    return 'Promoter';
  }

  /**
   * Enrich data with regional information
   * @param data Raw data
   * @param regionalData Regional data to enrich with
   * @returns Enriched data with regional information
   */
  enrichWithRegionalData(data: any, regionalData: Record<string, any>) {
    return {
      ...data,
      regional: regionalData,
    };
  }

  /**
   * Get aggregated KPI metrics
   * @returns Aggregated KPI metrics
   */
  async getAggregatedKPIs() {
    try {
      // Get base metrics from LangSmith
      const tokenUsage = await this.langsmithService.getTokenUsageMetrics();
      const qualityMetrics = await this.langsmithService.getQualityMetrics();
      const latencyMetrics = await this.langsmithService.getLatencyByStep();
      const traces = await this.langsmithService.getConversationTraces(100);
      
      // Calculate success rate based on actual trace data
      const successfulTraces = traces.filter(trace => 
        trace.status === 'success' || 
        trace.feedback?.some(f => f.key === 'resolved' && f.value === true)
      );
      const successRate = traces.length > 0 ? successfulTraces.length / traces.length : 0;
      
      // Mock NPS data (in a real scenario, this would come from a database)
      const mockNPSData = {
        score: 8.7,
        feedbackCount: 120,
      };
      
      // Calculate average latency across all steps
      const totalLatency = latencyMetrics.reduce((sum, metric) => sum + metric.averageLatency, 0);
      const averageLatency = latencyMetrics.length > 0 ? totalLatency / latencyMetrics.length : 0;
      
      // Enrich with cost comparison
      const enrichedData = this.enrichWithHumanCostComparison(tokenUsage);
      
      // Further enrich with NPS
      const fullyEnrichedData = this.enrichWithNPS(enrichedData, mockNPSData);
      
      return {
        successRate: successRate * 100, // Convert to percentage
        averageResolutionTime: averageLatency / 1000 / 60, // Convert from ms to minutes
        costComparison: fullyEnrichedData.costComparison,
        nps: fullyEnrichedData.nps,
        qualityMetrics,
      };
    } catch (error) {
      console.error('Error getting aggregated KPIs:', error);
      throw error;
    }
  }

  /**
   * Get conversation metrics
   * @returns Conversation metrics
   */
  async getConversationMetrics() {
    try {
      const latencyByStep = await this.langsmithService.getLatencyByStep();
      const qualityMetrics = await this.langsmithService.getQualityMetrics();
      const intentMetrics = await this.langsmithService.getIntentClassificationMetrics();
      
      // Get traces from the last 7 days for success rate trend
      const today = new Date();
      const successRateTrend = [];
      
      // Generate data for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        // Get traces for this specific day
        const startTime = new Date(date);
        startTime.setHours(0, 0, 0, 0);
        
        const endTime = new Date(date);
        endTime.setHours(23, 59, 59, 999);
        
        const traces = await this.langsmithService.getConversationTraces(50, process.env.LANGCHAIN_PROJECT, startTime.toISOString(), endTime.toISOString());
        
        // Calculate success rate for this day
        const successfulTraces = traces.filter(trace => 
          trace.status === 'success' || 
          trace.feedback?.some(f => f.key === 'resolved' && f.value === true)
        );
        const rate = traces.length > 0 ? successfulTraces.length / traces.length : 0;
        
        successRateTrend.push({
          date: dateString,
          rate: rate
        });
      }
      
      return {
        latencyByStep,
        qualityMetrics,
        intentAccuracy: intentMetrics.averageAccuracy * 100, // Convert to percentage
        successRateTrend: successRateTrend.map(item => ({
          ...item,
          rate: item.rate * 100, // Convert to percentage
        })),
      };
    } catch (error) {
      console.error('Error getting conversation metrics:', error);
      throw error;
    }
  }

  /**
   * Get business impact metrics
   * @returns Business impact metrics
   */
  async getBusinessImpactMetrics() {
    try {
      // Get token usage for cost calculation
      const tokenUsage = await this.langsmithService.getTokenUsageMetrics();
      const traces = await this.langsmithService.getConversationTraces(100);
      
      // Enrich with cost comparison
      const enrichedData = this.enrichWithHumanCostComparison(tokenUsage);
      
      // Extract regional data from traces based on metadata
      const regionalData: Record<string, { recoveryAmount: number, successRate: number, count: number }> = {};
      const verticalData: Record<string, { recoveryAmount: number, successRate: number, count: number }> = {};
      
      // Default regions and verticals if metadata is not available
      const defaultRegions = ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Rio Grande do Sul'];
      const defaultVerticals = ['Telecom', 'Utilities', 'Education', 'Retail'];
      
      // Process traces to extract regional and vertical data
      traces.forEach(trace => {
        // Extract region from metadata or assign randomly if not available
        const region = trace.metadata?.region || 
                      defaultRegions[Math.floor(Math.random() * defaultRegions.length)];
        
        // Extract vertical from metadata or assign randomly if not available
        const vertical = trace.metadata?.vertical || 
                       defaultVerticals[Math.floor(Math.random() * defaultVerticals.length)];
        
        // Determine if this trace was successful
        const isSuccessful = trace.status === 'success' || 
                           trace.feedback?.some(f => f.key === 'resolved' && f.value === true);
        
        // Calculate estimated recovery amount based on token usage and success
        // This is a simplified calculation - in a real scenario, this would be based on actual business metrics
        const traceTokens = trace.metrics?.total_tokens || 0;
        const estimatedRecoveryAmount = isSuccessful ? traceTokens * 0.5 : 0; // Simple estimation
        
        // Update regional data
        if (!regionalData[region]) {
          regionalData[region] = { recoveryAmount: 0, successRate: 0, count: 0 };
        }
        regionalData[region].recoveryAmount += estimatedRecoveryAmount;
        regionalData[region].count += 1;
        if (isSuccessful) {
          regionalData[region].successRate += 1;
        }
        
        // Update vertical data
        if (!verticalData[vertical]) {
          verticalData[vertical] = { recoveryAmount: 0, successRate: 0, count: 0 };
        }
        verticalData[vertical].recoveryAmount += estimatedRecoveryAmount;
        verticalData[vertical].count += 1;
        if (isSuccessful) {
          verticalData[vertical].successRate += 1;
        }
      });
      
      // Calculate final success rates
      Object.keys(regionalData).forEach(region => {
        if (regionalData[region].count > 0) {
          regionalData[region].successRate = regionalData[region].successRate / regionalData[region].count;
        }
      });
      
      Object.keys(verticalData).forEach(vertical => {
        if (verticalData[vertical].count > 0) {
          verticalData[vertical].successRate = verticalData[vertical].successRate / verticalData[vertical].count;
        }
      });
      
      // Calculate ROI
      const totalRecovery = Object.values(regionalData).reduce(
        (sum, region) => sum + region.recoveryAmount, 
        0
      );
      
      const totalCost = enrichedData.costComparison.aiCost * tokenUsage.runCount;
      const roi = totalCost > 0 ? (totalRecovery - totalCost) / totalCost : 0;
      
      return {
        roi: roi * 100, // Convert to percentage
        costComparison: enrichedData.costComparison,
        regionalData: Object.entries(regionalData).map(([region, data]) => ({
          region,
          recoveryAmount: data.recoveryAmount,
          successRate: data.successRate * 100, // Convert to percentage
        })),
        verticalPerformance: Object.entries(verticalData).map(([name, data]) => ({
          name,
          recoveryAmount: data.recoveryAmount,
          successRate: data.successRate * 100, // Convert to percentage
        })),
      };
    } catch (error) {
      console.error('Error getting business impact metrics:', error);
      throw error;
    }
  }

  /**
   * Get time series metrics
   * @param days Number of days to include in the time series
   * @returns Time series metrics
   */
  async getTimeSeriesMetrics(days = 7) {
    try {
      const today = new Date();
      const timeSeriesData = [];
      const responseTimeRanges = {
        '0-30s': 0,
        '30-60s': 0,
        '1-2m': 0,
        '2-5m': 0,
        '5m+': 0
      };
      
      // Get data for each day in the time series
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        // Get traces for this specific day
        const startTime = new Date(date);
        startTime.setHours(0, 0, 0, 0);
        
        const endTime = new Date(date);
        endTime.setHours(23, 59, 59, 999);
        
        const traces = await this.langsmithService.getConversationTraces(50, process.env.LANGCHAIN_PROJECT, startTime.toISOString(), endTime.toISOString());
        
        // Calculate metrics from traces
        const successfulTraces = traces.filter(trace => 
          trace.status === 'success' || 
          trace.feedback?.some(f => f.key === 'resolved' && f.value === true)
        );
        
        // Calculate success rate
        const successRate = traces.length > 0 ? (successfulTraces.length / traces.length) * 100 : 0;
        
        // Calculate average response time
        let totalResponseTime = 0;
        let responseCount = 0;
        
        traces.forEach(trace => {
          if (trace.start_time && trace.end_time) {
            const startTime = new Date(trace.start_time).getTime();
            const endTime = new Date(trace.end_time).getTime();
            const responseTime = (endTime - startTime) / 1000; // Convert to seconds
            
            totalResponseTime += responseTime;
            responseCount++;
            
            // Update response time distribution
            if (responseTime < 30) {
              responseTimeRanges['0-30s']++;
            } else if (responseTime < 60) {
              responseTimeRanges['30-60s']++;
            } else if (responseTime < 120) {
              responseTimeRanges['1-2m']++;
            } else if (responseTime < 300) {
              responseTimeRanges['2-5m']++;
            } else {
              responseTimeRanges['5m+']++;
            }
          }
        });
        
        const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
        
        // Calculate AI cost based on token usage
        const totalTokens = traces.reduce((sum, trace) => sum + (trace.metrics?.total_tokens || 0), 0);
        const aiCost = totalTokens * 0.002 / 1000; // Simple cost calculation based on token usage
        
        // Fixed human cost for comparison
        const humanCost = 85;
        
        timeSeriesData.push({
          date: dateStr,
          successRate,
          responseTime: averageResponseTime,
          aiCost,
          humanCost,
        });
      }
      
      return {
        timeSeriesData,
        responseTimeDistribution: Object.entries(responseTimeRanges).map(([range, count]) => ({
          range,
          count
        })),
      };
    } catch (error) {
      console.error('Error getting time series metrics:', error);
      throw error;
    }
  }
}