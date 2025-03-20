import React from 'react';
import Image from 'next/image';

const BRAND_WEBSITES = {
  'naturalplus': 'https://www.naturalplus.co.kr',
  'esthermall': 'https://www.esthermall.co.kr',
  // 필요한 경우 더 많은 브랜드 웹사이트 추가
};

interface ProductImageProps {
  src: string;
  title: string;
  productId?: string;
  category?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ProductImage({
  src,
  title,
  productId,
  category,
  width = 200,
  height = 200,
  className = ''
}: ProductImageProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder-product.png';
  };

  return (
    <img
      src={src || '/placeholder-product.png'}
      alt={title}
      width={width}
      height={height}
      className={`object-contain ${className}`}
      onError={handleImageError}
    />
  );
}

export default ProductImage;