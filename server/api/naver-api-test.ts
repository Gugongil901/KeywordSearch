// 네이버 API 엔드포인트 테스트 모듈
// 네이버 API 문서에 명시된 다양한 엔드포인트를 테스트하여 실제로 작동하는지 확인합니다

import axios from "axios";

// .env에서 직접 환경 변수 접근
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// API 엔드포인트 정의
const API_ENDPOINTS = {
  // 네이버 쇼핑 검색 API
  SEARCH: "https://openapi.naver.com/v1/search/shop.json",
  
  // 데이터랩 API 엔드포인트들
  DATALAB: {
    // 통합 검색어 트렌드 API (문서: https://developers.naver.com/docs/serviceapi/datalab/search/search.md)
    SEARCH_TREND: "https://openapi.naver.com/v1/datalab/search",
    
    // 쇼핑인사이트 분야별 트렌드 API (문서: https://developers.naver.com/docs/serviceapi/datalab/shopping/shopping.md)
    SHOPPING_CATEGORY_TREND: "https://openapi.naver.com/v1/datalab/shopping/categories",
    
    // 쇼핑인사이트 키워드 트렌드 API (문서에 명시되어 있으나 실제로는 404 에러 발생)
    SHOPPING_KEYWORD_TREND: "https://openapi.naver.com/v1/datalab/shopping/category/keywords/ratio",
    
    // 쇼핑인사이트 키워드 트렌드 API - 다른 가능한 형식 테스트
    SHOPPING_KEYWORD_TREND_ALT1: "https://openapi.naver.com/v1/datalab/shopping/category/keywords",
    SHOPPING_KEYWORD_TREND_ALT2: "https://openapi.naver.com/v1/datalab/shopping/keywords",
    
    // 쇼핑인사이트 키워드 트렌드 API - 기존 문서 URL
    SHOPPING_KEYWORD_TREND_LEGACY: "https://openapi.naver.com/v1/datalab/shopping/category/keywords/ratio",
  },
  
  // 네이버 광고 API (네이버 검색광고 API)
  AD: {
    KEYWORDS: "https://api.naver.com/keywordstool",
    KEYWORD_STATS: "https://api.naver.com/manage/keywordstool"
  }
};

// API 클라이언트 설정
const naverClient = axios.create({
  headers: {
    "X-Naver-Client-Id": NAVER_CLIENT_ID,
    "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    "Content-Type": "application/json"
  },
  timeout: 10000
});

// 테스트할 API 요청 본문 정의
const TEST_REQUESTS = {
  SEARCH: {
    params: { 
      query: "나이키", 
      display: 5 
    }
  },
  
  DATALAB_SEARCH_TREND: {
    startDate: "2025-03-10",
    endDate: "2025-03-19",
    timeUnit: "date",
    keywordGroups: [
      {
        groupName: "나이키",
        keywords: ["나이키"]
      }
    ],
    device: "",
    gender: "",
    ages: []
  },
  
  DATALAB_SHOPPING_CATEGORY: {
    startDate: "2025-03-10",
    endDate: "2025-03-19",
    timeUnit: "date",
    category: [
      {
        name: "패션의류",
        param: ["50000000"]
      }
    ],
    device: "",
    gender: "",
    ages: []
  },
  
  DATALAB_SHOPPING_KEYWORD: {
    startDate: "2025-03-10",
    endDate: "2025-03-19", 
    timeUnit: "date",
    category: "ALL",
    keyword: ["나이키", "아디다스"],
    device: "",
    gender: "",
    ages: []
  }
};

/**
 * 모든 네이버 API 엔드포인트를 테스트하는 함수
 * 각 엔드포인트에 테스트 요청을 보내고 결과를 기록합니다
 */
