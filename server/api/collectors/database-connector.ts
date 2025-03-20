/**
 * 데이터베이스 커넥터
 * 키워드 데이터를 저장하고 관리하는 모듈
 */

import { logger } from '../../utils/logger';
import {
  MonitoringConfig,
  MonitoringResult,
  CompetitorProduct
} from '../../../shared/schema';

/**
 * 데이터베이스 커넥터 클래스 (싱글톤 패턴)
 */
export class DatabaseConnector {
  private static instance: DatabaseConnector;
  private keywordData: Map<string, any>;
  private monitoringConfigs: Map<string, MonitoringConfig>;
  private competitorBaselines: Map<string, Record<string, CompetitorProduct[]>>;
  private monitoringResults: Map<string, MonitoringResult[]>;
  
  /**
   * 생성자 (private으로 외부에서 직접 인스턴스화 방지)
   */
  private constructor() {
    this.keywordData = new Map<string, any>();
    this.monitoringConfigs = new Map<string, MonitoringConfig>();
    this.competitorBaselines = new Map<string, Record<string, CompetitorProduct[]>>();
    this.monitoringResults = new Map<string, MonitoringResult[]>();
    logger.info('데이터베이스 커넥터 초기화 완료');
  }
  
  /**
   * 싱글톤 인스턴스 가져오기
   * @returns DatabaseConnector 인스턴스
   */
  public static getInstance(): DatabaseConnector {
    if (!DatabaseConnector.instance) {
      DatabaseConnector.instance = new DatabaseConnector();
    }
    return DatabaseConnector.instance;
  }
  
