/**
 * 키워드 메트릭스 계산기
 * 수집된 데이터를 기반으로 다양한 마케팅 지표를 계산하는 모듈
 */

import { logger } from '../../utils/logger';
import { NaverDataCollector } from '../collectors/naver-data-collector';
import { DatabaseConnector } from '../collectors/database-connector';

// 전체 메트릭스 인터페이스
interface AllMetrics {
  basic: BasicMetrics;
  competition: CompetitionMetrics;
  growth: GrowthMetrics;
  profit: ProfitMetrics;
  marketing: MarketingMetrics;
  seasonality: SeasonalityMetrics;
  overallScore: OverallScore;
}

// 기본 지표 인터페이스
interface BasicMetrics {
  keyword: string;
  searchVolume: {
    pc: number;
    mobile: number;
    total: number;
  };
  productCount: number;
  priceStats: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
  category: string;
}

// 경쟁 지표 인터페이스
interface CompetitionMetrics {
  keyword: string;
  competitionScore: number;
  adRatio: number;
  brandRatio: number;
  bidPrice: number;
  reviewRatio: number;
  marketConcentration: number; // 허핀달-허시만 지수
  difficultyLevel: string; // '매우 쉬움' ~ '매우 어려움' 
}

// 성장성 지표 인터페이스
interface GrowthMetrics {
  keyword: string;
  growthScore: number;
  growthRates: {
    '3month': number;
    '6month': number;
    '12month': number;
  };
  forecast: any[]; // 예측 데이터
  relativeGrowth: number;
  seasonallyAdjustedGrowth: number;
  trendDirection: string; // '상승', '하락', '유지'
}

// 수익성 지표 인터페이스
interface ProfitMetrics {
  keyword: string;
  profitScore: number;
  estimatedMargin: number;
  marginRate: number;
  marginToCpcRatio: number;
  avgPrice: number;
  profitabilityLevel: string; // '매우 낮음' ~ '매우 높음'
}

// 마케팅 효율 지표 인터페이스
interface MarketingMetrics {
  keyword: string;
  marketingEfficiencyScore: number;
  estimatedCtr: number;
  estimatedCvr: number;
  estimatedClicks: number;
  estimatedConversions: number;
  efficiencyLevel: string; // '매우 낮음' ~ '매우 높음'
}

// 계절성 지표 인터페이스
interface SeasonalityMetrics {
  keyword: string;
  seasonalityScore: number;
  seasonalityStrength: number;
  peakMonths: number[];
  currentSeasonStatus: string; // '비수기', '성수기', '보통'
}

// 종합 점수 인터페이스
interface OverallScore {
  score: number;
  grade: string; // 'S', 'A', 'B', 'C', 'D'
  categoryScores: {
    competition: number;
    growth: number;
    profit: number;
    marketing: number;
    seasonality: number;
  };
}

/**
 * 키워드 메트릭스 계산기 클래스
 */
export class KeywordMetricsCalculator {
  private dataCollector: NaverDataCollector;
  private db: DatabaseConnector;
  
  constructor(dataCollector: NaverDataCollector, dbConnector: DatabaseConnector) {
    this.dataCollector = dataCollector;
    this.db = dbConnector;
    logger.info('키워드 메트릭스 계산기 초기화 완료');
  }
  
