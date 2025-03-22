/**
 * 데이터베이스 커넥터
 * 키워드 데이터를 저장하고 관리하는 모듈
 */

import { logger } from '../../utils/logger';
import { 
  CompetitorProduct, 
  MonitoringConfig, 
  MonitoringResult
} from '../../../shared/schema';

/**
 * 데이터베이스 커넥터 클래스 (싱글톤 패턴)
 */
export class DatabaseConnector {
  private static instance: DatabaseConnector;
  private keywordData: Map<string, any>;
  private monitoringConfigs: Map<string, MonitoringConfig>;
  private monitoringResults: Map<string, MonitoringResult[]>;
  private competitorBaselines: Map<string, Record<string, CompetitorProduct[]>>;

  private constructor() {
    this.keywordData = new Map<string, any>();
    this.monitoringConfigs = new Map<string, MonitoringConfig>();
    this.monitoringResults = new Map<string, MonitoringResult[]>();
    this.competitorBaselines = new Map<string, Record<string, CompetitorProduct[]>>();

    // 샘플 데이터 설정
    this.setupSampleMonitoringConfigs();
    logger.info('데이터베이스 커넥터 초기화 완료');
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): DatabaseConnector {
    if (!DatabaseConnector.instance) {
      DatabaseConnector.instance = new DatabaseConnector();
    }
    return DatabaseConnector.instance;
  }

  /**
   * 샘플 모니터링 설정 초기화
   */
  private setupSampleMonitoringConfigs(): void {
    // 경쟁사 브랜드 목록 (건강보조제 관련)
    const competitors = [
      '닥터린', '바디닥터', '내츄럴플러스', '에스더몰', '안국건강', 
      '고려은단', '뉴트리원', '종근당건강', 'GNM 자연의품격', '뉴트리데이'
    ];

    // 샘플 키워드에 대한 모니터링 설정
    const sampleKeywords = ['비타민', '홍삼', '유산균', '루테인', '오메가3'];
    
    for (const keyword of sampleKeywords) {
      const config: MonitoringConfig = {
        keyword: keyword,
        competitors: competitors.slice(0, 5), // 상위 5개 경쟁사만 설정
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        monitorFrequency: 'daily',
        alertThresholds: {
          priceChangePercent: 5,
          newProduct: true,
          rankChange: true,
          reviewChangePercent: 10
        }
      };
      
      this.monitoringConfigs.set(keyword, config);
      
      // 샘플 결과 데이터 생성
      const result: MonitoringResult = {
        keyword: keyword,
        checkedAt: new Date().toISOString(),
        changesDetected: this.generateSampleChanges(competitors.slice(0, 5)),
        hasAlerts: true
      };
      
      this.monitoringResults.set(keyword, [result]);
      
      // 샘플 베이스라인 데이터 생성
      const baselineData: Record<string, CompetitorProduct[]> = {};
      for (const competitor of competitors.slice(0, 5)) {
        baselineData[competitor] = this.generateSampleProducts(competitor, keyword, 5);
      }
      
      this.competitorBaselines.set(keyword, baselineData);
    }
  }
  
  /**
   * 샘플 변화 데이터 생성
   * @param competitors 경쟁사 목록
   * @returns 샘플 변화 데이터
   */
  private generateSampleChanges(competitors: string[]): Record<string, any> {
    const changes: Record<string, any> = {};
    
    for (const competitor of competitors) {
      changes[competitor] = {
        priceChanges: [],
        newProducts: [],
        rankChanges: [],
        reviewChanges: [],
        alerts: false
      };
    }
    
    return changes;
  }
  
  /**
   * 샘플 제품 데이터 생성
   * @param competitor 경쟁사명
   * @param keyword 키워드
   * @param count 생성할 제품 수
   * @returns 샘플 제품 목록
   */
  private generateSampleProducts(competitor: string, keyword: string, count: number): CompetitorProduct[] {
    const products: CompetitorProduct[] = [];
    
    for (let i = 0; i < count; i++) {
      products.push({
        productId: `${competitor}_${keyword}_${i}`,
        name: `${competitor} ${keyword} ${i + 1}`,
        price: 10000 + (i * 5000),
        reviews: 50 + (i * 10),
        rank: i + 1,
        image: `https://example.com/images/${competitor}_${i}.jpg`,
        url: `https://example.com/products/${competitor}_${keyword}_${i}`,
        collectedAt: new Date().toISOString()
      });
    }
    
    return products;
  }

  /**
   * 키워드 데이터 저장
   * @param key 키
   * @param value 값
   */
  saveKeywordData(key: string, value: any): void {
    this.keywordData.set(key, value);
  }

  /**
   * 키워드 데이터 조회
   * @param key 키
   * @returns 데이터
   */
  getKeywordData(key: string): any {
    return this.keywordData.get(key);
  }

  /**
   * 모니터링 설정 저장
   * @param keyword 키워드
   * @param config 설정
   */
  saveMonitoringConfig(keyword: string, config: MonitoringConfig): void {
    this.monitoringConfigs.set(keyword, config);
  }

  /**
   * 모니터링 설정 조회
   * @param keyword 키워드
   * @returns 설정
   */
  getMonitoringConfig(keyword: string): MonitoringConfig | undefined {
    return this.monitoringConfigs.get(keyword);
  }

  /**
   * 모든 모니터링 설정 조회
   * @returns 설정 목록
   */
  getAllMonitoringConfigs(): Record<string, MonitoringConfig> {
    const configs: Record<string, MonitoringConfig> = {};
    this.monitoringConfigs.forEach((value, key) => {
      configs[key] = value;
    });
    return configs;
  }

  /**
   * 모니터링 결과 저장
   * @param keyword 키워드
   * @param result 결과
   */
  saveMonitoringResult(keyword: string, result: MonitoringResult): void {
    const results = this.monitoringResults.get(keyword) || [];
    results.push(result);
    this.monitoringResults.set(keyword, results);
  }

  /**
   * 모니터링 결과 조회
   * @param keyword 키워드
   * @returns 결과 목록
   */
  getMonitoringResults(keyword: string): MonitoringResult[] {
    return this.monitoringResults.get(keyword) || [];
  }

  /**
   * 경쟁사 기준 데이터 저장
   * @param keyword 키워드
   * @param data 데이터
   */
  saveCompetitorBaseline(keyword: string, data: Record<string, CompetitorProduct[]>): void {
    this.competitorBaselines.set(keyword, data);
  }

  /**
   * 경쟁사 기준 데이터 조회
   * @param keyword 키워드
   * @returns 데이터
   */
  getCompetitorBaseline(keyword: string): Record<string, CompetitorProduct[]> | undefined {
    return this.competitorBaselines.get(keyword);
  }
}

// 싱글톤 인스턴스
let dbConnector: DatabaseConnector | null = null;

/**
 * 데이터베이스 커넥터 인스턴스 가져오기
 */
export function getDatabaseConnector(): DatabaseConnector {
  if (!dbConnector) {
    dbConnector = DatabaseConnector.getInstance();
  }
  return dbConnector;
}