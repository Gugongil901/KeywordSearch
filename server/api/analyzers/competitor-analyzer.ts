/**
 * 경쟁 판매자 분석 알고리즘
 * 
 * 키워드에 대한 경쟁 판매자들의 가격 전략, 제품 포지셔닝, 리뷰 등을 분석하는 모듈
 */

import { logger } from '../../utils/logger';
import { NaverDataCollector } from '../collectors/naver-data-collector';
import { DatabaseConnector } from '../collectors/database-connector';

// 판매자 분석 결과 인터페이스
interface CompetitorAnalysisResult {
  keyword: string;
  totalCompetitors: number;
  topCompetitors: CompetitorInfo[];
  marketConcentration: number;
}

// 판매자 정보 인터페이스
interface CompetitorInfo {
  seller: string;
  sellerInfo: SellerInfo;
  productCount: number;
  marketShare: number;
  priceStrategy: PriceStrategy;
  positioning: ProductPositioning;
  reviewAnalysis: ReviewAnalysis;
}

// 판매자 상세 정보 인터페이스
interface SellerInfo {
  name: string;
  type: 'brand' | 'individual' | 'large_mall' | 'unknown';
  estimatedSize: string;
}

// 가격 전략 인터페이스
interface PriceStrategy {
  strategy: 'fixed_price' | 'low_price_entry' | 'premium_segment' | 'moderate_range' | 'unknown';
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
}

// 제품 포지셔닝 인터페이스
interface ProductPositioning {
  positioning: 'premium_popular' | 'premium_niche' | 'value_popular' | 'value_niche' | 'unknown';
  avgReviews: number;
  avgPrice: number;
}

// 리뷰 분석 인터페이스
interface ReviewAnalysis {
  avgReviews: number;
  totalReviews: number;
  reviewDistribution?: Record<string, number>;
}

/**
 * 경쟁 판매자 분석기 클래스
 */
export class CompetitorAnalyzer {
  private dataCollector: NaverDataCollector;
  private db: DatabaseConnector;
  
  constructor(dataCollector: NaverDataCollector, dbConnector: DatabaseConnector) {
    this.dataCollector = dataCollector;
    this.db = dbConnector;
    logger.info('경쟁 판매자 분석기 초기화 완료');
  }
  
