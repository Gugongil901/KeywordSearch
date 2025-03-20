import React from 'react';
import { MonitoringThresholds } from '@shared/schema';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  BarChart3Icon, 
  PlusCircleIcon, 
  ArrowUpIcon, 
  StarIcon 
} from 'lucide-react';

// 알림 설정 컴포넌트 props 타입
interface AlertConfigProps {
  thresholds: MonitoringThresholds;
  onChange: (thresholds: MonitoringThresholds) => void;
}

/**
 * 알림 설정 컴포넌트
 * 
 * 모니터링 알림 임계값을 설정하는 UI를 제공합니다.
 */
export default function AlertConfig({
  thresholds,
  onChange
}: AlertConfigProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-2">알림 설정</h3>
      
      {/* 가격 변동 알림 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3Icon className="h-4 w-4 text-blue-500" />
          <Label htmlFor="price-change">가격 변동</Label>
        </div>
        <div className="flex items-center gap-2">
          <Input
            id="price-change"
            type="number"
            min="1"
            max="100"
            className="w-16 h-8"
            value={thresholds.priceChangePercent}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0 && value <= 100) {
                onChange({
                  ...thresholds,
                  priceChangePercent: value
                });
              }
            }}
          />
          <span className="text-sm">% 이상</span>
        </div>
      </div>
      
      {/* 신제품 알림 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlusCircleIcon className="h-4 w-4 text-green-500" />
          <Label htmlFor="new-product">신제품 등록</Label>
        </div>
        <Switch
          id="new-product"
          checked={thresholds.newProduct}
          onCheckedChange={(checked) => {
            onChange({
              ...thresholds,
              newProduct: checked
            });
          }}
        />
      </div>
      
      {/* 순위 변동 알림 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpIcon className="h-4 w-4 text-orange-500" />
          <Label htmlFor="rank-change">순위 변동</Label>
        </div>
        <Switch
          id="rank-change"
          checked={thresholds.rankChange}
          onCheckedChange={(checked) => {
            onChange({
              ...thresholds,
              rankChange: checked
            });
          }}
        />
      </div>
      
      {/* 리뷰 변동 알림 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StarIcon className="h-4 w-4 text-yellow-500" />
          <Label htmlFor="review-change">리뷰 변동</Label>
        </div>
        <div className="flex items-center gap-2">
          <Input
            id="review-change"
            type="number"
            min="1"
            max="100"
            className="w-16 h-8"
            value={thresholds.reviewChangePercent}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0 && value <= 100) {
                onChange({
                  ...thresholds,
                  reviewChangePercent: value
                });
              }
            }}
          />
          <span className="text-sm">% 이상</span>
        </div>
      </div>
    </div>
  );
}