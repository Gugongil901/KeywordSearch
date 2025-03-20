import React, { useState } from 'react';
import { DEFAULT_PRODUCT_IMAGES, getCompetitorProductImage } from '@/constants/images';
import { extractProductIdFromUrl } from '@/utils/product-helper';
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

/**
 * 제품 이미지 컴포넌트
 * - Unsplash 이미지를 사용한 폴백 처리
 * - 이미지 로딩 상태 처리
 * - 네이버 제품 페이지 링크 연결
 */
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
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 제품 URL 생성
  const generateProductUrl = () => {
    if (!productId) return '#';
    
    // 이미 완전한 URL인 경우
    if (productId.startsWith('http')) {
      return productId;
    }
    
    // 네이버 쇼핑 상품 ID인 경우
    if (/^\d+$/.test(productId)) {
      return `https://smartstore.naver.com/main/products/${productId}`;
    }
    
    // 네이버 검색 URL 형식으로 반환
    return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(title || productId)}`;
  };
  
  // 폴백 이미지 선택
  const getFallbackImage = () => {
    // 경쟁사 이름이 제공된 경우 해당 경쟁사 기반 이미지 선택
    if (competitor) {
      return getCompetitorProductImage(competitor, productIndex);
    }
    
    // 랜덤 이미지 선택
    return DEFAULT_PRODUCT_IMAGES[Math.floor(Math.random() * DEFAULT_PRODUCT_IMAGES.length)];
  };
  
  // 이미지 소스가 없거나 오류 발생시 폴백 이미지 사용
  const imageSrc = (error || !src) ? getFallbackImage() : src;
  
  // 이미지 래퍼 (링크 또는 div)
  const ImageWrapper = ({ children }: { children: React.ReactNode }) => {
    if (navigable) {
      return (
        <a
          href={generateProductUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`relative block overflow-hidden ${className}`}
          style={{ width: width || 'auto', height: height || 'auto' }}
          title={title || alt || '제품 상세 보기'}
        >
          {children}
        </a>
      );
    }
    
    return (
      <div
        className={`relative block overflow-hidden ${className}`}
        style={{ width: width || 'auto', height: height || 'auto' }}
      >
        {children}
      </div>
    );
  };
  
  return (
    <ImageWrapper>
      <img
        src={imageSrc}
        alt={alt || title || '제품 이미지'}
        className={`object-cover w-full h-full transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        width={width}
        height={height}
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse w-full h-full bg-gray-200"></div>
        </div>
      )}
      
      {!error && !loading && src && (
        <div className="absolute bottom-0 right-0 p-1">
          <SiNaver className="text-xs text-green-600" />
        </div>
      )}
    </ImageWrapper>
  );
}

// 기본 내보내기도 추가 (import ProductImage from "@/components/ui/product-image" 형태로 사용할 수 있도록)
export default ProductImage;