/**
 * 건강보조제 모니터링 API 라우트
 * 
 * 건강보조제 브랜드와 제품을 모니터링하기 위한 API 엔드포인트를 제공합니다.
 */

import { Router, Request, Response } from 'express';
import { HealthSupplementMonitor, getHealthSupplementMonitor } from '../monitoring/health-supplement-monitor';
import { getDatabaseConnector } from '../collectors/database-connector';
import { getNaverDataCollector } from '../collectors/naver-data-collector';
import { getCompetitorAnalyzer } from '../analyzers/competitor-analyzer';
import { HEALTH_BRANDS, BRAND_SEARCH_TERMS } from '../constants/health-supplement-brands';
import { logger } from '../../utils/logger';

const router = Router();

// 필요한 인스턴스 가져오기
const getMonitor = (): HealthSupplementMonitor => {
  const dbConnector = getDatabaseConnector();
  const dataCollector = getNaverDataCollector();
  const competitorAnalyzer = getCompetitorAnalyzer(dataCollector, dbConnector);
  return getHealthSupplementMonitor(dbConnector, dataCollector, competitorAnalyzer);
};

/**
 * 모든 건강보조제 브랜드 목록 조회
 */
router.get('/brands', (_req: Request, res: Response) => {
  try {
    const monitor = getMonitor();
    const brands = monitor.getAllHealthBrands();
    
    res.json({
      success: true,
      brands,
      count: brands.length
    });
  } catch (error: any) {
    logger.error('건강보조제 브랜드 목록 조회 오류', error);
    res.status(500).json({
      success: false,
      message: '건강보조제 브랜드 목록을 가져오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 건강보조제 인기 성분 목록 조회
 */
router.get('/ingredients', (_req: Request, res: Response) => {
  try {
    const monitor = getMonitor();
    const ingredients = monitor.getPopularIngredients();
    
    res.json({
      success: true,
      ingredients,
      count: ingredients.length
    });
  } catch (error: any) {
    logger.error('건강보조제 인기 성분 목록 조회 오류', error);
    res.status(500).json({
      success: false,
      message: '건강보조제 인기 성분 목록을 가져오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 모든 건강보조제 브랜드 모니터링 설정
 */
router.post('/setup-all', async (_req: Request, res: Response) => {
  try {
    const monitor = getMonitor();
    const result = await monitor.setupAllBrandMonitoring();
    
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    logger.error('건강보조제 브랜드 모니터링 설정 오류', error);
    res.status(500).json({
      success: false,
      message: '건강보조제 브랜드 모니터링을 설정하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 특정 브랜드 모니터링 설정 조회
 */
router.get('/config/:brand', (req: Request, res: Response) => {
  try {
    const { brand } = req.params;
    
    if (!HEALTH_BRANDS.includes(brand)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 브랜드입니다.',
        validBrands: HEALTH_BRANDS
      });
    }
    
    const monitor = getMonitor();
    const config = monitor.getBrandMonitoringConfig(brand);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '해당 브랜드의 모니터링 설정을 찾을 수 없습니다.',
        brand
      });
    }
    
    res.json({
      success: true,
      brand,
      config
    });
  } catch (error: any) {
    logger.error(`브랜드(${req.params.brand}) 모니터링 설정 조회 오류`, error);
    res.status(500).json({
      success: false,
      message: '브랜드 모니터링 설정을 조회하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 모든 브랜드 변화 감지 실행
 */
router.post('/check-all', async (_req: Request, res: Response) => {
  try {
    const monitor = getMonitor();
    const results = await monitor.checkBrandChanges();
    
    res.json({
      success: true,
      ...results
    });
  } catch (error: any) {
    logger.error('모든 브랜드 변화 감지 오류', error);
    res.status(500).json({
      success: false,
      message: '브랜드 변화를 감지하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 특정 브랜드 변화 감지 실행
 */
router.post('/check/:brand', async (req: Request, res: Response) => {
  try {
    const { brand } = req.params;
    
    if (!HEALTH_BRANDS.includes(brand)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 브랜드입니다.',
        validBrands: HEALTH_BRANDS
      });
    }
    
    const monitor = getMonitor();
    const results = await monitor.checkBrandChanges(brand);
    
    res.json({
      success: true,
      brand,
      ...results
    });
  } catch (error: any) {
    logger.error(`브랜드(${req.params.brand}) 변화 감지 오류`, error);
    res.status(500).json({
      success: false,
      message: '브랜드 변화를 감지하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 특정 브랜드의 모든 모니터링 결과 조회
 */
router.get('/results/:brand', (req: Request, res: Response) => {
  try {
    const { brand } = req.params;
    
    if (!HEALTH_BRANDS.includes(brand)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 브랜드입니다.',
        validBrands: HEALTH_BRANDS
      });
    }
    
    const monitor = getMonitor();
    const results = monitor.getBrandMonitoringResults(brand);
    
    res.json({
      success: true,
      brand,
      count: results.length,
      results
    });
  } catch (error: any) {
    logger.error(`브랜드(${req.params.brand}) 모니터링 결과 조회 오류`, error);
    res.status(500).json({
      success: false,
      message: '브랜드 모니터링 결과를 조회하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 특정 브랜드의 최신 모니터링 결과 조회
 */
router.get('/results/:brand/latest', (req: Request, res: Response) => {
  try {
    const { brand } = req.params;
    
    if (!HEALTH_BRANDS.includes(brand)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 브랜드입니다.',
        validBrands: HEALTH_BRANDS
      });
    }
    
    const monitor = getMonitor();
    const result = monitor.getLatestBrandMonitoringResult(brand);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '해당 브랜드의 모니터링 결과를 찾을 수 없습니다.',
        brand
      });
    }
    
    res.json({
      success: true,
      brand,
      result
    });
  } catch (error: any) {
    logger.error(`브랜드(${req.params.brand}) 최신 모니터링 결과 조회 오류`, error);
    res.status(500).json({
      success: false,
      message: '브랜드 최신 모니터링 결과를 조회하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;