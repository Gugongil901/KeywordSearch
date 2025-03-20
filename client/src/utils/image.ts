/**
 * 이미지 유틸리티 함수
 */

/**
 * 이미지 URL을 프록시 URL로 변환하여 CORS 문제 해결
 * 
 * @param url 원본 이미지 URL
 * @returns 프록시된 이미지 URL
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return '';
  
  // 이미 프록시 URL인 경우 그대로 반환
  if (url.includes('/api/proxy/image')) {
    return url;
  }
  
  // 이미 호스트 도메인의 URL인 경우 (절대 URL이 아닌 경우) 그대로 반환
  if (url.startsWith('/')) {
    return url;
  }
  
  // 데이터 URL인 경우 그대로 반환
  if (url.startsWith('data:')) {
    return url;
  }
  
  // URL 인코딩
  const encodedUrl = encodeURIComponent(url);
  
  // 프록시 URL 반환
  return `/api/proxy/image?url=${encodedUrl}`;
}

/**
 * 이미지 오류 발생 시 fallback 이미지 URL 반환
 * 
 * @param type 이미지 유형 (product, brand 등)
 * @returns fallback 이미지 URL
 */
export function getFallbackImageUrl(type: 'product' | 'brand' | 'health' = 'product'): string {
  const fallbacks = {
    product: '/assets/no-product-image.png',
    brand: '/assets/no-brand-image.png',
    health: '/assets/health-supplement.png'
  };
  
  return fallbacks[type];
}