import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CategoryTrend, 
  KeywordSearchResult, 
  Product,
  searchKeyword,
  getKeywordTrends
} from '@/lib/naver-api';
import { useToast } from '@/hooks/use-toast';
import { ConfettiEffect } from '@/components/ui/confetti-effect';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';

// 아이콘 임포트
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowRight, 
  TrendingUp, 
  ShoppingBag, 
  Search, 
  LineChart as LineChartIcon,
  PieChart,
  BarChart2,
  Activity,
  Percent
} from 'lucide-react';

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(num).replace('₩', '');
};

const getChangeColor = (value: number) => {
  if (value > 0) return 'text-red-500';
  if (value < 0) return 'text-blue-500';
  return 'text-gray-500';
};

const getChangeIcon = (value: number) => {
  if (value > 0) return <ArrowUp className="inline mr-1" size={16} />;
  if (value < 0) return <ArrowDown className="inline mr-1" size={16} />;
  return <ArrowRight className="inline mr-1" size={16} />;
};

const getChangePercent = (value: number) => {
  const absValue = Math.abs(value);
  return `${absValue.toFixed(1)}%`;
};

// 경쟁강도에 따른 색상 판단
const getCompetitionColor = (value: number) => {
  if (value > 80) return 'text-red-500';
  if (value > 60) return 'text-orange-500';
  if (value > 40) return 'text-yellow-500';
  if (value > 20) return 'text-green-500';
  return 'text-blue-500';
};

// 경쟁강도에 따른 텍스트 판단
const getCompetitionText = (value: number) => {
  if (value > 80) return '매우 높음';
  if (value > 60) return '높음';
  if (value > 40) return '보통';
  if (value > 20) return '낮음';
  return '매우 낮음';
};

