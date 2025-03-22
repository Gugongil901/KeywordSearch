/**
 * 고급 키워드 분석 관련 API 라우트
 * 
 * 광고 키워드 필터링, 페이지 노출 모니터링, 상품별 키워드 순위 분석 기능 제공
 */

import express, { Request, Response } from 'express';
import { getKeywordAdFilter } from '../keyword-analysis/KeywordAdFilter';
import { getPageExposureTracker } from '../keyword-analysis/PageExposureTracker';
import { getProductRankingAnalyzer } from '../keyword-analysis/ProductRankingAnalyzer';
import { logger } from '../../utils/logger';

const router = express.Router();
const keywordAdFilter = getKeywordAdFilter();
const pageExposureTracker = getPageExposureTracker();
const productRankingAnalyzer = getProductRankingAnalyzer();

/**
 * 상위 노출 광고 키워드 필터링 API
 * 
 * 이미 상위에 노출되는 광고 키워드와 추천 키워드를 제공
 */
router.post('/ad-filter', async (req: Request, res: Response) => {
  try {
    const { keywords } = req.body;
    
    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ 
        success: false, 
        error: '유효한 키워드 배열이 필요합니다.' 
      });
    }
    
    logger.info(`[API] 광고 키워드 필터링 요청: ${keywords.length}개 키워드`);
    
    const topExposureKeywords = await keywordAdFilter.filterTopExposureKeywords(keywords);
    const suggestedKeywords = await keywordAdFilter.suggestAdKeywords(keywords);
    
    res.json({
      success: true,
      data: {
        topExposureKeywords,
        suggestedKeywords,
        totalKeywords: keywords.length,
        timestamp: new Date()
      }
    });
  } catch (error: any) {
    logger.error(`[API] 광고 키워드 필터링 실패: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: '광고 키워드 필터링 처리 중 오류가 발생했습니다.' 
    });
  }
});

/**
 * 키워드별 페이지 노출 확인 API
 * 
 * 특정 키워드에서 웹페이지 노출 여부와 순위 제공
 */
router.post('/page-exposure', async (req: Request, res: Response) => {
  try {
    const { keywords, url } = req.body;
    
    if (!keywords || !Array.isArray(keywords) || !url) {
      return res.status(400).json({ 
        success: false, 
        error: '유효한 키워드 배열과 URL이 필요합니다.' 
      });
    }
    
    logger.info(`[API] 페이지 노출 확인 요청: URL "${url}", ${keywords.length}개 키워드`);
    
    const exposureResults = await pageExposureTracker.batchCheckPageExposure(keywords, url);
    
    // 노출 여부에 따른 결과 분류
    const exposedKeywords = exposureResults.filter(result => result.isExposed);
    
    res.json({
      success: true,
      data: {
        results: exposureResults,
        summary: {
          totalKeywords: keywords.length,
          exposedCount: exposedKeywords.length,
          exposureRate: (exposedKeywords.length / keywords.length) * 100,
          averageRank: exposedKeywords.length > 0 
            ? exposedKeywords.reduce((sum, item) => sum + (item.rank || 0), 0) / exposedKeywords.length 
            : null
        },
        timestamp: new Date()
      }
    });
  } catch (error: any) {
    logger.error(`[API] 페이지 노출 확인 실패: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: '페이지 노출 확인 처리 중 오류가 발생했습니다.' 
    });
  }
});

/**
 * 상품별 키워드 순위 분석 API
 * 
 * 특정 상품의 키워드별 노출 순위와 변화 추이 제공
 */
router.post('/product-ranking', async (req: Request, res: Response) => {
  try {
    const { productId, productName, keywords } = req.body;
    
    if (!productId || !productName || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ 
        success: false, 
        error: '유효한 상품 정보와 키워드 배열이 필요합니다.' 
      });
    }
    
    logger.info(`[API] 상품 순위 분석 요청: 상품 "${productName}", ${keywords.length}개 키워드`);
    
    const rankingResults = await productRankingAnalyzer.analyzeProductRankings(
      productId, productName, keywords
    );
    
    // 노출 여부에 따른 결과 분류
    const rankedKeywords = rankingResults.filter(result => result.rank !== null);
    const top10Keywords = rankedKeywords
      .filter(result => result.rank !== null && result.rank <= 10)
      .sort((a, b) => (a.rank || 999) - (b.rank || 999));
    
    res.json({
      success: true,
      data: {
        results: rankingResults,
        summary: {
          totalKeywords: keywords.length,
          rankedCount: rankedKeywords.length,
          top10Count: top10Keywords.length,
          exposureRate: (rankedKeywords.length / keywords.length) * 100,
          averageRank: rankedKeywords.length > 0 
            ? rankedKeywords.reduce((sum, item) => sum + (item.rank || 0), 0) / rankedKeywords.length 
            : null
        },
        top10Keywords,
        timestamp: new Date()
      }
    });
  } catch (error: any) {
    logger.error(`[API] 상품 순위 분석 실패: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: '상품 순위 분석 처리 중 오류가 발생했습니다.' 
    });
  }
});

/**
 * 최적의 키워드 찾기 API
 * 
 * 특정 상품의 순위가 가장 높은 키워드 추출
 */
router.post('/best-keywords', async (req: Request, res: Response) => {
  try {
    const { productId, productName, keywords, limit } = req.body;
    
    if (!productId || !productName || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ 
        success: false, 
        error: '유효한 상품 정보와 키워드 배열이 필요합니다.' 
      });
    }
    
    const limitCount = limit && !isNaN(Number(limit)) ? Number(limit) : 10;
    
    logger.info(`[API] 최적 키워드 찾기 요청: 상품 "${productName}", ${keywords.length}개 키워드, 상위 ${limitCount}개`);
    
    const bestKeywords = await productRankingAnalyzer.findBestRankingKeywords(
      productId, productName, keywords, limitCount
    );
    
    res.json({
      success: true,
      data: {
        bestKeywords,
        productInfo: {
          productId,
          productName
        },
        count: bestKeywords.length,
        timestamp: new Date()
      }
    });
  } catch (error: any) {
    logger.error(`[API] 최적 키워드 찾기 실패: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: '최적 키워드 찾기 처리 중 오류가 발생했습니다.' 
    });
  }
});

/**
 * 키워드 분석 상태 확인 API
 */
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      services: {
        keywordAdFilter: !!keywordAdFilter,
        pageExposureTracker: !!pageExposureTracker,
        productRankingAnalyzer: !!productRankingAnalyzer
      },
      apiKeys: {
        naverClientId: !!process.env.NAVER_CLIENT_ID,
        naverClientSecret: !!process.env.NAVER_CLIENT_SECRET,
        naverAdApiKey: !!process.env.NAVER_AD_ACCESS_LICENSE,
        naverAdCustomerId: !!process.env.NAVER_AD_CUSTOMER_ID
      },
      timestamp: new Date()
    }
  });
});

export default router;