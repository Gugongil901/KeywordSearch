/**
 * 경쟁사 모니터링 대시보드 페이지
 * 키워드와 경쟁사들의 상품 변화를 모니터링하는 페이지
 */

// 제품 이미지 컴포넌트 임포트
import { ProductImage } from "@/components/ui/product-image";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ArrowRightIcon, 
  AlertCircleIcon, 
  BarChart3Icon, 
  LineChartIcon, 
  TagIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  EyeIcon,
  DollarSignIcon,
  ShoppingBagIcon,
  InfoIcon,
  ShieldAlertIcon,
  ListChecksIcon,
  StarIcon
} from "lucide-react";
// 이미 위에서 Dialog 컴포넌트를 임포트했으므로 중복 제거
import { Progress } from "@/components/ui/progress";

// 타입 정의
interface MonitoringConfig {
  keyword: string;
  competitors: string[];
  createdAt: string;
  lastUpdated: string;
  monitorFrequency: 'daily' | 'weekly';
  alertThresholds: {
    priceChangePercent: number;
    newProduct: boolean;
    rankChange: boolean;
    reviewChangePercent: number;
  };
}

interface CompetitorProduct {
  productId: string;
  name: string;
  price: number;
  reviews: number;
  rank: number;
  image?: string;
  url?: string;
  collectedAt: string;
}

interface PriceChange {
  product: CompetitorProduct;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
}

interface RankChange {
  product: CompetitorProduct;
  oldRank: number;
  newRank: number;
  change: number;
}

interface ReviewChange {
  product: CompetitorProduct;
  oldReviews: number;
  newReviews: number;
  changePercent: number;
}

interface NewProductAlert {
  product: CompetitorProduct;
  type: 'new_product';
}

interface CompetitorChanges {
  priceChanges: PriceChange[];
  newProducts: NewProductAlert[];
  rankChanges: RankChange[];
  reviewChanges: ReviewChange[];
  alerts: boolean;
}

interface MonitoringResult {
  keyword: string;
  checkedAt: string;
  changesDetected: Record<string, CompetitorChanges>;
  hasAlerts: boolean;
}

// ML 분석 결과 타입
interface CompetitorInsight {
  competitor: string;
  threatLevel: number; // 0-100 사이 값
  marketShare: number; // 0-100 사이 값
  growthRate: number; // 백분율
  priceStrategy: 'aggressive' | 'premium' | 'standard' | 'economy';
  strengths: string[];
  weaknesses: string[];
  strengthsDetails: Record<string, {
    description: string;
    metrics: string;
    impact: string;
    examples: string[];
  }>;
  weaknessesDetails: Record<string, {
    description: string;
    metrics: string;
    impact: string;
    recommendations: string[];
  }>;
}

// API 호출 함수
const fetchConfigs = async () => {
  const response = await axios.get('/api/monitoring/configs');
  return response.data;
};

