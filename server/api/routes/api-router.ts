/**
 * 키워드 분석 API 라우터
 * 
 * FastAPI와 유사한 구조로 RESTful API 엔드포인트 제공
 */

import { Router, Request, Response } from 'express';
import { getKeywordAnalysisSystem } from '../system/keyword-analysis-system';
import { logger } from '../../utils/logger';
import mlRouter from './ml-routes';

const router = Router();

// 머신러닝 관련 라우터 마운트
router.use('/ml', mlRouter);
// 진행 중인 배경 작업 관리
const backgroundTasks: Record<string, any> = {};

/**
 * 루트 엔드포인트
 */
router.get('/', (_req: Request, res: Response) => {
  return res.status(200).json({
    message: '네이버 키워드 분석 API에 오신 것을 환영합니다',
    version: '1.0.0',
    endpoints: [
      '/keywords/{keyword}',
      '/tasks/{taskId}',
      '/categories/{categoryId}',
      '/related-keywords/{keyword}',
      '/ml/search-forecast/{keyword}',
      '/ml/success-probability/{keyword}',
      '/ml/analyze/{keyword}'
    ]
  });
});

/**
 * 키워드 분석 결과 조회 API
 */
router.get('/keywords/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const refresh = req.query.refresh === 'true';
    
    // 분석 시스템 인스턴스 가져오기
    const analysisSystem = getKeywordAnalysisSystem();
    const decodedKeyword = decodeURIComponent(keyword);
    
    // 로깅 추가
    logger.info(`키워드 결과 조회 요청: "${decodedKeyword}", 강제 새로고침: ${refresh}`);
    
    // 기존 분석 데이터 확인 - 정확한 키 이름 로깅
    const analysisDataKey = `${decodedKeyword}_full_analysis`;
    logger.info(`데이터베이스에서 키 조회: "${analysisDataKey}"`);
    const existingAnalysis = analysisSystem.db.getKeywordData(analysisDataKey);
    
    // 로깅을 통해 데이터 존재 여부 확인
    if (existingAnalysis) {
      logger.info(`기존 분석 데이터 발견: "${decodedKeyword}"`);
    } else {
      logger.info(`기존 분석 데이터 없음: "${decodedKeyword}"`);
    }
    
    // 분석 작업 중인지 확인
    if (backgroundTasks[decodedKeyword] && backgroundTasks[decodedKeyword].status === 'processing') {
      logger.info(`"${decodedKeyword}" 키워드에 대한 분석 작업이 진행 중입니다.`);
      return res.status(202).json({
        keyword: decodedKeyword,
        status: 'processing',
        message: '분석이 진행 중입니다. 잠시 후 다시 시도해주세요.',
        taskId: backgroundTasks[decodedKeyword].taskId
      });
    }
    
    // 신선한 데이터가 있고, 강제 갱신이 아니면 기존 데이터 반환
    if (existingAnalysis && isAnalysisFresh(existingAnalysis) && !refresh) {
      logger.info(`"${decodedKeyword}"에 대한 신선한 분석 데이터 반환`);
      return res.status(200).json({
        keyword: decodedKeyword,
        status: 'completed',
        data: existingAnalysis
      });
    }
    
    // 배경에서 분석 작업 시작
    const taskId = `${decodedKeyword}_${Date.now()}`;
    logger.info(`"${decodedKeyword}"에 대한 새 분석 작업 시작, 태스크 ID: ${taskId}`);
    
    backgroundTasks[decodedKeyword] = {
      status: 'processing',
      taskId,
      startedAt: new Date().toISOString()
    };
    
    // 배경 작업으로 분석 실행 (비동기 처리)
    processKeywordAnalysis(decodedKeyword, taskId);
    
    return res.status(202).json({
      keyword: decodedKeyword,
      status: 'processing',
      message: '분석이 시작되었습니다. 잠시 후 다시 조회해주세요.',
      taskId
    });
  } catch (error: any) {
    logger.error(`키워드 분석 API 오류: ${error.message}`);
    return res.status(500).json({
      error: '키워드 분석 중 오류가 발생했습니다',
      message: error.message
    });
  }
});

/**
 * 분석 작업 상태 조회 API
 */
