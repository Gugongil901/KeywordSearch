import { apiRequest } from "./queryClient";

// Naver API client - Frontend interface
export interface KeywordStats {
  keyword: string;
  searchCount: number;
  pcSearchRatio: number;
  mobileSearchRatio: number;
  competitionIndex: number;
  relatedKeywords: string[];
}

// 네이버 검색광고 API 관련 인터페이스
export interface KeywordInsight {
  keyword: string;
  monthlySearches: number;
  pcSearches: number;
  mobileSearches: number;
  competitionRate: number;
  avgCpc: number;
  avgBid: number;
  highBid: number;
  totalAdCount: number;
}

export interface BidRecommendation {
  bid: number;
  impressions: number;
  clicks: number;
  cost: number;
  ctr: number;
  avgPosition: number;
}

export interface KeywordAnalysis {
  keyword: string;
  monthlySearches: number;
  pcSearchRatio: number;
  mobileSearchRatio: number;
  competitionIndex: number;
  avgCpc: number;
  relatedKeywords: string[];
  adRecommendations: BidRecommendation[];
  fullInsights: {
    currentKeyword: KeywordInsight | null;
    allRelatedKeywords: KeywordInsight[];
    bidRecommendations: BidRecommendation[];
  };
}

export interface Product {
  productId: string;
  title: string;
  price: number;
  image: string;
  category: string;
  brandName: string;
  reviewCount: number;
  rank: number;
  productUrl: string;
}

export interface KeywordTrend {
  date: string;
  count: number;
}

export interface KeywordSearchResult {
  keyword: string;
  searchCount: number;
  pcSearchRatio: number;
  mobileSearchRatio: number;
  productCount: number;
  averagePrice: number;
  totalSales: number;
  totalSalesCount: number;
  competitionIndex: number;
  realProductRatio: number;
  foreignProductRatio: number;
  products: Product[];
  relatedKeywords: string[];
  trends: KeywordTrend[];
}

export interface CategoryTrend {
  category: string;
  keywords: Array<{
    keyword: string;
    rank: number;
    change: 'up' | 'down' | 'same';
  }>;
  products: Product[];
}

// API functions
/**
 * 키워드 검색 기능
 * @param keyword - 검색할 키워드
 * @returns 키워드 검색 결과
 */
export async function searchKeyword(keyword: string): Promise<KeywordSearchResult> {
  try {
    const response = await apiRequest("GET", `/api/search?query=${encodeURIComponent(keyword)}`, undefined);
    return await response.json();
  } catch (error) {
    console.error("키워드 검색 실패:", error);
    throw error;
  }
}

/**
 * 키워드 통계 정보 가져오기
 * @param keyword - 검색할 키워드
 * @returns 키워드 통계 정보
 */
export async function getKeywordStats(keyword: string): Promise<KeywordStats> {
  try {
    const response = await apiRequest("GET", `/api/keyword/stats?keyword=${encodeURIComponent(keyword)}`, undefined);
    return await response.json();
  } catch (error) {
    console.error("키워드 통계 조회 실패:", error);
    throw error;
  }
}

/**
 * 키워드 트렌드 정보 가져오기 (네이버 데이터랩 API 활용)
 * @param keyword - 검색할 키워드
 * @param period - 기간 (daily, weekly)
 * @returns 키워드 트렌드 정보
 */
