import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export interface KpiData {
  successRate: number;
  averageResolutionTime: number;
  costComparison: {
    aiCost: number;
    humanCost: number;
    savings: number;
    savingsPercentage: number;
  };
  nps: {
    score: number;
    feedbackCount: number;
    category: string;
  };
  qualityMetrics: {
    coherence: number;
    relevance: number;
    naturalness: number;
    sampleSize: number;
  };
}

export interface ConversationMetrics {
  latencyByStep: Array<{
    step: string;
    averageLatency: number;
    totalRuns: number;
  }>;
  qualityMetrics: {
    coherence: number;
    relevance: number;
    naturalness: number;
    sampleSize: number;
  };
  intentAccuracy: number;
  successRateTrend: Array<{
    date: string;
    rate: number;
  }>;
}

export interface BusinessMetrics {
  roi: number;
  costComparison: {
    aiCost: number;
    humanCost: number;
    savings: number;
    savingsPercentage: number;
  };
  regionalData: Array<{
    region: string;
    recoveryAmount: number;
    successRate: number;
  }>;
  verticalPerformance: Array<{
    name: string;
    recoveryAmount: number;
    successRate: number;
  }>;
}

export interface TimeSeriesMetrics {
  timeSeriesData: Array<{
    date: string;
    successRate: number;
    responseTime: number;
    aiCost: number;
    humanCost: number;
  }>;
  responseTimeDistribution: Array<{
    range: string;
    count: number;
  }>;
}

const metricsService = {
  /**
   * Get KPI metrics
   * @returns Promise with KPI data
   */
  getKpis: async (): Promise<KpiData> => {
    try {
      const response = await axios.get(`${API_URL}/metrics/kpis`);
      return response.data;
    } catch (error) {
      console.error('Error fetching KPI metrics:', error);
      throw error;
    }
  },

  /**
   * Get conversation metrics
   * @returns Promise with conversation metrics data
   */
  getConversationMetrics: async (): Promise<ConversationMetrics> => {
    try {
      const response = await axios.get(`${API_URL}/metrics/conversation`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation metrics:', error);
      throw error;
    }
  },

  /**
   * Get business impact metrics
   * @returns Promise with business metrics data
   */
  getBusinessMetrics: async (): Promise<BusinessMetrics> => {
    try {
      const response = await axios.get(`${API_URL}/metrics/business`);
      return response.data;
    } catch (error) {
      console.error('Error fetching business metrics:', error);
      throw error;
    }
  },

  /**
   * Get time series metrics
   * @param days Number of days to include (default: 7)
   * @returns Promise with time series metrics data
   */
  getTimeSeriesMetrics: async (days = 7): Promise<TimeSeriesMetrics> => {
    try {
      const response = await axios.get(`${API_URL}/metrics/timeseries`, {
        params: { days },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching time series metrics:', error);
      throw error;
    }
  },

  /**
   * Get raw metrics data for Metabase integration
   * @param limit Number of records to retrieve (default: 100)
   * @param projectName Optional project name filter
   * @returns Promise with raw metrics data
   */
  getRawMetrics: async (limit = 100, projectName?: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_URL}/metrics/raw`, {
        params: { limit, project: projectName },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching raw metrics:', error);
      throw error;
    }
  },
};

export default metricsService;