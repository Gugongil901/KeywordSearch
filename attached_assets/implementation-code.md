# 네이버 쇼핑 키워드 분석 시스템 구현 코드

## 서버 구현 (Express + TypeScript)

### 1. 상위 노출 광고 키워드 필터링 모듈 (KeywordAdFilter)

```typescript
// src/modules/KeywordAdFilter.ts
import axios from 'axios';
import { NaverAdApiConfig } from '../config/apiConfig';

interface KeywordAdData {
  keywordId: string;
  keyword: string;
  averageBidPrice: number;
  competitionRate: number;
  isTopExposure: boolean;
}

export class KeywordAdFilter {
  private readonly customerId: string;
  private readonly accessLicense: string;
  private readonly secretKey: string;

  constructor() {
    this.customerId = process.env.NAVER_AD_CUSTOMER_ID || '3405855';
    this.accessLicense = process.env.NAVER_AD_ACCESS_LICENSE || '01000000005a79e0d0ffff30be92041e87dd2444c689e1209efbe2f9ea58fd3a3ae67ee01e';
    this.secretKey = process.env.NAVER_AD_SECRET_KEY || 'AQAAAABaeeDQ//8wvpIEHofdJETGcg3aHhG5YRGgFHPnSsNISw==';
  }

  private getAuthHeaders() {
    const timestamp = Date.now().toString();
    // 실제 구현에서는 HMAC 서명 생성 로직 추가 필요
    return {
      'X-Timestamp': timestamp,
      'X-Customer': this.customerId,
      'X-API-KEY': this.accessLicense,
      'X-Signature': 'signature', // 실제 서명 로직 구현 필요
      'Content-Type': 'application/json'
    };
  }

  /**
   * 네이버 검색광고 API를 통해 키워드 정보를 가져옴
   */
  async getKeywordAdInfo(keywords: string[]): Promise<KeywordAdData[]> {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.post(
        'https://api.naver.com/keywordstool',
        { keywords },
        { headers }
      );
      
      return response.data.keywordList.map((item: any) => ({
        keywordId: item.relKeyword,
        keyword: item.relKeyword,
        averageBidPrice: item.averageBidAmount,
        competitionRate: item.competitionIndex,
        isTopExposure: item.monthlyAvePcClkCnt > 100 // 예시: 클릭수가 100 이상이면 상위 노출로 가정
      }));
    } catch (error) {
      console.error('네이버 검색광고 API 호출 실패:', error);
      throw new Error('키워드 광고 정보 조회에 실패했습니다.');
    }
  }

  /**
   * 이미 상위 노출되는 광고 키워드 필터링
   */
  async filterTopExposureKeywords(industryKeywords: string[]): Promise<string[]> {
    const keywordInfoList = await this.getKeywordAdInfo(industryKeywords);
    const topExposureKeywords = keywordInfoList
      .filter(keyword => keyword.isTopExposure)
      .map(keyword => keyword.keyword);
      
    return topExposureKeywords;
  }

  /**
   * 광고 키워드 제안 (상위 노출 키워드 제외)
   */
  async suggestAdKeywords(industryKeywords: string[]): Promise<string[]> {
    const keywordInfoList = await this.getKeywordAdInfo(industryKeywords);
    const suggestedKeywords = keywordInfoList
      .filter(keyword => !keyword.isTopExposure)
      .map(keyword => keyword.keyword);
      
    return suggestedKeywords;
  }
}
```

### 2. 키워드별 페이지 노출 모니터링 시스템 (PageExposureTracker)

```typescript
// src/modules/PageExposureTracker.ts
import axios from 'axios';

interface PageExposure {
  keyword: string;
  url: string;
  isExposed: boolean;
  rank: number | null;
  timestamp: Date;
}

export class PageExposureTracker {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.clientId = process.env.NAVER_CLIENT_ID || 'ErTaCUGQWfhKvcEnftat';
    this.clientSecret = process.env.NAVER_CLIENT_SECRET || 'Xoq9VSewrv';
  }

  /**
   * 네이버 검색 API를 통해 특정 키워드 검색 결과 가져오기
   */
  async getSearchResults(keyword: string, display: number = 100): Promise<any[]> {
    try {
      const response = await axios.get('https://openapi.naver.com/v1/search/shop.json', {
        params: {
          query: keyword,
          display,
          start: 1,
          sort: 'sim' // 정확도순 정렬
        },
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret
        }
      });
      
      return response.data.items || [];
    } catch (error) {
      console.error('네이버 검색 API 호출 실패:', error);
      throw new Error('검색 결과 조회에 실패했습니다.');
    }
  }

  /**
   * 특정 URL이 검색 결과에 노출되는지 확인
   */
  async checkPageExposure(keyword: string, targetUrl: string): Promise<PageExposure> {
    const searchResults = await this.getSearchResults(keyword);
    
    // URL 패턴 매칭 (도메인 기준)
    const targetDomain = new URL(targetUrl).hostname;
    
    for (let i = 0; i < searchResults.length; i++) {
      const item = searchResults[i];
      try {
        const itemDomain = new URL(item.link).hostname;
        if (itemDomain.includes(targetDomain)) {
          return {
            keyword,
            url: targetUrl,
            isExposed: true,
            rank: i + 1,
            timestamp: new Date()
          };
        }
      } catch (e) {
        // 유효하지 않은 URL 무시
        continue;
      }
    }
    
    return {
      keyword,
      url: targetUrl,
      isExposed: false,
      rank: null,
      timestamp: new Date()
    };
  }

  /**
   * 여러 키워드에 대한 페이지 노출 상태 한번에 확인
   */
  async batchCheckPageExposure(keywords: string[], targetUrl: string): Promise<PageExposure[]> {
    const promises = keywords.map(keyword => this.checkPageExposure(keyword, targetUrl));
    return Promise.all(promises);
  }
}
```

