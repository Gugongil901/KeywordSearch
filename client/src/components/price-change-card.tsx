import React from 'react';
import { CompetitorProductImage } from "./competitor-product-image-new";
import { formatNumber, getChangeColorClass } from "@/utils/format";

interface CompetitorProduct {
  productId: string;
  name: string;
  price: number;
  reviews: number;
  rank: number;
  image?: string;
  url?: string;
  collectedAt?: string;
}

interface PriceChange {
  product: CompetitorProduct;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
}

interface PriceChangeCardProps {
  change: PriceChange;
  brandName: string;
  brandId: string;
  className?: string;
}

/**
 * 가격 변화 카드 컴포넌트
 * - 제품 가격 변동 정보를 카드 형태로 표시
 */
export function PriceChangeCard({ 
  change, 
  brandName, 
  brandId,
  className = "" 
}: PriceChangeCardProps) {
  if (!change || !change.product) return null;
  
  // 가격 감소는 좋은 것이므로 색상 클래스의 부호를 반대로 적용 (inverse=true)
  const colorClass = getChangeColorClass(change.changePercent, true);
  
  return (
    <div className={`flex items-center space-x-3 p-2 bg-gray-50 rounded-md ${className}`}>
      <div className="flex-shrink-0 w-12 h-12">
        <CompetitorProductImage 
          product={change.product} 
          className="rounded-md" 
          brandName={brandName}
          brandId={brandId}
        />
      </div>
      <div className="flex-grow min-w-0">
        <h5 className="text-sm font-medium truncate">{change.product.name}</h5>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">₩{formatNumber(change.oldPrice)} → ₩{formatNumber(change.newPrice)}</span>
          <span className={`font-medium ${colorClass}`}>
            {change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default PriceChangeCard;