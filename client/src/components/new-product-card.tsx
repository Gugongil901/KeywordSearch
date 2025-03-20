import React from 'react';
import { CompetitorProductImage } from "./competitor-product-image-new";
import { formatNumber } from "@/utils/format";
import { Badge } from "@/components/ui/badge";

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

interface NewProductAlert {
  product: CompetitorProduct;
  type: 'new_product';
}

interface NewProductCardProps {
  item: NewProductAlert;
  brandName: string;
  brandId: string;
  className?: string;
}

/**
 * 새 제품 알림 카드 컴포넌트
 * - 새로 등록된 제품 정보를 카드 형태로 표시
 */
export function NewProductCard({ 
  item, 
  brandName, 
  brandId,
  className = "" 
}: NewProductCardProps) {
  if (!item || !item.product) return null;
  
  return (
    <div className={`flex items-center space-x-3 p-2 bg-gray-50 rounded-md ${className}`}>
      <div className="flex-shrink-0 w-12 h-12">
        <CompetitorProductImage 
          product={item.product} 
          className="rounded-md" 
          brandName={brandName}
          brandId={brandId}
        />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center space-x-2">
          <h5 className="text-sm font-medium truncate">{item.product.name}</h5>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">신제품</Badge>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">₩{formatNumber(item.product.price)}</span>
          <span className="text-gray-500">순위 {item.product.rank}위</span>
        </div>
      </div>
    </div>
  );
}

export default NewProductCard;