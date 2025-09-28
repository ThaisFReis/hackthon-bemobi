import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface StepData {
  step: string;
  time: number;
  color?: string;
}

interface PipelineChartProps {
  data: StepData[];
  title: string;
  subtitle?: string;
  loading?: boolean;
  height?: number;
}

const PipelineChart: React.FC<PipelineChartProps> = ({
  data,
  title,
  subtitle,
  loading = false,
  height = 300,
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

    // Default colors if not provided
    const defaultColors = [
      '#1890ff',
      '#52c41a',
      '#faad14',
      '#f5222d',
      '#722ed1',
      '#13c2c2',
    ];

    // Format data for the chart
    const formattedData = data.map((item, index) => ({
      name: item.step,
      value: item.time,
      itemStyle: {
        color: item.color || defaultColors[index % defaultColors.length],
      },
    }));

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const param = params[0];
          const timeInSeconds = param.value;
          
          // Format time based on magnitude
          let formattedTime;
          if (timeInSeconds < 1) {
            formattedTime = `${(timeInSeconds * 1000).toFixed(0)} ms`;
          } else if (timeInSeconds < 60) {
            formattedTime = `${timeInSeconds.toFixed(2)} s`;
          } else {
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = timeInSeconds % 60;
            formattedTime = `${minutes}m ${seconds.toFixed(0)}s`;
          }
          
          return `${param.name}: ${formattedTime}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: 'Tempo (s)',
        axisLabel: {
          formatter: (value: number) => {
            if (value < 1) {
              return `${(value * 1000).toFixed(0)} ms`;
            } else if (value < 60) {
              return `${value.toFixed(1)} s`;
            } else {
              const minutes = Math.floor(value / 60);
              return `${minutes}m`;
            }
          },
        },
      },
      yAxis: {
        type: 'category',
        data: formattedData.map(item => item.name),
        axisLabel: {
          fontSize: 12,
        },
      },
      series: [
        {
          name: 'Tempo de Processamento',
          type: 'bar',
          data: formattedData,
          barWidth: '60%',
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => {
              const timeInSeconds = params.value;
              
              if (timeInSeconds < 1) {
                return `${(timeInSeconds * 1000).toFixed(0)} ms`;
              } else if (timeInSeconds < 60) {
                return `${timeInSeconds.toFixed(2)} s`;
              } else {
                const minutes = Math.floor(timeInSeconds / 60);
                const seconds = timeInSeconds % 60;
                return `${minutes}m ${seconds.toFixed(0)}s`;
              }
            },
          },
        },
      ],
    };

    chartInstance.current!.setOption(option as any);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, loading]);

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

export default PipelineChart;