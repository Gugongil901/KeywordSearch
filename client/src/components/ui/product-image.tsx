
import React, { useState, useEffect } from 'react';
import { DEFAULT_PRODUCT_IMAGES, COMPETITOR_PRODUCT_IMAGES } from '@/constants/images';
import { SiNaver } from 'react-icons/si';

interface ProductImageProps {
  src?: string;
  competitor?: string;
  productId?: string;
  title?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  productIndex?: number;
  navigable?: boolean;
}

export function ProductImage({
  src,
  competitor,
  productId,
  title,
  width = 300,
  height = 300,
  className = '',
  productIndex = 0,
  navigable = true
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const getFallbackImage = () => {
    if (!competitor) return DEFAULT_PRODUCT_IMAGES[0];

    const normalizedCompetitor = competitor.toLowerCase().trim();
    
    // 브랜드별 이미지 매핑 확인
    if (COMPETITOR_PRODUCT_IMAGES[normalizedCompetitor]) {
      const images = COMPETITOR_PRODUCT_IMAGES[normalizedCompetitor];
      return images[productIndex % images.length];
    }

    // 부분 일치하는 브랜드 찾기
    const matchingBrand = Object.keys(COMPETITOR_PRODUCT_IMAGES).find(
      brand => brand.toLowerCase().includes(normalizedCompetitor) || 
              normalizedCompetitor.includes(brand.toLowerCase())
    );

    if (matchingBrand) {
      const images = COMPETITOR_PRODUCT_IMAGES[matchingBrand];
      return images[productIndex % images.length];
    }

    // 기본 이미지 반환
    return DEFAULT_PRODUCT_IMAGES[0];
  };

  useEffect(() => {
    setLoading(true);
    setError(false);

    const newSrc = src || getFallbackImage();
    setImgSrc(newSrc);
  }, [src, competitor, productIndex]);

  const handleImageError = () => {
    setError(true);
    setLoading(false);
    if (!error) {
      setImgSrc(DEFAULT_PRODUCT_IMAGES[0]);
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const getProductUrl = () => {
    if (!navigable) return '#';
    
    if (competitor && BRAND_WEBSITES[competitor]) {
      return BRAND_WEBSITES[competitor];
    }
    
    if (!productId) return '#';
    
    if (productId.startsWith('http')) {
      return productId;
    }
    
    if (/^\d+$/.test(productId)) {
      return `https://smartstore.naver.com/main/products/${productId}`;
    }
    
    if (title) {
      return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(title)}`;
    }
    
    return '#';
  };

  const ImageWrapper = navigable ? 'a' : 'div';
  const wrapperProps = navigable ? { href: getProductUrl(), target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <div className="relative" style={{ width, height }}>
      <ImageWrapper
        {...wrapperProps}
        className={`block relative w-full h-full overflow-hidden rounded ${className}`}
        style={{ width, height }}
      >
        {loading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse rounded" />
        )}
        <img
          src={imgSrc}
          alt={title || 'Product'}
          width={width}
          height={height}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={`w-full h-full object-contain rounded transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
      </ImageWrapper>
    </div>
  );
}