  /**
   * 키워드의 모든 핵심 지표를 계산
   * @param keyword 분석할 키워드
   * @returns 계산된 모든 지표
   */
  async calculateAllMetrics(keyword: string): Promise<AllMetrics> {
    try {
      logger.info(`[${keyword}] 모든 지표 계산 시작`);
      
      // 데이터 수집
      const rawData = await this.dataCollector.collectAllData(keyword);
      
      // 기본 지표 계산
      const basicMetrics = this.calculateBasicMetrics(keyword, rawData);
      
      // 경쟁 지표 계산
      const competitionMetrics = this.calculateCompetitionMetrics(keyword, rawData);
      
      // 성장성 지표 계산
      const growthMetrics = await this.calculateGrowthMetrics(keyword, rawData);
      
      // 수익성 지표 계산
      const profitMetrics = this.calculateProfitMetrics(keyword, rawData);
      
      // 마케팅 효율 지표 계산
      const marketingMetrics = this.calculateMarketingMetrics(keyword, rawData);
      
      // 계절성 지표 계산
      const seasonalityMetrics = this.calculateSeasonalityMetrics(keyword, rawData);
      
      // 모든 지표 통합
      const allMetrics: AllMetrics = {
        basic: basicMetrics,
        competition: competitionMetrics,
        growth: growthMetrics,
        profit: profitMetrics,
        marketing: marketingMetrics,
        seasonality: seasonalityMetrics,
        overallScore: this.calculateOverallScore(basicMetrics, competitionMetrics, growthMetrics, profitMetrics, marketingMetrics, seasonalityMetrics)
      };
      
      // 결과 저장
      this.db.saveKeywordData(`metrics_${keyword}`, allMetrics);
      
      logger.info(`[${keyword}] 모든 지표 계산 완료`);
      return allMetrics;
      
    } catch (error) {
      logger.error(`[${keyword}] 지표 계산 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 기본 지표 계산 (검색량, 상품 수 등)
   */
  private calculateBasicMetrics(keyword: string, rawData: any): BasicMetrics {
    try {
      const apiData = rawData?.apiData || {};
      const crawlData = rawData?.crawlData || {};
      
      // 쇼핑 데이터에서 검색량 추출
      const shoppingData = apiData.shoppingData || {};
      const relKeyword = shoppingData.relKeyword || [{}];
      const searchVolume = relKeyword[0]?.monthlyPcQcCnt || 0;
      const searchVolumeMobile = relKeyword[0]?.monthlyMobileQcCnt || 0;
      
      // 크롤링 데이터에서 상품 수, 가격 정보 추출
      const shoppingResults = crawlData.shoppingResults || {};
      const totalProducts = shoppingResults.totalProducts || 0;
      const priceStats = shoppingResults.priceStats || {
        min: 0,
        max: 0,
        avg: 0,
        median: 0
      };
      
      // 기본 지표 계산 결과
      return {
        keyword,
        searchVolume: {
          pc: searchVolume,
          mobile: searchVolumeMobile,
          total: searchVolume + searchVolumeMobile
        },
        productCount: totalProducts,
        priceStats,
        category: this.determineCategory(keyword, rawData)
      };
    } catch (error) {
      logger.error(`[${keyword}] 기본 지표 계산 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 경쟁 지표 계산 (경쟁강도, 광고비율 등)
   */
  private calculateCompetitionMetrics(keyword: string, rawData: any): CompetitionMetrics {
    try {
      const apiData = rawData?.apiData || {};
      const crawlData = rawData?.crawlData || {};
      
      // 광고 API 데이터
      const adData = apiData.adData || {};
      const bidPrice = adData.bid?.bid || 0;  // 입찰가
      
      // 크롤링 데이터
      const shoppingResults = crawlData.shoppingResults || {};
      const adRatio = shoppingResults.adRatio || 0;  // 광고 비율
      const mallDistribution = shoppingResults.mallDistribution || {};
      
      // 상위 10개 상품 중 브랜드/일반 판매자 비율
      const products = shoppingResults.products || [];
      const brandCount = products.filter((p: any) => this.isBrandSeller(p.mall || '')).length;
      const brandRatio = products.length > 0 ? brandCount / products.length : 0;
      
      // 전체 상품 수 대비 리뷰 수 비율
      const reviewStats = shoppingResults.reviewStats || {};
      const totalReviews = reviewStats.total || 0;
      const totalProducts = shoppingResults.totalProducts || 1;  // 0으로 나누기 방지
      const reviewRatio = totalReviews / totalProducts;
      
      // 경쟁도 점수 계산 (0-100, 높을수록 경쟁 심함)
      const competitionScore = this.calculateCompetitionScore(
        adRatio, brandRatio, bidPrice, totalProducts, reviewRatio
      );
      
      // 시장 집중도 계산 (허핀달-허시만 지수 방식)
      const hhi = this.calculateMarketConcentration(mallDistribution);
      
      return {
        keyword,
        competitionScore,
        adRatio,
        brandRatio,
        bidPrice,
        reviewRatio,
        marketConcentration: hhi,
        difficultyLevel: this.getDifficultyLevel(competitionScore)
      };
    } catch (error) {
      logger.error(`[${keyword}] 경쟁 지표 계산 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 성장성 지표 계산 (검색량 추세, 예측 등)
   */
  private async calculateGrowthMetrics(keyword: string, rawData: any): Promise<GrowthMetrics> {
    try {
      // 과거 데이터 조회 (최근 12개월)
      const historicalData = await this.getHistoricalData(keyword, 12);
      
      // 검색량 성장률 계산
      const searchVolumeTrend = this.calculateSearchVolumeTrend(historicalData);
      
      // 시계열 분석으로 향후 3개월 예측
      const forecastData = this.forecastSearchVolume(historicalData, 3);
      
      // 계절 조정 성장률 (계절 요인 제거)
      const seasonallyAdjustedGrowth = this.calculateSeasonallyAdjustedGrowth(historicalData);
      
      // 카테고리 대비 상대적 성장률
      const category = this.determineCategory(keyword, rawData);
      const relativeGrowth = await this.calculateRelativeGrowth(keyword, category, historicalData);
      
      // 3개월/6개월/12개월 성장률
      const growthRates = {
        '3month': this.calculatePeriodGrowth(historicalData, 3),
        '6month': this.calculatePeriodGrowth(historicalData, 6),
        '12month': this.calculatePeriodGrowth(historicalData, 12)
      };
      
      // 성장 점수 계산 (0-100, 높을수록 성장성 높음)
      const growthScore = this.calculateGrowthScore(
        growthRates, forecastData, relativeGrowth
      );
      
      return {
        keyword,
        growthScore,
        growthRates,
        forecast: forecastData,
        relativeGrowth,
        seasonallyAdjustedGrowth,
        trendDirection: this.getTrendDirection(growthRates['3month'])
      };
    } catch (error) {
      logger.error(`[${keyword}] 성장성 지표 계산 오류: ${error}`);
      
      // 오류 발생 시 기본값 반환
      return {
        keyword,
        growthScore: 50,
        growthRates: { '3month': 0, '6month': 0, '12month': 0 },
        forecast: [],
        relativeGrowth: 0,
        seasonallyAdjustedGrowth: 0,
        trendDirection: '유지'
      };
    }
  }
  
  /**
   * 수익성 지표 계산 (마진율, ROI 등)
   */
  private calculateProfitMetrics(keyword: string, rawData: any): ProfitMetrics {
    try {
      const apiData = rawData?.apiData || {};
      const crawlData = rawData?.crawlData || {};
      
      // 가격 정보 추출
      const shoppingResults = crawlData.shoppingResults || {};
      const priceStats = shoppingResults.priceStats || {};
      const avgPrice = priceStats.avg || 0;
      
      // 광고 비용 추정
      const adData = apiData.adData || {};
      const cpc = adData.bid?.bid || 0;  // 클릭당 비용
      
      // 카테고리별 평균 마진율 데이터 (미리 정의된 값 활용)
      const category = this.determineCategory(keyword, rawData);
      const avgMarginRate = this.getCategoryMarginRate(category);
      
      // 예상 마진 계산
      const estimatedMargin = avgPrice * avgMarginRate;
      
      // CPC 대비 마진 비율 (= ROI)
      const marginToCpcRatio = cpc > 0 ? estimatedMargin / cpc : 0;
      
      // 수익성 점수 계산 (0-100, 높을수록 수익성 높음)
      const profitScore = this.calculateProfitScore(
        estimatedMargin, marginToCpcRatio, avgPrice
      );
      
      return {
        keyword,
        profitScore,
        estimatedMargin,
        marginRate: avgMarginRate,
        marginToCpcRatio,
        avgPrice,
        profitabilityLevel: this.getProfitabilityLevel(profitScore)
      };
    } catch (error) {
      logger.error(`[${keyword}] 수익성 지표 계산 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 마케팅 효율 지표 계산 (클릭률, 전환율 추정 등)
   */
  private calculateMarketingMetrics(keyword: string, rawData: any): MarketingMetrics {
    try {
      const apiData = rawData?.apiData || {};
      
      // 광고 API 데이터
      const adData = apiData.adData || {};
      const adMetrics = adData.metrics || {};
      
      // 기본값 설정
      const ctr = adMetrics.ctr || 0.02;  // 클릭률 기본값 2%
      const cvr = adMetrics.cvr || 0.015;  // 전환률 기본값 1.5%
      
      // 검색량 데이터
      const basicMetrics = this.calculateBasicMetrics(keyword, rawData);
      const searchVolume = basicMetrics.searchVolume.total;
      
      // 마케팅 관련 지표 계산
      const estimatedClicks = searchVolume * ctr;
      const estimatedConversions = estimatedClicks * cvr;
      
      // 광고 효율 점수 계산
      const marketingEfficiencyScore = this.calculateMarketingEfficiencyScore(
        ctr, cvr, searchVolume
      );
      
      return {
        keyword,
        marketingEfficiencyScore,
        estimatedCtr: ctr,
        estimatedCvr: cvr,
        estimatedClicks,
        estimatedConversions,
        efficiencyLevel: this.getEfficiencyLevel(marketingEfficiencyScore)
      };
    } catch (error) {
      logger.error(`[${keyword}] 마케팅 효율 지표 계산 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 계절성 지표 계산 (계절 변동, 주기성 등)
   */
  private async calculateSeasonalityMetrics(keyword: string, rawData: any): Promise<SeasonalityMetrics> {
    try {
      // 과거 24개월 데이터 조회
      const historicalData = await this.getHistoricalData(keyword, 24);
      
      // 시계열 분해로 계절성 파악
      const seasonalComponents = this.decomposeTimeSeries(historicalData);
      
      // 계절성 강도 계산 (0-1, 높을수록 계절성 강함)
      const seasonalityStrength = this.calculateSeasonalityStrength(seasonalComponents);
      
      // 피크 월 식별
      const peakMonths = this.identifyPeakMonths(seasonalComponents);
      
      // 계절성 점수 계산 (0-100)
      const seasonalityScore = seasonalityStrength * 100;
      
      return {
        keyword,
        seasonalityScore,
        seasonalityStrength,
        peakMonths,
        currentSeasonStatus: this.getCurrentSeasonStatus(seasonalComponents)
      };
    } catch (error) {
      logger.error(`[${keyword}] 계절성 지표 계산 오류: ${error}`);
      
      // 오류 발생 시 기본값 반환
      return {
        keyword,
        seasonalityScore: 0,
        seasonalityStrength: 0,
        peakMonths: [],
        currentSeasonStatus: '보통'
      };
    }
  }
  
  /**
   * 모든 지표를 종합한 총합 점수 계산
   */
  private calculateOverallScore(
    basicMetrics: BasicMetrics,
    competitionMetrics: CompetitionMetrics,
    growthMetrics: GrowthMetrics,
    profitMetrics: ProfitMetrics,
    marketingMetrics: MarketingMetrics,
    seasonalityMetrics: SeasonalityMetrics
  ): OverallScore {
    // 각 카테고리별 점수
    const competitionScore = competitionMetrics.competitionScore;
    const growthScore = growthMetrics.growthScore;
    const profitScore = profitMetrics.profitScore;
    const marketingScore = marketingMetrics.marketingEfficiencyScore;
    const seasonalityScore = seasonalityMetrics.seasonalityScore;
    
    // 경쟁도 점수는 역으로 계산 (낮을수록 좋음)
    const competitionScoreInverted = 100 - competitionScore;
    
    // 가중치 적용 (각 지표의 중요도에 따라 조정 가능)
    const weights = {
      competition: 0.3,
      growth: 0.3,
      profit: 0.2,
      marketing: 0.15,
      seasonality: 0.05
    };
    
    // 가중 평균 계산
    const overallScore = (
      competitionScoreInverted * weights.competition +
      growthScore * weights.growth +
      profitScore * weights.profit +
      marketingScore * weights.marketing +
      seasonalityScore * weights.seasonality
    );
    
    // 종합 등급 부여
    const overallGrade = this.getOverallGrade(overallScore);
    
    return {
      score: Math.round(overallScore * 100) / 100,
      grade: overallGrade,
      categoryScores: {
        competition: competitionScore,
        growth: growthScore,
        profit: profitScore,
        marketing: marketingScore,
        seasonality: seasonalityScore
      }
    };
  }
  
  // 여기서부터는 다양한 헬퍼 메서드들이 구현될 수 있습니다.
  // 참고: 전체 코드가 너무 길어질 수 있어서 주요 메서드만 구현하고
  // 나머지는 필요에 따라 추가 구현할 수 있습니다.
  
  /**
   * 키워드 카테고리 결정
   */
  private determineCategory(keyword: string, rawData: any): string {
    // 간단한 구현: 키워드에 포함된 단어로 카테고리 유추
    if (/의류|옷|패션|셔츠|바지|치마|모자|코트|자켓/.test(keyword)) {
      return 'fashion';
    } else if (/전자|컴퓨터|노트북|모니터|키보드|마우스|폰|태블릿/.test(keyword)) {
      return 'electronics';
    } else if (/화장품|스킨케어|메이크업|립스틱|파운데이션|마스카라/.test(keyword)) {
      return 'beauty';
    } else if (/가구|소파|침대|책상|의자|선반|테이블|조명/.test(keyword)) {
      return 'furniture';
    } else if (/식품|과일|채소|고기|생선|음료|차|커피/.test(keyword)) {
      return 'food';
    } else {
      return 'others';
    }
  }
  
  /**
   * 판매자가 브랜드인지 확인
   */
  private isBrandSeller(mallName: string): boolean {
    // 단순 구현: 몰 이름이 특정 패턴을 가지면 브랜드로 간주
    const brandPatterns = ['공식', '브랜드', '스토어', 'Official', 'Brand', 'Store'];
    return brandPatterns.some(pattern => mallName.includes(pattern));
  }
  
  /**
   * 경쟁도 점수 계산
   */
  private calculateCompetitionScore(
    adRatio: number,
    brandRatio: number,
    bidPrice: number,
    productCount: number,
    reviewRatio: number
  ): number {
    // 각 요소별 가중치
    const weights = {
      adRatio: 0.3,      // 광고 비율 (높을수록 경쟁 심함)
      brandRatio: 0.2,   // 브랜드 비율 (높을수록 경쟁 심함)
      bidPrice: 0.25,    // 입찰가 (높을수록 경쟁 심함)
      productCount: 0.15, // 상품 수 (많을수록 경쟁 심함)
      reviewRatio: 0.1    // 리뷰 비율 (높을수록 경쟁 심함)
    };
    
    // 정규화 (0-1 범위로 변환)
    const normalizedAdRatio = Math.min(adRatio, 1);
    const normalizedBrandRatio = Math.min(brandRatio, 1);
    const normalizedBidPrice = Math.min(bidPrice / 5000, 1); // 5,000원을 최대로 가정
    const normalizedProductCount = Math.min(productCount / 10000, 1); // 10,000개를 최대로 가정
    const normalizedReviewRatio = Math.min(reviewRatio * 10, 1); // 0.1을 최대로 가정
    
    // 가중 합계 계산
    const weightedSum = 
      normalizedAdRatio * weights.adRatio +
      normalizedBrandRatio * weights.brandRatio +
      normalizedBidPrice * weights.bidPrice +
      normalizedProductCount * weights.productCount +
      normalizedReviewRatio * weights.reviewRatio;
    
    // 0-100 점수로 변환
    return Math.round(weightedSum * 100);
  }
  
  /**
   * 시장 집중도 계산 (허핀달-허시만 지수)
   */
  private calculateMarketConcentration(mallDistribution: Record<string, number>): number {
    const totalProducts = Object.values(mallDistribution).reduce((sum, count) => sum + count, 0);
    
    if (totalProducts === 0) return 0;
    
    // 각 쇼핑몰의 시장 점유율 제곱의 합
    const hhi = Object.values(mallDistribution).reduce((sum, count) => {
      const marketShare = count / totalProducts;
      return sum + (marketShare * marketShare);
    }, 0);
    
    // 0-1 사이의 값을 반환
    return hhi;
  }
  
  /**
   * 경쟁 난이도 레벨 결정
   */
  private getDifficultyLevel(competitionScore: number): string {
    if (competitionScore >= 80) return '매우 어려움';
    if (competitionScore >= 60) return '어려움';
    if (competitionScore >= 40) return '보통';
    if (competitionScore >= 20) return '쉬움';
    return '매우 쉬움';
  }
  
  /**
   * 과거 데이터 조회
   */
  private async getHistoricalData(keyword: string, months: number = 12): Promise<any[]> {
    // 실제 구현에서는 DB에서 과거 데이터를 조회해야 함
    // 샘플 구현: 현재는 간단한 데이터 생성
    const historicalData = [];
    const now = new Date();
    
    for (let i = 0; i < months; i++) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      
      // 랜덤한 트렌드와 계절성을 가진 데이터 생성
      // 실제 구현에서는 DB에서 조회한 실제 데이터 사용
      const baseValue = 1000;
      const trend = i * -50; // 최근에 가까울수록 증가하는 추세
      const seasonality = Math.sin((date.getMonth() / 12) * Math.PI * 2) * 200; // 계절성
      const random = (Math.random() - 0.5) * 100; // 랜덤 변동
      
      const value = Math.max(0, baseValue + trend + seasonality + random);
      
      historicalData.push({
        date: date.toISOString().slice(0, 7), // YYYY-MM 형식
        value: Math.round(value)
      });
    }
    
    // 날짜순으로 정렬 (오래된 순)
    return historicalData.sort((a, b) => a.date.localeCompare(b.date));
  }
  
  /**
   * 검색량 트렌드 계산
   */
  private calculateSearchVolumeTrend(historicalData: any[]): number {
    if (historicalData.length < 2) return 0;
    
    // 간단한 선형 회귀로 추세 계산
    const n = historicalData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = historicalData[i].value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }
    
    // 기울기 계산
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // 평균 값 대비 기울기의 비율로 트렌드 정규화
    const avgY = sumY / n;
    return (slope * n) / avgY;
  }
  
  /**
   * 검색량 예측
   */
  private forecastSearchVolume(historicalData: any[], monthsAhead: number): any[] {
    if (historicalData.length < 6) return [];
    
    // 간단한 선형 회귀로 예측
    const n = historicalData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = historicalData[i].value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }
    
    // 선형 회귀 계수 계산
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const forecastData = [];
    const lastDate = new Date(historicalData[n - 1].date);
    
    for (let i = 1; i <= monthsAhead; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setMonth(lastDate.getMonth() + i);
      
      // 예측값 계산
      const x = n + i - 1;
      const predictedValue = Math.max(0, intercept + slope * x);
      
      forecastData.push({
        date: futureDate.toISOString().slice(0, 7), // YYYY-MM 형식
        value: Math.round(predictedValue)
      });
    }
    
    return forecastData;
  }
  
  /**
   * 계절 조정 성장률 계산
   */
  private calculateSeasonallyAdjustedGrowth(historicalData: any[]): number {
    // 실제 구현에서는 계절성 제거 후 성장률 계산 필요
    // 간단한 구현으로 대체
    
    if (historicalData.length < 12) return 0;
    
    // 1년 전 대비 성장률 (계절성 영향 최소화)
    const currentValue = historicalData[historicalData.length - 1].value;
    const yearAgoValue = historicalData[historicalData.length - 12].value;
    
    if (yearAgoValue === 0) return 0;
    return (currentValue - yearAgoValue) / yearAgoValue;
  }
  
  /**
   * 카테고리 대비 상대적 성장률 계산
   */
  private async calculateRelativeGrowth(keyword: string, category: string, historicalData: any[]): Promise<number> {
    // 실제 구현에서는 카테고리 평균 성장률 조회 필요
    // 간단한 구현으로 대체
    
    // 카테고리별 평균 성장률 (가정)
    const categoryGrowthRates: Record<string, number> = {
      'fashion': 0.05,
      'electronics': 0.08,
      'beauty': 0.07,
      'furniture': 0.03,
      'food': 0.04,
      'others': 0.04
    };
    
    // 키워드 성장률 계산
    const keywordGrowth = this.calculatePeriodGrowth(historicalData, 6);
    
    // 카테고리 평균 성장률
    const categoryGrowth = categoryGrowthRates[category] || 0.04;
    
    // 상대적 성장률 (카테고리 대비)
    return keywordGrowth - categoryGrowth;
  }
  
  /**
   * 특정 기간 성장률 계산
   */
  private calculatePeriodGrowth(historicalData: any[], months: number): number {
    if (historicalData.length < months) return 0;
    
    const currentValue = historicalData[historicalData.length - 1].value;
    const pastValue = historicalData[historicalData.length - months].value;
    
    if (pastValue === 0) return 0;
    return (currentValue - pastValue) / pastValue;
  }
  
  /**
   * 성장 점수 계산
   */
  private calculateGrowthScore(
    growthRates: Record<string, number>,
    forecastData: any[],
    relativeGrowth: number
  ): number {
    // 각 지표별 가중치
    const weights = {
      recentGrowth: 0.4,     // 최근 3개월 성장률
      mediumGrowth: 0.3,     // 중기 6개월 성장률
      longGrowth: 0.1,       // 장기 12개월 성장률
      forecast: 0.1,         // 예측 성장률
      relativeGrowth: 0.1    // 카테고리 대비 상대적 성장률
    };
    
    // 정규화 (0-1 범위로 변환)
    const normalizeGrowth = (growth: number) => {
      if (growth <= -0.5) return 0;  // -50% 이하면 0점
      if (growth >= 0.5) return 1;   // +50% 이상이면 1점
      return (growth + 0.5) / 1;     // -50% ~ +50% 범위를 0-1로 정규화
    };
    
    // 각 성장률 정규화
    const normalizedRecentGrowth = normalizeGrowth(growthRates['3month']);
    const normalizedMediumGrowth = normalizeGrowth(growthRates['6month']);
    const normalizedLongGrowth = normalizeGrowth(growthRates['12month']);
    
    // 예측 성장률 계산
    let forecastGrowth = 0;
    if (forecastData.length > 0) {
      const futureValue = forecastData[forecastData.length - 1].value;
      const currentValue = forecastData[0].value;
      if (currentValue > 0) {
        forecastGrowth = (futureValue - currentValue) / currentValue;
      }
    }
    const normalizedForecastGrowth = normalizeGrowth(forecastGrowth);
    
    // 상대적 성장률 정규화
    const normalizedRelativeGrowth = normalizeGrowth(relativeGrowth);
    
    // 가중 합계 계산
    const weightedSum = 
      normalizedRecentGrowth * weights.recentGrowth +
      normalizedMediumGrowth * weights.mediumGrowth +
      normalizedLongGrowth * weights.longGrowth +
      normalizedForecastGrowth * weights.forecast +
      normalizedRelativeGrowth * weights.relativeGrowth;
    
    // 0-100 점수로 변환
    return Math.round(weightedSum * 100);
  }
  
  /**
   * 트렌드 방향 결정
   */
  private getTrendDirection(recentGrowth: number): string {
    if (recentGrowth > 0.05) return '상승';
    if (recentGrowth < -0.05) return '하락';
    return '유지';
  }
  
  /**
   * 카테고리별 평균 마진율 조회
   */
  private getCategoryMarginRate(category: string): number {
    // 카테고리별 평균 마진율 (가정)
    const categoryMarginRates: Record<string, number> = {
      'fashion': 0.45,
      'electronics': 0.25,
      'beauty': 0.50,
      'furniture': 0.35,
      'food': 0.30,
      'others': 0.35
    };
    
    return categoryMarginRates[category] || 0.35;
  }
  
  /**
   * 수익성 점수 계산
   */
  private calculateProfitScore(
    estimatedMargin: number,
    marginToCpcRatio: number,
    avgPrice: number
  ): number {
    // 각 지표별 가중치
    const weights = {
      margin: 0.4,          // 예상 마진
      marginToCpcRatio: 0.4, // 마진/CPC 비율 (ROI)
      avgPrice: 0.2          // 평균 가격
    };
    
    // 정규화 (0-1 범위로 변환)
    const normalizedMargin = Math.min(estimatedMargin / 50000, 1); // 5만원을 최대로 가정
    const normalizedMarginToCpcRatio = Math.min(marginToCpcRatio / 10, 1); // 10배를 최대로 가정
    const normalizedAvgPrice = Math.min(avgPrice / 200000, 1); // 20만원을 최대로 가정
    
    // 가중 합계 계산
    const weightedSum = 
      normalizedMargin * weights.margin +
      normalizedMarginToCpcRatio * weights.marginToCpcRatio +
      normalizedAvgPrice * weights.avgPrice;
    
    // 0-100 점수로 변환
    return Math.round(weightedSum * 100);
  }
  
  /**
   * 수익성 레벨 결정
   */
  private getProfitabilityLevel(profitScore: number): string {
    if (profitScore >= 80) return '매우 높음';
    if (profitScore >= 60) return '높음';
    if (profitScore >= 40) return '보통';
    if (profitScore >= 20) return '낮음';
    return '매우 낮음';
  }
  
  /**
   * 마케팅 효율 점수 계산
   */
  private calculateMarketingEfficiencyScore(
    ctr: number,
    cvr: number,
    searchVolume: number
  ): number {
    // 각 지표별 가중치
    const weights = {
      ctr: 0.4,           // 클릭률
      cvr: 0.4,           // 전환률
      searchVolume: 0.2   // 검색량
    };
    
    // 정규화 (0-1 범위로 변환)
    const normalizedCtr = Math.min(ctr / 0.05, 1); // 5%를 최대로 가정
    const normalizedCvr = Math.min(cvr / 0.03, 1); // 3%를 최대로 가정
    const normalizedSearchVolume = Math.min(searchVolume / 10000, 1); // 1만을 최대로 가정
    
    // 가중 합계 계산
    const weightedSum = 
      normalizedCtr * weights.ctr +
      normalizedCvr * weights.cvr +
      normalizedSearchVolume * weights.searchVolume;
    
    // 0-100 점수로 변환
    return Math.round(weightedSum * 100);
  }
  
  /**
   * 효율성 레벨 결정
   */
  private getEfficiencyLevel(efficiencyScore: number): string {
    if (efficiencyScore >= 80) return '매우 높음';
    if (efficiencyScore >= 60) return '높음';
    if (efficiencyScore >= 40) return '보통';
    if (efficiencyScore >= 20) return '낮음';
    return '매우 낮음';
  }
  
  /**
   * 시계열 분해 (추세, 계절성, 잔차)
   */
  private decomposeTimeSeries(historicalData: any[]): any {
    // 실제 구현에서는 시계열 분해 라이브러리 사용 필요
    // 간단한 구현으로 대체
    
    if (historicalData.length < 12) return { trend: [], seasonal: [], residual: [] };
    
    const values = historicalData.map(d => d.value);
    const n = values.length;
    
    // 이동 평균으로 추세 추출 (12개월 이동 평균)
    const trend = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      let count = 0;
      
      // 전후 6개월 평균 (윈도우 크기 13)
      for (let j = Math.max(0, i - 6); j <= Math.min(n - 1, i + 6); j++) {
        sum += values[j];
        count++;
      }
      
      trend[i] = sum / count;
    }
    
    // 추세 제거
    const detrended = values.map((value, i) => value - trend[i]);
    
    // 계절성 추출 (같은 월의 평균)
    const seasonal = new Array(n).fill(0);
    const monthlyAvg = new Array(12).fill(0);
    const monthlyCount = new Array(12).fill(0);
    
    // 각 월별 평균 계산
    for (let i = 0; i < n; i++) {
      const month = new Date(historicalData[i].date).getMonth();
      monthlyAvg[month] += detrended[i];
      monthlyCount[month]++;
    }
    
    // 평균 계산
    for (let i = 0; i < 12; i++) {
      if (monthlyCount[i] > 0) {
        monthlyAvg[i] /= monthlyCount[i];
      }
    }
    
    // 계절성 성분 할당
    for (let i = 0; i < n; i++) {
      const month = new Date(historicalData[i].date).getMonth();
      seasonal[i] = monthlyAvg[month];
    }
    
    // 잔차 = 원본 - 추세 - 계절성
    const residual = values.map((value, i) => value - trend[i] - seasonal[i]);
    
    return {
      trend,
      seasonal,
      residual
    };
  }
  
  /**
   * 계절성 강도 계산
   */
  private calculateSeasonalityStrength(seasonalComponents: any): number {
    // 실제 구현에서는 계절성 분산 / 총 분산 비율로 계산
    // 간단한 구현으로 대체
    
    const seasonal = seasonalComponents.seasonal || [];
    if (seasonal.length === 0) return 0;
    
    // 계절성 분산 계산
    const seasonalVar = this.calculateVariance(seasonal);
    
    // 적정 수준의 계절성 기준값 설정
    const threshold = 1000; // 임의의 기준값
    
    // 정규화된 계절성 강도 (0-1 사이)
    return Math.min(seasonalVar / threshold, 1);
  }
  
  /**
   * 분산 계산 헬퍼 함수
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  /**
   * 피크 월 식별
   */
  private identifyPeakMonths(seasonalComponents: any): number[] {
    const seasonal = seasonalComponents.seasonal || [];
    if (seasonal.length < 12) return [];
    
    // 월별 계절성 값
    const monthlySeasonality = new Array(12).fill(0);
    
    // 최근 12개월 데이터만 사용
    const recentSeasonal = seasonal.slice(-12);
    
    for (let i = 0; i < recentSeasonal.length; i++) {
      monthlySeasonality[i] = recentSeasonal[i];
    }
    
    // 평균 이상인 월 찾기
    const mean = monthlySeasonality.reduce((sum, val) => sum + val, 0) / 12;
    const peakMonths = [];
    
    for (let i = 0; i < 12; i++) {
      if (monthlySeasonality[i] > mean) {
        peakMonths.push(i + 1); // 1-indexed 월
      }
    }
    
    return peakMonths;
  }
  
  /**
   * 현재 시즌 상태 확인
   */
  private getCurrentSeasonStatus(seasonalComponents: any): string {
    const seasonal = seasonalComponents.seasonal || [];
    if (seasonal.length === 0) return '보통';
    
    // 현재 월의 계절성 값
    const currentMonth = new Date().getMonth();
    const recentSeasonality = seasonal.slice(-12);
    const currentSeasonality = recentSeasonality[currentMonth] || 0;
    
    // 계절성 값에 따른 상태 판단
    if (currentSeasonality > 200) return '성수기';
    if (currentSeasonality < -200) return '비수기';
    return '보통';
  }
  
  /**
   * 종합 등급 부여
   */
  private getOverallGrade(score: number): string {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  }
}