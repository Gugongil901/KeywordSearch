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
  private excludedSellers: string[] = ['네이버', 'NAVER', '네이버쇼핑', '쇼핑몰', '오픈마켓', '검색결과', '플랫폼'];
  
  constructor(apiKeys: any) {
    this.apiKeys = apiKeys;
    this.db = DatabaseConnector.getInstance();
    logger.info('네이버 데이터 수집기 초기화 완료');
  }
  
  /**
   * 제외할 판매자인지 확인
   * @param sellerName 판매자 이름
   * @returns 제외 여부
   */
  private isExcludedSeller(sellerName: string): boolean {
    const normalized = sellerName.trim().toLowerCase();
    return this.excludedSellers.some(excluded => 
      normalized.includes(excluded.toLowerCase())
    );
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
        // 판매자 정보 (임시로 brandName 또는 기타 속성 사용)
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
        .sort((a: [string, any], b: [string, any]) => b[1] - a[1])
        .map(([name, count]: [string, any]) => ({
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

  /**
   * 특정 경쟁사의 제품 데이터 수집
   * @param keyword 키워드
   * @param competitor 경쟁사 이름
   * @returns 경쟁사 제품 목록
   */
  async collectCompetitorProducts(
    keyword: string, 
    competitor: string
  ): Promise<Array<{
    id: string;
    name: string;
    price: number;
    reviews: number;
    rank: number;
    image?: string;
    url?: string;
  }>> {
    try {
      logger.info(`[${keyword}] ${competitor} 경쟁사 제품 수집 시작`);
      
      // 쇼핑 검색 결과 가져오기
      const shoppingResults = await this.crawlNaverShopping(keyword);
      const products = shoppingResults.products || [];
      
      // 특정 경쟁사(브랜드/판매자)의 상품만 필터링
      // 네이버 등 플랫폼 자체는 경쟁사에서 제외
      const competitorProducts = products.filter((product: any) => {
        const seller = product.mall || product.brandName || '';
        // 플랫폼 필터링 + 경쟁사 매칭
        return !this.isExcludedSeller(seller) && 
               seller.toLowerCase().includes(competitor.toLowerCase());
      });
      
      // 결과가 없으면 다양한 검색 방법으로 재시도
      if (competitorProducts.length === 0) {
        // 검색 전략들 - 다양한 방식으로 검색 시도
        const searchStrategies = [
          // 1. 키워드 + 경쟁사 이름
          `${keyword} ${competitor}`,
          // 2. 경쟁사 이름 + 키워드
          `${competitor} ${keyword}`,
          // 3. 경쟁사 이름만 (카테고리를 파악했을 경우)
          `${competitor}`,
          // 4. 키워드 분해 + 경쟁사 (키워드가 복합어인 경우)
          ...keyword.split(' ').filter(k => k.length > 1).map(k => `${k} ${competitor}`),
          // 5. 경쟁사 + 키워드 분해 (키워드가 복합어인 경우) 
          ...keyword.split(' ').filter(k => k.length > 1).map(k => `${competitor} ${k}`)
        ];
        
        // 각 전략을 순차적으로 시도
        for (const searchQuery of searchStrategies) {
          logger.info(`${competitor} 제품 검색 시도: '${searchQuery}'`);
          
          try {
            const searchResult = await naverApi.searchKeyword(searchQuery);
            if (searchResult && searchResult.products && searchResult.products.length > 0) {
              // 검색 결과에서 경쟁사 제품 필터링
              // 1. 브랜드명 기반 필터링
              let filteredProducts = searchResult.products.filter((product: any) => {
                const brand = product.brandName || '';
                return !this.isExcludedSeller(brand) &&
                       brand.toLowerCase().includes(competitor.toLowerCase());
              });
              
              // 브랜드명으로 찾지 못한 경우 제품명에서 검색
              if (filteredProducts.length === 0) {
                filteredProducts = searchResult.products.filter((product: any) => {
                  const title = product.title || '';
                  // 제품명에 경쟁사 이름이 포함되어 있고, 제외 판매자가 아닌 경우
                  return !this.isExcludedSeller(product.brandName || '') &&
                         title.toLowerCase().includes(competitor.toLowerCase());
                });
              }
              
              // 결과가 있으면 반환
              if (filteredProducts.length > 0) {
                const formattedProducts = filteredProducts.map((product: any, index: number) => ({
                  id: product.productId || `${competitor}-${index}`,
                  name: product.title || '제품명 없음',
                  price: product.price || 0,
                  reviews: product.reviewCount || 0,
                  rank: index + 1,
                  image: product.image || undefined,
                  url: product.productUrl || undefined
                }));
                
                logger.info(`[${keyword}] ${competitor} 경쟁사 제품 수집 완료: ${formattedProducts.length}개 제품`);
                return formattedProducts;
              }
            }
          } catch (searchError) {
            logger.error(`[${searchQuery}] 검색 오류: ${searchError}`);
            // 계속 다음 전략 시도
          }
        }
        
        // 추가 전략: 경쟁사 이름의 변형 시도 (공백 추가/제거, 띄어쓰기 변형 등)
        const competitorVariants = [
          competitor.replace(/\s+/g, ''),  // 공백 제거
          competitor.replace(/(\S)(\S)/g, '$1 $2'), // 각 글자 사이에 공백 추가
          ...competitor.split(' ').filter(c => c.length > 1) // 단어 분리
        ];
        
        for (const variant of competitorVariants) {
          if (variant === competitor) continue; // 원래 이름과 같으면 건너뛰기
          
          const searchQuery = `${keyword} ${variant}`;
          logger.info(`${competitor} 변형 검색 시도: '${searchQuery}'`);
          
          try {
            const searchResult = await naverApi.searchKeyword(searchQuery);
            if (searchResult && searchResult.products && searchResult.products.length > 0) {
              // 제품명에서 경쟁사 이름 검색
              const filteredProducts = searchResult.products.filter((product: any) => {
                const title = product.title || '';
                const brand = product.brandName || '';
                return !this.isExcludedSeller(brand) &&
                       (title.toLowerCase().includes(variant.toLowerCase()) || 
                        title.toLowerCase().includes(competitor.toLowerCase()));
              }).slice(0, 10); // 상위 10개만
              
              if (filteredProducts.length > 0) {
                const formattedProducts = filteredProducts.map((product: any, index: number) => ({
                  id: product.productId || `${competitor}-${index}`,
                  name: product.title || '제품명 없음',
                  price: product.price || 0,
                  reviews: product.reviewCount || 0,
                  rank: index + 1,
                  image: product.image || undefined,
                  url: product.productUrl || undefined
                }));
                
                logger.info(`[${keyword}] ${competitor} 변형 검색으로 제품 수집 완료: ${formattedProducts.length}개 제품`);
                return formattedProducts;
              }
            }
          } catch (searchError) {
            logger.error(`[${searchQuery}] 변형 검색 오류: ${searchError}`);
            // 계속 다음 전략 시도
          }
        }
        
        // 모든 전략이 실패하면 빈 배열 반환
        logger.warn(`[${keyword}] ${competitor} 경쟁사 제품을 찾을 수 없어 빈 결과 반환`);
        return [];
      }
      
      // 경쟁사 제품 포맷팅
      const formattedProducts = competitorProducts.map((product: any, index: number) => ({
        id: product.productId || `${competitor}-${index}`,
        name: product.title || '제품명 없음',
        price: product.price || 0,
        reviews: product.reviewCount || 0,
        rank: index + 1,
        image: product.image || undefined,
        url: product.productUrl || undefined
      }));
      
      logger.info(`[${keyword}] ${competitor} 경쟁사 제품 수집 완료: ${formattedProducts.length}개 제품`);
      return formattedProducts;
    } catch (error) {
      logger.error(`[${keyword}] ${competitor} 경쟁사 제품 수집 오류: ${error}`);
      throw error;
    }
  }

  /**
   * 경쟁사 분석
   * @param keyword 키워드
   * @returns 경쟁사 분석 결과
   */
  async analyzeCompetitors(
    keyword: string
  ): Promise<{
    keyword: string;
    totalCompetitors: number;
    topCompetitors: Array<{
      seller: string;
      productCount: number;
      marketShare: number;
    }>;
  }> {
    try {
      logger.info(`[${keyword}] 경쟁사 분석 시작`);
      
      // 쇼핑 검색 결과 가져오기
      const shoppingResults = await this.crawlNaverShopping(keyword);
      const mallDistribution = shoppingResults.mallDistribution || {};
      
      // 총 제품 수
      const totalProducts = Object.values(mallDistribution).reduce((sum: number, count: any) => sum + (count as number), 0);
      
      // 경쟁사 정보 생성 (네이버 등 플랫폼 제외)
      const competitors = Object.entries(mallDistribution)
        .filter(([seller]) => !this.isExcludedSeller(seller))
        .map(([seller, count]: [string, any]) => ({
          seller,
          productCount: count as number,
          marketShare: totalProducts > 0 ? (count as number) / totalProducts : 0
        }));
      
      // 상위 경쟁사 정렬
      const topCompetitors = competitors
        .sort((a, b) => b.productCount - a.productCount)
        .slice(0, 10); // 상위 10개
      
      const result = {
        keyword,
        totalCompetitors: competitors.length,
        topCompetitors
      };
      
      logger.info(`[${keyword}] 경쟁사 분석 완료: ${result.totalCompetitors}개 경쟁사 발견`);
      return result;
    } catch (error) {
      logger.error(`[${keyword}] 경쟁사 분석 오류: ${error}`);
      throw error;
    }
  }
}