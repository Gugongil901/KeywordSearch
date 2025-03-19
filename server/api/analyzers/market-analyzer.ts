/**
 * 카테고리별 시장 분석 알고리즘
 * 
 * 카테고리별 시장 현황, 트렌드, 기회를 분석하는 모듈
 */

import { logger } from '../../utils/logger';
import { NaverDataCollector } from '../collectors/naver-data-collector';
import { KeywordMetricsCalculator } from './keyword-metrics-calculator';
import { DatabaseConnector } from '../collectors/database-connector';

// 시장 분석 결과 인터페이스
interface CategoryMarketAnalysis {
  categoryId: string;
  marketAnalysis: MarketAnalysis;
  opportunities: MarketOpportunity[];
  trends: CategoryTrends;
}

// 시장 현황 분석 인터페이스
interface MarketAnalysis {
  avgMetrics: {
    competitionScore: number;
    growthScore: number;
    profitScore: number;
    searchVolume: number;
    price: number;
  };
  marketMaturity: string;
  concentration: number;
  topSellers: {
    name: string;
    marketShare: number;
    productCount: number;
  }[];
}

// 시장 기회 인터페이스
interface MarketOpportunity {
  keyword: string;
  opportunityScore: number;
  growthScore: number;
  competitionScore: number;
  profitScore: number;
  searchVolume: number;
}

// 카테고리 트렌드 인터페이스
interface CategoryTrends {
  monthlyTrend: {
    date: string;
    value: number;
  }[];
  seasonality: {
    strength: number;
    peakMonths: number[];
  };
  yoyGrowth: number;
  recentTrend: {
    direction: string;
    percentage: number;
  };
}

/**
 * 카테고리별 시장 분석기 클래스
 */
export class MarketAnalyzer {
  private dataCollector: NaverDataCollector;
  private metricsCalculator: KeywordMetricsCalculator;
  private db: DatabaseConnector;
  
  constructor(
    dataCollector: NaverDataCollector,
    metricsCalculator: KeywordMetricsCalculator,
    dbConnector: DatabaseConnector
  ) {
    this.dataCollector = dataCollector;
    this.metricsCalculator = metricsCalculator;
    this.db = dbConnector;
    logger.info('시장 분석기 초기화 완료');
  }
  
