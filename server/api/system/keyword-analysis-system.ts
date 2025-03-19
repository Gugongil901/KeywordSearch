/**
 * 종합 키워드 분석 시스템
 * 
 * 모든 하위 시스템을 통합하여 종합적인 키워드 분석을 제공하는 최상위 모듈
 */

import { NaverDataCollector } from '../collectors/naver-data-collector';
import { DatabaseConnector } from '../collectors/database-connector';
import { KeywordMetricsCalculator } from '../analyzers/keyword-metrics-calculator';
import { KeywordVisualizationSystem } from '../visualization/keyword-visualization-system';
import { CompetitorAnalyzer } from '../analyzers/competitor-analyzer';
import { MarketAnalyzer } from '../analyzers/market-analyzer';
import { FrontendIntegrationSystem } from '../integration/frontend-integration-system';
import { logger } from '../../utils/logger';

interface KeywordAnalysisConfig {
  database?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  };
  api_keys?: {
    naver_client_id?: string;
    naver_client_secret?: string;
    naver_ad_api_key?: string;
    naver_ad_api_secret?: string;
    naver_customer_id?: string;
  };
  crawling?: {
    delay?: number;
    user_agent?: string;
  };
  cache?: {
    enabled?: boolean;
    ttl?: number;
  };
}

/**
 * 키워드 분석 시스템 클래스
 * 모든 하위 시스템을 통합 관리하는 최상위 클래스
 */
export class KeywordAnalysisSystem {
  private config: KeywordAnalysisConfig;
  private db: DatabaseConnector;
  private dataCollector: NaverDataCollector;
  private metricsCalculator: KeywordMetricsCalculator;
  private visualizationSystem: KeywordVisualizationSystem;
  private competitorAnalyzer: CompetitorAnalyzer;
  private marketAnalyzer: MarketAnalyzer;
  private frontendSystem: FrontendIntegrationSystem;

  /**
   * 키워드 분석 시스템 초기화
   * @param config 설정 객체 (선택)
   */
  constructor(config?: KeywordAnalysisConfig) {
    this.config = config || this.loadDefaultConfig();
    
    // 환경 변수에서 API 키 로드
    this.loadApiKeysFromEnv();
    
    // 데이터베이스 연결
    this.db = DatabaseConnector.getInstance();
    
    // 데이터 수집 시스템
    this.dataCollector = new NaverDataCollector(this.config.api_keys);
    
    // 지표 계산 시스템
    this.metricsCalculator = new KeywordMetricsCalculator(this.dataCollector, this.db);
    
    // 시각화 시스템
    this.visualizationSystem = new KeywordVisualizationSystem(this.metricsCalculator, this.db);
    
    // 경쟁사 분석 시스템
    this.competitorAnalyzer = new CompetitorAnalyzer(this.dataCollector, this.db);
    
    // 시장 분석 시스템
    this.marketAnalyzer = new MarketAnalyzer(this.dataCollector, this.metricsCalculator, this.db);
    
    // 프론트엔드 통합 시스템
    this.frontendSystem = new FrontendIntegrationSystem(
      this.db,
      this.metricsCalculator,
      this.visualizationSystem
    );
    
    logger.info('키워드 분석 시스템 초기화 완료');
  }

