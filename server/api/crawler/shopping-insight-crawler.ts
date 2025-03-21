/**
 * 네이버 쇼핑인사이트 크롤링 모듈
 * 
 * API 호출 대신 직접 웹페이지에서 인기 키워드 데이터를 추출하는 기능 제공
 */

import axios from 'axios';

// 카테고리 코드 매핑
const NAVER_CATEGORY_MAP: Record<string, string> = {
  all: "50000000", // 전체 대신 패션의류 사용 (API 요구사항)
  fashion: "50000000", // 패션의류
  accessory: "50000001", // 패션잡화
  beauty: "50000002", // 화장품/미용
  digital: "50000003", // 디지털/가전
  furniture: "50000004", // 가구/인테리어
  baby: "50000005", // 출산/육아
  food: "50000006", // 식품
  sports: "50000007", // 스포츠/레저
  life: "50000008", // 생활/건강
  health: "50000008", // 생활/건강 (동일한 코드 사용)
};

// 네이버 쇼핑인사이트 웹 URL (2025년 3월 업데이트)
const SHOPPING_INSIGHT_URL = 'https://datalab.naver.com/shoppingInsight/sKeyword.naver';
const SHOPPING_API_URL = 'https://datalab.naver.com/shoppingInsight/getKeywordList.naver';
const SHOPPING_API_URL_ALT = 'https://datalab.naver.com/shopping/getKeywordRank.naver';

/**
 * 네이버 쇼핑인사이트 페이지에서 인기 키워드 추출
 * 
 * @param category 카테고리 ('all', 'fashion', 'beauty' 등)
 * @param period 기간 ('daily', 'weekly', 'monthly')
 * @param limit 가져올 키워드 수
 * @returns 인기 키워드 배열
 */
export async function crawlShoppingInsightKeywords(
  category: string = 'all',
  period: string = 'daily',
  limit: number = 20
): Promise<string[]> {
  try {
    console.log(`🕸️ 네이버 쇼핑인사이트 크롤링 시작: 카테고리=${category}, 기간=${period}`);
    
    // 카테고리 코드 매핑
    const categoryCode = NAVER_CATEGORY_MAP[category] || NAVER_CATEGORY_MAP.all;
    
    // 기간 파라미터 매핑 (업데이트됨)
    const periodParam = period === 'daily' ? 'P1D' : period === 'weekly' ? 'P7D' : 'P30D';
    
    // 현재 날짜 기준으로 날짜 계산
    const endDate = new Date();
    const startDate = new Date();
    
    // 기간에 따라 시작일 설정
    if (period === 'daily') {
      startDate.setDate(endDate.getDate() - 1);
    } else if (period === 'weekly') {
      startDate.setDate(endDate.getDate() - 7);
    } else {
      startDate.setDate(endDate.getDate() - 30);
    }
    
    // 날짜 형식 변환 (YYYY-MM-DD)
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    // 다양한 접근 방식을 시도하기 위한 매개변수 세트
    const paramsList = [
      // 방법 1: 기존 접근 방식
      {
        url: SHOPPING_API_URL,
        method: 'post',
        data: new URLSearchParams({
          cid: categoryCode,
          timeUnit: periodParam,
          age: '',
          gender: '',
          device: '',
          page: '1',
          count: limit.toString()
        }).toString(),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Referer': SHOPPING_INSIGHT_URL,
          'X-Requested-With': 'XMLHttpRequest'
        }
      },
      
      // 방법 2: 대체 API 엔드포인트 및 JSON 형식
      {
        url: SHOPPING_API_URL_ALT,
        method: 'post',
        data: JSON.stringify({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          category: categoryCode,
          timeUnit: period,
          limit: limit
        }),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Origin': 'https://datalab.naver.com',
          'Referer': SHOPPING_INSIGHT_URL,
          'X-Requested-With': 'XMLHttpRequest'
        }
      },
      
      // 방법 3: 웹페이지 직접 파싱
      {
        url: `${SHOPPING_INSIGHT_URL}?cid=${categoryCode}&timeUnit=${periodParam}`,
        method: 'get',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Referer': 'https://datalab.naver.com',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        }
      }
    ];
    
    // 각 접근 방식 순차적으로 시도
    let lastError = null;
    
    for (const [index, params] of paramsList.entries()) {
      try {
        console.log(`🔄 크롤링 방법 ${index + 1} 시도 중...`);
        
        const response = params.method === 'post' 
          ? await axios.post(params.url, params.data, { headers: params.headers })
          : await axios.get(params.url, { headers: params.headers });
        
        console.log(`✅ 방법 ${index + 1} 응답 코드: ${response.status}`);
        
        // 방법 1 응답 처리
        if (params.url === SHOPPING_API_URL && response.data && response.data.success) {
          const keywords = response.data.ranks.map((item: any) => item.keyword);
          console.log(`✅ 방법 1 성공: ${keywords.length}개 키워드 추출`);
          console.log(`첫 5개 키워드: ${keywords.slice(0, 5).join(', ')}`);
          return keywords.slice(0, limit);
        }
        
        // 방법 2 응답 처리
        if (params.url === SHOPPING_API_URL_ALT && response.data && response.data.results) {
          const keywords = response.data.results.map((item: any) => item.keyword);
          console.log(`✅ 방법 2 성공: ${keywords.length}개 키워드 추출`);
          console.log(`첫 5개 키워드: ${keywords.slice(0, 5).join(', ')}`);
          return keywords.slice(0, limit);
        }
        
        // 방법 3: HTML 파싱 시도
        if (params.method === 'get' && response.data) {
          // HTML에서 키워드 테이블 파싱 (정규식 사용)
          const keywordMatches = response.data.match(/"keyword":"([^"]+)"/g);
          
          if (keywordMatches && keywordMatches.length > 0) {
            const keywords = keywordMatches
              .map(match => match.replace(/"keyword":"([^"]+)"/, '$1'))
              .filter((value, index, self) => self.indexOf(value) === index); // 중복 제거
              
            console.log(`✅ 방법 3 성공: ${keywords.length}개 키워드 추출`);
            console.log(`첫 5개 키워드: ${keywords.slice(0, 5).join(', ')}`);
            return keywords.slice(0, limit);
          } else {
            console.log(`⚠️ 방법 3: HTML에서 키워드를 찾을 수 없습니다.`);
          }
        }
      } catch (error: any) {
        console.error(`❌ 방법 ${index + 1} 실패:`, error.message);
        lastError = error;
        
        // 네트워크 응답이 있는 경우 응답 상태 로깅
        if (error.response) {
          console.error(`응답 상태: ${error.response.status}`);
          // 응답 데이터 로깅 (너무 길지 않은 경우)
          try {
            if (typeof error.response.data === 'string' && error.response.data.length < 500) {
              console.error(`응답 데이터: ${error.response.data}`);
            } else {
              console.error(`응답 데이터: (너무 길어서 생략)`);
            }
          } catch (e) {
            console.error(`응답 데이터 파싱 실패`);
          }
        }
      }
    }

    throw new Error('네이버 쇼핑인사이트 데이터 추출 실패');
  } catch (error: any) {
    console.error(`❌ 쇼핑인사이트 크롤링 실패: ${error.message}`);
    
    // 네트워크 응답이 있는 경우 응답 상태 로깅
    if (error.response) {
      console.error(`응답 상태: ${error.response.status}`);
      console.error(`응답 데이터: ${JSON.stringify(error.response.data)}`);
    }
    
    throw new Error(`쇼핑인사이트 크롤링 실패: ${error.message}`);
  }
}

