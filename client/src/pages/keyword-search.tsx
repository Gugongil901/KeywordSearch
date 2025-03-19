import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  searchKeyword, 
  getKeywordAnalysis,
  KeywordSearchResult,
  KeywordAnalysis,
  KeywordInsight
} from '@/lib/naver-api';
import { 
  Search, 
  TrendingUp, 
  BarChart3, 
  CheckCircle, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';

export default function KeywordSearch() {
  const [keyword, setKeyword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // URL 파라미터에서 검색어 가져오기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get('query');
    if (queryParam) {
      setKeyword(queryParam);
      setSearchTerm(queryParam);
    }
  }, []);
  
  // 키워드 검색 결과
  const { 
    data: keywordData, 
    isLoading: isKeywordLoading, 
    error: keywordError
  } = useQuery({
    queryKey: ['/api/search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return null;
      return await searchKeyword(searchTerm);
    },
    enabled: !!searchTerm
  });
  
  // 키워드 분석 데이터 (검색광고 API)
  const { 
    data: analysisData, 
    isLoading: isAnalysisLoading 
  } = useQuery({
    queryKey: ['/api/keyword/analysis', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return null;
      try {
        return await getKeywordAnalysis(searchTerm);
      } catch (error) {
        console.error("키워드 분석 데이터 로딩 실패:", error);
        return null;
      }
    },
    enabled: !!searchTerm
  });
  
  // 검색어 변경 핸들러
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };
  
  // 검색 실행 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      toast({
        title: "검색어를 입력하세요",
        description: "검색할 키워드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    setSearchTerm(keyword);
    // URL 업데이트
    setLocation(`/keyword?query=${encodeURIComponent(keyword)}`);
  };
  
  // 키워드 클릭 핸들러
  const handleKeywordClick = (selectedKeyword: string) => {
    setKeyword(selectedKeyword);
    setSearchTerm(selectedKeyword);
    setLocation(`/keyword?query=${encodeURIComponent(selectedKeyword)}`);
  };
  
  // 키워드 상세 페이지로 이동
  const goToKeywordDetail = () => {
    if (searchTerm) {
      setLocation(`/keyword/${encodeURIComponent(searchTerm)}`);
    }
  };
  
  // 숫자 포맷팅 함수
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };
  
  // 가격 포맷팅 함수
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(num).replace('₩', '');
  };

  // 경쟁도 표시 텍스트
  const getCompetitionText = (value: number) => {
    if (value > 80) return '매우 높음';
    if (value > 60) return '높음';
    if (value > 40) return '보통';
    if (value > 20) return '낮음';
    return '매우 낮음';
  };
  
  // 경쟁도 색상
  const getCompetitionColor = (value: number) => {
    if (value > 80) return 'text-red-500';
    if (value > 60) return 'text-orange-500';
    if (value > 40) return 'text-yellow-500';
    if (value > 20) return 'text-green-500';
    return 'text-blue-500';
  };
  
  // 키워드 통계 표시 컴포넌트
  const KeywordStatsCard = ({ data }: { data: KeywordSearchResult }) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{data.keyword} 검색 결과</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToKeywordDetail}
          >
            상세 분석 보기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          월 검색량: <span className="font-bold">{formatNumber(data.searchCount)}회</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">상품 수</div>
            <div className="text-2xl font-bold">{formatNumber(data.productCount)}개</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">평균 가격</div>
            <div className="text-2xl font-bold">{formatCurrency(data.averagePrice)}원</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">총 판매액</div>
            <div className="text-2xl font-bold">{formatCurrency(data.totalSales)}원</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">경쟁 강도</div>
            <div className={`text-2xl font-bold ${getCompetitionColor(data.competitionIndex)}`}>
              {getCompetitionText(data.competitionIndex)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // 관련 키워드 표시 컴포넌트
  const RelatedKeywordsCard = ({ data }: { data: KeywordSearchResult }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">관련 키워드</CardTitle>
        <CardDescription>자주 함께 검색되는 키워드</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {data.relatedKeywords?.slice(0, 12).map((relatedKeyword, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="px-3 py-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => handleKeywordClick(relatedKeyword)}
            >
              {relatedKeyword}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  // 광고 인사이트 표시 컴포넌트
  const AdInsightsCard = ({ data }: { data: KeywordAnalysis }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">광고 인사이트</CardTitle>
        <CardDescription>검색광고 성과 및 경쟁 지표</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">평균 클릭비용(CPC)</div>
            <div className="text-xl font-bold">{formatCurrency(data.avgCpc)}원</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">광고 경쟁 지수</div>
            <div className={`text-xl font-bold ${getCompetitionColor(data.competitionIndex)}`}>
              {data.competitionIndex.toFixed(1)}점
            </div>
          </div>
        </div>
        
        {data.adRecommendations && data.adRecommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">입찰가별 예상 성과</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">입찰가</th>
                    <th className="text-right py-2">노출수</th>
                    <th className="text-right py-2">클릭수</th>
                    <th className="text-right py-2">평균순위</th>
                    <th className="text-right py-2">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.adRecommendations.slice(0, 5).map((bid, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{formatCurrency(bid.bid)}원</td>
                      <td className="text-right py-2">{formatNumber(bid.impressions)}</td>
                      <td className="text-right py-2">{formatNumber(bid.clicks)}</td>
                      <td className="text-right py-2">{bid.avgPosition.toFixed(1)}</td>
                      <td className="text-right py-2">{(bid.ctr * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  // 상위 상품 표시 컴포넌트
  const TopProductsCard = ({ data }: { data: KeywordSearchResult }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">상위 상품</CardTitle>
        <CardDescription>상위 노출되는 인기 상품</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.products.slice(0, 6).map((product) => (
            <div 
              key={product.productId} 
              className="border rounded-lg p-3 hover:border-primary cursor-pointer"
              onClick={() => window.open(product.productUrl, '_blank')}
            >
              <div className="aspect-square w-full overflow-hidden mb-2 flex items-center justify-center">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="h-full w-auto object-contain"
                />
              </div>
              <div className="line-clamp-2 text-sm h-10">{product.title}</div>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-muted-foreground">{product.brandName || '일반 브랜드'}</span>
                <span className="font-medium">{formatCurrency(product.price)}원</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
  
  // 로딩 중 스켈레톤 컴포넌트
  const LoadingSkeleton = () => (
    <>
      <div className="mb-6">
        <Skeleton className="h-12 w-full mb-2" />
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="mb-6">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-60 mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
      </div>
      <div className="mb-6">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-60 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    </>
  );
  
  return (
    <div className="container mx-auto py-6">
      {/* 검색 폼 */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="검색어를 입력하세요 (예: 루테인, 다이슨, 맥북)"
            value={keyword}
            onChange={handleKeywordChange}
            className="max-w-md"
          />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            검색
          </Button>
        </form>
      </div>
      
      {/* 검색 결과 */}
      {isKeywordLoading || isAnalysisLoading ? (
        <LoadingSkeleton />
      ) : keywordData ? (
        <>
          {/* 키워드 통계 카드 */}
          <KeywordStatsCard data={keywordData} />
          
          {/* 탭 UI 컴포넌트 */}
          <Tabs defaultValue="products" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="products">
                <BarChart3 className="mr-2 h-4 w-4" />
                상품 분석
              </TabsTrigger>
              <TabsTrigger value="adinsights">
                <TrendingUp className="mr-2 h-4 w-4" />
                광고 인사이트
              </TabsTrigger>
              <TabsTrigger value="related">
                <CheckCircle className="mr-2 h-4 w-4" />
                연관 키워드
              </TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              <TopProductsCard data={keywordData} />
            </TabsContent>
            <TabsContent value="adinsights">
              {analysisData ? (
                <AdInsightsCard data={analysisData} />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p>광고 인사이트 데이터를 로드할 수 없습니다.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="related">
              <RelatedKeywordsCard data={keywordData} />
            </TabsContent>
          </Tabs>
        </>
      ) : searchTerm && !isKeywordLoading && keywordError ? (
        <Card>
          <CardHeader>
            <CardTitle>검색 오류</CardTitle>
          </CardHeader>
          <CardContent>
            <p>키워드 "{searchTerm}" 검색 중 오류가 발생했습니다. 다시 시도해주세요.</p>
          </CardContent>
        </Card>
      ) : searchTerm && !isKeywordLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>검색 결과 없음</CardTitle>
          </CardHeader>
          <CardContent>
            <p>키워드 "{searchTerm}"에 대한 검색 결과가 없습니다. 다른 키워드로 검색해보세요.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>키워드 검색</CardTitle>
          </CardHeader>
          <CardContent>
            <p>검색어를 입력하여 키워드 분석 결과를 확인하세요.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}