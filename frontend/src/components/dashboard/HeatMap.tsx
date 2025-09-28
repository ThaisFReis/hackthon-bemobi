import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
// Removendo importação problemática de 'echarts/map/js/world'

interface DataPoint {
  region: string;
  value: number;
}

interface HeatMapProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  loading?: boolean;
  height?: number;
  colorRange?: [string, string];
  valueLabel?: string;
}

const HeatMap: React.FC<HeatMapProps> = ({
  data,
  title,
  subtitle,
  loading = false,
  height = 400,
  colorRange = ['#e6f7ff', '#1890ff'],
  valueLabel = 'Valor',
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    // Initialize chart
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current || loading) return;

    // Find min and max values for better visualization
    const values = data.map((item) => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const option: echarts.EChartsOption = {
      title: {
        text: '',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const { name, value } = params[0];
          return `${name}: ${value !== undefined ? value.toLocaleString('pt-BR') : 'N/A'} ${valueLabel}`;
        },
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.region),
        axisLabel: {
          rotate: 45,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: valueLabel
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      series: [
        {
          name: title,
          type: 'bar',
          itemStyle: {
            color: function(params: any) {
              // Criar um gradiente baseado no valor
              const percent = (params.value - minValue) / (maxValue - minValue || 1);
              // Implementação manual de interpolação de cor
              const startColor = colorRange[0];
              const endColor = colorRange[1];
              
              // Função para converter hex para RGB
              const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16)
                } : {r: 0, g: 0, b: 0};
              };
              
              // Função para interpolar entre duas cores
              const interpolateColor = (color1: string, color2: string, factor: number) => {
                const c1 = hexToRgb(color1);
                const c2 = hexToRgb(color2);
                const r = Math.round(c1.r + factor * (c2.r - c1.r));
                const g = Math.round(c1.g + factor * (c2.g - c1.g));
                const b = Math.round(c1.b + factor * (c2.b - c1.b));
                return `rgb(${r}, ${g}, ${b})`;
              };
              
              return interpolateColor(startColor, endColor, percent);
            }
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => params.value.toLocaleString('pt-BR')
          },
          data: data.map((item) => item.value),
        },
      ],
    };

    chartInstance.current.setOption(option as any);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, loading, title, colorRange, valueLabel]);

  if (loading) {
    return (
      <div
        className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div
        ref={chartRef}
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
};

export default HeatMap;