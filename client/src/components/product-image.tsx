import React from 'react';

// 제품 타입 정의
export interface ProductType {
  productId: string;
  name: string;
  price: number;
  reviews: number;
  rank: number;
  image?: string;
  url?: string;
  collectedAt: string;
}

// ProductImage 컴포넌트: 제품 이미지를 표시하고 클릭 시 제품 URL로 이동
export const ProductImage = ({ product }: { product: ProductType }) => {
  if (!product.image) return null;

  return (
    <a 
      href={product.url || '#'} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block relative"
    >
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-16 h-16 object-cover rounded hover:opacity-80 transition-opacity"
      />
      <span className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded-sm">
        보기
      </span>
    </a>
  );
};