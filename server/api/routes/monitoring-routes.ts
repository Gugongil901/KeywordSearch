/**
 * 경쟁사 모니터링 관련 API 라우트
 */

import { Router, Request, Response } from 'express';
import { DatabaseConnector } from '../collectors/database-connector';
import { NaverDataCollector } from '../collectors/naver-data-collector';
import { CompetitorAnalyzer } from '../analyzers/competitor-analyzer';
import { CompetitorMonitoringSystem } from '../monitoring/competitor-monitoring-system';
import { logger } from '../../utils/logger';

// 라우터 생성
const router = Router();

// 필요한 싱글톤 인스턴스들
const db = DatabaseConnector.getInstance();

// 필요한 API 키
const apiKeys = {
  clientId: process.env.NAVER_CLIENT_ID || '',
  clientSecret: process.env.NAVER_CLIENT_SECRET || '',
  naverAdApiKey: process.env.NAVER_AD_API_LICENSE || '',
  naverAdApiSecret: process.env.NAVER_AD_API_SECRET || '',
  naverCustomerId: process.env.NAVER_AD_CUSTOMER_ID || ''
};

// 데이터 수집기 인스턴스
const dataCollector = new NaverDataCollector(apiKeys);

// 경쟁사 분석기 인스턴스
const competitorAnalyzer = new CompetitorAnalyzer(dataCollector, db);

// 경쟁사 모니터링 시스템 인스턴스
import { getCompetitorMonitoringSystem } from '../monitoring/competitor-monitoring-system';
const monitoringSystem = getCompetitorMonitoringSystem(db, dataCollector, competitorAnalyzer);

/**
 * 모니터링 설정 API
 * 키워드에 대한 경쟁사 모니터링 설정
 */
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const { keyword, topNCompetitors = 5 } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: '키워드가 필요합니다.' });
    }
    
    const result = await monitoringSystem.setupMonitoring(
      keyword, 
      Number(topNCompetitors)
    );
    
    res.json(result);
  } catch (error) {
    logger.error(`모니터링 설정 오류: ${error}`);
    res.status(500).json({ error: `모니터링 설정 중 오류가 발생했습니다: ${error}` });
  }
});

/**
 * 모니터링 검사 API
 * 키워드에 대한 변화 감지 실행
 */
router.get('/check/:keyword', async (req: Request, res: Response) => {
  try {
    let { keyword } = req.params;
    
    if (!keyword) {
      return res.status(400).json({ error: '키워드가 필요합니다.' });
    }
    
    // URL 디코딩 처리 - 한글 키워드 등 처리
    try {
      keyword = decodeURIComponent(keyword);
      logger.info(`URL 디코딩 적용: "${keyword}"`);
    } catch (e) {
      logger.warn(`URL 디코딩 실패: "${keyword}"`);
    }
    
    const result = await monitoringSystem.checkForChanges(keyword);
    res.json(result);
  } catch (error) {
    logger.error(`모니터링 검사 오류: ${error}`);
    res.status(500).json({ error: `모니터링 검사 중 오류가 발생했습니다: ${error}` });
  }
});

/**
 * 모니터링 설정 목록 API
 * 모든 모니터링 설정 목록 조회
 */
router.get('/configs', (_req: Request, res: Response) => {
  try {
    const configs = monitoringSystem.getMonitoringConfigs();
    res.json(configs);
  } catch (error) {
    logger.error(`모니터링 설정 목록 조회 오류: ${error}`);
    res.status(500).json({ error: `모니터링 설정 목록 조회 중 오류가 발생했습니다: ${error}` });
  }
});

/**
 * 특정 키워드의 모니터링 설정 API
 * 키워드의 모니터링 설정 조회
 */
