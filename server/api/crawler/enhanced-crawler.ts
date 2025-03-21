/**
 * 고도화된 네이버 쇼핑인사이트 크롤링 모듈
 * 
 * 다양한 헤더와 URL 패턴, 고급 파싱 기법을 사용해 크롤링 성공률 향상
 */

import axios from 'axios';
import { logger } from '../../utils/logger';

// User-Agent 목록 - 다양한 브라우저와 장치 시뮬레이션
const USER_AGENTS = [
  // 데스크톱 브라우저
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  
  // 모바일 브라우저
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
];

// Referer URL 목록 - 다양한 출발점 시뮬레이션
const REFERERS = [
  'https://www.naver.com/',
  'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=%EC%87%BC%ED%95%91%EC%9D%B8%EC%82%AC%EC%9D%B4%ED%8A%B8',
  'https://datalab.naver.com/',
  'https://trends.google.com/trends/',
  'https://msearch.shopping.naver.com/search/all'
];

// Accept 헤더 목록
const ACCEPT_HEADERS = [
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
];

// Accept-Language 헤더 목록
const LANGUAGE_HEADERS = [
  'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'ko,en-US;q=0.9,en;q=0.8',
  'ko-KR,ko;q=0.8,en;q=0.6'
];

// 랜덤 숫자 생성 (최소값, 최대값 사이)
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 목록에서 랜덤 항목 선택
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// 요청 헤더 생성 - 브라우저와 유사한 다양한 헤더 설정
function generateRequestHeaders(mobile: boolean = false) {
  const userAgent = getRandomItem(USER_AGENTS);
  
  // 기본 헤더 설정
  const headers: Record<string, string> = {
    'User-Agent': userAgent,
    'Accept': getRandomItem(ACCEPT_HEADERS),
    'Accept-Language': getRandomItem(LANGUAGE_HEADERS),
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': getRandomItem(REFERERS),
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': getRandomInt(0, 1) ? 'max-age=0' : 'no-cache'
  };
  
  // 쿠키 헤더 추가 (랜덤하게)
  if (getRandomInt(0, 1)) {
    headers['Cookie'] = `NNB=${Math.random().toString(36).substring(2, 10)}; nx_ssl=2; ASID=dbffasdf${getRandomInt(100, 999)}`;
  }
  
  // 모바일 특화 헤더
  if (mobile && userAgent.includes('Mobile')) {
    headers['X-Requested-With'] = 'XMLHttpRequest';
  }
  
  return headers;
}

// URL 패턴 생성 - 다양한 URL 패턴을 시도
function generateUrlPatterns(category: string = 'all', period: string = 'daily'): string[] {
  // 기본/데스크톱 URL 패턴
  const baseUrls = [
    'https://datalab.naver.com/shoppingInsight/sCategory.naver',
    'https://datalab.naver.com/shoppingInsight/sDisp.naver',
    'https://datalab.naver.com/shoppingInsights/shopping-insight.naver'
  ];
  
  // 모바일 URL 패턴
  const mobileUrls = [
    'https://m.datalab.naver.com/shoppingInsight/sCategory.naver',
    'https://m.datalab.naver.com/shoppingInsight/sDisp.naver'
  ];
  
  // API URL 패턴 (JSONP/JSON 응답을 제공할 수 있는 엔드포인트)
  const apiUrls = [
    'https://datalab.naver.com/shoppingInsight/getKeywordRank.naver',
    'https://datalab.naver.com/shoppingInsight/getDispRank.naver'
  ];
  
  // 카테고리와 기간을 쿼리 파라미터에 추가
  const categoryParam = category !== 'all' ? `&cid=${category}` : '';
  const allUrls = [
    ...baseUrls.map(url => `${url}?${getRandomInt(0, 1) ? 'cat_id' : 'cid'}=${category}&period=${period}`),
    ...mobileUrls.map(url => `${url}?${getRandomInt(0, 1) ? 'cat_id' : 'cid'}=${category}&period=${period}`),
    ...apiUrls.map(url => `${url}?category=${category}&period=${period}&age=all&device=pc&gender=all&time=2&year=2025&month=3${getRandomInt(0, 1) ? '&callback=jQuery' + getRandomInt(10000000, 99999999) : ''}`)
  ];
  
  // URL 패턴 무작위 섞기
  return allUrls.sort(() => Math.random() - 0.5);
}

