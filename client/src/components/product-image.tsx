import React from 'react';
import { Link } from 'wouter';

interface CompetitorProduct {
  productId: string;
  name: string;
  price: number;
  reviews: number;
  rank: number;
  image?: string;
  url?: string;
  collectedAt: string;
}

interface ProductImageProps {
  product: CompetitorProduct;
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
}

export function ProductImage({ 
  product, 
  size = 'medium',
  showTitle = false 
}: ProductImageProps) {
  // 이미지 사이즈 설정
  const sizeClass = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  }[size];

  // 기본 이미지 URL (제품 이미지가 없을 경우)
  const defaultImageUrl = '/placeholder-product.png';
  
  // 실제 제품 페이지로 연결되는 URL
  const productUrl = product.url || `https://search.shopping.naver.com/product/${product.productId}`;
  
  return (
    <div className="product-image-container">
      <a 
        href={productUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block transition-all hover:opacity-80 hover:shadow-md rounded"
      >
        <img 
          src={product.image || defaultImageUrl} 
          alt={product.name} 
          className={`${sizeClass} object-cover rounded border border-gray-200`}
          onError={(e) => {
            // 이미지 로드 실패 시 기본 이미지로 대체
            (e.target as HTMLImageElement).src = defaultImageUrl;
          }}
        />
        
        {showTitle && (
          <div className="mt-1 text-xs text-center text-gray-700 truncate max-w-[150px]">
            {product.name}
          </div>
        )}
      </a>
    </div>
  );
};

