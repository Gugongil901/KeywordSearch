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

interface ReviewChange {
  product: CompetitorProduct;
  oldReviews: number;
  newReviews: number;
  changePercent: number;
}

interface ReviewChangeCardProps {
  change: ReviewChange;
  brandName: string;
  brandId: string;
  className?: string;
}

/**
 * 리뷰 변화 카드 컴포넌트
 * - 제품 리뷰 변동 정보를 카드 형태로 표시
 */
export function ReviewChangeCard({ 
  change, 
  brandName, 
  brandId,
  className = "" 
}: ReviewChangeCardProps) {
  if (!change || !change.product) return null;
  
  const colorClass = getChangeColorClass(change.changePercent);
  const difference = change.newReviews - change.oldReviews;
  
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
          <span className="text-gray-500">
            {formatNumber(change.oldReviews)}개 → {formatNumber(change.newReviews)}개
          </span>
          <span className={`font-medium ${colorClass}`}>
            {difference > 0 ? '+' : ''}{formatNumber(difference)}개 ({change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export default ReviewChangeCard;