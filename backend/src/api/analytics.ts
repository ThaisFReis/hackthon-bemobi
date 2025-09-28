import express from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { LangchainGeminiService } from '../services/langchainGeminiService';

const router = express.Router();

// Initialize services
const aiService = new LangchainGeminiService();
const analyticsService = new AnalyticsService(aiService);

/**
 * GET /api/analytics/performance
 * Get performance metrics for dashboard visualization
 */
router.get('/performance', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      granularity = 'day'
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required parameters'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const metrics = await analyticsService.getPerformanceMetrics(
      start,
      end,
      granularity as 'hour' | 'day' | 'week' | 'month'
    );

    res.json({
      success: true,
      data: metrics,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        granularity
      }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analytics/patterns
 * Get conversation pattern analysis
 */
router.get('/patterns', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required parameters'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const patterns = await analyticsService.analyzeConversationPatterns(start, end);

    res.json({
      success: true,
      data: patterns,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    res.status(500).json({
      error: 'Failed to analyze conversation patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analytics/roi
 * Get ROI analysis and business metrics
 */
router.get('/roi', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required parameters'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const roiAnalysis = await analyticsService.calculateROI(start, end);

    res.json({
      success: true,
      data: roiAnalysis,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error calculating ROI:', error);
    res.status(500).json({
      error: 'Failed to calculate ROI',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analytics/realtime
 * Get real-time dashboard metrics
 */
router.get('/realtime', async (req, res) => {
  try {
    const metrics = await analyticsService.getRealTimeMetrics();

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch real-time metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analytics/trends
 * Get trending data for charts and visualizations
 */
router.get('/trends', async (req, res) => {
  try {
    const {
      metric = 'success_rate',
      period = '7d',
      granularity = 'day'
    } = req.query;

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
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
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const metrics = await analyticsService.getPerformanceMetrics(
      startDate,
      endDate,
      granularity as 'hour' | 'day' | 'week' | 'month'
    );

    // Extract specific metric for trending
    const trendData = metrics.map(m => ({
      period: m.period,
      value: this.extractMetricValue(m, metric as string),
      timestamp: new Date(m.period).getTime()
    }));

    res.json({
      success: true,
      data: trendData,
      metadata: {
        metric,
        period,
        granularity,
        dataPoints: trendData.length
      }
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      error: 'Failed to fetch trend data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analytics/segments
 * Get customer segment performance analysis
 */
router.get('/segments', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required parameters'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const metrics = await analyticsService.getPerformanceMetrics(start, end);

    // Aggregate segment data across all periods
    const aggregatedSegments: Record<string, any> = {};

    metrics.forEach(metric => {
      Object.entries(metric.customerSegments).forEach(([segment, data]) => {
        if (!aggregatedSegments[segment]) {
          aggregatedSegments[segment] = {
            conversations: 0,
            totalSuccessRate: 0,
            totalAverageValue: 0,
            periods: 0
          };
        }

        aggregatedSegments[segment].conversations += data.conversations;
        aggregatedSegments[segment].totalSuccessRate += data.successRate;
        aggregatedSegments[segment].totalAverageValue += data.averageValue;
        aggregatedSegments[segment].periods++;
      });
    });

    // Calculate final averages
    const segmentAnalysis = Object.entries(aggregatedSegments).map(([segment, data]) => ({
      segment,
      totalConversations: data.conversations,
      averageSuccessRate: data.totalSuccessRate / data.periods,
      averageValue: data.totalAverageValue / data.periods,
      performance: data.totalSuccessRate / data.periods > 70 ? 'high' :
                  data.totalSuccessRate / data.periods > 50 ? 'medium' : 'low'
    }));

    res.json({
      success: true,
      data: segmentAnalysis,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (error) {
    console.error('Error analyzing segments:', error);
    res.status(500).json({
      error: 'Failed to analyze customer segments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Helper method to extract specific metrics for trending
 */
function extractMetricValue(metrics: any, metricName: string): number {
  switch (metricName) {
    case 'success_rate':
      return metrics.successRate;
    case 'total_conversations':
      return metrics.totalConversations;
    case 'average_resolution_time':
      return metrics.averageResolutionTime;
    case 'revenue_recovered':
      return metrics.revenueMetrics.totalRecovered;
    case 'token_usage':
      return metrics.tokenUsage.total;
    case 'token_cost':
      return metrics.tokenUsage.cost;
    case 'roi':
      return metrics.revenueMetrics.roi;
    default:
      return 0;
  }
}

// Real-time patterns endpoint
router.get('/patterns/realtime', async (req, res) => {
  try {
    const data = await analyticsService.getRealtimePatterns();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error getting realtime patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get realtime patterns',
    });
  }
});

// WebSocket-style endpoint for real-time monitoring
router.get('/monitor/subscribe', (req, res) => {
  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Send initial connection message
  res.write('data: {"type":"connected","message":"Real-time monitoring started"}\n\n');

  // Subscribe to analytics updates
  const unsubscribe = analyticsService.subscribe((data) => {
    res.write(`data: ${JSON.stringify({ type: 'update', data })}\n\n`);
  });

  // Clean up on client disconnect
  req.on('close', () => {
    unsubscribe();
  });

  req.on('error', () => {
    unsubscribe();
  });
});

export default router;