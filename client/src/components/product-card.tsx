import React from 'react';
import { CompetitorProductImage } from "./competitor-product-image-new";
import { formatNumber } from "@/utils/format";

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

interface ProductCardProps {
  product: CompetitorProduct;
  brandName: string;
  brandId: string;
  showPrice?: boolean;
  showReviews?: boolean;
  showRank?: boolean;
  className?: string;
}

/**
 * 제품 카드 컴포넌트
 * - 제품 이미지와 정보를 카드 형태로 표시
 * - 브랜드 정보를 함께 전달하여 정확한 이미지 로드 및 링크 처리
 */
export function ProductCard({ 
  product, 
  brandName, 
  brandId,
  showPrice = true,
  showReviews = true,
  showRank = false,
  className = "" 
}: ProductCardProps) {
  if (!product) return null;
  
  return (
    <div className={`flex items-center space-x-3 p-2 bg-gray-50 rounded-md ${className}`}>
      <div className="flex-shrink-0 w-12 h-12">
        <CompetitorProductImage 
          product={product} 
          className="rounded-md" 
          brandName={brandName}
          brandId={brandId}
        />
      </div>
      <div className="flex-grow min-w-0">
        <h5 className="text-sm font-medium truncate">{product.name}</h5>
        <div className="flex justify-between text-sm">
          {showPrice && <span className="text-gray-500">₩{formatNumber(product.price)}</span>}
          {showReviews && <span className="text-gray-500">리뷰 {formatNumber(product.reviews)}개</span>}
          {showRank && <span className="text-gray-500">랭킹 {product.rank}위</span>}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;