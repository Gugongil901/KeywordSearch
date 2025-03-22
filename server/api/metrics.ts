/**
 * 키워드 분석 지표 계산 알고리즘
 * 
 * 이 모듈은 네이버 검색광고 API와 쇼핑 API에서 가져온 데이터를 기반으로
 * 키워드의 경쟁강도, 광고효율, 클릭률 등 다양한 지표를 계산합니다.
 */

import { NaverKeywordResult, NaverProductResult } from '@shared/schema';

/**
 * 키워드 경쟁 강도 계산 (고도화 버전)
 * @param searchCount 검색량
 * @param productCount 상품 수
 * @param additionalFactors 추가 요소 (선택적)
 * @returns 0-100 사이의 경쟁 강도 지수
 */
export function calculateCompetitionIndex(
  searchCount: number, 
  productCount: number,
  additionalFactors?: {
    avgPrice?: number;         // 평균 가격
    avgReviewCount?: number;   // 평균 리뷰 수
    brandRatio?: number;       // 브랜드 상품 비율 (0-1)
    topSellerConcentration?: number; // 상위 판매자 집중도 (0-1)
    adCount?: number;          // 광고 수
    foreignProductRatio?: number; // 해외 상품 비율 (0-1)
    categorySeasonality?: number; // 카테고리 계절성 (0-1)
  }
): number {
  // 검색량이 0이면 나눗셈 오류 방지
  if (searchCount === 0) return 0;
  
  // 기본 경쟁 지수 계산 (상품 수 / 검색량)
  let ratio = productCount / searchCount;
  
  // 로그 스케일 적용 (수치가 너무 크거나 작아지는 것 방지)
  let logRatio = Math.log10(ratio * 100 + 1);
  
  // 기본 정규화 (0-80 범위로 제한, 추가 요소를 위한 공간 확보)
  let baseIndex = Math.min(80, logRatio * 25);
  
  // 추가 요소가 없으면 기본 계산으로 반환
  if (!additionalFactors) {
    return Math.round(baseIndex * 10) / 10; // 소수점 첫째 자리까지
  }
  
  // 추가 경쟁 요소 가중치 계산
  let additionalScore = 0;
  let factorCount = 0;
  
  // 1. 평균 가격 요소 (건강보조제 특화: 중간 가격대가 가장 경쟁 심함)
  if (additionalFactors.avgPrice !== undefined) {
    const priceScore = calculatePriceCompetitionScore(additionalFactors.avgPrice);
    additionalScore += priceScore;
    factorCount++;
  }
  
  // 2. 평균 리뷰 수 요소 (리뷰가 많을수록 진입장벽 높음)
  if (additionalFactors.avgReviewCount !== undefined) {
    const reviewScore = Math.min(20, Math.log10(additionalFactors.avgReviewCount + 1) * 5);
    additionalScore += reviewScore;
    factorCount++;
  }
  
  // 3. 브랜드 상품 비율 (브랜드 제품이 많을수록 경쟁 심함)
  if (additionalFactors.brandRatio !== undefined) {
    additionalScore += additionalFactors.brandRatio * 20;
    factorCount++;
  }
  
  // 4. 상위 판매자 집중도 (소수 판매자가 과점할수록 진입장벽 높음)
  if (additionalFactors.topSellerConcentration !== undefined) {
    additionalScore += additionalFactors.topSellerConcentration * 20;
    factorCount++;
  }
  
  // 5. 광고 수 (광고가 많을수록 경쟁 심함)
  if (additionalFactors.adCount !== undefined && productCount > 0) {
    const adRatio = Math.min(1, additionalFactors.adCount / (productCount * 0.1));
    additionalScore += adRatio * 20;
    factorCount++;
  }
  
  // 6. 해외 상품 비율 (건강보조제 특화: 한국 시장에서는 해외제품 비율이 높을수록 틈새 기회)
  if (additionalFactors.foreignProductRatio !== undefined) {
    // 해외 상품 비율이 높으면 오히려 국내 제품 기회가 있을 수 있음 (역산)
    additionalScore += (1 - additionalFactors.foreignProductRatio) * 10;
    factorCount++;
  }
  
  // 7. 카테고리 계절성 (계절성이 강할수록 타이밍에 따라 경쟁 변화)
  if (additionalFactors.categorySeasonality !== undefined) {
    // 현재 시즌에 맞는지 확인 (계절 효과)
    const isInSeason = isCurrentSeasonMatching(additionalFactors.categorySeasonality);
    additionalScore += isInSeason ? 10 : 0;
    factorCount++;
  }
  
  // 추가 요소의 평균 점수 계산 (요소가 없으면 0)
  const avgAdditionalScore = factorCount > 0 ? additionalScore / factorCount : 0;
  
  // 최종 점수 계산 (기본 점수 + 추가 요소 점수)
  // 기본 80점 만점 + 추가 요소 최대 20점 = 100점 만점
  const finalScore = baseIndex + avgAdditionalScore;
  
  return Math.round(Math.min(100, finalScore) * 10) / 10; // 소수점 첫째 자리까지
}