  /**
   * 키워드 관련 경쟁 판매자 분석
   * @param keyword 분석할 키워드
   * @returns 판매자 분석 결과
   */
  async analyzeCompetitors(keyword: string): Promise<CompetitorAnalysisResult> {
    try {
      logger.info(`[${keyword}] 경쟁 판매자 분석 시작`);
      
      // 데이터 수집
      const rawData = await this.dataCollector.collectAllData(keyword);
      const crawlData = rawData?.crawlData || {};
      
      // 검색 결과에서 판매자 정보 추출
      const shoppingResults = crawlData.shoppingResults || {};
      const products = shoppingResults.products || [];
      
      // 판매자별 상품 수 분석
      const sellerProducts: Record<string, any[]> = {};
      for (const product of products) {
        const mall = product.mall || '';
        if (mall) {
          if (!sellerProducts[mall]) {
            sellerProducts[mall] = [];
          }
          sellerProducts[mall].push(product);
        }
      }
      
      // 판매자별 분석 결과
      const competitorAnalysis: CompetitorInfo[] = [];
      
      for (const [seller, sellerProducts] of Object.entries(sellerProducts)) {
        // 판매자 상세 정보 수집
        const sellerInfo = await this.getSellerInfo(seller);
        
        // 가격 전략 분석
        const priceStrategy = this.analyzePriceStrategy(sellerProducts);
        
        // 제품 포지셔닝 분석
        const positioning = this.analyzeProductPositioning(sellerProducts);
        
        // 리뷰 분석
        const reviewAnalysis = this.analyzeReviews(sellerProducts);
        
        competitorAnalysis.push({
          seller,
          sellerInfo,
          productCount: sellerProducts.length,
          marketShare: 0, // 임시값, 아래에서 다시 계산
          priceStrategy,
          positioning,
          reviewAnalysis
        });
      }
      
      // 경쟁사 순위 (상품 수 기준)
      competitorAnalysis.sort((a, b) => b.productCount - a.productCount);
      
      // 시장 점유율 계산
      const totalProducts = Object.values(sellerProducts).reduce((sum, products) => sum + products.length, 0);
      for (const competitor of competitorAnalysis) {
        competitor.marketShare = Math.round((competitor.productCount / totalProducts) * 10000) / 100; // 소수점 둘째 자리까지
      }
      
      const result: CompetitorAnalysisResult = {
        keyword,
        totalCompetitors: competitorAnalysis.length,
        topCompetitors: competitorAnalysis.slice(0, 10), // 상위 10개만 반환
        marketConcentration: this.calculateMarketConcentration(competitorAnalysis)
      };
      
      // 결과 저장
      this.db.saveKeywordData(`competitor_analysis_${keyword}`, result);
      
      logger.info(`[${keyword}] 경쟁 판매자 분석 완료: ${result.totalCompetitors}개 경쟁사 발견`);
      
      return result;
    } catch (error) {
      logger.error(`[${keyword}] 경쟁 판매자 분석 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 판매자 상세 정보 수집
   * @param sellerName 판매자 이름
   * @returns 판매자 정보
   */
  private async getSellerInfo(sellerName: string): Promise<SellerInfo> {
    try {
      // 데이터베이스에서 판매자 정보 조회
      const sellerInfo = this.db.getKeywordData(`seller_info_${sellerName}`);
      
      if (sellerInfo) {
        return sellerInfo as SellerInfo;
      }
      
      // 정보가 없으면 크롤링으로 수집
      const newSellerInfo = await this.crawlSellerInfo(sellerName);
      
      // 수집한 정보 저장
      this.db.saveKeywordData(`seller_info_${sellerName}`, newSellerInfo);
      
      return newSellerInfo;
    } catch (error) {
      logger.error(`판매자 정보 수집 오류 (${sellerName}): ${error}`);
      
      // 오류 시 기본 정보 반환
      return {
        name: sellerName,
        type: 'unknown',
        estimatedSize: 'unknown'
      };
    }
  }
  
  /**
   * 판매자 정보 크롤링
   * @param sellerName 판매자 이름
   * @returns 판매자 정보
   */
  private async crawlSellerInfo(sellerName: string): Promise<SellerInfo> {
    try {
      // 네이버 스토어팜 또는 스마트스토어 페이지 크롤링 로직
      // 실제 구현에서는 웹 크롤링 로직 추가 필요
      
      // 초기 기본 정보
      return {
        name: sellerName,
        type: this.estimateSellerType(sellerName),
        estimatedSize: 'unknown'
      };
    } catch (error) {
      logger.error(`판매자 정보 크롤링 오류 (${sellerName}): ${error}`);
      
      // 오류 시 기본 정보 반환
      return {
        name: sellerName,
        type: 'unknown',
        estimatedSize: 'unknown'
      };
    }
  }
  
  /**
   * 판매자 유형 추정 (브랜드/일반 판매자/대형몰)
   * @param sellerName 판매자 이름
   * @returns 판매자 유형
   */
  private estimateSellerType(sellerName: string): 'brand' | 'individual' | 'large_mall' | 'unknown' {
    // 알려진 대형 쇼핑몰 리스트
    const largeMalls = ['11번가', 'G마켓', '옥션', '인터파크', '롯데온', 'SSG닷컴', '쿠팡'];
    
    if (largeMalls.includes(sellerName)) {
      return 'large_mall';
    }
    
    // 알려진 브랜드 리스트 (DB에서 관리)
    // 간단한 문자열 패턴 매칭으로 구현
    if (
      sellerName.endsWith('공식스토어') || 
      sellerName.endsWith('공식몰') || 
      sellerName.includes('브랜드') || 
      sellerName.includes('Official')
    ) {
      return 'brand';
    }
    
    return 'individual';
  }
  
  /**
   * 판매자의 가격 전략 분석
   * @param products 판매자 상품 목록
   * @returns 가격 전략 분석 결과
   */
  private analyzePriceStrategy(products: any[]): PriceStrategy {
    if (!products || products.length === 0) {
      return {
        strategy: 'unknown',
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        priceRange: 0
      };
    }
    
    // 상품 가격 추출
    const prices = products.map(p => p.price || 0).filter(p => p > 0);
    
    if (prices.length === 0) {
      return {
        strategy: 'unknown',
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        priceRange: 0
      };
    }
    
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // 가격 분포 계산
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // 가격 전략 분석
    let strategy: 'fixed_price' | 'low_price_entry' | 'premium_segment' | 'moderate_range' | 'unknown';
    
    if (priceRange / avgPrice < 0.1) {
      // 가격 변동이 10% 미만
      strategy = 'fixed_price';
    } else if (minPrice < 0.8 * avgPrice) {
      // 최저가가 평균의 80% 미만
      strategy = 'low_price_entry';
    } else if (maxPrice > 1.5 * avgPrice) {
      // 최고가가 평균의 150% 초과
      strategy = 'premium_segment';
    } else {
      strategy = 'moderate_range';
    }
    
    return {
      strategy,
      avgPrice: Math.round(avgPrice * 100) / 100,
      minPrice,
      maxPrice,
      priceRange
    };
  }
  
  /**
   * 판매자의 제품 포지셔닝 분석
   * @param products 판매자 상품 목록
   * @returns 제품 포지셔닝 분석 결과
   */
  private analyzeProductPositioning(products: any[]): ProductPositioning {
    if (!products || products.length === 0) {
      return {
        positioning: 'unknown',
        avgReviews: 0,
        avgPrice: 0
      };
    }
    
    // 리뷰 수 기반 인기도 분석
    const reviews = products.map(p => p.reviews || 0);
    const avgReviews = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r, 0) / reviews.length : 0;
    
    // 가격 수준 분석
    const prices = products.map(p => p.price || 0).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
    
    // 카테고리 평균 가격과 리뷰 수 조회 (DB에서 관리)
    const categoryAvgPrice = this.getCategoryAvgPrice();
    const categoryAvgReviews = this.getCategoryAvgReviews();
    
    // 포지셔닝 결정
    let positioning: 'premium_popular' | 'premium_niche' | 'value_popular' | 'value_niche' | 'unknown';
    
    if (avgPrice > 1.3 * categoryAvgPrice) {
      // 카테고리 평균가 대비 30% 이상
      if (avgReviews > 1.5 * categoryAvgReviews) {
        // 카테고리 평균 리뷰 대비 50% 이상
        positioning = 'premium_popular';
      } else {
        positioning = 'premium_niche';
      }
    } else {
      if (avgReviews > 1.5 * categoryAvgReviews) {
        positioning = 'value_popular';
      } else {
        positioning = 'value_niche';
      }
    }
    
    return {
      positioning,
      avgReviews: Math.round(avgReviews * 100) / 100,
      avgPrice: Math.round(avgPrice * 100) / 100
    };
  }
  
  /**
   * 카테고리 평균 가격 조회
   * @returns 평균 가격
   */
  private getCategoryAvgPrice(): number {
    // 실제 구현에서는 DB에서 카테고리별 평균 가격 조회
    // 간단한 구현을 위해 기본값 반환
    return 50000;
  }
  
  /**
   * 카테고리 평균 리뷰 수 조회
   * @returns 평균 리뷰 수
   */
  private getCategoryAvgReviews(): number {
    // 실제 구현에서는 DB에서 카테고리별 평균 리뷰 수 조회
    // 간단한 구현을 위해 기본값 반환
    return 100;
  }
  
  /**
   * 상품 리뷰 분석
   * @param products 판매자 상품 목록
   * @returns 리뷰 분석 결과
   */
  private analyzeReviews(products: any[]): ReviewAnalysis {
    if (!products || products.length === 0) {
      return {
        avgReviews: 0,
        totalReviews: 0
      };
    }
    
    // 리뷰 수집
    const reviews = products.map(p => p.reviews || 0);
    
    if (reviews.length === 0) {
      return {
        avgReviews: 0,
        totalReviews: 0
      };
    }
    
    const totalReviews = reviews.reduce((sum, r) => sum + r, 0);
    const avgReviews = totalReviews / reviews.length;
    
    return {
      avgReviews: Math.round(avgReviews * 100) / 100,
      totalReviews,
      reviewDistribution: this.calculateReviewDistribution(reviews)
    };
  }
  
  /**
   * 리뷰 분포 계산
   * @param reviews 리뷰 수 목록
   * @returns 리뷰 분포
   */
  private calculateReviewDistribution(reviews: number[]): Record<string, number> {
    if (!reviews || reviews.length === 0) {
      return {};
    }
    
    // 구간별 리뷰 수 분포
    const distributions: Record<string, number> = {
      '0': 0,
      '1-10': 0,
      '11-50': 0,
      '51-100': 0,
      '101-500': 0,
      '501+': 0
    };
    
    for (const reviewCount of reviews) {
      if (reviewCount === 0) {
        distributions['0']++;
      } else if (reviewCount <= 10) {
        distributions['1-10']++;
      } else if (reviewCount <= 50) {
        distributions['11-50']++;
      } else if (reviewCount <= 100) {
        distributions['51-100']++;
      } else if (reviewCount <= 500) {
        distributions['101-500']++;
      } else {
        distributions['501+']++;
      }
    }
    
    // 백분율로 변환
    const total = reviews.length;
    for (const key in distributions) {
      distributions[key] = Math.round((distributions[key] / total) * 10000) / 100; // 소수점 둘째 자리까지
    }
    
    return distributions;
  }
  
  /**
   * 시장 집중도 계산 (허핀달-허시만 지수)
   * @param competitors 경쟁사 목록
   * @returns 시장 집중도
   */
  private calculateMarketConcentration(competitors: CompetitorInfo[]): number {
    if (!competitors || competitors.length === 0) {
      return 0;
    }
    
    // 시장 점유율의 제곱합
    const hhi = competitors.reduce((sum, competitor) => {
      const marketShareDecimal = competitor.marketShare / 100; // 소수점으로 변환
      return sum + (marketShareDecimal * marketShareDecimal);
    }, 0) * 10000; // HHI 표준 스케일로 변환
    
    return Math.round(hhi * 100) / 100; // 소수점 둘째 자리까지
  }
}