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
          <span className="mx-2">•</span>
          PC: <span className="font-bold">{data.pcSearchRatio}%</span>
          <span className="mx-2">•</span>
          모바일: <span className="font-bold">{data.mobileSearchRatio}%</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
            <div className="text-2xl font-bold">{formatCurrency(data.totalSales)}만원</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">경쟁 강도</div>
            <div className={`text-2xl font-bold ${getCompetitionColor(data.competitionIndex)}`}>
              {getCompetitionText(data.competitionIndex)}
            </div>
          </div>
        </div>
        
        {/* 추가 지표 섹션 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">실거래 상품 비율</div>
            <div className="text-xl font-bold">{data.realProductRatio}%</div>
            <div className="text-xs text-muted-foreground mt-1">리뷰가 있는 상품 비율</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">해외 상품 비율</div>
            <div className="text-xl font-bold">{data.foreignProductRatio}%</div>
            <div className="text-xs text-muted-foreground mt-1">해외 브랜드 제품 비율</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">클릭당 경쟁상품</div>
            <div className="text-xl font-bold">
              {Math.round((data.productCount / (data.searchCount * 0.03)) * 10) / 10}개
            </div>
            <div className="text-xs text-muted-foreground mt-1">CTR 3% 가정</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">키워드 효율</div>
            <div className={`text-xl font-bold ${data.searchCount / data.productCount > 5 ? 'text-green-500' : 'text-orange-500'}`}>
              {Math.round((data.searchCount / data.productCount) * 10) / 10}
            </div>
            <div className="text-xs text-muted-foreground mt-1">검색량 / 상품수 (높을수록 좋음)</div>
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
  const AdInsightsCard = ({ data }: { data: KeywordAnalysis }) => {
    // 광고 효율성 척도 계산
    const calculateEfficiencyScore = (cpc: number, searchVolume: number): number => {
      // CPC가 낮을수록, 검색량이 많을수록 효율적
      const normalizedCpc = Math.min(1, 5000 / (cpc + 500)); // CPC가 낮을수록 높은 점수
      const normalizedVolume = Math.min(1, searchVolume / 10000); // 검색량이 많을수록 높은 점수
      return Math.round((normalizedCpc * 0.7 + normalizedVolume * 0.3) * 100);
    };

    // 광고 비용 절감 팁 생성
    const generateAdTips = (data: KeywordAnalysis): string[] => {
      const tips: string[] = [];
      if (data.competitionIndex > 70) {
        tips.push("경쟁이 치열한 키워드입니다. 틈새 롱테일 키워드를 고려해보세요.");
      }
      if (data.avgCpc > 1500) {
        tips.push("CPC가 높은 편입니다. 시간대별 입찰가 조정으로 비용을 절감할 수 있습니다.");
      }
      if (data.adRecommendations && data.adRecommendations.length > 0) {
        const highestBid = data.adRecommendations[0];
        if (highestBid.avgPosition < 2) {
          tips.push("최상위 노출을 위해 필요 이상으로 높은 입찰가를 제시하고 있을 수 있습니다.");
        }
      }
      if (tips.length === 0) {
        tips.push("현재 키워드는 광고 효율이 양호합니다. 컨텐츠 최적화로 효과를 높여보세요.");
      }
      return tips;
    };
    
    // 효율성 점수
    const efficiencyScore = calculateEfficiencyScore(data.avgCpc, data.monthlySearches);
    
    // 효율성 색상
    const getEfficiencyColor = (score: number): string => {
      if (score > 80) return 'text-green-500';
      if (score > 60) return 'text-green-400';
      if (score > 40) return 'text-yellow-500';
      if (score > 20) return 'text-orange-500';
      return 'text-red-500';
    };
    
    // 비용 절감 팁
    const adTips = generateAdTips(data);
  
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">광고 인사이트</CardTitle>
          <CardDescription>검색광고 성과 및 경쟁 지표</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">광고 효율 점수</div>
              <div className={`text-xl font-bold ${getEfficiencyColor(efficiencyScore)}`}>
                {efficiencyScore}점
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">권장 입찰가</div>
              <div className="text-xl font-bold">
                {data.adRecommendations && data.adRecommendations.length > 0 
                  ? `${formatCurrency(data.adRecommendations[1]?.bid || data.avgCpc)}원`
                  : `${formatCurrency(data.avgCpc * 0.8)}원`
                }
              </div>
            </div>
          </div>
          
          {/* 비용 절감 팁 */}
          <div className="mb-4 border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-2">광고 최적화 팁</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {adTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
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
                      <th className="text-right py-2">월 비용</th>
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
                        <td className="text-right py-2">{formatCurrency(bid.cost / 10000)}만원</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * 예상치는 실제 광고 성과와 다를 수 있으며, 시장 상황에 따라 변동될 수 있습니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // 상위 상품 표시 컴포넌트
  const TopProductsCard = ({ data }: { data: KeywordSearchResult }) => {
    // 평균 가격 대비 가격 평가
    const getPriceEvaluation = (price: number): { text: string; color: string } => {
      const avgPrice = data.averagePrice;
      const ratio = price / avgPrice;
      
      if (ratio < 0.7) return { text: '저가', color: 'text-green-500' };
      if (ratio < 0.9) return { text: '평균 이하', color: 'text-green-400' };
      if (ratio < 1.1) return { text: '평균', color: 'text-blue-500' };
      if (ratio < 1.3) return { text: '평균 이상', color: 'text-yellow-500' };
      return { text: '고가', color: 'text-orange-500' };
    };
    
    // 가격/리뷰 효율 점수 계산 (낮은 가격 + 많은 리뷰 = 높은 점수)
    const getEfficiencyScore = (price: number, reviewCount: number): number => {
      const avgPrice = data.averagePrice;
      const priceScore = Math.min(1, avgPrice / (price || 1)); // 가격이 낮을수록 높은 점수
      const reviewScore = Math.min(1, Math.log10(reviewCount + 1) / 3); // 리뷰가 많을수록 높은 점수
      
      return Math.round((priceScore * 0.6 + reviewScore * 0.4) * 100);
    };
    
    // 랭킹 변화 표시 컴포넌트
    const RankBadge = ({ rank }: { rank: number }) => {
      let color = 'bg-blue-100 text-blue-800';
      let text = `${rank}위`;
      
      if (rank <= 3) {
        color = 'bg-green-100 text-green-800 font-medium';
      } else if (rank <= 10) {
        color = 'bg-yellow-100 text-yellow-800';
      }
      
      return (
        <span className={`text-xs px-2 py-0.5 rounded ${color}`}>
          {text}
        </span>
      );
    };
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">상위 상품</CardTitle>
              <CardDescription>상위 노출되는 인기 상품</CardDescription>
            </div>
            <div className="text-sm">
              평균가: <span className="font-medium">{formatCurrency(data.averagePrice)}원</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 요약 정보 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">브랜드 분포</div>
              <div className="text-sm">
                {Array.from(new Set(data.products.slice(0, 10).map(p => p.brandName)))
                  .filter(Boolean)
                  .slice(0, 3)
                  .join(', ')} 외
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">가격대</div>
              <div className="text-sm">
                {formatCurrency(Math.min(...data.products.map(p => p.price)))}원 ~ 
                {formatCurrency(Math.max(...data.products.map(p => p.price)))}원
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">리뷰 수</div>
              <div className="text-sm">
                평균 {formatNumber(Math.round(data.products.reduce((sum, p) => sum + p.reviewCount, 0) / data.products.length))}개
              </div>
            </div>
          </div>
        
          {/* 상품 목록 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.products.slice(0, 6).map((product) => {
              const priceEval = getPriceEvaluation(product.price);
              const effScore = getEfficiencyScore(product.price, product.reviewCount);
              
              return (
                <div 
                  key={product.productId} 
                  className="border rounded-lg p-3 hover:border-primary cursor-pointer relative"
                  onClick={() => window.open(product.productUrl, '_blank')}
                >
                  {/* 랭킹 표시 */}
                  <div className="absolute top-2 right-2 z-10">
                    <RankBadge rank={product.rank} />
                  </div>
                  
                  <div className="aspect-square w-full overflow-hidden mb-2 flex items-center justify-center">
                    <img 
                      src={product.image} 
                      alt={product.title} 
                      className="h-full w-auto object-contain"
                    />
                  </div>
                  <div className="line-clamp-2 text-sm h-10">{product.title}</div>
                  <div className="flex justify-between mt-2 items-end">
                    <div>
                      <span className="text-xs text-muted-foreground block">{product.brandName || '일반 브랜드'}</span>
                      <span className="text-xs block mt-0.5">
                        리뷰 <span className="font-medium">{formatNumber(product.reviewCount)}</span>개
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium block">{formatCurrency(product.price)}원</span>
                      <span className={`text-xs ${priceEval.color} block`}>{priceEval.text}</span>
                    </div>
                  </div>
                  
                  {/* 효율 점수 (가격/리뷰 기반) */}
                  <div className="mt-2 pt-2 border-t flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">가격/리뷰 효율</span>
                    <div className="flex items-center">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full mr-1">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${effScore}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">{effScore}점</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };
  
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