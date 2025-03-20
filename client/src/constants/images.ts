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

// 특정 경쟁사별 고정 제품 이미지 (이름 및 ID 기반 매핑)
export const COMPETITOR_PRODUCT_IMAGES: Record<string, string[]> = {
  // 브랜드 ID 기반 매핑
  'drlin': [
    'https://shop-phinf.pstatic.net/20230710_217/1688952676288NvNm4_JPEG/26121391946684402_1287609349.jpg',
    'https://shop-phinf.pstatic.net/20240229_116/1709193842231Ea8Bn_PNG/10329672165046648_380119835.png'
  ],
  'naturalplus': [
    'https://shop-phinf.pstatic.net/20230915_147/1694758066431zJKR3_JPEG/32926782127064937_1822402951.jpg',
    'https://shop-phinf.pstatic.net/20240311_235/1710120584234ypKgE_JPEG/11256514102493172_1994532598.jpg'
  ],
  'esthermall': [
    'https://shop-phinf.pstatic.net/20230721_271/1689926539095raqFn_JPEG/29195234962308650_1780833913.jpg',
    'https://esthermall.co.kr/data/goods/22/11/47/1000001701/1000001701_main_078.jpg'
  ],
  'anguk': [
    'https://shop-phinf.pstatic.net/20230807_13/1691407115516KsaIC_JPEG/30745812128626636_1056185345.jpg',
    'https://shop-phinf.pstatic.net/20240307_204/1709794324152cAE3T_JPEG/10930253942516048_1841739498.jpg'
  ],
  'koreaeundan': [
    'https://shop-phinf.pstatic.net/20230526_167/1685090592258zLQ3X_JPEG/23059307964536430_1984189809.jpg',
    'https://shop-phinf.pstatic.net/20240227_251/1709022307143LbYIa_JPEG/10158236847293526_1082400657.jpg'
  ],
  'nutrione': [
    'https://shop-phinf.pstatic.net/20230830_143/1693371972252dNqlJ_JPEG/31540687839671376_2007286594.jpg',
    'https://shop-phinf.pstatic.net/20240305_101/1709624398539CLRV3_JPEG/10760328232329844_1097766690.jpg'
  ],
  'ckdhc': [
    'https://shop-phinf.pstatic.net/20230817_110/1692260729457aGj7M_JPEG/30429445111935644_1876483308.jpg',
    'https://shop-phinf.pstatic.net/20240313_84/1710317499991VXEnM_JPEG/11453429698639848_1776507108.jpg'
  ],
  'gnm': [
    'https://shop-phinf.pstatic.net/20220913_254/1663053635767gO5uL_JPEG/3222351466060232_1857158095.jpg',
    'https://shop-phinf.pstatic.net/20240314_87/1710370602219KFXuS_JPEG/11506531904764582_1559497451.jpg'
  ],
  'nutriday': [
    'https://shop-phinf.pstatic.net/20230804_18/1691134339370e2DXG_JPEG/29303054934659166_1507551594.jpg',
    'https://shop-phinf.pstatic.net/20240208_244/1707362880546dn1Tn_JPEG/8498810257363082_1939051633.jpg'
  ],
  'jyns': [
    'https://shop-phinf.pstatic.net/20231023_4/16980118729982kz1J_JPEG/36180588683271784_2077002188.jpg',
    'https://shop-phinf.pstatic.net/20240308_20/1709884349733ioE0V_JPEG/11020279425929598_1903551518.jpg'
  ],
  'hanmi': [
    'https://shop-phinf.pstatic.net/20231109_45/1699507600992f6i9g_JPEG/37676316657248520_33345781.jpg',
    'https://shop-phinf.pstatic.net/20240220_125/1708417663780Qbrvd_JPEG/9553593508456694_1995889825.jpg'
  ],
  'yuhan': [
    'https://shop-phinf.pstatic.net/20230508_102/1683530064193Bk0aL_JPEG/21698779851636714_1051203064.jpg',
    'https://shop-phinf.pstatic.net/20240226_208/1708913724380Tg5nB_JPEG/10049654074664408_1124850204.jpg'
  ],
  
  // 한글 브랜드명 매핑
  '닥터린': [
    'https://shop-phinf.pstatic.net/20230710_217/1688952676288NvNm4_JPEG/26121391946684402_1287609349.jpg',
    'https://shop-phinf.pstatic.net/20240229_116/1709193842231Ea8Bn_PNG/10329672165046648_380119835.png'
  ],
  '내츄럴플러스': [
    'https://shop-phinf.pstatic.net/20230915_147/1694758066431zJKR3_JPEG/32926782127064937_1822402951.jpg',
    'https://shop-phinf.pstatic.net/20240311_235/1710120584234ypKgE_JPEG/11256514102493172_1994532598.jpg'
  ],
  '에스더몰': [
    'https://shop-phinf.pstatic.net/20230721_271/1689926539095raqFn_JPEG/29195234962308650_1780833913.jpg',
    'https://esthermall.co.kr/data/goods/22/11/47/1000001701/1000001701_main_078.jpg'
  ],
  '안국건강': [
    'https://shop-phinf.pstatic.net/20230807_13/1691407115516KsaIC_JPEG/30745812128626636_1056185345.jpg',
    'https://shop-phinf.pstatic.net/20240307_204/1709794324152cAE3T_JPEG/10930253942516048_1841739498.jpg'
  ],
  '고려은단': [
    'https://shop-phinf.pstatic.net/20230526_167/1685090592258zLQ3X_JPEG/23059307964536430_1984189809.jpg',
    'https://shop-phinf.pstatic.net/20240227_251/1709022307143LbYIa_JPEG/10158236847293526_1082400657.jpg'
  ],
  '뉴트리원': [
    'https://shop-phinf.pstatic.net/20230830_143/1693371972252dNqlJ_JPEG/31540687839671376_2007286594.jpg',
    'https://shop-phinf.pstatic.net/20240305_101/1709624398539CLRV3_JPEG/10760328232329844_1097766690.jpg'
  ],
  '종근당건강': [
    'https://shop-phinf.pstatic.net/20230817_110/1692260729457aGj7M_JPEG/30429445111935644_1876483308.jpg',
    'https://shop-phinf.pstatic.net/20240313_84/1710317499991VXEnM_JPEG/11453429698639848_1776507108.jpg'
  ],
  'GNM 자연의품격': [
    'https://shop-phinf.pstatic.net/20220913_254/1663053635767gO5uL_JPEG/3222351466060232_1857158095.jpg',
    'https://shop-phinf.pstatic.net/20240314_87/1710370602219KFXuS_JPEG/11506531904764582_1559497451.jpg'
  ],
  'GNM자연의품격': [
    'https://shop-phinf.pstatic.net/20220913_254/1663053635767gO5uL_JPEG/3222351466060232_1857158095.jpg',
    'https://shop-phinf.pstatic.net/20240314_87/1710370602219KFXuS_JPEG/11506531904764582_1559497451.jpg'
  ],
  '뉴트리데이': [
    'https://shop-phinf.pstatic.net/20230804_18/1691134339370e2DXG_JPEG/29303054934659166_1507551594.jpg',
    'https://shop-phinf.pstatic.net/20240208_244/1707362880546dn1Tn_JPEG/8498810257363082_1939051633.jpg'
  ],
  '주영엔에스': [
    'https://shop-phinf.pstatic.net/20231023_4/16980118729982kz1J_JPEG/36180588683271784_2077002188.jpg',
    'https://shop-phinf.pstatic.net/20240308_20/1709884349733ioE0V_JPEG/11020279425929598_1903551518.jpg'
  ],
  '한미양행': [
    'https://shop-phinf.pstatic.net/20231109_45/1699507600992f6i9g_JPEG/37676316657248520_33345781.jpg',
    'https://shop-phinf.pstatic.net/20240220_125/1708417663780Qbrvd_JPEG/9553593508456694_1995889825.jpg'
  ],
  '유한양행': [
    'https://shop-phinf.pstatic.net/20230508_102/1683530064193Bk0aL_JPEG/21698779851636714_1051203064.jpg',
    'https://shop-phinf.pstatic.net/20240226_208/1708913724380Tg5nB_JPEG/10049654074664408_1124850204.jpg'
  ]
};