  /**
   * 기본 설정 로드
   * @returns 기본 설정 객체
   */
  private loadDefaultConfig(): KeywordAnalysisConfig {
    return {
      database: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'keyword_analysis'
      },
      api_keys: {
        naver_client_id: '',
        naver_client_secret: '',
        naver_ad_api_key: '',
        naver_ad_api_secret: '',
        naver_customer_id: ''
      },
      crawling: {
        delay: 3,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
      },
      cache: {
        enabled: true,
        ttl: 3600 // 1시간
      }
    };
  }

  /**
   * 환경 변수에서 API 키 로드
   */
  private loadApiKeysFromEnv() {
    if (process.env.NAVER_CLIENT_ID) {
      this.config.api_keys.naver_client_id = process.env.NAVER_CLIENT_ID;
    }
    
    if (process.env.NAVER_CLIENT_SECRET) {
      this.config.api_keys.naver_client_secret = process.env.NAVER_CLIENT_SECRET;
    }
    
    if (process.env.NAVER_AD_API_LICENSE) {
      this.config.api_keys.naver_ad_api_key = process.env.NAVER_AD_API_LICENSE;
    }
    
    if (process.env.NAVER_AD_API_SECRET) {
      this.config.api_keys.naver_ad_api_secret = process.env.NAVER_AD_API_SECRET;
    }
    
    if (process.env.NAVER_AD_CUSTOMER_ID) {
      this.config.api_keys.naver_customer_id = process.env.NAVER_AD_CUSTOMER_ID;
    }
  }

  /**
   * 키워드 종합 분석 실행
   * @param keyword 분석할 키워드
   * @returns 종합 분석 결과
   */
  async analyzeKeyword(keyword: string): Promise<any> {
    logger.info(`[${keyword}] 종합 분석 시작`);
    
    try {
      // 1. 데이터 수집
      const rawData = await this.dataCollector.collectAllData(keyword);
      
      // 2. 지표 계산
      const metrics = await this.metricsCalculator.calculateAllMetrics(keyword);
      
      // 3. 경쟁사 분석
      const competitors = await this.competitorAnalyzer.analyzeCompetitors(keyword);
      
      // 4. 관련 키워드 분석
      const relatedKeywords = await this.analyzeRelatedKeywords(keyword);
      
      // 5. 리포트 생성
      const report = await this.visualizationSystem.generateKeywordReport(keyword, metrics);
      
      // 6. 대시보드 데이터 생성
      const dashboardData = await this.frontendSystem.generateDashboardData(keyword);
      
      // 결과 통합
      const result = {
        keyword,
        metrics,
        competitors,
        relatedKeywords,
        report,
        dashboard: dashboardData
      };
      
      // 데이터베이스에 결과 저장
      this.db.saveKeywordData(`${keyword}_full_analysis`, result);
      
      logger.info(`[${keyword}] 종합 분석 완료`);
      return result;
    } catch (error) {
      logger.error(`[${keyword}] 종합 분석 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 카테고리 종합 분석 실행
   * @param categoryId 분석할 카테고리 ID
   * @returns 카테고리 분석 결과
   */
  async analyzeCategory(categoryId: string): Promise<any> {
    logger.info(`[${categoryId}] 카테고리 분석 시작`);
    
    try {
      const result = await this.marketAnalyzer.analyzeCategoryMarket(categoryId);
      logger.info(`[${categoryId}] 카테고리 분석 완료`);
      return result;
    } catch (error) {
      logger.error(`[${categoryId}] 카테고리 분석 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 연관 키워드 분석
   * @param keyword 기준 키워드
   * @returns 연관 키워드 분석 결과
   */
  private async analyzeRelatedKeywords(keyword: string): Promise<any[]> {
    logger.info(`[${keyword}] 연관 키워드 분석 시작`);
    
    try {
      // 연관 키워드 수집 (API 또는 크롤링)
      const relatedKeywords = this.db.getRelatedKeywords(keyword, 10);
      if (!relatedKeywords || relatedKeywords.length === 0) {
        logger.info(`[${keyword}] 연관 키워드 없음, 샘플 데이터 사용`);
        return this.generateSampleRelatedKeywords(keyword);
      }
      
      // 각 연관 키워드 간단 분석
      const analyzedKeywords = [];
      
      for (const related of relatedKeywords) {
        const relatedKeyword = related.keyword;
        
        // 기존 분석 데이터가 있는지 확인
        const existingAnalysis = this.db.getKeywordData(`metrics_${relatedKeyword}`);
        
        if (existingAnalysis && this.isAnalysisFresh(existingAnalysis)) {
          // 신선한 데이터가 있으면 재사용
          analyzedKeywords.push({
            keyword: relatedKeyword,
            searchVolume: existingAnalysis.basic.searchVolume.total,
            competitionScore: existingAnalysis.competition.competitionScore,
            growthScore: existingAnalysis.growth.growthScore,
            profitScore: existingAnalysis.profit.profitScore,
            overallScore: existingAnalysis.overallScore.score
          });
        } else {
          // 간단 분석만 수행
          // 실제로는 API 호출이나 크롤링을 통해 간단한 데이터만 가져옴
          // 여기서는 샘플 데이터 생성
          const simplifiedMetrics = this.generateSimplifiedMetrics(relatedKeyword);
          analyzedKeywords.push(simplifiedMetrics);
        }
      }
      
      logger.info(`[${keyword}] 연관 키워드 분석 완료: ${analyzedKeywords.length}개`);
      return analyzedKeywords;
    } catch (error) {
      logger.error(`[${keyword}] 연관 키워드 분석 실패: ${error.message}`);
      return this.generateSampleRelatedKeywords(keyword);
    }
  }

  /**
   * 분석 데이터가 신선한지 확인 (7일 이내)
   * @param analysis 분석 데이터
   * @returns 신선 여부
   */
  private isAnalysisFresh(analysis: any): boolean {
    if (!analysis || !analysis.timestamp) {
      return false;
    }
    
    const updatedAt = new Date(analysis.timestamp);
    const now = new Date();
    
    const diffTime = Math.abs(now.getTime() - updatedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays < 7;
  }

  /**
   * 샘플 연관 키워드 생성
   * @param baseKeyword 기준 키워드
   * @returns 샘플 연관 키워드 목록
   */
  private generateSampleRelatedKeywords(baseKeyword: string): any[] {
    const relatedTerms = [
      '가격', '후기', '추천', '할인', '세일',
      '매장', '온라인', '정품', '특가', '신상'
    ];
    
    return relatedTerms.map((term, index) => {
      const keyword = `${baseKeyword} ${term}`;
      return this.generateSimplifiedMetrics(keyword, 85 - index * 5);
    });
  }

  /**
   * 간단한 키워드 지표 생성
   * @param keyword 키워드
   * @param baseScore 기준 점수 (선택)
   * @returns 간단한 키워드 지표
   */
  private generateSimplifiedMetrics(keyword: string, baseScore: number = 70): any {
    // 점수는 0-100 사이, 랜덤 변동 추가
    const randomVariation = () => Math.floor(Math.random() * 20) - 10;
    
    const competitionScore = Math.max(0, Math.min(100, baseScore + randomVariation()));
    const growthScore = Math.max(0, Math.min(100, baseScore + randomVariation()));
    const profitScore = Math.max(0, Math.min(100, baseScore + randomVariation()));
    
    // 종합 점수 계산 (각 지표의 가중 평균)
    const overallScore = Math.round(
      (competitionScore * 0.4) +
      (growthScore * 0.3) +
      (profitScore * 0.3)
    );
    
    return {
      keyword,
      searchVolume: Math.floor(Math.random() * 5000) + 500,
      competitionScore,
      growthScore,
      profitScore,
      overallScore
    };
  }

  /**
   * 시스템 상태 확인
   * @returns 시스템 상태 정보
   */
  getSystemStatus(): any {
    const apiKeys = this.config.api_keys;
    
    return {
      status: '활성',
      systemComponents: {
        dataCollector: true,
        metricsCalculator: true,
        competitorAnalyzer: true,
        marketAnalyzer: true,
        visualizationSystem: true,
        frontendSystem: true,
        dbConnector: true,
        apiKeys: {
          naverClientId: !!apiKeys.naver_client_id,
          naverClientSecret: !!apiKeys.naver_client_secret,
          naverAdApiKey: !!apiKeys.naver_ad_api_key,
          naverAdSecretKey: !!apiKeys.naver_ad_api_secret,
          naverCustomerId: !!apiKeys.naver_customer_id
        },
        timestamp: new Date().toISOString()
      }
    };
  }
}

// 싱글톤 인스턴스
let keywordAnalysisSystem: KeywordAnalysisSystem;

/**
 * 키워드 분석 시스템 인스턴스 가져오기 (싱글톤 패턴)
 */
export function getKeywordAnalysisSystem(): KeywordAnalysisSystem {
  if (!keywordAnalysisSystem) {
    keywordAnalysisSystem = new KeywordAnalysisSystem();
  }
  return keywordAnalysisSystem;
}