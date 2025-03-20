import React from 'react';

interface StrengthWeaknessRadarProps {
  strengths: Record<string, number>;
  weaknesses: Record<string, number>;
  size?: 'small' | 'medium' | 'large';
}

/**
 * 강점/약점 레이더 차트 컴포넌트
 * 
 * 경쟁사의 강점과 약점을 레이더 차트 형태로 시각화합니다.
 */
const StrengthWeaknessRadar: React.FC<StrengthWeaknessRadarProps> = ({
  strengths,
  weaknesses,
  size = 'medium'
}) => {
  // 사이즈별 SVG 크기 및 스타일 설정
  const dimensions = {
    small: { width: 200, height: 170, fontSize: 8, lineWidth: 1, pointSize: 3 },
    medium: { width: 300, height: 250, fontSize: 10, lineWidth: 1.5, pointSize: 4 },
    large: { width: 400, height: 350, fontSize: 12, lineWidth: 2, pointSize: 5 }
  };
  
  const { width, height, fontSize, lineWidth, pointSize } = dimensions[size];
  
  // 차트 중심점 및 반지름 계산
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) * 0.8;
  
  // 모든 속성 결합 (강점 + 약점)
  const allAttributes = { ...strengths, ...weaknesses };
  const attributeNames = Object.keys(allAttributes);
  const attributeCount = attributeNames.length;
  
  // 각도 계산
  const getAngle = (index: number) => (Math.PI * 2 * index) / attributeCount;
  
  // 점 좌표 계산
  const getCoordinates = (value: number, angle: number) => {
    const normalized = value / 100; // 0-100 범위의 값을 0-1로 정규화
    const x = centerX + radius * normalized * Math.cos(angle - Math.PI / 2);
    const y = centerY + radius * normalized * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };
  
  // 레이블 좌표 계산
  const getLabelCoordinates = (angle: number) => {
    const x = centerX + (radius + 15) * Math.cos(angle - Math.PI / 2);
    const y = centerY + (radius + 15) * Math.sin(angle - Math.PI / 2);
    return { x, y };
  };
  
  // 다각형 경로 생성 함수
  const createPolygonPath = (attributes: Record<string, number>) => {
    return attributeNames.map((name, i) => {
      const value = attributes[name] || 0;
      const angle = getAngle(i);
      const { x, y } = getCoordinates(value, angle);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ') + ' Z';
  };
  
  // 강점 경로
  const strengthPath = createPolygonPath(strengths);
  
  // 약점 경로
  const weaknessPath = createPolygonPath(weaknesses);
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* 배경 원 그리기 */}
      {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <circle
          key={i}
          cx={centerX}
          cy={centerY}
          r={radius * ratio}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={0.5}
          strokeDasharray={i === 0 ? 'none' : '2,2'}
        />
      ))}
      
      {/* 축 그리기 */}
      {attributeNames.map((name, i) => {
        const angle = getAngle(i);
        const { x, y } = getCoordinates(100, angle);
        return (
          <line
            key={name}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke="#e2e8f0"
            strokeWidth={0.5}
            strokeDasharray="2,2"
          />
        );
      })}
      
      {/* 강점 영역 그리기 */}
      <path
        d={strengthPath}
        fill="rgba(34, 197, 94, 0.2)"
        stroke="#22c55e"
        strokeWidth={lineWidth}
      />
      
      {/* 약점 영역 그리기 */}
      <path
        d={weaknessPath}
        fill="rgba(239, 68, 68, 0.2)"
        stroke="#ef4444"
        strokeWidth={lineWidth}
      />
      
      {/* 강점 점 그리기 */}
      {Object.entries(strengths).map(([name, value], i) => {
        const index = attributeNames.indexOf(name);
        if (index === -1) return null;
        
        const angle = getAngle(index);
        const { x, y } = getCoordinates(value, angle);
        
        return (
          <circle
            key={`strength-${name}`}
            cx={x}
            cy={y}
            r={pointSize}
            fill="#22c55e"
          />
        );
      })}
      
      {/* 약점 점 그리기 */}
      {Object.entries(weaknesses).map(([name, value], i) => {
        const index = attributeNames.indexOf(name);
        if (index === -1) return null;
        
        const angle = getAngle(index);
        const { x, y } = getCoordinates(value, angle);
        
        return (
          <circle
            key={`weakness-${name}`}
            cx={x}
            cy={y}
            r={pointSize}
            fill="#ef4444"
          />
        );
      })}
      
      {/* 속성 이름 레이블 */}
      {attributeNames.map((name, i) => {
        const angle = getAngle(i);
        const { x, y } = getLabelCoordinates(angle);
        
        // 텍스트 정렬 조정
        let textAnchor = 'middle';
        if (x < centerX - radius / 2) textAnchor = 'end';
        else if (x > centerX + radius / 2) textAnchor = 'start';
        
        // 위치 미세 조정
        let dx = 0;
        let dy = 0;
        
        if (Math.abs(x - centerX) < 10) dx = 0;
        else if (x < centerX) dx = -5;
        else dx = 5;
        
        if (Math.abs(y - centerY) < 10) dy = 0;
        else if (y < centerY) dy = -5;
        else dy = 12;
        
        return (
          <text
            key={name}
            x={x + dx}
            y={y + dy}
            textAnchor={textAnchor}
            fontSize={fontSize}
            fill="#64748b"
          >
            {name}
          </text>
        );
      })}
    </svg>
  );
};

export default StrengthWeaknessRadar;