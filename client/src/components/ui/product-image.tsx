import React from 'react';

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
  // 기존 인터페이스
  product?: CompetitorProduct;
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
  
  // 직접 이미지 URL과 제품 정보를 받는 속성 추가
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  productName?: string;
  productUrl?: string;
  className?: string;
  isClickable?: boolean;
}

export function ProductImage({ 
  product, 
  size = 'medium',
  showTitle = false,
  src,
  alt,
  width,
  height,
  productName,
  productUrl,
  className,
  isClickable = true
}: ProductImageProps) {
  // 이미지 사이즈 설정
  const sizeClass = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  }[size];

  // 기본 이미지 URL (제품 이미지가 없을 경우)
  const defaultImageUrl = '/placeholder-product.png';
  
  // product 객체가 제공된 경우와 직접 속성이 제공된 경우 처리
  const imageUrl = product?.image || src || defaultImageUrl;
  const imageAlt = product?.name || alt || '제품 이미지';
  const linkUrl = product?.url || 
                 (product ? `https://search.shopping.naver.com/product/${product.productId}` : productUrl || '#');
  const title = product?.name || productName || '';
  
  // 이미지 크기 설정 (직접 지정된 크기 또는 사이즈별 기본값)
  const imageStyle = width && height 
    ? { width: `${width}px`, height: `${height}px` }
    : {};
  
  // 이미지 컨테이너 렌더링
  const renderImage = () => (
    <img 
      src={imageUrl} 
      alt={imageAlt} 
      className={`${width && height ? '' : sizeClass} object-cover rounded border border-gray-200`}
      style={imageStyle}
      onError={(e) => {
        // 이미지 로드 실패 시 기본 이미지로 대체
        (e.target as HTMLImageElement).src = defaultImageUrl;
      }}
    />
  );

  // 제목 렌더링 (있는 경우)
  const renderTitle = () => {
    if (!(showTitle || productName)) return null;
    return (
      <div className="mt-1 text-xs text-center text-gray-700 truncate max-w-[150px]">
        {title}
      </div>
    );
  };

  // 클릭 가능한 경우 링크로 감싸고, 그렇지 않은 경우 단순히 이미지만 표시
  return (
    <div className="product-image-container">
      {isClickable ? (
        <a 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`block transition-all hover:opacity-80 hover:shadow-md rounded ${className || ''}`}
        >
          {renderImage()}
          {renderTitle()}
        </a>
      ) : (
        <div className={className || ''}>
          {renderImage()}
          {renderTitle()}
        </div>
      )}
    </div>
  );
}