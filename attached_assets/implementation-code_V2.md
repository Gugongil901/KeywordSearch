# 건강기능식품 키워드 분석 시스템 구현 코드

이 문서는 계획에 따른 실제 구현 코드를 제공합니다. 각 섹션별로 핵심 코드를 제시하고 있으며, 필요한 설명을 포함하고 있습니다.

## 1. 서버 측 구현 (Express + TypeScript)

### 1.1 네이버 API 연동 설정

```typescript
// src/config/naverApi.ts
import axios from 'axios';
import crypto from 'crypto';

export const NAVER_CLIENT_ID = 'ErTaCUGQWfhKvcEnftat';
export const NAVER_CLIENT_SECRET = 'Xoq9VSewrv';
export const NAVER_AD_API_CUSTOMER_ID = '3405855';
export const NAVER_AD_API_ACCESS_LICENSE = '01000000005a79e0d0ffff30be92041e87dd2444c689e1209efbe2f9ea58fd3a3ae67ee01e';
export const NAVER_AD_API_SECRET_KEY = 'AQAAAABaeeDQ//8wvpIEHofdJETGcg3aHhG5YRGgFHPnSsNISw==';

// 네이버 데이터랩 API 클라이언트
export const dataLabClient = axios.create({
  baseURL: 'https://openapi.naver.com/v1/datalab',
  headers: {
    'X-Naver-Client-Id': NAVER_CLIENT_ID,
    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    'Content-Type': 'application/json'
  }
});

// 네이버 검색광고 API 클라이언트
export const searchAdClient = axios.create({
  baseURL: 'https://api.naver.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 검색광고 API 요청 헤더 생성 함수
export const generateAdApiHeaders = (method: string, uri: string, timestamp: number) => {
  const hmac = crypto.createHmac('sha256', NAVER_AD_API_SECRET_KEY);
  const message = `${method} ${uri}\n${timestamp}\n${NAVER_AD_API_ACCESS_LICENSE}`;
  const signature = hmac.update(message).digest('base64');
  
  return {
    'X-API-KEY': NAVER_AD_API_ACCESS_LICENSE,
    'X-Customer': NAVER_AD_API_CUSTOMER_ID,
    'X-Timestamp': timestamp.toString(),
    'X-Signature': signature
  };
};

// 네이버 쇼핑 인사이트 API 클라이언트
export const shoppingInsightClient = axios.create({
  baseURL: 'https://openapi.naver.com/v1/datalab/shopping',
  headers: {
    'X-Naver-Client-Id': NAVER_CLIENT_ID,
    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    'Content-Type': 'application/json'
  }
});
```

### 1.2 키워드 분석 서비스 구현

