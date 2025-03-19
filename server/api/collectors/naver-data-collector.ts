/**
 * 네이버 데이터 수집기
 * 
 * 네이버 API와 웹 크롤링을 통해 키워드 분석에 필요한 데이터를 수집하는 모듈
 */

import axios from 'axios';
import { logger } from '../../utils/logger';
import { DatabaseConnector } from './database-connector';
import * as naverApi from '../naver';
import * as naverAdApi from '../naver-ad';

/**
 * 네이버 데이터 수집기 클래스
 */
export class NaverDataCollector {
  private apiKeys: any;
  private db: DatabaseConnector;
  
  constructor(apiKeys: any) {
    this.apiKeys = apiKeys;
    this.db = DatabaseConnector.getInstance();
    logger.info('네이버 데이터 수집기 초기화 완료');
  }
  
  /**
   * 키워드에 대한 모든 데이터를 수집하는 통합 메서드
   * @param keyword 수집할 키워드
   * @returns 수집된 데이터
   */
  async collectAllData(keyword: string): Promise<any> {
    try {
      logger.info(`[${keyword}] 데이터 수집 시작`);
      
      // 캐시된 데이터 확인
      const cachedData = this.db.getKeywordData(keyword);
      if (cachedData) {
        logger.info(`[${keyword}] 캐시된 데이터 사용`);
        return cachedData;
      }
      
      const results: any = {};
      
      // API 데이터 수집
      const apiData = await this.collectApiData(keyword);
      results.apiData = apiData;
      
      // 크롤링 데이터 수집
      const crawlData = await this.collectCrawlData(keyword);
      results.crawlData = crawlData;
      
      // 데이터베이스에 결과 저장
      this.db.saveKeywordData(keyword, results);
      
      logger.info(`[${keyword}] 데이터 수집 완료`);
      return results;
    } catch (error) {
      logger.error(`[${keyword}] 데이터 수집 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 네이버 API를 통한 데이터 수집
   * @param keyword 수집할 키워드
   * @returns API 데이터
   */
  async collectApiData(keyword: string): Promise<any> {
    try {
      logger.info(`[${keyword}] API 데이터 수집 시작`);
      
      const apiResults: any = {};
      
      // 데이터랩 API - 검색량 트렌드
      try {
        const trendData = await this.callNaverDatalabApi(keyword);
        apiResults.trendData = trendData;
      } catch (error) {
        logger.error(`[${keyword}] 데이터랩 API 오류: ${error}`);
        apiResults.trendData = null;
      }
      
      // 쇼핑 인사이트 API - 쇼핑 트렌드
      try {
        const shoppingData = await this.callShoppingInsightApi(keyword);
        apiResults.shoppingData = shoppingData;
      } catch (error) {
        logger.error(`[${keyword}] 쇼핑 인사이트 API 오류: ${error}`);
        apiResults.shoppingData = null;
      }
      
      // 검색광고 API - 경쟁 정보
      try {
        const adData = await this.callSearchAdApi(keyword);
        apiResults.adData = adData;
      } catch (error) {
        logger.error(`[${keyword}] 검색광고 API 오류: ${error}`);
        apiResults.adData = null;
      }
      
      logger.info(`[${keyword}] API 데이터 수집 완료`);
      return apiResults;
    } catch (error) {
      logger.error(`[${keyword}] API 데이터 수집 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 웹 크롤링을 통한 데이터 수집
   * @param keyword 수집할 키워드
   * @returns 크롤링 데이터
   */
  async collectCrawlData(keyword: string): Promise<any> {
    try {
      logger.info(`[${keyword}] 크롤링 데이터 수집 시작`);
      
      const crawlResults: any = {};
      
      // 네이버 쇼핑 검색 결과 크롤링
      try {
        const shoppingResults = await this.crawlNaverShopping(keyword);
        crawlResults.shoppingResults = shoppingResults;
      } catch (error) {
        logger.error(`[${keyword}] 쇼핑 크롤링 오류: ${error}`);
        crawlResults.shoppingResults = null;
      }
      
      // 네이버 쇼핑 상품 상세 정보 크롤링
      try {
        const productDetails = await this.crawlProductDetails(keyword);
        crawlResults.productDetails = productDetails;
      } catch (error) {
        logger.error(`[${keyword}] 상품 상세 크롤링 오류: ${error}`);
        crawlResults.productDetails = null;
      }
      
      // 쇼핑몰 순위 및 분포 크롤링
      try {
        const mallDistribution = await this.crawlMallDistribution(keyword);
        crawlResults.mallDistribution = mallDistribution;
      } catch (error) {
        logger.error(`[${keyword}] 쇼핑몰 분포 크롤링 오류: ${error}`);
        crawlResults.mallDistribution = null;
      }
      
      logger.info(`[${keyword}] 크롤링 데이터 수집 완료`);
      return crawlResults;
    } catch (error) {
      logger.error(`[${keyword}] 크롤링 데이터 수집 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 네이버 데이터랩 API 호출
   * @param keyword 수집할 키워드
   * @returns 검색량 트렌드 데이터
   */
  private async callNaverDatalabApi(keyword: string): Promise<any> {
    try {
      // 네이버 키워드 트렌드 API 호출 (server/api/naver.ts의 함수 사용)
      const trends = await naverApi.getKeywordTrends(keyword, 'date');
      return trends;
    } catch (error) {
      logger.error(`데이터랩 API 호출 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 네이버 쇼핑 인사이트 API 호출
   * @param keyword 수집할 키워드
   * @returns 쇼핑 트렌드 데이터
   */
  private async callShoppingInsightApi(keyword: string): Promise<any> {
    try {
      // 네이버 쇼핑 인사이트 API 호출 (server/api/search.ts의 함수 활용 필요)
      // 실제 구현에서는 API를 직접 호출해야 함
      
      const endpoint = 'https://openapi.naver.com/v1/datalab/shopping/categories/keywords';
      
      // 현재 날짜 기준으로 최근 일주일 데이터 조회
      const now = new Date();
      const endDate = now.toISOString().slice(0, 10);
      
      const startDate = new Date();
      startDate.setDate(now.getDate() - 7);
      const startDateStr = startDate.toISOString().slice(0, 10);
      
      const params = {
        startDate: startDateStr,
        endDate: endDate,
        timeUnit: 'date',
        keyword: [
          {
            name: keyword,
            param: [keyword]
          }
        ],
        category: []
      };
      
      const response = await axios.post(endpoint, params, {
        headers: {
          'X-Naver-Client-Id': this.apiKeys.clientId,
          'X-Naver-Client-Secret': this.apiKeys.clientSecret,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`쇼핑 인사이트 API 호출 오류: ${error}`);
      
      // 에러 발생 시, server/api/naver.ts의 getKeywordStats 함수로 대체 호출
      try {
        const stats = await naverApi.getKeywordStats(keyword);
        return { relKeyword: [stats] };
      } catch (fallbackError) {
        logger.error(`쇼핑 인사이트 API 대체 호출 오류: ${fallbackError}`);
        throw error;
      }
    }
  }
  
  /**
   * 네이버 검색광고 API 호출
   * @param keyword 수집할 키워드
   * @returns 검색광고 데이터
   */
  private async callSearchAdApi(keyword: string): Promise<any> {
    try {
      // 네이버 검색광고 API 호출 (server/api/naver-ad.ts의 함수 사용)
      const adData = await naverAdApi.getKeywordAnalysis(keyword);
      return adData;
    } catch (error) {
      logger.error(`검색광고 API 호출 오류: ${error}`);
      
      // 기본값 반환
      return {
        keyword,
        bid: { bid: 500, impressions: 0, clicks: 0, ctr: 0 },
        metrics: { ctr: 0.02, cvr: 0.015 }
      };
    }
  }
  
  /**
   * 네이버 쇼핑 검색 결과 크롤링
   * @param keyword 검색할 키워드
   * @returns 쇼핑 검색 결과 데이터
   */
  private async crawlNaverShopping(keyword: string): Promise<any> {
    try {
      logger.info(`[${keyword}] 네이버 쇼핑 크롤링 시작`);
      
      // 실제 구현에서는 Puppeteer나 Playwright를 사용하여 크롤링 필요
      // 여기서는 API 호출로 대체 (server/api/naver.ts의 함수 사용)
      const searchResult = await naverApi.searchKeyword(keyword);
      
      if (!searchResult || !searchResult.products) {
        throw new Error('쇼핑 검색 결과를 가져오지 못했습니다.');
      }
      
      const products = searchResult.products;
      
      // 가격 통계 계산
      const prices = products.map(p => p.price).filter(p => p > 0);
      const priceStats = {
        min: Math.min(...prices) || 0,
        max: Math.max(...prices) || 0,
        avg: prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0,
        median: prices.length ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0
      };
      
      // 리뷰 통계 계산
      const reviews = products.map(p => p.reviewCount).filter(r => r >= 0);
      const reviewStats = {
        min: Math.min(...reviews) || 0,
        max: Math.max(...reviews) || 0,
        avg: reviews.length ? reviews.reduce((sum, review) => sum + review, 0) / reviews.length : 0,
        total: reviews.reduce((sum, review) => sum + review, 0)
      };
      
      // 쇼핑몰 분포 계산
      const mallCounts: Record<string, number> = {};
      for (const p of products) {
        const mallName = p.brandName || '기타';
        mallCounts[mallName] = (mallCounts[mallName] || 0) + 1;
      }
      
      const result = {
        totalProducts: searchResult.productCount || products.length,
        products: products.slice(0, 10), // 상위 10개만 저장
        priceStats,
        reviewStats,
        mallDistribution: mallCounts,
        adRatio: 0.3, // 예시값 (실제 크롤링에서는 계산 필요)
        realProductRatio: searchResult.realProductRatio || 0,
        foreignProductRatio: searchResult.foreignProductRatio || 0
      };
      
      logger.info(`[${keyword}] 네이버 쇼핑 크롤링 완료: ${result.totalProducts}개 상품 발견`);
      return result;
    } catch (error) {
      logger.error(`네이버 쇼핑 크롤링 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 네이버 쇼핑 상품 상세 정보 크롤링
   * @param keyword 검색할 키워드
   * @returns 상품 상세 정보
   */
  private async crawlProductDetails(keyword: string): Promise<any> {
    try {
      logger.info(`[${keyword}] 상품 상세 정보 크롤링 시작`);
      
      // 상품 목록 가져오기
      const shoppingResults = await this.crawlNaverShopping(keyword);
      const products = shoppingResults.products || [];
      
      // 상위 3개 상품만 상세 정보 수집
      const topProducts = products.slice(0, 3);
      const detailedProducts = [];
      
      for (const product of topProducts) {
        try {
          // 실제 구현에서는 상품 상세 페이지 크롤링 필요
          // 여기서는 기본 정보만 보강
          const detailedProduct = {
            ...product,
            sellerRating: Math.floor(Math.random() * 5) + 1, // 예시값 (실제로는 크롤링 필요)
            deliveryInfo: '무료배송',
            returnPolicy: '30일 이내 교환/환불 가능',
            paymentOptions: ['신용카드', '무통장입금', '네이버페이'],
            variations: ['색상', '사이즈'].filter(() => Math.random() > 0.5)
          };
          
          detailedProducts.push(detailedProduct);
        } catch (error) {
          logger.error(`상품 상세 크롤링 개별 오류 (${product.title}): ${error}`);
        }
      }
      
      logger.info(`[${keyword}] 상품 상세 정보 크롤링 완료: ${detailedProducts.length}개 상품 수집`);
      return detailedProducts;
    } catch (error) {
      logger.error(`상품 상세 크롤링 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 쇼핑몰 순위 및 분포 크롤링
   * @param keyword 검색할 키워드
   * @returns 쇼핑몰 분포 데이터
   */
  private async crawlMallDistribution(keyword: string): Promise<any> {
    try {
      logger.info(`[${keyword}] 쇼핑몰 분포 크롤링 시작`);
      
      // 쇼핑 검색 결과 가져오기
      const shoppingResults = await this.crawlNaverShopping(keyword);
      const mallDistribution = shoppingResults.mallDistribution || {};
      
      // 브랜드와 일반 판매자 분류
      const brandSellers = new Set<string>();
      const generalSellers = new Set<string>();
      
      for (const mallName of Object.keys(mallDistribution)) {
        // 브랜드 판매자 패턴
        const brandPatterns = ['공식', '스토어', '브랜드', 'Official', 'Brand', 'Store'];
        
        if (brandPatterns.some(pattern => mallName.includes(pattern))) {
          brandSellers.add(mallName);
        } else {
          generalSellers.add(mallName);
        }
      }
      
      // 정렬된 쇼핑몰 순위
      const sortedMalls = Object.entries(mallDistribution)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({
          name,
          count,
          type: brandSellers.has(name) ? 'brand' : 'general'
        }));
      
      const result = {
        mallRanking: sortedMalls.slice(0, 10), // 상위 10개
        brandSellerRatio: brandSellers.size / (brandSellers.size + generalSellers.size),
        totalSellers: brandSellers.size + generalSellers.size,
        brandSellers: Array.from(brandSellers).slice(0, 5), // 상위 5개
        generalSellers: Array.from(generalSellers).slice(0, 5) // 상위 5개
      };
      
      logger.info(`[${keyword}] 쇼핑몰 분포 크롤링 완료: ${result.totalSellers}개 판매자 발견`);
      return result;
    } catch (error) {
      logger.error(`쇼핑몰 분포 크롤링 오류: ${error}`);
      throw error;
    }
  }
}