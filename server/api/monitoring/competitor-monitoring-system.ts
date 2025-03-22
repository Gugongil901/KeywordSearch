/**
 * 경쟁사 상품 자동 모니터링 시스템
 * 
 * 특정 키워드의 경쟁사 제품을 모니터링하고 가격, 순위, 리뷰 등의 변화를 감지하는 시스템
 */

import { DatabaseConnector } from '../collectors/database-connector';
import { NaverDataCollector } from '../collectors/naver-data-collector';
import { CompetitorAnalyzer } from '../analyzers/competitor-analyzer';
import { 
  CompetitorProduct, 
  MonitoringConfig, 
  MonitoringResult, 
  CompetitorChanges,
  MonitoringThresholds
} from '../../../shared/schema';
import { logger } from '../../utils/logger';

export class CompetitorMonitoringSystem {
  private db: DatabaseConnector;
  private dataCollector: NaverDataCollector;
  private competitorAnalyzer: CompetitorAnalyzer;

  constructor(
    dbConnector: DatabaseConnector, 
    dataCollector: NaverDataCollector,
    competitorAnalyzer: CompetitorAnalyzer
  ) {
    this.db = dbConnector;
    this.dataCollector = dataCollector;
    this.competitorAnalyzer = competitorAnalyzer;
    logger.info('경쟁사 모니터링 시스템 초기화 완료');
  }

  /**
   * 키워드에 대한 경쟁사 모니터링 설정
   * @param keyword 모니터링할 키워드
   * @param topNCompetitors 모니터링할 상위 경쟁사 수
   * @returns 모니터링 설정 결과
   */
  async setupMonitoring(
    keyword: string, 
    topNCompetitors: number = 10
  ): Promise<{ 
    keyword: string; 
    monitoringSetup: string; 
    competitors: string[]; 
    alertsConfigured: MonitoringThresholds;
  }> {
    try {
      logger.info(`경쟁사 모니터링 설정 시작: ${keyword}, 상위 ${topNCompetitors}개 경쟁사`);

      // 경쟁사 분석
      const competitorAnalysis = await this.competitorAnalyzer.analyzeCompetitors(keyword);
      
      // 상위 경쟁사 선정
      const topCompetitors = competitorAnalysis.topCompetitors.slice(0, topNCompetitors);
      
      // 모니터링 설정 저장
      const monitoringConfig: MonitoringConfig = {
        keyword,
        competitors: topCompetitors.map(comp => comp.seller),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        monitorFrequency: 'daily',
        alertThresholds: {
          priceChangePercent: 5, // 5% 이상 가격 변동 시 알림
          newProduct: true,      // 새 상품 출시 시 알림
          rankChange: true,      // 순위 변동 시 알림
          reviewChangePercent: 10 // 10% 이상 리뷰 증가 시 알림
        }
      };
      
      // 설정 저장
      this.db.saveMonitoringConfig(keyword, monitoringConfig);
      
      // 초기 데이터 수집
      const baselineData = await this.collectCompetitorData(
        keyword, 
        monitoringConfig.competitors
      );
      
      // 기준 데이터 저장
      this.db.saveCompetitorBaseline(keyword, baselineData);
      
      logger.info(`경쟁사 모니터링 설정 완료: ${keyword}, ${monitoringConfig.competitors.length}개 경쟁사`);

      return {
        keyword,
        monitoringSetup: 'success',
        competitors: monitoringConfig.competitors,
        alertsConfigured: monitoringConfig.alertThresholds
      };
    } catch (error) {
      logger.error(`경쟁사 모니터링 설정 오류: ${error}`);
      throw new Error(`경쟁사 모니터링 설정 중 오류 발생: ${error}`);
    }
  }