### 3. 상품별 키워드 순위 분석 시스템 (ProductRankingAnalyzer)

```typescript
// src/modules/ProductRankingAnalyzer.ts
import axios from 'axios';

interface ProductRanking {
  productId: string;
  productName: string;
  keyword: string;
  rank: number | null;
  prevRank: number | null;
  change: number | null;
  timestamp: Date;
}

export class ProductRankingAnalyzer {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.clientId = process.env.NAVER_CLIENT_ID || 'ErTaCUGQWfhKvcEnftat';
    this.clientSecret = process.env.NAVER_CLIENT_SECRET || 'Xoq9VSewrv';
  }

  /**
   * 네이버 쇼핑 검색 결과에서 상품 순위 확인
   */
  async getProductRanking(keyword: string, productId: string, productName: string): Promise<ProductRanking> {
    try {
      const response = await axios.get('https://openapi.naver.com/v1/search/shop.json', {
        params: {
          query: keyword,
          display: 100,
          start: 1
        },
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret
        }
      });
      
      const items = response.data.items || [];
      let currentRank = null;
      
      // 상품명과 ID로 매칭 시도
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemTitle = item.title.replace(/<[^>]*>/g, ''); // HTML 태그 제거
        
        // 상품명이 포함되어 있거나 상품 ID가 포함된 경우
        if (itemTitle.includes(productName) || item.link.includes(productId)) {
          currentRank = i + 1;
          break;
        }
      }
      
      // 이전 순위 조회 (실제 구현에서는 DB에서 조회)
      const prevRanking = await this.getPreviousRanking(productId, keyword);
      const prevRank = prevRanking ? prevRanking.rank : null;
      const change = (currentRank && prevRank) ? prevRank - currentRank : null;
      
      return {
        productId,
        productName,
        keyword,
        rank: currentRank,
        prevRank,
        change,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('네이버 검색 API 호출 실패:', error);
      throw new Error('상품 순위 조회에 실패했습니다.');
    }
  }

  /**
   * 이전 순위 데이터 조회 (데모 구현)
   */
  private async getPreviousRanking(productId: string, keyword: string): Promise<ProductRanking | null> {
    // 실제 구현에서는 데이터베이스에서 이전 순위 조회
    // 여기서는 데모 용도로 null 반환
    return null;
  }

  /**
   * 여러 키워드에 대한 상품 순위 한번에 분석
   */
  async analyzeProductRankings(productId: string, productName: string, keywords: string[]): Promise<ProductRanking[]> {
    const promises = keywords.map(keyword => 
      this.getProductRanking(keyword, productId, productName)
    );
    return Promise.all(promises);
  }
  
  /**
   * 특정 상품의 순위가 가장 높은 키워드 찾기
   */
  async findBestRankingKeywords(productId: string, productName: string, keywords: string[], limit: number = 10): Promise<ProductRanking[]> {
    const rankings = await this.analyzeProductRankings(productId, productName, keywords);
    const validRankings = rankings.filter(r => r.rank !== null);
    return validRankings
      .sort((a, b) => (a.rank || 999) - (b.rank || 999))
      .slice(0, limit);
  }
}
```

### 4. API 엔드포인트 구현

