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
    
    // 사용자 제공 API 키 사용 (실제 키)
    const customerId = process.env.NAVER_AD_API_CUSTOMER_ID || "3405855";
    const accessLicense = process.env.NAVER_AD_API_ACCESS_LICENSE || "01000000005a79e0d0ffff30be92041e87dd2444c689e1209efbe2f9ea58fd3a3ae67ee01e";
    
    // 비밀키 (Base64)
    let secretKey = process.env.NAVER_AD_API_SECRET_KEY || "AQAAAABaeeDQ//8wvpIEHofdJETGcg3aHhG5YRGgFHPnSsNISw==";
    
    // 서명 디버깅 로그
    console.log(`API 인증 정보 초기화: customer_id=${customerId}`);
    console.log(`API License 활성화: API_KEY 사용 준비 완료`);

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
   * 네이버 검색광고 API 공식 문서 기준 서명 생성
   * https://naver.github.io/searchad-apidoc/#/sample
   */
  private generateHeaders(method: string, uri: string, apiKey: string = ''): Record<string, string> {
    // 타임스탬프 생성 (밀리초)
    this.timestamp = Date.now();
    
    // 서명 문자열 형식: {timestamp}.{method}.{uri}
    // 네이버 API 문서 예시: 1518007642123.GET./ncc/campaigns
    const pathOnly = uri.split('?')[0];  // 쿼리 파라미터 제거
    const sig = this.timestamp + '.' + method + '.' + pathOnly;
    
    console.log(`인증 서명 생성: timestamp=${this.timestamp}, method=${method}, path=${pathOnly}`);
    console.log(`서명 문자열: ${sig}`);
    
    // HMAC-SHA256 암호화 (비밀키로 서명)
    try {
      // 예시 코드처럼 생성
      const hmac = crypto.createHmac('sha256', this.secretKey);
      hmac.update(sig);
      const signature = hmac.digest('base64');
      
      console.log(`생성된 서명: ${signature}`);
  
      // 네이버 검색광고 API 문서에 따른 정확한 헤더 설정
      // https://naver.github.io/searchad-apidoc/#/sample
      return {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Timestamp': this.timestamp.toString(),
        'X-API-KEY': apiKey,
        'X-Customer': this.customerId,
        'X-Signature': signature,
      };
    } catch (error) {
      console.error('서명 생성 오류:', error);
      throw new Error('서명 생성 중 오류 발생');
    }
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
    
    // API 호출 (실제 환경) 또는 백업 데이터 사용
    let result;
    try {
      console.log(`네이버 검색광고 API 호출 시도: 키워드="${keyword}"`);
      result = await adApiClient.getRelatedKeywords(keyword);
      console.log('API 호출 결과:', result ? '성공' : '실패');
    } catch (apiError) {
      console.error('API 호출 실패, 백업 데이터 사용:', apiError);
      // 백업 데이터 사용
      result = { 
        keywordList: [
          { 
            relKeyword: keyword,
            monthlyPcQcCnt: "500", 
            monthlyMobileQcCnt: "1500",
            compIdx: "3.4",
            monthlyAvgCpc: "980",
            plCnt: "45",
            avgDepth: "2.8",
            plAvgDepth: "4.5"
          }
        ] 
      };
    }
    
    // 데이터 가공 (필요한 필드만 추출)
    // 네이버 API는 숫자 필드도 문자열로 반환함을 유의
    const keywordInsights = result.keywordList?.map((item: any) => {
      // 문자열을 숫자로 변환 (안전하게)
      const pcCount = parseInt(item.monthlyPcQcCnt || '0', 10) || 0;
      const mobileCount = parseInt(item.monthlyMobileQcCnt || '0', 10) || 0;
      
      return {
        keyword: item.relKeyword,
        monthlySearches: pcCount + mobileCount,
        pcSearches: pcCount,
        mobileSearches: mobileCount,
        competitionRate: parseFloat(item.compIdx || '0') || 0,
        avgCpc: parseInt(item.monthlyAvgCpc || '0', 10) || 0,
        avgBid: parseFloat(item.avgDepth || '0') || 0,
        highBid: parseFloat(item.plAvgDepth || '0') || 0,
        totalAdCount: parseInt(item.plCnt || '0', 10) || 0
      };
    }) || [];
    
    console.log(`키워드 인사이트 처리 완료: ${keywordInsights.length}개 항목`);
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
    
    // API 호출 (실제 환경) 또는 백업 데이터 사용
    let result;
    try {
      console.log(`네이버 검색광고 API 입찰가 호출 시도: 키워드="${keyword}"`);
      result = await adApiClient.getBidRecommendation(keyword);
      console.log('API 입찰가 호출 결과:', result ? '성공' : '실패');
    } catch (apiError) {
      console.error('API 입찰가 호출 실패, 백업 데이터 사용:', apiError);
      // 백업 데이터 사용
      result = { 
        estimate: [
          { bid: 100, impCnt: "450", clkCnt: "12", cost: "1200", ctr: "2.6", avgRnk: "8.5" },
          { bid: 300, impCnt: "680", clkCnt: "25", cost: "7500", ctr: "3.7", avgRnk: "6.2" },
          { bid: 500, impCnt: "890", clkCnt: "38", cost: "19000", ctr: "4.3", avgRnk: "4.8" },
          { bid: 1000, impCnt: "1250", clkCnt: "52", cost: "52000", ctr: "4.1", avgRnk: "3.2" },
          { bid: 1500, impCnt: "1480", clkCnt: "62", cost: "93000", ctr: "4.2", avgRnk: "2.4" }
        ]
      };
    }
    
    // 데이터 가공 (필요한 필드만 추출)
    // 네이버 API는 숫자 필드도 문자열로 반환함을 유의
    const bidRecommendations = result.estimate?.map((item: any) => ({
      bid: typeof item.bid === 'number' ? item.bid : parseInt(item.bid || '0', 10),
      impressions: typeof item.impCnt === 'number' ? item.impCnt : parseInt(item.impCnt || '0', 10),
      clicks: typeof item.clkCnt === 'number' ? item.clkCnt : parseInt(item.clkCnt || '0', 10),
      cost: typeof item.cost === 'number' ? item.cost : parseInt(item.cost || '0', 10),
      ctr: typeof item.ctr === 'number' ? item.ctr : parseFloat(item.ctr || '0'),
      avgPosition: typeof item.avgRnk === 'number' ? item.avgRnk : parseFloat(item.avgRnk || '0')
    })) || [];
    
    console.log(`입찰가 추천 처리 완료: ${bidRecommendations.length}개 항목`);
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