  /**
   * 경쟁사 데이터 수집
   * @param keyword 키워드
   * @param competitors 경쟁사 목록
   * @returns 수집된 경쟁사 데이터
   */
  async collectCompetitorData(
    keyword: string, 
    competitors: string[]
  ): Promise<Record<string, CompetitorProduct[]>> {
    try {
      logger.info(`경쟁사 데이터 수집 시작: ${keyword}, ${competitors.length}개 경쟁사`);
      const allCompetitorData: Record<string, CompetitorProduct[]> = {};
      
      for (const competitor of competitors) {
        // 경쟁사 제품 데이터 수집
        const products = await this.dataCollector.collectCompetitorProducts(keyword, competitor);
        
        // 제품별 데이터 정리
        const productData: CompetitorProduct[] = products.map((product: any) => ({
          productId: product.id || '',
          name: product.name || '',
          price: product.price || 0,
          reviews: product.reviews || 0,
          rank: product.rank || 0,
          image: product.image,
          url: product.url,
          collectedAt: new Date().toISOString()
        }));
        
        allCompetitorData[competitor] = productData;
      }
      
      logger.info(`경쟁사 데이터 수집 완료: ${keyword}, ${Object.keys(allCompetitorData).length}개 경쟁사, 총 ${Object.values(allCompetitorData).flat().length}개 제품`);
      return allCompetitorData;
    } catch (error) {
      logger.error(`경쟁사 데이터 수집 오류: ${error}`);
      throw new Error(`경쟁사 데이터 수집 중 오류 발생: ${error}`);
    }
  }

  /**
   * 변화 감지 실행
   * @param keyword 키워드
   * @returns 모니터링 결과
   */
  async checkForChanges(keyword: string): Promise<MonitoringResult | { error: string }> {
    try {
      logger.info(`경쟁사 변화 감지 시작: ${keyword}`);
      
      // 모니터링 설정 조회
      const monitoringConfig = this.db.getMonitoringConfig(keyword);
      if (!monitoringConfig) {
        logger.warn(`모니터링 설정을 찾을 수 없음: ${keyword}`);
        return { error: '모니터링 설정을 찾을 수 없습니다.' };
      }
      
      // 기준 데이터 조회
      const baselineData = this.db.getCompetitorBaseline(keyword);
      if (!baselineData) {
        logger.warn(`기준 데이터를 찾을 수 없음: ${keyword}`);
        return { error: '기준 데이터를 찾을 수 없습니다.' };
      }
      
      // 현재 데이터 수집
      const currentData = await this.collectCompetitorData(
        keyword, 
        monitoringConfig.competitors
      );
      
      // 변화 감지
      const changes = this.detectChanges(
        baselineData, 
        currentData, 
        monitoringConfig.alertThresholds
      );
      
      // 결과 생성
      const monitoringResult: MonitoringResult = {
        keyword,
        checkedAt: new Date().toISOString(),
        changesDetected: changes,
        hasAlerts: Object.values(changes).some(change => change.alerts)
      };
      
      // 결과 저장
      this.db.saveMonitoringResult(keyword, monitoringResult);
      
      // 기준 데이터 업데이트
      this.db.saveCompetitorBaseline(keyword, currentData);
      
      logger.info(`경쟁사 변화 감지 완료: ${keyword}, 알림 필요: ${monitoringResult.hasAlerts ? '예' : '아니오'}`);
      return monitoringResult;
    } catch (error) {
      logger.error(`경쟁사 변화 감지 오류: ${error}`);
      throw new Error(`경쟁사 변화 감지 중 오류 발생: ${error}`);
    }
  }

