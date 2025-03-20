import React, { useEffect, useRef } from 'react';

/**
 * 강점과 약점을 레이더 차트로 시각화하는 컴포넌트
 * 
 * 주의: 이 컴포넌트는 실제 차트 라이브러리가 설치된 프로젝트에서 사용해야 합니다.
 * 현재는 표시 목적으로만 구현되었습니다.
 */

interface StrengthWeaknessRadarProps {
  competitor: string;
  strengthsData: Record<string, number>;
  weaknessesData: Record<string, number>;
  size?: 'small' | 'medium' | 'large';
}

export default function StrengthWeaknessRadar({
  competitor,
  strengthsData,
  weaknessesData,
  size = 'medium'
}: StrengthWeaknessRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 차트 크기 설정
  const getChartSize = () => {
    switch (size) {
      case 'small': return { width: 200, height: 200 };
      case 'large': return { width: 400, height: 400 };
      default: return { width: 300, height: 300 };
    }
  };
  
  const { width, height } = getChartSize();
  
  // 심플 레이더 차트 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 캔버스 초기화
    ctx.clearRect(0, 0, width, height);
    
    // 모든 데이터 포인트 (강점 + 약점)
    const allDataPoints = {
      ...strengthsData,
      ...weaknessesData
    };
    
    // 중심점 및 반지름 설정
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 20;
    
    // 축 개수 (데이터 포인트 수)
    const axisCount = Object.keys(allDataPoints).length;
    if (axisCount < 3) return; // 최소 3개 이상의 축이 필요
    
    // 축 그리기
    const angleStep = (Math.PI * 2) / axisCount;
    let currentAngle = -Math.PI / 2; // 12시 방향에서 시작
    
    // 배경 그리드 그리기
    ctx.strokeStyle = '#e5e7eb'; // 연한 회색
    ctx.lineWidth = 1;
    
    // 외곽선 그리기
    ctx.beginPath();
    for (let i = 0; i < axisCount; i++) {
      const x = centerX + maxRadius * Math.cos(currentAngle);
      const y = centerY + maxRadius * Math.sin(currentAngle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      currentAngle += angleStep;
    }
    ctx.closePath();
    ctx.stroke();
    
    // 내부 그리드 그리기 (25%, 50%, 75%)
    for (let percent = 0.25; percent < 1; percent += 0.25) {
      const radius = maxRadius * percent;
      currentAngle = -Math.PI / 2;
      
      ctx.beginPath();
      for (let i = 0; i < axisCount; i++) {
        const x = centerX + radius * Math.cos(currentAngle);
        const y = centerY + radius * Math.sin(currentAngle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        currentAngle += angleStep;
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    // 축 선 그리기
    currentAngle = -Math.PI / 2;
    for (let i = 0; i < axisCount; i++) {
      const x = centerX + maxRadius * Math.cos(currentAngle);
      const y = centerY + maxRadius * Math.sin(currentAngle);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      currentAngle += angleStep;
    }
    
    // 축 레이블 그리기
    currentAngle = -Math.PI / 2;
    ctx.fillStyle = '#6b7280'; // 회색
    ctx.font = `${size === 'small' ? '8' : size === 'large' ? '14' : '12'}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const keys = Object.keys(allDataPoints);
    for (let i = 0; i < axisCount; i++) {
      const key = keys[i];
      const labelRadius = maxRadius + 15;
      const x = centerX + labelRadius * Math.cos(currentAngle);
      const y = centerY + labelRadius * Math.sin(currentAngle);
      
      // 텍스트 레이블 위치 조정
      let textX = x;
      let textY = y;
      
      // 상단/하단 레이블은 약간 위/아래로 조정
      if (Math.abs(currentAngle + Math.PI / 2) < 0.1) { // 상단
        textY -= 5;
      } else if (Math.abs(currentAngle - Math.PI / 2) < 0.1) { // 하단
        textY += 5;
      }
      
      ctx.fillText(key, textX, textY);
      currentAngle += angleStep;
    }
    
    // 강점 영역 그리기
    const drawDataArea = (data: Record<string, number>, fillColor: string, strokeColor: string) => {
      currentAngle = -Math.PI / 2;
      ctx.beginPath();
      
      let first = true;
      for (let i = 0; i < axisCount; i++) {
        const key = keys[i];
        const value = data[key] || 0; // 해당 키가 없으면 0
        const percent = value / 100; // 0-100 값 범위 가정
        const radius = maxRadius * Math.min(1, Math.max(0, percent));
        
        const x = centerX + radius * Math.cos(currentAngle);
        const y = centerY + radius * Math.sin(currentAngle);
        
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
        
        currentAngle += angleStep;
      }
      
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    
    // 강점 데이터 포인트만 필터링
    const strengthsOnly: Record<string, number> = {};
    const weaknessesOnly: Record<string, number> = {};
    
    for (let i = 0; i < axisCount; i++) {
      const key = keys[i];
      if (strengthsData[key] !== undefined) {
        strengthsOnly[key] = strengthsData[key];
        weaknessesOnly[key] = 0; // 강점 영역에는 약점 0으로 설정
      } else if (weaknessesData[key] !== undefined) {
        weaknessesOnly[key] = weaknessesData[key];
        strengthsOnly[key] = 0; // 약점 영역에는 강점 0으로 설정
      }
    }
    
    // 강점 및 약점 영역 그리기
    drawDataArea(strengthsOnly, '#10b981', '#059669'); // 초록색 (강점)
    drawDataArea(weaknessesOnly, '#f97316', '#ea580c'); // 주황색 (약점)
    
    // 데이터 포인트 그리기
    currentAngle = -Math.PI / 2;
    for (let i = 0; i < axisCount; i++) {
      const key = keys[i];
      const value = allDataPoints[key] || 0;
      const percent = value / 100;
      const radius = maxRadius * Math.min(1, Math.max(0, percent));
      
      const x = centerX + radius * Math.cos(currentAngle);
      const y = centerY + radius * Math.sin(currentAngle);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = strengthsData[key] !== undefined ? '#059669' : '#ea580c';
      ctx.fill();
      
      currentAngle += angleStep;
    }
    
  }, [competitor, strengthsData, weaknessesData, width, height]);
  
  return (
    <div className="flex justify-center items-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}