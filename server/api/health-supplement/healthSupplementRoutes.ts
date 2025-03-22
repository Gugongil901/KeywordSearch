/**
 * 건강기능식품 키워드 분석 라우트
 * 
 * 건강기능식품 키워드 분석 관련 API 엔드포인트를 제공합니다:
 * 1. 상위 노출 광고 키워드 필터링
 * 2. 페이지 노출 여부 분석
 * 3. 상품 키워드 순위 추적
 */

import { Router, Request, Response } from 'express';
import { keywordAnalysisService } from './keywordAnalysisService';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * 상위 노출 광고 키워드 필터링 API
 * POST /api/health-supplement/ad-filter
 */
router.post('/ad-filter', async (req: Request, res: Response) => {
  try {
    const { keywords } = req.body;
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: '키워드 배열이 필요합니다.'
      });
    }
    
    logger.info(`[API] 광고 키워드 필터링 요청: ${keywords.length}개 키워드`);
    
    const result = await keywordAnalysisService.analyzeAdKeywords(keywords);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`[API] 광고 키워드 필터링 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || '광고 키워드 필터링 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 페이지 노출 확인 API
 * POST /api/health-supplement/page-exposure
 */
router.post('/page-exposure', async (req: Request, res: Response) => {
  try {
    const { keywords, url } = req.body;
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: '키워드 배열이 필요합니다.'
      });
    }
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL이 필요합니다.'
      });
    }
    
    logger.info(`[API] 페이지 노출 확인 요청: URL "${url}", ${keywords.length}개 키워드`);
    
    const result = await keywordAnalysisService.checkPageExposure(keywords, url);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`[API] 페이지 노출 확인 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || '페이지 노출 확인 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 상품 키워드 순위 분석 API
 * POST /api/health-supplement/product-ranking
 */
router.post('/product-ranking', async (req: Request, res: Response) => {
  try {
    const { keywords, productId, productName } = req.body;
    
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({
        success: false,
        error: '상품 ID가 필요합니다.'
      });
    }
    
    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({
        success: false,
        error: '상품명이 필요합니다.'
      });
    }
    
    // 키워드가 제공되지 않으면 기본 건강기능식품 키워드 사용
    const keywordsToAnalyze = keywords && Array.isArray(keywords) && keywords.length > 0
      ? keywords
      : keywordAnalysisService.getHealthSupplementKeywords();
    
    logger.info(`[API] 상품 키워드 순위 분석 요청: 상품 "${productName}" (ID: ${productId}), ${keywordsToAnalyze.length}개 키워드`);
    
    const result = await keywordAnalysisService.analyzeProductRankings(
      keywordsToAnalyze,
      productId,
      productName
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`[API] 상품 키워드 순위 분석 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || '상품 키워드 순위 분석 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 최적 키워드 찾기 API
 * POST /api/health-supplement/best-keywords
 */
router.post('/best-keywords', async (req: Request, res: Response) => {
  try {
    const { productId, productName, keywords, limit } = req.body;
    
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({
        success: false,
        error: '상품 ID가 필요합니다.'
      });
    }
    
    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({
        success: false,
        error: '상품명이 필요합니다.'
      });
    }
    
    const keywordLimit = limit && !isNaN(parseInt(limit)) ? parseInt(limit) : 10;
    
    logger.info(`[API] 최적 키워드 찾기 요청: 상품 "${productName}" (ID: ${productId}), 최대 ${keywordLimit}개`);
    
    const result = await keywordAnalysisService.findBestKeywords(
      productId,
      productName,
      keywords,
      keywordLimit
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`[API] 최적 키워드 찾기 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || '최적 키워드 찾기 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 건강기능식품 키워드 목록 가져오기 API
 * GET /api/health-supplement/keywords
 */
router.get('/keywords', (_req: Request, res: Response) => {
  try {
    const keywords = keywordAnalysisService.getHealthSupplementKeywords();
    
    res.json({
      success: true,
      data: {
        keywords,
        count: keywords.length,
        category: '건강기능식품',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error(`[API] 건강기능식품 키워드 목록 가져오기 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || '키워드 목록 가져오기 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 페이지 노출 확인용 키워드 목록 가져오기 API
 * GET /api/health-supplement/page-keywords
 */
router.get('/page-keywords', (_req: Request, res: Response) => {
  try {
    const keywords = keywordAnalysisService.getPageExposureKeywords();
    
    res.json({
      success: true,
      data: {
        keywords,
        count: keywords.length,
        category: '페이지노출',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error(`[API] 페이지 노출 키워드 목록 가져오기 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || '키워드 목록 가져오기 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 브랜드 키워드 목록 가져오기 API
 * GET /api/health-supplement/brand-keywords
 */
router.get('/brand-keywords', (_req: Request, res: Response) => {
  try {
    const keywords = keywordAnalysisService.getHealthBrandKeywords();
    
    res.json({
      success: true,
      data: {
        keywords,
        count: keywords.length,
        category: '건강브랜드',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error(`[API] 브랜드 키워드 목록 가져오기 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || '키워드 목록 가져오기 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 시스템 상태 확인 API
 * GET /api/health-supplement/status
 */
router.get('/status', (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        status: '활성',
        apiKeys: {
          naverClientId: !!process.env.NAVER_CLIENT_ID,
          naverClientSecret: !!process.env.NAVER_CLIENT_SECRET,
          naverAdApiKey: !!process.env.NAVER_AD_ACCESS_LICENSE,
          naverAdCustomerId: !!process.env.NAVER_AD_CUSTOMER_ID
        },
        functions: {
          adKeywordFilter: true,
          pageExposureChecker: true,
          productRankingAnalyzer: true,
          bestKeywordFinder: true
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error(`[API] 시스템 상태 확인 오류: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message || '시스템 상태 확인 중 오류가 발생했습니다.'
    });
  }
});

export default router;