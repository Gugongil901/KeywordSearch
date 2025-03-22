import axios from 'axios';
import * as crypto from 'crypto';

/**
 * 네이버 검색광고 API 클라이언트
 * 
 * 인증 정보 및 API 요청 처리를 담당하는 클래스
 */
class NaverAdAPIClient {
  private baseUrl: string = 'https://api.searchad.naver.com';
  private customerId: string;
  private accessLicense: string;
  private secretKey: string;
  private timestamp: number;

  constructor() {
    // 환경 변수에서 API 키 로드
    // NAVER_AD_API_KEY를 accessLicense로, 
    // NAVER_CUSTOMER_ID를 customerId로,
    // NAVER_AD_API_SECRET_KEY를 secretKey로 사용
    const customerId = process.env.NAVER_AD_API_CUSTOMER_ID || "3405855";
    const accessLicense = process.env.NAVER_AD_API_ACCESS_LICENSE || "01000000005a79e0d0ffff30be92041e87dd2444c689e1209efbe2f9ea58fd3a3ae67ee01e";
    const secretKey = process.env.NAVER_AD_API_SECRET_KEY || "AQAAAAAz4x1WAAABXG3/vqMqcjRNd4PzqWGJW12etZSvbIw9cTaWexf5x+Eu6QD9";

    if (!customerId || !accessLicense || !secretKey) {
      console.error('네이버 검색광고 API 키가 설정되지 않았습니다.');
      throw new Error('Required API credentials are missing');
    }

    this.customerId = customerId;
    this.accessLicense = accessLicense;
    this.secretKey = secretKey;
    this.timestamp = Date.now();

    console.log('네이버 검색광고 API 클라이언트 초기화 완료');
  }

  /**
   * API 요청 인증 헤더 생성
   */
  private generateHeaders(method: string, uri: string, apiKey: string = ''): Record<string, string> {
    this.timestamp = Date.now();
    
    const hmac = crypto.createHmac('sha256', this.secretKey);
    const sig = this.timestamp + '.' + method + '.' + uri;
    const signature = hmac.update(sig).digest('base64');

    return {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Timestamp': this.timestamp.toString(),
      'X-API-KEY': apiKey,
      'X-Customer': this.customerId,
      'X-Signature': signature,
    };
  }

