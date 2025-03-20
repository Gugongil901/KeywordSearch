import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MonitoringThresholds } from '@shared/schema';
import { 
  BellIcon, 
  PercentIcon,
  StarIcon,
  TrendingUpIcon,
  ListPlusIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertConfigProps {
  thresholds: MonitoringThresholds;
  onChange: (newThresholds: MonitoringThresholds) => void;
  className?: string;
}

export default function AlertConfig({ thresholds, onChange, className }: AlertConfigProps) {
  const handlePriceChangeUpdate = (value: number[]) => {
    onChange({
      ...thresholds,
      priceChangePercent: value[0]
    });
  };

  const handleReviewChangeUpdate = (value: number[]) => {
    onChange({
      ...thresholds,
      reviewChangePercent: value[0]
    });
  };

  const handleToggleNewProduct = (checked: boolean) => {
    onChange({
      ...thresholds,
      newProduct: checked
    });
  };

  const handleToggleRankChange = (checked: boolean) => {
    onChange({
      ...thresholds,
      rankChange: checked
    });
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <BellIcon className="h-5 w-5 text-primary" />
          알림 설정
        </CardTitle>
        <CardDescription>
          모니터링 알림을 받을 기준을 설정합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {/* 가격 변동 설정 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2" htmlFor="price-change-threshold">
                <PercentIcon className="h-4 w-4 text-muted-foreground" />
                가격 변동 알림
              </Label>
              <span className="text-sm font-medium">
                {thresholds.priceChangePercent}% 이상
              </span>
            </div>
            <Slider
              id="price-change-threshold"
              min={1}
              max={50}
              step={1}
              value={[thresholds.priceChangePercent]}
              onValueChange={handlePriceChangeUpdate}
            />
          </div>

          {/* 리뷰 변동 설정 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2" htmlFor="review-change-threshold">
                <StarIcon className="h-4 w-4 text-muted-foreground" />
                리뷰 증가 알림
              </Label>
              <span className="text-sm font-medium">
                {thresholds.reviewChangePercent}% 이상
              </span>
            </div>
            <Slider
              id="review-change-threshold"
              min={5}
              max={100}
              step={5}
              value={[thresholds.reviewChangePercent]}
              onValueChange={handleReviewChangeUpdate}
            />
          </div>

          {/* 신규 제품 알림 */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2" htmlFor="new-product-toggle">
              <ListPlusIcon className="h-4 w-4 text-muted-foreground" />
              신규 제품 알림
            </Label>
            <Switch
              id="new-product-toggle"
              checked={thresholds.newProduct}
              onCheckedChange={handleToggleNewProduct}
            />
          </div>

          {/* 순위 변동 알림 */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2" htmlFor="rank-change-toggle">
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
              순위 변동 알림
            </Label>
            <Switch
              id="rank-change-toggle"
              checked={thresholds.rankChange}
              onCheckedChange={handleToggleRankChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}