export async function getKeywordTrends(keyword: string, period: string = "daily"): Promise<{ keyword: string; trends: KeywordTrend[] }> {
  try {
    // 인코딩 이슈 발생시, 여러 번 인코딩되는 경우를 방지하기 위해 
    // 먼저 디코딩해서 순수 한글 문자열을 얻은 후 다시 인코딩
    let processedKeyword;
    try {
      // 이미 인코딩된 문자열인지 확인 시도 (실패하면 원본 사용)
      processedKeyword = decodeURIComponent(keyword);
    } catch (e) {
      processedKeyword = keyword;
    }
    
    // 한글 키워드를 안전하게 인코딩
    const encodedKeyword = encodeURIComponent(processedKeyword);
    console.log(`키워드 트렌드 요청: 원본='${keyword}', 처리='${processedKeyword}', 인코딩='${encodedKeyword}'`);
    
    const response = await apiRequest(
      "GET", 
      `/api/keyword/trends?keyword=${encodedKeyword}&period=${period}`,
      undefined
    );
    return await response.json();
  } catch (error) {
    console.error("키워드 트렌드 조회 실패:", error);
    throw error;
  }
}

/**
 * 일간 인기 키워드 트렌드 가져오기 (네이버 데이터랩 API 활용)
 * @param category - 카테고리 (all, fashion, beauty 등)
 * @returns 일간 인기 키워드 트렌드 정보
 */
export async function getDailyTrends(category: string = "all"): Promise<CategoryTrend> {
  try {
    const response = await apiRequest("GET", `/api/trends/daily?category=${category}`, undefined);
    return await response.json();
  } catch (error) {
    console.error("일간 트렌드 조회 실패:", error);
    throw error;
  }
}

/**
 * 주간 인기 키워드 트렌드 가져오기 (네이버 데이터랩 API 활용)
 * @param category - 카테고리 (all, fashion, beauty 등)
 * @returns 주간 인기 키워드 트렌드 정보
 */
export async function getWeeklyTrends(category: string = "all"): Promise<CategoryTrend> {
  try {
    const response = await apiRequest("GET", `/api/trends/weekly?category=${category}`, undefined);
    return await response.json();
  } catch (error) {
    console.error("주간 트렌드 조회 실패:", error);
    throw error;
  }
}

/**
 * 카테고리별 인기 상품 가져오기
 * @param category - 카테고리 (all, fashion, beauty 등)
 * @param limit - 가져올 상품 수 
 * @returns 인기 상품 목록
 */
export async function getTopProducts(category: string = "all", limit: number = 10): Promise<Product[]> {
  try {
    const response = await apiRequest("GET", `/api/products/top?category=${category}&limit=${limit}`, undefined);
    return await response.json();
  } catch (error) {
    console.error("인기 상품 조회 실패:", error);
    throw error;
  }
}

/**
 * 키워드 관련 인사이트 정보 가져오기 (네이버 검색광고 API)
 * @param keyword - 검색할 키워드
 * @returns 키워드 관련 인사이트 목록
 */
export async function getRelatedKeywords(keyword: string): Promise<KeywordInsight[]> {
  try {
    const response = await apiRequest("GET", `/api/keyword/related?keyword=${encodeURIComponent(keyword)}`, undefined);
    return await response.json();
  } catch (error) {
    console.error("관련 키워드 조회 실패:", error);
    return [];
  }
}

/**
 * 키워드 입찰가 추천 정보 가져오기 (네이버 검색광고 API)
 * @param keyword - 검색할 키워드
 * @returns 키워드 입찰가 추천 정보
 */
export async function getKeywordBids(keyword: string): Promise<BidRecommendation[]> {
  try {
    const response = await apiRequest("GET", `/api/keyword/bids?keyword=${encodeURIComponent(keyword)}`, undefined);
    return await response.json();
  } catch (error) {
    console.error("입찰가 추천 조회 실패:", error);
    return [];
  }
}

/**
 * 키워드 전체 분석 정보 가져오기 (통합 데이터)
 * @param keyword - 검색할 키워드
 * @returns 키워드 분석 정보
 */
export async function getKeywordAnalysis(keyword: string): Promise<KeywordAnalysis> {
  try {
    const response = await apiRequest("GET", `/api/keyword/analysis?keyword=${encodeURIComponent(keyword)}`, undefined);
    return await response.json();
  } catch (error) {
    console.error("키워드 분석 조회 실패:", error);
    throw error;
  }
}
