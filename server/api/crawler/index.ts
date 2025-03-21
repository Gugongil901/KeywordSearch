/**
 * 크롤링 통합 모듈
 * 
 * 다양한 크롤링 기법을 통합하여 가장 적합한 방식 제공
 */

import { logger } from '../../utils/logger';
import { crawlShoppingInsightKeywords, getFallbackKeywords } from './shopping-insight-crawler';
import { enhancedCrawling } from './enhanced-crawler';

/**
 * 네이버 쇼핑인사이트 키워드 고급 크롤링
 * (다양한 방식을 통합하여 가장 신뢰할 수 있는 결과 제공)
 * 
 * @param category 카테고리 ('all', 'fashion', 'beauty' 등)
 * @param period 기간 ('daily', 'weekly', 'monthly')
 * @param limit 가져올 키워드 수
 * @returns 인기 키워드 배열
 */
export async function crawlKeywords(
  category: string = 'all',
  period: string = 'daily',
  limit: number = 10
): Promise<string[]> {
  try {
    logger.info(`🚀 고급 크롤링 시작: 카테고리=${category}, 기간=${period}`);
    
    // 1. 먼저 패션 카테고리 키워드(최신 상태 확인된 것) 준비
    const backupKeywords = getFallbackKeywords(category);
    
    // 2. 향상된 크롤링 시도
    try {
      logger.info(`⚡ 고급 크롤링 시도 중...`);
      const enhancedResults = await enhancedCrawling(category, period, limit);
      
      if (enhancedResults && enhancedResults.length > 0) {
        // 한글 키워드 비율 계산
        const koreanKeywords = enhancedResults.filter(kw => /[가-힣]/.test(kw));
        const koreanRatio = koreanKeywords.length / enhancedResults.length;
        
        if (koreanRatio >= 0.5) {
          logger.info(`✅ 고급 크롤링 성공: ${enhancedResults.length}개 키워드, 한글 비율: ${(koreanRatio * 100).toFixed(1)}%`);
          return enhancedResults;
        } else {
          logger.warn(`⚠️ 고급 크롤링 결과의 한글 비율이 낮음: ${(koreanRatio * 100).toFixed(1)}%`);
        }
      }
    } catch (enhancedError) {
      logger.error(`❌ 고급 크롤링 실패: ${enhancedError}`);
    }
    
    // 3. 기존 크롤링 시도
    try {
      logger.info(`⚡ 기존 크롤링 시도 중...`);
      const standardResults = await crawlShoppingInsightKeywords(category, period, limit);
      
      if (standardResults && standardResults.length > 0) {
        // UI 요소 필터링
        const uiElements = ['업데이트', '선택됨', '권장', '브라우저', '안내', '본문', '바로가기', '데이터랩', '홈'];
        const filteredKeywords = standardResults.filter(keyword => 
          !uiElements.some(element => keyword.includes(element))
        );
        
        if (filteredKeywords.length > 0) {
          logger.info(`✅ 기존 크롤링 성공: ${filteredKeywords.length}개 키워드`);
          return filteredKeywords;
        }
      }
    } catch (standardError) {
      logger.error(`❌ 기존 크롤링 실패: ${standardError}`);
    }
    
    // 4. 모두 실패하면 백업 키워드 사용
    logger.info(`ℹ️ 크롤링 실패, 백업 키워드 사용: ${backupKeywords.length}개 키워드`);
    return backupKeywords.slice(0, limit);
    
  } catch (error) {
    logger.error(`❌ 통합 크롤링 실패: ${error}`);
    // 최후의 수단으로 백업 키워드 반환
    return getFallbackKeywords(category).slice(0, limit);
  }
}

export { getFallbackKeywords } from './shopping-insight-crawler';