export async function testAllNaverAPIs() {
  console.log("===== 네이버 API 엔드포인트 테스트 시작 =====");
  console.log(`네이버 API 인증 정보: 클라이언트 ID=${NAVER_CLIENT_ID ? "설정됨" : "미설정"}, 시크릿=${NAVER_CLIENT_SECRET ? "설정됨" : "미설정"}`);
  
  const results = {
    success: [] as string[],
    failure: [] as { endpoint: string, status: number, message: string }[]
  };
  
  // 1. 쇼핑 검색 API 테스트
  try {
    console.log("\n🔍 테스트 1: 네이버 쇼핑 검색 API");
    console.log(`엔드포인트: ${API_ENDPOINTS.SEARCH}`);
    console.log(`요청: ${JSON.stringify(TEST_REQUESTS.SEARCH)}`);
    
    const response = await naverClient.get(API_ENDPOINTS.SEARCH, { 
      params: TEST_REQUESTS.SEARCH.params 
    });
    
    console.log(`✅ 성공: 상태 코드=${response.status}`);
    console.log(`응답 샘플: ${JSON.stringify(response.data).substring(0, 200)}...`);
    results.success.push(API_ENDPOINTS.SEARCH);
  } catch (error: any) {
    console.log(`❌ 실패: ${error.message}`);
    console.log(`응답 상태: ${error.response?.status || '알 수 없음'}`);
    results.failure.push({
      endpoint: API_ENDPOINTS.SEARCH,
      status: error.response?.status || 0,
      message: error.message
    });
  }
  
  // 2. 통합 검색어 트렌드 API 테스트
  try {
    console.log("\n🔍 테스트 2: 네이버 데이터랩 통합 검색어 트렌드 API");
    console.log(`엔드포인트: ${API_ENDPOINTS.DATALAB.SEARCH_TREND}`);
    console.log(`요청: ${JSON.stringify(TEST_REQUESTS.DATALAB_SEARCH_TREND).substring(0, 200)}...`);
    
    const response = await naverClient.post(API_ENDPOINTS.DATALAB.SEARCH_TREND, 
      TEST_REQUESTS.DATALAB_SEARCH_TREND
    );
    
    console.log(`✅ 성공: 상태 코드=${response.status}`);
    console.log(`응답 샘플: ${JSON.stringify(response.data).substring(0, 200)}...`);
    results.success.push(API_ENDPOINTS.DATALAB.SEARCH_TREND);
  } catch (error: any) {
    console.log(`❌ 실패: ${error.message}`);
    console.log(`응답 상태: ${error.response?.status || '알 수 없음'}`);
    results.failure.push({
      endpoint: API_ENDPOINTS.DATALAB.SEARCH_TREND,
      status: error.response?.status || 0,
      message: error.message
    });
  }
  
  // 3. 쇼핑인사이트 분야별 트렌드 API 테스트
  try {
    console.log("\n🔍 테스트 3: 네이버 데이터랩 쇼핑인사이트 분야별 트렌드 API");
    console.log(`엔드포인트: ${API_ENDPOINTS.DATALAB.SHOPPING_CATEGORY_TREND}`);
    console.log(`요청: ${JSON.stringify(TEST_REQUESTS.DATALAB_SHOPPING_CATEGORY).substring(0, 200)}...`);
    
    const response = await naverClient.post(API_ENDPOINTS.DATALAB.SHOPPING_CATEGORY_TREND, 
      TEST_REQUESTS.DATALAB_SHOPPING_CATEGORY
    );
    
    console.log(`✅ 성공: 상태 코드=${response.status}`);
    console.log(`응답 샘플: ${JSON.stringify(response.data).substring(0, 200)}...`);
    results.success.push(API_ENDPOINTS.DATALAB.SHOPPING_CATEGORY_TREND);
  } catch (error: any) {
    console.log(`❌ 실패: ${error.message}`);
    console.log(`응답 상태: ${error.response?.status || '알 수 없음'}`);
    results.failure.push({
      endpoint: API_ENDPOINTS.DATALAB.SHOPPING_CATEGORY_TREND,
      status: error.response?.status || 0,
      message: error.message
    });
  }
  
  // 4. 쇼핑인사이트 키워드 트렌드 API 테스트 (문서 기준)
  try {
    console.log("\n🔍 테스트 4: 네이버 데이터랩 쇼핑인사이트 키워드 트렌드 API (문서 URL)");
    console.log(`엔드포인트: ${API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND}`);
    console.log(`요청: ${JSON.stringify(TEST_REQUESTS.DATALAB_SHOPPING_KEYWORD).substring(0, 200)}...`);
    
    const response = await naverClient.post(API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND, 
      TEST_REQUESTS.DATALAB_SHOPPING_KEYWORD
    );
    
    console.log(`✅ 성공: 상태 코드=${response.status}`);
    console.log(`응답 샘플: ${JSON.stringify(response.data).substring(0, 200)}...`);
    results.success.push(API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND);
  } catch (error: any) {
    console.log(`❌ 실패: ${error.message}`);
    console.log(`응답 상태: ${error.response?.status || '알 수 없음'}`);
    results.failure.push({
      endpoint: API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND,
      status: error.response?.status || 0,
      message: error.message
    });
  }
  
  // 5. 쇼핑인사이트 키워드 트렌드 API 테스트 (대체 URL 1)
  try {
    console.log("\n🔍 테스트 5: 네이버 데이터랩 쇼핑인사이트 키워드 트렌드 API (대체 URL 1)");
    console.log(`엔드포인트: ${API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND_ALT1}`);
    console.log(`요청: ${JSON.stringify(TEST_REQUESTS.DATALAB_SHOPPING_KEYWORD).substring(0, 200)}...`);
    
    const response = await naverClient.post(API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND_ALT1, 
      TEST_REQUESTS.DATALAB_SHOPPING_KEYWORD
    );
    
    console.log(`✅ 성공: 상태 코드=${response.status}`);
    console.log(`응답 샘플: ${JSON.stringify(response.data).substring(0, 200)}...`);
    results.success.push(API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND_ALT1);
  } catch (error: any) {
    console.log(`❌ 실패: ${error.message}`);
    console.log(`응답 상태: ${error.response?.status || '알 수 없음'}`);
    results.failure.push({
      endpoint: API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND_ALT1,
      status: error.response?.status || 0,
      message: error.message
    });
  }
  
  // 6. 쇼핑인사이트 키워드 트렌드 API 테스트 (대체 URL 2)
  try {
    console.log("\n🔍 테스트 6: 네이버 데이터랩 쇼핑인사이트 키워드 트렌드 API (대체 URL 2)");
    console.log(`엔드포인트: ${API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND_ALT2}`);
    console.log(`요청: ${JSON.stringify(TEST_REQUESTS.DATALAB_SHOPPING_KEYWORD).substring(0, 200)}...`);
    
    const response = await naverClient.post(API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND_ALT2, 
      TEST_REQUESTS.DATALAB_SHOPPING_KEYWORD
    );
    
    console.log(`✅ 성공: 상태 코드=${response.status}`);
    console.log(`응답 샘플: ${JSON.stringify(response.data).substring(0, 200)}...`);
    results.success.push(API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND_ALT2);
  } catch (error: any) {
    console.log(`❌ 실패: ${error.message}`);
    console.log(`응답 상태: ${error.response?.status || '알 수 없음'}`);
    results.failure.push({
      endpoint: API_ENDPOINTS.DATALAB.SHOPPING_KEYWORD_TREND_ALT2,
      status: error.response?.status || 0,
      message: error.message
    });
  }
  
  // 결과 요약
  console.log("\n===== 네이버 API 테스트 결과 요약 =====");
  console.log(`성공한 API 엔드포인트 (${results.success.length}개):`);
  results.success.forEach(endpoint => console.log(`- ✅ ${endpoint}`));
  
  console.log(`\n실패한 API 엔드포인트 (${results.failure.length}개):`);
  results.failure.forEach(item => console.log(`- ❌ ${item.endpoint} (상태: ${item.status}, 메시지: ${item.message})`));
  
  return results;
}

/**
 * 네이버 API 기본 동작 확인 함수
 * 검색 API와 통합 검색어 트렌드 API만 테스트합니다
 */
export async function testBasicNaverAPIs() {
  console.log("===== 네이버 API 기본 동작 확인 =====");
  
  // 1. 쇼핑 검색 API 테스트
  try {
    console.log("\n🔍 테스트 1: 네이버 쇼핑 검색 API");
    console.log(`엔드포인트: ${API_ENDPOINTS.SEARCH}`);
    
    const response = await naverClient.get(API_ENDPOINTS.SEARCH, { 
      params: { query: "나이키", display: 5 } 
    });
    
    console.log(`✅ 성공: 상태 코드=${response.status}`);
    console.log(`응답 샘플: ${JSON.stringify(response.data).substring(0, 200)}...`);
    return true;
  } catch (error: any) {
    console.log(`❌ 실패: ${error.message}`);
    console.log(`응답 상태: ${error.response?.status || '알 수 없음'}`);
    return false;
  }
}

// 노출용 API 엔드포인트 맵 - 다른 모듈에서 사용할 수 있도록 내보냅니다
export const NAVER_API_ENDPOINTS = API_ENDPOINTS;