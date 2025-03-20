import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  searchKeyword, 
  getKeywordAnalysis,
  KeywordSearchResult,
  KeywordAnalysis,
  KeywordTrend,
  getKeywordTrends
} from '@/lib/naver-api';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ProductSearchResults from '@/components/dashboard/ProductSearchResults';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Info,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  DollarSign,
  LineChart,
  Percent,
  CircleAlert,
  CircleCheck,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle
} from 'lucide-react';

export default function KeywordDetailPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  
  // URL에서 키워드 파라미터 가져오기
  useEffect(() => {
    const path = window.location.pathname;
    const keyword = path.substring(path.lastIndexOf('/') + 1);
    
    if (keyword) {
      const decodedKeyword = decodeURIComponent(keyword);
      setSearchTerm(decodedKeyword);
    }
  }, []);
  
  // 키워드 검색 결과 쿼리
  const { 
    data: keywordData, 
    isLoading: isKeywordLoading 
  } = useQuery({
    queryKey: ['/api/search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return null;
      return await searchKeyword(searchTerm);
    },
    enabled: !!searchTerm
  });
  
  // 키워드 분석 데이터 쿼리 (검색광고 API)
  const { 
    data: adData, 
    isLoading: isAdDataLoading 
  } = useQuery({
    queryKey: ['/api/keyword/analysis', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return null;
      try {
        return await getKeywordAnalysis(searchTerm);
      } catch (error) {
        console.error('광고 데이터 로딩 실패:', error);
        return null;
      }
    },
    enabled: !!searchTerm
  });
  
  // 키워드 트렌드 데이터 쿼리
  const { 
    data: trendData, 
    isLoading: isTrendDataLoading 
  } = useQuery({
    queryKey: ['/api/keyword/trends', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return null;
      try {
        return await getKeywordTrends(searchTerm, 'daily');
      } catch (error) {
        console.error('트렌드 데이터 로딩 실패:', error);
        return null;
      }
    },
    enabled: !!searchTerm
  });
  
  // 로딩 상태 확인
  const isLoading = isKeywordLoading || isAdDataLoading || isTrendDataLoading;
  
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
    if (value > 75) return '매우 높음';
    if (value > 50) return '높음';
    if (value > 30) return '보통';
    if (value > 15) return '낮음';
    return '매우 낮음';
  };
  
  // 경쟁도 색상
  const getCompetitionColor = (value: number) => {
    if (value > 75) return 'text-red-500';
    if (value > 50) return 'text-orange-500';
    if (value > 30) return 'text-yellow-500';
    if (value > 15) return 'text-green-500';
    return 'text-blue-500';
  };
  
  // 경쟁도 배지 색상
  const getCompetitionBadgeColor = (value: number) => {
    if (value > 75) return 'bg-red-100 text-red-800';
    if (value > 50) return 'bg-orange-100 text-orange-800';
    if (value > 30) return 'bg-yellow-100 text-yellow-800';
    if (value > 15) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };
  
  // 지표 상태에 따른 배지 색상
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case '매우높음':
      case '매우좋음':
        return 'bg-blue-100 text-blue-800';
      case '높음':
      case '좋음':
        return 'bg-green-100 text-green-800';
      case '보통':
        return 'bg-yellow-100 text-yellow-800';
      case '낮음':
      case '나쁨':
        return 'bg-orange-100 text-orange-800';
      case '매우낮음':
      case '매우나쁨':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 숫자 변화 표시 (상승/하락)
  const renderTrend = (value: number, type: 'positive' | 'negative' = 'positive') => {
    const isPositive = value > 0;
    const color = type === 'positive' 
      ? (isPositive ? 'text-green-500' : 'text-red-500')
      : (isPositive ? 'text-red-500' : 'text-green-500');
      
    return (
      <span className={`flex items-center ${color}`}>
        {isPositive ? 
          <ArrowUpRight className="w-4 h-4 mr-1" /> : 
          <ArrowDownRight className="w-4 h-4 mr-1" />
        }
        {Math.abs(value)}%
      </span>
    );
  };
  
  // 로딩 중 스켈레톤 컴포넌트
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-32 w-32" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      
      <Skeleton className="h-64 w-full" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
  
  // 데이터가 없는 경우
  if (!isLoading && (!keywordData || !adData)) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>데이터를 찾을 수 없습니다</CardTitle>
          </CardHeader>
          <CardContent>
            <p>'{searchTerm}' 키워드에 대한 분석 데이터를 찾을 수 없습니다.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setLocation('/')}
            >
              <ChevronsLeft className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      {/* 상단 네비게이션 */}
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.history.back()}
        >
          <ChevronsLeft className="mr-2 h-4 w-4" />
          뒤로 가기
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            다른 키워드 검색
          </Button>
          <Button size="sm">
            트렌드 분석
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <LoadingSkeleton />
      ) : keywordData && adData ? (
        <>
          {/* 키워드 기본 정보 */}
          <div className="mb-8 flex items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold">{keywordData.keyword}</h1>
                <Badge 
                  className={getCompetitionBadgeColor(keywordData.competitionIndex)}
                >
                  {getCompetitionText(keywordData.competitionIndex)}
                </Badge>
              </div>
              <div className="text-muted-foreground mb-4 flex items-center gap-2">
                실시간 &gt; 건강식품 &gt; 영양제 &gt; <span className="font-medium">{keywordData.keyword} (100%)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywordData.relatedKeywords.slice(0, 5).map((kw, i) => (
                  <Badge variant="outline" key={i}>{kw}</Badge>
                ))}
                {keywordData.relatedKeywords.length > 5 && (
                  <Badge variant="outline">+{keywordData.relatedKeywords.length - 5}개</Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* 키워드 통계 요약 - 첫 번째 줄 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-muted-foreground">상품수</div>
                <div className="text-2xl font-bold">{formatNumber(keywordData.productCount)} 개</div>
                <div className="flex justify-between mt-2">
                  <div className="text-sm text-muted-foreground">월 평균 가격</div>
                  <div className="text-sm font-medium">{formatCurrency(keywordData.averagePrice)} 원</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-muted-foreground">Top 40</div>
                <div className="text-2xl font-bold">6개월 매출</div>
                <div className="flex justify-between mt-2">
                  <div className="text-sm">12 억원</div>
                  <div className="text-sm">6개월 판매량 27,257 개</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-muted-foreground">Top 80</div>
                <div className="text-2xl font-bold">6개월 매출</div>
                <div className="flex justify-between mt-2">
                  <div className="text-sm">122 억원</div>
                  <div className="text-sm">6개월 판매량 252,905 개</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-muted-foreground">연관 키워드</div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <div className="text-sm text-muted-foreground">검색수</div>
                    <div className="text-base font-medium">480</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">상품수</div>
                    <div className="text-base font-medium">1,085</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">출시일평균</div>
                    <div className="text-base font-medium">320</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">정가상품평균</div>
                    <div className="text-base font-medium">1,260</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 주요 지표 카드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* 1. 종합 섹션 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-green-500">
                  <LineChart className="w-5 h-5 mr-2" />
                  종합
                </CardTitle>
                <CardDescription>시장 총괄지표</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">경쟁강도</span>
                      <span className="text-sm bg-green-100 text-green-800 px-2 rounded-full">낮음</span>
                    </div>
                    <div className="text-2xl font-bold">3.23</div>
                    <div className="text-xs text-muted-foreground">
                      상품수 {formatNumber(keywordData.productCount)}개<br />
                      월 검색수 {formatNumber(keywordData.searchCount)}회
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs">실거래상품 비율</span>
                      </div>
                      <div className="text-lg font-bold text-green-500">68%</div>
                      <Badge className="bg-green-100 text-green-800 font-normal">좋음</Badge>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs">정품상품 비율</span>
                      </div>
                      <div className="text-lg font-bold text-orange-500">70%</div>
                      <Badge className="bg-orange-100 text-orange-800 font-normal">보통</Badge>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs">해외상품 비율</span>
                      </div>
                      <div className="text-lg font-bold text-blue-500">3%</div>
                      <Badge className="bg-blue-100 text-blue-800 font-normal">매우낮음</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">1년 내 제시 비율</span>
                    </div>
                    <div className="text-lg font-bold text-orange-500">25%</div>
                    <Badge className="bg-orange-100 text-orange-800 font-normal">보통</Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      1개월 내 6개월 8%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 2. 나쁨 섹션 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-yellow-500">
                  <DollarSign className="w-5 h-5 mr-2" />
                  나쁨
                </CardTitle>
                <CardDescription>광고 효율지표</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">광고클릭률</span>
                      </div>
                      <div className="text-2xl font-bold">1.19%</div>
                      <Badge className="bg-yellow-100 text-yellow-800 font-normal">보통</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        PC 0.35%<br />
                        MOBILE 1.41%
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">클릭경쟁도</span>
                      </div>
                      <div className="text-2xl font-bold">290.85</div>
                      <Badge className="bg-orange-100 text-orange-800 font-normal">나쁨</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        상품수 {formatNumber(keywordData.productCount)}개<br />
                        검색수 850회
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">키워드비 광고비</span>
                      </div>
                      <div className="text-2xl font-bold">0.158</div>
                      <Badge className="bg-orange-100 text-orange-800 font-normal">나쁨</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        광고비 6,232원<br />
                        클릭수 39,375회
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">클릭대비 광고비</span>
                      </div>
                      <div className="text-2xl font-bold">7.33</div>
                      <Badge className="bg-orange-100 text-orange-800 font-normal">나쁨</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        광고비 6,232원<br />
                        클릭수 850회
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 3. 아주좋음 섹션 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-blue-500">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  아주좋음
                </CardTitle>
                <CardDescription>구매 성장지표</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">구매 경쟁강도</span>
                      </div>
                      <div className="text-2xl font-bold">0.50</div>
                      <Badge className="bg-blue-100 text-blue-800 font-normal">매우좋음</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        구매 상품수 38,340개<br />
                        월 검색수 {formatNumber(keywordData.searchCount)}회
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">로켓상품 비율</span>
                      </div>
                      <div className="text-2xl font-bold">52.78%</div>
                      <Badge className="bg-yellow-100 text-yellow-800 font-normal">보통</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">제한상품 비율</span>
                      </div>
                      <div className="text-2xl font-bold">9.72%</div>
                      <Badge className="bg-blue-100 text-blue-800 font-normal">매우좋음</Badge>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">광고 권장가</span>
                      </div>
                      <div className="text-2xl font-bold">29,827원</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">광고 입찰</span>
                    </div>
                    <div className="text-2xl font-bold">20,162원</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 소팔성 섹션 */}
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-green-500">
                <Percent className="w-5 h-5 mr-2" />
                소팔성
              </CardTitle>
              <CardDescription>키워드 판매 점수</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>색상</span>
                    <span className="font-medium">1위</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="px-3 py-0.5">소형</Badge>
                    <Badge variant="outline" className="px-3 py-0.5">빨사과</Badge>
                    <Badge variant="outline" className="px-3 py-0.5">블랙</Badge>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>특징</span>
                    <span className="font-medium">1위</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="px-3 py-0.5">소형</Badge>
                    <Badge variant="outline" className="px-3 py-0.5">블루라이트</Badge>
                    <Badge variant="outline" className="px-3 py-0.5">카로티노이드</Badge>
                    <Badge variant="outline" className="px-3 py-0.5">이뇨작용</Badge>
                    <Badge variant="outline" className="px-3 py-0.5">창문형</Badge>
                    <Badge variant="outline" className="px-3 py-0.5">홀줄무늬</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 상품 분석 및 추천 상품 */}
          <div className="mb-6">
            <Tabs defaultValue="products">
              <TabsList className="mb-4">
                <TabsTrigger value="products">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  인기 상품 분석
                </TabsTrigger>
                <TabsTrigger value="recommendations">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  추천 상품
                </TabsTrigger>
                <TabsTrigger value="competitors">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  경쟁 브랜드
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="products">
                <ProductSearchResults 
                  products={keywordData.products.slice(0, 10)} 
                  title={`네이버 쇼핑 인기 상품 - ${keywordData.keyword}`}
                />
              </TabsContent>
              
              <TabsContent value="recommendations">
                <Card>
                  <CardContent className="p-6">
                    <p>추천 상품 목록이 준비되지 않았습니다.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="competitors">
                <Card>
                  <CardContent className="p-6">
                    <p>경쟁 브랜드 분석이 준비되지 않았습니다.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* 연관 키워드 리스트 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>연관 키워드</CardTitle>
              <CardDescription>이 키워드와 함께 많이 검색되는 키워드</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {keywordData.relatedKeywords.slice(0, 16).map((keyword, idx) => (
                  <div key={idx} className="group flex justify-between items-center p-2 hover:bg-muted rounded cursor-pointer">
                    <span>{keyword}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}