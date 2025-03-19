/**
 * 시각화 및 리포트 생성 시스템
 * 
 * 키워드 분석 결과를 시각화하고 인사이트와 추천사항이 포함된 리포트를 생성하는 모듈
 */

import { logger } from '../../utils/logger';
import { KeywordMetricsCalculator } from '../analyzers/keyword-metrics-calculator';
import { DatabaseConnector } from '../collectors/database-connector';

// 키워드 리포트 인터페이스
interface KeywordReport {
  keyword: string;
  generatedDate: string;
  summary: KeywordSummary;
  charts: any;
  insights: Insight[];
  recommendations: Recommendation[];
}

// 키워드 요약 인터페이스
interface KeywordSummary {
  keyword: string;
  searchVolume: {
    total: number;
    pc: number;
    mobile: number;
  };
  productCount: number;
  competitionLevel: string;
  growthTrend: string;
  profitPotential: string;
  overallScore: number;
  overallGrade: string;
}

// 인사이트 인터페이스
interface Insight {
  type: string;
  title: string;
  description: string;
}

// 추천사항 인터페이스
interface Recommendation {
  type: string;
  title: string;
  description: string;
}

/**
 * 키워드 시각화 시스템 클래스
 */
export class KeywordVisualizationSystem {
  private metricsCalculator: KeywordMetricsCalculator;
  private db: DatabaseConnector;
  
  constructor(metricsCalculator: KeywordMetricsCalculator, dbConnector: DatabaseConnector) {
    this.metricsCalculator = metricsCalculator;
    this.db = dbConnector;
    logger.info('키워드 시각화 시스템 초기화 완료');
  }
  
