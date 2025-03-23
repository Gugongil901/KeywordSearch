// server/api/naver-ad.ts
import axios, { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 네이버 검색광고 API 연동 모듈
 * - API 문서: https://naver.github.io/searchad-apidoc/
 */

// 라우터 생성
const router = Router();

// 네이버 검색광고 API 인증 정보
const NAVER_AD_API = {
  API_URL: 'https://api.naver.com',
  CUSTOMER_ID: '3405855',
  ACCESS_LICENSE: '01000000005a79e0d0ffff30be92041e87dd2444c689e1209efbe2f9ea58fd3a3ae67ee01e',
  // SECRET_KEY는 사용자가 직접 입력해야 합니다
  // 아래는 예시이며, 실제 비밀키로 대체해야 합니다
  SECRET_KEY: 'AQAAAABaeeDQ//8wvpIEHofdJETGcg3aHhG5YRGgFHPnSsNISw=='
};

// 서명 생성 헬퍼 클래스
class SignatureHelper {
  /**
   * HMAC-SHA256 서명 생성
   * @param timestamp 타임스탬프 (밀리초)
   * @param method HTTP 메서드 (GET, POST 등)
   * @param path API 경로 (/keywordstool 등)
   * @param secretKey 비밀키
   * @returns Base64로 인코딩된 서명
   */
  static generateSignature(timestamp: string, method: string, path: string, secretKey: string): string {
    const message = `${timestamp}.${method}.${path}`;
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(message);
    return hmac.digest('base64');
  }
}

// API 요청 헤더 생성 함수
function createHeaders(method: string, path: string): Record<string, string> {
  const timestamp = String(Date.now());
  const signature = SignatureHelper.generateSignature(
    timestamp,
    method,
    path,
    NAVER_AD_API.SECRET_KEY
  );

  return {
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Timestamp': timestamp,
    'X-API-KEY': NAVER_AD_API.ACCESS_LICENSE,
    'X-Customer': NAVER_AD_API.CUSTOMER_ID,
    'X-Signature': signature
  };
}

/**
 * 로깅 미들웨어 - 모든 요청과 응답을 로깅
 */
router.use((req: Request, res: Response, next: Function) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * 키워드 검색량 조회 API
 * GET /api/keywords/search/:keyword
 */
router.get('/search/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const path = '/keywordstool';
    const method = 'GET';
    
    // 요청 로깅
    console.log(`네이버 검색광고 API 요청: 키워드=${keyword}, 경로=${path}, 메서드=${method}`);
    
    // 요청 생성
    const config: AxiosRequestConfig = {
      method,
      url: `${NAVER_AD_API.API_URL}${path}`,
      headers: createHeaders(method, path),
      params: {
        hintKeywords: keyword,
        showDetail: 1
      },
      timeout: 10000 // 10초 타임아웃
    };
    
    // API 요청
    const response = await axios(config);
    
    // 응답 데이터 가공
    if (response.data && response.data.keywordList) {
      // 성공 응답
      return res.json({
        status: 'success',
        message: '키워드 검색량 조회 성공',
        data: response.data.keywordList,
        meta: {
          total: response.data.keywordList.length,
          keyword
        }
      });
    } else {
      // 데이터 없음
      return res.json({
        status: 'warning',
        message: '조회된 키워드 데이터가 없습니다',
        data: [],
        meta: { keyword }
      });
    }
  } catch (error: any) {
    // 오류 처리
    console.error('네이버 검색광고 API 오류:', error.message);
    
    // 상세 오류 정보
    const errorDetails = {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null,
      request: error.request ? {
        method: error.request.method,
        url: error.request.path
      } : null
    };
    
    // API 응답 로깅
    console.error('API 오류 상세:', JSON.stringify(errorDetails, null, 2));
    
    return res.status(500).json({
      status: 'error',
      message: '키워드 검색량 조회 중 오류가 발생했습니다',
      error: errorDetails
    });
  }
});

/**
 * 키워드 성과 예측 API
 * POST /api/keywords/estimate
 * body: { keyword: string, bids: number[] }
 */
