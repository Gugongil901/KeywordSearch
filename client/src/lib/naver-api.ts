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

// ML 관련 인터페이스
export interface SearchVolumeForecast {
  month: number;
  forecast: number;
  lower: number;
  upper: number;
}

export interface SuccessProbability {
  probability: number;
  score: number;
  important_factors: Array<{
    factor: string;
    importance: number;
  }>;
}

export interface KeywordMeaning {
  keyword: string;
  nouns: string[];
  categories: Array<{
    category: string;
    score: number;
    matches: string[];
  }>;
  intent: {
    intent: string;
    score: number;
    matches: string[];
  };
  sentiment: {
    sentiment: string;
    positive_score: number;
    negative_score: number;
  };
}

export interface SemanticRelatedKeyword {
  keyword: string;
  similarity: number;
  representativeProduct?: {
    productId: string;
    name: string;
    price: number;
    image?: string;
    url?: string;
  };
}

export interface MarketSegment {
  id: number;
  label: string;
  keywords: string[];
}

export interface MLAnalysisResult {
  keyword: string;
  ml_analysis: {
    search_forecast: SearchVolumeForecast[];
    success_probability: SuccessProbability;
    keyword_meaning?: KeywordMeaning;
    semantic_related_keywords?: SemanticRelatedKeyword[];
    market_segments?: MarketSegment[];
  };
  timestamp: string;
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

/**
 * 검색량 예측 - 머신러닝 기반
 * @param keyword - 예측할 키워드
 * @returns 검색량 예측 결과
 */
export async function getSearchVolumeForecast(keyword: string): Promise<SearchVolumeForecast[]> {
  try {
    const response = await apiRequest("GET", `/api/ml/search-forecast/${encodeURIComponent(keyword)}`, undefined);
    const data = await response.json();
    return data.forecast;
  } catch (error) {
    console.error("검색량 예측 조회 실패:", error);
    throw error;
  }
}

/**
 * 성공 확률 예측 - 머신러닝 기반
 * @param keyword - 예측할 키워드
 * @returns 성공 확률 예측 결과
 */
export async function getSuccessProbability(keyword: string): Promise<SuccessProbability> {
  try {
    const response = await apiRequest("GET", `/api/ml/success-probability/${encodeURIComponent(keyword)}`, undefined);
    const data = await response.json();
    return data.probability;
  } catch (error) {
    console.error("성공 확률 예측 조회 실패:", error);
    throw error;
  }
}

/**
 * 키워드 의미 분석 - 자연어 처리 기반
 * @param keyword - 분석할 키워드
 * @returns 키워드 의미 분석 결과
 */
export async function getKeywordMeaning(keyword: string): Promise<KeywordMeaning> {
  try {
    const response = await apiRequest("GET", `/api/ml/meaning/${encodeURIComponent(keyword)}`, undefined);
    const data = await response.json();
    return data.meaning;
  } catch (error) {
    console.error("키워드 의미 분석 조회 실패:", error);
    throw error;
  }
}

/**
 * 의미적 연관 키워드 조회 - 자연어 처리 기반
 * @param keyword - 기준 키워드
 * @param limit - 최대 키워드 수
 * @returns 의미적 연관 키워드 목록
 */
export async function getSemanticRelatedKeywords(keyword: string, limit: number = 20): Promise<SemanticRelatedKeyword[]> {
  try {
    const response = await apiRequest("GET", `/api/ml/semantic-related/${encodeURIComponent(keyword)}?limit=${limit}`, undefined);
    const data = await response.json();
    return data.related_keywords;
  } catch (error) {
    console.error("의미적 연관 키워드 조회 실패:", error);
    throw error;
  }
}

/**
 * 시장 세그먼트 조회 - 자연어 처리 기반
 * @param keyword - 기준 키워드
 * @returns 시장 세그먼트 목록
 */
export async function getMarketSegments(keyword: string): Promise<MarketSegment[]> {
  try {
    const response = await apiRequest("GET", `/api/ml/market-segments/${encodeURIComponent(keyword)}`, undefined);
    const data = await response.json();
    return data.segments;
  } catch (error) {
    console.error("시장 세그먼트 조회 실패:", error);
    throw error;
  }
}

/**
 * 종합 머신러닝 분석 - 모든 ML 예측 통합
 * @param keyword - 분석할 키워드
 * @returns 종합 머신러닝 분석 결과
 */
export async function getMLAnalysis(keyword: string): Promise<MLAnalysisResult> {
  try {
    const response = await apiRequest("GET", `/api/v1/ml/analyze/${encodeURIComponent(keyword)}`, undefined);
    return await response.json();
  } catch (error) {
    console.error("ML 분석 조회 실패:", error);
    throw error;
  }
}
