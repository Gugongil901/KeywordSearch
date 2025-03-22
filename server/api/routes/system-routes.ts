/**
 * 전체 키워드 분석 시스템 관련 API 라우트
 */

import { Router, Request, Response } from 'express';
import { getKeywordAnalysisSystem } from '../system/keyword-analysis-system';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * 전체 시스템 상태 확인 API (keepalive 용으로도 사용)
 * Replit의 'asleep' 상태에서 깨어나기 위한 핑 엔드포인트
 */
router.get('/status', async (_req: Request, res: Response) => {
  // 핑 헤더 추가로 Replit 서비스 깨우기
  res.setHeader('X-Replit-Keep-Alive', 'true');
  try {
    const system = getKeywordAnalysisSystem();
    const status = system.getSystemStatus();
    
    return res.status(200).json(status);
  } catch (error) {
    logger.error(`시스템 상태 확인 실패: ${error.message}`);
    return res.status(500).json({ error: '시스템 상태 확인 중 오류가 발생했습니다.' });
  }
});

/**
 * 종합 키워드 분석 API
 * 키워드에 대한 모든 분석을 통합하여 제공
 */
router.get('/analyze/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    
    if (!keyword) {
      return res.status(400).json({ error: '키워드를 입력해주세요.' });
    }
    
    logger.info(`종합 키워드 분석 요청: ${keyword}`);
    
    const system = getKeywordAnalysisSystem();
    const result = await system.analyzeKeyword(keyword);
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`종합 키워드 분석 실패: ${error.message}`);
    return res.status(500).json({ error: `키워드 분석 중 오류가 발생했습니다: ${error.message}` });
  }
});

/**
 * 종합 카테고리 분석 API
 * 카테고리에 대한 모든 분석을 통합하여 제공
 */
router.get('/analyze-category/:categoryId', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    
    if (!categoryId) {
      return res.status(400).json({ error: '카테고리 ID를 입력해주세요.' });
    }
    
    logger.info(`종합 카테고리 분석 요청: ${categoryId}`);
    
    const system = getKeywordAnalysisSystem();
    const result = await system.analyzeCategory(categoryId);
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`종합 카테고리 분석 실패: ${error.message}`);
    return res.status(500).json({ error: `카테고리 분석 중 오류가 발생했습니다: ${error.message}` });
  }
});

export default router;