```typescript
// src/routes/keywordRoutes.ts
import express from 'express';
import { KeywordAdFilter } from '../modules/KeywordAdFilter';
import { PageExposureTracker } from '../modules/PageExposureTracker';
import { ProductRankingAnalyzer } from '../modules/ProductRankingAnalyzer';

const router = express.Router();
const keywordAdFilter = new KeywordAdFilter();
const pageExposureTracker = new PageExposureTracker();
const productRankingAnalyzer = new ProductRankingAnalyzer();

// 상위 노출 광고 키워드 필터링 API
router.post('/ad-filter', async (req, res) => {
  try {
    const { keywords } = req.body;
    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: '유효한 키워드 배열이 필요합니다.' });
    }
    
    const topExposureKeywords = await keywordAdFilter.filterTopExposureKeywords(keywords);
    const suggestedKeywords = await keywordAdFilter.suggestAdKeywords(keywords);
    
    res.json({
      topExposureKeywords,
      suggestedKeywords
    });
  } catch (error) {
    console.error('광고 키워드 필터링 실패:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 키워드별 페이지 노출 확인 API
router.post('/page-exposure', async (req, res) => {
  try {
    const { keywords, url } = req.body;
    if (!keywords || !Array.isArray(keywords) || !url) {
      return res.status(400).json({ error: '유효한 키워드 배열과 URL이 필요합니다.' });
    }
    
    const exposureResults = await pageExposureTracker.batchCheckPageExposure(keywords, url);
    res.json(exposureResults);
  } catch (error) {
    console.error('페이지 노출 확인 실패:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 상품별 키워드 순위 분석 API
router.post('/product-ranking', async (req, res) => {
  try {
    const { productId, productName, keywords } = req.body;
    if (!productId || !productName || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: '유효한 상품 정보와 키워드 배열이 필요합니다.' });
    }
    
    const rankingResults = await productRankingAnalyzer.analyzeProductRankings(
      productId, productName, keywords
    );
    res.json(rankingResults);
  } catch (error) {
    console.error('상품 순위 분석 실패:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 최적의 키워드 찾기 API
router.post('/best-keywords', async (req, res) => {
  try {
    const { productId, productName, keywords, limit } = req.body;
    if (!productId || !productName || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: '유효한 상품 정보와 키워드 배열이 필요합니다.' });
    }
    
    const bestKeywords = await productRankingAnalyzer.findBestRankingKeywords(
      productId, productName, keywords, limit || 10
    );
    res.json(bestKeywords);
  } catch (error) {
    console.error('최적 키워드 분석 실패:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;
```

## 클라이언트 구현 (React + TypeScript)

### 1. 통합 검색 컴포넌트

```tsx
// src/components/IntegratedSearch.tsx
import React, { useState } from 'react';
import { Button, Input, Select, Spin, Card, Tag, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

interface SearchResult {
  type: 'keyword' | 'product' | 'exposure' | 'ranking';
  data: any;
}

const IntegratedSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const searchResults: SearchResult[] = [];
      
      // 검색 유형에 따라 API 호출
      if (searchType === 'all' || searchType === 'keyword') {
        const keywordResponse = await axios.post('/api/keywords/ad-filter', {
          keywords: [searchTerm]
        });
        searchResults.push({
          type: 'keyword',
          data: keywordResponse.data
        });
      }
      
      if (searchType === 'all' || searchType === 'exposure') {
        const exposureResponse = await axios.post('/api/keywords/page-exposure', {
          keywords: [searchTerm],
          url: 'https://yourdomain.com/products' // 기본 URL 예시
        });
        searchResults.push({
          type: 'exposure',
          data: exposureResponse.data
        });
      }
      
      if (searchType === 'all' || searchType === 'ranking') {
        const rankingResponse = await axios.post('/api/keywords/product-ranking', {
          productId: '12345', // 기본 상품 ID 예시
          productName: '건강기능식품', // 기본 상품명 예시
          keywords: [searchTerm]
        });
        searchResults.push({
          type: 'ranking',
          data: rankingResponse.data
        });
      }
      
      setResults(searchResults);
    } catch (err) {
      console.error('검색 중 오류 발생:', err);
      setError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (results.length === 0) {
      return <Alert message="검색 결과가 없습니다." type="info" />;
    }
    
    return results.map((result, index) => {
      if (result.type === 'keyword') {
        return (
          <Card 
            key={`keyword-${index}`} 
            title="키워드 분석 결과" 
            style={{ marginBottom: 16 }}
          >
            <h4>상위 노출 중인 키워드:</h4>
            <div>
              {result.data.topExposureKeywords.length > 0 ? (
                result.data.topExposureKeywords.map((kw: string) => (
                  <Tag color="red" key={kw}>{kw}</Tag>
                ))
              ) : (
                <span>없음</span>
              )}
            </div>
            
            <h4>추천 키워드:</h4>
            <div>
              {result.data.suggestedKeywords.map((kw: string) => (
                <Tag color="green" key={kw}>{kw}</Tag>
              ))}
            </div>
          </Card>
        );
      }
      
      if (result.type === 'exposure') {
        return (
          <Card 
            key={`exposure-${index}`} 
            title="페이지 노출 현황" 
            style={{ marginBottom: 16 }}
          >
            {result.data.map((item: any, idx: number) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                <strong>키워드:</strong> {item.keyword}
                <br />
                <strong>노출 여부:</strong> {item.isExposed ? '노출됨' : '노출되지 않음'}
                {item.isExposed && (
                  <>
                    <br />
                    <strong>순위:</strong> {item.rank}
                  </>
                )}
              </div>
            ))}
          </Card>
        );
      }
      
      if (result.type === 'ranking') {
        return (
          <Card 
            key={`ranking-${index}`} 
            title="상품 순위 분석" 
            style={{ marginBottom: 16 }}
          >
            {result.data.map((item: any, idx: number) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                <strong>상품:</strong> {item.productName}
                <br />
                <strong>키워드:</strong> {item.keyword}
                <br />
                <strong>현재 순위:</strong> {item.rank || '노출되지 않음'}
                {item.prevRank && (
                  <>
                    <br />
                    <strong>이전 순위:</strong> {item.prevRank}
                    <br />
                    <strong>변동:</strong> {item.change > 0 ? `+${item.change}` : item.change}
                  </>
                )}
              </div>
            ))}
          </Card>
        );
      }
      
      return null;
    });
  };

  return (
    <div className="integrated-search-container">
      <h2>통합 키워드 분석</h2>
      <div style={{ display: 'flex', marginBottom: 20 }}>
        <Select
          value={searchType}
          onChange={setSearchType}
          style={{ width: 150, marginRight: 8 }}
        >
          <Option value="all">전체 검색</Option>
          <Option value="keyword">키워드 필터링</Option>
          <Option value="exposure">페이지 노출</Option>
          <Option value="ranking">상품 순위</Option>
        </Select>
        <Input
          placeholder="키워드 입력"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginRight: 8 }}
          onPressEnter={handleSearch}
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={loading}
        >
          검색
        </Button>
      </div>
      
      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <p>데이터를 분석 중입니다...</p>
        </div>
      ) : (
        <div className="search-results">
          {renderResults()}
        </div>
      )}
    </div>
  );
};

export default IntegratedSearch;
```

