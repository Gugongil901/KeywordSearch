import React, { useState, useEffect } from 'react';
import { DEFAULT_PRODUCT_IMAGES, COMPETITOR_PRODUCT_IMAGES, BRAND_WEBSITES } from '@/constants/images';
import { SiNaver } from 'react-icons/si';
import { getProxiedImageUrl } from '@/utils/image';

interface ProductImageProps {
  src?: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  productId?: string;
  className?: string;
  competitor?: string;
  productIndex?: number;
  navigable?: boolean;
}

export function ProductImage({
  src,
  alt,
  title,
  width = 120,
  height = 120,
  productId,
  className = '',
  competitor,
  productIndex = 0,
  navigable = true
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(false);

    if (src) {
      // 외부 이미지 URL인 경우 프록시 사용
      setImgSrc(getProxiedImageUrl(src));
    } else if (competitor) {
      // 경쟁사 이미지도 프록시 사용
      setImgSrc(getProxiedImageUrl(getFallbackImage()));
    } else {
      // 기본 이미지도 프록시 사용
      setImgSrc(getProxiedImageUrl(DEFAULT_PRODUCT_IMAGES[0]));
    }
  }, [src, competitor, productIndex]);

  const getFallbackImage = () => {
    if (!competitor) return DEFAULT_PRODUCT_IMAGES[0];

    const normalizedCompetitor = competitor.trim();

    if (COMPETITOR_PRODUCT_IMAGES[normalizedCompetitor]) {
      const images = COMPETITOR_PRODUCT_IMAGES[normalizedCompetitor];
      const index = productIndex % images.length;
      return images[index];
    }

    const matchingBrand = Object.keys(COMPETITOR_PRODUCT_IMAGES).find(
      brand => brand.includes(normalizedCompetitor) || normalizedCompetitor.includes(brand)
    );

    if (matchingBrand) {
      const images = COMPETITOR_PRODUCT_IMAGES[matchingBrand];
      const index = productIndex % images.length;
      return images[index];
    }

    return DEFAULT_PRODUCT_IMAGES[0];
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);
    if (!error) {
      const fallbackImage = DEFAULT_PRODUCT_IMAGES[0];
      setImgSrc(getProxiedImageUrl(fallbackImage));
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const generateProductUrl = () => {
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
    return 'https://shopping.naver.com/';
  };

  const ImageWrapper = navigable ? 'a' : 'div';
  const wrapperProps = navigable ? {
    href: generateProductUrl(),
    target: "_blank",
    rel: "noopener noreferrer"
  } : {};

  return (
    <div className="relative">
      <ImageWrapper
        {...wrapperProps}
        className={`block relative ${className}`}
        style={{ width, height }}
      >
        {loading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse rounded" />
        )}
        <img
          src={imgSrc}
          alt={alt || title || '제품 이미지'}
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

export default ProductImage;