  /**
   * 키워드 분석 리포트 생성
   * @param keyword 키워드
   * @param metrics 분석 지표 (없으면 새로 계산)
   * @returns 키워드 리포트
   */
  async generateKeywordReport(keyword: string, metrics?: any): Promise<KeywordReport> {
    try {
      logger.info(`[${keyword}] 키워드 리포트 생성 시작`);
      
      // 메트릭스 데이터 확인 또는 계산
      if (!metrics) {
        // 데이터베이스에서 기존 지표 조회
        metrics = this.db.getKeywordData(`metrics_${keyword}`);
        
        if (!metrics) {
          // 지표가 없으면 계산
          metrics = await this.metricsCalculator.calculateAllMetrics(keyword);
        }
      }
      
      // 현재 날짜 생성
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      // 리포트 데이터 구성
      const report: KeywordReport = {
        keyword,
        generatedDate: formattedDate,
        summary: this.generateSummary(keyword, metrics),
        charts: this.generateCharts(keyword, metrics),
        insights: this.generateInsights(keyword, metrics),
        recommendations: this.generateRecommendations(keyword, metrics)
      };
      
      // 결과 저장
      this.db.saveKeywordData(`report_${keyword}`, report);
      
      logger.info(`[${keyword}] 키워드 리포트 생성 완료`);
      
      return report;
    } catch (error) {
      logger.error(`[${keyword}] 키워드 리포트 생성 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 키워드 분석 요약 생성
   * @param keyword 키워드
   * @param metrics 분석 지표
   * @returns 키워드 요약
   */
  private generateSummary(keyword: string, metrics: any): KeywordSummary {
    const basic = metrics?.basic || {};
    const competition = metrics?.competition || {};
    const growth = metrics?.growth || {};
    const profit = metrics?.profit || {};
    const overall = metrics?.overallScore || {};
    
    return {
      keyword,
      searchVolume: {
        total: basic.searchVolume?.total || 0,
        pc: basic.searchVolume?.pc || 0,
        mobile: basic.searchVolume?.mobile || 0
      },
      productCount: basic.productCount || 0,
      competitionLevel: competition.difficultyLevel || 'unknown',
      growthTrend: growth.trendDirection || 'stable',
      profitPotential: profit.profitabilityLevel || 'unknown',
      overallScore: overall.score || 0,
      overallGrade: overall.grade || 'unknown'
    };
  }
  
  /**
   * 차트 데이터 생성
   * @param keyword 키워드
   * @param metrics 분석 지표
   * @returns 차트 데이터
   */
  private generateCharts(keyword: string, metrics: any): any {
    const charts: any = {};
    
    // 1. 검색량 트렌드 차트
    const historicalData = this.getHistoricalData(keyword, 12);
    charts.searchVolumeTrend = this.prepareTrendChartData(historicalData);
    
    // 2. 경쟁 분석 레이더 차트
    const competition = metrics?.competition || {};
    charts.competitionRadar = {
      labels: ['광고 비율', '브랜드 비율', '입찰가', '시장 집중도', '리뷰 비율'],
      data: [
        (competition.adRatio || 0) * 100,
        (competition.brandRatio || 0) * 100,
        Math.min(100, (competition.bidPrice || 0) / 100),  // 입찰가 정규화
        Math.min(100, (competition.marketConcentration || 0) * 100),  // 시장 집중도 정규화
        (competition.reviewRatio || 0) * 10  // 리뷰 비율 정규화
      ]
    };
    
    // 3. 성장성 예측 차트
    const growth = metrics?.growth || {};
    const forecast = growth.forecast || [];
    charts.growthForecast = {
      labels: forecast.map((_: any, i: number) => `Month ${i+1}`),
      data: {
        forecast: forecast.map((f: any) => f.value || 0)
      }
    };
    
    // 4. 가격 분포 히스토그램
    const priceStats = metrics?.basic?.priceStats || {};
    if (priceStats) {
      // 가격 구간 설정 (예시)
      const priceRanges = ['~1만원', '1~3만원', '3~5만원', '5~10만원', '10만원~'];
      
      // 실제 구현에서는 상품 데이터에서 구간별 분포 계산
      // 여기서는 예시 데이터 사용
      charts.priceDistribution = {
        labels: priceRanges,
        data: [20, 35, 25, 15, 5]  // 예시 데이터 (실제 구현에서는 계산 필요)
      };
    }
    
    // 5. 종합 점수 게이지 차트
    const overall = metrics?.overallScore || {};
    const categoryScores = overall.categoryScores || {};
    charts.overallScore = {
      score: overall.score || 0,
      categoryScores: [
        { name: '성장성', score: categoryScores.growth || 0 },
        { name: '경쟁도', score: 100 - (categoryScores.competition || 0) },  // 경쟁도는 낮을수록 좋음
        { name: '수익성', score: categoryScores.profit || 0 },
        { name: '마케팅 효율', score: categoryScores.marketing || 0 },
        { name: '계절성', score: categoryScores.seasonality || 0 }
      ]
    };
    
    return charts;
  }
  
  /**
   * 과거 데이터 조회
   * @param keyword 키워드
   * @param months 조회할 개월 수
   * @returns 과거 데이터
   */
  private getHistoricalData(keyword: string, months: number): any[] {
    try {
      // 데이터베이스에서 과거 데이터 조회
      const storedData = this.db.getKeywordData(`history_${keyword}`);
      
      if (storedData && Array.isArray(storedData)) {
        return storedData;
      }
      
      // 과거 데이터가 없는 경우 메트릭스에서 조회
      const metrics = this.db.getKeywordData(`metrics_${keyword}`);
      if (metrics?.growth?.forecast) {
        return metrics.growth.forecast;
      }
      
      // 데이터가 없는 경우 빈 배열 반환
      return [];
    } catch (error) {
      logger.error(`과거 데이터 조회 오류: ${error}`);
      return [];
    }
  }
  
  /**
   * 트렌드 차트 데이터 준비
   * @param historicalData 과거 데이터
   * @returns 차트 데이터
   */
  private prepareTrendChartData(historicalData: any[]): any {
    if (!historicalData || historicalData.length === 0) {
      // 빈 데이터 반환
      return {
        labels: Array.from({ length: 12 }, (_, i) => `Month ${i+1}`),
        data: Array(12).fill(0)
      };
    }
    
    const labels = historicalData.map(data => data.date || `Month ${historicalData.indexOf(data) + 1}`);
    const data = historicalData.map(data => data.value || 0);
    
    return {
      labels,
      data
    };
  }
  
  /**
   * 키워드 분석 인사이트 생성
   * @param keyword 키워드
   * @param metrics 분석 지표
   * @returns 인사이트 목록
   */
  private generateInsights(keyword: string, metrics: any): Insight[] {
    const insights: Insight[] = [];
    
    // 1. 검색량 관련 인사이트
    const basic = metrics?.basic || {};
    const searchVolume = basic.searchVolume?.total || 0;
    const mobileRatio = searchVolume ? (basic.searchVolume?.mobile || 0) / searchVolume : 0;
    
    if (searchVolume > 10000) {
      insights.push({
        type: 'volume',
        title: '높은 검색량',
        description: `'${keyword}'는 월 ${this.formatNumber(searchVolume)}회의 높은 검색량을 보이는 인기 키워드입니다.`
      });
    }
    
    if (mobileRatio > 0.7) {
      insights.push({
        type: 'device',
        title: '모바일 중심 키워드',
        description: `'${keyword}'는 검색의 ${(mobileRatio * 100).toFixed(1)}%가 모바일에서 이루어지는 모바일 중심 키워드입니다.`
      });
    }
    
    // 2. 경쟁 관련 인사이트
    const competition = metrics?.competition || {};
    const competitionScore = competition.competitionScore || 50;
    
    if (competitionScore < 30) {
      insights.push({
        type: 'competition',
        title: '낮은 경쟁도',
        description: `'${keyword}'는 경쟁도가 낮은 블루오션 키워드입니다. 진입 장벽이 낮습니다.`
      });
    } else if (competitionScore > 70) {
      insights.push({
        type: 'competition',
        title: '높은 경쟁도',
        description: `'${keyword}'는 경쟁이 매우 치열한 레드오션 키워드입니다. 차별화 전략이 필요합니다.`
      });
    }
    
    // 3. 성장성 관련 인사이트
    const growth = metrics?.growth || {};
    const growthRates = growth.growthRates || {};
    
    if (growthRates['3month'] > 20) {
      insights.push({
        type: 'growth',
        title: '급성장 키워드',
        description: `'${keyword}'는 최근 3개월간 ${growthRates['3month']}% 성장한 급상승 키워드입니다.`
      });
    } else if (growthRates['3month'] < -15) {
      insights.push({
        type: 'growth',
        title: '하락 추세 키워드',
        description: `'${keyword}'는 최근 3개월간 ${Math.abs(growthRates['3month'])}% 하락한 키워드입니다. 주의가 필요합니다.`
      });
    }
    
    // 4. 수익성 관련 인사이트
    const profit = metrics?.profit || {};
    const marginToCpc = profit.marginToCpcRatio || 0;
    
    if (marginToCpc > 3) {
      insights.push({
        type: 'profit',
        title: '높은 광고 수익성',
        description: `'${keyword}'는 CPC 대비 마진이 ${marginToCpc.toFixed(1)}배로 광고 효율이 매우 높은 키워드입니다.`
      });
    }
    
    // 5. 계절성 관련 인사이트
    const seasonality = metrics?.seasonality || {};
    const seasonalityStrength = seasonality.seasonalityStrength || 0;
    
    if (seasonalityStrength > 0.5) {
      const peakMonths = seasonality.peakMonths || [];
      const peakMonthsStr = peakMonths.slice(0, 2).map(m => `${m}월`).join(', ');
      
      insights.push({
        type: 'seasonality',
        title: '강한 계절성',
        description: `'${keyword}'는 ${peakMonthsStr} 등에 검색량이 집중되는 계절성 키워드입니다.`
      });
    }
    
    return insights;
  }
  
  /**
   * 키워드 분석 기반 추천사항 생성
   * @param keyword 키워드
   * @param metrics 분석 지표
   * @returns 추천사항 목록
   */
  private generateRecommendations(keyword: string, metrics: any): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // 지표 데이터 추출
    const competition = metrics?.competition || {};
    const growth = metrics?.growth || {};
    const profit = metrics?.profit || {};
    const basic = metrics?.basic || {};
    
    const competitionScore = competition.competitionScore || 50;
    const growthRate3m = growth.growthRates?.['3month'] || 0;
    const searchVolume = basic.searchVolume?.total || 0;
    
    // 1. 진입 전략 추천
    if (competitionScore < 40 && growthRate3m > 10) {
      recommendations.push({
        type: 'entry',
        title: '적극적 진입 추천',
        description: '경쟁도가 낮고 성장률이 높은 유망 키워드입니다. 초기 진입자 이점을 활용하여 적극적으로 공략하는 것이 좋습니다.'
      });
    } else if (competitionScore > 70 && growthRate3m < 5) {
      recommendations.push({
        type: 'entry',
        title: '차별화 전략 필요',
        description: '경쟁이 치열하고 성장이 정체된 시장입니다. 명확한 차별화 포인트 없이는 진입을 재고하세요.'
      });
    }
    
    // 2. 가격 전략 추천
    const priceStats = basic.priceStats || {};
    const avgPrice = priceStats.avg || 0;
    
    if (competitionScore > 60) {
      recommendations.push({
        type: 'price',
        title: '가격 차별화 전략',
        description: `경쟁이 치열한 시장입니다. 평균 가격(${this.formatNumber(avgPrice)}원)보다 10-15% 낮은 가격으로 초기 진입 후 리뷰를 확보하세요.`
      });
    }
    
    // 3. 광고 전략 추천
    const marginToCpc = profit.marginToCpcRatio || 0;
    
    if (marginToCpc > 2.5) {
      recommendations.push({
        type: 'advertising',
        title: '광고 투자 증대 추천',
        description: '마진 대비 광고 비용이 효율적입니다. 검색 광고 예산을 늘려 시장점유율을 확대하세요.'
      });
    } else if (marginToCpc < 1.2) {
      recommendations.push({
        type: 'advertising',
        title: '광고 효율 개선 필요',
        description: '현재 광고 효율이 낮습니다. 키워드 최적화와 광고 소재 개선으로 클릭률(CTR)을 높이세요.'
      });
    }
    
    // 4. 상품 전략 추천
    if (searchVolume > 5000 && competitionScore < 50) {
      recommendations.push({
        type: 'product',
        title: '다양한 가격대 상품 구성 추천',
        description: '검색량이 많고 경쟁이 적은 시장입니다. 다양한 가격대의 상품 라인업으로 시장을 넓게 공략하세요.'
      });
    }
    
    // 5. 계절성 전략 추천
    const seasonality = metrics?.seasonality || {};
    const seasonalityStrength = seasonality.seasonalityStrength || 0;
    const currentStatus = seasonality.currentSeasonStatus || '';
    
    if (seasonalityStrength > 0.4) {
      const peakMonths = seasonality.peakMonths || [];
      
      if (currentStatus === 'approaching_peak' || currentStatus === '성수기 접근 중') {
        recommendations.push({
          type: 'seasonal',
          title: '성수기 준비 필요',
          description: `곧 성수기(${peakMonths.slice(0, 2).map(m => `${m}월`).join(', ')})가 다가옵니다. 재고를 충분히 확보하고 프로모션을 준비하세요.`
        });
      } else if (currentStatus === 'in_peak' || currentStatus === '성수기') {
        recommendations.push({
          type: 'seasonal',
          title: '성수기 최대 활용',
          description: '현재 성수기 중입니다. 광고 예산을 최대화하고 특별 프로모션으로 판매를 극대화하세요.'
        });
      }
    }
    
    // 6. 연관 키워드 전략
    const relatedKeywords = this.getRelatedKeywords(keyword, 5);
    if (relatedKeywords && relatedKeywords.length > 0) {
      // 경쟁도가 낮은 연관 키워드 필터링
      const lowCompetitionRelated = relatedKeywords.filter(k => k.competitionScore < 40);
      
      if (lowCompetitionRelated.length > 0) {
        const relatedKeywordsStr = lowCompetitionRelated
          .slice(0, 3)
          .map(k => `'${k.keyword}'`)
          .join(', ');
        
        recommendations.push({
          type: 'related',
          title: '연관 틈새 키워드 활용',
          description: `경쟁이 적은 연관 키워드 ${relatedKeywordsStr} 등을 상품 설명에 추가하여 노출을 확대하세요.`
        });
      }
    }
    
    // 상위 5개만 반환
    return recommendations.slice(0, 5);
  }
  
  /**
   * 연관 키워드 조회
   * @param keyword 키워드
   * @param limit 조회 개수
   * @returns 연관 키워드 목록
   */
  private getRelatedKeywords(keyword: string, limit: number): any[] {
    try {
      // 데이터베이스에서 연관 키워드 조회 (실제 구현 필요)
      const storedData = this.db.getKeywordData(`related_keywords_${keyword}`);
      
      if (storedData && Array.isArray(storedData)) {
        return storedData.slice(0, limit);
      }
      
      // 데이터가 없는 경우 빈 배열 반환
      return [];
    } catch (error) {
      logger.error(`연관 키워드 조회 오류: ${error}`);
      return [];
    }
  }
  
  /**
   * 숫자 포맷팅 (천 단위 콤마)
   * @param num 포맷팅할 숫자
   * @returns 포맷팅된 문자열
   */
  private formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}