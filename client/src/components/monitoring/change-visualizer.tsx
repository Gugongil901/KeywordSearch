import React from 'react';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

interface ChangeVisualizerProps {
  oldValue: number;
  newValue: number;
  changePercent: number;
  formatValue?: (value: number) => string;
}

/**
 * 변화를 시각적으로 보여주는 컴포넌트
 */
const ChangeVisualizer: React.FC<ChangeVisualizerProps> = ({
  oldValue,
  newValue,
  changePercent,
  formatValue = (value: number) => value.toLocaleString()
}) => {
  const isIncrease = newValue > oldValue;
  
  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <span className="text-sm font-medium">
          {formatValue(newValue)}
        </span>
        <div className={`ml-2 flex items-center ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
          {isIncrease ? (
            <ArrowUpIcon className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDownIcon className="h-3 w-3 mr-1" />
          )}
          <span className="text-xs">
            {Math.abs(changePercent).toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        이전: {formatValue(oldValue)}
      </div>
    </div>
  );
};

export default ChangeVisualizer;