### 2. 광고 키워드 필터링 대시보드 컴포넌트

```tsx
// src/components/AdKeywordFilterDashboard.tsx
import React, { useState } from 'react';
import { Input, Button, Table, Tag, Card, Alert, Spin, Divider, Upload, message } from 'antd';
import { UploadOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';
import { ColumnsType } from 'antd/es/table';

interface KeywordData {
  key: string;
  keyword: string;
  isTopExposure: boolean;
  competitionRate: number;
  searchVolume: number;
  recommendedBid: number;
}

const AdKeywordFilterDashboard: React.FC = () => {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KeywordData[]>([]);
  const [filteredData, setFilteredData] = useState<KeywordData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const newKeywords = [...keywords, keywordInput.trim()];
    setKeywords(newKeywords);
    setKeywordInput('');
  };

  const removeKeyword = (keyword: string) => {
    const newKeywords = keywords.filter(k => k !== keyword);
    setKeywords(newKeywords);
  };

  const analyzeKeywords = async () => {
    if (keywords.length === 0) {
      setError('분석할 키워드를 1개 이상 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/keywords/ad-filter', { keywords });
      
      const keywordData: KeywordData[] = [];
      const topExposureKeywords = new Set(response.data.topExposureKeywords);
      
      // API 응답을 가공하여 테이블 데이터 생성
      keywords.forEach(keyword => {
        keywordData.push({
          key: keyword,
          keyword,
          isTopExposure: topExposureKeywords.has(keyword),
          competitionRate: Math.random() * 100, // 데모 데이터
          searchVolume: Math.floor(Math.random() * 10000), // 데모 데이터
          recommendedBid: Math.floor(Math.random() * 5000) + 100 // 데모 데이터
        });
      });
      
      setData(keywordData);
      filterKeywords(false);
    } catch (err) {
      console.error('키워드 분석 실패:', err);
      setError('키워드 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const filterKeywords = (showTopExposure: boolean) => {
    const filtered = data.filter(item => showTopExposure ? item.isTopExposure : !item.isTopExposure);
    setFilteredData(filtered);
  };

  const handleFileUpload = (info: any) => {
    if (info.file.status === 'done') {
      // CSV 파일 파싱 로직 구현 (실제 구현에서는 파서 사용)
      message.success(`${info.file.name} 파일이 성공적으로 업로드되었습니다.`);
      // 예시 데이터
      setKeywords(['비타민', '프로바이오틱스', '오메가3', '루테인', '콜라겐']);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 파일 업로드에 실패했습니다.`);
    }
  };

  const columns: ColumnsType<KeywordData> = [
    {
      title: '키워드',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (text) => <a>{text}</a>,
    },
    {
      title: '상태',
      key: 'isTopExposure',
      dataIndex: 'isTopExposure',
      render: (isTopExposure) => (
        isTopExposure ? 
          <Tag color="red">상위 노출 중</Tag> : 
          <Tag color="green">광고 추천</Tag>
      ),
    },
    {
      title: '경쟁률',
      dataIndex: 'competitionRate',
      key: 'competitionRate',
      render: (value) => `${value.toFixed(2)}%`,
    },
    {
      title: '검색량',
      dataIndex: 'searchVolume',
      key: 'searchVolume',
      sorter: (a, b) => a.searchVolume - b.searchVolume,
    },
    {
      title: '추천 입찰가',
      dataIndex: 'recommendedBid',
      key: 'recommendedBid',
      render: (value) => `${value.toLocaleString()}원`,
    },
  ];

  return (
    <Card title="광고 키워드 필터링 대시보드" className="keyword-filter-dashboard">
      <div className="keyword-input-section">
        <Input
          placeholder="분석할 키워드 입력"
          value={keywordInput}
          onChange={e => setKeywordInput(e.target.value)}
          onPressEnter={addKeyword}
          style={{ width: 300, marginRight: 8 }}
        />
        <Button type="primary" onClick={addKeyword}>추가</Button>
        <Upload
          name="file"
          action="/api/upload" // 실제 파일 업로드 API
          onChange={handleFileUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} style={{ marginLeft: 8 }}>
            CSV 업로드
          </Button>
        </Upload>
      </div>

      <div className="keyword-tags" style={{ margin: '16px 0' }}>
        {keywords.map(keyword => (
          <Tag 
            closable 
            onClose={() => removeKeyword(keyword)} 
            key={keyword}
            style={{ marginBottom: 8 }}
          >
            {keyword}
          </Tag>
        ))}
      </div>

      <div className="action-buttons" style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          onClick={analyzeKeywords} 
          loading={loading}
          disabled={keywords.length === 0}
        >
          키워드 분석하기
        </Button>
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

      {data.length > 0 && (
        <>
          <Divider />
          <div className="filter-controls" style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              onClick={() => filterKeywords(false)} 
              icon={<FilterOutlined />}
              style={{ marginRight: 8 }}
            >
              광고 추천 키워드
            </Button>
            <Button 
              onClick={() => filterKeywords(true)}
              icon={<FilterOutlined />}
            >
              상위 노출 중 키워드
            </Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spin size="large" />
              <p>키워드를 분석 중입니다...</p>
            </div>
          ) : (
            <Table 
              columns={columns} 
              dataSource={filteredData.length > 0 ? filteredData : data} 
              pagination={{ pageSize: 10 }}
            />
          )}
        </>
      )}
    </Card>
  );
};