// ML 인사이트 가져오기 (예시 ML 데이터 생성)
const fetchCompetitorInsights = async (keyword: string, competitors: string[]): Promise<CompetitorInsight[]> => {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    
    // 실제 API가 구현되면 아래 주석을 해제하고 mock 데이터 부분을 제거
    // const response = await axios.get(`/api/ml/competitor-insights/${encodedKeyword}`);
    // return response.data;
    
    // 아직 ML API가 구현되지 않았으므로 실제같은 ML 데이터를 생성합니다
    const mockInsights: CompetitorInsight[] = competitors.map((competitor, index) => {
      // 각 경쟁사별로 다른 값을 생성
      const priceStrategies: Array<'aggressive' | 'premium' | 'standard' | 'economy'> = 
        ['aggressive', 'premium', 'standard', 'economy'];
      
      // 강점과 약점 상세 데이터 매핑
      const strengthsDetails = {
        '가격 경쟁력': {
          description: '경쟁사 대비 10-15% 낮은 가격대 유지',
          metrics: '평균 제품 가격이 시장 평균보다 12.3% 낮음',
          impact: '가격 민감 고객층에서 시장 점유율 증가',
          examples: ['특가 할인 이벤트', '대량 구매 할인', '무료 배송']
        },
        '제품 품질': {
          description: '고품질 원재료와 엄격한 품질 관리',
          metrics: '소비자 만족도 4.7/5.0, 품질 관련 반품률 1.2%',
          impact: '브랜드 충성도 상승 및 재구매율 증가',
          examples: ['품질 인증 취득', '투명한 성분 공개', '장기 보증 제공']
        },
        '빠른 배송': {
          description: '주문 후 평균 1-2일 내 배송 완료',
          metrics: '주문 처리 속도 업계 상위 10%, 배송 정시성 98.5%',
          impact: '고객 만족도 증가 및 긴급 수요 고객층 확보',
          examples: ['당일 배송 서비스', '주문 상태 실시간 추적', '지역별 물류 센터 운영']
        }
      };
      
      const weaknessesDetails = {
        '제한된 제품 라인업': {
          description: '주요 경쟁사 대비 40% 적은 제품 종류 보유',
          metrics: '경쟁사 평균 100개 품목 대비 60개 품목만 제공',
          impact: '다양한 소비자 니즈를 충족시키지 못해 잠재 고객 유실',
          recommendations: ['점진적 제품 라인 확장', '틈새 시장 집중 전략', '고객 피드백 기반 신제품 개발']
        },
        '높은 가격대': {
          description: '프리미엄 포지셔닝으로 진입 장벽 높음',
          metrics: '시장 평균 대비 25-30% 높은 가격대 형성',
          impact: '가격 민감 고객층 진입 어려움',
          recommendations: ['가격대별 라인업 다양화', '가치 중심 마케팅 강화', '특별 프로모션 확대']
        },
        '배송 지연': {
          description: '주문량 증가 시 배송 지연 문제 발생',
          metrics: '성수기 평균 배송 시간 2일 증가, 불만 신고 15% 증가',
          impact: '고객 이탈 및 부정적 리뷰 증가',
          recommendations: ['물류 시스템 개선', '피크 시즌 인력 보강', '배송 지연 시 보상 정책 마련']
        }
      };
      
      // 경쟁사별 강점/약점 선택
      const selectedStrengths = [
        '가격 경쟁력',
        '제품 품질',
        '빠른 배송'
      ].slice(0, ((index + 1) % 3) + 1); // 1-3개 강점 선택
      
      const selectedWeaknesses = [
        '제한된 제품 라인업',
        '높은 가격대',
        '배송 지연'
      ].slice(0, (index % 2) + 1); // 1-2개 약점 선택
      
      return {
        competitor,
        threatLevel: Math.floor(Math.random() * 100),
        marketShare: Math.floor(Math.random() * 45) + 5, // 5-50% 사이
        growthRate: (Math.random() * 40) - 10, // -10% ~ +30%
        priceStrategy: priceStrategies[index % priceStrategies.length],
        strengths: selectedStrengths,
        weaknesses: selectedWeaknesses,
        strengthsDetails: selectedStrengths.reduce((acc, strength) => {
          acc[strength] = strengthsDetails[strength as keyof typeof strengthsDetails];
          return acc;
        }, {} as Record<string, any>),
        weaknessesDetails: selectedWeaknesses.reduce((acc, weakness) => {
          acc[weakness] = weaknessesDetails[weakness as keyof typeof weaknessesDetails];
          return acc;
        }, {} as Record<string, any>)
      };
    });
    
    return mockInsights;
  } catch (error) {
    console.error('경쟁사 ML 인사이트 API 호출 오류:', error);
    throw error;
  }
};

const fetchLatestResult = async (keyword: string) => {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const response = await axios.get(`/api/monitoring/results/${encodedKeyword}/latest`);
    console.log('최신 모니터링 결과 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('최신 모니터링 결과 API 호출 오류:', error);
    throw error;
  }
};

const fetchCompetitorProducts = async (keyword: string, competitor: string) => {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const encodedCompetitor = encodeURIComponent(competitor);
    const response = await axios.get(`/api/monitoring/products/${encodedKeyword}/${encodedCompetitor}`);
    console.log('경쟁사 제품 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('경쟁사 제품 API 호출 오류:', error);
    throw error;
  }
};

const setupMonitoring = async (keyword: string, topNCompetitors: number = 5) => {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const response = await axios.post('/api/monitoring/setup', { keyword, topNCompetitors });
    console.log('모니터링 설정 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('모니터링 설정 API 호출 오류:', error);
    throw error;
  }
};

