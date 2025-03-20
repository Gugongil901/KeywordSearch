import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Chart.js 레이더 차트 등록
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface StrengthWeaknessRadarProps {
  competitor: string;
  strengthsData: Record<string, number>;
  weaknessesData: Record<string, number>;
  size?: 'small' | 'medium' | 'large';
}

export function StrengthWeaknessRadar({ 
  competitor, 
  strengthsData, 
  weaknessesData,
  size = 'medium'
}: StrengthWeaknessRadarProps) {
  
  // 데이터셋 준비
  const strengths = Object.keys(strengthsData);
  const weaknesses = Object.keys(weaknessesData);
  
  // 모든 데이터 라벨 (카테고리)
  const labels = [...strengths, ...weaknesses];
  
  // 강점과 약점 데이터 값 배열
  const strengthValues = strengths.map(key => strengthsData[key]);
  const weaknessValues = weaknesses.map(key => weaknessesData[key]);
  
  // 데이터셋 준비
  const allStrengthValues = [...strengthValues, ...Array(weaknesses.length).fill(0)];
  const allWeaknessValues = [...Array(strengths.length).fill(0), ...weaknessValues];
  
  const data = {
    labels,
    datasets: [
      {
        label: '강점',
        data: allStrengthValues,
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: '약점',
        data: allWeaknessValues,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // 차트 옵션
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent',
        }
      }
    },
    plugins: {
      title: {
        display: true,
        text: `${competitor} 강점/약점 분석`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const datasetLabel = context.dataset.label || '';
            const value = context.raw || 0;
            return `${datasetLabel}: ${value}`;
          }
        }
      }
    }
  };
  
  // 차트 크기 설정
  const sizeStyles = {
    small: { height: '180px', width: '180px' },
    medium: { height: '250px', width: '250px' },
    large: { height: '350px', width: '350px' }
  };
  
  return (
    <div style={sizeStyles[size]} className="mx-auto">
      <Radar data={data} options={options as any} />
    </div>
  );
}