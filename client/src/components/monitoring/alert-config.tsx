import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  BarChart3Icon, 
  TrendingUpIcon, 
  StarIcon, 
  PlusCircleIcon 
} from 'lucide-react';
import { MonitoringThresholds } from '@shared/schema';

interface AlertConfigProps {
  thresholds: MonitoringThresholds;
  onChange: (thresholds: MonitoringThresholds) => void;
}

/**
 * 경쟁사 모니터링 알림 설정 컴포넌트
 */
const AlertConfig: React.FC<AlertConfigProps> = ({ thresholds, onChange }) => {
  const handlePriceChangeUpdate = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    
    onChange({
      ...thresholds,
      priceChangePercent: numValue
    });
  };
  
  const handleReviewChangeUpdate = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    
    onChange({
      ...thresholds,
      reviewChangePercent: numValue
    });
  };
  
  const handleSwitchChange = (key: 'newProduct' | 'rankChange', checked: boolean) => {
    onChange({
      ...thresholds,
      [key]: checked
    });
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">알림 설정</h3>
      <p className="text-sm text-muted-foreground mb-4">
        아래 조건을 충족하면 변경 사항을 알림으로 표시합니다.
      </p>
      
      {/* 가격 변화 알림 */}
      <div className="flex flex-row items-center gap-4">
        <div className="flex items-center space-x-2 min-w-[200px]">
          <BarChart3Icon className="h-4 w-4 text-orange-500" />
          <Label htmlFor="price-change" className="whitespace-nowrap">가격 변화</Label>
        </div>
        <div className="flex items-center">
          <Input
            id="price-change"
            type="number"
            min="0"
            step="1"
            value={thresholds.priceChangePercent}
            onChange={(e) => handlePriceChangeUpdate(e.target.value)}
            className="w-20 h-8"
          />
          <span className="ml-2">% 이상</span>
        </div>
      </div>
      
      {/* 리뷰 변화 알림 */}
      <div className="flex flex-row items-center gap-4">
        <div className="flex items-center space-x-2 min-w-[200px]">
          <StarIcon className="h-4 w-4 text-yellow-500" />
          <Label htmlFor="review-change" className="whitespace-nowrap">리뷰 변화</Label>
        </div>
        <div className="flex items-center">
          <Input
            id="review-change"
            type="number"
            min="0"
            step="1"
            value={thresholds.reviewChangePercent}
            onChange={(e) => handleReviewChangeUpdate(e.target.value)}
            className="w-20 h-8"
          />
          <span className="ml-2">% 이상</span>
        </div>
      </div>
      
      {/* 순위 변화 알림 */}
      <div className="flex flex-row items-center gap-4">
        <div className="flex items-center space-x-2 min-w-[200px]">
          <TrendingUpIcon className="h-4 w-4 text-blue-500" />
          <Label htmlFor="rank-change" className="whitespace-nowrap">순위 변화</Label>
        </div>
        <div className="flex items-center">
          <Switch
            id="rank-change"
            checked={thresholds.rankChange}
            onCheckedChange={(checked) => handleSwitchChange('rankChange', checked)}
          />
          <span className="ml-2">감지시 알림</span>
        </div>
      </div>
      
      {/* 신규 제품 알림 */}
      <div className="flex flex-row items-center gap-4">
        <div className="flex items-center space-x-2 min-w-[200px]">
          <PlusCircleIcon className="h-4 w-4 text-green-500" />
          <Label htmlFor="new-product" className="whitespace-nowrap">신규 제품</Label>
        </div>
        <div className="flex items-center">
          <Switch
            id="new-product"
            checked={thresholds.newProduct}
            onCheckedChange={(checked) => handleSwitchChange('newProduct', checked)}
          />
          <span className="ml-2">감지시 알림</span>
        </div>
      </div>
    </div>
  );
};

export default AlertConfig;