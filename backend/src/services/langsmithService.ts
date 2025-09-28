import { Client } from 'langsmith';
import dotenv from 'dotenv';

dotenv.config();

export class LangsmithService {
  private client: Client;

  constructor() {
    // Initialize LangSmith client with API key from environment variables
    this.client = new Client({
      apiKey: process.env.LANGSMITH_API_KEY,
      apiUrl: process.env.LANGSMITH_API_URL || 'https://api.smith.langchain.com',
    });
  }

  /**
   * Get traces of conversations
   * @param limit Number of traces to retrieve
   * @param projectName Optional project name filter
   * @returns Array of conversation traces
   */
  async getConversationTraces(limit = 100, projectName?: string) {
    try {
      const runs = await this.client.listRuns({
        projectName,
        limit,
      });
      return runs;
    } catch (error) {
      console.error('Error fetching conversation traces:', error);
      throw error;
    }
  }

  /**
   * Get token usage metrics
   * @param limit Number of runs to analyze
   * @param projectName Optional project name filter
   * @returns Token usage statistics
   */
  async getTokenUsageMetrics(limit = 100, projectName?: string) {
    try {
      const runs = await this.client.listRuns({
        projectName,
        limit,
      });

      // Aggregate token usage data
      const tokenUsage = runs.reduce(
        (acc, run) => {
          const tokenCount = run.metrics?.['token_count'] || 0;
          const promptTokens = run.metrics?.['prompt_tokens'] || 0;
          const completionTokens = run.metrics?.['completion_tokens'] || 0;
          
          return {
            totalTokens: acc.totalTokens + tokenCount,
            promptTokens: acc.promptTokens + promptTokens,
            completionTokens: acc.completionTokens + completionTokens,
            runCount: acc.runCount + 1,
          };
        },
        { totalTokens: 0, promptTokens: 0, completionTokens: 0, runCount: 0 }
      );

      return {
        ...tokenUsage,
        averageTokensPerRun: tokenUsage.runCount > 0 ? tokenUsage.totalTokens / tokenUsage.runCount : 0,
      };
    } catch (error) {
      console.error('Error fetching token usage metrics:', error);
      throw error;
    }
  }

  /**
   * Get latency metrics by processing step
   * @param limit Number of runs to analyze
   * @param projectName Optional project name filter
   * @returns Latency statistics by step
   */
  async getLatencyByStep(limit = 100, projectName?: string) {
    try {
      const runs = await this.client.listRuns({
        projectName,
        limit,
      });

      // Group runs by step name and calculate latency statistics
      const stepLatencies: Record<string, { totalLatency: number; count: number }> = {};
      
      runs.forEach(run => {
        const stepName = run.name || 'unknown';
        const latency = run.end_time && run.start_time 
          ? new Date(run.end_time).getTime() - new Date(run.start_time).getTime() 
          : 0;
        
        if (!stepLatencies[stepName]) {
          stepLatencies[stepName] = { totalLatency: 0, count: 0 };
        }
        
        stepLatencies[stepName].totalLatency += latency;
        stepLatencies[stepName].count += 1;
      });

      // Calculate average latency for each step
      const result = Object.entries(stepLatencies).map(([step, data]) => ({
        step,
        averageLatency: data.count > 0 ? data.totalLatency / data.count : 0,
        totalRuns: data.count,
      }));

      return result;
    } catch (error) {
      console.error('Error fetching latency metrics:', error);
      throw error;
    }
  }

  /**
   * Get quality metrics (coherence, relevance, naturalness)
   * @param limit Number of runs to analyze
   * @param projectName Optional project name filter
   * @returns Quality metrics statistics
   */
  async getQualityMetrics(limit = 100, projectName?: string) {
    try {
      const runs = await this.client.listRuns({
        projectName,
        limit,
      });

      // Extract quality metrics from runs
      const qualityMetrics = runs.reduce(
        (acc, run) => {
          const coherence = run.metrics?.['coherence'] || 0;
          const relevance = run.metrics?.['relevance'] || 0;
          const naturalness = run.metrics?.['naturalness'] || 0;
          
          return {
            coherenceSum: acc.coherenceSum + coherence,
            relevanceSum: acc.relevanceSum + relevance,
            naturalnessSum: acc.naturalnessSum + naturalness,
            runCount: acc.runCount + (coherence || relevance || naturalness ? 1 : 0),
          };
        },
        { coherenceSum: 0, relevanceSum: 0, naturalnessSum: 0, runCount: 0 }
      );

      return {
        coherence: qualityMetrics.runCount > 0 ? qualityMetrics.coherenceSum / qualityMetrics.runCount : 0,
        relevance: qualityMetrics.runCount > 0 ? qualityMetrics.relevanceSum / qualityMetrics.runCount : 0,
        naturalness: qualityMetrics.runCount > 0 ? qualityMetrics.naturalnessSum / qualityMetrics.runCount : 0,
        sampleSize: qualityMetrics.runCount,
      };
    } catch (error) {
      console.error('Error fetching quality metrics:', error);
      throw error;
    }
  }

  /**
   * Get intent classification accuracy metrics
   * @param limit Number of runs to analyze
   * @param projectName Optional project name filter
   * @returns Intent classification accuracy statistics
   */
  async getIntentClassificationMetrics(limit = 100, projectName?: string) {
    try {
      const runs = await this.client.listRuns({
        projectName,
        limit,
      });

      // Extract intent classification metrics
      const intentMetrics = runs.reduce(
        (acc, run) => {
          const intentAccuracy = run.metrics?.['intent_accuracy'] || 0;
          const hasIntentData = run.metrics?.hasOwnProperty('intent_accuracy') || false;
          
          return {
            accuracySum: acc.accuracySum + intentAccuracy,
            runCount: acc.runCount + (hasIntentData ? 1 : 0),
          };
        },
        { accuracySum: 0, runCount: 0 }
      );

      return {
        averageAccuracy: intentMetrics.runCount > 0 ? intentMetrics.accuracySum / intentMetrics.runCount : 0,
        sampleSize: intentMetrics.runCount,
      };
    } catch (error) {
      console.error('Error fetching intent classification metrics:', error);
      throw error;
    }
  }
}