  /**
   * 기준 데이터와 현재 데이터 비교로 변화 감지
   * @param baselineData 기준 데이터
   * @param currentData 현재 데이터
   * @param thresholds 알림 임계값
   * @returns 감지된 변화 목록
   */
  private detectChanges(
    baselineData: Record<string, CompetitorProduct[]>,
    currentData: Record<string, CompetitorProduct[]>,
    thresholds: MonitoringThresholds,
    showAllCompetitors: boolean = true  // 기본값을 true로 변경하여 모든 경쟁사 표시
  ): Record<string, CompetitorChanges> {
    const changes: Record<string, CompetitorChanges> = {};
    
    // 모든 경쟁사에 대해 변화 감지
    for (const [competitor, currentProducts] of Object.entries(currentData)) {
      const competitorChanges: CompetitorChanges = {
        priceChanges: [],
        newProducts: [],
        rankChanges: [],
        reviewChanges: [],
        alerts: false
      };
      
      // 기준 데이터의 해당 경쟁사 찾기
      const baselineProducts = baselineData[competitor] || [];
      
      // 기준 상품 ID 매핑
      const baselineProductMap = new Map(
        baselineProducts.map(p => [p.productId, p])
      );
      
      // 각 상품별 변화 감지
      for (const currentProduct of currentProducts) {
        const productId = currentProduct.productId;
        
        // 새 상품 확인
        if (!baselineProductMap.has(productId)) {
          if (thresholds.newProduct) {
            competitorChanges.newProducts.push({
              product: currentProduct,
              type: 'new_product'
            });
            competitorChanges.alerts = true;
          }
          continue;
        }
        
        const baselineProduct = baselineProductMap.get(productId)!;
        
        // 가격 변동 확인
        if (baselineProduct.price > 0) {
          const priceChangePercent = 
            ((currentProduct.price - baselineProduct.price) / baselineProduct.price) * 100;
          
          if (Math.abs(priceChangePercent) >= thresholds.priceChangePercent) {
            competitorChanges.priceChanges.push({
              product: currentProduct,
              oldPrice: baselineProduct.price,
              newPrice: currentProduct.price,
              changePercent: priceChangePercent
            });
            competitorChanges.alerts = true;
          }
        }
        
        // 순위 변동 확인
        if (thresholds.rankChange && baselineProduct.rank !== currentProduct.rank) {
          const rankChange = baselineProduct.rank - currentProduct.rank;
          competitorChanges.rankChanges.push({
            product: currentProduct,
            oldRank: baselineProduct.rank,
            newRank: currentProduct.rank,
            change: rankChange // 양수: 순위 상승, 음수: 순위 하락
          });
          competitorChanges.alerts = true;
        }
        
        // 리뷰 변동 확인
        if (baselineProduct.reviews > 0) {
          const reviewChangePercent = 
            ((currentProduct.reviews - baselineProduct.reviews) / baselineProduct.reviews) * 100;
          
          if (reviewChangePercent >= thresholds.reviewChangePercent) {
            competitorChanges.reviewChanges.push({
              product: currentProduct,
              oldReviews: baselineProduct.reviews,
              newReviews: currentProduct.reviews,
              changePercent: reviewChangePercent
            });
            competitorChanges.alerts = true;
          }
        }
      }
      
      // 모든 경쟁사의 변경사항을 기록 (변경사항이 없어도 포함)
      changes[competitor] = competitorChanges;
    }
    
    // 모든 경쟁사 표시가 활성화된 경우, 변경사항이 없는 경쟁사도 포함
    if (showAllCompetitors) {
      for (const competitor of Object.keys(baselineData)) {
        if (!changes[competitor]) {
          changes[competitor] = {
            priceChanges: [],
            newProducts: [],
            rankChanges: [],
            reviewChanges: [],
            alerts: false
          };
        }
      }
    
    return changes;
  }

  /**
   * 모니터링 설정 목록 조회
   * @returns 모니터링 설정 목록
   */
  getMonitoringConfigs(): Record<string, MonitoringConfig> {
    return this.db.getAllMonitoringConfigs();
  }

  /**
   * 모니터링 결과 조회
   * @param keyword 키워드
   * @returns 모니터링 결과
   */
  getMonitoringResults(keyword: string): MonitoringResult[] {
    return this.db.getMonitoringResults(keyword);
  }

  /**
   * 최신 모니터링 결과 조회
   * @param keyword 키워드
   * @returns 최신 모니터링 결과
   */
  getLatestMonitoringResult(keyword: string): MonitoringResult | null {
    const results = this.db.getMonitoringResults(keyword);
    if (!results || results.length === 0) {
      return null;
    }
    
    // 가장 최근 결과 반환
    return results.sort((a: MonitoringResult, b: MonitoringResult) => 
      new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
    )[0];
  }
}

// 싱글톤 인스턴스
let competitorMonitoringSystem: CompetitorMonitoringSystem | null = null;

/**
 * 경쟁사 모니터링 시스템 인스턴스 가져오기
 */
export function getCompetitorMonitoringSystem(
  dbConnector: DatabaseConnector,
  dataCollector: NaverDataCollector,
  competitorAnalyzer: CompetitorAnalyzer
): CompetitorMonitoringSystem {
  if (!competitorMonitoringSystem) {
    competitorMonitoringSystem = new CompetitorMonitoringSystem(
      dbConnector,
      dataCollector,
      competitorAnalyzer
    );
  }
  return competitorMonitoringSystem;
}