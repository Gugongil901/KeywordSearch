/**
 * 네이버 쇼핑인사이트 API 클라이언트
 * 
 * 네이버 데이터랩 쇼핑인사이트 API를 사용하여 카테고리별 인기 검색어를 가져오는 기능 제공
 */

import axios from 'axios';
import { format, subDays } from 'date-fns';
import { logger } from '../utils/logger';

// Naver API Credentials
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || "ErTaCUGQWfhKvcEnftat";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "Xoq9VSewrv";

// 백업 데이터 - API 호출 실패 시 사용
const backupKeywords: Record<string, string[]> = {
  'fashion': ['니트', '패딩', '코트', '후드티', '스웨터', '슬랙스', '가디건', '청바지', '숏패딩', '맨투맨'],
  'digital': ['노트북', '태블릿', '스마트폰', '이어폰', '블루투스 이어폰', '스마트워치', '공기청정기', '모니터', '키보드', 'SSD'],
  'living': ['침대', '소파', '식탁', '수납장', '옷장', '책상', '조명', '커튼', '러그', '화분'],
  'beauty': ['선크림', '마스크팩', '립스틱', '아이크림', '에센스', '파운데이션', '클렌징폼', '섀도우', '마스카라', '향수'],
  'food': ['김치', '과일', '쌀', '라면', '고기', '채소', '김', '간식', '빵', '과자'],
  'sports': ['운동화', '골프', '자전거', '테니스', '수영복', '등산', '헬스', '요가', '배드민턴', '캠핑'],
  'health': ['비타민', '마스크', '영양제', '건강식품', '프로틴', '체중계', '혈압계', '두통약', '밴드', '안마기'],
  'culture': ['책', '영화', '음악', '게임', '콘서트', '전시', '뮤지컬', '티켓', '여행', '앨범']
};

/**
 * 네이버 데이터랩 쇼핑인사이트 API의 카테고리별 인기 검색어를 조회합니다.
 * 네이버 공식 API 문서를 기반으로 요청 형식을 정확히 구현했습니다.
 * 
 * 엔드포인트: https://openapi.naver.com/v1/datalab/shopping/category/keywords
 * HTTP 메서드: POST
 * 
 * @param categoryId 카테고리 ID (예: '50000000')
 * @param startDate 시작일(YYYY-MM-DD)
 * @param endDate 종료일(YYYY-MM-DD)
 * @returns API 응답 데이터
 * 
 * @see https://developers.naver.com/docs/serviceapi/datalab/shopping/datalab.shopping.api.md
 */
export async function fetchShoppingCategoryKeywords(categoryId: string, startDate?: string, endDate?: string): Promise<any> {
  try {
    // 날짜 유효성 검사
    if (!startDate || !endDate) {
      const today = new Date();
      endDate = format(today, 'yyyy-MM-dd');
      
      // 7일 전 날짜 계산
      const lastWeek = subDays(today, 7);
      startDate = format(lastWeek, 'yyyy-MM-dd');
    }
    
    console.log(`쇼핑인사이트 API 호출 - 카테고리: ${categoryId}, 기간: ${startDate} ~ ${endDate}`);
    
    // 네이버 API 문서에 맞게 요청 형식 업데이트
    // 쇼핑인사이트 카테고리별 인기 검색어 API 요청 형식
    // 테스트 결과에 따라 category는 반드시 문자열로 전달해야 함
    const requestBody = {
      startDate: startDate,
      endDate: endDate,
      timeUnit: 'date',
      category: categoryId.toString(), // 카테고리 ID를 문자열로 전달 (API 문서 형식)
      keyword: [ // 필수이지만 전체 키워드를 가져오기 위한 더미 데이터
        {"name": "전체", "param": [""]} 
      ],
      device: '', // 모든 기기 데이터 요청
      gender: '',
      ages: []
    };
    
    console.log('쇼핑인사이트 인기검색어 API 요청 본문:', JSON.stringify(requestBody));
    
    // 최신 API 엔드포인트 사용
    const response = await axios({
      method: 'post',
      url: 'https://openapi.naver.com/v1/datalab/shopping/category/keywords',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
      },
      data: requestBody,
      timeout: 15000 // 15초로 타임아웃 연장
    });
    
    // 응답 검증
    if (response.status === 200 && response.data) {
      console.log('API 요청 성공:', response.status);
      return response.data;
    } else {
      throw new Error(`API 응답 오류: ${response.status}`);
    }
  } catch (error: any) {
    // 상세 에러 로깅
    logger.error('쇼핑인사이트 API 호출 실패', {
      categoryId,
      startDate,
      endDate,
      error: {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }
    });
    
    // 실패 유형에 따른 재시도 로직 구현
    console.log(`API 요청 실패: 대체 요청 형식으로 재시도합니다...`);
    
    try {
      // 대체 요청 형식으로 재시도 - API 문서의 예제 형식 기반
      const alternativeRequestBody = {
        startDate: startDate,
        endDate: endDate,
        timeUnit: 'date',
        category: categoryId.toString(), // 문자열 형식
        keyword: [
          {"name": `카테고리_${categoryId}`, "param": ["인기검색어"]},
          {"name": `인기키워드_${categoryId}`, "param": ["트렌드"]}
        ],
        device: '',
        gender: '',
        ages: []
      };
      
      console.log('대체 API 요청 본문:', JSON.stringify(alternativeRequestBody));
      
      const retryResponse = await axios({
        method: 'post',
        url: 'https://openapi.naver.com/v1/datalab/shopping/category/keywords',
        headers: {
          'Content-Type': 'application/json',
          'X-Naver-Client-Id': NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
        },
        data: alternativeRequestBody,
        timeout: 15000
      });
      
      if (retryResponse.status === 200 && retryResponse.data) {
        console.log('대체 요청 성공:', retryResponse.status);
        return retryResponse.data;
      }
    } catch (retryError) {
      logger.error('대체 API 요청도 실패', retryError);
    }
    
    // 모든 시도 실패 시 백업 데이터 반환
    console.log(`API 요청 실패: 백업 키워드를 사용합니다.`);
    
    // 카테고리별 백업 데이터 매핑 (확장된 카테고리 지원)
    let backupCategory = 'fashion'; // 기본값
    if (categoryId === '50000000') backupCategory = 'digital';
    else if (categoryId === '50000001') backupCategory = 'fashion';
    else if (categoryId === '50000002') backupCategory = 'living';
    else if (categoryId === '50000003') backupCategory = 'beauty';
    else if (categoryId === '50000004') backupCategory = 'food';
    else if (categoryId === '50000005') backupCategory = 'sports';
    else if (categoryId === '50000006') backupCategory = 'health';
    else if (categoryId === '50000007') backupCategory = 'culture';
    
    // 백업 데이터를 API 응답 형식과 일치하게 구성
    return {
      startDate: startDate,
      endDate: endDate,
      timeUnit: 'date',
      isBackupData: true, // 백업 데이터 표시 플래그 추가
      results: [
        {
          title: `${backupCategory} 인기 검색어 (백업 데이터)`,
          keyword: [`${backupCategory}_keywords`], // API 응답 형식에 맞춤
          data: [], // 트렌드 데이터는 비워둠
          keywords: (backupKeywords[backupCategory] || backupKeywords.fashion).map((keyword, index) => ({
            rank: index + 1,
            keyword: keyword,
            value: 100 - (index * 5)
          }))
        }
      ]
    };
  }
}

