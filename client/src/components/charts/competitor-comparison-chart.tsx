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

// 색상 팔레트
const CHART_COLORS = [
  'rgba(59, 130, 246, 0.7)',   // 파랑
  'rgba(16, 185, 129, 0.7)',   // 초록
  'rgba(239, 68, 68, 0.7)',    // 빨강
  'rgba(245, 158, 11, 0.7)',   // 주황
  'rgba(139, 92, 246, 0.7)',   // 보라
  'rgba(236, 72, 153, 0.7)',   // 분홍
  'rgba(14, 165, 233, 0.7)',   // 하늘
  'rgba(249, 115, 22, 0.7)',   // 진한 주황
  'rgba(79, 70, 229, 0.7)',    // 인디고
  'rgba(168, 85, 247, 0.7)',   // 연보라
  'rgba(20, 184, 166, 0.7)',   // 청록
  'rgba(251, 191, 36, 0.7)'    // 노랑
];

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
        }
      }
    },
    title: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#333',
      bodyColor: '#666',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 10,
      boxPadding: 4,
      usePointStyle: true,
      callbacks: {
        labelTextColor: () => '#666'
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

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

  // 차트 데이터 설정
  let chartData = {
    labels: [] as string[],
    datasets: [] as any[]
  };
  
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
  
  // 차트 타입에 따라 다른 데이터 형식 사용
  if (chartType === 'bar') {
    // 바 차트 데이터 형식
    chartData = {
      labels: filteredCompetitors.map(id => insights[id].competitor),
      datasets: [
        {
          label: metricLabel,
          data: filteredCompetitors.map(id => insights[id][metric]),
          backgroundColor: filteredCompetitors.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderColor: filteredCompetitors.map((_, i) => CHART_COLORS[i % CHART_COLORS.length].replace('0.7', '1')),
          borderWidth: 1
        }
      ]
    };
  } else {
    // 레이더 차트 데이터 형식 (모든 지표를 한 번에 표시)
    chartData = {
      labels: ['위협 수준', '시장 점유율', '성장률'],
      datasets: filteredCompetitors.map((id, index) => ({
        label: insights[id].competitor,
        data: [
          insights[id].threatLevel,
          insights[id].marketShare,
          insights[id].growthRate
        ],
        backgroundColor: CHART_COLORS[index % CHART_COLORS.length].replace('0.7', '0.2'),
        borderColor: CHART_COLORS[index % CHART_COLORS.length].replace('0.7', '1'),
        borderWidth: 2,
        pointBackgroundColor: CHART_COLORS[index % CHART_COLORS.length].replace('0.7', '1'),
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
            <Radar 
              data={chartData} 
              options={{
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
              }} 
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}