/**
 * 크롤링 실패 시 사용할 카테고리별 백업 키워드 생성
 * 
 * @param category 카테고리
 * @returns 백업 키워드 배열
 */
export function getFallbackKeywords(category: string): string[] {
  switch (category) {
    case 'health':
      return [
        '비타민', '유산균', '오메가3', '루테인', '칼슘', '마그네슘', 
        '콜라겐', '밀크씨슬', '철분', '프로폴리스'
      ];
    case 'beauty':
      return [
        '선크림', '마스크팩', '토너', '에센스', '크림', '세럼', 
        '파데이션', '아이크림', '쿠션', '클렌징'
      ];
    case 'food':
      return [
        '김치', '라면', '과자', '간식', '견과류', '음료', 
        '건강즙', '한우', '귤', '곡물'
      ];
    case 'digital':
      return [
        '노트북', '블루투스이어폰', '스마트폰', '태블릿', '가습기', '모니터', 
        '공기청정기', '무선청소기', '블루투스스피커', '키보드'
      ];
    case 'fashion':
      return [
        '원피스', '청바지', '티셔츠', '패딩', '가디건', '자켓', 
        '코트', '바지', '니트', '스커트'
      ];
    case 'accessory':
      return [
        '가방', '신발', '시계', '목걸이', '모자', '지갑', 
        '벨트', '운동화', '선글라스', '귀걸이'
      ];
    case 'baby':
      return [
        '기저귀', '이유식', '유모차', '분유', '젖병', '아기과자', 
        '이유식재료', '장난감', '아기옷', '물티슈'
      ];
    case 'sports':
      return [
        '운동화', '헬스', '자전거', '골프', '등산', '테니스', 
        '수영', '러닝화', '짐볼', '요가매트'
      ];
    case 'furniture':
      return [
        '침대', '소파', '책상', '의자', '옷장', '서랍장', 
        '식탁', '화장대', '거실장', '조명'
      ];
    case 'life':
      return [
        '샴푸', '치약', '세제', '바디워시', '핸드워시', '섬유유연제', 
        '휴지', '물티슈', '바디로션', '주방세제'
      ];
    default: // 'all'
      return [
        '가방', '선크림', '마스크', '화장품', '청바지', '운동화', 
        '패딩', '노트북', '이어폰', '책상'
      ];
  }
}