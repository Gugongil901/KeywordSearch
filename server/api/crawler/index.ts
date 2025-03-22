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
    logger.info(`1. 고급 통합 크롤링 시도 (카테고리: ${category})`);
    
    // 1. 먼저 백업 키워드 준비 (건강기능식품 카테고리 중심)
    const backupKeywords = getFallbackKeywords(category);
    
    // 건강 관련 카테고리이거나 "health"를 포함하는 카테고리인 경우 백업 키워드 우선 사용
    if (category === 'health' || category === '50000008' || category === 'life') {
      logger.info(`✅ 건강 카테고리 감지: 고품질 건강기능식품 백업 키워드 우선 사용`);
      // 건강 카테고리는 백업 키워드가 더 신뢰성 있으므로 바로 반환
      return backupKeywords.slice(0, limit);
    }
    
    // 2. 향상된 크롤링 시도
    try {
      logger.info(`⚡ 고급 크롤링 시도 중...`);
      const enhancedResults = await enhancedCrawling(category, period, limit);
      
      if (enhancedResults && enhancedResults.length > 0) {
        // 한글 키워드 비율 계산
        const koreanKeywords = enhancedResults.filter(kw => /[가-힣]/.test(kw));
        const koreanRatio = koreanKeywords.length / enhancedResults.length;
        
        // UI 요소 의심 키워드 체크
        const uiKeywords = ['검색어', '트렌드', '통계', '인사이트', '네이버', '이용약관', '개인정보', '고객센터'];
        const suspiciousUICount = enhancedResults.filter(kw => 
          uiKeywords.some(ui => kw.includes(ui))
        ).length;
        
        // 의심 비율 계산
        const suspiciousRatio = suspiciousUICount / enhancedResults.length;
        
        // 한글 비율이 높고, UI 요소 의심 비율이 낮은 경우에만 사용
        if (koreanRatio >= 0.5 && suspiciousRatio < 0.3) {
          logger.info(`✅ 고급 크롤링 성공: ${enhancedResults.length}개 키워드, 한글 비율: ${(koreanRatio * 100).toFixed(1)}%`);
          
          // 건강 관련 키워드 감지
          const hasHealthKeywords = enhancedResults.some(kw => 
            /비타민|유산균|오메가3|루테인|홍삼|영양제|콜라겐|프로폴리스|마그네슘|종합비타민/.test(kw)
          );
          
          // 건강 관련 키워드가 없으면 일부 백업 키워드 병합
          if (!hasHealthKeywords && backupKeywords.length > 0) {
            logger.info(`⚠️ 건강 관련 키워드 감지 실패, 백업 키워드 일부 병합`);
            const hybridResults = [...enhancedResults.slice(0, limit - 3), ...backupKeywords.slice(0, 3)];
            return hybridResults;
          }
          
          return enhancedResults;
        } else {
          logger.warn(`⚠️ 고급 크롤링 결과 신뢰도 낮음: 한글 비율 ${(koreanRatio * 100).toFixed(1)}%, UI 의심 비율 ${(suspiciousRatio * 100).toFixed(1)}%`);
          // 신뢰도가 낮으면 백업 키워드 사용
          return backupKeywords.slice(0, limit);
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
        // UI 요소 필터링 (메뉴, UI 항목, 페이지 요소 등)
        const uiElements = [
          '업데이트', '선택됨', '권장', '브라우저', '안내', '본문', '바로가기', '데이터랩', '홈',
          '검색어트렌드', '쇼핑인사이트', '지역통계', '뉴스댓글통계', '분야 통계', '검색어 통계',
          '이용약관', '개인정보', '법적고지', '고객센터', '약관', '통계', '메뉴', '설정', '페이지'
        ];
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