```typescript
// src/services/keywordAnalysisService.ts
import { dataLabClient, searchAdClient, shoppingInsightClient, generateAdApiHeaders } from '../config/naverApi';
import { KeywordData, RankingData, PageExposureData, TopAdKeywords } from '../types/keywords';
import { logger } from '../utils/logger';
import { cacheManager } from '../utils/cacheManager';

// 캐시 키 설정
const CACHE_KEYS = {
  TOP_AD_KEYWORDS: 'top_ad_keywords',
  PAGE_EXPOSURE: 'page_exposure',
  KEYWORD_RANKINGS: 'keyword_rankings'
};

// 캐시 TTL 설정 (초 단위)
const CACHE_TTL = {
  SHORT: 3600, // 1시간
  MEDIUM: 86400, // 1일
  LONG: 604800 // 1주일
};

export class KeywordAnalysisService {
  /**
   * 이미 상위 노출되고 있는 광고 키워드를 분석하는 함수
   * @param category - 건강기능식품 카테고리
   * @param limit - 가져올 키워드 수
   * @returns 상위 노출 중인 광고 키워드 리스트
   */
  async getTopAdKeywords(category: string, limit: number = 100): Promise<TopAdKeywords> {
    // 캐시에서 데이터 확인
    const cacheKey = `${CACHE_KEYS.TOP_AD_KEYWORDS}_${category}`;
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      logger.info(`캐시에서 상위 광고 키워드 데이터 로드: ${category}`);
      return cachedData as TopAdKeywords;
    }
    
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const uri = '/keywordstool';
      const headers = generateAdApiHeaders('GET', uri, timestamp);
      
      // 네이버 검색광고 API를 통해 키워드 데이터 가져오기
      const response = await searchAdClient.get(`${uri}?hintKeywords=${encodeURIComponent(category)}&showDetail=1`, {
        headers: {
          ...headers
        }
      });
      
      if (!response.data || !response.data.keywordList) {
        throw new Error('키워드 데이터를 가져오는데 실패했습니다.');
      }
      
      // 데이터 처리: 클릭률, 경쟁강도 기준으로 필터링
      const keywords = response.data.keywordList
        .filter((keyword: any) => keyword.monthlyPcQcCnt > 0 || keyword.monthlyMobileQcCnt > 0)
        .sort((a: any, b: any) => {
          // 클릭 수 기준으로 정렬
          const aClicks = a.monthlyPcQcCnt + a.monthlyMobileQcCnt;
          const bClicks = b.monthlyPcQcCnt + b.monthlyMobileQcCnt;
          return bClicks - aClicks;
        })
        .slice(0, limit);
      
      // 광고 경쟁 강도 분석
      const topAdKeywords = {
        keywords: keywords.map((keyword: any) => ({
          keyword: keyword.relKeyword,
          monthlyCnt: keyword.monthlyPcQcCnt + keyword.monthlyMobileQcCnt,
          competitionIndex: keyword.compIdx,
          clickCost: keyword.avgPcClkCost,
          isRecommendedForAd: keyword.compIdx < 0.7 && (keyword.monthlyPcQcCnt + keyword.monthlyMobileQcCnt) > 1000
        })),
        timestamp: new Date().toISOString()
      };
      
      // 결과 캐싱
      await cacheManager.set(cacheKey, topAdKeywords, CACHE_TTL.MEDIUM);
      
      return topAdKeywords;
    } catch (error) {
      logger.error('상위 광고 키워드 분석 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 키워드별 페이지 노출 데이터를 분석하는 함수
   * @param keywords - 분석할 키워드 배열
   * @param productId - 상품 ID
   * @returns 페이지 노출 분석 데이터
   */
  async getKeywordPageExposure(keywords: string[], productId: string): Promise<PageExposureData> {
    // 캐시 키 생성
    const cacheKey = `${CACHE_KEYS.PAGE_EXPOSURE}_${productId}_${keywords.join('_')}`;
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      logger.info(`캐시에서 페이지 노출 데이터 로드: ${productId}`);
      return cachedData as PageExposureData;
    }
    
    try {
      // 각 키워드별로 페이지 노출 확인
      const exposureResults = await Promise.all(
        keywords.map(async (keyword) => {
          const timestamp = Math.floor(Date.now() / 1000);
          const uri = '/shopping/v1/products/search';
          const headers = generateAdApiHeaders('GET', uri, timestamp);
          
          // 네이버 쇼핑 검색 API를 통해 상품 검색
          const response = await searchAdClient.get(`${uri}?query=${encodeURIComponent(keyword)}&display=100`, {
            headers: {
              ...headers,
              'X-Naver-Client-Id': NAVER_CLIENT_ID,
              'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            }
          });
          
          // 검색 결과에서 해당 상품 ID가 있는지 확인
          const items = response.data.items || [];
          const productIndex = items.findIndex((item: any) => item.productId === productId);
          
          return {
            keyword,
            isExposed: productIndex !== -1,
            position: productIndex !== -1 ? productIndex + 1 : -1,
            totalResults: response.data.total || 0
          };
        })
      );
      
      // 결과 정리
      const pageExposureData: PageExposureData = {
        productId,
        exposureData: exposureResults,
        exposedKeywords: exposureResults.filter(item => item.isExposed).map(item => item.keyword),
        notExposedKeywords: exposureResults.filter(item => !item.isExposed).map(item => item.keyword),
        timestamp: new Date().toISOString()
      };
      
      // 결과 캐싱
      await cacheManager.set(cacheKey, pageExposureData, CACHE_TTL.SHORT);
      
      return pageExposureData;
    } catch (error) {
      logger.error('페이지 노출 분석 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 키워드별 상품 순위를 추적하는 함수
   * @param keywords - 분석할 키워드 배열
   * @param productIds - 추적할 상품 ID 배열
   * @returns 상품 순위 데이터
   */
  async getKeywordProductRankings(keywords: string[], productIds: string[]): Promise<RankingData> {
    // 캐시 키 생성
    const cacheKey = `${CACHE_KEYS.KEYWORD_RANKINGS}_${productIds.join('_')}_${keywords.join('_')}`;
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      logger.info(`캐시에서 상품 순위 데이터 로드`);
      return cachedData as RankingData;
    }
    
    try {
      // 각 키워드별로 상품 순위 확인
      const rankingResults = await Promise.all(
        keywords.map(async (keyword) => {
          const timestamp = Math.floor(Date.now() / 1000);
          const uri = '/shopping/v1/products/search';
          const headers = generateAdApiHeaders('GET', uri, timestamp);
          
          // 네이버 쇼핑 검색 API를 통해 상품 검색 (최대 100개)
          const response = await searchAdClient.get(`${uri}?query=${encodeURIComponent(keyword)}&display=100`, {
            headers: {
              ...headers,
              'X-Naver-Client-Id': NAVER_CLIENT_ID,
              'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            }
          });
          
          const items = response.data.items || [];
          
          // 추적 중인 상품들의 순위 확인
          const productRankings = productIds.map(productId => {
            const index = items.findIndex((item: any) => item.productId === productId);
            return {
              productId,
              isRanked: index !== -1,
              rank: index !== -1 ? index + 1 : -1
            };
          });
          
          return {
            keyword,
            totalResults: response.data.total || 0,
            productRankings
          };
        })
      );
      
      // 결과 정리
      const rankingData: RankingData = {
        keywords,
        productIds,
        rankingData: rankingResults,
        timestamp: new Date().toISOString()
      };
      
      // 결과 캐싱
      await cacheManager.set(cacheKey, rankingData, CACHE_TTL.SHORT);
      
      return rankingData;
    } catch (error) {
      logger.error('상품 순위 추적 중 오류 발생:', error);
      throw error;
    }
  }
  
  /**
   * 키워드 트렌드 분석 함수
   * @param keywords - 분석할 키워드 배열
   * @param startDate - 시작일 (YYYY-MM-DD)
   * @param endDate - 종료일 (YYYY-MM-DD)
   * @returns 키워드 트렌드 데이터
   */
  async getKeywordTrends(keywords: string[], startDate: string, endDate: string): Promise<any> {
    try {
      // 네이버 데이터랩 API 요청
      const response = await dataLabClient.post('/shopping/category/keywords', {
        startDate,
        endDate,
        timeUnit: 'month',
        category: '50000008', // 건강기능식품 카테고리 코드
        keyword: keywords.map(keyword => ({ name: keyword, param: [keyword] })),
        device: 'pc',
        ages: ['20', '30', '40', '50', '60'],
        gender: 'f'
      });
      
      return response.data;
    } catch (error) {
      logger.error('키워드 트렌드 분석 중 오류 발생:', error);
      throw error;
    }
  }
}

export default new KeywordAnalysisService();
```

