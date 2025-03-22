/**
 * 경쟁사 비교 차트 컴포넌트
 * 여러 경쟁사의 주요 지표를 한눈에 비교할 수 있는 차트
 */

import React, { useEffect, useState } from "react";
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
import { getPaletteFromLocalStorage, getChartPaletteColors } from "../theme/ColorPaletteSelector";

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

// 차트에서 사용할 색상 팔레트 타입
interface ChartColorPalette {
  background: string[];
  border: string[];
  radar: string[];
}

// 이 컴포넌트의 Props 타입 정의
interface CompetitorComparisonChartProps {
  insights: Record<string, CompetitorInsight>;
  competitors: string[];
  chartType?: 'bar' | 'radar';
  metric?: 'threatLevel' | 'marketShare' | 'growthRate';
  height?: number;
  title?: string;
  description?: string;
  colorPalette?: ChartColorPalette; // 옵션 - 직접 팔레트 전달 가능
}

export function CompetitorComparisonChart({
  insights,
  competitors,
  chartType = 'bar',
  metric = 'marketShare',
  height = 300,
  title = '경쟁사 비교',
  description = '선택된 경쟁사들의 주요 지표를 비교합니다.',
  colorPalette
}: CompetitorComparisonChartProps) {
  // 테마 관리를 위한 상태
  const [chartColors, setChartColors] = useState<{
    background: string[];
    border: string[];
    radar: string[];
  }>({
    background: [],
    border: [],
    radar: []
  });
  
  // 로컬 스토리지에서 저장된 테마 불러오기 및 적용
  useEffect(() => {
    const paletteId = getPaletteFromLocalStorage();
    const themeColors = getChartPaletteColors(paletteId);
    setChartColors(themeColors);
  }, []);
  
  // 선택된 경쟁사 중 인사이트가 있는 경쟁사만 필터링
  const filteredCompetitors = competitors.filter(id => insights[id]);
  
  // 데이터가 없으면 빈 차트 표시
  if (filteredCompetitors.length === 0) {
    return (
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-sm font-medium text-gray-800">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-3 pb-3">
          <div style={{ height }} className="flex items-center justify-center">
            <p className="text-gray-500 text-sm">데이터가 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // 팔레트 색상 사용 (직접 전달된 팔레트 또는 테마 시스템 색상)
  const chartPalette = colorPalette ? {
    background: colorPalette.background || [],
    border: colorPalette.border || [],
    radar: colorPalette.radar || []
  } : chartColors;
  
  // 선택된 색상 팔레트 사용
  const backgroundColors = chartPalette.background.length > 0 ? 
    chartPalette.background : 
    ['rgba(14, 165, 233, 0.5)', 'rgba(59, 130, 246, 0.5)']; // 기본값
    
  const borderColors = chartPalette.border.length > 0 ? 
    chartPalette.border : 
    ['rgba(14, 165, 233, 0.8)', 'rgba(59, 130, 246, 0.8)'];
    
  const radarBackgroundColors = chartPalette.radar.length > 0 ? 
    chartPalette.radar : 
    ['rgba(14, 165, 233, 0.15)', 'rgba(59, 130, 246, 0.15)'];
  
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
  
  // 더 세련된 미니멀한 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          font: {
            size: 10,
            family: "'Pretendard', 'Apple SD Gothic Neo', sans-serif"
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        titleFont: {
          size: 11,
          weight: 500  // 문자열이 아닌 숫자로 변경
        },
        bodyFont: {
          size: 10
        },
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 8,
        boxPadding: 3,
        displayColors: true,
        cornerRadius: 4,
        usePointStyle: true,
        callbacks: {
          labelPointStyle: function() {
            return {
              pointStyle: 'circle',
              rotation: 0
            };
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        border: {
          display: false
        },
        grid: {
          color: 'rgba(243, 244, 246, 0.5)',
          lineWidth: 0.5,
          borderDash: [3, 3]
        },
        ticks: {
          font: { 
            size: 10,
            family: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" 
          },
          padding: 6,
          color: '#9CA3AF'
        }
      },
      x: {
        border: {
          display: false
        },
        grid: {
          display: false
        },
        ticks: {
          font: { 
            size: 10,
            family: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" 
          },
          padding: 6,
          color: '#9CA3AF'
        }
      }
    },
    elements: {
      bar: {
        borderWidth: 0,
        borderRadius: 4,
      },
      point: {
        radius: 3,
        hoverRadius: 4,
        borderWidth: 1
      },
      line: {
        tension: 0.3,
        borderWidth: 1.5
      }
    }
  };
  
  // 레이더 차트 추가 옵션 - 더 세련된 미니멀 디자인
  const radarOptions = {
    ...chartOptions,
    scales: {
      r: {
        beginAtZero: true,
        angleLines: {
          color: 'rgba(180, 190, 200, 0.2)',
          lineWidth: 0.5
        },
        grid: {
          color: 'rgba(180, 190, 200, 0.15)',
          circular: true,
          lineWidth: 0.5
        },
        pointLabels: {
          font: {
            size: 10,
            family: "'Pretendard', 'Apple SD Gothic Neo', sans-serif"
          },
          color: '#6B7280'
        },
        ticks: {
          stepSize: 20,
          display: false,
          backdropColor: 'transparent'
        }
      }
    }
  };
  
  let chartData = {};
  
  if (chartType === 'bar') {
    // 더 세련된 바 차트 데이터
    chartData = {
      labels: filteredCompetitors.map(id => insights[id].competitor),
      datasets: [
        {
          label: metricLabel,
          data: filteredCompetitors.map(id => insights[id][metric]),
          backgroundColor: filteredCompetitors.map((_, i) => backgroundColors[i % backgroundColors.length]),
          borderColor: 'transparent',  // 테두리 제거
          borderWidth: 0,              // 테두리 두께 0
          borderRadius: 3,            // 모서리 라운딩
          barThickness: 18,           // 바 두께 조절 - 더 얇게
          maxBarThickness: 25         // 최대 두께 제한
        }
      ]
    };
  } else {
    // 더 세련된 레이더 차트 데이터
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
        borderWidth: 1.5,                   // 테두리 더 얇게
        pointBackgroundColor: borderColors[index % borderColors.length],
        pointBorderColor: '#fff',           // 포인트 테두리 색상
        pointRadius: 2.5,                   // 포인트 크기 줄임
        pointHoverRadius: 3.5,              // 호버 시 포인트 크기
        pointHoverBackgroundColor: '#fff',  // 호버 시 배경색
        pointHoverBorderColor: borderColors[index % borderColors.length]  // 호버 시 테두리색
      }))
    };
  }

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardHeader className="pb-1 pt-3">
        <CardTitle className="text-sm font-medium text-gray-800">{title}</CardTitle>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3">
        <div style={{ height }} className="mt-1">
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