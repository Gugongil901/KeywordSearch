import { useState, useEffect } from 'react';
import { DEFAULT_PRODUCT_IMAGES, CATEGORY_IMAGES } from '@/constants/images';

interface ProductImageProps {
  src?: string;
  title?: string;
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
  width = 100,
  height = 100,
  className = ''
}: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // 초기 이미지 소스 설정
    if (src && !src.includes('data:image') && !src.includes('base64')) {
      setImageSrc(src);
    } else {
      setIsError(true);
    }
  }, [src]);

  const handleImageError = () => {
    setIsError(true);
  };

  // 폴백 이미지를 선택하는 함수
  const getFallbackImage = (): string => {
    // 카테고리가 있으면 카테고리별 이미지 사용
    if (category && CATEGORY_IMAGES[category]) {
      return CATEGORY_IMAGES[category];
    }

    // 상품 ID가 있으면 그 값을 사용하여 일관된 이미지 선택
    if (productId) {
      const productNum = parseInt(productId.replace(/\D/g, '').slice(-2) || '0');
      const index = productNum % DEFAULT_PRODUCT_IMAGES.length;
      return DEFAULT_PRODUCT_IMAGES[index];
    }

    // 상품명이 있으면 그 값을 사용하여 일관된 이미지 선택
    if (title) {
      const charSum = title.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const index = charSum % DEFAULT_PRODUCT_IMAGES.length;
      return DEFAULT_PRODUCT_IMAGES[index];
    }

    // 기본값: 랜덤하게 이미지 선택
    return DEFAULT_PRODUCT_IMAGES[Math.floor(Math.random() * DEFAULT_PRODUCT_IMAGES.length)];
  };

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {!isError ? (
        <img
          src={imageSrc || ''}
          alt={title || '상품 이미지'}
          className="w-full h-full object-contain"
          onError={handleImageError}
        />
      ) : (
        <img
          src={getFallbackImage()}
          alt={title || '상품 이미지'}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}

export default ProductImage;