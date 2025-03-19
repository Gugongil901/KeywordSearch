/**
 * 프론트엔드 통합 시스템
 * 
 * 백엔드 분석 결과를 프론트엔드에서 사용할 수 있도록 데이터를 준비하는 모듈
 */

import { logger } from '../../utils/logger';
import { DatabaseConnector } from '../collectors/database-connector';
import { KeywordMetricsCalculator } from '../analyzers/keyword-metrics-calculator';
import { KeywordVisualizationSystem } from '../visualization/keyword-visualization-system';
import * as naverApi from '../naver';

/**
 * 프론트엔드 통합 시스템 클래스
 */
export class FrontendIntegrationSystem {
  private db: DatabaseConnector;
  private metricsCalculator: KeywordMetricsCalculator;
  private visualizationSystem: KeywordVisualizationSystem;
  
  constructor(
    dbConnector: DatabaseConnector,
    metricsCalculator: KeywordMetricsCalculator, 
    visualizationSystem: KeywordVisualizationSystem
  ) {
    this.db = dbConnector;
    this.metricsCalculator = metricsCalculator;
    this.visualizationSystem = visualizationSystem;
    logger.info('프론트엔드 통합 시스템 초기화 완료');
  }
  
  /**
   * 키워드에 대한 대시보드 데이터 생성
   * @param keyword 키워드
   * @returns 대시보드 데이터
   */
  async generateDashboardData(keyword: string): Promise<any> {
    try {
      logger.info(`[${keyword}] 대시보드 데이터 생성 시작`);
      
      // 키워드 지표 계산 또는 조회
      let metrics = this.db.getKeywordData(`metrics_${keyword}`);
      if (!metrics) {
        metrics = await this.metricsCalculator.calculateAllMetrics(keyword);
      }
      
      // 대시보드 섹션별 데이터 생성
      const dashboardData = {
        keyword,
        summary: await this.generateSummarySection(keyword, metrics),
        competition: await this.generateCompetitionSection(keyword, metrics),
        growth: await this.generateGrowthSection(keyword, metrics),
        profit: await this.generateProfitSection(keyword, metrics),
        demographic: await this.generateDemographicSection(keyword, metrics),
        relatedKeywords: await this.generateRelatedKeywordsSection(keyword),
        topProducts: await this.generateTopProductsSection(keyword)
      };
      
      logger.info(`[${keyword}] 대시보드 데이터 생성 완료`);
      return dashboardData;
    } catch (error) {
      logger.error(`[${keyword}] 대시보드 데이터 생성 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 요약 섹션 데이터 생성
   * @param keyword 키워드
   * @param metrics 분석 지표
   * @returns 요약 데이터
   */
  private async generateSummarySection(keyword: string, metrics: any): Promise<any> {
    const overall = metrics?.overallScore || {};
    const basic = metrics?.basic || {};
    
    // 검색량 트렌드 차트 데이터 준비
    const historicalData = this.getHistoricalData(keyword, 12);
    const chart = this.prepareTrendChartData(historicalData);
    
    return {
      overallScore: overall.score || 0,
      grade: overall.grade || 'C',
      searchVolume: {
        total: basic.searchVolume?.total || 0,
        pc: basic.searchVolume?.pc || 0,
        mobile: basic.searchVolume?.mobile || 0
      },
      productCount: basic.productCount || 0,
      avgPrice: basic.priceStats?.avg || 0,
      chart
    };
  }
  
  /**
   * 경쟁 섹션 데이터 생성
   * @param keyword 키워드
   * @param metrics 분석 지표
   * @returns 경쟁 데이터
   */
  private async generateCompetitionSection(keyword: string, metrics: any): Promise<any> {
    const competition = metrics?.competition || {};
    
    // 상위 10개 경쟁사 정보
    const competitors = await this.getKeywordCompetitors(keyword, 10);
    
    return {
      score: competition.competitionScore || 50,
      level: competition.difficultyLevel || 'medium',
      adRatio: competition.adRatio || 0,
      brandRatio: competition.brandRatio || 0,
      bidPrice: competition.bidPrice || 0,
      marketConcentration: competition.marketConcentration || 0,
      competitors
    };
  }
  
  /**
   * 성장성 섹션 데이터 생성
   * @param keyword 키워드
   * @param metrics 분석 지표
   * @returns 성장성 데이터
   */
  private async generateGrowthSection(keyword: string, metrics: any): Promise<any> {
    const growth = metrics?.growth || {};
    
    return {
      score: growth.growthScore || 50,
      trend: growth.trendDirection || 'stable',
      growthRates: growth.growthRates || {},
      forecast: growth.forecast || [],
      relativeGrowth: growth.relativeGrowth || 0,
      seasonality: metrics?.seasonality || {}
    };
  }
  
  /**
   * 수익성 섹션 데이터 생성
   * @param keyword 키워드
   * @param metrics 분석 지표
   * @returns 수익성 데이터
   */
  private async generateProfitSection(keyword: string, metrics: any): Promise<any> {
    const profit = metrics?.profit || {};
    
    return {
      score: profit.profitScore || 50,
      level: profit.profitabilityLevel || 'medium',
      estimatedMargin: profit.estimatedMargin || 0,
      marginRate: profit.marginRate || 0,
      marginToCpcRatio: profit.marginToCpcRatio || 0,
      avgPrice: profit.avgPrice || 0,
      priceDistribution: await this.getPriceDistribution(keyword)
    };
  }
  
  /**
   * 인구통계 섹션 데이터 생성
   * @param keyword 키워드
   * @param metrics 분석 지표
   * @returns 인구통계 데이터
   */
  private async generateDemographicSection(keyword: string, metrics: any): Promise<any> {
    // 네이버 검색 API 또는 GA 데이터가 필요함
    // 통계 데이터 조회
    let demographicData = this.db.getKeywordData(`demographic_${keyword}`);
    
    if (!demographicData) {
      // 데이터가 없는 경우 API 호출 또는 계산 필요
      // 여기서는 네이버 API 데이터가 없어 기본 데이터로 대체
      const searchVolume = metrics?.basic?.searchVolume || {};
      const mobileRatio = searchVolume.total ? searchVolume.mobile / searchVolume.total : 0.65;
      
      demographicData = {
        gender: { male: 50, female: 50 },
        age: {
          '10s': 10,
          '20s': 30,
          '30s': 25,
          '40s': 20,
          '50s': 10,
          '60+': 5
        },
        device: {
          pc: Math.round((1 - mobileRatio) * 100),
          mobile: Math.round(mobileRatio * 100)
        }
      };
      
      // 데이터 저장
      this.db.saveKeywordData(`demographic_${keyword}`, demographicData);
    }
    
    return demographicData;
  }
  
  /**
   * 연관 키워드 섹션 데이터 생성
   * @param keyword 키워드
   * @returns 연관 키워드 데이터
   */
  private async generateRelatedKeywordsSection(keyword: string): Promise<any> {
    // 연관 키워드 조회
    let relatedKeywords = this.db.getRelatedKeywords(keyword, 10);
    
    // 없으면 API 호출 또는 크롤링으로 수집
    if (!relatedKeywords || relatedKeywords.length === 0) {
      relatedKeywords = await this.fetchRelatedKeywords(keyword);
    }
    
    return relatedKeywords;
  }
  
  /**
   * 상위 제품 섹션 데이터 생성
   * @param keyword 키워드
   * @returns 상위 제품 데이터
   */
  private async generateTopProductsSection(keyword: string): Promise<any> {
    // 상위 제품 조회
    let topProducts = this.db.getKeywordData(`top_products_${keyword}`);
    
    // 없으면 API 호출 또는 크롤링으로 수집
    if (!topProducts || !Array.isArray(topProducts) || topProducts.length === 0) {
      topProducts = await this.fetchTopProducts(keyword);
      
      // 데이터 저장
      this.db.saveKeywordData(`top_products_${keyword}`, topProducts);
    }
    
    return topProducts;
  }
  
  /**
   * 과거 데이터 조회
   * @param keyword 키워드
   * @param months 조회할 개월 수
   * @returns 과거 데이터
   */
  private getHistoricalData(keyword: string, months: number): any[] {
    // 비교적 안전하게 visualizationSystem의 메서드에 접근
    // 실제로는 visualizationSystem에 public 메서드로 만드는 것이 더 좋음
    const getHistoricalDataFn = (this.visualizationSystem as any)['getHistoricalData'];
    if (typeof getHistoricalDataFn === 'function') {
      return getHistoricalDataFn.call(this.visualizationSystem, keyword, months) || [];
    }
    return [];
  }
  
  /**
   * 트렌드 차트 데이터 준비
   * @param historicalData 과거 데이터
   * @returns 차트 데이터
   */
  private prepareTrendChartData(historicalData: any[]): any {
    // 비교적 안전하게 visualizationSystem의 메서드에 접근
    const prepareTrendChartDataFn = (this.visualizationSystem as any)['prepareTrendChartData'];
    if (typeof prepareTrendChartDataFn === 'function') {
      return prepareTrendChartDataFn.call(this.visualizationSystem, historicalData);
    }
    
    // 메서드가 없는 경우 간단한 구현으로 대체
    if (!historicalData || historicalData.length === 0) {
      return {
        labels: Array.from({ length: 12 }, (_, i) => `Month ${i+1}`),
        data: Array(12).fill(0)
      };
    }
    
    const labels = historicalData.map(data => data.date || `Month ${historicalData.indexOf(data) + 1}`);
    const data = historicalData.map(data => data.value || 0);
    
    return { labels, data };
  }
  
  /**
   * 키워드 경쟁사 정보 조회
   * @param keyword 키워드
   * @param limit 조회할 개수
   * @returns 경쟁사 정보
   */
  private async getKeywordCompetitors(keyword: string, limit: number): Promise<any[]> {
    // 경쟁사 정보 조회
    const competitorData = this.db.getKeywordData(`competitor_analysis_${keyword}`);
    
    if (competitorData && competitorData.topCompetitors && Array.isArray(competitorData.topCompetitors)) {
      return competitorData.topCompetitors.slice(0, limit);
    }
    
    // 데이터가 없는 경우 빈 배열 반환
    return [];
  }
  
  /**
   * 상품 가격 분포 데이터 조회
   * @param keyword 키워드
   * @returns 가격 분포 데이터
   */
  private async getPriceDistribution(keyword: string): Promise<any> {
    // 가격 분포 조회
    const priceDistribution = this.db.getKeywordData(`price_distribution_${keyword}`);
    
    if (priceDistribution) {
      return priceDistribution;
    }
    
    // 데이터가 없는 경우 기본값 반환
    const distribution = {
      labels: ['~1만원', '1~3만원', '3~5만원', '5~10만원', '10만원~'],
      data: [20, 35, 25, 15, 5]  // 기본값
    };
    
    // 데이터 저장
    this.db.saveKeywordData(`price_distribution_${keyword}`, distribution);
    
    return distribution;
  }
  
  /**
   * 연관 키워드 API 호출 또는 크롤링
   * @param keyword 키워드
   * @returns 연관 키워드 목록
   */
  private async fetchRelatedKeywords(keyword: string): Promise<any[]> {
    try {
      // 네이버 API 호출
      const keywordData = await naverApi.searchKeyword(keyword);
      
      if (keywordData && Array.isArray(keywordData.relatedKeywords)) {
        // API 결과를 가공하여 필요한 형태로 변환
        const relatedKeywords = keywordData.relatedKeywords.map((relatedKeyword: string, index: number) => {
          // 인덱스에 기반한 예상 검색량 (실제로는 개별 키워드마다 API 호출 필요)
          const estimatedSearchVolume = Math.round(10000 / (index + 1));
          
          return {
            keyword: relatedKeyword,
            searchVolume: estimatedSearchVolume,
            competitionScore: Math.floor(Math.random() * 60) + 20 // 예시 값 (20-80 사이)
          };
        });
        
        // 데이터베이스에 저장
        relatedKeywords.forEach(item => {
          this.db.saveKeywordData(`related_keyword_${item.keyword}`, item);
        });
        
        return relatedKeywords.slice(0, 10);
      }
      
      // API 호출 실패 시 기본 데이터 생성
      return this.generateDefaultRelatedKeywords(keyword);
    } catch (error) {
      logger.error(`연관 키워드 수집 오류 (${keyword}): ${error}`);
      return this.generateDefaultRelatedKeywords(keyword);
    }
  }
  
  /**
   * 기본 연관 키워드 생성
   * @param keyword 키워드
   * @returns 기본 연관 키워드
   */
  private generateDefaultRelatedKeywords(keyword: string): any[] {
    const relatedKeywords = [
      { keyword: `${keyword} 추천`, searchVolume: 2500, competitionScore: 65 },
      { keyword: `${keyword} 가격`, searchVolume: 1800, competitionScore: 45 },
      { keyword: `${keyword} 후기`, searchVolume: 1500, competitionScore: 40 },
      { keyword: `저렴한 ${keyword}`, searchVolume: 1200, competitionScore: 35 },
      { keyword: `인기 ${keyword}`, searchVolume: 1000, competitionScore: 60 }
    ];
    
    // 데이터베이스에 저장
    relatedKeywords.forEach(item => {
      this.db.saveKeywordData(`related_keyword_${item.keyword}`, item);
    });
    
    return relatedKeywords;
  }
  
  /**
   * 상위 제품 크롤링
   * @param keyword 키워드
   * @returns 상위 제품 목록
   */
  private async fetchTopProducts(keyword: string): Promise<any[]> {
    try {
      // 네이버 쇼핑 API 호출
      const searchResult = await naverApi.searchKeyword(keyword);
      
      if (searchResult && Array.isArray(searchResult.products)) {
        // 상위 10개 상품만 반환
        return searchResult.products.slice(0, 10).map((product: any, index: number) => ({
          name: product.title,
          price: product.price,
          mall: product.brandName,
          reviews: product.reviewCount,
          rank: index + 1,
          image: product.image,
          productUrl: product.productUrl
        }));
      }
      
      // API 호출 실패 시 기본 데이터 생성
      return this.generateDefaultTopProducts(keyword);
    } catch (error) {
      logger.error(`상위 제품 수집 오류 (${keyword}): ${error}`);
      return this.generateDefaultTopProducts(keyword);
    }
  }
  
  /**
   * 기본 상위 제품 생성
   * @param keyword 키워드
   * @returns 기본 상위 제품
   */
  private generateDefaultTopProducts(keyword: string): any[] {
    return [
      { name: `${keyword} 제품 A`, price: 25000, mall: '스토어A', reviews: 4250, rank: 1, image: '', productUrl: '' },
      { name: `${keyword} 제품 B`, price: 32000, mall: '스토어B', reviews: 3800, rank: 2, image: '', productUrl: '' },
      { name: `${keyword} 제품 C`, price: 28500, mall: '스토어C', reviews: 2900, rank: 3, image: '', productUrl: '' }
    ];
  }
}