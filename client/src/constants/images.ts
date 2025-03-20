/**
 * 이미지 관련 상수 정의
 */

// 제품 이미지 없을 때 사용할 기본 이미지 목록
export const DEFAULT_PRODUCT_IMAGES = [
  // 건강기능식품 관련 이미지로 변경
  'https://images.unsplash.com/photo-1577041677443-8bbdfd8cce62?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514326005837-fb4791d25e03?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1583623733237-4d5764a9dc82?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1624454002302-52a7c4c08ce2?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1652862730470-a66777f0235c?w=300&h=300&fit=crop&q=80',
  'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=300&h=300&fit=crop&q=80'
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
  // 기존 브랜드
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
  ],
  // 실제 건강기능식품 브랜드 (네이버 스토어)
  '닥터린': [
    'https://shop-phinf.pstatic.net/20240229_146/1709193841431wD9Cf_PNG/10329671365064520_380119835.png',
    'https://shop-phinf.pstatic.net/20231101_9/1698799897254MElUr_JPEG/101935826955598_1370700909.jpg'
  ],
  '내츄럴플러스': [
    'https://shop-phinf.pstatic.net/20240311_235/1710120584234ypKgE_JPEG/11256514102493172_1994532598.jpg',
    'https://shop-phinf.pstatic.net/20240311_128/1710120583904K7Ixq_JPEG/11256513772776384_1994532598.jpg'
  ],
  '에스더몰': [
    'https://esthermall.co.kr/data/goods/22/11/47/1000001701/1000001701_main_078.jpg',
    'https://esthermall.co.kr/data/goods/22/11/47/1000001701/1000001701_detail_053.jpg'
  ],
  '안국건강': [
    'https://shop-phinf.pstatic.net/20240307_204/1709794324152cAE3T_JPEG/10930253942516048_1841739498.jpg',
    'https://shop-phinf.pstatic.net/20240223_79/1708659269795XOxDW_JPEG/9795199577747242_1101550592.jpg'
  ],
  '고려은단': [
    'https://shop-phinf.pstatic.net/20240227_251/1709022307143LbYIa_JPEG/10158236847293526_1082400657.jpg',
    'https://shop-phinf.pstatic.net/20231220_291/1703054389204gQMmx_JPEG/4190318894778267_1519927557.jpg'
  ],
  '뉴트리원': [
    'https://shop-phinf.pstatic.net/20240305_101/1709624398539CLRV3_JPEG/10760328232329844_1097766690.jpg',
    'https://shop-phinf.pstatic.net/20231215_131/1702621861232Qhvqn_JPEG/3757790921947175_1456520146.jpg'
  ],
  '종근당건강': [
    'https://shop-phinf.pstatic.net/20240313_84/1710317499991VXEnM_JPEG/11453429698639848_1776507108.jpg',
    'https://shop-phinf.pstatic.net/20240313_225/1710317499695JUwTL_JPEG/11453429408012252_1776507108.jpg'
  ],
  'GNM 자연의품격': [
    'https://shop-phinf.pstatic.net/20240314_87/1710370602219KFXuS_JPEG/11506531904764582_1559497451.jpg',
    'https://shop-phinf.pstatic.net/20231130_33/16987811461214UL12_JPEG/00000000000001.jpg'
  ],
  '뉴트리데이': [
    'https://shop-phinf.pstatic.net/20240208_244/1707362880546dn1Tn_JPEG/8498810257363082_1939051633.jpg',
    'https://shop-phinf.pstatic.net/20240208_21/1707362880217OElw6_JPEG/8498809928024700_1939051633.jpg'
  ],
  '주영엔에스': [
    'https://shop-phinf.pstatic.net/20240308_20/1709884349733ioE0V_JPEG/11020279425929598_1903551518.jpg',
    'https://shop-phinf.pstatic.net/20240308_1/1709888130494sW0wF_JPEG/11024060198289532_1903551518.jpg'
  ],
  '한미양행': [
    'https://shop-phinf.pstatic.net/20240220_125/1708417663780Qbrvd_JPEG/9553593508456694_1995889825.jpg',
    'https://shop-phinf.pstatic.net/20240214_111/17079177598714XXIB_JPEG/9053689594591790_1847963723.jpg'
  ],
  '유한양행': [
    'https://shop-phinf.pstatic.net/20240226_208/1708913724380Tg5nB_JPEG/10049654074664408_1124850204.jpg',
    'https://shop-phinf.pstatic.net/20240227_134/17090273878686WyYJ_JPEG/10163317559458694_1124850204.jpg'
  ]
};

// 브랜드별 공식 홈페이지 URL 매핑
export const BRAND_WEBSITES: Record<string, string> = {
  '닥터린': 'https://brand.naver.com/dr_lean',
  '내츄럴플러스': 'https://brand.naver.com/naturalplus',
  '에스더몰': 'https://brand.naver.com/esthermall',
  '안국건강': 'https://brand.naver.com/aghealth',
  '고려은단': 'https://brand.naver.com/koreaeundanhc',
  '뉴트리원': 'https://brand.naver.com/nutrione',
  '종근당건강': 'https://brand.naver.com/ckdhc',
  'GNM자연의품격': 'https://brand.naver.com/natureofpurety',
  '뉴트리데이': 'https://brand.naver.com/nutriday',
  '주영엔에스': 'https://brand.naver.com/jooyoung-ns',
  '한미양행': 'https://brand.naver.com/hanmibiologics',
  '유한양행': 'https://brand.naver.com/yuhan'
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

// Default product images for fallback
export const DEFAULT_IMAGES = {
  product: 'https://via.placeholder.com/300x300?text=No+Image',
  brand: 'https://via.placeholder.com/600x300?text=Brand+Image',
  health: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&h=300&fit=crop&q=80'
};