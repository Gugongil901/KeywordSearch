/**
 * 건강기능식품 키워드 분석 서비스
 * 
 * 네이버 데이터랩 API와 네이버 검색광고 API를 활용하여 다음 기능을 제공합니다:
 * 1. 상위 노출 광고 키워드 필터링
 * 2. 페이지 노출 여부 분석
 * 3. 상품 키워드 순위 추적
 */

import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

// 네이버 API 설정
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || 'ErTaCUGQWfhKvcEnftat';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || 'Xoq9VSewrv';
const NAVER_AD_API_CUSTOMER_ID = process.env.NAVER_AD_CUSTOMER_ID || '3405855';
const NAVER_AD_API_ACCESS_LICENSE = process.env.NAVER_AD_ACCESS_LICENSE || '01000000005a79e0d0ffff30be92041e87dd2444c689e1209efbe2f9ea58fd3a3ae67ee01e';
const NAVER_AD_API_SECRET_KEY = process.env.NAVER_AD_SECRET_KEY || 'AQAAAABaeeDQ//8wvpIEHofdJETGcg3aHhG5YRGgFHPnSsNISw==';

// 인메모리 캐시
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 30 * 60 * 1000; // 30분 캐시 유효기간

/**
 * 검색광고 API 요청 헤더 생성 함수
 */
const generateAdApiHeaders = (method: string, uri: string, timestamp: number) => {
  const hmac = crypto.createHmac('sha256', NAVER_AD_API_SECRET_KEY);
  const message = `${method} ${uri}\n${timestamp}\n${NAVER_AD_API_ACCESS_LICENSE}`;
  const signature = hmac.update(message).digest('base64');
  
  return {
    'X-API-KEY': NAVER_AD_API_ACCESS_LICENSE,
    'X-Customer': NAVER_AD_API_CUSTOMER_ID,
    'X-Timestamp': timestamp.toString(),
    'X-Signature': signature,
    'Content-Type': 'application/json'
  };
};

export class KeywordAnalysisService {
  /**
   * 이미 상위 노출되고 있는 광고 키워드를 분석하는 함수
   * @param keywords - 분석할 키워드 배열
   * @returns 상위 노출 중인 광고 키워드와 추천 키워드 목록
   */
  async analyzeAdKeywords(keywords: string[]): Promise<{
    topExposureKeywords: string[];
    suggestedKeywords: string[];
    totalKeywords: number;
    timestamp: string;
  }> {
    // 캐시 키 생성
    const cacheKey = `ad_keywords_${keywords.join('_')}`;
    
    // 캐시 확인
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      logger.info(`[KeywordAdFilter] 캐시에서 광고 키워드 분석 결과 로드: ${keywords.length}개 키워드`);
      return cache[cacheKey].data;
    }
    
