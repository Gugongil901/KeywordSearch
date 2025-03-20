import React from 'react';
import { ProductImage } from "@/components/ui/product-image";

/**
 * 경쟁사 제품 이미지 컴포넌트
 * - 경쟁사 제품 정보를 받아 ProductImage 컴포넌트로 변환
 * - 브랜드 정보를 함께 전달하여 정확한 이미지 로드 및 링크 처리
 */
export function CompetitorProductImage({ 
  product, 
  className = "",
  brandName,
  brandId
}: {
  product: {
    productId: string;
    name: string;
    price: number;
    reviews: number;
    rank: number;
    image?: string;
    url?: string;
    collectedAt?: string;
  };
  className?: string;
  brandName?: string;
  brandId?: string;
}) {
  if (!product) return null;
  
  return (
    <ProductImage 
      src={product.image}
      alt={product.name}
      title={product.name}
      productId={product.productId}
      className={className}
      competitor={brandName || brandId}
      navigable={true}
    />
  );
}