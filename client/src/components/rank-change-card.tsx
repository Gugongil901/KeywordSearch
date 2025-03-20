import React from 'react';
import { CompetitorProductImage } from "./competitor-product-image-new";
import { formatNumber, getChangeColorClass } from "@/utils/format";
import { ArrowUp, ArrowDown } from "lucide-react";

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

interface RankChange {
  product: CompetitorProduct;
  oldRank: number;
  newRank: number;
  change: number; // 양수: 순위 상승, 음수: 순위 하락
}

interface RankChangeCardProps {
  change: RankChange;
  brandName: string;
  brandId: string;
  className?: string;
}

/**
 * 순위 변화 카드 컴포넌트
 * - 제품 순위 변동 정보를 카드 형태로 표시
 */
export function RankChangeCard({ 
  change, 
  brandName, 
  brandId,
  className = "" 
}: RankChangeCardProps) {
  if (!change || !change.product) return null;
  
  // 순위 변화는 반대로 적용 (낮은 숫자가 더 좋은 순위이므로)
  // change > 0이면 순위 상승 (더 좋아짐), change < 0이면 순위 하락 (더 나빠짐)
  const colorClass = getChangeColorClass(change.change);
  
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
          <span className="text-gray-500">{change.oldRank}위 → {change.newRank}위</span>
          <span className={`font-medium ${colorClass} flex items-center`}>
            {change.change > 0 ? (
              <>
                <ArrowUp className="w-3 h-3 mr-0.5" />
                {Math.abs(change.change)}
              </>
            ) : change.change < 0 ? (
              <>
                <ArrowDown className="w-3 h-3 mr-0.5" />
                {Math.abs(change.change)}
              </>
            ) : (
              '변동없음'
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default RankChangeCard;