import express from 'express';
import metabaseService from '../services/metabaseService';
import langsmithService from '../services/langsmithService';
import metricsEnrichmentService from '../services/metricsEnrichmentService';

const router = express.Router();

/**
 * @route   GET /api/metabase/status
 * @desc    Verifica o status da conexão com o Metabase
 * @access  Private
 */
router.get('/status', async (req, res) => {
  try {
    const isConnected = await metabaseService.testConnection();
    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Erro ao verificar status do Metabase:', error);
    res.status(500).json({ error: 'Erro ao verificar status do Metabase' });
  }
});

/**
 * @route   POST /api/metabase/export/kpis
 * @desc    Exporta KPIs para o Metabase
 * @access  Private
 */
router.post('/export/kpis', async (req, res) => {
  try {
    const kpis = await metricsEnrichmentService.getKpis();
    const result = await metabaseService.exportDataToMetabase('ai_kpis', kpis);
    res.json(result);
  } catch (error) {
    console.error('Erro ao exportar KPIs para o Metabase:', error);
    res.status(500).json({ error: 'Erro ao exportar KPIs para o Metabase' });
  }
});

/**
 * @route   POST /api/metabase/export/conversation
 * @desc    Exporta métricas de conversação para o Metabase
 * @access  Private
 */
router.post('/export/conversation', async (req, res) => {
  try {
    const conversationMetrics = await metricsEnrichmentService.getConversationMetrics();
    const result = await metabaseService.exportDataToMetabase('ai_conversation_metrics', conversationMetrics);
    res.json(result);
  } catch (error) {
    console.error('Erro ao exportar métricas de conversação para o Metabase:', error);
    res.status(500).json({ error: 'Erro ao exportar métricas de conversação para o Metabase' });
  }
});

/**
 * @route   POST /api/metabase/export/business
 * @desc    Exporta métricas de negócio para o Metabase
 * @access  Private
 */
router.post('/export/business', async (req, res) => {
  try {
    const businessMetrics = await metricsEnrichmentService.getBusinessMetrics();
    const result = await metabaseService.exportDataToMetabase('ai_business_metrics', businessMetrics);
    res.json(result);
  } catch (error) {
    console.error('Erro ao exportar métricas de negócio para o Metabase:', error);
    res.status(500).json({ error: 'Erro ao exportar métricas de negócio para o Metabase' });
  }
});

/**
 * @route   POST /api/metabase/export/timeseries
 * @desc    Exporta métricas de série temporal para o Metabase
 * @access  Private
 */
router.post('/export/timeseries', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const timeSeriesMetrics = await metricsEnrichmentService.getTimeSeriesMetrics(Number(days));
    const result = await metabaseService.exportDataToMetabase('ai_timeseries_metrics', timeSeriesMetrics.timeSeriesData);
    res.json(result);
  } catch (error) {
    console.error('Erro ao exportar métricas de série temporal para o Metabase:', error);
    res.status(500).json({ error: 'Erro ao exportar métricas de série temporal para o Metabase' });
  }
});

/**
 * @route   POST /api/metabase/export/raw
 * @desc    Exporta dados brutos do LangSmith para o Metabase
 * @access  Private
 */
router.post('/export/raw', async (req, res) => {
  try {
    const traces = await langsmithService.getConversationTraces();
    const result = await metabaseService.exportDataToMetabase('ai_raw_traces', traces);
    res.json(result);
  } catch (error) {
    console.error('Erro ao exportar dados brutos para o Metabase:', error);
    res.status(500).json({ error: 'Erro ao exportar dados brutos para o Metabase' });
  }
});

/**
 * @route   POST /api/metabase/dashboard
 * @desc    Cria um novo dashboard no Metabase
 * @access  Private
 */
router.post('/dashboard', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome do dashboard é obrigatório' });
    }
    
    const dashboard = await metabaseService.createDashboard(name, description || '');
    res.json(dashboard);
  } catch (error) {
    console.error('Erro ao criar dashboard no Metabase:', error);
    res.status(500).json({ error: 'Erro ao criar dashboard no Metabase' });
  }
});

/**
 * @route   GET /api/metabase/embed/:dashboardId
 * @desc    Obtém URL de incorporação para um dashboard
 * @access  Private
 */
router.get('/embed/:dashboardId', async (req, res) => {
  try {
    const dashboardId = parseInt(req.params.dashboardId);
    
    if (isNaN(dashboardId)) {
      return res.status(400).json({ error: 'ID do dashboard inválido' });
    }
    
    const embedUrl = await metabaseService.getEmbedUrl(dashboardId);
    res.json({ embedUrl });
  } catch (error) {
    console.error('Erro ao obter URL de incorporação:', error);
    res.status(500).json({ error: 'Erro ao obter URL de incorporação' });
  }
});

export default router;