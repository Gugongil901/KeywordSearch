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
  type: 'ad-keywords' | 'page-exposure' | 'product-ranking' | 'best-keywords';
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

// 서버에서 가져오는 키워드로 대체
const DEFAULT_KEYWORDS = [
  "비타민", "종합비타민", "멀티비타민", "마그네슘", "철분제", 
  "프로바이오틱스", "루테인", "비타민D", "비타민C", "오메가3",
  "밀크씨슬", "EPA", "DHA", "글루코사민", "코큐텐", "콜라겐"
];

export default function IntegratedSearch() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('ad-keywords');
  const [keywords, setKeywords] = useState('');
  const [url, setUrl] = useState('');
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [keywordLimit, setKeywordLimit] = useState(10);
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);

  const handleSearch = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    let endpoint = '';
    let requestData = {};
    let apiMethod = 'post';
    
    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      
      if (keywordArray.length === 0) {
        throw new Error('키워드를 하나 이상 입력해주세요');
      }
      
      // 기본 테스트용 URL과 상품 정보
      const defaultUrl = 'https://shopping.naver.com/health/stores/100150981';
      const defaultProductInfo = {
        productId: 'HEALTH-01523',
        productName: '종합비타민 프리미엄'
      };
      
      switch (activeTab) {
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
      }
      
      const { data } = await axios({
        method: apiMethod as any,
        url: endpoint,
        data: requestData
      });
      
      if (data.success) {
        setSearchResult({
          type: activeTab as any,
          data: data.data,
          timestamp: new Date().toISOString()
        });
        
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
    setSearchResult(null);
  };

  const handleUseDefaultKeywords = () => {
    if (availableKeywords.length > 0) {
      setKeywords(availableKeywords.join(', '));
    } else {
      setKeywords(DEFAULT_KEYWORDS.join(', '));
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
                    <th className="px-4 py-2 text-right">현재 순위</th>
                    <th className="px-4 py-2 text-right">이전 순위</th>
                    <th className="px-4 py-2 text-right">변화</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top10Keywords.length > 0 ? (
                    data.top10Keywords.map((result, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                        <td className="px-4 py-2 font-medium">{result.keyword}</td>
                        <td className="px-4 py-2 text-right font-mono">
                          {result.rank ?? '-'}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {result.prevRank ?? '-'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {result.change ? (
                            <span className={`font-mono ${result.change > 0 ? 'text-green-600' : result.change < 0 ? 'text-red-600' : ''}`}>
                              {result.change > 0 ? `+${result.change}` : result.change}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-center text-muted-foreground">
                        상위 10위 내 키워드가 없습니다.
                      </td>
                    </tr>
                  )}
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
          <CardTitle>최적 키워드 분석</CardTitle>
          <CardDescription>
            건강보조제 브랜드 제품에 대한 최적 키워드 분석 결과 {data.count}개
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>최적 키워드란?</AlertTitle>
              <AlertDescription>
                해당 상품이 가장 높은 순위로 노출되는 키워드로, 마케팅 및 SEO에 활용할 수 있습니다.
              </AlertDescription>
            </Alert>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left">키워드</th>
                    <th className="px-4 py-2 text-right">노출 순위</th>
                    <th className="px-4 py-2 text-right">이전 순위</th>
                    <th className="px-4 py-2 text-right">변화</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bestKeywords.length > 0 ? (
                    data.bestKeywords.map((keyword, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                        <td className="px-4 py-2 font-medium">{keyword.keyword}</td>
                        <td className="px-4 py-2 text-right font-mono">
                          {keyword.rank ?? '-'}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {keyword.prevRank ?? '-'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {keyword.change ? (
                            <span className={`font-mono ${keyword.change > 0 ? 'text-green-600' : keyword.change < 0 ? 'text-red-600' : ''}`}>
                              {keyword.change > 0 ? `+${keyword.change}` : keyword.change}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-center text-muted-foreground">
                        최적 키워드가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSearchResults = () => {
    if (!searchResult) return null;
    
    switch (searchResult.type) {
      case 'ad-keywords':
        return renderAdKeywordResults(searchResult.data as AdKeywordResult);
      case 'page-exposure':
        return renderPageExposureResults(searchResult.data as PageExposureResult);
      case 'product-ranking':
        return renderProductRankingResults(searchResult.data as ProductRankingResult);
      case 'best-keywords':
        return renderBestKeywordsResults(searchResult.data as BestKeywordsResult);
      default:
        return <p>지원되지 않는 결과 유형입니다.</p>;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold">통합 키워드 분석</h1>
        <p className="text-muted-foreground">
          광고 키워드 필터링, 페이지 노출 확인, 상품 순위 분석 등 다양한 키워드 분석 기능을 통합적으로 제공합니다.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="ad-keywords">광고 키워드 필터링</TabsTrigger>
          <TabsTrigger value="page-exposure">페이지 노출 확인</TabsTrigger>
          <TabsTrigger value="product-ranking">상품 순위 분석</TabsTrigger>
          <TabsTrigger value="best-keywords">최적 키워드 찾기</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ad-keywords" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>광고 키워드 필터링</CardTitle>
              <CardDescription>
                이미 상위에 노출되는 광고 키워드를 필터링하고 효율적인 광고 키워드를 추천받으세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">
                  키워드 목록 (쉼표로 구분)
                </label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="비타민, 종합비타민, 멀티비타민, 마그네슘..."
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleUseDefaultKeywords}
                    className="whitespace-nowrap"
                  >
                    기본 키워드
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Filter className="mr-2 h-4 w-4" />
                      키워드 필터링
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="page-exposure" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>페이지 노출 확인</CardTitle>
              <CardDescription>
                특정 키워드로 검색했을 때 웹페이지가 노출되는지 확인하고 노출 순위를 분석합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">
                  키워드 목록 (쉼표로 구분)
                </label>
                <div className="flex flex-col space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="비타민, 종합비타민, 멀티비타민, 마그네슘..."
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleUseDefaultKeywords}
                      className="whitespace-nowrap"
                    >
                      추천 키워드
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <div className="flex flex-wrap gap-2">
                      {availableKeywords.slice(0, 10).map((keyword, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => setKeywords(prev => prev ? `${prev}, ${keyword}` : keyword)}
                        >
                          {keyword}
                        </Badge>
                      ))}
                      {availableKeywords.length > 10 && (
                        <Badge variant="outline">+ {availableKeywords.length - 10}개 더</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      확인 중...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      노출 확인
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="product-ranking" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>상품 순위 분석</CardTitle>
              <CardDescription>
                다양한 키워드에서 인기 건강보조제 브랜드 제품들의 노출 순위를 분석합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">
                  키워드 목록 (쉼표로 구분)
                </label>
                <div className="flex flex-col space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="비타민, 종합비타민, 멀티비타민, 마그네슘..."
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleUseDefaultKeywords}
                      className="whitespace-nowrap"
                    >
                      추천 키워드
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <div className="flex flex-wrap gap-2">
                      {availableKeywords.slice(0, 10).map((keyword, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => setKeywords(prev => prev ? `${prev}, ${keyword}` : keyword)}
                        >
                          {keyword}
                        </Badge>
                      ))}
                      {availableKeywords.length > 10 && (
                        <Badge variant="outline">+ {availableKeywords.length - 10}개 더</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      순위 분석
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="best-keywords" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>최적 키워드 찾기</CardTitle>
              <CardDescription>
                건강보조제 브랜드 제품들이 가장 높은 순위로 노출되는 최적의 키워드를 분석합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">
                  키워드 목록 (쉼표로 구분)
                </label>
                <div className="flex flex-col space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="비타민, 종합비타민, 멀티비타민, 마그네슘..."
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleUseDefaultKeywords}
                      className="whitespace-nowrap"
                    >
                      추천 키워드
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <div className="flex flex-wrap gap-2">
                      {availableKeywords.slice(0, 10).map((keyword, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => setKeywords(prev => prev ? `${prev}, ${keyword}` : keyword)}
                        >
                          {keyword}
                        </Badge>
                      ))}
                      {availableKeywords.length > 10 && (
                        <Badge variant="outline">+ {availableKeywords.length - 10}개 더</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">
                  최대 키워드 수
                </label>
                <Select 
                  value={keywordLimit.toString()} 
                  onValueChange={(value) => setKeywordLimit(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="최대 키워드 수" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">상위 5개</SelectItem>
                    <SelectItem value="10">상위 10개</SelectItem>
                    <SelectItem value="20">상위 20개</SelectItem>
                    <SelectItem value="50">상위 50개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      검색 중...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      최적 키워드 찾기
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {searchResult && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">분석 결과</h2>
          {renderSearchResults()}
        </div>
      )}
    </div>
  );
}