/**
 * 소형(니치) 키워드 관련 API 라우트
 * 
 * 성장 가능성이 높고 경쟁이 낮은 소형 키워드를 찾기 위한 API 엔드포인트 제공
 */

import { Router, Request, Response } from 'express';
import { findNicheKeywords, generateSampleKeywordData, KeywordData, NicheKeywordCriteria } from '../keyword-analysis/NicheKeywordFinder';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * 니치 키워드 찾기 API
 * 
 * 키워드 데이터셋에서 검색량은 적당하고 경쟁도가 낮으며 성장률이 높은 키워드 추출
 */
router.post('/find', async (req: Request, res: Response) => {
  try {
    const { keywordDataList, criteria } = req.body;
    
    if (!Array.isArray(keywordDataList) || keywordDataList.length === 0) {
      return res.status(400).json({
        success: false,
        error: '유효한 키워드 데이터 목록이 필요합니다'
      });
    }
    
    const nicheKeywords = findNicheKeywords(keywordDataList, criteria);
    
    return res.json({
      success: true,
      data: {
        totalKeywords: keywordDataList.length,
        nicheKeywords,
        nicheKeywordCount: nicheKeywords.length,
        nicheRatio: (nicheKeywords.length / keywordDataList.length * 100).toFixed(1)
      }
    });
  } catch (error: any) {
    logger.error(`니치 키워드 찾기 오류: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: '니치 키워드 처리 중 오류가 발생했습니다'
    });
  }
});

/**
 * 건강보조제 관련 니치 키워드 추천 API
 * 
 * 샘플 데이터를 기반으로 니치 키워드 추천
 */
router.get('/recommend', (req: Request, res: Response) => {
  try {
    // 쿼리 파라미터로 필터링 기준 받기
    const criteria: NicheKeywordCriteria = {
      minSearchVolume: req.query.minSearchVolume ? Number(req.query.minSearchVolume) : undefined,
      maxSearchVolume: req.query.maxSearchVolume ? Number(req.query.maxSearchVolume) : undefined,
      maxCompetition: req.query.maxCompetition ? Number(req.query.maxCompetition) : undefined,
      minGrowth: req.query.minGrowth ? Number(req.query.minGrowth) : undefined
    };
    
    // 샘플 키워드 데이터 생성
    const keywordDataList = generateSampleKeywordData();
    
    // 니치 키워드 필터링
    const nicheKeywords = findNicheKeywords(keywordDataList, criteria);
    
    // 키워드 카테고리 분류
    const categories = {
      highPotential: nicheKeywords.filter(k => k.nicheScore >= 80),
      mediumPotential: nicheKeywords.filter(k => k.nicheScore >= 60 && k.nicheScore < 80),
      lowPotential: nicheKeywords.filter(k => k.nicheScore < 60)
    };
    
    logger.info(`건강보조제 니치 키워드 ${nicheKeywords.length}개 추천 완료`);
    
    return res.json({
      success: true,
      data: {
        totalKeywords: keywordDataList.length,
        nicheKeywords,
        nicheKeywordCount: nicheKeywords.length,
        nicheRatio: (nicheKeywords.length / keywordDataList.length * 100).toFixed(1),
        categories
      }
    });
  } catch (error: any) {
    logger.error(`니치 키워드 추천 오류: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: '니치 키워드 추천 중 오류가 발생했습니다'
    });
  }
});

/**
 * 니치 키워드 분석 필터 옵션 조회 API
 */
router.get('/filter-options', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      searchVolumeRanges: [
        { label: '모든 검색량', min: 0, max: 10000 },
        { label: '매우 낮음 (0-100)', min: 0, max: 100 },
        { label: '낮음 (100-500)', min: 100, max: 500 },
        { label: '중간 (500-1000)', min: 500, max: 1000 },
        { label: '높음 (1000-5000)', min: 1000, max: 5000 },
        { label: '매우 높음 (5000+)', min: 5000, max: 100000 }
      ],
      competitionRanges: [
        { label: '모든 경쟁도', value: 1.0 },
        { label: '매우 낮음 (0-0.1)', value: 0.1 },
        { label: '낮음 (0-0.3)', value: 0.3 },
        { label: '중간 (0-0.5)', value: 0.5 },
        { label: '높음 (0-0.7)', value: 0.7 },
        { label: '매우 높음 (0-1.0)', value: 1.0 }
      ],
      growthRanges: [
        { label: '모든 성장률', value: 0 },
        { label: '감소 중 (< 1.0)', value: 0.99 },
        { label: '안정적 (1.0-1.1)', value: 1.1 },
        { label: '성장 중 (1.1-1.3)', value: 1.3 },
        { label: '빠른 성장 (1.3-1.5)', value: 1.5 },
        { label: '급성장 (1.5+)', value: 1.5 }
      ]
    }
  });
});

export default router;