/**
 * 머신러닝 관련 API 라우트
 */
import { Router, Request, Response } from 'express';
import { getKeywordAnalysisSystem } from '../system/keyword-analysis-system';
import { MachineLearningEnhancer } from '../ml/machine-learning-enhancer';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * ML 인스턴스 가져오기
 */
const getMLEnhancer = (): MachineLearningEnhancer => {
  const system = getKeywordAnalysisSystem();
  const mlEnhancer = new MachineLearningEnhancer(system.db);
  return mlEnhancer;
};

/**
 * 검색량 예측 API
 * 특정 키워드의 향후 6개월 검색량 예측 결과 반환
 */
router.get('/search-forecast/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const mlEnhancer = getMLEnhancer();
    
    logger.info(`키워드 검색량 예측 요청: ${keyword}`);
    const forecast = await mlEnhancer.predictSearchVolume(keyword);
    
    return res.json({
      keyword,
      forecast,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`검색량 예측 API 오류: ${error}`);
    return res.status(500).json({
      error: '검색량 예측 처리 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 키워드 성공 확률 예측 API
 * 특정 키워드의 시장 진입/판매 성공 확률 반환
 */
router.get('/success-probability/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const mlEnhancer = getMLEnhancer();
    
    logger.info(`키워드 성공 확률 예측 요청: ${keyword}`);
    const probability = await mlEnhancer.predictSuccessProbability(keyword);
    
    return res.json({
      keyword,
      probability,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`성공 확률 예측 API 오류: ${error}`);
    return res.status(500).json({
      error: '성공 확률 예측 처리 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 키워드 종합 ML 분석 API
 * 키워드에 대한 모든 ML 분석 결과를 통합하여 제공
 */
router.get('/analyze/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const mlEnhancer = getMLEnhancer();
    
    logger.info(`키워드 종합 ML 분석 요청: ${keyword}`);
    
    // 모든 분석 병렬 실행
    const [forecast, probability, meaning, relatedKeywords, segments] = await Promise.all([
      mlEnhancer.predictSearchVolume(keyword),
      mlEnhancer.predictSuccessProbability(keyword),
      mlEnhancer.analyzeKeywordMeaning(keyword),
      mlEnhancer.findSemanticRelatedKeywords(keyword),
      mlEnhancer.identifyMarketSegments(keyword)
    ]);
    
    return res.json({
      keyword,
      ml_analysis: {
        search_forecast: forecast,
        success_probability: probability,
        keyword_meaning: meaning,
        semantic_related_keywords: relatedKeywords,
        market_segments: segments
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`종합 ML 분석 API 오류: ${error}`);
    return res.status(500).json({
      error: '종합 ML 분석 처리 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 키워드 의미 분석 API
 * 특정 키워드의 의미론적 분석 결과 반환
 */
router.get('/meaning/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const mlEnhancer = getMLEnhancer();
    
    logger.info(`키워드 의미 분석 요청: ${keyword}`);
    const meaning = await mlEnhancer.analyzeKeywordMeaning(keyword);
    
    return res.json({
      keyword,
      meaning,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`키워드 의미 분석 API 오류: ${error}`);
    return res.status(500).json({
      error: '키워드 의미 분석 처리 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 의미적 연관 키워드 API
 * 특정 키워드와 의미적으로 관련된 키워드 목록 반환
 */
router.get('/semantic-related/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const mlEnhancer = getMLEnhancer();
    
    logger.info(`의미적 연관 키워드 요청: ${keyword}, 개수: ${limit}`);
    const relatedKeywords = await mlEnhancer.findSemanticRelatedKeywords(keyword, limit);
    
    // 디버그를 위한 첫 번째 항목의 로깅
    if (relatedKeywords.length > 0) {
      logger.info(`첫 번째 연관 키워드 샘플: ${JSON.stringify(relatedKeywords[0])}`);
    }
    
    return res.json({
      keyword,
      related_keywords: relatedKeywords,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`의미적 연관 키워드 API 오류: ${error}`);
    return res.status(500).json({
      error: '의미적 연관 키워드 처리 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 시장 세그먼트 API
 * 특정 키워드 관련 시장 세그먼트 분석 결과 반환
 */
router.get('/market-segments/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const mlEnhancer = getMLEnhancer();
    
    logger.info(`시장 세그먼트 분석 요청: ${keyword}`);
    const segments = await mlEnhancer.identifyMarketSegments(keyword);
    
    return res.json({
      keyword,
      segments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`시장 세그먼트 API 오류: ${error}`);
    return res.status(500).json({
      error: '시장 세그먼트 분석 처리 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * ML 시스템 상태 확인 API
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    // Python 버전과 설치된 라이브러리 확인
    const mlEnhancer = getMLEnhancer();
    
    return res.json({
      status: 'active',
      models: {
        search_forecast: true,
        success_probability: true,
        keyword_meaning: true,
        semantic_related: true,
        market_segments: true
      },
      message: 'ML 시스템이 정상 작동 중입니다.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`ML 시스템 상태 확인 오류: ${error}`);
    return res.status(500).json({
      status: 'error',
      message: '머신러닝 시스템 상태 확인 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;