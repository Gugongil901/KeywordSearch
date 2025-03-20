/**
 * 이미지 관련 상수 정의
 */

// 제품 이미지 없을 때 사용할 기본 이미지 목록
export const DEFAULT_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=300&h=300&fit=crop&q=80'
];

// 인기 카테고리별 대표 이미지
export const CATEGORY_IMAGES: Record<string, string> = {
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=300&fit=crop&q=80',
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=300&fit=crop&q=80',
  beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=300&fit=crop&q=80',
  electronics: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&h=300&fit=crop&q=80',
  home: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=300&fit=crop&q=80',
  baby: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600&h=300&fit=crop&q=80',
  sports: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=300&fit=crop&q=80',
  digital: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=300&fit=crop&q=80',
  health: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&h=300&fit=crop&q=80'
};

// 특정 경쟁사별 고정 제품 이미지 (이름 기반 매핑)
export const COMPETITOR_PRODUCT_IMAGES: Record<string, string[]> = {
  '헬스케어몰': [
    'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=300&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=300&h=300&fit=crop&q=80'
  ],
  '건강한약국': [
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=300&fit=crop&q=80'
  ],
  '웰니스마트': [
    'https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?w=300&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&h=300&fit=crop&q=80'
  ],
  '브랜드 스토리': [
    'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=300&h=300&fit=crop&q=80',
    'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=300&h=300&fit=crop&q=80'
  ]
};

// 키워드 카테고리별 배경 이미지
export const KEYWORD_BACKGROUND_IMAGES: Record<string, string> = {
  food: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1200&h=400&fit=crop&q=80',
  fashion: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&h=400&fit=crop&q=80',
  beauty: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop&q=80',
  electronics: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&fit=crop&q=80',
  home: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&h=400&fit=crop&q=80',
  baby: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&h=400&fit=crop&q=80',
  sports: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=1200&h=400&fit=crop&q=80',
  digital: 'https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?w=1200&h=400&fit=crop&q=80',
  health: 'https://images.unsplash.com/photo-1511174511562-5f7f82f97afb?w=1200&h=400&fit=crop&q=80'
};

// 경쟁사 이름에서 이미지 결정 (결정적 방식으로 일관된 이미지 선택)
export function getCompetitorImageIndex(competitorName: string): number {
  // 간단한 해시 함수 - 문자열의 각 문자 코드 합계
  const hash = competitorName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hash % DEFAULT_PRODUCT_IMAGES.length;
}

// 경쟁사 이름 기준으로 이미지 URL 가져오기
export function getCompetitorProductImage(competitorName: string, productIndex: number = 0): string {
  // 1. 특정 경쟁사 지정 이미지가 있는지 확인
  if (COMPETITOR_PRODUCT_IMAGES[competitorName]) {
    const images = COMPETITOR_PRODUCT_IMAGES[competitorName];
    return images[productIndex % images.length];
  }
  
  // 2. 결정적 방식으로 이미지 선택 (같은 경쟁사는 항상 같은 이미지 사용)
  const baseIndex = getCompetitorImageIndex(competitorName);
  const finalIndex = (baseIndex + productIndex) % DEFAULT_PRODUCT_IMAGES.length;
  return DEFAULT_PRODUCT_IMAGES[finalIndex];
}