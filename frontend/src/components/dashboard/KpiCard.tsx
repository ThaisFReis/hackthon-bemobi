import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'percentage' | 'currency' | 'number' | 'time';
  loading?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  trend = 'neutral',
  format = 'number',
  loading = false,
}) => {
  // Format the value based on the format prop
  const formattedValue = () => {
    if (loading) return '...';
    
    if (typeof value === 'number') {
      switch (format) {
        case 'percentage':
          return `${value.toFixed(1)}%`;
        case 'currency':
          return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'time':
          return `${value} min`;
        default:
          return value.toLocaleString('pt-BR');
      }
    }
    
    return value;
  };

  // Determine the color based on the trend
  const trendColor = () => {
    if (!change) return 'text-gray-500';
    
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Determine the arrow based on the trend
  const trendArrow = () => {
    if (!change) return null;
    
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && <div className="text-blue-500">{icon}</div>}
      </div>
      
      <div className="flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{formattedValue()}</p>
        
        {change && (
          <span className={`ml-2 text-sm font-medium ${trendColor()}`}>
            {trendArrow()} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      
      {description && (
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
};

export default KpiCard;