  /**
   * 키워드 데이터 저장
   * @param keyword 키워드
   * @param data 수집된 데이터
   */
  public saveKeywordData(keyword: string, data: any): void {
    try {
      const key = keyword.toLowerCase().trim();
      
      // 기존 데이터가 있으면 병합, 없으면 새로 저장
      const existingData = this.keywordData.get(key);
      if (existingData) {
        this.keywordData.set(key, { ...existingData, ...data, lastUpdated: new Date().toISOString() });
      } else {
        this.keywordData.set(key, { ...data, lastUpdated: new Date().toISOString() });
      }
      
      logger.info(`[${keyword}] 데이터 저장 완료`);
    } catch (error) {
      logger.error(`[${keyword}] 데이터 저장 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 키워드 데이터 조회
   * @param keyword 키워드
   * @returns 저장된 데이터
   */
  public getKeywordData(keyword: string): any {
    try {
      const key = keyword.toLowerCase().trim();
      return this.keywordData.get(key);
    } catch (error) {
      logger.error(`[${keyword}] 데이터 조회 오류: ${error}`);
      return null;
    }
  }
  
  /**
   * 저장된 모든 키워드 목록 조회
   * @returns 키워드 목록
   */
  public getAllKeywords(): string[] {
    return Array.from(this.keywordData.keys());
  }
  
  /**
   * 키워드 데이터 삭제
   * @param keyword 키워드
   * @returns 삭제 성공 여부
   */
  public deleteKeywordData(keyword: string): boolean {
    try {
      const key = keyword.toLowerCase().trim();
      const result = this.keywordData.delete(key);
      
      if (result) {
        logger.info(`[${keyword}] 데이터 삭제 완료`);
      } else {
        logger.warn(`[${keyword}] 삭제할 데이터가 없습니다`);
      }
      
      return result;
    } catch (error) {
      logger.error(`[${keyword}] 데이터 삭제 오류: ${error}`);
      return false;
    }
  }
  
  /**
   * 최근 업데이트된 키워드 목록 조회
   * @param limit 조회할 키워드 수
   * @returns 최근 업데이트된 키워드 목록
   */
  public getRecentKeywords(limit: number = 10): Array<{keyword: string, lastUpdated: string}> {
    try {
      const keywords = Array.from(this.keywordData.entries())
        .map(([keyword, data]) => ({
          keyword,
          lastUpdated: data.lastUpdated || new Date(0).toISOString()
        }))
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, limit);
      
      return keywords;
    } catch (error) {
      logger.error(`최근 키워드 조회 오류: ${error}`);
      return [];
    }
  }
  
  /**
   * 연관 키워드 조회
   * @param keyword 기준 키워드
   * @param limit 조회할 키워드 수
   * @returns 연관 키워드 목록
   */
  public getRelatedKeywords(keyword: string, limit: number = 5): Array<{keyword: string, competitionScore: number}> {
    try {
      const keywordData = this.getKeywordData(keyword);
      if (!keywordData) return [];
      
      // API 응답에서 연관 키워드 추출
      const relatedKeywords = keywordData.apiData?.trendData?.relatedKeywords || 
                              keywordData.apiData?.shoppingData?.relKeyword?.[0]?.relKeywords || 
                              [];
      
      // 데이터베이스에 있는 연관 키워드만 필터링
      const result = [];
      for (const relKeyword of relatedKeywords) {
        if (typeof relKeyword === 'string') {
          const relData = this.getKeywordData(relKeyword);
          if (relData?.metrics?.competition?.competitionScore !== undefined) {
            result.push({
              keyword: relKeyword,
              competitionScore: relData.metrics.competition.competitionScore
            });
          } else {
            // 기본 경쟁도 점수 (실제 데이터 없는 경우)
            result.push({
              keyword: relKeyword,
              competitionScore: 50
            });
          }
        }
      }
      
      return result.slice(0, limit);
    } catch (error) {
      logger.error(`[${keyword}] 연관 키워드 조회 오류: ${error}`);
      return [];
    }
  }
  
  /**
   * 카테고리별 평균 가격 조회
   * @param category 카테고리 
   * @returns 평균 가격
   */
  public getCategoryAvgPrice(category: string = 'default'): number {
    // 카테고리별 기본 평균 가격 (실제 구현에서는 DB에서 계산 필요)
    const categoryPrices: Record<string, number> = {
      'fashion': 45000,
      'beauty': 35000,
      'electronics': 250000,
      'furniture': 150000,
      'food': 25000,
      'default': 50000
    };
    
    return categoryPrices[category] || categoryPrices['default'];
  }
  
  /**
   * 카테고리별 평균 리뷰 수 조회
   * @param category 카테고리
   * @returns 평균 리뷰 수
   */
  public getCategoryAvgReviews(category: string = 'default'): number {
    // 카테고리별 기본 평균 리뷰 수 (실제 구현에서는 DB에서 계산 필요)
    const categoryReviews: Record<string, number> = {
      'fashion': 75,
      'beauty': 120,
      'electronics': 200,
      'furniture': 50,
      'food': 90,
      'default': 100
    };
    
    return categoryReviews[category] || categoryReviews['default'];
  }

  // -------------- 경쟁사 모니터링 관련 메소드 --------------

  /**
   * 모니터링 설정 저장
   * @param keyword 키워드
   * @param config 모니터링 설정
   */
  public saveMonitoringConfig(keyword: string, config: MonitoringConfig): void {
    try {
      const key = keyword.toLowerCase().trim();
      this.monitoringConfigs.set(key, {
        ...config,
        lastUpdated: new Date().toISOString()
      });
      logger.info(`[${keyword}] 모니터링 설정 저장 완료`);
    } catch (error) {
      logger.error(`[${keyword}] 모니터링 설정 저장 오류: ${error}`);
      throw error;
    }
  }

  /**
   * 모니터링 설정 조회
   * @param keyword 키워드
   * @returns 모니터링 설정
   */
  public getMonitoringConfig(keyword: string): MonitoringConfig | undefined {
    try {
      const key = keyword.toLowerCase().trim();
      return this.monitoringConfigs.get(key);
    } catch (error) {
      logger.error(`[${keyword}] 모니터링 설정 조회 오류: ${error}`);
      return undefined;
    }
  }

  /**
   * 모든 모니터링 설정 조회
   * @returns 모든 모니터링 설정
   */
  public getAllMonitoringConfigs(): Record<string, MonitoringConfig> {
    try {
      const configs: Record<string, MonitoringConfig> = {};
      this.monitoringConfigs.forEach((config, keyword) => {
        configs[keyword] = config;
      });
      return configs;
    } catch (error) {
      logger.error(`모니터링 설정 목록 조회 오류: ${error}`);
      return {};
    }
  }

  /**
   * 모니터링 설정 삭제
   * @param keyword 키워드
   * @returns 삭제 성공 여부
   */
  public deleteMonitoringConfig(keyword: string): boolean {
    try {
      const key = keyword.toLowerCase().trim();
      const result = this.monitoringConfigs.delete(key);
      
      if (result) {
        logger.info(`[${keyword}] 모니터링 설정 삭제 완료`);
      } else {
        logger.warn(`[${keyword}] 삭제할 모니터링 설정이 없습니다`);
      }
      
      return result;
    } catch (error) {
      logger.error(`[${keyword}] 모니터링 설정 삭제 오류: ${error}`);
      return false;
    }
  }

  /**
   * 경쟁사 기준 데이터 저장
   * @param keyword 키워드
   * @param baselineData 기준 데이터
   */
  public saveCompetitorBaseline(
    keyword: string, 
    baselineData: Record<string, CompetitorProduct[]>
  ): void {
    try {
      const key = keyword.toLowerCase().trim();
      this.competitorBaselines.set(key, baselineData);
      logger.info(`[${keyword}] 경쟁사 기준 데이터 저장 완료: ${Object.keys(baselineData).length}개 경쟁사`);
    } catch (error) {
      logger.error(`[${keyword}] 경쟁사 기준 데이터 저장 오류: ${error}`);
      throw error;
    }
  }

  /**
   * 경쟁사 기준 데이터 조회
   * @param keyword 키워드
   * @returns 기준 데이터
   */
  public getCompetitorBaseline(
    keyword: string
  ): Record<string, CompetitorProduct[]> | undefined {
    try {
      const key = keyword.toLowerCase().trim();
      return this.competitorBaselines.get(key);
    } catch (error) {
      logger.error(`[${keyword}] 경쟁사 기준 데이터 조회 오류: ${error}`);
      return undefined;
    }
  }

  /**
   * 모니터링 결과 저장
   * @param keyword 키워드
   * @param result 모니터링 결과
   */
  public saveMonitoringResult(keyword: string, result: MonitoringResult): void {
    try {
      const key = keyword.toLowerCase().trim();
      const results = this.monitoringResults.get(key) || [];
      results.push(result);
      
      // 최대 20개까지만 저장 (오래된 결과 제거)
      if (results.length > 20) {
        results.sort((a, b) => 
          new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
        );
        results.splice(20);
      }
      
      this.monitoringResults.set(key, results);
      logger.info(`[${keyword}] 모니터링 결과 저장 완료: 알림 ${result.hasAlerts ? '있음' : '없음'}`);
    } catch (error) {
      logger.error(`[${keyword}] 모니터링 결과 저장 오류: ${error}`);
      throw error;
    }
  }

  /**
   * 모니터링 결과 조회
   * @param keyword 키워드
   * @returns 모니터링 결과 목록
   */
  public getMonitoringResults(keyword: string): MonitoringResult[] {
    try {
      const key = keyword.toLowerCase().trim();
      return this.monitoringResults.get(key) || [];
    } catch (error) {
      logger.error(`[${keyword}] 모니터링 결과 조회 오류: ${error}`);
      return [];
    }
  }

  /**
   * 모든 모니터링 결과 조회
   * @returns 모든 모니터링 결과
   */
  public getAllMonitoringResults(): Record<string, MonitoringResult[]> {
    try {
      const results: Record<string, MonitoringResult[]> = {};
      this.monitoringResults.forEach((keywordResults, keyword) => {
        results[keyword] = keywordResults;
      });
      return results;
    } catch (error) {
      logger.error(`모니터링 결과 목록 조회 오류: ${error}`);
      return {};
    }
  }
}