  /**
   * 특정 카테고리의 시장 현황 분석
   * @param categoryId 분석할 카테고리 ID
   * @returns 카테고리 시장 분석 결과
   */
  async analyzeCategoryMarket(categoryId: string): Promise<CategoryMarketAnalysis> {
    try {
      logger.info(`[${categoryId}] 카테고리 시장 분석 시작`);
      
      // 카테고리 관련 키워드 수집
      const keywords = await this.getCategoryKeywords(categoryId);
      
      // 키워드별 지표 계산 및 분석
      const results = [];
      for (const keyword of keywords) {
        const metrics = await this.metricsCalculator.calculateAllMetrics(keyword);
        results.push({
          keyword,
          metrics
        });
      }
      
      // 카테고리 시장 분석
      const marketAnalysis = this.analyzeMarketFromKeywords(results, categoryId);
      
      // 시장 기회 발굴
      const opportunities = this.identifyMarketOpportunities(results, categoryId);
      
      // 카테고리 트렌드 분석
      const trends = await this.analyzeCategoryTrends(categoryId);
      
      // 결과 저장
      this.db.saveKeywordData(`market_analysis_${categoryId}`, {
        marketAnalysis,
        opportunities,
        trends
      });
      
      logger.info(`[${categoryId}] 카테고리 시장 분석 완료`);
      
      return {
        categoryId,
        marketAnalysis,
        opportunities,
        trends
      };
    } catch (error) {
      logger.error(`[${categoryId}] 카테고리 시장 분석 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 카테고리 관련 키워드 조회
   * @param categoryId 카테고리 ID
   * @returns 관련 키워드 목록
   */
  private async getCategoryKeywords(categoryId: string): Promise<string[]> {
    try {
      // 데이터베이스에서 카테고리 키워드 조회
      const storedKeywords = this.db.getKeywordData(`category_keywords_${categoryId}`);
      
      if (storedKeywords && Array.isArray(storedKeywords)) {
        return storedKeywords;
      }
      
      // 키워드가 없는 경우 카테고리별 기본 키워드 반환
      return this.getDefaultCategoryKeywords(categoryId);
    } catch (error) {
      logger.error(`카테고리 키워드 조회 오류: ${error}`);
      return this.getDefaultCategoryKeywords(categoryId);
    }
  }
  
  /**
   * 카테고리별 기본 키워드
   * @param categoryId 카테고리 ID
   * @returns 기본 키워드 목록
   */
  private getDefaultCategoryKeywords(categoryId: string): string[] {
    // 카테고리별 대표 키워드
    const categoryKeywords: Record<string, string[]> = {
      'fashion': ['여성의류', '남성의류', '청바지', '티셔츠', '원피스', '니트'],
      'beauty': ['스킨케어', '메이크업', '향수', '네일아트', '선크림', '마스크팩'],
      'electronics': ['스마트폰', '노트북', '태블릿', '스마트워치', '이어폰', '블루투스'],
      'furniture': ['소파', '침대', '책상', '의자', '옷장', '선반'],
      'food': ['건강식품', '과일', '채소', '고기', '음료', '간식'],
      'sports': ['운동화', '트레이닝복', '요가매트', '골프채', '자전거', '텐트'],
      'kids': ['유아복', '장난감', '유모차', '아기과자', '기저귀', '분유'],
      'general': ['인기상품', '할인상품', '신상품', '베스트', '추천', '가성비']
    };
    
    return categoryKeywords[categoryId] || categoryKeywords['general'];
  }
  
  /**
   * 키워드 분석 결과로부터 시장 현황 도출
   * @param keywordResults 키워드별 분석 결과
   * @param categoryId 카테고리 ID
   * @returns 시장 현황 분석
   */
  private analyzeMarketFromKeywords(keywordResults: any[], categoryId: string): MarketAnalysis {
    try {
      // 카테고리 평균 지표 계산
      const avgMetrics = {
        competitionScore: 0,
        growthScore: 0,
        profitScore: 0,
        searchVolume: 0,
        price: 0
      };
      
      for (const result of keywordResults) {
        const metrics = result.metrics;
        avgMetrics.competitionScore += metrics.competition.competitionScore;
        avgMetrics.growthScore += metrics.growth.growthScore;
        avgMetrics.profitScore += metrics.profit.profitScore;
        avgMetrics.searchVolume += metrics.basic.searchVolume.total;
        avgMetrics.price += metrics.profit.avgPrice;
      }
      
      // 평균 계산
      const count = keywordResults.length || 1;  // 0으로 나누기 방지
      for (const key in avgMetrics) {
        avgMetrics[key as keyof typeof avgMetrics] = Math.round(avgMetrics[key as keyof typeof avgMetrics] / count * 100) / 100;
      }
      
      // 시장 성숙도 평가
      const marketMaturity = this.evaluateMarketMaturity(avgMetrics, keywordResults);
      
      // 카테고리 집중도 계산
      const concentration = this.calculateCategoryConcentration(keywordResults);
      
      // 상위 브랜드/판매자 분석
      const topSellers = this.analyzeTopSellers(keywordResults);
      
      return {
        avgMetrics,
        marketMaturity,
        concentration,
        topSellers
      };
    } catch (error) {
      logger.error(`시장 현황 분석 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 시장 성숙도 평가
   * @param avgMetrics 평균 지표
   * @param keywordResults 키워드별 분석 결과
   * @returns 시장 성숙도 등급
   */
  private evaluateMarketMaturity(avgMetrics: any, keywordResults: any[]): string {
    // 경쟁 강도와 성장률로 시장 성숙도 평가
    const competitionScore = avgMetrics.competitionScore;
    const growthScore = avgMetrics.growthScore;
    
    // 성장률과 경쟁 강도에 따른 성숙도 매트릭스
    if (growthScore > 70 && competitionScore < 40) {
      return '초기 성장기'; // 높은 성장률, 낮은 경쟁 -> 초기 성장 단계
    } else if (growthScore > 50 && competitionScore < 60) {
      return '성장기'; // 좋은 성장률, 보통 경쟁 -> 성장 단계
    } else if (growthScore > 30 && competitionScore < 80) {
      return '성숙기'; // 보통 성장률, 높은 경쟁 -> 성숙 단계
    } else if (growthScore < 30 && competitionScore > 70) {
      return '포화기'; // 낮은 성장률, 매우 높은 경쟁 -> 포화 단계
    } else if (growthScore < 10) {
      return '쇠퇴기'; // 매우 낮은 성장률 -> 쇠퇴 단계
    } else {
      return '안정기'; // 그 외의 경우 -> 안정 단계
    }
  }
  
  /**
   * 카테고리 집중도 계산 (허핀달-허시만 지수)
   * @param keywordResults 키워드별 분석 결과
   * @returns 카테고리 집중도 (0-1)
   */
  private calculateCategoryConcentration(keywordResults: any[]): number {
    try {
      // 각 키워드의 검색량 비중으로 시장 집중도 계산
      const totalSearchVolume = keywordResults.reduce((sum, result) => {
        return sum + result.metrics.basic.searchVolume.total;
      }, 0);
      
      if (totalSearchVolume === 0) return 0;
      
      // 허핀달-허시만 지수 계산 (검색량 기준)
      let hhi = 0;
      for (const result of keywordResults) {
        const marketShare = result.metrics.basic.searchVolume.total / totalSearchVolume;
        hhi += marketShare * marketShare;
      }
      
      return Math.round(hhi * 1000) / 1000;
    } catch (error) {
      logger.error(`카테고리 집중도 계산 오류: ${error}`);
      return 0;
    }
  }
  
  /**
   * 상위 브랜드/판매자 분석
   * @param keywordResults 키워드별 분석 결과
   * @returns 상위 판매자 목록
   */
  private analyzeTopSellers(keywordResults: any[]): { name: string; marketShare: number; productCount: number; }[] {
    try {
      // 판매자별 상품 수 통합
      const sellerMap = new Map<string, { count: number; share: number; }>();
      let totalProducts = 0;
      
      // 모든 키워드의 상품 데이터 통합
      for (const result of keywordResults) {
        const crawlData = result.metrics.raw?.crawlData?.shoppingResults;
        if (!crawlData || !crawlData.products) continue;
        
        for (const product of crawlData.products) {
          if (!product.mall) continue;
          
          const currentCount = sellerMap.get(product.mall)?.count || 0;
          sellerMap.set(product.mall, { count: currentCount + 1, share: 0 });
          totalProducts++;
        }
      }
      
      // 시장 점유율 계산
      if (totalProducts > 0) {
        for (const [seller, data] of sellerMap.entries()) {
          sellerMap.set(seller, {
            count: data.count,
            share: Math.round((data.count / totalProducts) * 10000) / 100 // 소수점 2자리까지
          });
        }
      }
      
      // 상위 판매자 추출 (상위 10개)
      const topSellers = Array.from(sellerMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([name, data]) => ({
          name,
          marketShare: data.share,
          productCount: data.count
        }));
      
      return topSellers;
    } catch (error) {
      logger.error(`상위 판매자 분석 오류: ${error}`);
      return [];
    }
  }
  
  /**
   * 카테고리 내 시장 기회 발굴
   * @param keywordResults 키워드별 분석 결과
   * @param categoryId 카테고리 ID
   * @returns 시장 기회 목록
   */
  private identifyMarketOpportunities(keywordResults: any[], categoryId: string): MarketOpportunity[] {
    try {
      const opportunities: MarketOpportunity[] = [];
      
      for (const result of keywordResults) {
        const metrics = result.metrics;
        const keyword = result.keyword;
        
        // 기회 점수 계산 (성장률 높고 경쟁도 낮은 키워드)
        const growthScore = metrics.growth.growthScore;
        const competitionScore = metrics.competition.competitionScore;
        const profitScore = metrics.profit.profitScore;
        
        // 경쟁도는 낮을수록 좋으므로 역산
        const competitionInverted = 100 - competitionScore;
        
        // 가중치 적용한 기회 점수
        const opportunityScore = (growthScore * 0.5) + (competitionInverted * 0.3) + (profitScore * 0.2);
        
        // 기준점 이상인 키워드만 기회로 간주
        if (opportunityScore > 60) {
          opportunities.push({
            keyword,
            opportunityScore: Math.round(opportunityScore * 100) / 100,
            growthScore,
            competitionScore,
            profitScore,
            searchVolume: metrics.basic.searchVolume.total
          });
        }
      }
      
      // 기회 점수순 정렬
      opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
      
      return opportunities.slice(0, 10);  // 상위 10개만 반환
    } catch (error) {
      logger.error(`시장 기회 발굴 오류: ${error}`);
      return [];
    }
  }
  
  /**
   * 카테고리의 시간에 따른 트렌드 분석
   * @param categoryId 카테고리 ID
   * @returns 카테고리 트렌드 분석 결과
   */
  private async analyzeCategoryTrends(categoryId: string): Promise<CategoryTrends> {
    try {
      // 과거 12개월 카테고리 검색량 데이터 조회
      const historicalData = await this.getCategoryHistoricalData(categoryId, 12);
      
      // 월별 검색량 추세
      const monthlyTrend = this.calculateMonthlyTrend(historicalData);
      
      // 계절성 분석
      const seasonality = this.analyzeSeasonality(historicalData);
      
      // 연간 성장률
      const yoyGrowth = this.calculateYoyGrowth(historicalData);
      
      // 최근 3개월 트렌드
      const recentTrend = this.calculateRecentTrend(historicalData);
      
      return {
        monthlyTrend,
        seasonality,
        yoyGrowth,
        recentTrend
      };
    } catch (error) {
      logger.error(`카테고리 트렌드 분석 오류: ${error}`);
      
      // 오류 발생 시 기본값 반환
      return {
        monthlyTrend: [],
        seasonality: {
          strength: 0,
          peakMonths: []
        },
        yoyGrowth: 0,
        recentTrend: {
          direction: '유지',
          percentage: 0
        }
      };
    }
  }
  
  /**
   * 카테고리 과거 데이터 조회
   * @param categoryId 카테고리 ID
   * @param months 조회할 개월 수
   * @returns 과거 데이터
   */
  private async getCategoryHistoricalData(categoryId: string, months: number): Promise<any[]> {
    try {
      // 데이터베이스에서 카테고리 히스토리 데이터 조회
      const storedData = this.db.getKeywordData(`category_history_${categoryId}`);
      
      if (storedData && Array.isArray(storedData)) {
        return storedData;
      }
      
      // 데이터가 없는 경우 간단한 샘플 데이터 생성
      return this.generateSampleHistoricalData(months);
    } catch (error) {
      logger.error(`카테고리 과거 데이터 조회 오류: ${error}`);
      return this.generateSampleHistoricalData(months);
    }
  }
  
  /**
   * 샘플 과거 데이터 생성
   * @param months 생성할 개월 수
   * @returns 샘플 과거 데이터
   */
  private generateSampleHistoricalData(months: number): any[] {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < months; i++) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      
      // 기본 값
      const baseValue = 10000;
      
      // 트렌드 (최근으로 올수록 증가하는 추세)
      const trend = i * -200;
      
      // 계절성 (1년 주기로 변화)
      const month = date.getMonth();
      const seasonality = Math.sin(month / 12 * Math.PI * 2) * 2000;
      
      // 랜덤 변동
      const random = (Math.random() - 0.5) * 1000;
      
      // 최종 값
      const value = Math.max(0, baseValue + trend + seasonality + random);
      
      data.push({
        date: date.toISOString().slice(0, 7), // YYYY-MM 형식
        value: Math.round(value)
      });
    }
    
    // 날짜순으로 정렬 (오래된 순)
    return data.sort((a, b) => a.date.localeCompare(b.date));
  }
  
  /**
   * 월별 검색량 추세 계산
   * @param historicalData 과거 데이터
   * @returns 월별 추세
   */
  private calculateMonthlyTrend(historicalData: any[]): { date: string; value: number; }[] {
    return historicalData.map(item => ({
      date: item.date,
      value: item.value
    }));
  }
  
  /**
   * 계절성 분석
   * @param historicalData 과거 데이터
   * @returns 계절성 분석 결과
   */
  private analyzeSeasonality(historicalData: any[]): { strength: number; peakMonths: number[]; } {
    try {
      // 데이터가 12개월 미만이면 계절성 분석 불가
      if (historicalData.length < 12) {
        return {
          strength: 0,
          peakMonths: []
        };
      }
      
      // 월별 평균값 계산
      const monthlyAvg = new Array(12).fill(0);
      const monthlyCount = new Array(12).fill(0);
      
      for (const item of historicalData) {
        const month = new Date(item.date).getMonth();
        monthlyAvg[month] += item.value;
        monthlyCount[month]++;
      }
      
      // 평균 계산
      for (let i = 0; i < 12; i++) {
        if (monthlyCount[i] > 0) {
          monthlyAvg[i] /= monthlyCount[i];
        }
      }
      
      // 전체 평균 계산
      const totalAvg = monthlyAvg.reduce((sum, val) => sum + val, 0) / 12;
      
      // 계절성 강도 계산 (월별 값의 변동성)
      let variationSum = 0;
      for (let i = 0; i < 12; i++) {
        variationSum += Math.pow(monthlyAvg[i] - totalAvg, 2);
      }
      
      const variance = variationSum / 12;
      const strength = Math.min(Math.sqrt(variance) / totalAvg, 1); // 0-1 사이로 정규화
      
      // 피크 월 찾기 (평균보다 20% 이상 높은 월)
      const peakMonths = [];
      for (let i = 0; i < 12; i++) {
        if (monthlyAvg[i] > totalAvg * 1.2) {
          peakMonths.push(i + 1); // 1-indexed 월
        }
      }
      
      return {
        strength: Math.round(strength * 100) / 100,
        peakMonths
      };
    } catch (error) {
      logger.error(`계절성 분석 오류: ${error}`);
      return {
        strength: 0,
        peakMonths: []
      };
    }
  }
  
  /**
   * 연간 성장률 계산
   * @param historicalData 과거 데이터
   * @returns 연간 성장률
   */
  private calculateYoyGrowth(historicalData: any[]): number {
    try {
      // 데이터가 12개월 미만이면 연간 성장률 계산 불가
      if (historicalData.length < 12) {
        return 0;
      }
      
      // 최근 데이터와 1년 전 데이터 비교
      const recentData = historicalData[historicalData.length - 1]?.value || 0;
      const yearAgoData = historicalData[historicalData.length - 12]?.value || 0;
      
      if (yearAgoData === 0) return 0;
      
      // 성장률 계산
      const growthRate = (recentData - yearAgoData) / yearAgoData;
      
      return Math.round(growthRate * 10000) / 100; // 소수점 2자리까지 (퍼센트)
    } catch (error) {
      logger.error(`연간 성장률 계산 오류: ${error}`);
      return 0;
    }
  }
  
  /**
   * 최근 3개월 트렌드 계산
   * @param historicalData 과거 데이터
   * @returns 최근 트렌드
   */
  private calculateRecentTrend(historicalData: any[]): { direction: string; percentage: number; } {
    try {
      // 데이터가 3개월 미만이면 최근 트렌드 계산 불가
      if (historicalData.length < 3) {
        return {
          direction: '유지',
          percentage: 0
        };
      }
      
      // 최근 3개월 데이터
      const recent3Months = historicalData.slice(-3);
      
      // 선형 회귀로 추세 계산
      const n = recent3Months.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      
      for (let i = 0; i < n; i++) {
        const x = i;
        const y = recent3Months[i]?.value || 0;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      }
      
      // 기울기 계산
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      
      // 최근 값 대비 변화율
      const recentValue = recent3Months[n - 1]?.value || 0;
      if (recentValue === 0) return { direction: '유지', percentage: 0 };
      
      const changeRate = (slope * n) / recentValue * 100;
      
      // 트렌드 방향 결정
      let direction: string;
      if (changeRate > 5) {
        direction = '상승';
      } else if (changeRate < -5) {
        direction = '하락';
      } else {
        direction = '유지';
      }
      
      return {
        direction,
        percentage: Math.round(Math.abs(changeRate) * 100) / 100 // 절대값, 소수점 2자리까지
      };
    } catch (error) {
      logger.error(`최근 트렌드 계산 오류: ${error}`);
      return {
        direction: '유지',
        percentage: 0
      };
    }
  }
}