router.get('/configs/:keyword', (req: Request, res: Response) => {
  try {
    let { keyword } = req.params;
    
    if (!keyword) {
      return res.status(400).json({ error: '키워드가 필요합니다.' });
    }
    
    // URL 디코딩 처리 - 한글 키워드 등 처리
    try {
      keyword = decodeURIComponent(keyword);
      logger.info(`URL 디코딩 적용: "${keyword}"`);
    } catch (e) {
      logger.warn(`URL 디코딩 실패: "${keyword}"`);
    }
    
    const config = db.getMonitoringConfig(keyword);
    
    if (!config) {
      return res.status(404).json({ error: '해당 키워드의 모니터링 설정을 찾을 수 없습니다.' });
    }
    
    res.json(config);
  } catch (error) {
    logger.error(`모니터링 설정 조회 오류: ${error}`);
    res.status(500).json({ error: `모니터링 설정 조회 중 오류가 발생했습니다: ${error}` });
  }
});

/**
 * 모든 모니터링 결과 API
 * 키워드의 모든 모니터링 결과 목록 조회
 */
router.get('/results/:keyword', (req: Request, res: Response) => {
  try {
    let { keyword } = req.params;
    
    if (!keyword) {
      return res.status(400).json({ error: '키워드가 필요합니다.' });
    }
    
    // URL 디코딩 처리 - 한글 키워드 등 처리
    try {
      keyword = decodeURIComponent(keyword);
      logger.info(`URL 디코딩 적용: "${keyword}"`);
    } catch (e) {
      logger.warn(`URL 디코딩 실패: "${keyword}"`);
    }
    
    const results = monitoringSystem.getMonitoringResults(keyword);
    res.json(results);
  } catch (error) {
    logger.error(`모니터링 결과 목록 조회 오류: ${error}`);
    res.status(500).json({ error: `모니터링 결과 목록 조회 중 오류가 발생했습니다: ${error}` });
  }
});

/**
 * 최신 모니터링 결과 API
 * 키워드의 최신 모니터링 결과 조회
 */
router.get('/results/:keyword/latest', (req: Request, res: Response) => {
  try {
    let { keyword } = req.params;
    
    if (!keyword) {
      return res.status(400).json({ error: '키워드가 필요합니다.' });
    }
    
    // URL 디코딩 처리 - 한글 키워드 등 처리
    try {
      keyword = decodeURIComponent(keyword);
      logger.info(`URL 디코딩 적용: "${keyword}"`);
    } catch (e) {
      logger.warn(`URL 디코딩 실패: "${keyword}"`);
    }
    
    const result = monitoringSystem.getLatestMonitoringResult(keyword);
    
    if (!result) {
      return res.status(404).json({ error: '해당 키워드의 모니터링 결과를 찾을 수 없습니다.' });
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`최신 모니터링 결과 조회 오류: ${error}`);
    res.status(500).json({ error: `최신 모니터링 결과 조회 중 오류가 발생했습니다: ${error}` });
  }
});

/**
 * 경쟁사 제품 조회 API
 * 특정 키워드와 경쟁사의 제품 목록 조회
 */
router.get('/products/:keyword/:competitor', async (req: Request, res: Response) => {
  try {
    let { keyword, competitor } = req.params;
    
    if (!keyword || !competitor) {
      return res.status(400).json({ error: '키워드와 경쟁사 이름이 필요합니다.' });
    }
    
    // URL 디코딩 처리 - 한글 키워드 및 경쟁사 이름
    try {
      keyword = decodeURIComponent(keyword);
      competitor = decodeURIComponent(competitor);
      logger.info(`URL 디코딩 적용: 키워드="${keyword}", 경쟁사="${competitor}"`);
    } catch (e) {
      logger.warn(`URL 디코딩 실패: 키워드="${keyword}", 경쟁사="${competitor}"`);
    }
    
    const products = await dataCollector.collectCompetitorProducts(keyword, competitor);
    res.json(products);
  } catch (error) {
    logger.error(`경쟁사 제품 조회 오류: ${error}`);
    res.status(500).json({ error: `경쟁사 제품 조회 중 오류가 발생했습니다: ${error}` });
  }
});

export default router;