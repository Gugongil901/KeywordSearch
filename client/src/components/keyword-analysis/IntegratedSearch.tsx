import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, CheckCircle, AlertCircle, Search, Filter, Loader2 } from "lucide-react";
import axios from 'axios';

interface SearchResult {
  type: 'ad-keywords' | 'page-exposure' | 'product-ranking' | 'best-keywords' | 'niche-keywords';
  data: any;
  timestamp: string;
}

interface AdKeywordResult {
  topExposureKeywords: string[];
  suggestedKeywords: string[];
  totalKeywords: number;
  timestamp: string;
}

interface PageExposureResult {
  results: {
    keyword: string;
    url: string;
    isExposed: boolean;
    rank: number | null;
    timestamp: string;
  }[];
  summary: {
    totalKeywords: number;
    exposedCount: number;
    exposureRate: number;
    averageRank: number | null;
  };
  timestamp: string;
}

interface ProductRankingResult {
  results: {
    productId: string;
    productName: string;
    keyword: string;
    rank: number | null;
    prevRank: number | null;
    change: number | null;
    timestamp: string;
  }[];
  summary: {
    totalKeywords: number;
    rankedCount: number;
    top10Count: number;
    exposureRate: number;
    averageRank: number | null;
  };
  top10Keywords: any[];
  timestamp: string;
}

interface BestKeywordsResult {
  bestKeywords: {
    productId: string;
    productName: string;
    keyword: string;
    rank: number | null;
    prevRank: number | null;
    change: number | null;
    timestamp: string;
  }[];
  productInfo: {
    productId: string;
    productName: string;
  };
  count: number;
  timestamp: string;
}

interface NicheKeywordResult {
  totalKeywords: number;
  nicheKeywords: {
    keyword: string;
    searchVolume: number;
    competition: number;
    growth: number;
    nicheScore: number;
    potential: string;
    recommendation: string;
    competitionLevel?: string;
    recommendedChannels?: string[];
    opportunityScore?: number;
    profitPotential?: number;
    difficultyLevel?: string;
    categoryRelevance?: number;
    commercialIntent?: number;
    seasonality?: number;
  }[];
  nicheKeywordCount: number;
  nicheRatio: string;
  categories?: {
    highPotential: any[];
    mediumPotential: any[];
    lowPotential: any[];
  };
}

// 서버에서 가져오는 키워드로 대체
const DEFAULT_KEYWORDS = [
  "비타민", "종합비타민", "멀티비타민", "마그네슘", "철분제", 
  "프로바이오틱스", "루테인", "비타민D", "비타민C", "오메가3",
  "밀크씨슬", "EPA", "DHA", "글루코사민", "코큐텐", "콜라겐"
];

