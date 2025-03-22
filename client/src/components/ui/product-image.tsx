import React from 'react';

const BRAND_WEBSITES = {
  'drlin': 'https://doctorlin.co.kr', 
  'naturalplus': 'https://www.naturalplus.co.kr',
  'esthermall': 'https://www.esthermall.co.kr',
  'anguk': 'https://www.akohealth.com',
  'koryo': 'https://www.koreaeundan.com',
  'nutrivone': 'https://nutrione.co.kr',
  'ckdhc': 'https://www.ckdhc.com',
  'gnm': 'https://gnmjg.com',
  'nutriday': 'https://nutriday.co.kr',
  'jyns': 'https://www.jooyoungns.co.kr',
  'hanmi': 'https://www.hanmipharm.co.kr',
  'yuhan': 'https://www.yuhan.co.kr',
  // 브랜드명(한글) 매핑
  '닥터린': 'https://doctorlin.co.kr',
  '내츄럴플러스': 'https://www.naturalplus.co.kr',
  '에스더몰': 'https://www.esthermall.co.kr',
  '안국건강': 'https://www.akohealth.com',
  '고려은단': 'https://www.koreaeundan.com',
  '뉴트리원': 'https://nutrione.co.kr',
  '종근당건강': 'https://www.ckdhc.com',
  'GNM자연의품격': 'https://gnmjg.com',
  '뉴트리데이': 'https://nutriday.co.kr',
  '주영엔에스': 'https://www.jooyoungns.co.kr',
  '한미양행': 'https://www.hanmipharm.co.kr',
  '유한양행': 'https://www.yuhan.co.kr',
};

interface ProductImageProps {
  src?: string;
  alt: string;
  title: string;
  productId?: string;
  competitor?: string;
  category?: string;
  width?: number;
  height?: number;
  className?: string;
  navigable?: boolean; // 클릭 가능한지 여부
}

export function ProductImage({
  src,
  alt,
  title,
  productId,
  competitor,
  category,
  width = 200,
  height = 200,
  className = '',
  navigable = false
}: ProductImageProps) {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder-product.png';
  };

  // 검색 URL 생성 (네이버 쇼핑)
  const getSearchUrl = () => {
    if (competitor && productId) {
      return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(alt || title)}`;
    }
    return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(alt || title)}`;
  };

  // 브랜드 웹사이트 URL 가져오기
  const getBrandUrl = () => {
    if (!competitor) return null;
    
    // 타입 안전하게 확인
    const brandId = competitor as keyof typeof BRAND_WEBSITES;
    if (BRAND_WEBSITES[brandId]) {
      return BRAND_WEBSITES[brandId];
    }
    return null;
  };

  // 이미지 렌더링 (링크 여부에 따라 조건부 렌더링)
  const renderImage = () => (
    <img
      src={src || '/placeholder-product.png'}
      alt={alt || title}
      width={width}
      height={height}
      className={`object-contain ${className}`}
      onError={handleImageError}
      title={`${title} (${competitor || ''})`}
    />
  );

  // 클릭 가능한 경우 링크로 감싸서 렌더링
  if (navigable) {
    return (
      <a
        href={getSearchUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        title={`${title} - 네이버 쇼핑에서 보기`}
      >
        {renderImage()}
      </a>
    );
  }

  // 클릭 불가능한 경우 이미지만 렌더링
  return renderImage();
}

export default ProductImage;