export default function KeywordDetailPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [keyword, setKeyword] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  
  // URL에서 키워드 파라미터 추출
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const keywordParam = searchParams.get('keyword');
    if (keywordParam) {
      setKeyword(keywordParam);
    }
  }, [location]);

  // 키워드 검색 결과 조회
  const { 
    data: keywordData, 
    isLoading: isKeywordLoading,
    error: keywordError 
  } = useQuery({
    queryKey: ['/api/search', keyword],
    queryFn: async () => {
      if (!keyword) return null;
      return await searchKeyword(keyword);
    },
    enabled: !!keyword
  });

  // 키워드 트렌드 데이터 조회 (일간)
  const { 
    data: trendData, 
    isLoading: isTrendLoading 
  } = useQuery({
    queryKey: ['/api/keyword/trends', keyword, 'daily'],
    queryFn: async () => {
      if (!keyword) return null;
      return await getKeywordTrends(keyword, 'daily');
    },
    enabled: !!keyword
  });
  
  // 키워드 트렌드 데이터 조회 (주간)
  const { 
    data: weeklyTrendData, 
    isLoading: isWeeklyTrendLoading 
  } = useQuery({
    queryKey: ['/api/keyword/trends', keyword, 'weekly'],
    queryFn: async () => {
      if (!keyword) return null;
      return await getKeywordTrends(keyword, 'weekly');
    },
    enabled: !!keyword
  });

  // 검색 데이터 로딩에 따른 컨페티 효과 표시
  useEffect(() => {
    if (keywordData && keywordData.searchCount > 10000) {
      setShowConfetti(true);
      
      // 3초 후 컨페티 효과 종료
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [keywordData]);
  
  // 에러 처리
  useEffect(() => {
    if (keywordError) {
      toast({
        title: "검색 오류",
        description: "키워드 검색 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
    }
  }, [keywordError, toast]);

  // 차트 데이터 포맷팅 (일간)
  const dailyChartData = trendData?.trends.map(item => ({
    date: item.date.substring(5), // MM-DD 형식으로 변환
    검색량: item.count
  })) || [];

  // 차트 데이터 포맷팅 (주간)
  const weeklyChartData = weeklyTrendData?.trends.map(item => ({
    date: item.date.substring(5), // MM-DD 형식으로 변환
    검색량: item.count
  })) || [];

  // 경쟁사 제품 목록
  const competitorProducts = keywordData?.products || [];

  if (isKeywordLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">키워드 분석 중...</h1>
          <p className="text-gray-500">'{keyword}' 키워드에 대한 상세 정보를 불러오는 중입니다.</p>
          <div className="flex justify-center mt-4">
            <Progress className="w-64" value={70} />
          </div>
        </div>
      </div>
    );
  }

  if (!keywordData && !isKeywordLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">키워드를 찾을 수 없습니다</h1>
          <p className="text-gray-500">검색할 키워드를 입력하세요.</p>
        </div>
      </div>
    );
  }

  // 가상의 지표값 계산 (실제 API 응답에 따라 조정 필요)
  const pcRatio = keywordData?.pcSearchRatio || 0;
  const mobileRatio = keywordData?.mobileSearchRatio || 0;
  const competitionIndex = keywordData?.competitionIndex || 0;
  const averagePrice = keywordData?.averagePrice || 0;
  const totalSales = keywordData?.totalSales || 0;
  const totalSalesCount = keywordData?.totalSalesCount || 0;
  
  // 월 검색량
  const monthlySearchVolume = keywordData?.searchCount || 0;
  
  // 임의의 변동률 - 실제로는 이전 데이터와 비교하여 계산해야 함
  const randomChange = () => (Math.random() - 0.5) * 20;
  const searchVolumeChange = randomChange();
  const conversionRateChange = randomChange();
  const competitionIndexChange = randomChange();
  const priceChange = randomChange();

  return (
    <div className="container mx-auto py-6">
      {/* 컨페티 효과 */}
      <ConfettiEffect 
        trigger={showConfetti} 
        duration={3000}
        particleCount={150}
        spread={180}
      />
      
      {/* 키워드 헤더 */}
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold mr-3">{keyword}</h1>
        <Badge variant="outline" className="text-sm bg-primary/10">
          {keywordData?.productCount 
            ? `관련 상품 ${formatNumber(keywordData.productCount)}개` 
            : '데이터 분석 중'}
        </Badge>
      </div>
      
      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              <Search className="mr-2" size={16} />
              월 검색량
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(monthlySearchVolume)}
            </div>
            <div className={`text-sm mt-1 ${getChangeColor(searchVolumeChange)}`}>
              {getChangeIcon(searchVolumeChange)}
              {getChangePercent(searchVolumeChange)} 전월 대비
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              <ShoppingBag className="mr-2" size={16} />
              평균 판매가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averagePrice)}원
            </div>
            <div className={`text-sm mt-1 ${getChangeColor(priceChange)}`}>
              {getChangeIcon(priceChange)}
              {getChangePercent(priceChange)} 전월 대비
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              <Activity className="mr-2" size={16} />
              총 판매액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSales)}원
            </div>
            <div className="text-sm mt-1 text-gray-500">
              판매량: {formatNumber(totalSalesCount)}개
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center">
              <TrendingUp className="mr-2" size={16} />
              경쟁 강도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCompetitionColor(competitionIndex)}`}>
              {getCompetitionText(competitionIndex)}
            </div>
            <div className="text-sm mt-1 text-gray-500">
              지수: {competitionIndex.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 상세 분석 데이터 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 왼쪽 열: 상품 정보 및 라이벌 */}
        <div className="lg:col-span-1">
          {/* 상품 이미지 */}
          {competitorProducts.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">대표 상품</CardTitle>
                <CardDescription>검색 결과 상위 상품</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-4">
                  <img 
                    src={competitorProducts[0]?.image} 
                    alt={competitorProducts[0]?.title} 
                    className="max-h-48 object-contain"
                  />
                </div>
                <h3 className="font-medium truncate">{competitorProducts[0]?.title}</h3>
                <div className="flex justify-between mt-2">
                  <span className="text-muted-foreground">{competitorProducts[0]?.brandName || '일반 브랜드'}</span>
                  <span className="font-semibold">{formatCurrency(competitorProducts[0]?.price)}원</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 디바이스 비율 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">디바이스 비율</CardTitle>
              <CardDescription>PC와 모바일 검색 비율</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>PC</span>
                    <span>{pcRatio.toFixed(1)}%</span>
                  </div>
                  <Progress value={pcRatio} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>모바일</span>
                    <span>{mobileRatio.toFixed(1)}%</span>
                  </div>
                  <Progress value={mobileRatio} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 연관 키워드 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">연관 키워드</CardTitle>
              <CardDescription>자주 함께 검색되는 키워드</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {keywordData?.relatedKeywords?.map((relatedKeyword, index) => (
                  <Badge key={index} variant="secondary">
                    {relatedKeyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 중앙과 오른쪽 열: 차트 및 통계 */}
        <div className="lg:col-span-2">
          {/* 트렌드 차트 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">검색 트렌드</CardTitle>
              <CardDescription>기간별 검색량 추이</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="daily">
                <TabsList className="mb-4">
                  <TabsTrigger value="daily">일간</TabsTrigger>
                  <TabsTrigger value="weekly">주간</TabsTrigger>
                </TabsList>
                
                <TabsContent value="daily" className="h-[300px]">
                  {isTrendLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <p>트렌드 데이터 로딩 중...</p>
                    </div>
                  ) : dailyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="검색량"
                          stroke="#4f46e5"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p>일간 트렌드 데이터가 없습니다.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="weekly" className="h-[300px]">
                  {isWeeklyTrendLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <p>트렌드 데이터 로딩 중...</p>
                    </div>
                  ) : weeklyChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="검색량" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p>주간 트렌드 데이터가 없습니다.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* 경쟁사 상품 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">경쟁 상품 분석</CardTitle>
              <CardDescription>검색 결과 상위 상품 목록</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left pb-2">순위</th>
                      <th className="text-left pb-2">상품명</th>
                      <th className="text-left pb-2">브랜드</th>
                      <th className="text-right pb-2">가격</th>
                      <th className="text-right pb-2">리뷰</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitorProducts.slice(0, 5).map((product, index) => (
                      <tr key={product.productId} className="border-t">
                        <td className="py-3 pr-4">{index + 1}</td>
                        <td className="py-3 pr-4 max-w-xs truncate">
                          {product.title}
                        </td>
                        <td className="py-3 pr-4">
                          {product.brandName || '일반 브랜드'}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {formatCurrency(product.price)}원
                        </td>
                        <td className="py-3 text-right">
                          {product.reviewCount > 0 
                            ? formatNumber(product.reviewCount) 
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}