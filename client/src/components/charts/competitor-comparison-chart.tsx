/**
 * 경쟁사 비교 차트 컴포넌트
 * 여러 경쟁사의 주요 지표를 한눈에 비교할 수 있는 차트
 */

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
} from "chart.js";
import { Bar, Radar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 직접 인터페이스 정의
interface CompetitorInsight {
  competitor: string;
  threatLevel: number; // 0-100 사이 값
  marketShare: number; // 0-100 사이 값
  growthRate: number; // 백분율
  priceStrategy: 'aggressive' | 'premium' | 'standard' | 'economy';
  strengths: string[];
  weaknesses: string[];
  strengthsDetails: Record<string, {
    description: string;
    metrics: string;
    impact: string;
    examples: string[];
  }>;
  weaknessesDetails: Record<string, {
    description: string;
    metrics: string;
    impact: string;
    recommendations: string[];
  }>;
  representativeProduct: {
    name: string;
    price: number;
    image: string;
    url: string;
    reviews: number;
    rank: number;
    productId: string;
    collectedAt: string;
  };
}

// Chart.js 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

// 이 컴포넌트의 Props 타입 정의
interface CompetitorComparisonChartProps {
  insights: Record<string, CompetitorInsight>;
  competitors: string[];
  chartType?: 'bar' | 'radar';
  metric?: 'threatLevel' | 'marketShare' | 'growthRate';
  height?: number;
  title?: string;
  description?: string;
}

export function CompetitorComparisonChart({
  insights,
  competitors,
  chartType = 'bar',
  metric = 'marketShare',
  height = 300,
  title = '경쟁사 비교',
  description = '선택된 경쟁사들의 주요 지표를 비교합니다.'
}: CompetitorComparisonChartProps) {
  // 선택된 경쟁사 중 인사이트가 있는 경쟁사만 필터링
  const filteredCompetitors = competitors.filter(id => insights[id]);
  
  // 데이터가 없으면 빈 차트 표시
  if (filteredCompetitors.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div style={{ height }} className="flex items-center justify-center">
            <p className="text-gray-500 text-sm">데이터가 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // 고정 색상 세트 - 바 차트와 레이더 차트 모두 사용
  const backgroundColors = [
    'rgba(37, 99, 235, 0.6)',  // 파랑
    'rgba(5, 150, 105, 0.6)',  // 초록
    'rgba(220, 38, 38, 0.6)',  // 빨강
    'rgba(217, 119, 6, 0.6)',  // 주황
    'rgba(109, 40, 217, 0.6)', // 보라
    'rgba(219, 39, 119, 0.6)', // 분홍
  ];
  
  const borderColors = [
    'rgba(37, 99, 235, 1)',
    'rgba(5, 150, 105, 1)',
    'rgba(220, 38, 38, 1)',
    'rgba(217, 119, 6, 1)',
    'rgba(109, 40, 217, 1)',
    'rgba(219, 39, 119, 1)',
  ];
  
  const radarBackgroundColors = [
    'rgba(37, 99, 235, 0.2)',
    'rgba(5, 150, 105, 0.2)',
    'rgba(220, 38, 38, 0.2)',
    'rgba(217, 119, 6, 0.2)',
    'rgba(109, 40, 217, 0.2)',
    'rgba(219, 39, 119, 0.2)',
  ];
  
  // 메트릭에 따른 라벨 설정
  let metricLabel = '';
  switch (metric) {
    case 'threatLevel':
      metricLabel = '위협 수준';
      break;
    case 'marketShare':
      metricLabel = '시장 점유율 (%)';
      break;
    case 'growthRate': 
      metricLabel = '성장률 (%)';
      break;
    default:
      metricLabel = '시장 점유율 (%)';
  }
  
  // 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 11
          },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
          borderDash: [5, 5]
        },
        ticks: {
          font: { size: 11 },
          padding: 8
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 11 },
          padding: 8
        }
      }
    },
    elements: {
      bar: {
        borderWidth: 1,
        borderRadius: 6,
      },
      point: {
        radius: 4,
        hoverRadius: 6
      },
      line: {
        tension: 0.3
      }
    }
  };
  
  // 레이더 차트 추가 옵션
  const radarOptions = {
    ...chartOptions,
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          stepSize: 20,
          display: false
        }
      }
    }
  };
  
  let chartData = {};
  
  if (chartType === 'bar') {
    // 바 차트 데이터
    chartData = {
      labels: filteredCompetitors.map(id => insights[id].competitor),
      datasets: [
        {
          label: metricLabel,
          data: filteredCompetitors.map(id => insights[id][metric]),
          backgroundColor: filteredCompetitors.map((_, i) => backgroundColors[i % backgroundColors.length]),
          borderColor: filteredCompetitors.map((_, i) => borderColors[i % borderColors.length]),
          borderWidth: 1
        }
      ]
    };
  } else {
    // 레이더 차트 데이터
    chartData = {
      labels: ['위협 수준', '시장 점유율', '성장률'],
      datasets: filteredCompetitors.map((id, index) => ({
        label: insights[id].competitor,
        data: [
          insights[id].threatLevel,
          insights[id].marketShare,
          insights[id].growthRate
        ],
        backgroundColor: radarBackgroundColors[index % radarBackgroundColors.length],
        borderColor: borderColors[index % borderColors.length],
        borderWidth: 2,
        pointBackgroundColor: borderColors[index % borderColors.length],
        pointRadius: 3
      }))
    };
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </CardHeader>
      <CardContent className="pt-0">
        <div style={{ height }}>
          {chartType === 'bar' ? (
            <Bar options={chartOptions} data={chartData} />
          ) : (
            <Radar options={radarOptions} data={chartData} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}