// 브랜드별 공식 홈페이지 URL 매핑
export const BRAND_WEBSITES: Record<string, string> = {
  // 브랜드 ID 매핑 (대표 제품으로 링크)
  'drlin': 'https://brand.naver.com/dr_lean/products/7106961480',
  'naturalplus': 'https://brand.naver.com/naturalplus/products/6998624902',
  'esthermall': 'https://brand.naver.com/esthermall/products/7951276656',
  'anguk': 'https://brand.naver.com/aghealth/products/6995407507',
  'koreaeundan': 'https://brand.naver.com/koreaeundanhc/products/8037516509',
  'nutrione': 'https://brand.naver.com/nutrione/products/6995453513',
  'ckdhc': 'https://brand.naver.com/ckdhc/products/7067545517',
  'gnm': 'https://brand.naver.com/natureofpurety/products/6590956392',
  'nutriday': 'https://brand.naver.com/nutriday/products/7069353158',
  'jyns': 'https://brand.naver.com/jooyoung-ns/products/7067421534',
  'hanmi': 'https://brand.naver.com/hanmibiologics/products/6778694642',
  'yuhan': 'https://brand.naver.com/yuhan/products/6685936844',
  
  // 브랜드 이름 매핑 (한글)
  '닥터린': 'https://brand.naver.com/dr_lean/products/7106961480',
  '내츄럴플러스': 'https://brand.naver.com/naturalplus/products/6998624902',
  '에스더몰': 'https://brand.naver.com/esthermall/products/7951276656',
  '안국건강': 'https://brand.naver.com/aghealth/products/6995407507',
  '고려은단': 'https://brand.naver.com/koreaeundanhc/products/8037516509',
  '뉴트리원': 'https://brand.naver.com/nutrione/products/6995453513',
  '종근당건강': 'https://brand.naver.com/ckdhc/products/7067545517',
  'GNM 자연의품격': 'https://brand.naver.com/natureofpurety/products/6590956392',
  'GNM자연의품격': 'https://brand.naver.com/natureofpurety/products/6590956392',
  '뉴트리데이': 'https://brand.naver.com/nutriday/products/7069353158',
  '주영엔에스': 'https://brand.naver.com/jooyoung-ns/products/7067421534',
  '한미양행': 'https://brand.naver.com/hanmibiologics/products/6778694642',
  '유한양행': 'https://brand.naver.com/yuhan/products/6685936844'
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