/**
 * 모든 주요 카테고리의 인기 검색어 조회
 */
export async function getAllCategoryTopKeywords(startDate?: string, endDate?: string): Promise<any[]> {
  // 네이버 쇼핑 카테고리 ID 목록 (API 문서 기준)
  const categories = [
    { id: '50000000', name: '디지털/가전' },
    { id: '50000001', name: '패션의류' },
    { id: '50000002', name: '가구/인테리어' },
    { id: '50000003', name: '화장품/미용' },
    { id: '50000004', name: '식품' },
    { id: '50000005', name: '스포츠/레저' },
    { id: '50000006', name: '생활/건강' },
    { id: '50000007', name: '여가/문화' }
  ];
  
  // 성능 최적화: 병렬로 각 카테고리 데이터 요청 (동시 요청 수 제한)
  const batchSize = 2; // 한 번에 처리할 요청 수 제한 (API 호출 제한 고려)
  const results = [];
  
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (category) => {
        try {
          // 개선된 키워드 조회 함수 사용
          const data = await fetchShoppingCategoryKeywords(
            category.id, 
            startDate, 
            endDate
          );
          
          // shoppingInsightUtils의 함수를 직접 구현
          const keywords = extractKeywordsFromResponse(data);
          
          return {
            categoryId: category.id,
            categoryName: category.name,
            keywords: keywords || [],
            isBackupData: data.isBackupData || false,
            error: null
          };
        } catch (error: any) {
          logger.error(`카테고리 ${category.name} 데이터 요청 오류`, error);
          return {
            categoryId: category.id,
            categoryName: category.name,
            keywords: [],
            error: error.message,
            isBackupData: true
          };
        }
      })
    );
    
    results.push(...batchResults);
    
    // API 호출 제한 방지를 위한 지연
    if (i + batchSize < categories.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * API 응답에서 키워드 목록 추출
 */
function extractKeywordsFromResponse(response: any): any[] {
  if (!response || !response.results || !response.results.length) {
    return [];
  }
  
  // 결과 중 첫 번째 항목에서 키워드 목록 가져오기
  const result = response.results[0];
  
  // 응답 형식에 따라 키워드 목록 처리
  if (result.keywords && Array.isArray(result.keywords)) {
    // 백업 데이터 또는 사용자 정의 형식
    return result.keywords;
  } else if (result.data && Array.isArray(result.data)) {
    // 기본 API 응답 데이터 형식
    // data 배열에서 키워드 및 값 추출
    return result.data.map((item: any, index: number) => ({
      rank: index + 1,
      keyword: item.title || '알 수 없음',
      value: item.ratio || 0,
    }));
  }
  
  return [];
}