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
const SHOPPING_INSIGHT_URLS = [
  'https://datalab.naver.com/shoppingInsight/sKeyword.naver',
  'https://datalab.naver.com/shopping/insight/keyword.naver',
  'https://datalab.naver.com/shopping/insight/trends.naver',
  'https://datalab.naver.com/shoppingInsight/news/shoppingKeyword.nhn',
  'https://datalab.naver.com/shopping/keyword/trends.naver'
];
const SHOPPING_API_URLS = [
  'https://datalab.naver.com/shoppingInsight/getKeywordList.naver',
  'https://datalab.naver.com/shopping/getKeywordRank.naver',
  'https://datalab.naver.com/shopping/insight/api/getKeywordRank.nhn',
  'https://datalab.naver.com/shopping/api/getKeywordTrend.naver'
];

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
    const paramsList = [];
    
    // API 요청 매개변수
    for (const apiUrl of SHOPPING_API_URLS) {
      // POST 요청 (폼 데이터 방식)
      paramsList.push({
        url: apiUrl,
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
          'Referer': SHOPPING_INSIGHT_URLS[0],
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      // POST 요청 (JSON 데이터 방식)
      paramsList.push({
        url: apiUrl,
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
          'Referer': SHOPPING_INSIGHT_URLS[0],
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    }
    
    // 웹페이지 직접 파싱 (각 인사이트 URL에 대해)
    for (const insightUrl of SHOPPING_INSIGHT_URLS) {
      paramsList.push({
        url: `${insightUrl}?cid=${categoryCode}&timeUnit=${periodParam}`,
        method: 'get',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Referer': 'https://datalab.naver.com',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        }
      });
      
      // 키워드 랭킹 형식 URL 시도
      paramsList.push({
        url: `${insightUrl}?categoryId=${categoryCode}&period=${period === 'daily' ? 'date' : period}`,
        method: 'get',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Referer': 'https://datalab.naver.com',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        }
      });
    }
    
    // 각 접근 방식 순차적으로 시도
    let lastError = null;
    
    for (const [index, params] of paramsList.entries()) {
      try {
        console.log(`🔄 크롤링 방법 ${index + 1} 시도 중...`);
        
        const response = params.method === 'post' 
          ? await axios.post(params.url, params.data, { headers: params.headers })
          : await axios.get(params.url, { headers: params.headers });
        
        console.log(`✅ 방법 ${index + 1} 응답 코드: ${response.status}`);
        
        // API 응답 처리 (ranks 형식)
        if (response.data && response.data.success && response.data.ranks) {
          const keywords = response.data.ranks.map((item: any) => item.keyword);
          console.log(`✅ API 응답(ranks) 성공: ${keywords.length}개 키워드 추출`);
          console.log(`첫 5개 키워드: ${keywords.slice(0, 5).join(', ')}`);
          return keywords.slice(0, limit);
        }
        
        // API 응답 처리 (results 형식)
        if (response.data && response.data.results) {
          const keywords = response.data.results.map((item: any) => item.keyword);
          console.log(`✅ API 응답(results) 성공: ${keywords.length}개 키워드 추출`);
          console.log(`첫 5개 키워드: ${keywords.slice(0, 5).join(', ')}`);
          return keywords.slice(0, limit);
        }
        
        // 방법 3: HTML 파싱 시도
        if (params.method === 'get' && response.data) {
          console.log(`HTML 데이터 길이: ${response.data.length} 바이트`);
          
          // 다양한 HTML 파싱 방법 시도
          let keywords: string[] = [];
          
          // 방법 3-1: 정규식으로 키워드 JSON 데이터 추출
          const keywordMatches = response.data.match(/"keyword":"([^"]+)"/g);
          if (keywordMatches && keywordMatches.length > 0) {
            keywords = keywordMatches
              .map(match => match.replace(/"keyword":"([^"]+)"/, '$1'))
              .filter((value, index, self) => self.indexOf(value) === index); // 중복 제거
          }
          
          // 방법 3-2: 정규식으로 순위별 키워드 직접 추출 (테이블 구조 기반)
          if (keywords.length === 0) {
            const rankPattern = /<span class="rank_num">(\d+)<\/span>\s*<span class="rank_title">([^<]+)<\/span>/g;
            let match;
            const rankKeywords: string[] = [];
            
            while ((match = rankPattern.exec(response.data)) !== null) {
              rankKeywords.push(match[2].trim());
            }
            
            if (rankKeywords.length > 0) {
              keywords = rankKeywords;
              console.log(`순위별 키워드 추출 성공: ${keywords.length}개`);
            }
          }
          
          // 방법 3-3: data-rank 속성을 가진 요소에서 키워드 추출
          if (keywords.length === 0) {
            const dataRankPattern = /data-rank="(\d+)"[^>]*>([^<]+)<\/a>/g;
            let match;
            const rankKeywords: string[] = [];
            
            while ((match = dataRankPattern.exec(response.data)) !== null) {
              rankKeywords.push(match[2].trim());
            }
            
            if (rankKeywords.length > 0) {
              keywords = rankKeywords;
              console.log(`data-rank 속성에서 키워드 추출 성공: ${keywords.length}개`);
            }
          }
          
          // 방법 3-4: 순위 항목을 포함하는 li 요소에서 키워드 추출
          if (keywords.length === 0) {
            // 1번째 사진에서 본 HTML 구조를 기반으로 한 패턴
            const liPattern = /<li[^>]*>\s*<span[^>]*>(\d+)<\/span>\s*<span[^>]*>([^<]+)<\/span>/g;
            let match;
            const rankKeywords: string[] = [];
            
            while ((match = liPattern.exec(response.data)) !== null) {
              rankKeywords.push(match[2].trim());
            }
            
            if (rankKeywords.length > 0) {
              keywords = rankKeywords;
              console.log(`li 요소에서 키워드 추출 성공: ${keywords.length}개`);
            }
          }
          
          // 방법 3-5: 순위 테이블에서 키워드 추출 (첫 번째 이미지 기반)
          if (keywords.length === 0) {
            // 사진에서 본 표 구조에서 키워드 추출
            const tablePattern = /<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/g;
            let match;
            const rankKeywords: string[] = [];
            
            while ((match = tablePattern.exec(response.data)) !== null) {
              rankKeywords.push(match[2].trim());
            }
            
            if (rankKeywords.length > 0) {
              keywords = rankKeywords;
              console.log(`테이블에서 키워드 추출 성공: ${keywords.length}개`);
            }
          }
          
          // 방법 3-6: 두 번째 이미지 기반 - 인기 키워드 목록(2025년 형식)
          if (keywords.length === 0) {
            // 두 번째 사진에서 본 li 구조에서 키워드 추출
            const rankItemPattern = /<div[^>]*class="[^"]*rank-item[^"]*"[^>]*>\s*<span[^>]*>\s*(\d+)\s*<\/span>\s*([^<]+)/g;
            let match;
            const rankKeywords: string[] = [];
            
            while ((match = rankItemPattern.exec(response.data)) !== null) {
              rankKeywords.push(match[2].trim());
            }
            
            if (rankKeywords.length > 0) {
              keywords = rankKeywords;
              console.log(`rank-item에서 키워드 추출 성공: ${keywords.length}개`);
            }
          }
          
          // 방법 3-7: 두 번째 이미지 기반 - 개별 키워드 항목
          if (keywords.length === 0) {
            // 두 번째 사진 패턴
            const keywordItemPattern = />\s*(\d+)\s*<\/[^>]*>\s*<[^>]*>\s*([^<]+)\s*<\/[^>]*>\s*<[^>]*class="[^"]*change[^"]*"[^>]*>/g;
            let match;
            const rankKeywords: string[] = [];
            
            while ((match = keywordItemPattern.exec(response.data)) !== null) {
              rankKeywords.push(match[2].trim());
            }
            
            if (rankKeywords.length > 0) {
              keywords = rankKeywords;
              console.log(`순위-키워드-변화 패턴에서 추출 성공: ${keywords.length}개`);
            }
          }
          
          if (keywords.length > 0) {
            console.log(`✅ 방법 3 성공: ${keywords.length}개 키워드 추출`);
            console.log(`첫 5개 키워드: ${keywords.slice(0, 5).join(', ')}`);
            return keywords.slice(0, limit);
          } else {
            // HTML 샘플 일부 출력 (디버깅 용도)
            console.log(`⚠️ 방법 3: HTML에서 키워드를 찾을 수 없습니다.`);
            
            // 첫 번째 사진의 구조를 확인하기 위해 HTML 샘플 저장
            const htmlSample = response.data.slice(0, 500) + "..." + 
                             response.data.slice(response.data.length - 500);
            console.log(`HTML 샘플: ${htmlSample}`);
            
            // 키워드가 포함될 수 있는 텍스트 노드 검색
            const textNodePattern = />([^<]{3,20})</g;
            let match;
            const textNodes: string[] = [];
            
            while ((match = textNodePattern.exec(response.data)) !== null) {
              const text = match[1].trim();
              if (text && !text.includes('네이버') && !text.includes('검색') && text.length >= 2) {
                textNodes.push(text);
              }
            }
            
            // 텍스트 노드에서 찾은 내용 중 가장 많이 등장하는 것들을 키워드로 간주
            if (textNodes.length > 0) {
              // 빈도 계산
              const frequency: Record<string, number> = {};
              textNodes.forEach(text => {
                frequency[text] = (frequency[text] || 0) + 1;
              });
              
              // 빈도별로 정렬
              const sortedByFreq = Object.entries(frequency)
                .sort((a, b) => b[1] - a[1])
                .map(entry => entry[0]);
              
              if (sortedByFreq.length > 0) {
                console.log(`텍스트 노드에서 ${sortedByFreq.length}개 키워드 후보 발견`);
                keywords = sortedByFreq.slice(0, limit);
                console.log(`첫 5개 키워드 후보: ${keywords.slice(0, 5).join(', ')}`);
                return keywords;
              }
            }
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