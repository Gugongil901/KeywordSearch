/**
 * 네이버 쇼핑인사이트 API 응답 데이터 처리 유틸리티
 * 
 * API 응답 데이터에서 필요한 정보를 추출하고 가공하는 함수들을 제공합니다.
 */

import { logger } from './logger';
import { fetchShoppingCategoryKeywords } from '../api/naverShoppingInsight';

/**
 * 카테고리별 인기 키워드 조회
 * @param categoryId 카테고리 ID
 * @param startDate 시작일(YYYY-MM-DD)
 * @param endDate 종료일(YYYY-MM-DD)
 * @returns 키워드 정보, 백업 데이터 여부, 오류 정보
 */
export async function getShoppingKeywords(
  categoryId: string,
  startDate?: string,
  endDate?: string
): Promise<{ keywords: any[]; isBackupData: boolean; error: string | null }> {
  try {
    const response = await fetchShoppingCategoryKeywords(categoryId, startDate, endDate);
    
    // API 응답 형식 확인 및 키워드 추출
    const keywords = extractKeywordsFromResponse(response);
    
    return {
      keywords,
      isBackupData: response.isBackupData || false,
      error: null
    };
  } catch (error: any) {
    logger.error(`카테고리 ${categoryId} 키워드 조회 실패`, error);
    
    return {
      keywords: [],
      isBackupData: true,
      error: error.message
    };
  }
}

/**
 * API 응답에서 키워드 목록 추출
 * @param response API 응답 데이터
 * @returns 키워드 목록
 */
export function extractKeywordsFromResponse(response: any): any[] {
  // 응답이 없거나 결과가 없는 경우 빈 배열 반환
  if (!response || !response.results || !response.results.length) {
    return [];
  }
  
  // 첫 번째 결과 항목 가져오기
  const result = response.results[0];
  
  // 백업 데이터인 경우 (keywords 필드가 있는 경우)
  if (result.keywords && Array.isArray(result.keywords)) {
    return result.keywords;
  }
  
  // 실제 API 응답인 경우 (data 필드가 있는 경우)
  if (result.data && Array.isArray(result.data)) {
    return result.data.map((item: any, index: number) => ({
      rank: index + 1,
      keyword: item.title || '알 수 없음',
      value: item.ratio || 0
    }));
  }
  
  // 그 외의 경우 빈 배열 반환
  return [];
}

/**
 * 트렌드 데이터 가공 (날짜별 그룹화)
 * @param trendData 트렌드 데이터
 * @returns 날짜별 그룹화된 트렌드 데이터
 */
export function formatTrendData(trendData: any[]): any[] {
  if (!trendData || !Array.isArray(trendData)) {
    return [];
  }
  
  // 날짜별로 데이터 그룹화
  const groupedByDate: Record<string, any> = {};
  
  trendData.forEach(item => {
    const date = item.period || item.date;
    if (!date) return;
    
    if (!groupedByDate[date]) {
      groupedByDate[date] = { date, values: [] };
    }
    
    groupedByDate[date].values.push({
      keyword: item.title || item.keyword,
      value: item.ratio || item.value
    });
  });
  
  // 날짜 기준 오름차순 정렬
  return Object.values(groupedByDate).sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

/**
 * 여러 키워드의 카테고리별 추세 비교
 * @param categoryId 카테고리 ID
 * @param keywords 비교할 키워드 배열
 * @param startDate 시작일(YYYY-MM-DD)
 * @param endDate 종료일(YYYY-MM-DD)
 * @returns 키워드별 추세 데이터
 */
export async function compareKeywordTrends(
  categoryId: string,
  keywords: string[],
  startDate?: string,
  endDate?: string
): Promise<any> {
  try {
    // 최대 5개 키워드로 제한 (API 제한)
    const limitedKeywords = keywords.slice(0, 5);
    
    // 키워드를 API 요청 형식으로 변환
    const keywordParams = limitedKeywords.map(keyword => ({
      name: keyword,
      param: [keyword]
    }));
    
    // API 응답 데이터를 가공하여 반환
    // 여기서는 실제 구현은 생략하고 형식만 정의합니다.
    // 실제 구현 시에는 fetchShoppingCategoryKeywords 함수를 수정하거나 
    // 새로운 함수를 만들어 구현해야 합니다.
    
    return {
      category: categoryId,
      keywords: limitedKeywords,
      trends: [], // 실제 구현 시 채워야 함
      isBackupData: false,
      error: null
    };
  } catch (error: any) {
    logger.error(`키워드 추세 비교 실패`, { 
      categoryId, 
      keywords, 
      error: error.message 
    });
    
    return {
      category: categoryId,
      keywords,
      trends: [],
      isBackupData: true,
      error: error.message
    };
  }
}