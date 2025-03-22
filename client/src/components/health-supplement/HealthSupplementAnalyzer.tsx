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
  summary: {
    totalKeywords: number;
    rankedCount: number;
    top10Count: number;
    exposureRate: number;
    averageRank: number | null;
  };
  top10Keywords: {
    keyword: string;
    rank: number;
    prevRank?: number;
    change?: number;
  }[];
  allRankings: {
    keyword: string;
    rank: number | null;
    prevRank?: number | null;
    change?: number;
    error?: string;
  }[];
  timestamp: string;
}

interface BestKeywordsResult {
  productInfo: {
    productId: string;
    productName: string;
  };
  bestKeywords: {
    keyword: string;
    rank: number;
    prevRank?: number;
    change?: number;
  }[];
  count: number;
  timestamp: string;
}

// 디폴트 키워드는 나중에 서버에서 가져올 것입니다
const DEFAULT_KEYWORDS = [
  "비타민", "종합비타민", "멀티비타민", "마그네슘", "철분제", 
  "프로바이오틱스", "유산균", "루테인", "비타민D", "비타민C",
  "오메가3", "밀크씨슬", "EPA", "DHA", "글루코사민"
];

export default function HealthSupplementAnalyzer() {
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
      
      if (keywordArray.length === 0 && activeTab !== 'product-ranking' && activeTab !== 'best-keywords') {
        throw new Error('키워드를 하나 이상 입력해주세요');
      }
      
      switch (activeTab) {
        case 'ad-keywords':
          endpoint = '/api/health-supplement/ad-filter';
          requestData = { keywords: keywordArray };
          break;
        
        case 'page-exposure':
          if (!url) {
            throw new Error('URL을 입력해주세요');
          }
          endpoint = '/api/health-supplement/page-exposure';
          requestData = { 
            keywords: keywordArray,
            url 
          };
          break;
        
        case 'product-ranking':
          if (!productId || !productName) {
            throw new Error('상품 ID와 상품명을 입력해주세요');
          }
          endpoint = '/api/health-supplement/product-ranking';
          requestData = { 
            productId, 
            productName, 
            keywords: keywordArray
          };
          break;
        
        case 'best-keywords':
          if (!productId || !productName) {
            throw new Error('상품 ID와 상품명을 입력해주세요');
          }
          endpoint = '/api/health-supplement/best-keywords';
          requestData = { 
            productId, 
            productName, 
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
      setKeywords(availableKeywords.slice(0, 5).join(', '));
    } else {
      setKeywords(DEFAULT_KEYWORDS.slice(0, 5).join(', '));
    }
  };
  
  // 서버에서 키워드 목록 가져오기
  useEffect(() => {
    const fetchKeywords = async () => {
      setIsLoadingKeywords(true);
      try {
        // 건강보조제 전용 API로 변경
        let endpoint = '/api/health-supplement/keywords';
        
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
            URL <span className="font-mono">{url}</span>에 대한 노출 현황
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
            상품 "{productName}" (ID: {productId})의 키워드별 순위 분석
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
                        상위 10위 내 키워드가 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">전체 키워드 순위</h3>
            <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-background">
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left">키워드</th>
                    <th className="px-4 py-2 text-right">현재 순위</th>
                    <th className="px-4 py-2 text-right">이전 순위</th>
                    <th className="px-4 py-2 text-right">변화</th>
                  </tr>
                </thead>
                <tbody>
                  {data.allRankings.map((result, index) => (
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
          <CardTitle>최적 키워드 분석 결과</CardTitle>
          <CardDescription>
            상품 "{data.productInfo.productName}" (ID: {data.productInfo.productId})의 최적 키워드 {data.count}개
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>분석 결과</AlertTitle>
              <AlertDescription>
                상품이 가장 높은 순위로 노출되는 최적의 키워드 {data.count}개를 선별했습니다.
                {data.count === 0 && ' 현재 상위에 노출되는 키워드가 없습니다.'}
              </AlertDescription>
            </Alert>
            
            {data.bestKeywords.length > 0 ? (
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
                    {data.bestKeywords.map((keyword, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                        <td className="px-4 py-2 font-medium">
                          <Badge variant="outline" className="mr-2 bg-green-100 text-green-800">#{index + 1}</Badge>
                          {keyword.keyword}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {keyword.rank}
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
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center text-muted-foreground">
                <p>노출된 키워드가 없습니다. 다른 키워드로 시도해보세요.</p>
              </div>
            )}
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">광고 전략 추천</h4>
              <p className="text-sm text-muted-foreground">
                {data.bestKeywords.length > 0 
                  ? `선별된 ${data.count}개의 키워드에 집중하여 광고 예산을 분배하세요. 특히 상위 3개 키워드는 최우선적으로 고려해야 합니다.` 
                  : '현재 상위에 노출되는 키워드가 없습니다. 더 많은 키워드를 테스트하거나 컨텐츠 최적화가 필요합니다.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="ad-keywords">광고 키워드 필터링</TabsTrigger>
          <TabsTrigger value="page-exposure">페이지 노출 확인</TabsTrigger>
          <TabsTrigger value="product-ranking">상품 순위 분석</TabsTrigger>
          <TabsTrigger value="best-keywords">최적 키워드 찾기</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ad-keywords">
          <Card>
            <CardHeader>
              <CardTitle>광고 키워드 필터링</CardTitle>
              <CardDescription>
                이미 상위에 노출되는 광고 키워드를 필터링하여 효율적인 광고 집행을 지원합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="keywords">
                    키워드 목록 (쉼표로 구분)
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUseDefaultKeywords} 
                    disabled={isLoadingKeywords}
                    className="text-xs h-7"
                  >
                    {isLoadingKeywords ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        키워드 로딩 중...
                      </>
                    ) : (
                      '추천 키워드 사용'
                    )}
                  </Button>
                </div>
                <Input
                  id="keywords"
                  placeholder="예: 비타민, 종합비타민, 멀티비타민, 마그네슘"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
              
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    검색 중...
                  </>
                ) : (
                  <>
                    <Filter className="mr-2 h-4 w-4" />
                    키워드 필터링
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {searchResult && searchResult.type === 'ad-keywords' && renderAdKeywordResults(searchResult.data)}
        </TabsContent>
        
        <TabsContent value="page-exposure">
          <Card>
            <CardHeader>
              <CardTitle>페이지 노출 확인</CardTitle>
              <CardDescription>
                특정 키워드에 대해 웹페이지가 검색 결과에 노출되는지 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="url">
                  URL
                </label>
                <Input
                  id="url"
                  placeholder="예: https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="keywords">
                    확인할 키워드 (쉼표로 구분)
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUseDefaultKeywords} 
                    disabled={isLoadingKeywords}
                    className="text-xs h-7"
                  >
                    {isLoadingKeywords ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        키워드 로딩 중...
                      </>
                    ) : (
                      '추천 키워드 사용'
                    )}
                  </Button>
                </div>
                <Input
                  id="keywords"
                  placeholder="예: 비타민, 멀티비타민, 건강기능식품"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
              
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
            </CardContent>
          </Card>
          
          {searchResult && searchResult.type === 'page-exposure' && renderPageExposureResults(searchResult.data)}
        </TabsContent>
        
        <TabsContent value="product-ranking">
          <Card>
            <CardHeader>
              <CardTitle>상품 순위 분석</CardTitle>
              <CardDescription>
                특정 상품이 어떤 키워드에서 어떤 순위로 노출되는지 분석합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="productId">
                    상품 ID
                  </label>
                  <Input
                    id="productId"
                    placeholder="예: 12345678"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="productName">
                    상품명
                  </label>
                  <Input
                    id="productName"
                    placeholder="예: 종합비타민"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="keywords">
                    확인할 키워드 (쉼표로 구분)
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUseDefaultKeywords} 
                    disabled={isLoadingKeywords}
                    className="text-xs h-7"
                  >
                    {isLoadingKeywords ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        키워드 로딩 중...
                      </>
                    ) : (
                      '추천 키워드 사용'
                    )}
                  </Button>
                </div>
                <Input
                  id="keywords"
                  placeholder="예: 비타민, 멀티비타민, 건강기능식품"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  키워드를 입력하지 않으면 자동으로 건강기능식품 관련 인기 키워드로 분석합니다.
                </p>
              </div>
              
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
            </CardContent>
          </Card>
          
          {searchResult && searchResult.type === 'product-ranking' && renderProductRankingResults(searchResult.data)}
        </TabsContent>
        
        <TabsContent value="best-keywords">
          <Card>
            <CardHeader>
              <CardTitle>최적 키워드 찾기</CardTitle>
              <CardDescription>
                특정 상품이 가장 높은 순위로 노출되는 최적의 키워드를 찾습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="productId2">
                    상품 ID
                  </label>
                  <Input
                    id="productId2"
                    placeholder="예: 12345678"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="productName2">
                    상품명
                  </label>
                  <Input
                    id="productName2"
                    placeholder="예: 종합비타민"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor="keywords2">
                    분석할 키워드 (쉼표로 구분)
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUseDefaultKeywords} 
                    disabled={isLoadingKeywords}
                    className="text-xs h-7"
                  >
                    {isLoadingKeywords ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        키워드 로딩 중...
                      </>
                    ) : (
                      '추천 키워드 사용'
                    )}
                  </Button>
                </div>
                <Input
                  id="keywords2"
                  placeholder="예: 비타민, 멀티비타민, 건강기능식품, 영양제"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  키워드를 입력하지 않으면 자동으로 건강기능식품 관련 인기 키워드로 분석합니다.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="keywordLimit">
                  찾을 최적 키워드 수
                </label>
                <Select 
                  value={keywordLimit.toString()} 
                  onValueChange={(val) => setKeywordLimit(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="키워드 수 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5개</SelectItem>
                    <SelectItem value="10">10개</SelectItem>
                    <SelectItem value="20">20개</SelectItem>
                    <SelectItem value="30">30개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    최적 키워드 찾기
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {searchResult && searchResult.type === 'best-keywords' && renderBestKeywordsResults(searchResult.data)}
        </TabsContent>
      </Tabs>
    </div>
  );
}