### 1.3 API 라우트 설정

```typescript
// src/routes/keywordAnalysis.ts
import { Router } from 'express';
import keywordAnalysisService from '../services/keywordAnalysisService';

const router = Router();

/**
 * 상위 노출 광고 키워드 가져오기
 * GET /api/keywords/top-ad
 */
router.get('/top-ad', async (req, res) => {
  try {
    const { category, limit } = req.query;
    const result = await keywordAnalysisService.getTopAdKeywords(
      category as string || '건강기능식품',
      limit ? parseInt(limit as string) : 100
    );
    res.json(result);
  } catch (error) {
    console.error('상위 광고 키워드 가져오기 실패:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 키워드별 페이지 노출 분석
 * GET /api/keywords/page-exposure
 */
router.get('/page-exposure', async (req, res) => {
  try {
    const { keywords, productId } = req.query;
    
    if (!keywords || !productId) {
      return res.status(400).json({ error: '키워드와 상품 ID가 필요합니다.' });
    }
    
    const keywordArray = Array.isArray(keywords) 
      ? keywords as string[] 
      : (keywords as string).split(',');
    
    const result = await keywordAnalysisService.getKeywordPageExposure(
      keywordArray,
      productId as string
    );
    
    res.json(result);
  } catch (error) {
    console.error('페이지 노출 분석 실패:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 키워드별 상품 순위 분석
 * GET /api/keywords/product-rankings
 */
router.get('/product-rankings', async (req, res) => {
  try {
    const { keywords, productIds } = req.query;
    
    if (!keywords || !productIds) {
      return res.status(400).json({ error: '키워드와 상품 ID가 필요합니다.' });
    }
    
    const keywordArray = Array.isArray(keywords) 
      ? keywords as string[] 
      : (keywords as string).split(',');
    
    const productIdArray = Array.isArray(productIds) 
      ? productIds as string[] 
      : (productIds as string).split(',');
    
    const result = await keywordAnalysisService.getKeywordProductRankings(
      keywordArray,
      productIdArray
    );
    
    res.json(result);
  } catch (error) {
    console.error('상품 순위 분석 실패:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

/**
 * 키워드 트렌드 분석
 * GET /api/keywords/trends
 */
router.get('/trends', async (req, res) => {
  try {
    const { keywords, startDate, endDate } = req.query;
    
    if (!keywords || !startDate || !endDate) {
      return res.status(400).json({ error: '키워드, 시작일, 종료일이 필요합니다.' });
    }
    
    const keywordArray = Array.isArray(keywords) 
      ? keywords as string[] 
      : (keywords as string).split(',');
    
    const result = await keywordAnalysisService.getKeywordTrends(
      keywordArray,
      startDate as string,
      endDate as string
    );
    
    res.json(result);
  } catch (error) {
    console.error('키워드 트렌드 분석 실패:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;
```

