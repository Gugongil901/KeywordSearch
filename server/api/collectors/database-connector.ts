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
    
    // 샘플 모니터링 구성 추가 (서버 재시작 시에도 기본 데이터 유지)
    this.setupSampleMonitoringConfigs();
    
    logger.info('데이터베이스 커넥터 초기화 완료');
  }
  
  /**
   * 샘플 모니터링 구성 초기화
   * 서버 재시작 시에도 기본 데이터를 유지하기 위한 메소드
   */
  private setupSampleMonitoringConfigs(): void {
    // 샘플 키워드 목록
    const sampleKeywords = [
      '강아지간식', '스키니진', '노트북', '비타민', '여행가방', '무선이어폰'
    ];
    
    // 각 키워드에 대한 샘플 모니터링 구성 추가
    for (const keyword of sampleKeywords) {
      if (!this.monitoringConfigs.has(keyword)) {
        // 샘플 경쟁사 목록
        const competitors = [
          '브랜드스토리', '건강한약국', '웰니스마트', '헬스케어몰', 
          '비타민하우스', '뉴트리원', '내츄럴플러스', '더건강한', 
          '비타플러스', '제이팜'
        ];
        
        // 모니터링 구성 생성
        const config: MonitoringConfig = {
          keyword,
          competitors: competitors.slice(0, 6), // 각 키워드마다 6개의 경쟁사 설정
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
        
        // 모니터링 구성 저장
        this.monitoringConfigs.set(keyword, config);
        
        // 기본 경쟁사 제품 데이터 생성
        const baselineData: Record<string, CompetitorProduct[]> = {};
        for (const competitor of config.competitors) {
          baselineData[competitor] = this.generateSampleProducts(keyword, competitor, 2);
        }
        
        // 경쟁사 기준 데이터 저장
        this.competitorBaselines.set(keyword, baselineData);
        
        // 샘플 모니터링 결과 생성
        const result: MonitoringResult = {
          keyword,
          checkedAt: new Date().toISOString(),
          changesDetected: {},
          hasAlerts: false
        };
        
        // 모니터링 결과 저장
        this.monitoringResults.set(keyword, [result]);
      }
    }
  }
  
  /**
   * 샘플 제품 데이터 생성
   * @param keyword 키워드
   * @param competitor 경쟁사명
   * @param count 생성할 제품 수
   * @returns 샘플 제품 목록
   */
  private generateSampleProducts(keyword: string, competitor: string, count: number): CompetitorProduct[] {
    const products: CompetitorProduct[] = [];
    
    for (let i = 0; i < count; i++) {
      const productId = `${keyword}_${competitor}_${i + 1}`;
      
      // 제품 이름 생성
      let productName = '';
      switch (keyword) {
        case '강아지간식':
          productName = i === 0 ? `프리미엄 강아지 육포 (대용량)` : `오가닉 강아지 비스킷 세트`;
          break;
        case '스키니진':
          productName = i === 0 ? `클래식 스키니진 (블랙)` : `프리미엄 데님 스키니`;
          break;
        case '노트북':
          productName = i === 0 ? `울트라 슬림 노트북 15인치` : `게이밍 노트북 프로`;
          break;
        case '비타민':
          productName = i === 0 ? `종합 비타민 (90일분)` : `비타민C 1000mg (60정)`;
          break;
        case '여행가방':
          productName = i === 0 ? `여행용 캐리어 24인치` : `여행용 백팩 방수`;
          break;
        case '무선이어폰':
          productName = i === 0 ? `프리미엄 블루투스 이어폰` : `액티브 노이즈 캔슬링 이어버드`;
          break;
        default:
          productName = `${competitor} ${keyword} 제품 ${i + 1}`;
      }
      
      // 실제 네이버 쇼핑 이미지 URL 패턴 사용
      const naverImages = [
        'https://shopping-phinf.pstatic.net/main_3246576/32465763176.20220420124534.jpg',
        'https://shopping-phinf.pstatic.net/main_3398199/33981997035.20230508132808.jpg',
        'https://shopping-phinf.pstatic.net/main_3783494/37834945046.20230531162821.jpg',
        'https://shopping-phinf.pstatic.net/main_3816141/38161410429.20230613155050.jpg',
        'https://shopping-phinf.pstatic.net/main_3245375/32453755149.20220417165320.jpg',
        'https://shopping-phinf.pstatic.net/main_3393727/33937272223.20230502161405.jpg',
        'https://shopping-phinf.pstatic.net/main_3568390/35683901799.20230208124510.jpg',
        'https://shopping-phinf.pstatic.net/main_3598592/35985922890.20230223163309.jpg',
        'https://shopping-phinf.pstatic.net/main_2405992/24059923523.20200925144716.jpg',
        'https://shopping-phinf.pstatic.net/main_3440789/34407891818.20230302181305.jpg'
      ];
      
      products.push({
        productId,
        name: `${competitor} ${productName}`,
        price: Math.floor(Math.random() * 50000) + 10000,
        reviews: Math.floor(Math.random() * 500) + 10,
        rank: Math.floor(Math.random() * 50) + 1,
        // 여러 이미지 중 하나를 선택하여 사용 (제품ID 기반 고정값)
        image: naverImages[Math.abs(productId.charCodeAt(0) + productId.charCodeAt(1)) % naverImages.length],
        url: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(keyword)}`,
        collectedAt: new Date().toISOString()
      });
    }
    
    return products;
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