/**
 * 가격 기반 경쟁 점수 계산 (건강보조제 특화)
 * @param avgPrice 평균 가격
 * @returns 가격 경쟁 점수 (0-20)
 */
function calculatePriceCompetitionScore(avgPrice: number): number {
  // 건강보조제 가격 구간별 경쟁 강도
  // 가장 경쟁이 심한 구간은 10,000원 ~ 50,000원 사이 (중간 가격대)
  if (avgPrice < 5000) {
    // 저가 제품 (경쟁 낮음)
    return 5;
  } else if (avgPrice >= 5000 && avgPrice < 10000) {
    // 저가-중가 경계 (경쟁 중간)
    return 10;
  } else if (avgPrice >= 10000 && avgPrice < 50000) {
    // 중가 제품 (경쟁 높음)
    return 20;
  } else if (avgPrice >= 50000 && avgPrice < 100000) {
    // 중고가 제품 (경쟁 중간)
    return 15;
  } else {
    // 고가 제품 (경쟁 낮음)
    return 10;
  }
}

/**
 * 현재 계절이 카테고리 계절성과 일치하는지 확인
 * @param seasonality 계절성 강도 (0-1)
 * @returns 현재 계절 일치 여부
 */
function isCurrentSeasonMatching(seasonality: number): boolean {
  // 계절성이 낮으면 항상 true 반환
  if (seasonality < 0.3) return true;
  
  const currentMonth = new Date().getMonth(); // 0-11
  
  // 현재 시즌에 있는지 단순 확인 (계절성 제품은 시즌에 경쟁이 더 치열함)
  // 실제 구현에서는 제품 카테고리별 계절성 시기를 더 정확히 매핑해야 함
  return seasonality < 0.7 || Math.random() > 0.5; // 임시 구현
}

/**
 * 광고 클릭률(CTR) 계산
 * @param impressions 노출 수
 * @param clicks 클릭 수
 * @returns 클릭률 (0-1 사이의 비율)
 */
export function calculateCTR(impressions: number, clicks: number): number {
  if (impressions === 0) return 0;
  return clicks / impressions;
}

/**
 * 클릭 경쟁도 계산
 * @param productCount 상품 수
 * @param clickCount 클릭 수
 * @returns 클릭 경쟁도 지수
 */
export function calculateClickCompetition(productCount: number, clickCount: number): number {
  if (clickCount === 0) return 0;
  
  // 클릭 당 경쟁하는 상품 수
  let competition = productCount / clickCount;
  
  // 로그 스케일 적용
  return Math.round(competition * 100) / 100;
}

/**
 * 키워드당 광고비 효율 계산
 * @param adCost 총 광고비
 * @param clickCount 클릭 수
 * @returns 키워드 광고비 효율 (낮을수록 효율적)
 */
export function calculateKeywordAdEfficiency(adCost: number, clickCount: number): number {
  if (clickCount === 0) return 0;
  return Math.round((adCost / clickCount) * 1000) / 1000;
}

/**
 * 구매 경쟁강도 계산
 * @param purchaseProductCount 구매 상품 수
 * @param searchCount 검색량
 * @returns 구매 경쟁강도 (0-1 사이)
 */
export function calculatePurchaseCompetition(purchaseProductCount: number, searchCount: number): number {
  if (searchCount === 0) return 0;
  return Math.round((purchaseProductCount / searchCount) * 100) / 100;
}

/**
 * 실거래 상품 비율 계산
 * @param products 상품 리스트
 * @returns 실제 거래가 있는 상품의 비율 (0-100 사이)
 */
export function calculateRealProductRatio(products: NaverProductResult[]): number {
  const totalProducts = products.length;
  if (totalProducts === 0) return 0;
  
  // 리뷰가 있는 상품을 실거래가 있는 상품으로 간주
  const productsWithReviews = products.filter(product => product.reviewCount > 0);
  return Math.round((productsWithReviews.length / totalProducts) * 100);
}

/**
 * 해외 상품 비율 계산
 * @param products 상품 리스트
 * @returns 해외 상품의 비율 (0-100 사이)
 */
export function calculateForeignProductRatio(products: NaverProductResult[]): number {
  const totalProducts = products.length;
  if (totalProducts === 0) return 0;
  
  // 브랜드명에 영문이 포함된 경우 해외 상품으로 간주 (단순화된 로직)
  const foreignProducts = products.filter(product => {
    if (!product.brandName) return false;
    return /[a-zA-Z]/.test(product.brandName);
  });
  
  return Math.round((foreignProducts.length / totalProducts) * 100);
}

/**
 * 로켓배송 상품 비율 계산
 * @param products 상품 리스트
 * @returns 로켓배송 상품의 비율 (0-100 사이)
 */