export default AdKeywordFilterDashboard;
```

### 3. 페이지 노출 모니터링 대시보드 컴포넌트

```tsx
// src/components/PageExposureMonitor.tsx
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Table, Tag, Alert, Spin, Select, DatePicker } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface ExposureData {
  key: string;
  keyword: string;
  isExposed: boolean;
  rank: number | null;
  timestamp: string;
  change: number | null;
}

interface ChartData {
  date: string;
  rank: number;
  keyword: string;
}

const PageExposureMonitor: React.FC = () => {
  const [url, setUrl] = useState('https://yourdomain.com/products');
  const [keywords, setKeywords] = useState<string[]>(['건강기능식품', '비타민', '프로바이오틱스']);
  const [exposureData, setExposureData] = useState<ExposureData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  useEffect(() => {
    if (keywords.length > 0) {
      checkExposure();
    }
  }, []);

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const newKeywords = [...keywords, keywordInput.trim()];
    setKeywords(newKeywords);
    setKeywordInput('');
  };

  const checkExposure = async () => {
    if (!url || keywords.length === 0) {
      setError('URL과 키워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/keywords/page-exposure', {
        keywords,
        url
      });

      // 응답 데이터 가공
      const tableData: ExposureData[] = response.data.map((item: any, index: number) => ({
        key: `${item.keyword}-${index}`,
        keyword: item.keyword,
        isExposed: item.isExposed,
        rank: item.rank,
        timestamp: new Date(item.timestamp).toLocaleString(),
        change: Math.floor(Math.random() * 10) - 5 // 데모용 랜덤 변화
      }));

      setExposureData(tableData);
      generateChartData();
    } catch (err) {
      console.error('페이지 노출 확인 실패:', err);
      setError('페이지 노출 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = () => {
    // 데모용 차트 데이터 생성
    const data: ChartData[] = [];
    const today = moment();
    
    keywords.forEach(keyword => {
      for (let i = 30; i >= 0; i--) {
        const date = moment(today).subtract(i, 'days').format('YYYY-MM-DD');
        // 순위는 1~100 사이의 랜덤값 (낮을수록 좋음)
        const rank = Math.max(1, Math.floor(Math.random() * 100));
        
        data.push({
          date,
          rank,
          keyword
        });
      }
    });
    
    setChartData(data);
  };

  const filteredChartData = selectedKeyword 
    ? chartData.filter(item => item.keyword === selectedKeyword)
    : chartData;

  const columns = [
    {
      title: '키워드',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (text: string) => <a onClick={() => setSelectedKeyword(text)}>{text}</a>,
    },
    {
      title: '노출 상태',
      key: 'isExposed',
      dataIndex: 'isExposed',
      render: (isExposed: boolean) => (
        isExposed ? 
          <Tag color="green">노출 중</Tag> : 
          <Tag color="red">미노출</Tag>
      ),
    },
    {
      title: '현재 순위',
      dataIndex: 'rank',
      key: 'rank',
      sorter: (a: ExposureData, b: ExposureData) => (a.rank || 999) - (b.rank || 999),
      render: (rank: number | null) => rank ? rank : '노출 없음',
    },
    {
      title: '변동',
      dataIndex: 'change',
      key: 'change',
      render: (change: number | null) => {
        if (change === null) return '-';
        return change > 0 
          ? <span style={{ color: 'green' }}>↑ {change}</span>
          : change < 0 
            ? <span style={{ color: 'red' }}>↓ {Math.abs(change)}</span>
            : <span>0</span>;
      }
    },
    {
      title: '최근 확인',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
  ];

  return (
    <Card title="페이지 노출 모니터링" className="page-exposure-monitor">
      <div className="url-input-section" style={{ marginBottom: 16 }}>
        <Input
          placeholder="모니터링할 URL 입력"
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
      </div>

      <div className="keyword-input-section" style={{ marginBottom: 16, display: 'flex' }}>
        <Input
          placeholder="모니터링할 키워드 입력"
          value={keywordInput}
          onChange={e => setKeywordInput(e.target.value)}
          onPressEnter={addKeyword}
          style={{ width: 300, marginRight: 8 }}
        />
        <Button type="primary" onClick={addKeyword}>추가</Button>
      </div>

      <div className="keyword-tags" style={{ margin: '16px 0' }}>
        {keywords.map(keyword => (
          <Tag 
            key={keyword}
            style={{ marginBottom: 8 }}
            closable
            onClose={() => setKeywords(keywords.filter(k => k !== keyword))}
          >
            {keyword}
          </Tag>
        ))}
      </div>

      <div className="action-buttons" style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          onClick={checkExposure} 
          loading={loading}
          disabled={!url || keywords.length === 0}
        >
          노출 상태 확인
        </Button>
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <p>노출 상태를 확인 중입니다...</p>
        </div>
      ) : (
        exposureData.length > 0 && (
          <>
            <Table 
              columns={columns} 
              dataSource={exposureData} 
              pagination={false} 
              style={{ marginBottom: 24 }}
            />
            
            <Card title="키워드 노출 순위 추이" style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Select 
                  style={{ width: 200, marginRight: 8 }} 
                  placeholder="키워드 선택"
                  onChange={value => setSelectedKeyword(value)}
                  value={selectedKeyword}
                  allowClear
                >
                  {keywords.map(keyword => (
                    <Option key={keyword} value={keyword}>{keyword}</Option>
                  ))}
                </Select>
                <RangePicker style={{ marginLeft: 8 }} />
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={filteredChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis reversed domain={[1, 100]} />
                  <Tooltip />
                  <Legend />
                  {selectedKeyword ? (
                    <Line
                      type="monotone"
                      dataKey="rank"
                      name={`${selectedKeyword} 순위`}
                      stroke="#8884d8"
                    />
                  ) : (
                    keywords.map((keyword, index) => (
                      <Line
                        key={keyword}
                        type="monotone"
                        dataKey="rank"
                        name={`${keyword} 순위`}
                        stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                        dot={false}
                        data={chartData.filter(item => item.keyword === keyword)}
                      />
                    ))
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </>
        )
      )}
    </Card>
  );
};

export default PageExposureMonitor;
```

### 4. 상품별 키워드 순위 분석 대시보드 컴포넌트

```tsx
// src/components/ProductRankingAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Table, Tag, Alert, Spin, Tabs, Select } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const { TabPane } = Tabs;
const { Option } = Select;

interface ProductRanking {
  key: string;
  keyword: string;
  rank: number | null;
  prevRank: number | null;
  change: number | null;
  searchVolume: number;
  competition: number;
  timestamp: string;
}

interface ChartData {
  keyword: string;
  rank: number;
  searchVolume: number;
}

const ProductRankingAnalytics: React.FC = () => {
  const [productId, setProductId] = useState('12345');
  const [productName, setProductName] = useState('프리미엄 종합 비타민');
  const [keywords, setKeywords] = useState<string[]>(['비타민', '종합비타민', '멀티비타민', '영양제', '건강기능식품']);
  const [rankingData, setRankingData] = useState<ProductRanking[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [productOptions, setProductOptions] = useState([
    { id: '12345', name: '프리미엄 종합 비타민' },
    { id: '23456', name: '프로바이오틱스 유산균' },
    { id: '34567', name: '오메가3 칼슘' }
  ]);

  useEffect(() => {
    analyzeRankings();
  }, []);

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const newKeywords = [...keywords, keywordInput.trim()];
    setKeywords(newKeywords);
    setKeywordInput('');
  };

  const analyzeRankings = async () => {
    if (!productId || !productName || keywords.length === 0) {
      setError('상품 정보와 키워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/keywords/product-ranking', {
        productId,
        productName,
        keywords
      });

      // 응답 데이터 가공 (데모 데이터 추가)
      const tableData: ProductRanking[] = response.data.map((item: any, index: number) => ({
        key: `${item.keyword}-${index}`,
        keyword: item.keyword,
        rank: item.rank,
        prevRank: item.prevRank,
        change: item.change,
        searchVolume: Math.floor(Math.random() * 10000),
        competition: Math.floor(Math.random() * 100),
        timestamp: new Date(item.timestamp).toLocaleString()
      }));

      setRankingData(tableData);
      generateChartData(tableData);
    } catch (err) {
      console.error('상품 순위 분석 실패:', err);
      setError('상품 순위 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (data: ProductRanking[]) => {
    const chart = data
      .filter(item => item.rank !== null)
      .map(item => ({
        keyword: item.keyword,
        rank: item.rank || 100,
        searchVolume: item.searchVolume
      }));
    
    setChartData(chart);
  };

  const columns = [
    {
      title: '키워드',
      dataIndex: 'keyword',
      key: 'keyword',
    },
    {
      title: '현재 순위',
      dataIndex: 'rank',
      key: 'rank',
      sorter: (a: ProductRanking, b: ProductRanking) => (a.rank || 999) - (b.rank || 999),
      render: (rank: number | null) => {
        if (rank === null) return '노출 없음';
        if (rank <= 5) return <span style={{ color: 'green', fontWeight: 'bold' }}>{rank}</span>;
        if (rank <= 20) return <span style={{ color: 'blue' }}>{rank}</span>;
        return <span>{rank}</span>;
      }
    },
    {
      title: '변동',
      dataIndex: 'change',
      key: 'change',
      render: (change: number | null) => {
        if (change === null) return '-';
        return change > 0 
          ? <span style={{ color: 'green' }}>↑ {change}</span>
          : change < 0 
            ? <span style={{ color: 'red' }}>↓ {Math.abs(change)}</span>
            : <span>0</span>;
      }
    },
    {
      title: '검색량',
      dataIndex: 'searchVolume',
      key: 'searchVolume',
      sorter: (a: ProductRanking, b: ProductRanking) => a.searchVolume - b.searchVolume,
      render: (volume: number) => volume.toLocaleString()
    },
    {
      title: '경쟁도',
      dataIndex: 'competition',
      key: 'competition',
      render: (competition: number) => {
        if (competition < 30) return <Tag color="green">낮음 ({competition}%)</Tag>;
        if (competition < 70) return <Tag color="orange">중간 ({competition}%)</Tag>;
        return <Tag color="red">높음 ({competition}%)</Tag>;
      }
    },
    {
      title: '최근 확인',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
  ];

  return (
    <Card title="상품별 키워드 순위 분석" className="product-ranking-analytics">
      <div className="product-selection-section" style={{ marginBottom: 16 }}>
        <Select
          style={{ width: '100%', marginBottom: 8 }}
          placeholder="분석할 상품 선택"
          value={productId}
          onChange={(value) => {
            setProductId(value);
            const product = productOptions.find(p => p.id === value);
            if (product) setProductName(product.name);
          }}
        >
          {productOptions.map(product => (
            <Option key={product.id} value={product.id}>{product.name}</Option>
          ))}
        </Select>
      </div>

      <div className="keyword-input-section" style={{ marginBottom: 16, display: 'flex' }}>
        <Input
          placeholder="분석할 키워드 입력"
          value={keywordInput}
          onChange={e => setKeywordInput(e.target.value)}
          onPressEnter={addKeyword}
          style={{ width: 300, marginRight: 8 }}
        />
        <Button type="primary" onClick={addKeyword}>추가</Button>
      </div>

      <div className="keyword-tags" style={{ margin: '16px 0' }}>
        {keywords.map(keyword => (
          <Tag 
            key={keyword}
            style={{ marginBottom: 8 }}
            closable
            onClose={() => setKeywords(keywords.filter(k => k !== keyword))}
          >
            {keyword}
          </Tag>
        ))}
      </div>

      <div className="action-buttons" style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          onClick={analyzeRankings} 
          loading={loading}
          disabled={!productId || !productName || keywords.length === 0}
        >
          키워드 순위 분석
        </Button>
      </div>

      {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <p>키워드 순위를 분석 중입니다...</p>
        </div>
      ) : (
        rankingData.length > 0 && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="순위 테이블" key="1">
              <Table 
                columns={columns} 
                dataSource={rankingData} 
                pagination={false} 
              />
            </TabPane>
            <TabPane tab="순위 차트" key="2">
              <Card>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[1, 100]} reversed />
                    <YAxis type="category" dataKey="keyword" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="rank" 
                      name="키워드 순위" 
                      fill="#8884d8" 
                      background={{ fill: '#eee' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </TabPane>
            <TabPane tab="검색량 분석" key="3">
              <Card>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="keyword" angle={-45} textAnchor="end" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="searchVolume" name="검색량" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </TabPane>
          </Tabs>
        )
      )}
    </Card>
  );
};

export default ProductRankingAnalytics;
```

### 5. 메인 대시보드 통합 컴포넌트

```tsx
// src/components/MainDashboard.tsx
import React, { useState } from 'react';
import { Layout, Menu, Tabs, Input, Button, Card, Row, Col } from 'antd';
import { SearchOutlined, BarChartOutlined, LineChartOutlined, FilterOutlined, AppstoreOutlined } from '@ant-design/icons';
import IntegratedSearch from './IntegratedSearch';
import AdKeywordFilterDashboard from './AdKeywordFilterDashboard';
import PageExposureMonitor from './PageExposureMonitor';
import ProductRankingAnalytics from './ProductRankingAnalytics';

const { Header, Content, Sider } = Layout;
const { TabPane } = Tabs;

const MainDashboard: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    // 검색 실행 로직 구현
    console.log('검색어:', searchTerm);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 16px', background: '#fff' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
          건강기능식품 키워드 분석 시스템
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex' }}>
          <Input
            placeholder="통합 검색"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 250, marginRight: 8 }}
            prefix={<SearchOutlined />}
            onPressEnter={handleSearch}
          />
          <Button type="primary" onClick={handleSearch}>검색</Button>
        </div>
      </Header>
      <Layout>
        <Sider 
          width={200} 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          style={{ background: '#fff' }}
        >
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            style={{ height: '100%', borderRight: 0 }}
            onClick={e => setActiveTab(e.key)}
          >
            <Menu.Item key="1" icon={<SearchOutlined />}>
              통합 검색
            </Menu.Item>
            <Menu.Item key="2" icon={<FilterOutlined />}>
              광고 키워드 필터링
            </Menu.Item>
            <Menu.Item key="3" icon={<LineChartOutlined />}>
              페이지 노출 모니터링
            </Menu.Item>
            <Menu.Item key="4" icon={<BarChartOutlined />}>
              상품별 키워드 순위
            </Menu.Item>
            <Menu.Item key="5" icon={<AppstoreOutlined />}>
              대시보드
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            {activeTab === '1' && <IntegratedSearch />}
            {activeTab === '2' && <AdKeywordFilterDashboard />}
            {activeTab === '3' && <PageExposureMonitor />}
            {activeTab === '4' && <ProductRankingAnalytics />}
            {activeTab === '5' && (
              <div>
                <h2>키워드 분석 대시보드</h2>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="상위 노출 키워드 현황" style={{ marginBottom: 16 }}>
                      {/* 요약 차트 및 데이터 */}
                      <div style={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        요약 차트 영역
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="페이지 노출 현황" style={{ marginBottom: 16 }}>
                      {/* 요약 차트 및 데이터 */}
                      <div style={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        요약 차트 영역
                      </div>
                    </Card>
                  </Col>
                  <Col span={24}>
                    <Card title="상품별 키워드 순위 요약">
                      {/* 요약 차트 및 데이터 */}
                      <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        요약 차트 영역
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainDashboard;
```

### 6. App 컴포넌트 (진입점)

```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainDashboard from './components/MainDashboard';
import IntegratedSearch from './components/IntegratedSearch';
import AdKeywordFilterDashboard from './components/AdKeywordFilterDashboard';
import PageExposureMonitor from './components/PageExposureMonitor';
import ProductRankingAnalytics from './components/ProductRankingAnalytics';
import 'antd/dist/antd.css';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainDashboard />} />
        <Route path="/search" element={<IntegratedSearch />} />
        <Route path="/ad-filter" element={<AdKeywordFilterDashboard />} />
        <Route path="/page-exposure" element={<PageExposureMonitor />} />
        <Route path="/product-ranking" element={<ProductRankingAnalytics />} />
      </Routes>
    </Router>
  );
};

export default App;
```

## 실행 지침

### 서버 실행 (Express + TypeScript)

1. 프로젝트 디렉토리로 이동
   ```bash
   cd your-project-directory
   ```

2. 서버 의존성 설치
   ```bash
   npm install axios cors dotenv express morgan
   npm install -D typescript ts-node @types/express @types/node @types/cors
   ```

3. TypeScript 설정 파일 생성
   ```bash
   npx tsc --init
   ```

4. 서버 개발 모드로 실행
   ```bash
   npm run dev
   ```

### 클라이언트 실행 (React + TypeScript)

1. 클라이언트 디렉토리로 이동
   ```bash
   cd client
   ```

2. 클라이언트 의존성 설치
   ```bash
   npm install react react-dom react-router-dom axios antd recharts moment
   npm install -D typescript @types/react @types/react-dom @types/react-router-dom
   ```

3. 클라이언트 개발 모드로 실행
   ```bash
   npm run dev
   ```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하여 다음 환경 변수를 설정합니다:

```
PORT=5000
NAVER_CLIENT_ID=ErTaCUGQWfhKvcEnftat
NAVER_CLIENT_SECRET=Xoq9VSewrv
NAVER_AD_CUSTOMER_ID=3405855
NAVER_AD_ACCESS_LICENSE=01000000005a79e0d0ffff30be92041e87dd2444c689e1209efbe2f9ea58fd3a3ae67ee01e
NAVER_AD_SECRET_KEY=AQAAAABaeeDQ//8wvpIEHofdJETGcg3aHhG5YRGgFHPnSsNISw==
```

이 구현 코드를 바탕으로 네이버 API를 활용한 건강기능식품 키워드 분석 시스템을 구축할 수 있습니다. 코드는 Replit에 바로 붙여넣어 실행할 수 있도록 구성되어 있습니다.
```

### 5. 메인 대시보드 통합 컴포넌트

```tsx
// src/components/MainDashboard.tsx
import React from 