export default function IntegratedSearch() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('ad-keywords');
  
  // 각 탭별 키워드 상태 관리 - 기본값 설정
  const [tabKeywords, setTabKeywords] = useState<Record<string, string>>({
    'ad-keywords': '비타민, 종합비타민, 멀티비타민',
    'page-exposure': '종근당 아이클리어 루테인 지아잔틴',
    'product-ranking': '종근당 아이클리어 루테인 지아잔틴',
    'best-keywords': '종합비타민, 멀티비타민, 마그네슘',
    'niche-keywords': ''
  });
  
  const [url, setUrl] = useState('');
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [keywordLimit, setKeywordLimit] = useState(10);
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  
  // 현재 탭의 키워드 업데이트 함수
  const updateCurrentTabKeywords = (value: string) => {
    setTabKeywords(prev => ({
      ...prev,
      [activeTab]: value
    }));
  };

  const handleSearch = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) return;
    
    setIsLoading(true);
    let endpoint = '';
    let requestData = {};
    let apiMethod = 'post';
    
    try {
      const searchTab = activeTab;
      // 현재 활성화된 탭의 키워드 사용
      const keywordArray = tabKeywords[activeTab].split(',').map(k => k.trim()).filter(k => k);
      
      if (keywordArray.length === 0 && searchTab !== 'niche-keywords') {
        throw new Error('키워드를 하나 이상 입력해주세요');
      }
      
      // 기본 테스트용 URL과 상품 정보
      const defaultUrl = 'https://shopping.naver.com/health/stores/100150981';
      const defaultProductInfo = {
        productId: 'HEALTH-01523',
        productName: '종합비타민 프리미엄'
      };
      
      switch (searchTab) {
        case 'ad-keywords':
          endpoint = '/api/advanced-analysis/ad-filter';
          requestData = { keywords: keywordArray };
          break;
        
        case 'page-exposure':
          endpoint = '/api/advanced-analysis/page-exposure';
          requestData = { 
            keywords: keywordArray,
            url: defaultUrl // 기본 URL 사용
          };
          break;
        
        case 'product-ranking':
          endpoint = '/api/advanced-analysis/product-ranking';
          requestData = { 
            productId: defaultProductInfo.productId, 
            productName: defaultProductInfo.productName, 
            keywords: keywordArray
          };
          break;
        
        case 'best-keywords':
          endpoint = '/api/advanced-analysis/best-keywords';
          requestData = { 
            productId: defaultProductInfo.productId, 
            productName: defaultProductInfo.productName, 
            keywords: keywordArray,
            limit: keywordLimit
          };
          break;
          
        case 'niche-keywords':
          // 사용자가 입력한 키워드가 있으면 검색하고, 없으면 추천 사용
          if (keywordArray.length === 0) {
            endpoint = '/api/niche-keywords/recommend';
            requestData = { };
            apiMethod = 'get';
          } else {
            endpoint = '/api/niche-keywords/find';
            // 서버 API 형식에 맞춰 데이터 변환 (searchVolume과 competition, growth는 서버에서 계산)
            const keywordDataList = keywordArray.map(keyword => ({
              keyword,
              searchVolume: 500, // 기본값 설정
              competition: 0.3,   // 기본값 설정
              growth: 1.2,        // 기본값 설정
              commercialIntent: 0.7,
              categoryRelevance: 0.8,
              seasonality: 0.5
            }));
            
            requestData = { 
              keywordDataList,
              criteria: {
                minSearchVolume: 100,
                maxCompetition: 0.3,
                minGrowthRate: 1.2
              }
            };
            console.log('[니치 키워드 검색] 요청 데이터:', requestData); // 로깅 추가
            apiMethod = 'post';
          }
          break;
      }
      
      console.log(`[검색 요청] 엔드포인트: ${endpoint}, 키워드: ${keywordArray.join(', ')}`);
      console.log(`[검색 요청] 요청 데이터:`, requestData);
      
      const { data } = await axios({
        method: apiMethod as any,
        url: endpoint,
        data: requestData
      });
      
      console.log(`[검색 응답] 상태:`, data.success ? '성공' : '실패', '데이터:', data);
      
      if (data.success) {
        // 검색 결과 저장 (현재 탭 타입으로 설정)
        const newResult = {
          type: searchTab as any,
          data: data.data,
          timestamp: new Date().toISOString()
        };
        console.log(`[검색 결과 저장] 탭: ${searchTab}, 데이터:`, newResult);
        setSearchResult(newResult);
        
        toast({
          title: "검색 성공",
          description: "결과가 성공적으로 로드되었습니다",
        });
      } else {
        throw new Error(data.error || '서버 오류가 발생했습니다');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      
      toast({
        title: "검색 실패",
        description: error.message || '오류가 발생했습니다',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // 탭이 변경되면 결과는 초기화하지만, 각 탭의 키워드는 유지됩니다
    setSearchResult(null);
  };

  const handleUseDefaultKeywords = (shouldSearch = false) => {
    const newKeywords = availableKeywords.length > 0 
      ? availableKeywords.slice(0, 5).join(', ') 
      : DEFAULT_KEYWORDS.slice(0, 5).join(', ');
    
    // 현재 탭의 키워드 업데이트
    setTabKeywords(prev => ({
      ...prev,
      [activeTab]: newKeywords
    }));
    
    // 즉시 검색 실행 옵션
    if (shouldSearch) {
      setTimeout(() => handleSearch(), 100); // 약간의 지연을 두고 검색 실행
    }
  };
  
  // 서버에서 키워드 목록 가져오기
  useEffect(() => {
    const fetchKeywords = async () => {
      setIsLoadingKeywords(true);
      try {
        // 활성 탭에 따라 적절한 API 엔드포인트 선택
        let endpoint = '/api/advanced-analysis/ad-keywords';
        
        switch (activeTab) {
          case 'ad-keywords':
            endpoint = '/api/advanced-analysis/ad-keywords';
            break;
          case 'page-exposure':
            endpoint = '/api/advanced-analysis/page-keywords';
            break;
          case 'product-ranking':
          case 'best-keywords':
            endpoint = '/api/advanced-analysis/product-keywords';
            break;
        }
        
        const { data } = await axios.get(endpoint);
        
        if (data.success && data.data && data.data.keywords) {
          setAvailableKeywords(data.data.keywords);
        } else {
          console.warn('키워드 목록을 가져오지 못했습니다.');
          setAvailableKeywords(DEFAULT_KEYWORDS);
        }
      } catch (error) {
        console.error('키워드 목록 로딩 오류:', error);
        // 오류 발생 시 기본 키워드 사용
        setAvailableKeywords(DEFAULT_KEYWORDS);
      } finally {
        setIsLoadingKeywords(false);
      }
    };
    
    fetchKeywords();
  }, [activeTab]); // 탭이 변경될 때마다 다시 로드

  const renderAdKeywordResults = (data: AdKeywordResult) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>상위 노출 광고 키워드</span>
              <Badge variant="destructive">{data.topExposureKeywords.length}</Badge>
            </CardTitle>
            <CardDescription>이미 상위에 노출되는 경쟁 광고 키워드</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.topExposureKeywords.length > 0 ? (
                data.topExposureKeywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="py-1">
                    <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                    {keyword}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">상위 노출 키워드가 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>추천 광고 키워드</span>
              <Badge variant="default">{data.suggestedKeywords.length}</Badge>
            </CardTitle>
            <CardDescription>효율적인 광고 집행을 위한 추천 키워드</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.suggestedKeywords.length > 0 ? (
                data.suggestedKeywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="py-1">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    {keyword}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">추천 키워드가 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>분석 요약</AlertTitle>
        <AlertDescription>
          총 {data.totalKeywords}개의 키워드 중 {data.topExposureKeywords.length}개가 이미 상위 노출되고 있으며, 
          {data.suggestedKeywords.length}개가 추천 키워드로 분류되었습니다.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderPageExposureResults = (data: PageExposureResult) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>페이지 노출 결과</CardTitle>
          <CardDescription>
            네이버 쇼핑몰에서 키워드별 순위 노출 분석 결과
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">노출 키워드 수</p>
                <p className="text-2xl font-bold">{data.summary.exposedCount}</p>
                <p className="text-xs text-muted-foreground">총 {data.summary.totalKeywords}개 중</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">노출 비율</p>
                <p className="text-2xl font-bold">{data.summary.exposureRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">전체 키워드 대비</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">평균 노출 순위</p>
                <p className="text-2xl font-bold">{data.summary.averageRank ? data.summary.averageRank.toFixed(1) : '-'}</p>
                <p className="text-xs text-muted-foreground">노출된 키워드 기준</p>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left">키워드</th>
                    <th className="px-4 py-2 text-center">노출 여부</th>
                    <th className="px-4 py-2 text-right">노출 순위</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="px-4 py-2 font-medium">{result.keyword}</td>
                      <td className="px-4 py-2 text-center">
                        {result.isExposed ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">노출됨</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800">미노출</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {result.rank ? result.rank : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProductRankingResults = (data: ProductRankingResult) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>상품 키워드 순위 분석</CardTitle>
          <CardDescription>
            인기 건강보조제 제품의 키워드별 노출 순위 분석
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">노출된 키워드</p>
                <p className="text-2xl font-bold">{data.summary.rankedCount}</p>
                <p className="text-xs text-muted-foreground">총 {data.summary.totalKeywords}개 중</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">노출 비율</p>
                <p className="text-2xl font-bold">{data.summary.exposureRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">전체 키워드 대비</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">상위 10위 키워드</p>
                <p className="text-2xl font-bold">{data.summary.top10Count}</p>
                <p className="text-xs text-muted-foreground">상위 노출 키워드 수</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">평균 노출 순위</p>
                <p className="text-2xl font-bold">{data.summary.averageRank ? data.summary.averageRank.toFixed(1) : '-'}</p>
                <p className="text-xs text-muted-foreground">노출된 키워드 기준</p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">상위 10위 키워드</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left">키워드</th>
                    <th className="px-4 py-2 text-center">순위</th>
                    <th className="px-4 py-2 text-right">변화</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.filter(r => r.rank && r.rank <= 10).map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="px-4 py-2 font-medium">{result.keyword}</td>
                      <td className="px-4 py-2 text-center font-mono">{result.rank || '-'}</td>
                      <td className="px-4 py-2 text-right">
                        {result.change ? (
                          <Badge variant={result.change > 0 ? "success" : result.change < 0 ? "destructive" : "outline"}>
                            {result.change > 0 ? `+${result.change}` : result.change}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBestKeywordsResults = (data: BestKeywordsResult) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>최적의 키워드 분석</CardTitle>
          <CardDescription>
            제품: {data.productInfo.productName} (ID: {data.productInfo.productId})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>분석 요약</AlertTitle>
              <AlertDescription>
                <div className="flex flex-wrap gap-1">
                  <span>총 </span>
                  <span className="font-medium">{data.count}개</span>
                  <span>의 키워드 중 최적의 키워드</span>
                  <span className="font-medium">{data.bestKeywords.length}개</span>
                  <span>가 발견되었습니다.</span>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left">키워드</th>
                    <th className="px-4 py-2 text-center">순위</th>
                    <th className="px-4 py-2 text-center">이전 순위</th>
                    <th className="px-4 py-2 text-right">변화</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bestKeywords.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="px-4 py-2 font-medium">{result.keyword}</td>
                      <td className="px-4 py-2 text-center font-mono">{result.rank || '-'}</td>
                      <td className="px-4 py-2 text-center font-mono">{result.prevRank || '-'}</td>
                      <td className="px-4 py-2 text-right">
                        {result.change !== null ? (
                          <Badge variant={result.change > 0 ? "success" : result.change < 0 ? "destructive" : "outline"}>
                            {result.change > 0 ? `+${result.change}` : result.change}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNicheKeywordResults = (data: NicheKeywordResult) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>소형(니치) 키워드 결과</span>
            <Badge variant="outline">찾은 키워드: {data.nicheKeywordCount}</Badge>
          </CardTitle>
          <CardDescription>
            검색량은 적당하고 경쟁이 낮으며 성장 가능성이 높은 건강보조제 키워드입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">니치 키워드 비율</p>
                <p className="text-2xl font-bold">{data.nicheRatio}</p>
                <p className="text-xs text-muted-foreground">총 {data.totalKeywords}개 중 {data.nicheKeywordCount}개</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">최고 잠재력</p>
                <p className="text-2xl font-bold">{data.categories?.highPotential.length || 0}개</p>
                <div className="flex mt-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-2 h-4 mx-0.5 bg-green-500 rounded-sm" />
                  ))}
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">중간 잠재력</p>
                <p className="text-2xl font-bold">{data.categories?.mediumPotential.length || 0}개</p>
                <div className="flex mt-1">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-4 mx-0.5 rounded-sm ${i < 2 ? 'bg-yellow-500' : 'bg-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-2 py-2 text-left">키워드</th>
                    <th className="px-2 py-2 text-center">검색량</th>
                    <th className="px-2 py-2 text-center">경쟁도</th>
                    <th className="px-2 py-2 text-center">성장률</th>
                    <th className="px-2 py-2 text-center">니치 점수</th>
                    <th className="px-2 py-2 text-center">경쟁 수준</th>
                    <th className="px-2 py-2 text-right">추천 채널</th>
                  </tr>
                </thead>
                <tbody>
                  {data.nicheKeywords.map((keyword, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="px-2 py-2 font-medium">{keyword.keyword}</td>
                      <td className="px-2 py-2 text-center">{keyword.searchVolume}</td>
                      <td className="px-2 py-2 text-center">{keyword.competition.toFixed(2)}</td>
                      <td className="px-2 py-2 text-center">
                        <Badge variant={keyword.growth > 1.2 ? "success" : "outline"}>
                          {keyword.growth > 1 ? `+${((keyword.growth - 1) * 100).toFixed(0)}%` : `${((keyword.growth - 1) * 100).toFixed(0)}%`}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <Badge variant={keyword.nicheScore > 75 ? "success" : keyword.nicheScore > 50 ? "default" : "outline"}>
                          {keyword.nicheScore.toFixed(0)}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <Badge 
                          variant="outline" 
                          className={
                            keyword.competitionLevel === '낮음' ? 'bg-green-100 text-green-800' : 
                            keyword.competitionLevel === '중간' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }
                        >
                          {keyword.competitionLevel || '중간'}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {keyword.recommendedChannels?.slice(0, 2).map((channel, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResults = () => {
    if (!searchResult) return null;
    
    console.log("렌더링 결과 타입:", searchResult.type, "데이터:", searchResult.data);
    
    switch (searchResult.type) {
      case 'ad-keywords':
        return renderAdKeywordResults(searchResult.data);
      case 'page-exposure':
        return renderPageExposureResults(searchResult.data);
      case 'product-ranking':
        return renderProductRankingResults(searchResult.data);
      case 'best-keywords':
        return renderBestKeywordsResults(searchResult.data);
      case 'niche-keywords':
        return renderNicheKeywordResults(searchResult.data);
      default:
        return null;
    }
  };

  // 키워드 추가 핸들러
  const handleAddKeyword = (keyword: string) => {
    // 현재 탭의 키워드에 추가
    setTabKeywords(prev => {
      const currentKeywords = prev[activeTab];
      return {
        ...prev,
        [activeTab]: currentKeywords ? `${currentKeywords}, ${keyword}` : keyword
      };
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl">고급 키워드 분석</CardTitle>
          <CardDescription>
            광고 키워드 효율화, 페이지 노출 분석, 상품 키워드 순위 모니터링 등 다양한 키워드 분석 도구
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs 
        defaultValue="ad-keywords" 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="ad-keywords">광고 키워드 필터링</TabsTrigger>
          <TabsTrigger value="page-exposure">페이지 노출 확인</TabsTrigger>
          <TabsTrigger value="product-ranking">상품 순위 분석</TabsTrigger>
          <TabsTrigger value="best-keywords">최적 키워드 찾기</TabsTrigger>
          <TabsTrigger value="niche-keywords">소형(니치) 키워드</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ad-keywords" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>광고 키워드 필터링</CardTitle>
              <CardDescription>
                이미 상위에 노출되는 광고 키워드를 자동으로 식별하고 필터링합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    분석할 키워드 목록
                  </label>
                  <div className="flex flex-col space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="비타민, 종합비타민, 멀티비타민, 마그네슘..."
                        value={tabKeywords['ad-keywords'] || ''}
                        onChange={(e) => updateCurrentTabKeywords(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => handleSearch()}
                        className="whitespace-nowrap"
                      >
                        검색
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUseDefaultKeywords(false)}
                        disabled={isLoadingKeywords}
                      >
                        {isLoadingKeywords ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            로딩 중...
                          </>
                        ) : (
                          <>기본 키워드 사용</>
                        )}
                      </Button>
                      
                      {availableKeywords.slice(0, 5).map((keyword, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleAddKeyword(keyword)}
                        >
                          + {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">검색 중...</span>
            </div>
          )}
          
          {searchResult?.type === 'ad-keywords' && renderResults()}
        </TabsContent>
        
        <TabsContent value="page-exposure" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>페이지 노출 확인</CardTitle>
              <CardDescription>
                특정 키워드에서 웹페이지가 노출되는지 확인하고 순위를 분석합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    검색할 키워드 목록
                  </label>
                  <div className="flex flex-col space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="비타민, 종합비타민, 멀티비타민, 마그네슘..."
                        value={tabKeywords['page-exposure'] || ''}
                        onChange={(e) => updateCurrentTabKeywords(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => handleSearch()}
                        className="whitespace-nowrap"
                      >
                        검색
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUseDefaultKeywords(false)}
                        disabled={isLoadingKeywords}
                      >
                        {isLoadingKeywords ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            로딩 중...
                          </>
                        ) : (
                          <>기본 키워드 사용</>
                        )}
                      </Button>
                      
                      {availableKeywords.slice(0, 5).map((keyword, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleAddKeyword(keyword)}
                        >
                          + {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">검색 중...</span>
            </div>
          )}
          
          {searchResult?.type === 'page-exposure' && renderResults()}
        </TabsContent>
        
        <TabsContent value="product-ranking" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>상품 순위 분석</CardTitle>
              <CardDescription>
                특정 상품이 다양한 키워드에서 어떤 순위로 노출되는지 분석합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    분석할 키워드 목록
                  </label>
                  <div className="flex flex-col space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="비타민, 종합비타민, 멀티비타민, 마그네슘..."
                        value={tabKeywords['product-ranking'] || ''}
                        onChange={(e) => updateCurrentTabKeywords(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => handleSearch()}
                        className="whitespace-nowrap"
                      >
                        검색
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUseDefaultKeywords(false)}
                        disabled={isLoadingKeywords}
                      >
                        {isLoadingKeywords ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            로딩 중...
                          </>
                        ) : (
                          <>기본 키워드 사용</>
                        )}
                      </Button>
                      
                      {availableKeywords.slice(0, 5).map((keyword, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => handleAddKeyword(keyword)}
                        >
                          + {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">검색 중...</span>
            </div>
          )}
          
          {searchResult?.type === 'product-ranking' && renderResults()}
        </TabsContent>
        
        <TabsContent value="best-keywords" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>최적 키워드 찾기</CardTitle>
              <CardDescription>
                특정 상품이 가장 높은 순위로 노출되는 최적의 키워드를 찾습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <label className="block text-sm font-medium mb-1">
                      분석할 키워드 목록
                    </label>
                    <div className="flex flex-col space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="비타민, 종합비타민, 멀티비타민, 마그네슘..."
                          value={tabKeywords['best-keywords'] || ''}
                          onChange={(e) => updateCurrentTabKeywords(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => handleSearch()}
                          className="whitespace-nowrap"
                        >
                          검색
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUseDefaultKeywords(false)}
                          disabled={isLoadingKeywords}
                        >
                          {isLoadingKeywords ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              로딩 중...
                            </>
                          ) : (
                            <>기본 키워드 사용</>
                          )}
                        </Button>
                        
                        {availableKeywords.slice(0, 5).map((keyword, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => handleAddKeyword(keyword)}
                          >
                            + {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      결과 개수 제한
                    </label>
                    <Select
                      value={keywordLimit.toString()}
                      onValueChange={(value) => setKeywordLimit(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5개</SelectItem>
                        <SelectItem value="10">10개</SelectItem>
                        <SelectItem value="20">20개</SelectItem>
                        <SelectItem value="50">50개</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">검색 중...</span>
            </div>
          )}
          
          {searchResult?.type === 'best-keywords' && renderResults()}
        </TabsContent>
        
        <TabsContent value="niche-keywords" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>소형(니치) 키워드 발굴</CardTitle>
              <CardDescription>
                검색량은 적당하고 경쟁은 낮으며 성장 가능성이 높은 소형 키워드를 발굴합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      키워드 필터링 옵션
                    </label>
                    <div className="flex flex-col space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="비타민, 종합비타민, 멀티비타민, 마그네슘..."
                          value={tabKeywords['niche-keywords'] || ''}
                          onChange={(e) => updateCurrentTabKeywords(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => handleSearch()}
                          className="whitespace-nowrap"
                        >
                          검색
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUseDefaultKeywords(false)}
                          disabled={isLoadingKeywords}
                        >
                          {isLoadingKeywords ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              로딩 중...
                            </>
                          ) : (
                            <>기본 키워드 사용</>
                          )}
                        </Button>
                        
                        {availableKeywords.slice(0, 5).map((keyword, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => handleAddKeyword(keyword)}
                          >
                            + {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">검색 중...</span>
            </div>
          )}
          
          {searchResult?.type === 'niche-keywords' && renderResults()}
        </TabsContent>
      </Tabs>
    </div>
  );
}