router.get('/tasks/:taskId', (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    // 모든 작업에서 taskId 검색
    for (const [key, task] of Object.entries(backgroundTasks)) {
      if (task.taskId === taskId) {
        return res.status(200).json({
          taskId,
          keyword: key.startsWith('category_') ? undefined : key,
          categoryId: key.startsWith('category_') ? key.replace('category_', '') : undefined,
          status: task.status,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          error: task.error
        });
      }
    }
    
    return res.status(404).json({
      error: '작업을 찾을 수 없음',
      message: `작업 ID ${taskId}를 찾을 수 없습니다.`
    });
  } catch (error: any) {
    logger.error(`작업 상태 조회 API 오류: ${error.message}`);
    return res.status(500).json({
      error: '작업 상태 조회 중 오류가 발생했습니다',
      message: error.message
    });
  }
});

/**
 * 카테고리 분석 결과 조회 API
 */
router.get('/categories/:categoryId', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const refresh = req.query.refresh === 'true';
    
    // 분석 시스템 인스턴스 가져오기
    const analysisSystem = getKeywordAnalysisSystem();
    
    // 분석 작업 중인지 확인
    const taskKey = `category_${categoryId}`;
    if (backgroundTasks[taskKey] && backgroundTasks[taskKey].status === 'processing') {
      return res.status(202).json({
        categoryId,
        status: 'processing',
        message: '분석이 진행 중입니다. 잠시 후 다시 시도해주세요.',
        taskId: backgroundTasks[taskKey].taskId
      });
    }
    
    // 기존 분석 데이터 확인
    const existingAnalysis = analysisSystem.db.getKeywordData(`market_analysis_${categoryId}`);
    
    // 신선한 데이터가 있고, 강제 갱신이 아니면 기존 데이터 반환
    if (existingAnalysis && isAnalysisFresh(existingAnalysis) && !refresh) {
      return res.status(200).json({
        categoryId,
        status: 'completed',
        data: existingAnalysis
      });
    }
    
    // 배경에서 분석 작업 시작
    const taskId = `category_${categoryId}_${Date.now()}`;
    backgroundTasks[taskKey] = {
      status: 'processing',
      taskId,
      startedAt: new Date().toISOString()
    };
    
    // 배경 작업으로 분석 실행 (비동기 처리)
    processCategoryAnalysis(categoryId, taskId);
    
    return res.status(202).json({
      categoryId,
      status: 'processing',
      message: '카테고리 분석이 시작되었습니다. 잠시 후 다시 조회해주세요.',
      taskId
    });
  } catch (error: any) {
    logger.error(`카테고리 분석 API 오류: ${error.message}`);
    return res.status(500).json({
      error: '카테고리 분석 중 오류가 발생했습니다',
      message: error.message
    });
  }
});

/**
 * 연관 키워드 조회 API
 */
router.get('/related-keywords/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const limit = parseInt(req.query.limit as string || '10', 10);
    
    // 분석 시스템 인스턴스 가져오기
    const analysisSystem = getKeywordAnalysisSystem();
    
    // 연관 키워드 조회
    const relatedKeywords = analysisSystem.db.getRelatedKeywords(keyword, limit);
    
    if (!relatedKeywords || relatedKeywords.length === 0) {
      // 연관 키워드가 없으면 샘플 데이터 생성
      const sampleKeywords = analysisSystem.generateSampleRelatedKeywords(keyword);
      
      return res.status(200).json({
        keyword,
        relatedKeywords: sampleKeywords.slice(0, limit)
      });
    }
    
    return res.status(200).json({
      keyword,
      relatedKeywords: relatedKeywords.slice(0, limit)
    });
  } catch (error: any) {
    logger.error(`연관 키워드 API 오류: ${error.message}`);
    return res.status(500).json({
      error: '연관 키워드 조회 중 오류가 발생했습니다',
      message: error.message
    });
  }
});

/**
 * 시스템 상태 확인 API
 */
