import express, { Request, Response } from 'express';
import { LangsmithService } from '../services/langsmithService';
import { MetricsEnrichmentService } from '../services/metricsEnrichmentService';

const router = express.Router();

// Initialize services
const langsmithService = new LangsmithService();
const metricsEnrichmentService = new MetricsEnrichmentService(langsmithService);

/**
 * @route GET /api/metrics/kpis
 * @desc Get key performance indicators
 * @access Public
 */
router.get('/kpis', async (req: Request, res: Response) => {
  try {
    const kpis = await metricsEnrichmentService.getAggregatedKPIs();
    res.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch KPI metrics' });
  }
});

/**
 * @route GET /api/metrics/conversation
 * @desc Get conversation metrics
 * @access Public
 */
router.get('/conversation', async (req: Request, res: Response) => {
  try {
    const conversationMetrics = await metricsEnrichmentService.getConversationMetrics();
    res.json(conversationMetrics);
  } catch (error) {
    console.error('Error fetching conversation metrics:', error);
    res.status(500).json({ error: 'Failed to fetch conversation metrics' });
  }
});

/**
 * @route GET /api/metrics/business
 * @desc Get business impact metrics
 * @access Public
 */
router.get('/business', async (req: Request, res: Response) => {
  try {
    const businessMetrics = await metricsEnrichmentService.getBusinessImpactMetrics();
    res.json(businessMetrics);
  } catch (error) {
    console.error('Error fetching business metrics:', error);
    res.status(500).json({ error: 'Failed to fetch business impact metrics' });
  }
});

/**
 * @route GET /api/metrics/timeseries
 * @desc Get time series metrics
 * @access Public
 */
router.get('/timeseries', async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const timeSeriesMetrics = await metricsEnrichmentService.getTimeSeriesMetrics(days);
    res.json(timeSeriesMetrics);
  } catch (error) {
    console.error('Error fetching time series metrics:', error);
    res.status(500).json({ error: 'Failed to fetch time series metrics' });
  }
});

/**
 * @route GET /api/metrics/raw
 * @desc Get raw LangSmith data for Metabase integration
 * @access Public
 */
router.get('/raw', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const projectName = req.query.project as string | undefined;
    
    const traces = await langsmithService.getConversationTraces(limit, projectName);
    const tokenUsage = await langsmithService.getTokenUsageMetrics(limit, projectName);
    const latencyByStep = await langsmithService.getLatencyByStep(limit, projectName);
    const qualityMetrics = await langsmithService.getQualityMetrics(limit, projectName);
    const intentMetrics = await langsmithService.getIntentClassificationMetrics(limit, projectName);
    
    res.json({
      traces,
      tokenUsage,
      latencyByStep,
      qualityMetrics,
      intentMetrics,
    });
  } catch (error) {
    console.error('Error fetching raw metrics:', error);
    res.status(500).json({ error: 'Failed to fetch raw metrics data' });
  }
});

export default router;