/**
 * ML 분석 패널 컴포넌트
 * 
 * 머신러닝 분석 결과를 시각화하는 대시보드 패널
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { BarChart, PieChart, LineChart } from 'recharts';
import { Bar, Pie, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Zap, Target, Award, AlertTriangle } from 'lucide-react';
import { SearchVolumeForecast, SuccessProbability, getMLAnalysis, MLAnalysisResult } from '@/lib/naver-api';
import { ConfettiEffect } from '@/components/ui/confetti-effect';

interface MLAnalysisPanelProps {
  keyword: string;
  onLoad?: (data: MLAnalysisResult) => void;
}

export default function MLAnalysisPanel({ keyword, onLoad }: MLAnalysisPanelProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mlData, setMlData] = useState<MLAnalysisResult | null>(null);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  useEffect(() => {
    if (!keyword) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getMLAnalysis(keyword);
        setMlData(data);
        
        // 성공 확률이 높은 경우 축하 효과 표시
        if (data?.ml_analysis?.success_probability?.score >= 80) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
        
        if (onLoad) onLoad(data);
      } catch (error) {
        console.error('ML 분석 데이터 로드 실패:', error);
        setError('머신러닝 분석 결과를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [keyword, onLoad]);

  // 파이 차트 색상
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const renderSuccessProbability = () => {
    if (!mlData || !mlData.ml_analysis?.success_probability) return null;
    
    const { score = 0, important_factors = [] } = mlData.ml_analysis.success_probability || {};
    
    let scoreCategory = '낮음';
    let scoreColor = 'bg-red-600';
    let scoreText = '낮음';
    let scoreIcon = <AlertTriangle className="h-5 w-5" />;
    
    if (score && score >= 80) {
      scoreCategory = 'high';
      scoreColor = 'bg-green-600';
      scoreText = '매우 높음';
      scoreIcon = <Award className="h-5 w-5" />;
    } else if (score && score >= 60) {
      scoreCategory = 'medium-high';
      scoreColor = 'bg-green-500';
      scoreText = '높음';
      scoreIcon = <TrendingUp className="h-5 w-5" />;
    } else if (score && score >= 40) {
      scoreCategory = 'medium';
      scoreColor = 'bg-yellow-500';
      scoreText = '보통';
      scoreIcon = <Target className="h-5 w-5" />;
    } else if (score && score >= 20) {
      scoreCategory = 'medium-low';
      scoreColor = 'bg-red-400';
      scoreText = '다소 낮음';
      scoreIcon = <TrendingDown className="h-5 w-5" />;
    }

    // 요인 데이터 준비
    const factorsData = important_factors?.map(factor => ({
      name: factor.factor || '',
      value: Math.round((factor.importance || 0) * 100)
    })) || [];

    return (
      <div className="space-y-6">
        {/* 성공 점수 표시 */}
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm text-gray-500">성공 확률 점수</div>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold">{score}</span>
            <Badge className={`px-3 py-1 ${scoreCategory === 'high' ? 'bg-green-600' : scoreCategory === 'medium-high' ? 'bg-green-500' : scoreCategory === 'medium' ? 'bg-yellow-500' : scoreCategory === 'medium-low' ? 'bg-orange-500' : 'bg-red-600'}`}>
              {scoreText}
            </Badge>
          </div>
          <Progress className="h-2 w-full max-w-md" value={score} />
        </div>
        
        {/* 성공 요인 분석 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">주요 성공 요인</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-gray-50">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={factorsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {factorsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {important_factors?.map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm">{factor?.factor || ''}</span>
                  </div>
                  <span className="text-sm font-medium">{Math.round((factor?.importance || 0) * 100)}%</span>
                </div>
              )) || null}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSearchForecast = () => {
    if (!mlData || !mlData.ml_analysis?.search_forecast) return null;
    
    const { search_forecast = [] } = mlData.ml_analysis;
    
    // 차트 데이터 준비
    const chartData = search_forecast?.map(item => ({
      name: `${item?.month || 0}개월 후`,
      예측치: Math.round(item?.forecast || 0),
      최소: Math.round(item?.lower || 0),
      최대: Math.round(item?.upper || 0)
    })) || [];
    
    const currentValue = chartData[0]?.예측치 || 0;
    const lastValue = chartData[chartData.length - 1]?.예측치 || 0;
    const growthRate = currentValue > 0 ? ((lastValue - currentValue) / currentValue) * 100 : 0;
    const isGrowing = growthRate > 0;

    return (
      <div className="space-y-6">
        {/* 성장률 표시 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">예상 성장률 (6개월)</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{growthRate.toFixed(1)}%</span>
              <Badge className={`${isGrowing ? 'bg-green-600' : 'bg-red-600'}`}>
                {isGrowing ? '상승' : '하락'} 추세
              </Badge>
            </div>
          </div>
          <div className={`p-2 rounded-full ${isGrowing ? 'bg-green-100' : 'bg-red-100'}`}>
            {isGrowing ? <TrendingUp className="h-6 w-6 text-green-600" /> : <TrendingDown className="h-6 w-6 text-red-600" />}
          </div>
        </div>
        
        {/* 검색량 예측 차트 */}
        <div className="border rounded-lg p-4 bg-gray-50 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="예측치" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="최소" stroke="#82ca9d" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="최대" stroke="#ff7300" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>머신러닝 분석</CardTitle>
          <CardDescription>AI 기반 키워드 미래 예측 분석</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-gray-500">머신러닝 분석 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>머신러닝 분석</CardTitle>
          <CardDescription>AI 기반 키워드 미래 예측 분석</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <p className="text-sm text-gray-500">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium"
              onClick={() => window.location.reload()}
            >
              다시 시도
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 키워드 의미 분석 렌더링
  const renderKeywordMeaning = () => {
    if (!mlData || !mlData.ml_analysis?.keyword_meaning) return null;
    
    const { keyword_meaning } = mlData.ml_analysis;
    
    return (
      <div className="space-y-6">
        {/* 추출된 명사 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">핵심 명사</h4>
          <div className="flex flex-wrap gap-2">
            {keyword_meaning.nouns.map((noun, index) => (
              <Badge key={index} variant="outline" className="px-3 py-1 bg-slate-50">
                {noun}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* 카테고리 분류 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">의미 카테고리</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyword_meaning.categories.map((category, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{category.category}</span>
                  <Badge>{category.score} 점</Badge>
                </div>
                <div className="text-sm text-gray-500">관련 단어:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {category.matches.map((match, idx) => (
                    <Badge key={idx} variant="outline" className="bg-white">
                      {match}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 검색 의도 */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-medium mb-2">사용자 검색 의도</h4>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{keyword_meaning.intent.intent}</span>
              <Badge>{keyword_meaning.intent.score} 점</Badge>
            </div>
          </div>
          {keyword_meaning.intent.matches.length > 0 && (
            <div>
              <span className="text-sm text-gray-500">의도 관련 단어:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {keyword_meaning.intent.matches.map((match, idx) => (
                  <Badge key={idx} variant="outline" className="bg-white">
                    {match}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* 감성 분석 */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-medium mb-2">키워드 감성 분석</h4>
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {keyword_meaning.sentiment.sentiment}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                <span className="text-sm">긍정: {keyword_meaning.sentiment.positive_score}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <span className="text-sm">부정: {keyword_meaning.sentiment.negative_score}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // 의미적 연관 키워드 렌더링
  const renderSemanticKeywords = () => {
    if (!mlData || !mlData.ml_analysis?.semantic_related_keywords) return null;
    
    const { semantic_related_keywords } = mlData.ml_analysis;
    
    return (
      <div className="space-y-6">
        <h4 className="text-sm font-medium">의미적 연관 키워드</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {semantic_related_keywords.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">{item.keyword}</div>
                <Badge variant="outline">
                  유사도: {(item.similarity * 100).toFixed(0)}%
                </Badge>
              </div>
              
              {/* 진행률 표시 */}
              <Progress value={item.similarity * 100} className="h-1 mb-3" />
              
              {/* 대표 제품 정보 - 있을 경우 표시 */}
              {item.representativeProduct && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-500 mb-2">대표 제품:</div>
                  <div className="flex gap-3">
                    {/* 제품 이미지 */}
                    <div className="flex-shrink-0">
                      {item.representativeProduct.image && (
                        <img 
                          src={item.representativeProduct.image} 
                          alt={item.representativeProduct.name}
                          className="w-16 h-16 object-cover rounded border border-gray-200"
                          onError={(e) => {
                            // 이미지 로드 실패 시 기본 이미지로 대체
                            (e.target as HTMLImageElement).src = '/placeholder-product.png';
                          }}
                        />
                      )}
                    </div>
                    
                    {/* 제품 상세 정보 */}
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">{item.representativeProduct.name}</div>
                      <div className="text-sm text-gray-700">
                        {item.representativeProduct.price.toLocaleString('ko-KR')}원
                      </div>
                      {item.representativeProduct.url && (
                        <a 
                          href={item.representativeProduct.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-xs text-blue-600 hover:underline inline-block"
                        >
                          제품 상세 보기
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // 시장 세그먼트 렌더링
  const renderMarketSegments = () => {
    if (!mlData || !mlData.ml_analysis?.market_segments) return null;
    
    const { market_segments } = mlData.ml_analysis;
    
    const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-amber-100', 'bg-pink-100'];
    
    return (
      <div className="space-y-6">
        <h4 className="text-sm font-medium">시장 세그먼트 분석</h4>
        <div className="grid grid-cols-1 gap-4">
          {market_segments.map((segment, index) => (
            <div key={index} className={`border rounded-lg p-4 ${colors[index % colors.length]}`}>
              <div className="font-medium mb-2">세그먼트 {index + 1}: {segment.label}</div>
              <div className="flex flex-wrap gap-2 mt-3">
                {segment.keywords.map((kw, idx) => (
                  <Badge key={idx} variant="outline" className="bg-white">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>머신러닝 분석</CardTitle>
            <CardDescription>AI 기반 키워드 미래 예측 및 의미 분석</CardDescription>
          </div>
          {mlData?.ml_analysis?.success_probability?.score && mlData.ml_analysis.success_probability.score >= 80 && (
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-700">
              <Zap className="h-4 w-4 mr-1" /> 고성능 키워드
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="success" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="success">성공 확률</TabsTrigger>
            <TabsTrigger value="forecast">검색량 예측</TabsTrigger>
            <TabsTrigger value="meaning">의미 분석</TabsTrigger>
            <TabsTrigger value="semantic">연관 키워드</TabsTrigger>
            <TabsTrigger value="segments">세그먼트</TabsTrigger>
          </TabsList>
          <TabsContent value="success" className="py-4">
            {renderSuccessProbability()}
          </TabsContent>
          <TabsContent value="forecast" className="py-4">
            {renderSearchForecast()}
          </TabsContent>
          <TabsContent value="meaning" className="py-4">
            {renderKeywordMeaning()}
          </TabsContent>
          <TabsContent value="semantic" className="py-4">
            {renderSemanticKeywords()}
          </TabsContent>
          <TabsContent value="segments" className="py-4">
            {renderMarketSegments()}
          </TabsContent>
        </Tabs>
        
        <Separator className="my-6" />
        
        <div className="text-xs text-gray-500 flex items-center justify-between">
          <div>분석 시간: {new Date(mlData?.timestamp || Date.now()).toLocaleString()}</div>
          <div className="flex items-center">
            <span>AI 기반 예측</span>
            <Zap className="h-3 w-3 ml-1 text-amber-500" />
          </div>
        </div>
      </CardContent>
      
      {/* 축하 효과 */}
      <ConfettiEffect 
        trigger={showConfetti} 
        duration={3000}
        particleCount={100}
        spread={120}
        origin={{ x: 0.5, y: 0.3 }}
      />
    </Card>
  );
}

// 차트 색상
const COLORS = ['#8884d8', '#82ca9d', '#FFBB28', '#FF8042', '#0088FE', '#00C49F'];