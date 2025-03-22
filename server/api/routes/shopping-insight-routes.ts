/**
 * 네이버 쇼핑인사이트 API 라우터
 * 
 * 네이버 데이터랩 쇼핑인사이트 API를 사용하여 카테고리별 인기 검색어와 트렌드 정보를 제공하는 API 라우터
 */

import { Router, Request, Response } from 'express';
import { format, subDays } from 'date-fns';
import { fetchShoppingCategoryKeywords, getAllCategoryTopKeywords } from '../naverShoppingInsight';
import { getShoppingKeywords, formatTrendData } from '../../utils/shoppingInsightUtils';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * 모든 카테고리의 인기 검색어 조회
 */
router.get('/top-keywords', async (req: Request, res: Response) => {
  try {
    // 날짜 파라미터 처리
    const { startDate, endDate } = req.query;
    
    // 모든 카테고리의 인기 검색어 조회
    const results = await getAllCategoryTopKeywords(
      startDate as string, 
      endDate as string
    );
    
    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    logger.error('인기 검색어 조회 API 오류', error);
    res.status(500).json({
      success: false,
      message: '인기 검색어 데이터를 가져오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 특정 카테고리의 인기 검색어 조회
 */
router.get('/category/:categoryId', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;
    
    // 날짜 설정이 없을 경우 최근 7일로 설정
    let startDate = startDateStr;
    let endDate = endDateStr;
    
    if (!startDate || !endDate) {
      const today = new Date();
      endDate = format(today, 'yyyy-MM-dd');
      startDate = format(subDays(today, 7), 'yyyy-MM-dd');
    }
    
    // API 데이터 조회
    const data = await fetchShoppingCategoryKeywords(categoryId, startDate, endDate);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    logger.error(`카테고리(${req.params.categoryId}) 인기 검색어 조회 오류`, error);
    res.status(500).json({
      success: false,
      message: '카테고리별 인기 검색어 데이터를 가져오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 특정 카테고리의 인기 키워드만 조회 (가공된 형식)
 */
router.get('/keywords/:categoryId', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;
    
    // 날짜 설정이 없을 경우 최근 7일로 설정
    let startDate = startDateStr;
    let endDate = endDateStr;
    
    if (!startDate || !endDate) {
      const today = new Date();
      endDate = format(today, 'yyyy-MM-dd');
      startDate = format(subDays(today, 7), 'yyyy-MM-dd');
    }
    
    // 키워드 정보 조회
    const { keywords, isBackupData, error } = await getShoppingKeywords(
      categoryId,
      startDate,
      endDate
    );
    
    res.json({
      success: true,
      categoryId,
      keywords,
      isBackupData,
      startDate,
      endDate,
      error
    });
  } catch (error: any) {
    logger.error(`카테고리(${req.params.categoryId}) 키워드 조회 오류`, error);
    res.status(500).json({
      success: false,
      message: '카테고리별 키워드 데이터를 가져오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 헬스케어 분야 인기 키워드 조회 (생활/건강 카테고리)
 */
router.get('/healthcare-keywords', async (req: Request, res: Response) => {
  try {
    // 생활/건강 카테고리 ID: 50000006
    const categoryId = '50000006';
    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;
    
    // 날짜 설정이 없을 경우 최근 7일로 설정
    let startDate = startDateStr;
    let endDate = endDateStr;
    
    if (!startDate || !endDate) {
      const today = new Date();
      endDate = format(today, 'yyyy-MM-dd');
      startDate = format(subDays(today, 7), 'yyyy-MM-dd');
    }
    
    // 키워드 정보 조회
    const { keywords, isBackupData, error } = await getShoppingKeywords(
      categoryId,
      startDate,
      endDate
    );
    
    res.json({
      success: true,
      categoryId,
      categoryName: '생활/건강',
      keywords,
      isBackupData,
      startDate,
      endDate,
      error
    });
  } catch (error: any) {
    logger.error('헬스케어 인기 키워드 조회 오류', error);
    res.status(500).json({
      success: false,
      message: '헬스케어 인기 키워드 데이터를 가져오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;