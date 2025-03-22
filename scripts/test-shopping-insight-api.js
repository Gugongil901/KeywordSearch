/**
 * 네이버 쇼핑인사이트 API 테스트 스크립트
 * 
 * 사용법:
 * 1. node scripts/test-shopping-insight-api.js 실행
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM에서 __dirname 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Naver API Credentials
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || "ErTaCUGQWfhKvcEnftat";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "Xoq9VSewrv";

// 결과 저장 디렉토리
const resultsDir = path.join(__dirname, '../test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

/**
 * 네이버 쇼핑인사이트 API 호출 테스트
 * @param {string} apiName - API 이름
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} requestBody - 요청 본문
 */
async function testAPI(apiName, endpoint, requestBody) {
  console.log(`\n===== ${apiName} 테스트 =====`);
  console.log('요청 본문:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await axios({
      method: 'post',
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
      },
      data: requestBody,
      timeout: 10000
    });
    
    console.log('응답 상태:', response.status);
    console.log('응답 데이터 일부:', JSON.stringify(response.data).substring(0, 200) + '...');
    
    // 결과 파일 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${apiName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.json`;
    const filePath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filePath, JSON.stringify({
      request: requestBody,
      response: response.data
    }, null, 2));
    
    console.log(`결과 저장됨: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error('API 호출 오류:', error.message);
    
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
    
    return false;
  }
}

/**
 * 모든 API 테스트 실행
 */
async function runAllTests() {
  console.log('네이버 쇼핑인사이트 API 테스트 시작');
  console.log('API 인증 정보:', {
    clientId: NAVER_CLIENT_ID ? '설정됨' : '없음',
    clientSecret: NAVER_CLIENT_SECRET ? '설정됨' : '없음'
  });
  
  // 날짜 설정
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const startDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
  
  console.log('테스트 기간:', startDate, '~', endDate);
  
  // 테스트 1: 카테고리별 키워드 문자열 카테고리 형식
  const keywordsResult1 = await testAPI(
    '카테고리별 키워드 (문자열 카테고리)',
    'https://openapi.naver.com/v1/datalab/shopping/category/keywords',
    {
      startDate: startDate,
      endDate: endDate,
      timeUnit: 'date',
      category: '50000000',
      keyword: [
        {"name": "스마트폰", "param": ["스마트폰"]}
      ],
      device: '',
      gender: '',
      ages: []
    }
  );
  
  // 테스트 2: 카테고리별 키워드 객체 카테고리 형식
  const keywordsResult2 = await testAPI(
    '카테고리별 키워드 (객체 카테고리)',
    'https://openapi.naver.com/v1/datalab/shopping/category/keywords',
    {
      startDate: startDate,
      endDate: endDate,
      timeUnit: 'date',
      category: {"name": "디지털/가전", "param": ["50000000"]},
      keyword: [
        {"name": "노트북", "param": ["노트북"]}
      ],
      device: '',
      gender: '',
      ages: []
    }
  );
  
  // 테스트 3: 카테고리별 키워드 배열 카테고리 형식
  const keywordsResult3 = await testAPI(
    '카테고리별 키워드 (배열 카테고리)',
    'https://openapi.naver.com/v1/datalab/shopping/category/keywords',
    {
      startDate: startDate,
      endDate: endDate,
      timeUnit: 'date',
      category: [{"name": "디지털/가전", "param": ["50000000"]}],
      keyword: [
        {"name": "태블릿", "param": ["태블릿"]}
      ],
      device: '',
      gender: '',
      ages: []
    }
  );
  
  // 테스트 4: 헬스케어 카테고리 키워드 테스트
  const keywordsResult4 = await testAPI(
    '카테고리별 키워드 (건강/생활 카테고리)',
    'https://openapi.naver.com/v1/datalab/shopping/category/keywords',
    {
      startDate: startDate,
      endDate: endDate,
      timeUnit: 'date',
      category: '50000006', // 생활/건강 카테고리
      keyword: [
        {"name": "영양제", "param": ["영양제"]}
      ],
      device: '',
      gender: '',
      ages: []
    }
  );
  
  console.log('\n===== 테스트 결과 요약 =====');
  console.log('카테고리별 키워드 (문자열 카테고리):', keywordsResult1 ? '성공' : '실패');
  console.log('카테고리별 키워드 (객체 카테고리):', keywordsResult2 ? '성공' : '실패');
  console.log('카테고리별 키워드 (배열 카테고리):', keywordsResult3 ? '성공' : '실패');
  console.log('카테고리별 키워드 (건강/생활 카테고리):', keywordsResult4 ? '성공' : '실패');
  
  console.log('\n성공적인 형식을 확인하여 코드에 적용하세요.');
}

// 테스트 실행
runAllTests().catch(error => {
  console.error('테스트 실행 중 오류 발생:', error);
});