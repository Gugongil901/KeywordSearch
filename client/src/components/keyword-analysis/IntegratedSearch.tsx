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
  const [keywords, setKeywords] = useState('');
  const [url, setUrl] = useState('');
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [keywordLimit, setKeywordLimit] = useState(10);
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);

  const handleSearch = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) return;
    
    setIsLoading(true);
    let endpoint = '';
    let requestData = {};
    let apiMethod = 'post';
    
    try {
      const searchTab = activeTab;
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      
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
          endpoint = '/api/niche-keywords/recommend';
          requestData = { };
          apiMethod = 'get';
          break;
      }
      
      const { data } = await axios({
        method: apiMethod as any,
        url: endpoint,
        data: requestData
      });
      
      if (data.success) {
        setSearchResult({
          type: searchTab as any,
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

  const handleUseDefaultKeywords = (shouldSearch = false) => {
    if (availableKeywords.length > 0) {
      setKeywords(availableKeywords.join(', '));
    } else {
      setKeywords(DEFAULT_KEYWORDS.join(', '));
    }
    
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

  // 니치 키워드 결과 렌더링
  const renderNicheKeywordsResults = (data: NicheKeywordResult) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>소형(니치) 키워드 분석</CardTitle>
          <CardDescription>
            검색량은 적당하고, 경쟁도가 낮으며, 성장성이 높은 잠재력 있는 키워드
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>니치 키워드란?</AlertTitle>
              <AlertDescription>
                경쟁이 적고 타겟이 명확한 틈새 키워드로, 광고 효율이 높고 성장 잠재력이 있는 키워드입니다.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">발견된 니치 키워드</p>
                <p className="text-2xl font-bold">{data.nicheKeywordCount}</p>
                <p className="text-xs text-muted-foreground">총 {data.totalKeywords}개 중</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">니치 키워드 비율</p>
                <p className="text-2xl font-bold">{data.nicheRatio}%</p>
                <p className="text-xs text-muted-foreground">전체 키워드 대비</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">높은 잠재력 키워드</p>
                <p className="text-2xl font-bold">
                  {data.categories?.highPotential.length || 
                    data.nicheKeywords.filter(k => k.nicheScore >= 80).length}
                </p>
                <p className="text-xs text-muted-foreground">잠재력 높음으로 분류</p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">발견된 니치 키워드</h3>
            <div className="border rounded-lg overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left">키워드</th>
                    <th className="px-3 py-2 text-right">검색량</th>
                    <th className="px-3 py-2 text-right">경쟁도</th>
                    <th className="px-3 py-2 text-right">성장률</th>
                    <th className="px-3 py-2 text-center">경쟁 수준</th>
                    <th className="px-3 py-2 text-center">니치 점수</th>
                    <th className="px-3 py-2 text-center">추천 채널</th>
                  </tr>
                </thead>
                <tbody>
                  {data.nicheKeywords.length > 0 ? (
                    data.nicheKeywords.map((keyword, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                        <td className="px-4 py-2">
                          <div className="font-medium">{keyword.keyword}</div>
                          <div className="text-xs text-muted-foreground">
                            {keyword.potential === '높음' ? '높은 잠재력' : 
                             keyword.potential === '중간' ? '중간 잠재력' : '낮은 잠재력'}
                            {keyword.difficultyLevel && ` • ${keyword.difficultyLevel}`}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{keyword.searchVolume}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {(keyword.competition * 100).toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`font-mono ${keyword.growth > 1 ? 'text-green-600' : 'text-red-600'}`}>
                            {((keyword.growth - 1) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {keyword.competitionLevel ? (
                            <Badge 
                              variant={
                                keyword.competitionLevel === '매우 낮음' || keyword.competitionLevel === '낮음' ? "success" :
                                keyword.competitionLevel === '중간' ? "warning" : "destructive"
                              }
                              className="text-xs"
                            >
                              {keyword.competitionLevel}
                            </Badge>
                          ) : 
                          <Badge variant="outline" className="text-xs">
                            {keyword.competition < 0.3 ? '낮음' : keyword.competition < 0.6 ? '중간' : '높음'}
                          </Badge>}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge 
                            variant={keyword.nicheScore >= 80 ? "default" : 
                                   keyword.nicheScore >= 60 ? "secondary" : "outline"}
                            className="font-mono"
                          >
                            {keyword.nicheScore}
                            {keyword.opportunityScore !== undefined && (
                              <span className="text-xs ml-1">({(keyword.opportunityScore * 100).toFixed(0)}%)</span>
                            )}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {keyword.recommendedChannels ? 
                              keyword.recommendedChannels.map((channel, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className={`text-xs ${
                                    channel === 'SEO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    channel === 'PPC' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    channel === '컨텐츠 마케팅' ? 'bg-green-50 text-green-700 border-green-200' :
                                    'bg-orange-50 text-orange-700 border-orange-200'
                                  }`}
                                >
                                  {channel}
                                </Badge>
                              )) : 
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">SEO</Badge>
                            }
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-2 text-center text-muted-foreground">
                        니치 키워드를 찾을 수 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {data.nicheKeywords.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">추천 활용 방안</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {data.nicheKeywords.slice(0, 3).map((keyword, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{keyword.keyword}</span>: {keyword.recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
      case 'niche-keywords':
        return renderNicheKeywordsResults(searchResult.data as NicheKeywordResult);
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
        <TabsList className="grid grid-cols-5">
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
                    onClick={() => handleUseDefaultKeywords(true)}
                    className="whitespace-nowrap"
                  >
                    검색
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
                      onClick={() => handleUseDefaultKeywords(true)}
                      className="whitespace-nowrap"
                    >
                      검색
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
                      onClick={() => handleUseDefaultKeywords(true)}
                      className="whitespace-nowrap"
                    >
                      검색
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
                      onClick={() => handleUseDefaultKeywords(true)}
                      className="whitespace-nowrap"
                    >
                      검색
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
        
        <TabsContent value="niche-keywords" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>소형(니치) 키워드 찾기</CardTitle>
              <CardDescription>
                검색량이 적당하고 경쟁이 낮으며 성장성이 높은 잠재력 있는 틈새 키워드를 찾습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>니치 키워드란?</AlertTitle>
                <AlertDescription>
                  경쟁이 적고 타겟이 명확한 틈새 키워드로, 적은 예산으로도 효율적인 광고와 높은 전환율을 기대할 수 있습니다.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">
                  키워드 목록 (쉼표로 구분)
                </label>
                <div className="flex flex-col space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="비타민, 유기농 비타민, 고함량 종합비타민, 액상 마그네슘..."
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => handleUseDefaultKeywords(true)}
                      className="whitespace-nowrap"
                    >
                      검색
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
                <h3 className="text-sm font-medium">필터링 기준</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">최소 검색량</label>
                    <Select defaultValue="100">
                      <SelectTrigger>
                        <SelectValue placeholder="최소 검색량" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">최대 경쟁도</label>
                    <Select defaultValue="0.3">
                      <SelectTrigger>
                        <SelectValue placeholder="최대 경쟁도" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.1">매우 낮음 (0.1)</SelectItem>
                        <SelectItem value="0.3">낮음 (0.3)</SelectItem>
                        <SelectItem value="0.5">중간 (0.5)</SelectItem>
                        <SelectItem value="0.7">높음 (0.7)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">최소 성장률</label>
                    <Select defaultValue="1.2">
                      <SelectTrigger>
                        <SelectValue placeholder="최소 성장률" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.0">안정적 (1.0)</SelectItem>
                        <SelectItem value="1.1">약간 성장 (1.1)</SelectItem>
                        <SelectItem value="1.2">성장 중 (1.2)</SelectItem>
                        <SelectItem value="1.5">급성장 (1.5)</SelectItem>
                      </SelectContent>
                    </Select>
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
                      니치 키워드 찾기
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