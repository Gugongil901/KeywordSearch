import React, { useState, useEffect } from 'react';
import { DEFAULT_PRODUCT_IMAGES, getCompetitorProductImage, BRAND_WEBSITES, COMPETITOR_PRODUCT_IMAGES } from '@/constants/images';
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
    // 경쟁사(브랜드) 웹사이트가 정의되어 있는 경우 우선 사용
    if (competitor && BRAND_WEBSITES[competitor]) {
      return BRAND_WEBSITES[competitor];
    }
    
    if (!productId) return '#';
    
    // 이미 완전한 URL인 경우
    if (productId.startsWith('http')) {
      return productId;
    }
    
    // 네이버 쇼핑 상품 ID인 경우
    if (/^\d+$/.test(productId)) {
      return `https://smartstore.naver.com/main/products/${productId}`;
    }
    
    // 제품명이 있는 경우 네이버 검색 URL 형식으로 반환
    if (title) {
      return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(title)}`;
    }
    
    // 마지막 대안으로 네이버 쇼핑 메인으로 이동
    return 'https://shopping.naver.com/';
  };
  
  // 폴백 이미지 선택
  const getFallbackImage = () => {
    // 경쟁사(브랜드) 이름이 제공된 경우 해당 경쟁사 전용 이미지 사용
    if (competitor) {
      // 브랜드 이름에서 공백 제거하고 정확히 매칭
      const normalizedCompetitor = competitor.trim();
      
      // 브랜드별 이미지 우선 시도
      if (COMPETITOR_PRODUCT_IMAGES[normalizedCompetitor]) {
        const images = COMPETITOR_PRODUCT_IMAGES[normalizedCompetitor];
        // 제품 인덱스를 기준으로 다른 이미지 사용
        const index = (productIndex || 0) % images.length;
        console.log(`브랜드(${normalizedCompetitor}) 이미지 사용: ${images[index]}`);
        return images[index];
      }
      
      // 브랜드명이 포함된 키 찾기 (부분 일치)
      const matchingBrand = Object.keys(COMPETITOR_PRODUCT_IMAGES).find(
        brand => brand.includes(normalizedCompetitor) || normalizedCompetitor.includes(brand)
      );
      
      if (matchingBrand) {
        const images = COMPETITOR_PRODUCT_IMAGES[matchingBrand];
        const index = (productIndex || 0) % images.length;
        console.log(`유사 브랜드(${matchingBrand}) 이미지 사용: ${images[index]}`);
        return images[index];
      }
      
      // 완전히 정해진 이미지 반환 (해시 기반)
      return getCompetitorProductImage(normalizedCompetitor, productIndex || 0);
    }
    
    // 건강기능식품 카테고리 이미지 선택 
    return DEFAULT_PRODUCT_IMAGES[Math.floor(Math.random() * DEFAULT_PRODUCT_IMAGES.length)];
  };
  
  // 이미지 소스가 없거나 오류 발생시 폴백 이미지 사용
  // 로컬 상태로 저장하여 불필요한 재렌더링 방지
  const [resolvedImageSrc, setResolvedImageSrc] = useState<string>(
    src || getFallbackImage()
  );
  
  // 이미지 오류 시 폴백 이미지로 교체
  useEffect(() => {
    if (error || !src) {
      setResolvedImageSrc(getFallbackImage());
    } else {
      setResolvedImageSrc(src);
    }
  }, [error, src, competitor, productIndex]);
  
  // 최종 이미지 소스
  const imageSrc = resolvedImageSrc;
  
  // 이미지 래퍼 (링크 또는 div)
  const ImageWrapper = ({ children }: { children: React.ReactNode }) => {
    // 모든 경우에 div를 사용하고, 필요한 경우 onClick 이벤트 추가
    const commonProps = {
      className: `relative block overflow-hidden ${className}`,
      style: { width: width || 'auto', height: height || 'auto' }
    };
    
    if (navigable) {
      return (
        <div
          {...commonProps}
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.open(generateProductUrl(), '_blank', 'noopener,noreferrer');
            }
          }}
          title={title || alt || '제품 상세 보기'}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (typeof window !== 'undefined') {
                window.open(generateProductUrl(), '_blank', 'noopener,noreferrer');
              }
            }
          }}
          style={{ 
            ...commonProps.style, 
            cursor: 'pointer' 
          }}
        >
          {children}
        </div>
      );
    }
    
    return <div {...commonProps}>{children}</div>;
  };
  
  // 브랜드 로고 결정
  const getBrandLogo = () => {
    if (competitor && BRAND_WEBSITES[competitor]) {
      // 브랜드 로고 색상 결정 (브랜드별로 다른 색상 사용)
      const getLogoColor = () => {
        if (competitor.includes('닥터린')) return 'text-red-600';
        if (competitor.includes('내츄럴플러스')) return 'text-blue-600';
        if (competitor.includes('에스더몰')) return 'text-pink-600';
        if (competitor.includes('안국건강')) return 'text-green-700';
        if (competitor.includes('고려은단')) return 'text-yellow-700';
        if (competitor.includes('뉴트리')) return 'text-blue-500';
        if (competitor.includes('종근당')) return 'text-red-700';
        if (competitor.includes('GNM') || competitor.includes('자연의품격')) return 'text-green-600';
        if (competitor.includes('한미양행')) return 'text-indigo-600';
        if (competitor.includes('유한양행')) return 'text-blue-800';
        return 'text-green-600'; // 기본 네이버 색상
      };

      return (
        <div className="absolute bottom-0.5 right-0.5 p-1 bg-white bg-opacity-70 rounded-sm">
          <SiNaver className={`text-xs ${getLogoColor()}`} />
        </div>
      );
    }
    
    // 일반 네이버 로고
    return (
      <div className="absolute bottom-0.5 right-0.5 p-1 bg-white bg-opacity-70 rounded-sm">
        <SiNaver className="text-xs text-green-600" />
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
      
      {!error && !loading && (
        getBrandLogo()
      )}
    </ImageWrapper>
  );
}

// 기본 내보내기도 추가 (import ProductImage from "@/components/ui/product-image" 형태로 사용할 수 있도록)
export default ProductImage;