### 1.4 메인 서버 설정

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';

import keywordAnalysisRoutes from './routes/keywordAnalysis';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(helmet()); // 보안 헤더 설정
app.use(compression()); // 응답 압축
app.use(cors()); // CORS 활성화
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩
app.use(morgan('dev')); // 로깅

// API 라우트 설정
app.use('/api/keywords', keywordAnalysisRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: '건강기능식품 키워드 분석 API 서버' });
});

// 오류 처리 미들웨어
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  logger.info(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

export default app;
```

## 2. 프론트엔드 구현 (React + TypeScript)

### 2.1 키워드 분석 대시보드 컴포넌트

```tsx
// src/components/KeywordAnalysisDashboard.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Container, Typography, Grid, Paper, TextField, Button, 
  CircularProgress, Tabs, Tab, Divider, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Tooltip, Alert, Card, CardContent
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

interface TopAdKeyword {
  keyword: string;
  monthlyCnt: number;
  competitionIndex: number;
  clickCost: number;
  isRecommendedForAd: boolean;
}

interface ExposureData {
  keyword: string;
  isExposed: boolean;
  position: number;
  totalResults: number;
}

interface KeywordRanking {
  keyword: string;
  totalResults: number;
  productRankings: {
    productId: string;
    isRanked: boolean;
    rank: number;
  }[];
}

const KeywordAnalysisDashboard: React.FC = () => {
  // 상태 관리
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('건강기능식품');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [productIdInput, setProductIdInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  
  // 데이터 상태
  const [topAdKeywords, setTopAdKeywords] = useState<TopAdKeyword[]>([]);
  const [pageExposureData, setPageExposureData] = useState<ExposureData[]>([]);
  const [productRankings, setProductRankings] = useState<KeywordRanking[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState({
    topAd: false,
    exposure: false,
    rankings: false,
    trends: false
  });
  
  // 오류 상태
  const [errors, setErrors] = useState({
    topAd: '',
    exposure: '',
    rankings: '',
    trends: ''
  });
  
  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // 검색어 변경 핸들러
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  // 카테고리 변경 핸들러
  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCategory(event.target.value);
  };
  
  // 상품 ID 추가 핸들러
  const handleAddProductId = () => {
    if (productIdInput && !productIds.includes(productIdInput)) {
      setProductIds([...productIds, productIdInput]);
      setProductIdInput('');
    }
  };
  
  // 키워드 추가 핸들러
  const handleAddKeyword = () => {
    if (keywordInput && !keywords.includes(keywordInput)) {
      setKeywords([...keywords, keywordInput]);
      setKeywordInput('');
    }
  };
  
  // 상위 광고 키워드 가져오기
  const fetchTopAdKeywords = async () => {
    setIsLoading(prev => ({ ...prev, topAd: true }));
    setErrors(prev => ({ ...prev, topAd: '' }));
    
    try {
      const response = await axios.get('/api/keywords/top-ad', {
        params: { category, limit: 50 }
      });
      
      setTopAdKeywords(response.data.keywords);
    } catch (error) {
      console.error('상위 광고 키워드 로딩 오류:', error);
      setErrors(prev => ({ ...prev, topAd: '데이터를 가져오는 중 오류가 발생했습니다.' }));
    } finally {
      setIsLoading(prev => ({ ...prev, topAd: false }));
    }
  };
  
  // 페이지 노출 데이터 가져오기
  const fetchPageExposure = async () => {
    if (!productIds.length || !keywords.length) {
      setErrors(prev => ({ ...prev, exposure: '상품 ID와 키워드를 입력해주세요.' }));
      return;
    }
    
    setIsLoading(prev => ({ ...prev, exposure: true }));
    setErrors(prev => ({ ...prev, exposure: '' }));
    
    try {
      const response = await axios.get('/api/keywords/page-exposure', {
        params: {
          productId: productIds[0], // 첫 번째 상품 ID만 사용
          keywords: keywords.join(',')
        }
      });
      
      setPageExposureData(response.data.exposureData);
    } catch (error) {
      console.error('페이지 노출 데이터 로딩 오류:', error);
      setErrors(prev => ({ ...prev, exposure: '데이터를 가져오는 중 오류가 발생했습니다.' }));
    } finally {
      setIsLoading(prev => ({ ...prev, exposure: false }));
    }
  };
  
  // 상품 순위 데이터 가져오기
  const fetchProductRankings = async () => {
    if (!productIds.length || !keywords.length) {
      setErrors(prev => ({ ...prev, rankings: '상품 ID와 키워드를 입력해주세요.' }));
      return;
    }
    
    setIsLoading(prev => ({ ...prev, rankings: true }));
    setErrors(prev => ({ ...prev, rankings: '' }));
    
    try {
      const response = await axios.get('/api/keywords/product-rankings', {
        params: {
          productIds: productIds.join(','),
          keywords: keywords.join(',')
        }
      });
      
      setProductRankings(response.data.rankingData);
    } catch (error) {
      console.error('상품 순위 데이터 로딩 오류:', error);
      setErrors(prev => ({ ...prev, rankings: '데이터를 가져오는 중 오류가 발생했습니다.' }));
    } finally {
      setIsLoading(prev => ({ ...prev, rankings: false }));
    }
  };
  
  // 키워드 트렌드 데이터 가져오기
  const fetchKeywordTrends = async () => {
    if (!keywords.length) {
      setErrors(prev => ({ ...prev, trends: '키워드를 입력해주세요.' }));
      return;
    }
    
    setIsLoading(prev => ({ ...prev, trends: true }));
    setErrors(prev => ({ ...prev, trends: '' }));
    
    // 날짜 범위 설정 (최근 6개월)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    try {
      const response = await axios.get('/api/keywords/trends', {
        params: {
          keywords: keywords.join(','),
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        }
      });
      
      if (response.data && response.data.results) {
        // 데이터 포맷 변환
        const formattedData = response.data.results[0].data.map((item: any) => {
          const dataPoint: any = { period: item.period };
          
          response.data.results.forEach((result: any) => {
            const matchingPoint = result.data.find((d: any) => d.period === item.period);
            if (matchingPoint) {
              dataPoint[result.title] = matchingPoint.ratio;
            }
          });
          
          return dataPoint;
        });
        
        setTrendData(formattedData);
      }
    } catch (error) {
      console.error('키워드 트렌드 데이터 로딩 오류:', error);
      setErrors(prev => ({ ...prev, trends: '데이터를 가져오는 중 오류가 발생했습니다.' }));
    } finally {
      setIsLoading(prev => ({ ...prev, trends: false }));
    }
  };
  
  // 컴포넌트 마운트 시 상위 광고 키워드 로드
  useEffect(() => {
    fetchTopAdKeywords();
  }, []);
  
  // 검색 필터링 함수
  const filterBySearch = (item: TopAdKeyword | ExposureData | KeywordRanking) => {
    if (!searchQuery) return true;
    
    if ('keyword' in item) {
      return item.keyword.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return false;
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        건강기능식품 키워드 분석 대시보드
      </Typography>
      
      {/* 검색 및 필터 영역 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="검색어"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="키워드 검색..."
              variant="outlined"
              size="small"
              InputProps={{
                endAdornment: <SearchIcon color="action" />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="카테고리"
              value={category}
              onChange={handleCategoryChange}
              placeholder="건강기능식품"
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              variant="contained" 
              startIcon={<RefreshIcon />}
              onClick={fetchTopAdKeywords}
              fullWidth
            >
              카테고리 키워드 분석
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 상품 ID 및 키워드 입력 영역 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>상품 ID</Typography>
            <Box display="flex" alignItems="center" mb={1}>
              <TextField
                fullWidth
                size="small"
                value={productIdInput}
                onChange={(e) => setProductIdInput(e.target.value)}
                placeholder="상품 ID 입력..."
                variant="outlined"
              />
              <Button 
                variant="contained" 
                onClick={handleAddProductId}
                sx={{ ml: 1 }}
              >
                추가
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {productIds.map((id) => (
                <Chip 
                  key={id} 
                  label={id} 
                  onDelete={() => setProductIds(productIds.filter(pId => pId !== id))}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>분석 키워드</Typography>
            <Box display="flex" alignItems="center" mb={1}>
              <TextField
                fullWidth
                size="small"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="키워드 입력..."
                variant="outlined"
              />
              <Button 
                variant="contained" 
                onClick={handleAddKeyword}
                sx={{ ml: 1 }}
              >
                추가
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {keywords.map((keyword) => (
                <Chip 
                  key={keyword} 
                  label={keyword} 
                  onDelete={() => setKeywords(keywords.filter(k => k !== keyword))}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 탭 영역 */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="상위 광고 키워드" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="페이지 노출 분석" icon={<SearchIcon />} iconPosition="start" />
          <Tab label="상품 순위 추적" icon={<TrendingUpIcon />} iconPosition="start" />
        </Tabs>
        
        <Divider />
        
        {/* 상위 광고 키워드 탭 */}
        {activeTab === 0 && (
          <Box sx={{ p: 2 }}>
            {errors.topAd && <Alert severity="error" sx={{ mb: 2 }}>{errors.topAd}</Alert>}
            
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />}
                onClick={fetchTopAdKeywords}
                disabled={isLoading.topAd}
              >
                새로고침
              </Button>
            </Box>
            
            {isLoading.topAd ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>키워드</TableCell>
                        <TableCell align="right">월간 검색량</TableCell>
                        <TableCell align="right">경쟁 강도</TableCell>
                        <TableCell align="right">CPC (원)</TableCell>
                        <TableCell align="center">추천 여부</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topAdKeywords.filter(filterBySearch).map((keyword) => (
                        <TableRow key={keyword.keyword}>
                          <TableCell component="th" scope="row">
                            {keyword.keyword}
                          </TableCell>
                          <TableCell align="right">{keyword.monthlyCnt.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {keyword.competitionIndex < 0.3 ? (
                              <Chip size="small" label="낮음" color="success" />
                            ) : keyword.competitionIndex < 0.7 ? (
                              <Chip size="small" label="중간" color="warning" />
                            ) : (
                              <Chip size="small" label="높음" color="error" />
                            )}
                          </TableCell>
                          <TableCell align="right">{keyword.clickCost.toLocaleString()}</TableCell>
                          <TableCell align="center">
                            {keyword.isRecommendedForAd ? (
                              <Chip size="small" label="추천" color="primary" />
                            ) : (
                              <Chip size="small" label="비추천" color="default" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box mt={3}>
                  <Typography variant="subtitle1" gutterBottom>추천 키워드 요약</Typography>
                  <Grid container spacing={2}>
                    {topAdKeywords
                      .filter(k => k.isRecommendedForAd)
                      .slice(0, 5)
                      .map(keyword => (
                        <Grid item xs={12} sm={6} md={4} key={keyword.keyword}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6">{keyword.keyword}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                월간 검색량: {keyword.monthlyCnt.toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                CPC: {keyword.clickCost.toLocaleString()}원
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                경쟁 강도: {(keyword.competitionIndex * 100).toFixed(0)}%
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              </>
            )}
          </Box>
        )}
        
        {/* 페이지 노출 분석 탭 */}
        {activeTab === 1 && (
          <Box sx={{ p: 2 }}>
            {errors.exposure && <Alert severity="error" sx={{ mb: 2 }}>{errors.exposure}</Alert>}
            
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button 
                variant="contained" 
                startIcon={<SearchIcon />}
                onClick={fetchPageExposure}
                disabled={isLoading.exposure || !productIds.length || !keywords.length}
              >
                페이지 노출 분석
              </Button>
            </Box>
            
            {isLoading.exposure ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {pageExposureData.length > 0 && (
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      분석 대상 상품 ID: {productIds[0]}
                    </Alert>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>키워드</TableCell>
                            <TableCell align="center">노출 여부</TableCell>
                            <TableCell align="right">노출 순위</TableCell>
                            <TableCell align="right">총 검색 결과</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pageExposureData.filter(filterBySearch).map((item) => (
                            <TableRow key={item.keyword}>
                              <TableCell component="th" scope="row">
                                {item.keyword}
                              </TableCell>
                              <TableCell align="center">
                                {item.isExposed ? (
                                  <Chip size="small" label="노출" color="success" />
                                ) : (
                                  <Chip size="small" label="미노출" color="error" />
                                )}
                              </TableCell>
                              <TableCell align="right">
                                {item.isExposed ? item.position : '-'}
                              </TableCell>
                              <TableCell align="right">{item.totalResults.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box mt={3}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6">노출 키워드 요약</Typography>
                              <Typography variant="body1">
                                노출 키워드 수: {pageExposureData.filter(item => item.isExposed).length} / {pageExposureData.length}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                노출 상위 키워드:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                {pageExposureData
                                  .filter(item => item.isExposed)
                                  .sort((a, b) => a.position - b.position)
                                  .slice(0, 5)
                                  .map(item => (
                                    <Chip 
                                      key={item.keyword} 
                                      label={`${item.keyword} (${item.position}위)`} 
                                      color="primary"
                                      size="small"
                                    />
                                  ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6">미노출 키워드 개선 필요</Typography>
                              <Typography variant="body1">
                                미노출 키워드 수: {pageExposureData.filter(item => !item.isExposed).length} / {pageExposureData.length}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                우선 개선 키워드:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                {pageExposureData
                                  .filter(item => !item.isExposed)
                                  .sort((a, b) => b.totalResults - a.totalResults)
                                  .slice(0, 5)
                                  .map(item => (
                                    <Chip 
                                      key={item.keyword} 
                                      label={`${item.keyword} (${item.totalResults.toLocaleString()}건)`} 
                                      color="error"
                                      size="small"
                                    />
                                  ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  </>
                )}
              </>
            )}
          </Box>
        )}
        
        {/* 상품 순위 추적 탭 */}
        {activeTab === 2 && (
          <Box sx={{ p: 2 }}>
            {errors.rankings && <Alert severity="error" sx={{ mb: 2 }}>{errors.rankings}</Alert>}
            
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button 
                variant="contained" 
                startIcon={<TrendingUpIcon />}
                onClick={fetchProductRankings}
                disabled={isLoading.rankings || !productIds.length || !keywords.length}
              >
                상품 순위 분석
              </Button>
            </Box>
            
            {isLoading.rankings ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {productRankings.length > 0 && (
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      분석 대상 상품 ID: {productIds.join(', ')}
                    </Alert>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>키워드</TableCell>
                            <TableCell align="right">총 검색 결과</TableCell>
                            {productIds.map(id => (
                              <TableCell key={id} align="center">
                                상품 {id} 순위
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productRankings.filter(filterBySearch).map((item) => (
                            <TableRow key={item.keyword}>
                              <TableCell component="th" scope="row">
                                {item.keyword}
                              </TableCell>
                              <TableCell align="right">{item.totalResults.toLocaleString()}</TableCell>
                              {item.productRankings.map(ranking => (
                                <TableCell key={ranking.productId} align="center">
                                  {ranking.isRanked ? (
                                    <Chip 
                                      size="small" 
                                      label={`${ranking.rank}위`} 
                                      color={ranking.rank <= 5 ? "success" : ranking.rank <= 20 ? "primary" : "default"}
                                    />
                                  ) : (
                                    <Chip size="small" label="미노출" color="error" />
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box mt={3}>
                      <Typography variant="subtitle1" gutterBottom>키워드별 상품 순위 차트</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={productRankings
                            .filter(item => item.productRankings.some(r => r.isRanked))
                            .map(item => {
                              const result: any = { keyword: item.keyword };
                              item.productRankings.forEach(ranking => {
                                if (ranking.isRanked) {
                                  result[`상품 ${ranking.productId}`] = ranking.rank;
                                }
                              });
                              return result;
                            })}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="keyword" />
                          <YAxis reversed domain={[1, 100]} />
                          <RechartsTooltip />
                          <Legend />
                          {productIds.map((id, index) => (
                            <Line
                              key={id}
                              type="monotone"
                              dataKey={`상품 ${id}`}
                              stroke={['#8884d8', '#82ca9d', '#ffc658'][index % 3]}
                              activeDot={{ r: 8 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                    
                    <Box mt={3}>
                      <Grid container spacing={2}>
                        {productIds.map(productId => {
                          // 해당 상품의 전체 키워드 순위 정보 추출
                          const productData = productRankings.map(item => {
                            const rankingData = item.productRankings.find(r => r.productId === productId);
                            return {
                              keyword: item.keyword,
                              isRanked: rankingData?.isRanked || false,
                              rank: rankingData?.rank || -1
                            };
                          });
                          
                          // 상위 5개 순위 키워드
                          const topRankedKeywords = productData
                            .filter(item => item.isRanked)
                            .sort((a, b) => a.rank - b.rank)
                            .slice(0, 5);
                          
                          return (
                            <Grid item xs={12} md={6} key={productId}>
                              <Card>
                                <CardContent>
                                  <Typography variant="h6">상품 {productId} 순위 요약</Typography>
                                  <Typography variant="body1">
                                    노출 키워드 수: {productData.filter(item => item.isRanked).length} / {productData.length}
                                  </Typography>
                                  
                                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    상위 노출 키워드:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                    {topRankedKeywords.map(item => (
                                      <Chip 
                                        key={item.keyword} 
                                        label={`${item.keyword} (${item.rank}위)`} 
                                        color={item.rank <= 5 ? "success" : "primary"}
                                        size="small"
                                      />
                                    ))}
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  </>
                )}
              </>
            )}
          </Box>
        )}
      </Paper>
      
      {/* 키워드 트렌드 영역 */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>키워드 트렌드 분석</Typography>
        
        {errors.trends && <Alert severity="error" sx={{ mb: 2 }}>{errors.trends}</Alert>}
        
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button 
            variant="contained" 
            startIcon={<TrendingUpIcon />}
            onClick={fetchKeywordTrends}
            disabled={isLoading.trends || !keywords.length}
          >
            트렌드 분석
          </Button>
        </Box>
        
        {isLoading.trends ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {trendData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  {keywords.map((keyword, index) => (
                    <Line
                      key={keyword}
                      type="monotone"
                      dataKey={keyword}
                      stroke={['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#3366cc'][index % 5]}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default KeywordAnalysisDashboard;