// HTML에서 키워드 추출 - 다양한 HTML 구조에 대응
function extractKeywordsFromHtml(html: string): string[] | null {
  const keywords: string[] = [];
  let found = false;
  
  // 정규식 패턴 - 다양한 HTML 구조에서 키워드 추출 시도
  const patterns = [
    // 1. 일반적인 키워드 리스트 구조 (li 내부의 텍스트)
    /<li[^>]*>[^<]*<[^>]*rank[^>]*>[^<]*<span[^>]*>(\d+)<\/span>[^<]*<span[^>]*>([^<]+)<\/span>/g,
    
    // 2. 테이블 형태의 키워드 랭킹
    /<tr[^>]*>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*([^<]+)\s*<\/td>/g,
    
    // 3. div 기반 키워드 랭킹 (최신 네이버 구조)
    /<div[^>]*item_[^>]*>\s*<span[^>]*>\s*(\d+)\s*<\/span>\s*<span[^>]*>\s*([^<]+)\s*<\/span>/g,
    
    // 4. 자바스크립트 데이터 구조에서 추출 (JSON 형태)
    /keywordList\s*[:=]\s*\[\s*({[^}]*})/g,
    
    // 5. 인기검색어 영역 식별
    /<div[^>]*class="[^"]*keyword_rank[^"]*"[^>]*>([\s\S]*?)<\/div>/g,
    
    // 6. JSONP 응답에서 추출
    /jQuery\d+\((\{.*\})\)/
  ];
  
  // 1. 모든 패턴 시도
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern));
    if (matches.length > 0) {
      // 패턴별 처리 방식
      if (pattern.toString().includes('keywordList')) {
        // JSON 형태 데이터 처리
        try {
          const jsonMatch = html.match(/keywordList\s*[:=]\s*(\[.*?\])/s);
          if (jsonMatch && jsonMatch[1]) {
            const keywordList = JSON.parse(jsonMatch[1].replace(/'/g, '"').replace(/(\w+):/g, '"$1":'));
            keywordList.forEach((item: any) => {
              if (item.keyword) keywords.push(item.keyword);
            });
            found = true;
          }
        } catch (e) {
          logger.error(`JSON 파싱 실패: ${e}`);
        }
      } else if (pattern.toString().includes('jQuery')) {
        // JSONP 응답 처리
        try {
          const jsonpMatch = html.match(/jQuery\d+\((\{.*\})\)/s);
          if (jsonpMatch && jsonpMatch[1]) {
            const data = JSON.parse(jsonpMatch[1]);
            if (data.ranks && Array.isArray(data.ranks)) {
              data.ranks.forEach((item: any) => {
                if (item.keyword) keywords.push(item.keyword);
              });
              found = true;
            }
          }
        } catch (e) {
          logger.error(`JSONP 파싱 실패: ${e}`);
        }
      } else {
        // 일반 HTML 패턴에서 키워드 추출
        matches.forEach(match => {
          if (match[2] && match[2].trim()) {
            keywords.push(match[2].trim());
            found = true;
          }
        });
      }
    }
    
    if (found) break;
  }
  
  // 2. 특정 키워드 영역을 찾아 텍스트 노드 추출 시도
  if (!found) {
    // 키워드 목록이 포함된 주요 영역 찾기
    const keywordSections = [
      /<div[^>]*class="[^"]*keyword_rank[^"]*"[^>]*>([\s\S]*?)<\/div>/,
      /<div[^>]*class="[^"]*rank_top[^"]*"[^>]*>([\s\S]*?)<\/div>/,
      /<div[^>]*class="[^"]*ranking_list[^"]*"[^>]*>([\s\S]*?)<\/div>/,
      /<div[^>]*class="[^"]*keyword_list[^"]*"[^>]*>([\s\S]*?)<\/div>/,
      /<ul[^>]*class="[^"]*keyword_list[^"]*"[^>]*>([\s\S]*?)<\/ul>/
    ];
    
    for (const sectionPattern of keywordSections) {
      const sectionMatch = html.match(sectionPattern);
      if (sectionMatch && sectionMatch[1]) {
        const section = sectionMatch[1];
        // 섹션 내부에서 실제 키워드 추출 (li, a, span 등 다양한 요소 고려)
        const keywordMatches = Array.from(section.matchAll(/<(?:li|a|span)[^>]*>([^<]{2,30})<\/(?:li|a|span)>/g));
        if (keywordMatches.length > 0) {
          keywordMatches.forEach(match => {
            if (match[1] && match[1].trim()) {
              keywords.push(match[1].trim());
              found = true;
            }
          });
        }
      }
      if (found) break;
    }
  }
  
  // 3. 일반 텍스트 노드에서 가능성 있는 키워드 추출
  if (!found) {
    const textNodePattern = />([^<]{3,20})</g;
    const textNodes: string[] = [];
    let match;
    
    while ((match = textNodePattern.exec(html)) !== null) {
      const text = match[1].trim();
      if (text && 
          text.length >= 2 && 
          // UI 요소나 불필요한 텍스트 제외
          !/업데이트|선택됨|권장|안내|NAVER|네이버|바로가기|다음|이전|메뉴|홈|설정|로그인/.test(text) &&
          // 한글 포함 단어 우선
          /[가-힣]/.test(text)) {
        textNodes.push(text);
        found = true;
      }
    }
    
    // 빈도수 기반 키워드 추출
    if (textNodes.length > 0) {
      const frequency: Record<string, number> = {};
      textNodes.forEach(text => {
        frequency[text] = (frequency[text] || 0) + 1;
      });
      
      // 출현 빈도 기준 정렬
      const sortedByFreq = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
      
      keywords.push(...sortedByFreq.slice(0, 10));
    }
  }
  
  return keywords.length > 0 ? keywords : null;
}