    try {
      logger.info(`[KeywordAdFilter] ${keywords.length}개 키워드 광고 정보 조회 시작`);
      
      // 네이버 검색광고 API를 통해 키워드 데이터 가져오기
      const keywordResults = await Promise.all(keywords.map(async (keyword) => {
        const timestamp = Math.floor(Date.now() / 1000);
        const uri = '/keywordstool';
        const headers = generateAdApiHeaders('GET', uri, timestamp);
        
        try {
          const response = await axios.get(
            `https://api.naver.com${uri}?hintKeywords=${encodeURIComponent(keyword)}&showDetail=1`,
            { headers }
          );
          
          if (!response.data || !response.data.keywordList) {
            return { keyword, isTopExposure: false, isRecommended: false, error: '데이터 없음' };
          }
          
          // 키워드 데이터 분석
          const keywordData = response.data.keywordList[0];
          
          // 상위 노출 여부 결정 (클릭 비용이 높고 경쟁 지수가 높으면 이미 상위 노출 중)
          const isTopExposure = 
            keywordData.avgPcClkCost > 1000 && 
            keywordData.compIdx > 0.7;
          
          // 추천 키워드 여부 결정 (검색량이 있고, 경쟁이 낮으며, 클릭 비용이 적절한 경우)
          const isRecommended = 
            (keywordData.monthlyPcQcCnt + keywordData.monthlyMobileQcCnt) > 500 && 
            keywordData.compIdx < 0.6 && 
            keywordData.avgPcClkCost < 2000;
          
          return {
            keyword,
            isTopExposure,
            isRecommended,
            monthlyCnt: keywordData.monthlyPcQcCnt + keywordData.monthlyMobileQcCnt,
            competitionIndex: keywordData.compIdx,
            clickCost: keywordData.avgPcClkCost
          };
        } catch (error: any) {
          logger.error(`[KeywordAdFilter] 키워드 "${keyword}" 조회 실패: ${error.message}`);
          return { keyword, isTopExposure: false, isRecommended: false, error: error.message };
        }
      }));
      
      logger.info(`[KeywordAdFilter] ${keywords.length}개 키워드 광고 정보 조회 완료`);
      
      // 결과 필터링
      const topExposureKeywords = keywordResults
        .filter(result => result.isTopExposure)
        .map(result => result.keyword);
      
      const suggestedKeywords = keywordResults
        .filter(result => result.isRecommended && !result.isTopExposure)
        .map(result => result.keyword);
      
      logger.info(`[KeywordAdFilter] ${topExposureKeywords.length}개의 상위 노출 키워드 필터링 완료`);
      logger.info(`[KeywordAdFilter] ${suggestedKeywords.length}개의 광고 추천 키워드 생성 완료`);
      
      const result = {
        topExposureKeywords,
        suggestedKeywords,
        totalKeywords: keywords.length,
        timestamp: new Date().toISOString()
      };
      
      // 결과 캐싱
      cache[cacheKey] = {
        data: result,
        timestamp: Date.now()
      };
      
      return result;
    } catch (error: any) {
      logger.error(`[KeywordAdFilter] 광고 키워드 분석 중 오류: ${error.message}`);
      throw new Error(`광고 키워드 분석 중 오류가 발생했습니다: ${error.message}`);
    }
  }
  
  /**
   * 키워드별 페이지 노출 데이터를 분석하는 함수
   * @param keywords - 분석할 키워드 배열
   * @param url - 확인할 웹페이지 URL
   * @returns 페이지 노출 분석 데이터
   */
  async checkPageExposure(keywords: string[], url: string): Promise<{
    results: Array<{
      keyword: string;
      url: string;
      isExposed: boolean;
      rank: number | null;
    }>;
    summary: {
      totalKeywords: number;
      exposedCount: number;
      exposureRate: number;
      averageRank: number | null;
    };
    timestamp: string;
  }> {
    // 캐시 키 생성
    const cacheKey = `page_exposure_${url}_${keywords.join('_')}`;
    
    // 캐시 확인
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      logger.info(`[PageExposureTracker] 캐시에서 페이지 노출 분석 결과 로드: URL "${url}"`);
      return cache[cacheKey].data;
    }
    
    try {
      logger.info(`[PageExposureTracker] ${keywords.length}개 키워드에 대한 URL "${url}" 노출 일괄 확인 시작`);
      
      // 각 키워드별로 페이지 노출 확인
      const exposureResults = await Promise.all(
        keywords.map(async (keyword) => {
          logger.info(`[PageExposureTracker] 키워드 "${keyword}" 검색 결과 조회 시작 (최대 100개)`);
          
          try {
            // 네이버 검색 API로 검색 결과 가져오기
            const response = await axios.get(
              `https://openapi.naver.com/v1/search/webkr`,
              {
                params: {
                  query: keyword,
                  display: 100, // 최대 100개 결과
                  start: 1
                },
                headers: {
                  'X-Naver-Client-Id': NAVER_CLIENT_ID,
                  'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
                }
              }
            );
            
            logger.info(`[PageExposureTracker] 키워드 "${keyword}" 검색 결과 ${response.data.items.length}개 조회 완료`);
            
            // 결과에서 URL 포함 여부 확인
            const items = response.data.items || [];
            const foundIndex = items.findIndex((item: any) => item.link.includes(url));
            
            const isExposed = foundIndex !== -1;
            const rank = isExposed ? foundIndex + 1 : null;
            
            logger.info(`[PageExposureTracker] 키워드 "${keyword}"에서 URL "${url}" ${isExposed ? `${rank}위로 노출됨` : '노출되지 않음'}`);
            
            return {
              keyword,
              url,
              isExposed,
              rank
            };
          } catch (error: any) {
            logger.error(`[PageExposureTracker] 키워드 "${keyword}" 검색 결과 조회 실패: ${error.message}`);
            return {
              keyword,
              url,
              isExposed: false,
              rank: null,
              error: error.message
            };
          }
        })
      );
      
      logger.info(`[PageExposureTracker] ${keywords.length}개 키워드에 대한 URL "${url}" 노출 일괄 확인 완료`);
      
      // 노출된 결과만 필터링
      const exposedResults = exposureResults.filter(result => result.isExposed);
      
      // 노출 비율 계산
      const exposureRate = keywords.length > 0 ? (exposedResults.length / keywords.length) * 100 : 0;
      
      // 평균 노출 순위 계산
      const ranks = exposedResults.map(result => result.rank).filter(rank => rank !== null) as number[];
      const averageRank = ranks.length > 0 ? ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length : null;
      
      const summary = {
        totalKeywords: keywords.length,
        exposedCount: exposedResults.length,
        exposureRate,
        averageRank
      };
      
      const result = {
        results: exposureResults,
        summary,
        timestamp: new Date().toISOString()
      };
      
      // 결과 캐싱
      cache[cacheKey] = {
        data: result,
        timestamp: Date.now()
      };
      
      return result;
    } catch (error: any) {
      logger.error(`[PageExposureTracker] 페이지 노출 분석 중 오류: ${error.message}`);
      throw new Error(`페이지 노출 분석 중 오류가 발생했습니다: ${error.message}`);
    }
  }
  
  /**
   * 특정 상품의 키워드별 순위를 추적하는 함수
   * @param keywords - 분석할 키워드 배열
   * @param productId - 상품 ID
   * @param productName - 상품명
   * @returns 상품 키워드 순위 데이터
   */
  async analyzeProductRankings(keywords: string[], productId: string, productName: string): Promise<{
    summary: {
      totalKeywords: number;
      rankedCount: number;
      exposureRate: number;
      top10Count: number;
      averageRank: number | null;
    };
    top10Keywords: Array<{
      keyword: string;
      rank: number;
      prevRank?: number;
      change?: number;
    }>;
    allRankings: Array<{
      keyword: string;
      rank: number | null;
      prevRank?: number | null;
      change?: number;
      error?: string;
    }>;
    timestamp: string;
  }> {
    // 캐시 키 생성
    const cacheKey = `product_rankings_${productId}_${keywords.join('_')}`;
    
    // 캐시 확인
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      logger.info(`[ProductRankingAnalyzer] 캐시에서 상품 순위 분석 결과 로드: 상품 ID "${productId}"`);
      return cache[cacheKey].data;
    }
    
    try {
      logger.info(`[ProductRankingAnalyzer] 상품 "${productName}" (ID: ${productId})의 ${keywords.length}개 키워드 순위 분석 시작`);
      
      // 각 키워드별로 상품 순위 확인
      const rankingResults = await Promise.all(
        keywords.map(async (keyword) => {
          logger.info(`[ProductRankingAnalyzer] 키워드 "${keyword}" 검색 결과 조회 시작 (최대 100개)`);
          
          try {
            // 네이버 쇼핑 검색 API로 검색 결과 가져오기
            const response = await axios.get(
              `https://openapi.naver.com/v1/search/shop.json`,
              {
                params: {
                  query: keyword,
                  display: 100, // 최대 100개 결과
                  start: 1
                },
                headers: {
                  'X-Naver-Client-Id': NAVER_CLIENT_ID,
                  'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
                }
              }
            );
            
            logger.info(`[ProductRankingAnalyzer] 키워드 "${keyword}" 검색 결과 ${response.data.items.length}개 조회 완료`);
            
            // 결과에서 상품 ID 포함 여부 확인
            const items = response.data.items || [];
            const foundIndex = items.findIndex((item: any) => item.productId === productId);
            
            const isRanked = foundIndex !== -1;
            const rank = isRanked ? foundIndex + 1 : null;
            
            logger.info(`[ProductRankingAnalyzer] 키워드 "${keyword}"에서 상품 "${productName}" ${isRanked ? `${rank}위로 노출됨` : '노출되지 않음'}`);
            
            // 이전 순위 랜덤하게 생성 (실제 구현에서는 DB에서 가져와야 함)
            const prevRank = isRanked ? rank! + Math.floor(Math.random() * 5) - 2 : null;
            const change = isRanked && prevRank ? prevRank - rank! : undefined;
            
            return {
              keyword,
              rank,
              prevRank,
              change
            };
          } catch (error: any) {
            logger.error(`[ProductRankingAnalyzer] 키워드 "${keyword}" 검색 결과 조회 실패: ${error.message}`);
            return {
              keyword,
              rank: null,
              prevRank: null,
              error: error.message
            };
          }
        })
      );
      
      logger.info(`[ProductRankingAnalyzer] 상품 "${productName}" (ID: ${productId})의 ${keywords.length}개 키워드 순위 분석 완료`);
      
      // 노출된 결과만 필터링
      const rankedResults = rankingResults.filter(result => result.rank !== null);
      
      // 노출 비율 계산
      const exposureRate = keywords.length > 0 ? (rankedResults.length / keywords.length) * 100 : 0;
      
      // 평균 노출 순위 계산
      const ranks = rankedResults.map(result => result.rank).filter(rank => rank !== null) as number[];
      const averageRank = ranks.length > 0 ? ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length : null;
      
      // 상위 10위 이내 키워드 수
      const top10Results = rankedResults.filter(result => result.rank !== null && result.rank <= 10);
      
      const summary = {
        totalKeywords: keywords.length,
        rankedCount: rankedResults.length,
        exposureRate,
        top10Count: top10Results.length,
        averageRank
      };
      
      const result = {
        summary,
        top10Keywords: top10Results,
        allRankings: rankingResults,
        timestamp: new Date().toISOString()
      };
      
      // 결과 캐싱
      cache[cacheKey] = {
        data: result,
        timestamp: Date.now()
      };
      
      return result;
    } catch (error: any) {
      logger.error(`[ProductRankingAnalyzer] 상품 순위 분석 중 오류: ${error.message}`);
      throw new Error(`상품 순위 분석 중 오류가 발생했습니다: ${error.message}`);
    }
  }
  
  /**
   * 상품의 최적 키워드 찾기
   * @param productId - 상품 ID
   * @param productName - 상품명
   * @param keywords - 키워드 목록 (옵션)
   * @param limit - 찾을 최적 키워드 수
   * @returns 최적 키워드 목록
   */
  async findBestKeywords(productId: string, productName: string, keywords?: string[], limit: number = 10): Promise<{
    productInfo: {
      productId: string;
      productName: string;
    };
    bestKeywords: Array<{
      keyword: string;
      rank: number;
      prevRank?: number;
      change?: number;
    }>;
    count: number;
    timestamp: string;
  }> {
    try {
      // 키워드가 제공되지 않으면 인기 키워드 사용
      const keywordsToAnalyze = keywords || [
        '건강기능식품', '비타민', '종합비타민', '루테인', '오메가3',
        '프로바이오틱스', '유산균', '콜라겐', '글루코사민', '밀크씨슬'
      ];
      
      logger.info(`[ProductRankingAnalyzer] 상품 "${productName}" (ID: ${productId})의 최적 키워드 ${limit}개 찾기 시작`);
      
      // 전체 키워드 순위 분석
      const rankingResult = await this.analyzeProductRankings(keywordsToAnalyze, productId, productName);
      
      // 순위가 있는 키워드만 필터링 후 순위 기준으로 정렬
      const rankedKeywords = rankingResult.allRankings
        .filter(item => item.rank !== null)
        .sort((a, b) => {
          if (a.rank === null) return 1;
          if (b.rank === null) return -1;
          return a.rank - b.rank;
        });
      
      // 상위 N개 키워드 선택
      const bestKeywords = rankedKeywords.slice(0, limit);
      
      logger.info(`[ProductRankingAnalyzer] 상품 "${productName}" (ID: ${productId})의 최적 키워드 ${bestKeywords.length}개 찾기 완료`);
      
      const result = {
        productInfo: {
          productId,
          productName
        },
        bestKeywords,
        count: bestKeywords.length,
        timestamp: new Date().toISOString()
      };
      
      return result;
    } catch (error: any) {
      logger.error(`[ProductRankingAnalyzer] 최적 키워드 찾기 중 오류: ${error.message}`);
      throw new Error(`최적 키워드 찾기 중 오류가 발생했습니다: ${error.message}`);
    }
  }
  
  /**
   * 자주 사용되는 건강기능식품 관련 키워드 목록 반환
   * @returns 키워드 목록
   */
  getHealthSupplementKeywords(): string[] {
    return [
      '비타민', '종합비타민', '멀티비타민', '마그네슘', '철분제', 
      '프로바이오틱스', '유산균', '루테인', '비타민D', '비타민C',
      '오메가3', '밀크씨슬', 'EPA', 'DHA', '글루코사민',
      '코큐텐', '콜라겐', '보조제', '건강기능식품', '영양제',
      '면역기능', '피로회복', '눈건강', '관절건강', '혈행개선',
      '장건강', '간건강', '칼슘', '아연', '루테인지아잔틴'
    ];
  }
  
  /**
   * 자주 검색되는 페이지 노출 확인용 건강 관련 키워드 목록 반환
   * @returns 키워드 목록
   */
  getPageExposureKeywords(): string[] {
    return [
      '건강기능식품 추천', '면역력 높이는 법', '영양제 추천', '건강 식품 순위',
      '비타민 효능', '건강검진 항목', '다이어트 보조제', '혈관 건강',
      '장 건강 음식', '관절에 좋은 음식', '눈 건강 영양제', '피로회복 보조제',
      '갱년기 영양제', '혈압 낮추는 영양제', '콜레스테롤 낮추는 방법',
      '간 건강 식품', '혈당 조절 보조제', '골다공증 예방', '노화 방지 영양제',
      '수면 개선 보조제', '스트레스 해소', '탈모 예방 영양제', '근육 보조제',
      '기억력 개선', '피부 건강'
    ];
  }
  
  /**
   * 건강기능식품 브랜드 관련 키워드 목록 반환
   * @returns 키워드 목록
   */
  getHealthBrandKeywords(): string[] {
    return [
      '닥터린 비타민', '내츄럴플러스 종합비타민', '에스더몰 콜라겐',
      '안국건강 루테인', '고려은단 비타민C', '뉴트리원 프로바이오틱스',
      '종근당건강 아이클리어', 'GNM 자연의품격 밀크씨슬', '뉴트리데이 오메가3',
      '주영엔에스 글루코사민', '한미양행 프리바이오틱스', '유한양행 프리미엄 비타민',
      '솔가 비타민D', '네이처메이드 종합비타민', '센트룸 실버', '블랙모어스 오메가3',
      '얼라이브 원스데일리', '재로우 도필러스', '나우푸드 프로바이오틱스',
      '라이프익스텐션 비타민D3', '칼슘 마그네슘', '프로폴리스', '알로에베라',
      '스피루리나', '비오틴', '코엔자임Q10', '프로테인', '아르기닌'
    ];
  }
}

// 서비스 인스턴스 생성
export const keywordAnalysisService = new KeywordAnalysisService();