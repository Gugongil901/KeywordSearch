/**
 * 건강보조제 특화 모니터링 시스템
 * 
 * 건강보조제 브랜드(12개)의 제품을 모니터링하고 가격, 순위, 리뷰 등의 변화를 감지하는 시스템
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
import { 
  HEALTH_BRANDS, 
  BRAND_SEARCH_TERMS, 
  BRAND_PRODUCT_KEYWORDS,
  POPULAR_INGREDIENTS
} from '../constants/health-supplement-brands';

/**
 * 건강보조제 특화 모니터링 시스템 클래스
 */
export class HealthSupplementMonitor {
  private db: DatabaseConnector;
  private dataCollector: NaverDataCollector;
  private competitorAnalyzer: CompetitorAnalyzer;
  private keywordCache: Map<string, { timestamp: number, data: any }> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 60 * 12; // 12시간 캐시

  constructor(
    dbConnector: DatabaseConnector, 
    dataCollector: NaverDataCollector,
    competitorAnalyzer: CompetitorAnalyzer
  ) {
    this.db = dbConnector;
    this.dataCollector = dataCollector;
    this.competitorAnalyzer = competitorAnalyzer;
    logger.info('건강보조제 모니터링 시스템 초기화 완료');
  }

  /**
   * 모든 건강보조제 브랜드 모니터링 설정
   * @returns 모니터링 설정 결과
   */
  async setupAllBrandMonitoring(): Promise<{ 
    success: boolean;
    brands: string[];
    monitoringSetup: string[];
  }> {
    try {
      logger.info(`건강보조제 브랜드 모니터링 설정 시작: ${HEALTH_BRANDS.length}개 브랜드`);
      
      const results: string[] = [];
      
      // 모든 브랜드에 대한 모니터링 설정
      for (const brand of HEALTH_BRANDS) {
        try {
          // 브랜드별 검색어 사용
          const searchTerm = BRAND_SEARCH_TERMS[brand] || `${brand} 영양제`;
          
          // 모니터링 설정 검사
          const existingConfig = this.db.getMonitoringConfig(searchTerm);
          if (existingConfig) {
            results.push(`${brand}: 이미 모니터링 설정됨`);
            continue;
          }
          
          // 브랜드별 제품 키워드 목록
          const productKeywords = BRAND_PRODUCT_KEYWORDS[brand] || ['비타민', '홍삼', '유산균'];
          
          // 모니터링 설정
          const monitoringConfig: MonitoringConfig = {
            keyword: searchTerm,
            competitors: [brand], // 자체 브랜드만 모니터링
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
          this.db.saveMonitoringConfig(searchTerm, monitoringConfig);
          
          // 초기 데이터 수집 시도
          try {
            const baselineData = await this.collectBrandProducts(brand, productKeywords);
            // 기준 데이터 저장
            this.db.saveCompetitorBaseline(searchTerm, { [brand]: baselineData });
            results.push(`${brand}: 모니터링 설정 완료 (${baselineData.length}개 제품)`);
          } catch (err) {
            // 데이터 수집 실패 시에도 설정은 유지
            logger.error(`${brand} 데이터 수집 실패: ${err}`);
            results.push(`${brand}: 모니터링 설정됨, 데이터 수집 실패`);
          }
        } catch (brandError) {
          logger.error(`${brand} 브랜드 설정 오류: ${brandError}`);
          results.push(`${brand}: 설정 실패 (${brandError})`);
        }
      }
      
      logger.info(`건강보조제 브랜드 모니터링 설정 완료: ${results.length}개 브랜드`);
      
      return {
        success: true,
        brands: HEALTH_BRANDS,
        monitoringSetup: results
      };
    } catch (error) {
      logger.error(`건강보조제 브랜드 모니터링 설정 오류: ${error}`);
      throw new Error(`건강보조제 브랜드 모니터링 설정 중 오류 발생: ${error}`);
    }
  }

  /**
   * 브랜드별 제품 수집
   * @param brand 브랜드명
   * @param productKeywords 제품 키워드 목록
   * @returns 수집된 제품 목록
   */
  async collectBrandProducts(
    brand: string, 
    productKeywords: string[] = []
  ): Promise<CompetitorProduct[]> {
    try {
      logger.info(`${brand} 브랜드 제품 수집 시작`);
      const allProducts: CompetitorProduct[] = [];
      
      // 브랜드 검색어
      const brandSearchTerm = BRAND_SEARCH_TERMS[brand] || `${brand} 영양제`;
      
      // 브랜드 기본 제품 수집
      const baseProducts = await this.dataCollector.collectCompetitorProducts(brandSearchTerm, brand);
      
      // 제품 정보 처리
      const processedBaseProducts = baseProducts.map((product: any) => ({
        productId: product.id || '',
        name: product.name || '',
        price: product.price || 0,
        reviews: product.reviews || 0,
        rank: product.rank || 0,
        image: product.image,
        url: product.url,
        collectedAt: new Date().toISOString()
      }));
      
      allProducts.push(...processedBaseProducts);
      
      // 제품 키워드별 추가 수집
      if (productKeywords && productKeywords.length > 0) {
        for (const keyword of productKeywords) {
          try {
            // 캐시 키 생성 (브랜드-키워드)
            const cacheKey = `${brand}-${keyword}`;
            let products: any[] = [];
            
            // 캐시 확인
            const cachedData = this.keywordCache.get(cacheKey);
            const now = Date.now();
            
            if (cachedData && (now - cachedData.timestamp) < this.CACHE_TTL) {
              // 캐시 데이터 사용
              products = cachedData.data;
              logger.info(`${brand} ${keyword} 캐시 데이터 사용 (${products.length}개 제품)`);
            } else {
              // 새로 요청
              const searchTerm = `${brand} ${keyword}`;
              products = await this.dataCollector.collectCompetitorProducts(searchTerm, brand);
              
              // 캐시 저장
              this.keywordCache.set(cacheKey, {
                timestamp: now,
                data: products
              });
            }
            
            // 제품 정보 처리
            const processedProducts = products.map((product: any) => ({
              productId: product.id || '',
              name: product.name || '',
              price: product.price || 0,
              reviews: product.reviews || 0,
              rank: product.rank || 0,
              image: product.image,
              url: product.url,
              collectedAt: new Date().toISOString()
            }));
            
            // 중복 제거를 위한 ID 맵
            const existingIds = new Set(allProducts.map(p => p.productId));
            
            // 중복 제외하고 추가
            for (const product of processedProducts) {
              if (!existingIds.has(product.productId)) {
                allProducts.push(product);
                existingIds.add(product.productId);
              }
            }
          } catch (keywordError) {
            logger.error(`${brand} ${keyword} 제품 수집 오류: ${keywordError}`);
            // 개별 키워드 오류는 무시하고 진행
          }
        }
      }
      
      logger.info(`${brand} 브랜드 제품 수집 완료: ${allProducts.length}개 제품`);
      return allProducts;
    } catch (error) {
      logger.error(`브랜드 제품 수집 오류 (${brand}): ${error}`);
      throw new Error(`브랜드 제품 수집 중 오류 발생: ${error}`);
    }
  }

  /**
   * 건강보조제 브랜드별 변화 감지 실행
   * @param brand 브랜드명 (특정 브랜드만 체크하려면 지정)
   * @returns 모니터링 결과
   */
  async checkBrandChanges(brand?: string): Promise<{
    results: Record<string, MonitoringResult | { error: string }>,
    summary: {
      total: number,
      withChanges: number,
      withAlerts: number
    }
  }> {
    try {
      const brandsToCheck = brand ? [brand] : HEALTH_BRANDS;
      logger.info(`건강보조제 브랜드 변화 감지 시작: ${brandsToCheck.length}개 브랜드`);
      
      const results: Record<string, MonitoringResult | { error: string }> = {};
      let totalWithChanges = 0;
      let totalWithAlerts = 0;
      
      for (const brandName of brandsToCheck) {
        try {
          // 브랜드 검색어
          const searchTerm = BRAND_SEARCH_TERMS[brandName] || `${brandName} 영양제`;
          
          // 모니터링 설정 조회
          const monitoringConfig = this.db.getMonitoringConfig(searchTerm);
          if (!monitoringConfig) {
            results[brandName] = { error: '모니터링 설정을 찾을 수 없습니다.' };
            continue;
          }
          
          // 기준 데이터 조회
          const baselineData = this.db.getCompetitorBaseline(searchTerm);
          if (!baselineData) {
            results[brandName] = { error: '기준 데이터를 찾을 수 없습니다.' };
            continue;
          }
          
          // 제품 키워드 목록
          const productKeywords = BRAND_PRODUCT_KEYWORDS[brandName] || ['비타민', '홍삼', '유산균'];
          
          // 현재 데이터 수집
          const currentProducts = await this.collectBrandProducts(brandName, productKeywords);
          const currentData = { [brandName]: currentProducts };
          
          // 변화 감지
          const changes = this.detectBrandChanges(
            baselineData, 
            currentData, 
            monitoringConfig.alertThresholds
          );
          
          // 결과 생성
          const monitoringResult: MonitoringResult = {
            keyword: searchTerm,
            checkedAt: new Date().toISOString(),
            changesDetected: changes,
            hasAlerts: Object.values(changes).some(change => change.alerts)
          };
          
          // 결과 저장
          results[brandName] = monitoringResult;
          this.db.saveMonitoringResult(searchTerm, monitoringResult);
          
          // 변화가 있는 경우 카운트 증가
          if (Object.values(changes).some(change => 
            change.priceChanges.length > 0 || 
            change.newProducts.length > 0 || 
            change.rankChanges.length > 0 || 
            change.reviewChanges.length > 0
          )) {
            totalWithChanges++;
          }
          
          // 알림이 필요한 경우 카운트 증가
          if (monitoringResult.hasAlerts) {
            totalWithAlerts++;
          }
          
          // 기준 데이터 업데이트
          this.db.saveCompetitorBaseline(searchTerm, currentData);
          
        } catch (brandError) {
          logger.error(`${brandName} 브랜드 변화 감지 오류: ${brandError}`);
          results[brandName] = { error: `변화 감지 중 오류 발생: ${brandError}` };
        }
      }
      
      logger.info(`건강보조제 브랜드 변화 감지 완료: ${brandsToCheck.length}개 브랜드 중 ${totalWithChanges}개 변화 감지, ${totalWithAlerts}개 알림 필요`);
      
      return {
        results,
        summary: {
          total: brandsToCheck.length,
          withChanges: totalWithChanges,
          withAlerts: totalWithAlerts
        }
      };
    } catch (error) {
      logger.error(`건강보조제 브랜드 변화 감지 오류: ${error}`);
      throw new Error(`건강보조제 브랜드 변화 감지 중 오류 발생: ${error}`);
    }
  }

  /**
   * 브랜드 제품 변화 감지
   * @param baselineData 기준 데이터
   * @param currentData 현재 데이터
   * @param thresholds 알림 임계값
   * @returns 감지된 변화 목록
   */
  private detectBrandChanges(
    baselineData: Record<string, CompetitorProduct[]>,
    currentData: Record<string, CompetitorProduct[]>,
    thresholds: MonitoringThresholds
  ): Record<string, CompetitorChanges> {
    const changes: Record<string, CompetitorChanges> = {};
    
    // 모든 브랜드에 대해 변화 감지
    for (const [competitor, currentProducts] of Object.entries(currentData)) {
      const competitorChanges: CompetitorChanges = {
        priceChanges: [],
        newProducts: [],
        rankChanges: [],
        reviewChanges: [],
        alerts: false
      };
      
      // 기준 데이터의 해당 브랜드 찾기
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
      
      // 변경사항을 기록
      changes[competitor] = competitorChanges;
    }
    
    return changes;
  }

  /**
   * 특정 브랜드의 모니터링 설정 조회
   * @param brand 브랜드명
   * @returns 모니터링 설정
   */
  getBrandMonitoringConfig(brand: string): MonitoringConfig | null {
    const searchTerm = BRAND_SEARCH_TERMS[brand] || `${brand} 영양제`;
    return this.db.getMonitoringConfig(searchTerm);
  }

  /**
   * 특정 브랜드의 모니터링 결과 조회
   * @param brand 브랜드명
   * @returns 모니터링 결과 목록
   */
  getBrandMonitoringResults(brand: string): MonitoringResult[] {
    const searchTerm = BRAND_SEARCH_TERMS[brand] || `${brand} 영양제`;
    return this.db.getMonitoringResults(searchTerm);
  }

  /**
   * 특정 브랜드의 최신 모니터링 결과 조회
   * @param brand 브랜드명
   * @returns 최신 모니터링 결과
   */
  getLatestBrandMonitoringResult(brand: string): MonitoringResult | null {
    const searchTerm = BRAND_SEARCH_TERMS[brand] || `${brand} 영양제`;
    const results = this.db.getMonitoringResults(searchTerm);
    
    if (!results || results.length === 0) {
      return null;
    }
    
    // 가장 최근 결과 반환
    return results.sort((a: MonitoringResult, b: MonitoringResult) => 
      new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
    )[0];
  }

  /**
   * 모든 건강보조제 브랜드 목록 조회
   * @returns 브랜드 목록
   */
  getAllHealthBrands(): string[] {
    return HEALTH_BRANDS;
  }
  
  /**
   * 인기 건강기능식품 원료 목록 조회
   * @returns 원료 목록
   */
  getPopularIngredients(): string[] {
    return POPULAR_INGREDIENTS;
  }
}

// 싱글톤 인스턴스
let healthSupplementMonitor: HealthSupplementMonitor | null = null;

/**
 * 건강보조제 모니터링 시스템 인스턴스 가져오기
 */
export function getHealthSupplementMonitor(
  dbConnector: DatabaseConnector,
  dataCollector: NaverDataCollector,
  competitorAnalyzer: CompetitorAnalyzer
): HealthSupplementMonitor {
  if (!healthSupplementMonitor) {
    healthSupplementMonitor = new HealthSupplementMonitor(
      dbConnector,
      dataCollector,
      competitorAnalyzer
    );
  }
  return healthSupplementMonitor;
}