export function calculateRocketDeliveryRatio(products: NaverProductResult[]): number {
  // 실제 데이터에서는 로켓배송 정보가 포함되어 있어야 함
  // 이 예제에서는 임의의 로직으로 계산
  const totalProducts = products.length;
  if (totalProducts === 0) return 0;
  
  // 상품 ID 마지막 두 자리가 짝수인 경우 로켓배송으로 가정 (목업용)
  const rocketDeliveryProducts = products.filter(product => {
    const lastTwoDigits = parseInt(product.productId.slice(-2));
    return lastTwoDigits % 2 === 0;
  });
  
  return Math.round((rocketDeliveryProducts.length / totalProducts) * 100);
}

/**
 * 제한 상품 비율 계산
 * @param products 상품 리스트
 * @returns 제한 상품의 비율 (0-100 사이)
 */
export function calculateRestrictedProductRatio(products: NaverProductResult[]): number {
  // 실제 데이터에서는 제한 상품 정보가 포함되어 있어야 함
  // 이 예제에서는 임의의 로직으로 계산 (랜덤 10% 정도)
  const totalProducts = products.length;
  if (totalProducts === 0) return 0;
  
  // 상품 ID 해시값에 따라 제한 상품 여부 결정 (목업용)
  const restrictedProducts = products.filter(product => {
    const hash = product.productId.split('').reduce((a: number, b: string) => {
      return a + b.charCodeAt(0);
    }, 0);
    return hash % 10 === 0; // 약 10% 확률
  });
  
  return Math.round((restrictedProducts.length / totalProducts) * 100);
}

/**
 * 최근 1년 내 출시 상품 비율 계산
 * @param products 상품 리스트
 * @returns 1년 내 출시 상품의 비율 (0-100 사이)
 */
export function calculateRecentProductRatio(products: NaverProductResult[]): number {
  // 실제 데이터에서는 상품 출시일 정보가 포함되어 있어야 함
  // 이 예제에서는 임의의 로직으로 계산
  const totalProducts = products.length;
  if (totalProducts === 0) return 0;
  
  // 이 예제에서는 25%로 고정 (목업용)
  return 25;
}

/**
 * 광고 권장가 계산
 * @param competitors 경쟁 상품들의 광고 입찰가
 * @returns 권장 광고 입찰가
 */
export function calculateRecommendedBid(competitors: number[]): number {
  if (competitors.length === 0) return 0;
  
  // 상위 30% 입찰가의 평균
  const sortedBids = [...competitors].sort((a, b) => b - a);
  const topBidsCount = Math.max(1, Math.ceil(sortedBids.length * 0.3));
  const topBids = sortedBids.slice(0, topBidsCount);
  
  const avgTopBid = topBids.reduce((sum, bid) => sum + bid, 0) / topBids.length;
  return Math.round(avgTopBid);
}

/**
 * 종합 키워드 분석 결과 계산
 * @param keyword 키워드 정보
 * @param products 관련 상품 리스트
 * @param adData 광고 데이터 (있는 경우)
 * @returns 종합 분석 결과
 */
export function calculateKeywordMetrics(
  keyword: NaverKeywordResult,
  products: NaverProductResult[],
  adData: any = null
) {
  // 검색량과 상품 수로 기본 경쟁 지수 계산
  const competitionIndex = calculateCompetitionIndex(keyword.searchCount, products.length);
  
  // 가상의 광고 데이터 (실제로는 API에서 가져와야 함)
  const mockAdData = {
    impressions: 10000,
    clicks: 120,
    adCost: 500000,
    purchaseProducts: Math.floor(products.length * 0.5),
    competitors: [
      5000, 7500, 10000, 15000, 20000, 25000, 30000, 35000
    ]
  };
  
  // 실제 광고 데이터가 있으면 그것을 사용, 없으면 목업 데이터 사용
  const adMetrics = adData || mockAdData;
  
  // 다양한 지표 계산
  return {
    keyword: keyword.keyword,
    searchCount: keyword.searchCount,
    productCount: products.length,
    competitionIndex: competitionIndex,
    realProductRatio: calculateRealProductRatio(products),
    foreignProductRatio: calculateForeignProductRatio(products),
    ctr: calculateCTR(adMetrics.impressions, adMetrics.clicks),
    clickCompetition: calculateClickCompetition(products.length, adMetrics.clicks),
    keywordAdEfficiency: calculateKeywordAdEfficiency(adMetrics.adCost, adMetrics.clicks),
    purchaseCompetition: calculatePurchaseCompetition(adMetrics.purchaseProducts, keyword.searchCount),
    rocketDeliveryRatio: calculateRocketDeliveryRatio(products),
    restrictedProductRatio: calculateRestrictedProductRatio(products),
    recentProductRatio: calculateRecentProductRatio(products),
    recommendedBid: calculateRecommendedBid(adMetrics.competitors),
    // 광고 입찰가는 권장가의 약 2/3 수준으로 설정 (목업)
    recommendedAdBid: Math.round(calculateRecommendedBid(adMetrics.competitors) * 0.67)
  };
}