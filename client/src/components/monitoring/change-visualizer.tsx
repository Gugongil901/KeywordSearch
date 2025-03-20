import React from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  AlertCircleIcon,
  BarChart2Icon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/ui/product-image';
import { CompetitorProduct, PriceChange, RankChange, ReviewChange, NewProductAlert } from '@shared/schema';

type ChangeItem = PriceChange | RankChange | ReviewChange | NewProductAlert;
type ChangeType = 'price' | 'rank' | 'review' | 'new_product';

interface ChangeVisualizerProps {
  changes: ChangeItem[];
  type: ChangeType;
  className?: string;
}

export default function ChangeVisualizer({ changes, type, className = '' }: ChangeVisualizerProps) {
  if (!changes || changes.length === 0) {
    return (
      <Card className={`p-4 bg-gray-50 border-dashed ${className}`}>
        <div className="text-center text-gray-500 py-6">
          <BarChart2Icon className="mx-auto mb-2 h-8 w-8" />
          <p>변화 없음</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div className="divide-y">
          {changes.map((change, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <ProductImage 
                    src={change.product.image}
                    alt={change.product.name}
                    title={change.product.name}
                    productId={change.product.productId}
                    width={64}
                    height={64}
                  />
                </div>
                
                <div className="flex-grow min-w-0">
                  <h4 className="font-medium text-sm truncate">{change.product.name}</h4>
                  
                  {type === 'price' && 'oldPrice' in change && (
                    <div className="flex items-center mt-1 gap-2">
                      <span className="text-gray-500 line-through">
                        {change.oldPrice.toLocaleString()}원
                      </span>
                      <span className="font-semibold">
                        {change.newPrice.toLocaleString()}원
                      </span>
                      
                      <Badge variant={change.changePercent > 0 ? "destructive" : "default"}>
                        <span className="flex items-center gap-1">
                          {change.changePercent > 0 ? (
                            <ArrowUpIcon className="h-3 w-3" />
                          ) : (
                            <ArrowDownIcon className="h-3 w-3" />
                          )}
                          {Math.abs(change.changePercent).toFixed(1)}%
                        </span>
                      </Badge>
                    </div>
                  )}
                  
                  {type === 'rank' && 'oldRank' in change && (
                    <div className="flex items-center mt-1 gap-2">
                      <span className="text-gray-500 line-through">
                        {change.oldRank}위
                      </span>
                      <span className="font-semibold">
                        {change.newRank}위
                      </span>
                      
                      <Badge variant={change.change < 0 ? "destructive" : "default"}>
                        <span className="flex items-center gap-1">
                          {change.change < 0 ? (
                            <ArrowUpIcon className="h-3 w-3" />
                          ) : (
                            <ArrowDownIcon className="h-3 w-3" />
                          )}
                          {Math.abs(change.change)}위
                        </span>
                      </Badge>
                    </div>
                  )}
                  
                  {type === 'review' && 'oldReviews' in change && (
                    <div className="flex items-center mt-1 gap-2">
                      <span className="text-gray-500 line-through">
                        {change.oldReviews.toLocaleString()}개
                      </span>
                      <span className="font-semibold">
                        {change.newReviews.toLocaleString()}개
                      </span>
                      
                      <Badge variant={change.changePercent > 30 ? "destructive" : "default"}>
                        <span className="flex items-center gap-1">
                          <ArrowUpIcon className="h-3 w-3" />
                          {change.changePercent.toFixed(1)}%
                        </span>
                      </Badge>
                    </div>
                  )}
                  
                  {type === 'new_product' && 'type' in change && change.type === 'new_product' && (
                    <div className="flex items-center mt-1 gap-2">
                      <span className="font-semibold">
                        {change.product.price.toLocaleString()}원
                      </span>
                      
                      <Badge variant="destructive">
                        <span className="flex items-center gap-1">
                          <AlertCircleIcon className="h-3 w-3" />
                          신규 제품
                        </span>
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}