router.get('/system/status', (_req: Request, res: Response) => {
  try {
    const analysisSystem = getKeywordAnalysisSystem();
    const status = analysisSystem.getSystemStatus();
    
    // 배경 작업 상태 추가
    const activeTasks = Object.keys(backgroundTasks).length;
    
    return res.status(200).json({
      ...status,
      activeTasks,
      activeTasksDetails: Object.entries(backgroundTasks).map(([key, task]) => ({
        key,
        status: task.status,
        startedAt: task.startedAt,
        taskId: task.taskId
      }))
    });
  } catch (error: any) {
    logger.error(`시스템 상태 API 오류: ${error.message}`);
    return res.status(500).json({
      error: '시스템 상태 확인 중 오류가 발생했습니다',
      message: error.message
    });
  }
});

/**
 * 배경 작업으로 키워드 분석 처리
 */
async function processKeywordAnalysis(keyword: string, taskId: string): Promise<void> {
  try {
    logger.info(`키워드 분석 시작: ${keyword} (작업 ID: ${taskId})`);
    
    // 분석 시스템 인스턴스 가져오기
    const analysisSystem = getKeywordAnalysisSystem();
    
    // 키워드 분석 실행
    const result = await analysisSystem.analyzeKeyword(keyword);
    
    // 작업 상태 업데이트
    backgroundTasks[keyword] = {
      status: 'completed',
      taskId,
      startedAt: backgroundTasks[keyword].startedAt,
      completedAt: new Date().toISOString()
    };
    
    logger.info(`키워드 분석 완료: ${keyword} (작업 ID: ${taskId})`);
    
    // 5분 후 작업 정보 정리
    setTimeout(() => cleanupTask(keyword), 5 * 60 * 1000);
  } catch (error: any) {
    logger.error(`키워드 분석 오류: ${keyword} - ${error.message}`);
    
    // 작업 상태 업데이트
    backgroundTasks[keyword] = {
      status: 'failed',
      taskId,
      startedAt: backgroundTasks[keyword].startedAt,
      completedAt: new Date().toISOString(),
      error: error.message
    };
    
    // 5분 후 작업 정보 정리
    setTimeout(() => cleanupTask(keyword), 5 * 60 * 1000);
  }
}

/**
 * 배경 작업으로 카테고리 분석 처리
 */
async function processCategoryAnalysis(categoryId: string, taskId: string): Promise<void> {
  const taskKey = `category_${categoryId}`;
  
  try {
    logger.info(`카테고리 분석 시작: ${categoryId} (작업 ID: ${taskId})`);
    
    // 분석 시스템 인스턴스 가져오기
    const analysisSystem = getKeywordAnalysisSystem();
    
    // 카테고리 분석 실행
    const result = await analysisSystem.analyzeCategory(categoryId);
    
    // 작업 상태 업데이트
    backgroundTasks[taskKey] = {
      status: 'completed',
      taskId,
      startedAt: backgroundTasks[taskKey].startedAt,
      completedAt: new Date().toISOString()
    };
    
    logger.info(`카테고리 분석 완료: ${categoryId} (작업 ID: ${taskId})`);
    
    // 5분 후 작업 정보 정리
    setTimeout(() => cleanupTask(taskKey), 5 * 60 * 1000);
  } catch (error: any) {
    logger.error(`카테고리 분석 오류: ${categoryId} - ${error.message}`);
    
    // 작업 상태 업데이트
    backgroundTasks[taskKey] = {
      status: 'failed',
      taskId,
      startedAt: backgroundTasks[taskKey].startedAt,
      completedAt: new Date().toISOString(),
      error: error.message
    };
    
    // 5분 후 작업 정보 정리
    setTimeout(() => cleanupTask(taskKey), 5 * 60 * 1000);
  }
}

/**
 * 일정 시간 후 작업 정보 정리
 */
function cleanupTask(key: string): void {
  if (key in backgroundTasks) {
    delete backgroundTasks[key];
    logger.info(`작업 정보 정리 완료: ${key}`);
  }
}

/**
 * 분석 데이터가 신선한지 확인 (7일 이내)
 * KeywordAnalysisSystem에 구현된 함수 사용
 */
function isAnalysisFresh(analysis: any): boolean {
  const analysisSystem = getKeywordAnalysisSystem();
  return analysisSystem.isAnalysisFresh(analysis);
}

export default router;