router.post('/estimate', async (req: Request, res: Response) => {
  try {
    const { keyword, bids = [100, 200, 300, 500, 1000] } = req.body;
    
    if (!keyword) {
      return res.status(400).json({
        status: 'error',
        message: '키워드를 입력해주세요'
      });
    }
    
    // 올바른 API 경로 - /estimate 대신 /estimate/performance 사용에 주의
    const path = '/estimate/performance';
    const method = 'POST';
    
    // 요청 로깅
    console.log(`네이버 검색광고 API 요청: 키워드=${keyword}, 경로=${path}, 메서드=${method}`);
    
    // 요청 생성
    const config: AxiosRequestConfig = {
      method,
      url: `${NAVER_AD_API.API_URL}${path}`,
      headers: createHeaders(method, path),
      data: {
        device: 'PC',
        keywordplus: false,
        key: keyword,
        bids: bids
      },
      timeout: 10000 // 10초 타임아웃
    };
    
    // API 요청
    const response = await axios(config);
    
    // 성공 응답
    return res.json({
      status: 'success',
      message: '키워드 성과 예측 성공',
      data: response.data,
      meta: {
        keyword,
        bids
      }
    });
  } catch (error: any) {
    // 오류 처리
    console.error('네이버 검색광고 API 오류:', error.message);
    
    // 상세 오류 정보
    const errorDetails = {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null,
      request: error.request ? {
        method: error.request.method,
        url: error.request.path
      } : null
    };
    
    // API 응답 로깅
    console.error('API 오류 상세:', JSON.stringify(errorDetails, null, 2));
    
    // 특별 케이스: 404 오류 처리
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        status: 'error',
        message: 'API 경로가 올바르지 않거나 요청이 잘못되었습니다',
        error: errorDetails,
        guide: '네이버 검색광고 API의 정확한 경로 및 요청 형식을 확인하세요'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: '키워드 성과 예측 중 오류가 발생했습니다',
      error: errorDetails
    });
  }
});

/**
 * 연관 키워드 추천 API
 * GET /api/keywords/related/:keyword
 */
router.get('/related/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const path = '/keywordstool';
    const method = 'GET';
    
    // 요청 로깅
    console.log(`네이버 검색광고 API 요청: 키워드=${keyword}, 경로=${path}, 메서드=${method}`);
    
    // 요청 생성
    const config: AxiosRequestConfig = {
      method,
      url: `${NAVER_AD_API.API_URL}${path}`,
      headers: createHeaders(method, path),
      params: {
        hintKeywords: keyword,
        showDetail: 1
      },
      timeout: 10000 // 10초 타임아웃
    };
    
    // API 요청
    const response = await axios(config);
    
    // 연관 키워드 데이터 처리
    if (response.data && response.data.keywordList) {
      const keywordList = response.data.keywordList
        .filter((item: any) => item.relKeyword !== keyword) // 원본 키워드 제외
        .slice(0, limit); // 요청된 개수로 제한
      
      // 결과가 있을 경우
      if (keywordList.length > 0) {
        return res.json({
          status: 'success',
          message: '연관 키워드 조회 성공',
          data: keywordList,
          meta: {
            total: keywordList.length,
            originalKeyword: keyword
          }
        });
      } else {
        // 결과가 없을 경우
        return res.json({
          status: 'warning',
          message: '연관 키워드가 없습니다',
          data: [],
          meta: { keyword }
        });
      }
    } else {
      // 데이터 형식 오류
      return res.status(500).json({
        status: 'error',
        message: 'API 응답 데이터 형식이 올바르지 않습니다',
        data: response.data
      });
    }
  } catch (error: any) {
    // 오류 처리
    console.error('네이버 검색광고 API 오류:', error.message);
    
    return res.status(500).json({
      status: 'error',
      message: '연관 키워드 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

/**
 * API 상태 확인 엔드포인트
 * GET /api/keywords/status
 */
router.get('/status', (req: Request, res: Response) => {
  const naverApiInfo = {
    API_URL: NAVER_AD_API.API_URL,
    CUSTOMER_ID: NAVER_AD_API.CUSTOMER_ID.substring(0, 4) + '****', // 보안상 일부만 표시
    ACCESS_LICENSE: NAVER_AD_API.ACCESS_LICENSE.substring(0, 10) + '****', // 보안상 일부만 표시
    SECRET_KEY: '********' // 보안상 표시하지 않음
  };
  
  res.json({
    status: 'online',
    message: '네이버 검색광고 API 서비스가 정상 작동 중입니다',
    timestamp: new Date().toISOString(),
    config: naverApiInfo,
    endpoints: [
      { method: 'GET', path: '/api/keywords/search/:keyword', description: '키워드 검색량 조회' },
      { method: 'GET', path: '/api/keywords/related/:keyword', description: '연관 키워드 추천' },
      { method: 'POST', path: '/api/keywords/estimate', description: '키워드 성과 예측' }
    ]
  });
});

export default router;
