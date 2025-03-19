/**
 * 키워드 분석 지표 계산 알고리즘
 * 
 * 이 모듈은 네이버 검색광고 API와 쇼핑 API에서 가져온 데이터를 기반으로
 * 키워드의 경쟁강도, 광고효율, 클릭률 등 다양한 지표를 계산합니다.
 */

import { NaverKeywordResult, NaverProductResult } from '@shared/schema';

/**
 * 키워드 경쟁 강도 계산
 * @param searchCount 검색량
 * @param productCount 상품 수
 * @returns 0-100 사이의 경쟁 강도 지수
 */
export function calculateCompetitionIndex(searchCount: number, productCount: number): number {
  // 검색량 대비 상품 수가 많을수록 경쟁이 치열함
  // 검색량이 0이면 나눗셈 오류 방지
  if (searchCount === 0) return 0;
  
  // 기본 경쟁 지수 계산 (상품 수 / 검색량)
  let ratio = productCount / searchCount;
  
  // 로그 스케일 적용 (수치가 너무 크거나 작아지는 것 방지)
  let logRatio = Math.log10(ratio * 100 + 1);
  
  // 0-100 사이로 정규화
  let normalizedIndex = Math.min(100, logRatio * 25);
  
  return Math.round(normalizedIndex * 10) / 10; // 소수점 첫째 자리까지
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