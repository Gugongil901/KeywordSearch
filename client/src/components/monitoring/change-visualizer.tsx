import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

// 변화 시각화 컴포넌트 props 타입
interface ChangeVisualizerProps {
  oldValue: number;
  newValue: number;
  changePercent: number;
  formatValue?: (value: number) => string;
}

/**
 * 변화 시각화 컴포넌트
 * 
 * 값의 변화를 시각적으로 표시합니다 (증가/감소, 변화율 등)
 */
export default function ChangeVisualizer({
  oldValue,
  newValue,
  changePercent,
  formatValue = (val) => val.toString()
}: ChangeVisualizerProps) {
  const isIncrease = newValue > oldValue;
  const isDecrease = newValue < oldValue;
  const isSignificant = Math.abs(changePercent) >= 10;
  
  return (
    <div className="flex flex-col text-xs">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">이전:</span>
        <span>{formatValue(oldValue)}</span>
      </div>
      <div className="flex items-center justify-between font-medium">
        <span className="text-muted-foreground">현재:</span>
        <span className="flex items-center">
          {formatValue(newValue)}
          {isIncrease && <ArrowUpIcon className="h-3 w-3 ml-1 text-green-500" />}
          {isDecrease && <ArrowDownIcon className="h-3 w-3 ml-1 text-red-500" />}
        </span>
      </div>
      <div className="text-right">
        <span 
          className={`text-xs ${
            isIncrease 
              ? isSignificant ? 'text-green-600 font-medium' : 'text-green-500' 
              : isDecrease 
                ? isSignificant ? 'text-red-600 font-medium' : 'text-red-500'
                : 'text-muted-foreground'
          }`}
        >
          {isIncrease && '+'}
          {changePercent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}