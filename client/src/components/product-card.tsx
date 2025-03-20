import React from 'react';
import { CompetitorProductImage } from "./competitor-product-image-new";
import { formatNumber, formatPrice } from "@/utils/format";

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
  className?: string;
  onClick?: () => void;
}

/**
 * 제품 카드 컴포넌트
 * - 제품 기본 정보를 카드 형태로 표시
 */
export function ProductCard({ 
  product, 
  brandName, 
  brandId,
  className = "",
  onClick
}: ProductCardProps) {
  if (!product) return null;
  
  return (
    <div 
      className={`flex items-center space-x-3 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors ${className}`}
      onClick={onClick}
      style={{cursor: onClick ? 'pointer' : 'default'}}
    >
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
          <span className="text-gray-500">{formatPrice(product.price)}</span>
          <span className="text-gray-500">리뷰 {formatNumber(product.reviews)}개</span>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;