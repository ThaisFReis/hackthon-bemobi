import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface MetabaseEmbedProps {
  dashboardId: number;
  height?: number;
  title?: string;
  loading?: boolean;
}

const MetabaseEmbed: React.FC<MetabaseEmbedProps> = ({
  dashboardId,
  height = 600,
  title = 'Dashboard Metabase',
  loading = false,
}) => {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEmbedUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Verificar se o Metabase está conectado
        const statusResponse = await axios.get('/api/metabase/status');
        
        if (!statusResponse.data.connected) {
          setError('O Metabase não está conectado. Verifique a configuração.');
          setIsLoading(false);
          return;
        }
        
        // Obter URL de incorporação
        const response = await axios.get(`/api/metabase/embed/${dashboardId}`);
        setEmbedUrl(response.data.embedUrl);
      } catch (err) {
        console.error('Erro ao obter URL de incorporação do Metabase:', err);
        setError('Não foi possível carregar o dashboard do Metabase');
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchEmbedUrl();
    }
  }, [dashboardId, loading]);

  if (loading || isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6" style={{ height }}>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
          <p className="mt-4 text-gray-500 text-sm">
            Para configurar a integração com o Metabase, verifique as variáveis de ambiente no backend.
          </p>
        </div>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6" style={{ height }}>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500">Dashboard não disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height }}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <iframe
        src={embedUrl}
        frameBorder="0"
        width="100%"
        height={height - 56} // Subtract header height
        allowTransparency
        title={`Metabase Dashboard ${dashboardId}`}
      />
    </div>
  );
};

export default MetabaseEmbed;