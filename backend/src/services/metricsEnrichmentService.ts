s
clearimport { LangsmithService } from './langsmithService';

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
      
      // Mock NPS data (in a real scenario, this would come from a database)
      const mockNPSData = {
        score: 8.7,
        feedbackCount: 120,
      };
      
      // Calculate average latency across all steps
      const totalLatency = latencyMetrics.reduce((sum, metric) => sum + metric.averageLatency, 0);
      const averageLatency = latencyMetrics.length > 0 ? totalLatency / latencyMetrics.length : 0;
      
      // Calculate success rate (mock data - in real scenario would be from actual outcomes)
      const successRate = 0.78; // 78% success rate
      
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
      
      // Mock success rate trend data (in a real scenario, this would come from historical data)
      const mockSuccessRateTrend = [
        { date: '2023-05-01', rate: 0.65 },
        { date: '2023-05-02', rate: 0.68 },
        { date: '2023-05-03', rate: 0.72 },
        { date: '2023-05-04', rate: 0.75 },
        { date: '2023-05-05', rate: 0.73 },
        { date: '2023-05-06', rate: 0.77 },
        { date: '2023-05-07', rate: 0.78 },
      ];
      
      return {
        latencyByStep,
        qualityMetrics,
        intentAccuracy: intentMetrics.averageAccuracy * 100, // Convert to percentage
        successRateTrend: mockSuccessRateTrend.map(item => ({
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
      
      // Enrich with cost comparison
      const enrichedData = this.enrichWithHumanCostComparison(tokenUsage);
      
      // Mock regional data (in a real scenario, this would come from a database)
      const mockRegionalData = {
        'São Paulo': { recoveryAmount: 125000, successRate: 0.82 },
        'Rio de Janeiro': { recoveryAmount: 87000, successRate: 0.76 },
        'Minas Gerais': { recoveryAmount: 62000, successRate: 0.79 },
        'Bahia': { recoveryAmount: 45000, successRate: 0.71 },
        'Rio Grande do Sul': { recoveryAmount: 38000, successRate: 0.74 },
        'Paraná': { recoveryAmount: 35000, successRate: 0.77 },
        'Pernambuco': { recoveryAmount: 28000, successRate: 0.69 },
        'Ceará': { recoveryAmount: 25000, successRate: 0.68 },
        'Distrito Federal': { recoveryAmount: 22000, successRate: 0.81 },
        'Goiás': { recoveryAmount: 20000, successRate: 0.73 },
      };
      
      // Mock vertical performance data
      const mockVerticalData = [
        { name: 'Telecom', recoveryAmount: 180000, successRate: 0.79 },
        { name: 'Utilities', recoveryAmount: 150000, successRate: 0.76 },
        { name: 'Education', recoveryAmount: 95000, successRate: 0.81 },
        { name: 'Retail', recoveryAmount: 62000, successRate: 0.74 },
      ];
      
      // Calculate ROI
      const totalRecovery = Object.values(mockRegionalData).reduce(
        (sum, region: any) => sum + region.recoveryAmount, 
        0
      );
      
      const totalCost = enrichedData.costComparison.aiCost * tokenUsage.runCount;
      const roi = (totalRecovery - totalCost) / totalCost;
      
      return {
        roi: roi * 100, // Convert to percentage
        costComparison: enrichedData.costComparison,
        regionalData: Object.entries(mockRegionalData).map(([region, data]: [string, any]) => ({
          region,
          recoveryAmount: data.recoveryAmount,
          successRate: data.successRate * 100, // Convert to percentage
        })),
        verticalPerformance: mockVerticalData.map(vertical => ({
          ...vertical,
          successRate: vertical.successRate * 100, // Convert to percentage
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
      // Generate mock time series data (in a real scenario, this would come from historical data)
      const today = new Date();
      const timeSeriesData = [];
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        // Generate realistic fluctuating metrics
        const baseSuccessRate = 0.70 + (Math.random() * 0.15);
        const baseResponseTime = 45 + (Math.random() * 30);
        const baseCost = 12 + (Math.random() * 8);
        
        timeSeriesData.push({
          date: dateStr,
          successRate: baseSuccessRate * 100, // Convert to percentage
          responseTime: baseResponseTime, // in seconds
          aiCost: baseCost,
          humanCost: 85, // Fixed human cost
        });
      }
      
      return {
        timeSeriesData,
        // Distribution of response times (mock data)
        responseTimeDistribution: [
          { range: '0-30s', count: 125 },
          { range: '30-60s', count: 320 },
          { range: '1-2m', count: 210 },
          { range: '2-5m', count: 95 },
          { range: '5m+', count: 50 },
        ],
      };
    } catch (error) {
      console.error('Error getting time series metrics:', error);
      throw error;
    }
  }
}