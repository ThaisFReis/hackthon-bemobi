import React, { useState, useEffect } from 'react';
import KpiCard from './KpiCard';
import LineChart from './LineChart';
import BarChart from './BarChart';
import HeatMap from './HeatMap';
import PipelineChart from './PipelineChart';
import metricsService, {
  KpiData,
  ConversationMetrics,
  BusinessMetrics,
  TimeSeriesMetrics,
} from '../../services/metricsService';

const ObservabilityDashboard: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'performance' | 'conversation' | 'business'>('performance');
  
  // State for filters
  const [timeRange, setTimeRange] = useState<'7' | '30'>('7');
  const [region, setRegion] = useState<string>('all');
  const [vertical, setVertical] = useState<string>('all');
  
  // State for metrics data
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [conversationMetrics, setConversationMetrics] = useState<ConversationMetrics | null>(null);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [timeSeriesMetrics, setTimeSeriesMetrics] = useState<TimeSeriesMetrics | null>(null);
  
  // Loading states
  const [loadingKpis, setLoadingKpis] = useState<boolean>(true);
  const [loadingConversation, setLoadingConversation] = useState<boolean>(true);
  const [loadingBusiness, setLoadingBusiness] = useState<boolean>(true);
  const [loadingTimeSeries, setLoadingTimeSeries] = useState<boolean>(true);

  const handleRefresh = () => {
    const fetchData = async () => {
      try {
        setLoadingKpis(true);
        const kpis = await metricsService.getKpis();
        setKpiData(kpis);
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      } finally {
        setLoadingKpis(false);
      }

      try {
        setLoadingConversation(true);
        const conversation = await metricsService.getConversationMetrics();
        setConversationMetrics(conversation);
      } catch (error) {
        console.error('Error fetching conversation metrics:', error);
      } finally {
        setLoadingConversation(false);
      }

      try {
        setLoadingBusiness(true);
        const business = await metricsService.getBusinessMetrics();
        setBusinessMetrics(business);
      } catch (error) {
        console.error('Error fetching business metrics:', error);
      } finally {
        setLoadingBusiness(false);
      }

      try {
        setLoadingTimeSeries(true);
        const timeSeries = await metricsService.getTimeSeriesMetrics(parseInt(timeRange));
        setTimeSeriesMetrics(timeSeries);
      } catch (error) {
        console.error('Error fetching time series metrics:', error);
      } finally {
        setLoadingTimeSeries(false);
      }
    };

    fetchData();
  };

  useEffect(() => {
    setTimeout(() => {
      handleRefresh();
    }, 1000);
  }, [timeRange]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Observabilidade IA</h1>
        <p className="text-gray-500">Monitoramento em tempo real do atendimento por IA via LangSmith</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 mb-1">
            Período
          </label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7' | '30')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
          </select>
        </div>

        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            Região
          </label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">Todas as regiões</option>
            <option value="São Paulo">São Paulo</option>
            <option value="Rio de Janeiro">Rio de Janeiro</option>
            <option value="Minas Gerais">Minas Gerais</option>
            <option value="Bahia">Bahia</option>
          </select>
        </div>

        <div>
          <label htmlFor="vertical" className="block text-sm font-medium text-gray-700 mb-1">
            Vertical
          </label>
          <select
            id="vertical"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">Todas as verticais</option>
            <option value="Telecom">Telecom</option>
            <option value="Utilities">Utilities</option>
            <option value="Education">Education</option>
            <option value="Retail">Retail</option>
          </select>
        </div>

        <button
          onClick={handleRefresh}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Atualizar Dados
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard
          title="Taxa de Recuperação"
          value={kpiData?.successRate || 0}
          format="percentage"
          change={2.5}
          trend="up"
          loading={loadingKpis}
        />
        <KpiCard
          title="Tempo Médio de Resolução"
          value={kpiData?.averageResolutionTime || 0}
          format="time"
          change={-1.2}
          trend="down"
          loading={loadingKpis}
        />
        <KpiCard
          title="Custo por Acordo"
          value={kpiData?.costComparison?.aiCost || 0}
          format="currency"
          description={`vs. R$ ${kpiData?.costComparison?.humanCost || 0} (humano)`}
          change={-85}
          trend="down"
          loading={loadingKpis}
        />
        <KpiCard
          title="NPS"
          value={kpiData?.nps?.score || 0}
          description={`Baseado em ${kpiData?.nps?.feedbackCount || 0} avaliações`}
          change={0.8}
          trend="up"
          loading={loadingKpis}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('performance')}
              className={`${activeTab === 'performance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Performance Técnica
            </button>
            <button
              onClick={() => setActiveTab('conversation')}
              className={`${activeTab === 'conversation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Conversação
            </button>
            <button
              onClick={() => setActiveTab('business')}
              className={`${activeTab === 'business'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Impacto de Negócio
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Performance Técnica Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChart
                title="Tendência de Taxa de Sucesso"
                subtitle="Últimos 7 dias"
                data={loadingTimeSeries ? [{ date: 'Loading', successRate: 0 }] : timeSeriesMetrics?.timeSeriesData || []}
                xKey="date"
                yKeys={[
                  { key: 'successRate', color: '#52c41a', name: 'Taxa de Sucesso (%)' },
                ]}
                loading={loadingTimeSeries}
              />
              <BarChart
                title="Distribuição de Tempo de Resposta"
                subtitle="Segmentação por faixa de tempo"
                data={loadingTimeSeries ? [{ range: 'Loading', count: 0 }] : timeSeriesMetrics?.responseTimeDistribution || []}
                xKey="range"
                yKeys={[
                  { key: 'count', color: '#1890ff', name: 'Quantidade de Interações' },
                ]}
                loading={loadingTimeSeries}
              />
            </div>

           <PipelineChart
             title="Tempo por Etapa do Pipeline"
             subtitle="Latência média por componente do sistema"
             data={loadingConversation ? [{ step: 'Loading', time: 0 }] :
               conversationMetrics?.latencyByStep.map(item => ({
                 step: item.step,
                 time: item.averageLatency / 1000, // Convert ms to seconds
               })) || []
             }
             loading={loadingConversation}
             height={350}
           />
         </div>
        )}

        {/* Conversação Tab */}
        {activeTab === 'conversation' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChart
                title="Tendência de Taxa de Sucesso"
                subtitle="Evolução diária"
                data={loadingConversation ? [{ date: 'Loading', rate: 0 }] : conversationMetrics?.successRateTrend || []}
                xKey="date"
                yKeys={[
                  { key: 'rate', color: '#52c41a', name: 'Taxa de Sucesso (%)' },
                ]}
                loading={loadingConversation}
              />
              <BarChart
                title="Métricas de Qualidade da Conversa"
                subtitle="Escala de 0-100"
                data={loadingConversation ? [{ metric: 'Loading', value: 0 }] : [
                  {
                    metric: 'Naturalidade',
                    value: conversationMetrics?.qualityMetrics.naturalness ? conversationMetrics.qualityMetrics.naturalness * 100 : 0,
                  },
                  {
                    metric: 'Coerência',
                    value: conversationMetrics?.qualityMetrics.coherence ? conversationMetrics.qualityMetrics.coherence * 100 : 0,
                  },
                  {
                    metric: 'Relevância',
                    value: conversationMetrics?.qualityMetrics.relevance ? conversationMetrics.qualityMetrics.relevance * 100 : 0,
                  },
                ]}
                xKey="metric"
                yKeys={[
                  { key: 'value', color: '#1890ff', name: 'Pontuação' },
                ]}
                layout="horizontal"
                loading={loadingConversation}
              />
            </div>

           </div>
        )}

        {/* Impacto de Negócio Tab */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChart
                title="Performance por Vertical"
                subtitle="Taxa de sucesso e valor recuperado"
                data={loadingBusiness ? [{ name: 'Loading', successRate: 0 }] : businessMetrics?.verticalPerformance || []}
                xKey="name"
                yKeys={[
                  { key: 'successRate', color: '#52c41a', name: 'Taxa de Sucesso (%)' },
                ]}
                loading={loadingBusiness}
              />
            </div>

           <div className="grid grid-cols-1 gap-6">
             <HeatMap
               title="Recuperação de Receita por Região"
               subtitle="Valor total recuperado em R$"
               data={loadingBusiness ? [{ region: 'Loading', value: 0 }] :
                 businessMetrics?.regionalData.map(item => ({
                   region: item.region,
                   value: item.recoveryAmount,
                 })) || []
               }
               valueLabel="R$"
               loading={loadingBusiness}
               height={400}
             />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <BarChart
               title="Comparação IA vs Humano"
               subtitle="Métricas de performance"
               data={loadingBusiness || loadingKpis ? [{ metric: 'Loading', ai: 0, human: 0 }] : [
                 { metric: 'Custo Médio', ai: businessMetrics?.costComparison.aiCost || 0, human: businessMetrics?.costComparison.humanCost || 0 },
                 { metric: 'Tempo Médio (min)', ai: kpiData?.averageResolutionTime || 0, human: 45 },
                 { metric: 'NPS', ai: kpiData?.nps?.score || 0, human: 7.2 },
               ]}
               xKey="metric"
               yKeys={[
                 { key: 'ai', color: '#1890ff', name: 'IA' },
                 { key: 'human', color: '#faad14', name: 'Humano' },
               ]}
               loading={loadingBusiness || loadingKpis}
             />

             <LineChart
               title="Evolução de Custos"
               subtitle="Últimos 7 dias"
               data={loadingTimeSeries ? [{ date: 'Loading', aiCost: 0, humanCost: 0 }] : timeSeriesMetrics?.timeSeriesData || []}
               xKey="date"
               yKeys={[
                 { key: 'aiCost', color: '#1890ff', name: 'Custo IA (R$)' },
                 { key: 'humanCost', color: '#faad14', name: 'Custo Humano (R$)' },
               ]}
               loading={loadingTimeSeries}
             />
           </div>
         </div>
        )}
      </div>
    </div>
  );
};

export default ObservabilityDashboard;