/**
 * 키워드 분석 관련 API 라우트
 */
import express, { Request, Response } from 'express';
import { DatabaseConnector } from '../collectors/database-connector';
import { NaverDataCollector } from '../collectors/naver-data-collector';
import { KeywordMetricsCalculator } from '../analyzers/keyword-metrics-calculator';
import { CompetitorAnalyzer } from '../analyzers/competitor-analyzer';
import { MarketAnalyzer } from '../analyzers/market-analyzer';
import { KeywordVisualizationSystem } from '../visualization/keyword-visualization-system';
import { FrontendIntegrationSystem } from '../integration/frontend-integration-system';
import { logger } from '../../utils/logger';

// 라우터 생성
const router = express.Router();

// 공통 인스턴스 초기화
const dbConnector = DatabaseConnector.getInstance();
const apiKeys = {
  clientId: process.env.NAVER_CLIENT_ID || '',
  clientSecret: process.env.NAVER_CLIENT_SECRET || '',
  adApiKey: process.env.NAVER_AD_API_LICENSE || '',
  adSecretKey: process.env.NAVER_AD_API_SECRET || '',
  customerId: process.env.NAVER_AD_CUSTOMER_ID || ''
};
const dataCollector = new NaverDataCollector(apiKeys);

// 분석 시스템 인스턴스 생성
const metricsCalculator = new KeywordMetricsCalculator(dataCollector, dbConnector);
const competitorAnalyzer = new CompetitorAnalyzer(dataCollector, dbConnector);
const marketAnalyzer = new MarketAnalyzer(dataCollector, metricsCalculator, dbConnector);
const visualizationSystem = new KeywordVisualizationSystem(metricsCalculator, dbConnector);
const frontendSystem = new FrontendIntegrationSystem(dbConnector, metricsCalculator, visualizationSystem);

/**
 * 키워드 검색 API
 * 특정 키워드에 대한 분석 결과 (검색량, 경쟁도 등) 반환
 */
router.get('/search/:keyword', async (req: Request, res: Response) => {
  try {
    const keyword = req.params.keyword;
    if (!keyword) {
      return res.status(400).json({ message: "키워드를 입력해주세요." });
    }

    logger.info(`키워드 분석 요청: ${keyword}`);
    
    // 데이터 수집
    const rawData = await dataCollector.collectAllData(keyword);
    
    // 지표 계산
    const metrics = await metricsCalculator.calculateAllMetrics(keyword);
    
    // 프론트엔드 데이터 준비
    const dashboardData = await frontendSystem.generateDashboardData(keyword);
    
    res.json({
      keyword,
      metrics,
      dashboardData
    });
  } catch (error) {
    logger.error(`키워드 검색 에러: ${error}`);
    res.status(500).json({ message: "키워드 분석 중 오류가 발생했습니다." });
  }
});

/**
 * 키워드 경쟁사 분석 API
 * 특정 키워드의 경쟁사 분석 결과 반환
 */
router.get('/competitors/:keyword', async (req: Request, res: Response) => {
  try {
    const keyword = req.params.keyword;
    if (!keyword) {
      return res.status(400).json({ message: "키워드를 입력해주세요." });
    }

    logger.info(`경쟁사 분석 요청: ${keyword}`);
    
    // 경쟁사 분석
    const competitorAnalysis = await competitorAnalyzer.analyzeCompetitors(keyword);
    
    res.json(competitorAnalysis);
  } catch (error) {
    logger.error(`경쟁사 분석 에러: ${error}`);
    res.status(500).json({ message: "경쟁사 분석 중 오류가 발생했습니다." });
  }
});

/**
 * 카테고리 시장 분석 API
 * 특정 카테고리의 시장 분석 결과 반환
 */
router.get('/market/:categoryId', async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId;
    if (!categoryId) {
      return res.status(400).json({ message: "카테고리 ID를 입력해주세요." });
    }

    logger.info(`시장 분석 요청: 카테고리 ${categoryId}`);
    
    // 시장 분석
    const marketAnalysis = await marketAnalyzer.analyzeCategoryMarket(categoryId);
    
    res.json(marketAnalysis);
  } catch (error) {
    logger.error(`시장 분석 에러: ${error}`);
    res.status(500).json({ message: "시장 분석 중 오류가 발생했습니다." });
  }
});

/**
 * 키워드 리포트 API
 * 특정 키워드에 대한 상세 분석 리포트 반환
 */
router.get('/report/:keyword', async (req: Request, res: Response) => {
  try {
    const keyword = req.params.keyword;
    if (!keyword) {
      return res.status(400).json({ message: "키워드를 입력해주세요." });
    }

    logger.info(`리포트 생성 요청: ${keyword}`);
    
    // 리포트 생성
    const report = await visualizationSystem.generateKeywordReport(keyword);
    
    res.json(report);
  } catch (error) {
    logger.error(`리포트 생성 에러: ${error}`);
    res.status(500).json({ message: "리포트 생성 중 오류가 발생했습니다." });
  }
});

/**
 * 인기 키워드 API
 * 카테고리별 인기 키워드 목록 반환
 */
router.get('/trending/:category?', async (req: Request, res: Response) => {
  try {
    const category = req.params.category || 'all';
    
    logger.info(`인기 키워드 요청: 카테고리 ${category}`);
    
    // 데이터 수집기의 인기 키워드 가져오기
    const trendingKeywords = await dataCollector.collectApiData('trendKeywords');
    
    // 인기 키워드 추출 또는 변환 로직
    const result = {
      category,
      keywords: trendingKeywords?.keywords || [],
      timestamp: new Date().toISOString()
    };
    
    res.json(result);
  } catch (error) {
    logger.error(`인기 키워드 에러: ${error}`);
    res.status(500).json({ message: "인기 키워드 조회 중 오류가 발생했습니다." });
  }
});

/**
 * 키워드 분석 시스템 상태 확인 API
 */
router.get('/system/status', async (_req: Request, res: Response) => {
  try {
    const status = {
      dataCollector: Boolean(dataCollector),
      metricsCalculator: Boolean(metricsCalculator),
      competitorAnalyzer: Boolean(competitorAnalyzer),
      marketAnalyzer: Boolean(marketAnalyzer),
      visualizationSystem: Boolean(visualizationSystem),
      frontendSystem: Boolean(frontendSystem),
      dbConnector: Boolean(dbConnector),
      apiKeys: {
        naverClientId: Boolean(apiKeys.clientId),
        naverClientSecret: Boolean(apiKeys.clientSecret),
        naverAdApiKey: Boolean(apiKeys.adApiKey),
        naverAdSecretKey: Boolean(apiKeys.adSecretKey),
        naverCustomerId: Boolean(apiKeys.customerId)
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      status: "활성",
      systemComponents: status
    });
  } catch (error) {
    logger.error(`시스템 상태 확인 에러: ${error}`);
    res.status(500).json({ message: "시스템 상태 확인 중 오류가 발생했습니다." });
  }
});

export default router;