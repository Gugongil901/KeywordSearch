import React, { useState, useEffect } from 'react';
import { DEFAULT_PRODUCT_IMAGES, getCompetitorProductImage, BRAND_WEBSITES, COMPETITOR_PRODUCT_IMAGES } from '@/constants/images';
import { SiNaver } from 'react-icons/si';

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
  const [imgSrc, setImgSrc] = useState<string>(src || '');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!src && competitor) {
      const fallbackImage = getFallbackImage();
      setImgSrc(fallbackImage);
    }
  }, [src, competitor, productIndex]);

  const getFallbackImage = () => {
    if (competitor) {
      const normalizedCompetitor = competitor.trim();

      if (COMPETITOR_PRODUCT_IMAGES[normalizedCompetitor]) {
        const images = COMPETITOR_PRODUCT_IMAGES[normalizedCompetitor];
        const index = (productIndex || 0) % images.length;
        return images[index];
      }

      const matchingBrand = Object.keys(COMPETITOR_PRODUCT_IMAGES).find(
        brand => brand.includes(normalizedCompetitor) || normalizedCompetitor.includes(brand)
      );

      if (matchingBrand) {
        const images = COMPETITOR_PRODUCT_IMAGES[matchingBrand];
        const index = (productIndex || 0) % images.length;
        return images[index];
      }

      return getCompetitorProductImage(normalizedCompetitor, productIndex || 0);
    }

    return DEFAULT_PRODUCT_IMAGES[Math.floor(Math.random() * DEFAULT_PRODUCT_IMAGES.length)];
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);
    if (!error) {
      const fallback = getFallbackImage();
      setImgSrc(fallback);
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

  const renderNaverLogo = () => {
    if (!navigable) return null;

    const getLogoColor = () => {
      if (competitor?.includes('닥터린')) return 'text-red-600';
      if (competitor?.includes('내츄럴플러스')) return 'text-blue-600';
      if (competitor?.includes('에스더몰')) return 'text-pink-600';
      if (competitor?.includes('안국건강')) return 'text-green-700';
      if (competitor?.includes('고려은단')) return 'text-yellow-700';
      if (competitor?.includes('뉴트리')) return 'text-blue-500';
      if (competitor?.includes('종근당')) return 'text-red-700';
      if (competitor?.includes('GNM') || competitor?.includes('자연의품격')) return 'text-green-600';
      if (competitor?.includes('한미양행')) return 'text-indigo-600';
      if (competitor?.includes('유한양행')) return 'text-blue-800';
      return 'text-green-600';
    };

    return (
      <div className="absolute bottom-0.5 right-0.5 p-1 bg-white bg-opacity-70 rounded-sm">
        <SiNaver className={`text-xs ${getLogoColor()}`} />
      </div>
    );
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
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}
        <img
          src={imgSrc}
          alt={alt || title || '제품 이미지'}
          width={width}
          height={height}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={`object-cover transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
      </ImageWrapper>
      {renderNaverLogo()}
    </div>
  );
}

export default ProductImage;