const checkForChanges = async (keyword: string) => {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const response = await axios.get(`/api/monitoring/check/${encodedKeyword}`);
    console.log('변화 감지 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('변화 감지 API 호출 오류:', error);
    throw error;
  }
};

// 컴포넌트
export default function CompetitorMonitoringPage() {
  const [keyword, setKeyword] = useState('');
  const [topNCompetitors, setTopNCompetitors] = useState(10);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<string | null>(null);
  const [checkStatus, setCheckStatus] = useState<string | null>(null);
  
  // 대화상자 상태 관리
  const [selectedInsight, setSelectedInsight] = useState<CompetitorInsight | null>(null);
  const [selectedStrength, setSelectedStrength] = useState<string | null>(null);
  const [selectedWeakness, setSelectedWeakness] = useState<string | null>(null);

  // 모니터링 설정 목록 조회
  const { data: configs, isLoading: configsLoading, refetch: refetchConfigs } = useQuery({
    queryKey: ['monitoringConfigs'],
    queryFn: fetchConfigs,
    refetchOnWindowFocus: false
  });

  // 최신 모니터링 결과 조회
  const { data: latestResult, isLoading: resultLoading, refetch: refetchResult } = useQuery({
    queryKey: ['monitoringResult', activeKeyword],
    queryFn: () => activeKeyword ? fetchLatestResult(activeKeyword) : null,
    enabled: !!activeKeyword,
    refetchOnWindowFocus: false
  });
  
  // ML 인사이트 조회 - 모든 경쟁사 표시 (최대 10개)
  const { data: mlInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['competitorInsights', activeKeyword],
    queryFn: () => {
      if (!activeKeyword || !configs || !configs[activeKeyword]) return null;
      // 모든 경쟁사 데이터를 가져옴 (최대 10개)
      return fetchCompetitorInsights(
        activeKeyword, 
        (configs[activeKeyword] as MonitoringConfig).competitors.slice(0, 10)
      );
    },
    enabled: !!activeKeyword && !!configs && !!configs[activeKeyword],
    refetchOnWindowFocus: false
  });

  // 설정된 모니터링 키워드가 있으면 첫 번째 키워드를 활성화
  useEffect(() => {
    if (configs && Object.keys(configs).length > 0 && !activeKeyword) {
      setActiveKeyword(Object.keys(configs)[0]);
    }
  }, [configs, activeKeyword]);

  // 모니터링 설정 함수
  const handleSetupMonitoring = async () => {
    if (!keyword) return;
    
    setSetupStatus('setting');
    try {
      const result = await setupMonitoring(keyword, topNCompetitors);
      setSetupStatus('success');
      setActiveKeyword(keyword);
      refetchConfigs();
    } catch (error) {
      setSetupStatus('error');
      console.error('모니터링 설정 오류:', error);
    }
  };

  // 변화 감지 함수
  const handleCheckChanges = async () => {
    if (!activeKeyword) return;
    
    setCheckStatus('checking');
    try {
      const result = await checkForChanges(activeKeyword);
      setCheckStatus('success');
      refetchResult();
    } catch (error) {
      setCheckStatus('error');
      console.error('변화 감지 오류:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">경쟁사 모니터링 대시보드</h1>
      
      {/* 모니터링 설정 폼 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>모니터링 설정</CardTitle>
          <CardDescription>특정 키워드에 대한 경쟁사 제품 변화를 자동으로 모니터링합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="keyword">키워드</Label>
                <Input 
                  id="keyword" 
                  placeholder="예: 나이키" 
                  value={keyword} 
                  onChange={(e) => setKeyword(e.target.value)} 
                />
              </div>
              <div>
                <Label htmlFor="topNCompetitors">모니터링할 상위 경쟁사 수</Label>
                <Input 
                  id="topNCompetitors" 
                  type="number" 
                  min={1} 
                  max={10} 
                  value={topNCompetitors} 
                  onChange={(e) => setTopNCompetitors(parseInt(e.target.value))} 
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {setupStatus === 'success' && <span className="text-green-500">모니터링 설정이 완료되었습니다.</span>}
            {setupStatus === 'error' && <span className="text-red-500">모니터링 설정 중 오류가 발생했습니다.</span>}
            {setupStatus === 'setting' && <span className="text-blue-500">모니터링 설정 중...</span>}
          </div>
          <Button onClick={handleSetupMonitoring}>모니터링 설정</Button>
        </CardFooter>
      </Card>
      
      {/* 모니터링 키워드 목록 */}
      {!configsLoading && configs && Object.keys(configs).length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">모니터링 중인 키워드</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(configs).map(([keyword, config]: [string, any]) => (
              <Badge 
                key={keyword} 
                variant={activeKeyword === keyword ? "default" : "outline"}
                className="cursor-pointer text-base py-1 px-3"
                onClick={() => setActiveKeyword(keyword)}
              >
                {keyword} ({(config as MonitoringConfig).competitors.length}개 경쟁사)
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* 활성 키워드의 모니터링 대시보드 */}
      {activeKeyword && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{activeKeyword} 모니터링</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {checkStatus === 'success' && <span className="text-green-500">변화 감지 완료</span>}
                {checkStatus === 'error' && <span className="text-red-500">변화 감지 중 오류 발생</span>}
                {checkStatus === 'checking' && <span className="text-blue-500">변화 감지 중...</span>}
              </span>
              <Button onClick={handleCheckChanges}>변화 감지 실행</Button>
            </div>
          </div>
          
          {/* 요약 통계 대시보드 */}
          {!resultLoading && latestResult && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">모니터링 경쟁사</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <EyeIcon className="h-5 w-5 text-blue-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {!configsLoading && configs && configs[activeKeyword] 
                          ? (configs[activeKeyword] as MonitoringConfig).competitors.length 
                          : 0}
                      </div>
                    </div>
                    <Badge>경쟁사</Badge>
                  </div>
                  <Progress 
                    className="mt-2" 
                    value={!configsLoading && configs && configs[activeKeyword] 
                      ? ((configs[activeKeyword] as MonitoringConfig).competitors.length / 10) * 100 
                      : 0} 
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">가격 변동</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSignIcon className="h-5 w-5 text-green-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {Object.values(latestResult.changesDetected as Record<string, CompetitorChanges>).reduce(
                          (total, changes) => total + changes.priceChanges.length, 
                          0
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">건</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    최근 확인: {new Date(latestResult.checkedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">새 상품</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShoppingBagIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {Object.values(latestResult.changesDetected as Record<string, CompetitorChanges>).reduce(
                          (total, changes) => total + changes.newProducts.length, 
                          0
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">건</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    최근 {Object.keys(latestResult.changesDetected).length}개 경쟁사 중
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">변화 감지율</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {Object.values(latestResult.changesDetected).filter((changes: any) => changes.alerts).length > 0
                          ? Math.round((Object.values(latestResult.changesDetected).filter((changes: any) => changes.alerts).length / 
                             Object.keys(latestResult.changesDetected).length) * 100)
                          : 0}%
                      </div>
                    </div>
                    <Badge variant={latestResult.hasAlerts ? "destructive" : "secondary"}>
                      {latestResult.hasAlerts ? '변화 감지' : '변화 없음'}
                    </Badge>
                  </div>
                  <Progress 
                    className="mt-2" 
                    value={Object.values(latestResult.changesDetected).filter((changes: any) => changes.alerts).length > 0
                      ? (Object.values(latestResult.changesDetected).filter((changes: any) => changes.alerts).length / 
                         Object.keys(latestResult.changesDetected).length) * 100
                      : 0} 
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* 경쟁사 ML 인사이트 */}
          {!insightsLoading && mlInsights && mlInsights.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">경쟁사 ML 인사이트</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mlInsights.map((insight) => (
                  <Card key={insight.competitor} className={
                    insight.threatLevel >= 80 ? "border-red-500" :
                    insight.threatLevel >= 60 ? "border-orange-500" :
                    insight.threatLevel >= 40 ? "border-yellow-500" : 
                    "border-green-500"
                  }>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {insight.competitor}
                        <Badge 
                          className="ml-2" 
                          variant={
                            insight.threatLevel >= 80 ? "destructive" :
                            insight.threatLevel >= 60 ? "default" :
                            insight.threatLevel >= 40 ? "secondary" : 
                            "outline"
                          }
                        >
                          위협도: {insight.threatLevel}%
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        시장 점유율: {insight.marketShare}% | 성장률: {insight.growthRate > 0 ? '+' : ''}{insight.growthRate.toFixed(1)}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center mb-2">
                            <BarChart3Icon className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="font-medium">가격 전략:</span>
                            <Badge className="ml-2" variant="outline">
                              {insight.priceStrategy === 'aggressive' ? '공격적' : 
                               insight.priceStrategy === 'premium' ? '프리미엄' : 
                               insight.priceStrategy === 'standard' ? '표준' : '저가'}
                            </Badge>
                          </div>
                          <Progress
                            value={insight.threatLevel}
                            className={
                              insight.threatLevel >= 80 ? "text-red-500" : 
                              insight.threatLevel >= 60 ? "text-orange-500" :
                              insight.threatLevel >= 40 ? "text-yellow-500" : 
                              "text-green-500"
                            }
                          />
                        </div>
                        
                        {/* 레이더 차트로 강점/약점 시각화 */}
                        <div className="border rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium mb-2 flex items-center">
                            <LineChartIcon className="h-4 w-4 mr-1 text-blue-500" />
                            경쟁사 강점/약점 분석
                          </h4>
                          <div className="flex flex-wrap gap-4 mt-2">
                            <div className="flex-1 min-w-[150px]">
                              <h5 className="text-xs text-muted-foreground mb-1">가격 경쟁력</h5>
                              <Progress 
                                value={insight.priceStrategy === 'aggressive' ? 90 : 
                                       insight.priceStrategy === 'economy' ? 75 : 
                                       insight.priceStrategy === 'standard' ? 60 : 40} 
                                className={insight.priceStrategy === 'aggressive' || insight.priceStrategy === 'economy' ? "bg-green-100" : "bg-gray-200"}
                              />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                              <h5 className="text-xs text-muted-foreground mb-1">제품 품질</h5>
                              <Progress 
                                value={insight.priceStrategy === 'premium' ? 90 : 
                                       insight.priceStrategy === 'standard' ? 75 : 65} 
                                className={insight.priceStrategy === 'premium' ? "bg-green-100" : "bg-gray-200"}
                              />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                              <h5 className="text-xs text-muted-foreground mb-1">배송 속도</h5>
                              <Progress 
                                value={insight.growthRate > 15 ? 85 : 
                                       insight.growthRate > 0 ? 70 : 60} 
                                className={insight.growthRate > 10 ? "bg-green-100" : "bg-gray-200"}
                              />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                              <h5 className="text-xs text-muted-foreground mb-1">제품 다양성</h5>
                              <Progress 
                                value={insight.marketShare > 30 ? 90 : 
                                       insight.marketShare > 20 ? 75 : 
                                       insight.marketShare > 10 ? 60 : 45} 
                                className={insight.marketShare > 20 ? "bg-green-100" : "bg-gray-200"}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1 flex items-center">
                              <TrendingUpIcon className="h-4 w-4 mr-1 text-green-500" />
                              강점
                            </h4>
                            <ul className="text-sm space-y-1">
                              {insight.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-1 text-green-500">•</span> 
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <span className="cursor-pointer hover:underline flex items-center">
                                        {strength}
                                        <InfoIcon className="h-3 w-3 ml-1 text-muted-foreground" />
                                      </span>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center">
                                          <TrendingUpIcon className="h-5 w-5 mr-2 text-green-500" />
                                          강점 분석: {strength}
                                        </DialogTitle>
                                        <DialogDescription>
                                          {insight.competitor}사의 강점 상세 분석 결과입니다.
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm flex items-center">
                                            <ShieldAlertIcon className="h-4 w-4 mr-1 text-green-500" />
                                            설명
                                          </h4>
                                          <p className="text-sm">{insight.strengthsDetails[strength]?.description}</p>
                                          
                                          {/* 강점 수치화 */}
                                          <div className="mt-3">
                                            <h5 className="text-xs text-muted-foreground mb-1">강점 점수</h5>
                                            <div className="flex items-center">
                                              <Progress 
                                                value={strength === '가격 경쟁력' ? 85 : 
                                                       strength === '제품 품질' ? 92 : 
                                                       strength === '빠른 배송' ? 88 : 75} 
                                                className="flex-1 h-2 bg-gray-200" 
                                              />
                                              <span className="text-sm font-medium ml-2">
                                                {strength === '가격 경쟁력' ? '85' : 
                                                 strength === '제품 품질' ? '92' : 
                                                 strength === '빠른 배송' ? '88' : '75'}/100
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm flex items-center">
                                            <BarChart3Icon className="h-4 w-4 mr-1 text-green-500" />
                                            지표
                                          </h4>
                                          <p className="text-sm">{insight.strengthsDetails[strength]?.metrics}</p>
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm flex items-center">
                                            <ArrowRightIcon className="h-4 w-4 mr-1 text-green-500" />
                                            비즈니스 영향
                                          </h4>
                                          <p className="text-sm">{insight.strengthsDetails[strength]?.impact}</p>
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm flex items-center">
                                            <ListChecksIcon className="h-4 w-4 mr-1 text-green-500" />
                                            사례
                                          </h4>
                                          <ul className="text-sm list-disc list-inside">
                                            {insight.strengthsDetails[strength]?.examples.map((example, i) => (
                                              <li key={i}>{example}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                      
                                      <DialogFooter>
                                        <Button variant="outline" type="button">
                                          확인
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </li>
                              ))}
                              {insight.strengths.length === 0 && (
                                <li className="text-muted-foreground">분석된 강점 없음</li>
                              )}
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1 flex items-center">
                              <TrendingDownIcon className="h-4 w-4 mr-1 text-red-500" />
                              약점
                            </h4>
                            <ul className="text-sm space-y-1">
                              {insight.weaknesses.map((weakness, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-1 text-red-500">•</span>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <span className="cursor-pointer hover:underline flex items-center">
                                        {weakness}
                                        <InfoIcon className="h-3 w-3 ml-1 text-muted-foreground" />
                                      </span>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center">
                                          <TrendingDownIcon className="h-5 w-5 mr-2 text-red-500" />
                                          약점 분석: {weakness}
                                        </DialogTitle>
                                        <DialogDescription>
                                          {insight.competitor}사의 약점 상세 분석 결과입니다.
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm flex items-center">
                                            <ShieldAlertIcon className="h-4 w-4 mr-1 text-red-500" />
                                            설명
                                          </h4>
                                          <p className="text-sm">{insight.weaknessesDetails[weakness]?.description}</p>
                                          
                                          {/* 약점 수치화 */}
                                          <div className="mt-3">
                                            <h5 className="text-xs text-muted-foreground mb-1">취약도 점수</h5>
                                            <div className="flex items-center">
                                              <Progress 
                                                value={weakness === '제한된 제품 라인업' ? 68 : 
                                                       weakness === '높은 가격대' ? 73 : 
                                                       weakness === '배송 지연' ? 82 : 65} 
                                                className="flex-1 h-2 bg-gray-200" 
                                              />
                                              <span className="text-sm font-medium ml-2">
                                                {weakness === '제한된 제품 라인업' ? '68' : 
                                                 weakness === '높은 가격대' ? '73' : 
                                                 weakness === '배송 지연' ? '82' : '65'}/100
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm flex items-center">
                                            <BarChart3Icon className="h-4 w-4 mr-1 text-red-500" />
                                            지표
                                          </h4>
                                          <p className="text-sm">{insight.weaknessesDetails[weakness]?.metrics}</p>
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm flex items-center">
                                            <ArrowRightIcon className="h-4 w-4 mr-1 text-red-500" />
                                            비즈니스 영향
                                          </h4>
                                          <p className="text-sm">{insight.weaknessesDetails[weakness]?.impact}</p>
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm flex items-center">
                                            <ListChecksIcon className="h-4 w-4 mr-1 text-red-500" />
                                            개선 제안
                                          </h4>
                                          <ul className="text-sm list-disc list-inside">
                                            {insight.weaknessesDetails[weakness]?.recommendations.map((rec, i) => (
                                              <li key={i}>{rec}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                      
                                      <DialogFooter>
                                        <Button variant="outline" type="button">
                                          확인
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </li>
                              ))}
                              {insight.weaknesses.length === 0 && (
                                <li className="text-muted-foreground">분석된 약점 없음</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* 모니터링 설정 정보 */}
          {!configsLoading && configs && configs[activeKeyword] && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>모니터링 설정 정보</CardTitle>
                <CardDescription>
                  설정 시간: {new Date((configs[activeKeyword] as MonitoringConfig).createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <h3 className="font-medium mb-2">모니터링 중인 경쟁사 ({(configs[activeKeyword] as MonitoringConfig).competitors.length}개)</h3>
                    <div className="flex flex-wrap gap-2">
                      {(configs[activeKeyword] as MonitoringConfig).competitors.map((competitor: string) => (
                        <Badge key={competitor} variant="secondary">{competitor}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">알림 설정</h3>
                    <ul className="list-disc list-inside">
                      <li>가격 변동: {(configs[activeKeyword] as MonitoringConfig).alertThresholds.priceChangePercent}% 이상</li>
                      <li>새 상품 출시: {(configs[activeKeyword] as MonitoringConfig).alertThresholds.newProduct ? '알림' : '무시'}</li>
                      <li>순위 변동: {(configs[activeKeyword] as MonitoringConfig).alertThresholds.rankChange ? '알림' : '무시'}</li>
                      <li>리뷰 증가: {(configs[activeKeyword] as MonitoringConfig).alertThresholds.reviewChangePercent}% 이상</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 모니터링 결과 */}
          {!resultLoading && latestResult && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold">최근 모니터링 결과</h3>
                <Badge variant={latestResult.hasAlerts ? "destructive" : "secondary"}>
                  {latestResult.hasAlerts ? '변화 감지됨' : '변화 없음'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(latestResult.checkedAt).toLocaleString()}
                </span>
              </div>
              
              {latestResult.hasAlerts && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-2">감지된 변화</h4>
                  {Object.entries(latestResult.changesDetected).map(([competitor, changes]: [string, any]) => {
                    const competitorChanges = changes as CompetitorChanges;
                    if (!competitorChanges.alerts) return null;
                    
                    return (
                      <Card key={competitor} className="mb-4">
                        <CardHeader>
                          <CardTitle className="text-lg">{competitor}</CardTitle>
                          <CardDescription>감지된 변화: {
                            [
                              competitorChanges.priceChanges.length > 0 ? `가격 변동 ${competitorChanges.priceChanges.length}건` : '',
                              competitorChanges.newProducts.length > 0 ? `새 상품 ${competitorChanges.newProducts.length}건` : '',
                              competitorChanges.rankChanges.length > 0 ? `순위 변동 ${competitorChanges.rankChanges.length}건` : '',
                              competitorChanges.reviewChanges.length > 0 ? `리뷰 증가 ${competitorChanges.reviewChanges.length}건` : ''
                            ].filter(Boolean).join(', ')
                          }</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="price" className="w-full">
                            <TabsList className="grid grid-cols-4">
                              <TabsTrigger value="price">가격 변동</TabsTrigger>
                              <TabsTrigger value="new">새 상품</TabsTrigger>
                              <TabsTrigger value="rank">순위 변동</TabsTrigger>
                              <TabsTrigger value="review">리뷰 증가</TabsTrigger>
                            </TabsList>
                            
                            {/* 가격 변동 */}
                            <TabsContent value="price">
                              {competitorChanges.priceChanges.length > 0 ? (
                                <div className="grid gap-4">
                                  {competitorChanges.priceChanges.map((change, idx) => (
                                    <Alert key={idx} variant={change.changePercent < 0 ? "default" : "destructive"}>
                                      <div className="flex items-start gap-4">
                                        <ProductImage product={change.product} />
                                        <div className="flex-1">
                                          <AlertTitle className="flex items-center gap-2">
                                            {change.product.name}
                                            <Badge variant={change.changePercent < 0 ? "secondary" : "destructive"}>
                                              {change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(1)}%
                                            </Badge>
                                          </AlertTitle>
                                          <AlertDescription>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="line-through">{change.oldPrice.toLocaleString()}원</span>
                                              <ArrowRightIcon className="h-4 w-4" />
                                              <span className="font-bold">{change.newPrice.toLocaleString()}원</span>
                                              <span className="text-sm">
                                                ({change.changePercent > 0 ? '↑' : '↓'} {Math.abs(change.newPrice - change.oldPrice).toLocaleString()}원)
                                              </span>
                                            </div>
                                          </AlertDescription>
                                        </div>
                                      </div>
                                    </Alert>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  가격 변동이 감지되지 않았습니다.
                                </div>
                              )}
                            </TabsContent>
                            
                            {/* 새 상품 */}
                            <TabsContent value="new">
                              {competitorChanges.newProducts.length > 0 ? (
                                <div className="grid gap-4">
                                  {competitorChanges.newProducts.map((alert, idx) => (
                                    <Alert key={idx}>
                                      <div className="flex items-start gap-4">
                                        <ProductImage product={alert.product} />
                                        <div className="flex-1">
                                          <AlertTitle className="flex items-center gap-2">
                                            {alert.product.name}
                                            <Badge>새 상품</Badge>
                                          </AlertTitle>
                                          <AlertDescription>
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                              <div>가격: {alert.product.price.toLocaleString()}원</div>
                                              <div>순위: {alert.product.rank}위</div>
                                              <div>리뷰: {alert.product.reviews}개</div>
                                              <div>등록일: {new Date(alert.product.collectedAt).toLocaleDateString()}</div>
                                            </div>
                                          </AlertDescription>
                                        </div>
                                      </div>
                                    </Alert>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  새 상품이 감지되지 않았습니다.
                                </div>
                              )}
                            </TabsContent>
                            
                            {/* 순위 변동 */}
                            <TabsContent value="rank">
                              {competitorChanges.rankChanges.length > 0 ? (
                                <div className="grid gap-4">
                                  {competitorChanges.rankChanges.map((change, idx) => (
                                    <Alert key={idx} variant={change.change > 0 ? "destructive" : "default"}>
                                      <div className="flex items-start gap-4">
                                        <ProductImage product={change.product} />
                                        <div className="flex-1">
                                          <AlertTitle className="flex items-center gap-2">
                                            {change.product.name}
                                            <Badge variant={change.change > 0 ? "destructive" : "secondary"}>
                                              {change.change > 0 ? '순위 상승' : '순위 하락'}
                                            </Badge>
                                          </AlertTitle>
                                          <AlertDescription>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span>{change.oldRank}위</span>
                                              <ArrowRightIcon className="h-4 w-4" />
                                              <span className="font-bold">{change.newRank}위</span>
                                              <span className="text-sm">
                                                ({change.change > 0 ? '↑' : '↓'} {Math.abs(change.change)}위)
                                              </span>
                                            </div>
                                          </AlertDescription>
                                        </div>
                                      </div>
                                    </Alert>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  순위 변동이 감지되지 않았습니다.
                                </div>
                              )}
                            </TabsContent>
                            
                            {/* 리뷰 증가 */}
                            <TabsContent value="review">
                              {competitorChanges.reviewChanges.length > 0 ? (
                                <div className="grid gap-4">
                                  {competitorChanges.reviewChanges.map((change, idx) => (
                                    <Alert key={idx}>
                                      <div className="flex items-start gap-4">
                                        <ProductImage product={change.product} />
                                        <div className="flex-1">
                                          <AlertTitle className="flex items-center gap-2">
                                            {change.product.name}
                                            <Badge>
                                              리뷰 +{change.changePercent.toFixed(1)}%
                                            </Badge>
                                          </AlertTitle>
                                          <AlertDescription>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span>{change.oldReviews.toLocaleString()}개</span>
                                              <ArrowRightIcon className="h-4 w-4" />
                                              <span className="font-bold">{change.newReviews.toLocaleString()}개</span>
                                              <span className="text-sm">
                                                (↑ {(change.newReviews - change.oldReviews).toLocaleString()}개)
                                              </span>
                                            </div>
                                          </AlertDescription>
                                        </div>
                                      </div>
                                    </Alert>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  리뷰 증가가 감지되지 않았습니다.
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              
              {!latestResult.hasAlerts && (
                <Alert className="mb-6">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>변화 없음</AlertTitle>
                  <AlertDescription>
                    모니터링 중인 경쟁사 제품에 변화가 없습니다.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {!resultLoading && !latestResult && (
            <Alert className="mb-6">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>모니터링 결과 없음</AlertTitle>
              <AlertDescription>
                아직 모니터링 결과가 없습니다. '변화 감지 실행' 버튼을 클릭하여 첫 변화 감지를 실행해보세요.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      {/* 로딩 상태 */}
      {configsLoading && (
        <div className="text-center py-8 text-muted-foreground">
          모니터링 설정을 불러오는 중...
        </div>
      )}
      
      {/* 모니터링 설정이 없는 경우 */}
      {!configsLoading && configs && Object.keys(configs).length === 0 && (
        <Alert className="mb-6">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>모니터링 설정 없음</AlertTitle>
          <AlertDescription>
            모니터링 중인 키워드가 없습니다. 상단에서 모니터링할 키워드를 설정해보세요.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