/**
 * 향상된 크롤링 함수 - 더 많은 URL과 헤더 조합 시도
 * @param category 카테고리 ID
 * @param period 기간 ('daily', 'weekly')
 * @param limit 최대 키워드 수
 * @returns 추출된 키워드 배열
 */
export async function enhancedCrawling(category: string = 'all', period: string = 'daily', limit: number = 10): Promise<string[]> {
  const urls = generateUrlPatterns(category, period);
  const tryMobileVersion = Math.random() > 0.5; // 50% 확률로 모바일 버전 시도
  
  logger.info(`🚀 고도화된 크롤링 시작: 카테고리=${category}, 기간=${period}, URL 패턴=${urls.length}개`);
  
  let lastError: Error | undefined;
  let extractedKeywords: string[] | null = null;
  
  // 모든 URL 패턴 시도
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const isMobile = url.includes('m.datalab');
    
    try {
      logger.info(`🔄 URL 패턴 ${i+1}/${urls.length} 시도 중: ${url}`);
      
      // 요청 헤더 설정
      const headers = generateRequestHeaders(isMobile || tryMobileVersion);
      
      // 타임아웃 설정 (3~8초 사이 랜덤값)
      const timeout = getRandomInt(3000, 8000);
      
      // HTTP 요청 실행
      const response = await axios.get(url, {
        headers,
        timeout,
        maxRedirects: 5,
        validateStatus: status => status < 400 // 성공 및 리다이렉트 응답만 허용
      });
      
      if (response.status === 200) {
        logger.info(`✅ URL 패턴 ${i+1} 응답 성공: ${url}`);
        
        // HTML에서 키워드 추출 시도
        extractedKeywords = extractKeywordsFromHtml(response.data);
        
        if (extractedKeywords && extractedKeywords.length > 0) {
          logger.info(`🎯 키워드 추출 성공: ${extractedKeywords.length}개 키워드 발견`);
          
          // 필터링 및 가공
          const filteredKeywords = extractedKeywords
            .filter(keyword => 
              keyword.length > 1 && 
              !/업데이트|선택됨|권장|안내|NAVER|네이버|바로가기|다음|이전|메뉴|홈|설정|로그인/.test(keyword)
            )
            .slice(0, limit);
          
          if (filteredKeywords.length > 0) {
            return filteredKeywords;
          }
        } else {
          logger.warn(`⚠️ URL 패턴 ${i+1}에서 키워드를 찾을 수 없음`);
        }
      }
    } catch (error: any) {
      logger.error(`❌ URL 패턴 ${i+1} 실패: ${error.message}`);
      lastError = error;
    }
    
    // 요청 간 딜레이 추가 (0.5~2초 랜덤)
    await new Promise(resolve => setTimeout(resolve, getRandomInt(500, 2000)));
  }
  
  // 모든 시도 실패 시 에러 발생
  if (lastError) {
    throw new Error(`고도화된 크롤링 실패: 모든 URL 패턴 시도 실패. 마지막 오류: ${lastError.message}`);
  }
  
  return [];
}