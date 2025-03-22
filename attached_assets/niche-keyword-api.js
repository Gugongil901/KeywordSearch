// src/routes/nicheKeywords.ts
import { Router } from 'express';
import nicheKeywordService from '../services/nicheKeywordService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * 소형 틈새 키워드 분석 API
 * GET /api/niche-keywords
 * 
 * 쿼리 파라미터:
 * - category: 검색할 카테고리 (기본값: 건강기능식품)
 * - minSearchVolume: 최소 검색량 (기본값: 100)
 * - maxCompetition: 최대 경쟁 강도 (기본값: 0.4)
 * - minGrowthRate: 최소 성장률 (기본값: 1.1)
 * - minProfitPotential: 최소 수익 잠재력 (기본값: 0.5)
 * - seasonalityFactor: 계절성 고려 여부 (기본값: true)
 * - includeTrends: 트렌드 데이터 포함 여부 (기본값: true)
 * - limit: 결과 제한 수 (기본값: 50)
 */
router.get('/', async (req, res) => {
  try {
    const {
      category = '건강기능식품',
      minSearchVolume,
      maxCompetition,
      minGrowthRate,
      minProfitPotential,
      seasonalityFactor,
      includeTrends,
      limit
    } = req.query;

    // 파라미터 변환
    const options = {
      minSearchVolume: minSearchVolume ? parseInt(minSearchVolume as string) : undefined,
      maxCompetition: maxCompetition ? parseFloat(maxCompetition as string) : undefined,
      minGrowthRate: minGrowthRate ? parseFloat(minGrowthRate as string) : undefined,
      minProfitPotential: minProfitPotential ? parseFloat(minProfitPotential as string) : undefined,
      seasonalityFactor: seasonalityFactor ? seasonalityFactor === 'true' : undefined,
      includeTrends: includeTrends ? includeTrends === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    };

    // 필터 기준 로깅
    logger.info(`틈새 키워드 검색 요청: 카테고리=${category}, 옵션=${JSON.stringify(options)}`);

    // 서비스 호출
    const result = await nicheKeywordService.findNicheKeywords(category as string, options);

    res.json(result);
  } catch (error) {
    logger.error('틈새 키워드 API 오류:', error);
    res.status(500).json({
      error: '틈새 키워드 분석 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

/**
 * 특정 키워드셋에 대한 틈새 분석 API
 * POST /api/niche-keywords/analyze
 * 
 * 요청 바디:
 * {
 *   keywords: string[],
 *   category: string,
 *   options: { ... 분석 옵션 ... }
 * }
 */
router.post('/analyze', async (req, res) => {
  try {
    const { keywords, category = '건강기능식품', options = {} } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: '유효한 키워드 배열이 필요합니다.' });
    }

    // 서비스 호출 (실제 구현에서는 전달된 키워드셋을 분석하는 메서드 필요)
    // 예시 목적으로 기존 메서드 사용
    const result = await nicheKeywordService.findNicheKeywords(category, options);

    // 요청된 키워드에 대한 필터링
    const filteredResults = {
      ...result,
      keywordOpportunities: result.keywordOpportunities.filter(k => 
        keywords.some(keyword => k.keyword.toLowerCase().includes(keyword.toLowerCase()))
      ),
      nicheKeywordsFound: result.keywordOpportunities.filter(k => 
        keywords.some(keyword => k.keyword.toLowerCase().includes(keyword.toLowerCase()))
      ).length
    };

    res.json(filteredResults);
  } catch (error) {
    logger.error('키워드셋 분석 API 오류:', error);
    res.status(500).json({
      error: '키워드셋 분석 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

/**
 * 키워드 그룹 제안 API
 * GET /api/niche-keywords/suggested-groups
 * 
 * 쿼리 파라미터:
 * - category: 검색할 카테고리 (기본값: 건강기능식품)
 */
router.get('/suggested-groups', async (req, res) => {
  try {
    const { category = '건강기능식품' } = req.query;
    
    // 소형 키워드 분석 수행
    const result = await nicheKeywordService.findNicheKeywords(category as string, {
      limit: 100, // 더 많은 키워드 분석
      includeTrends: false // 트렌드 데이터 제외하여 속도 향상
    });
    
    // 추천 액션에서 키워드 그룹 추출
    const suggestedGroups = result.recommendedActions.topKeywordGroups;
    
    res.json({
      category,
      suggestedGroups,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('키워드 그룹 제안 API 오류:', error);
    res.status(500).json({
      error: '키워드 그룹 제안 중 오류가 발생했습니다.',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

export default router;

// src/types/keywords.ts
// 키워드 분석 관련 타입 정의

/**
 * 기본 키워드 데이터
 */
export interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: number;
  pcClicks: number;
  mobileClicks: number;
  clickCost: number;
  competitorCount: number;
  commercialIntent: number;
  categoryRelevance: number;
  rawData: any;
}

/**
 * 키워드 메트릭스 (기본 데이터 + 추가 분석)
 */
export interface KeywordMetrics extends KeywordData {
  growthRate: number;
  profitPotential: number;
  seasonality: number;
  volumeScore: number;
}

/**
 * 키워드 기회 점수
 */
export interface KeywordOpportunityScore extends KeywordMetrics {
  opportunityScore: number;
  competitionLevel: string;
  difficultyLevel: string;
  recommendedChannels: string[];
}

/**
 * 소형 틈새 키워드 분석 결과
 */
export interface NicheKeywordResult {
  category: string;
  totalKeywordsAnalyzed: number;
  nicheKeywordsFound: number;
  keywordOpportunities: KeywordOpportunityScore[];
  searchCriteria: {
    minSearchVolume: number;
    maxCompetition: number;
    minGrowthRate: number;
    minProfitPotential: number;
    seasonalityFactorApplied: boolean;
  };
  trends: any;
  recommendedActions: {
    topKeywordGroups: Array<{
      topic: string;
      keywordCount: number;
      opportunityScore: number;
      suggestedChannels: string[];
      primaryKeywords: string[];
    }>;
    overallStrategy: string;
  };
  timestamp: string;
}

/**
 * 페이지 노출 데이터
 */
export interface PageExposureData {
  productId: string;
  exposureData: Array<{
    keyword: string;
    isExposed: boolean;
    position: number;
    totalResults: number;
  }>;
  exposedKeywords: string[];
  notExposedKeywords: string[];
  timestamp: string;
}

/**
 * 상품 순위 데이터
 */
export interface RankingData {
  keywords: string[];
  productIds: string[];
  rankingData: Array<{
    keyword: string;
    totalResults: number;
    productRankings: Array<{
      productId: string;
      isRanked: boolean;
      rank: number;
    }>;
  }>;
  timestamp: string;
}

/**
 * 상위 광고 키워드 데이터
 */
export interface TopAdKeywords {
  keywords: Array<{
    keyword: string;
    monthlyCnt: number;
    competitionIndex: number;
    clickCost: number;
    isRecommendedForAd: boolean;
  }>;
  timestamp: string;
}