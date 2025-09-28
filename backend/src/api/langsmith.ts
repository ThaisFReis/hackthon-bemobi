import express from 'express';
import { LangchainGeminiService } from '../services/langchainGeminiService';

const router = express.Router();

// Initialize AI service (this should ideally be injected)
const aiService = new LangchainGeminiService();

/**
 * GET /api/langsmith/stats
 * Get LangSmith project statistics and recent runs
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await aiService.getLangSmithStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching LangSmith stats:', error);
    res.status(500).json({
      error: 'Failed to fetch LangSmith statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/langsmith/health
 * Check if LangSmith is configured and accessible
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await aiService.getLangSmithStats();
    const isHealthy = !stats.error;

    res.json({
      status: isHealthy ? 'healthy' : 'error',
      configured: !stats.error,
      message: stats.error || 'LangSmith is configured and accessible',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      configured: false,
      message: 'LangSmith health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;