  /**
   * API 호출 메소드
   */
  private async makeRequest(method: string, path: string, data: any = null): Promise<any> {
    try {
      const url = `${this.baseUrl}${path}`;
      const headers = this.generateHeaders(method, path, this.accessLicense);
      
      console.log(`네이버 검색광고 API 요청: ${method} ${path}`);
      
      const config = {
        method,
        url,
        headers,
        data: method !== 'GET' ? data : undefined,
      };

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      console.error('네이버 검색광고 API 요청 실패:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 키워드 도구 - 키워드 확장 API 호출
   * 입력한 키워드를 기반으로 연관 키워드 목록을 제공
   */
  async getRelatedKeywords(keyword: string): Promise<any> {
    try {
      const path = '/keywordstool';
      const params = {
        hintKeywords: [keyword],
        showDetail: 1
      };
      
      console.log(`키워드 도구 API 호출: 키워드="${keyword}"`);
      
      const result = await this.makeRequest('POST', path, params);
      return result;
    } catch (error) {
      console.error('키워드 도구 API 호출 실패:', error);
      // 에러가 발생해도 기본 응답 반환 (백업 데이터)
      return { keywordList: [] };
    }
  }

  /**
   * 키워드 성과 지표 API 호출
   * 기간별 키워드의 클릭수, 노출수, CTR, 광고비용 등 제공
   */
  async getKeywordPerformance(keywords: string[], startDate: string, endDate: string): Promise<any> {
    try {
      const path = '/stats';
      const params = {
        keywords,
        startDate,
        endDate,
        timeUnit: 'day',
        columns: ['impCnt', 'clkCnt', 'ctr', 'avgRnk', 'viewCnt']
      };
      
      console.log(`키워드 성과 지표 API 호출: 키워드="${keywords.join(', ')}" 기간=${startDate}~${endDate}`);
      
      const result = await this.makeRequest('POST', path, params);
      return result;
    } catch (error) {
      console.error('키워드 성과 지표 API 호출 실패:', error);
      // 에러가 발생해도 기본 응답 반환 (빈 배열)
      return { data: [] };
    }
  }

  /**
   * 입찰가 추천 API 호출
   * 특정 키워드에 대한 입찰가 추천 정보 제공
   */
  async getBidRecommendation(keyword: string): Promise<any> {
    try {
      const path = '/estimate/performance';
      const params = {
        device: 'PC',
        keywordplus: false,
        key: keyword,
        bids: [100, 300, 500, 1000, 1500, 2000, 3000, 5000]
      };
      
      console.log(`입찰가 추천 API 호출: 키워드="${keyword}"`);
      
      const result = await this.makeRequest('POST', path, params);
      return result;
    } catch (error) {
      console.error('입찰가 추천 API 호출 실패:', error);
      // 에러가 발생해도 기본 응답 반환 (빈 배열)
      return { estimate: [] };
    }
  }

  /**
   * 키워드 경쟁력 지수 계산 (검색광고 API 데이터 기반)
   */
  calculateCompetitionIndex(
    avgCpc: number, 
    avgBid: number, 
    highBid: number,
    totalAdCount: number
  ): number {
    // 최대 입찰가 대비 평균 입찰가 비율 (0-100)
    const bidRatio = Math.min((avgBid / highBid) * 100, 100);
    
    // 광고 수에 따른 지수 (0-100)
    const adCountIndex = Math.min(totalAdCount / 10 * 100, 100);
    
    // CPC 가중치 (높을수록 경쟁 치열)
    const cpcWeight = Math.min(avgCpc / 2000 * 100, 100);
    
    // 가중 평균으로 최종 지수 계산
    return (bidRatio * 0.4 + adCountIndex * 0.3 + cpcWeight * 0.3);
  }
}

// 싱글톤 인스턴스 생성
let adApiClient: NaverAdAPIClient;

/**
 * 네이버 검색광고 API 클라이언트 초기화
 */
export function initNaverAdAPI(): NaverAdAPIClient {
  if (!adApiClient) {
    try {
      adApiClient = new NaverAdAPIClient();
    } catch (error) {
      console.error('네이버 검색광고 API 초기화 실패:', error);
      throw error;
    }
  }
  return adApiClient;
}

/**
 * 키워드 연관 검색어 및 통계 조회
 */
export async function getKeywordInsights(keyword: string): Promise<any> {
  try {
    if (!adApiClient) {
      initNaverAdAPI();
    }
    
    const result = await adApiClient.getRelatedKeywords(keyword);
    
    // 데이터 가공 (필요한 필드만 추출)
    const keywordInsights = result.keywordList?.map((item: any) => ({
      keyword: item.relKeyword,
      monthlySearches: item.monthlyPcQcCnt + item.monthlyMobileQcCnt,
      pcSearches: item.monthlyPcQcCnt,
      mobileSearches: item.monthlyMobileQcCnt,
      competitionRate: item.compIdx,
      avgCpc: item.monthlyAvgCpc,
      avgBid: item.avgDepth || 0,
      highBid: item.plAvgDepth || 0,
      totalAdCount: item.plCnt || 0
    })) || [];
    
    return keywordInsights;
  } catch (error) {
    console.error('키워드 인사이트 조회 실패:', error);
    return [];
  }
}

/**
 * 키워드 검색광고 성과 데이터 조회
 */
export async function getKeywordPerformance(keyword: string): Promise<any> {
  try {
    if (!adApiClient) {
      initNaverAdAPI();
    }
    
    // 날짜 계산 (최근 30일)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    const result = await adApiClient.getKeywordPerformance(
      [keyword], 
      formatDate(startDate), 
      formatDate(endDate)
    );
    
    return result.data || [];
  } catch (error) {
    console.error('키워드 성과 데이터 조회 실패:', error);
    return [];
  }
}

/**
 * 키워드 입찰가 추천 데이터 조회
 */
export async function getKeywordBidRecommendation(keyword: string): Promise<any> {
  try {
    if (!adApiClient) {
      initNaverAdAPI();
    }
    
    const result = await adApiClient.getBidRecommendation(keyword);
    
    // 데이터 가공 (필요한 필드만 추출)
    const bidRecommendations = result.estimate?.map((item: any) => ({
      bid: item.bid,
      impressions: item.impCnt,
      clicks: item.clkCnt,
      cost: item.cost,
      ctr: item.ctr,
      avgPosition: item.avgRnk
    })) || [];
    
    return bidRecommendations;
  } catch (error) {
    console.error('키워드 입찰가 추천 조회 실패:', error);
    return [];
  }
}

/**
 * 키워드 전체 분석 데이터 조회 (연관 키워드, 성과, 입찰가 추천 등 통합)
 */
export async function getKeywordAnalysis(keyword: string): Promise<any> {
  try {
    if (!adApiClient) {
      initNaverAdAPI();
    }
    
    console.log(`키워드 분석 시작: "${keyword}"`);
    
    // 1. 연관 키워드 및 기본 정보 조회
    const relatedKeywords = await getKeywordInsights(keyword);
    
    // 현재 키워드의 정보만 추출
    const currentKeyword = relatedKeywords.find((item: any) => 
      item.keyword.toLowerCase() === keyword.toLowerCase()
    );
    
    // 2. 입찰가 추천 정보 조회
    const bidRecommendations = await getKeywordBidRecommendation(keyword);
    
    // 3. 관련 키워드 필터링 (상위 10개)
    const topRelatedKeywords = relatedKeywords
      .filter((item: any) => item.keyword.toLowerCase() !== keyword.toLowerCase())
      .sort((a: any, b: any) => b.monthlySearches - a.monthlySearches)
      .slice(0, 10);
    
    // 4. 경쟁력 지수 계산
    let competitionIndex = 50; // 기본값
    
    if (currentKeyword) {
      competitionIndex = adApiClient.calculateCompetitionIndex(
        currentKeyword.avgCpc || 0,
        currentKeyword.avgBid || 0,
        currentKeyword.highBid || 0,
        currentKeyword.totalAdCount || 0
      );
    }
    
    // 최종 결과 조합
    return {
      keyword,
      monthlySearches: currentKeyword?.monthlySearches || 0,
      pcSearchRatio: currentKeyword ? 
        (currentKeyword.pcSearches / (currentKeyword.monthlySearches || 1) * 100) : 0,
      mobileSearchRatio: currentKeyword ? 
        (currentKeyword.mobileSearches / (currentKeyword.monthlySearches || 1) * 100) : 0,
      competitionIndex: Math.round(competitionIndex),
      avgCpc: currentKeyword?.avgCpc || 0,
      relatedKeywords: topRelatedKeywords.map((item: any) => item.keyword),
      adRecommendations: bidRecommendations,
      fullInsights: {
        currentKeyword: currentKeyword || null,
        allRelatedKeywords: relatedKeywords,
        bidRecommendations
      }
    };
  } catch (error) {
    console.error('키워드 전체 분석 실패:', error);
    return {
      keyword,
      monthlySearches: 0,
      pcSearchRatio: 0,
      mobileSearchRatio: 0,
      competitionIndex: 0,
      avgCpc: 0,
      relatedKeywords: [],
      adRecommendations: [],
      fullInsights: {
        currentKeyword: null,
        allRelatedKeywords: [],
        bidRecommendations: []
      }
    };
  }
}