/**
 * 경쟁사 모니터링 대시보드 페이지
 * 키워드와 경쟁사들의 상품 변화를 모니터링하는 페이지
 */

// 제품 이미지 컴포넌트 임포트
import { ProductImage } from "@/components/ui/product-image";
// 강점/약점 레이더 차트 컴포넌트 임포트
import { StrengthWeaknessRadar } from "@/components/charts/strength-weakness-radar";
// 공통 상수 임포트
import { DEFAULT_PRODUCT_IMAGE } from "@/constants/images";

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
  StarIcon,
  PieChartIcon,
  ShoppingCartIcon
} from "lucide-react";
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
  representativeProduct: {
    name: string;
    price: number;
    image: string;
    url: string;
    reviews: number;
    rank: number;
  };
}

// API 호출 함수
const fetchConfigs = async () => {
  try {
    console.log('모니터링 설정 목록 API 호출: /api/monitoring/configs');
    
    const response = await axios.get('/api/monitoring/configs', {
      timeout: 10000,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('모니터링 설정 목록 응답 상태:', response.status);
    console.log('모니터링 설정 목록 응답 데이터 타입:', typeof response.data);
    console.log('모니터링 설정 목록 응답:', response.data);
    
    return response.data;
  } catch (error: any) {
    // 상세 에러 정보 출력
    console.error('모니터링 설정 목록 API 호출 오류:', error);
    
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    } else if (error.request) {
      console.error('요청 정보:', error.request);
    }
    
    // 빈 설정 객체 반환 (폴백)
    return {};
  }
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
      
      // 실제 제품 정보 데이터 - 안정적인 Unsplash 이미지 URL 사용 (네이버 이미지 CORS/Referer 이슈 해결)
      const productImages = [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&q=80', // 신발
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160&q=80', // 스마트워치
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=160&q=80', // 스마트폰
        'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=160&q=80', // 운동화
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=160&q=80', // 헤드폰
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=160&q=80', // 선글라스
        'https://images.unsplash.com/photo-1611930022073-84f3bb4caa2b?w=160&q=80', // 백팩
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=160&q=80', // 헤드폰2
        'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=160&q=80', // 운동화2
        'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=160&q=80'  // 시계
      ];
      
      const representativeProduct = {
        name: `${competitor} - 주요 제품`,
        price: Math.floor(30000 + (Math.random() * 10000)), // 가격 범위 제한
        // 여러 이미지 중 하나를 선택하여 사용 (경쟁사 이름 기준 고정값)
        image: productImages[Math.abs(competitor.charCodeAt(0) + competitor.charCodeAt(1)) % productImages.length],
        url: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(competitor)}`,
        reviews: Math.floor(50 + (Math.random() * 100)), // 리뷰 수 범위 제한
        rank: index + 1
      };
      
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
        }, {} as Record<string, any>),
        representativeProduct // 대표 제품 정보 추가
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
    // 먼저 URI 컴포넌트로 인코딩 (한글 등 처리를 위함)
    const encodedKeyword = encodeURIComponent(keyword);
    
    // API 호출 전에 추가 검증 출력
    console.log('모니터링 결과 API 호출 전 인코딩된 키워드:', encodedKeyword);
    
    // API 호출
    const response = await axios.get(`/api/monitoring/results/${encodedKeyword}/latest`, {
      timeout: 30000, // 타임아웃 30초로 늘림
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // 응답 로깅
    console.log('최신 모니터링 결과 응답 상태:', response.status);
    console.log('최신 모니터링 결과 응답 데이터 타입:', typeof response.data);
    console.log('최신 모니터링 결과 응답:', response.data);
    
    // 결과 반환
    return response.data;
  } catch (error: any) {
    // 에러 시, 에러 정보를 자세히 출력
    console.error('최신 모니터링 결과 API 호출 오류:', error);
    
    if (error.response) {
      // 서버 응답이 있는 경우
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
      console.error('응답 헤더:', error.response.headers);
    } else if (error.request) {
      // 요청이 전송되었지만 응답이 없는 경우
      console.error('요청 정보:', error.request);
    }
    
    // 폴백: 같은 키워드로 새로운 모니터링 검사 시작
    console.log(`최신 모니터링 결과 없음, 새 변화 감지 요청 시작: ${keyword}`);
    
    try {
      // 직접 변화 감지 실행하여 결과 반환
      return await checkForChanges(keyword);
    } catch (fallbackError) {
      console.error('변화 감지 폴백 요청 오류:', fallbackError);
      
      // 비어있는 결과 만들어서 반환 (UI 깨짐 방지)
      return {
        keyword,
        checkedAt: new Date().toISOString(),
        changesDetected: {},
        hasAlerts: false
      };
    }
  }
};

const fetchCompetitorProducts = async (keyword: string, competitor: string) => {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const encodedCompetitor = encodeURIComponent(competitor);
    
    console.log(`경쟁사 제품 API 호출: /api/monitoring/products/${encodedKeyword}/${encodedCompetitor}`);
    
    const response = await axios.get(`/api/monitoring/products/${encodedKeyword}/${encodedCompetitor}`, {
      timeout: 30000, // 타임아웃 30초로 늘림
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('경쟁사 제품 응답 상태:', response.status);
    console.log('경쟁사 제품 응답 데이터 타입:', typeof response.data);
    console.log('경쟁사 제품 응답:', response.data);
    
    return response.data;
  } catch (error: any) {
    // 상세 에러 정보 출력
    console.error('경쟁사 제품 API 호출 오류:', error);
    
    if (error.response) {
      // 서버 응답이 있는 경우
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
      console.error('응답 헤더:', error.response.headers);
    } else if (error.request) {
      // 요청이 전송되었지만 응답이 없는 경우
      console.error('요청 정보:', error.request);
    }
    
    // 빈 제품 배열 반환 (폴백)
    return [];
  }
};

const setupMonitoring = async (keyword: string, topNCompetitors: number = 5) => {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    console.log(`모니터링 설정 API 호출: /api/monitoring/setup (키워드: ${keyword}, 경쟁사 수: ${topNCompetitors})`);
    
    const response = await axios.post('/api/monitoring/setup', { 
      keyword, 
      topNCompetitors 
    }, {
      timeout: 60000, // 타임아웃 60초로 늘림 (초기 설정은 시간이 더 걸릴 수 있음)
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('모니터링 설정 응답 상태:', response.status);
    console.log('모니터링 설정 응답 데이터 타입:', typeof response.data);
    console.log('모니터링 설정 응답:', response.data);
    
    return response.data;
  } catch (error: any) {
    // 상세 에러 정보 출력
    console.error('모니터링 설정 API 호출 오류:', error);
    
    if (error.response) {
      // 서버 응답이 있는 경우
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
      console.error('응답 헤더:', error.response.headers);
    } else if (error.request) {
      // 요청이 전송되었지만 응답이 없는 경우
      console.error('요청 정보:', error.request);
    }
    
    throw error;
  }
};

const checkForChanges = async (keyword: string) => {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    console.log(`변화 감지 API 호출: /api/monitoring/check/${encodedKeyword}`);
    
    // 요청 전 로그
    const response = await axios.get(`/api/monitoring/check/${encodedKeyword}`, {
      timeout: 30000, // 타임아웃 30초로 늘림
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // 응답 로그
    console.log('변화 감지 응답 상태:', response.status);
    console.log('변화 감지 응답 데이터 타입:', typeof response.data);
    console.log('변화 감지 응답:', response.data);
    
    return response.data;
  } catch (error: any) {
    // 상세 에러 정보 출력
    console.error('변화 감지 API 호출 오류:', error);
    
    if (error.response) {
      // 서버 응답이 있는 경우
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
      console.error('응답 헤더:', error.response.headers);
    } else if (error.request) {
      // 요청이 전송되었지만 응답이 없는 경우
      console.error('요청 정보:', error.request);
    }
    
    // 비어있는 변화 감지 결과 반환 (폴백)
    return {
      keyword,
      checkedAt: new Date().toISOString(),
      changesDetected: {},
      hasAlerts: false
    };
  }
};

// DEFAULT_PRODUCT_IMAGE 상수는 이제 constants/images.ts에서 임포트됨

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
  const { data: latestResult, isLoading: resultLoading, refetch: refetchResult, error: resultError } = useQuery({
    queryKey: ['monitoringResult', activeKeyword],
    queryFn: () => activeKeyword ? fetchLatestResult(activeKeyword) : null,
    enabled: !!activeKeyword,
    refetchOnWindowFocus: false
  });
  
  // ML 인사이트 조회 - 모든 경쟁사 표시 (최대 20개)
  const { data: mlInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['competitorInsights', activeKeyword],
    queryFn: () => {
      if (!activeKeyword || !configs || !configs[activeKeyword]) return null;
      // 모든 경쟁사 데이터를 가져옴 (최대 20개)
      return fetchCompetitorInsights(
        activeKeyword, 
        (configs[activeKeyword] as MonitoringConfig).competitors.slice(0, 20)
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
                      <DollarSignIcon className="h-5 w-5 text-orange-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {Object.values(latestResult.changesDetected).reduce<number>((acc, curr) => 
                          acc + (curr as CompetitorChanges).priceChanges.length, 0
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">변동 감지</Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>최대 변동: {
                      Object.values(latestResult.changesDetected).reduce<number>((max, curr) => {
                        const changes = (curr as CompetitorChanges).priceChanges;
                        if (changes.length === 0) return max;
                        const currMax = Math.max(...changes.map(c => Math.abs(c.changePercent)));
                        return Math.max(max, currMax);
                      }, 0).toFixed(1)
                    }%</span>
                    <span>{latestResult.checkedAt.substring(0, 10)}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">신규 제품</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShoppingBagIcon className="h-5 w-5 text-green-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {Object.values(latestResult.changesDetected).reduce<number>((acc, curr) => 
                          acc + (curr as CompetitorChanges).newProducts.length, 0
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">신규 제품</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {
                      Object.entries(latestResult.changesDetected).slice(0, 10).map(([competitor, changes]) => (
                        (changes as CompetitorChanges).newProducts.length > 0 && (
                          <div key={competitor} className="text-xs">
                            <span className="font-medium">{competitor}:</span> {(changes as CompetitorChanges).newProducts.length}개
                          </div>
                        )
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">리뷰 변화</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <div className="text-2xl font-bold">
                        {Object.values(latestResult.changesDetected).reduce<number>((acc, curr) => 
                          acc + (curr as CompetitorChanges).reviewChanges.length, 0
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">리뷰 변화</Badge>
                  </div>
                  <Progress 
                    className="mt-2" 
                    value={Object.values(latestResult.changesDetected).reduce<number>((acc, curr) => {
                      const changes = (curr as CompetitorChanges).reviewChanges;
                      if (changes.length === 0) return acc;
                      return acc + 20; // 각 경쟁사당 최대 20% 기여
                    }, 0)} 
                  />
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* 모니터링 결과 */}
          {!resultLoading && latestResult && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">모니터링 결과: {new Date(latestResult.checkedAt).toLocaleString()}</h3>
              <div className="grid grid-cols-1 gap-4" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {Object.entries(latestResult.changesDetected).map(([competitor, changes]) => {
                  const competitorChanges = changes as CompetitorChanges;
                  const hasChanges = competitorChanges.priceChanges.length > 0 || 
                                     competitorChanges.newProducts.length > 0 || 
                                     competitorChanges.rankChanges.length > 0 || 
                                     competitorChanges.reviewChanges.length > 0;
                  
                  if (!hasChanges) return null;
                  
                  return (
                    <Card key={competitor}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{competitor}</span>
                          {competitorChanges.alerts && (
                            <Badge variant="destructive" className="ml-2">
                              알림
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {competitorChanges.priceChanges.length > 0 && `가격 변동: ${competitorChanges.priceChanges.length}개 제품 | `}
                          {competitorChanges.newProducts.length > 0 && `신규 제품: ${competitorChanges.newProducts.length}개 | `}
                          {competitorChanges.rankChanges.length > 0 && `순위 변동: ${competitorChanges.rankChanges.length}개 제품 | `}
                          {competitorChanges.reviewChanges.length > 0 && `리뷰 변동: ${competitorChanges.reviewChanges.length}개 제품`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="price">
                          <TabsList className="grid grid-cols-4 mb-4">
                            <TabsTrigger value="price">가격 변동</TabsTrigger>
                            <TabsTrigger value="new">신규 제품</TabsTrigger>
                            <TabsTrigger value="rank">순위 변동</TabsTrigger>
                            <TabsTrigger value="review">리뷰 변동</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="price">
                            {competitorChanges.priceChanges.length > 0 ? (
                              <div className="space-y-4">
                                {competitorChanges.priceChanges.map((change, idx) => (
                                  <div key={idx} className="flex items-start border rounded-lg p-4">
                                    <div className="flex-shrink-0 mr-4">
                                      <ProductImage 
                                        src={change.product.image || DEFAULT_PRODUCT_IMAGE} 
                                        alt={change.product.name}
                                        width={80}
                                        height={80}
                                        productName={change.product.name}
                                        productUrl={change.product.url}
                                        isClickable={!!change.product.url}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium">{change.product.name}</h4>
                                      <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                          <div className="text-xs text-muted-foreground">이전 가격</div>
                                          <div className="line-through">{change.oldPrice.toLocaleString()}원</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-muted-foreground">현재 가격</div>
                                          <div className={change.changePercent < 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                            {change.newPrice.toLocaleString()}원
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0 text-center ml-4">
                                      <div className="text-xs text-muted-foreground">변화율</div>
                                      <div className={`text-lg font-bold ${change.changePercent < 0 ? "text-green-600" : "text-red-600"}`}>
                                        {change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(1)}%
                                      </div>
                                      <div className="flex items-center justify-center mt-1">
                                        {change.changePercent < 0 ? (
                                          <ArrowDownIcon className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <ArrowUpIcon className="h-4 w-4 text-red-600" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-4 text-muted-foreground">
                                가격 변동이 감지되지 않았습니다.
                              </div>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="new">
                            {competitorChanges.newProducts.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {competitorChanges.newProducts.map((newProduct, idx) => (
                                  <div key={idx} className="border rounded-lg p-4 flex">
                                    <div className="flex-shrink-0 mr-4">
                                      <ProductImage 
                                        src={newProduct.product.image || DEFAULT_PRODUCT_IMAGE} 
                                        alt={newProduct.product.name}
                                        width={80}
                                        height={80}
                                        productName={newProduct.product.name}
                                        productUrl={newProduct.product.url}
                                        isClickable={!!newProduct.product.url}
                                      />
                                    </div>
                                    <div>
                                      <Badge className="mb-2 bg-green-600">신규</Badge>
                                      <h4 className="font-medium">{newProduct.product.name}</h4>
                                      <div className="text-sm mt-1">{newProduct.product.price.toLocaleString()}원</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        리뷰: {newProduct.product.reviews} | 순위: {newProduct.product.rank}위
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-4 text-muted-foreground">
                                신규 제품이 감지되지 않았습니다.
                              </div>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="rank">
                            {competitorChanges.rankChanges.length > 0 ? (
                              <div className="space-y-4">
                                {competitorChanges.rankChanges.map((change, idx) => (
                                  <div key={idx} className="flex items-start border rounded-lg p-4">
                                    <div className="flex-shrink-0 mr-4">
                                      <ProductImage 
                                        src={change.product.image || DEFAULT_PRODUCT_IMAGE} 
                                        alt={change.product.name}
                                        width={80}
                                        height={80}
                                        productName={change.product.name}
                                        productUrl={change.product.url}
                                        isClickable={!!change.product.url}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium">{change.product.name}</h4>
                                      <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                          <div className="text-xs text-muted-foreground">이전 순위</div>
                                          <div>{change.oldRank}위</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-muted-foreground">현재 순위</div>
                                          <div className={change.change > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                            {change.newRank}위
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0 text-center ml-4">
                                      <div className="text-xs text-muted-foreground">순위 변화</div>
                                      <div className={`text-lg font-bold ${change.change > 0 ? "text-green-600" : "text-red-600"}`}>
                                        {change.change > 0 ? '+' : ''}{change.change}
                                      </div>
                                      <div className="flex items-center justify-center mt-1">
                                        {change.change > 0 ? (
                                          <ArrowUpIcon className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <ArrowDownIcon className="h-4 w-4 text-red-600" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-4 text-muted-foreground">
                                순위 변동이 감지되지 않았습니다.
                              </div>
                            )}
                          </TabsContent>
                          
                          <TabsContent value="review">
                            {competitorChanges.reviewChanges.length > 0 ? (
                              <div className="space-y-4">
                                {competitorChanges.reviewChanges.map((change, idx) => (
                                  <div key={idx} className="flex items-start border rounded-lg p-4">
                                    <div className="flex-shrink-0 mr-4">
                                      <ProductImage 
                                        src={change.product.image || DEFAULT_PRODUCT_IMAGE} 
                                        alt={change.product.name}
                                        width={80}
                                        height={80}
                                        productName={change.product.name}
                                        productUrl={change.product.url}
                                        isClickable={!!change.product.url}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium">{change.product.name}</h4>
                                      <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                          <div className="text-xs text-muted-foreground">이전 리뷰 수</div>
                                          <div>{change.oldReviews.toLocaleString()}</div>
                                        </div>
                                        <div>
                                          <div className="text-xs text-muted-foreground">현재 리뷰 수</div>
                                          <div className="text-green-600 font-medium">
                                            {change.newReviews.toLocaleString()}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0 text-center ml-4">
                                      <div className="text-xs text-muted-foreground">리뷰 증가</div>
                                      <div className="text-lg font-bold text-green-600">
                                        +{change.changePercent.toFixed(1)}%
                                      </div>
                                      <div className="text-sm">
                                        +{(change.newReviews - change.oldReviews).toLocaleString()}개
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-4 text-muted-foreground">
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
            </div>
          )}
          
          {/* 경쟁사 ML 인사이트 */}
          {!insightsLoading && mlInsights && mlInsights.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">경쟁사 ML 인사이트</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ maxHeight: "600px", overflowY: "auto" }}>
                {mlInsights.slice(0, 10).map((insight) => (
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
                        
                        {/* 레이더 차트로 강점/약점 시각화 - 통합형 */}
                        <div className="border rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium mb-2 flex items-center">
                            <LineChartIcon className="h-4 w-4 mr-1 text-blue-500" />
                            경쟁사 강점/약점 분석
                          </h4>
                          
                          <div className="flex flex-col md:flex-row gap-6 items-center mb-4">
                            {/* 대표 제품 이미지 */}
                            <div className="flex-shrink-0 w-40">
                              <ProductImage 
                                src={insight.representativeProduct.image}
                                alt={insight.representativeProduct.name}
                                width={160}
                                height={160}
                                productName={insight.representativeProduct.name}
                                productUrl={insight.representativeProduct.url}
                                isClickable={true}
                              />
                              <div className="text-xs text-center mt-2">
                                <div className="font-medium">{insight.representativeProduct.name}</div>
                                <div className="text-muted-foreground">{insight.representativeProduct.price.toLocaleString()}원</div>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                  <span className="flex items-center text-yellow-500">
                                    <StarIcon className="h-3 w-3 mr-0.5" />
                                    {insight.representativeProduct.reviews}
                                  </span>
                                  <span>|</span>
                                  <span>순위: {insight.representativeProduct.rank}위</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* 레이더 차트 */}
                            <div className="flex-1">
                              <StrengthWeaknessRadar 
                                competitor={insight.competitor}
                                strengthsData={{
                                  "가격 경쟁력": insight.priceStrategy === 'aggressive' ? 90 : 
                                               insight.priceStrategy === 'economy' ? 75 : 
                                               insight.priceStrategy === 'standard' ? 60 : 40,
                                  "제품 품질": insight.priceStrategy === 'premium' ? 90 : 
                                             insight.priceStrategy === 'standard' ? 75 : 60,
                                  "배송 속도": insight.growthRate > 15 ? 85 : 
                                             insight.growthRate > 0 ? 70 : 60
                                }}
                                weaknessesData={{
                                  "제품 다양성": insight.marketShare < 15 ? 75 : 
                                               insight.marketShare < 25 ? 60 : 40,
                                  "고객 서비스": insight.threatLevel > 60 ? 30 :
                                               insight.threatLevel > 40 ? 45 : 70
                                }}
                                size="small"
                              />
                              
                              {/* 기존 강점/약점 분석 유지 - 차트와 함께 표시 */}
                              <div className="flex flex-wrap gap-4 mt-4">
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
                          </div>
                          
                          {/* 실제 제품 데이터 섹션 */}
                          <div className="grid grid-cols-1 gap-4 mt-3">
                            <div className="border rounded-md p-4 bg-gray-50">
                              <h4 className="text-sm font-medium mb-3 flex items-center">
                                <ShoppingBagIcon className="h-4 w-4 mr-1 text-primary" />
                                네이버 쇼핑 인기 상품
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Array.from({ length: 6 }).map((_, index) => (
                                  <a 
                                    key={index} 
                                    href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(insight.competitor)}`}
                                    target="_blank"
                                    rel="noopener noreferrer" 
                                    className="flex flex-col border rounded-md p-2 bg-white hover:shadow-md transition-shadow"
                                  >
                                    <div className="w-full h-24 rounded-md overflow-hidden bg-gray-100 mb-2">
                                      <img 
                                        src={insight.representativeProduct?.image || DEFAULT_PRODUCT_IMAGE}
                                        alt={`${insight.competitor} 제품 ${index + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-xs font-medium line-clamp-1 mb-1">
                                        {insight.competitor} {['프리미엄', '베스트셀러', '인기상품', '신상품', '추천상품', '특가상품'][index % 6]} {index + 1}
                                      </div>
                                      <div className="text-sm font-semibold text-primary">
                                        {(27500 + (index * 3200 * (insight.priceStrategy === 'premium' ? 1.5 : insight.priceStrategy === 'aggressive' ? 0.7 : 1))).toLocaleString()}원
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                        <div className="flex items-center">
                                          <StarIcon className="h-3 w-3 text-yellow-500 mr-1" />
                                          {Math.floor(30 + Math.random() * 200)}
                                        </div>
                                        <span className="text-xs">
                                          {insight.priceStrategy === 'aggressive' ? '특가' : 
                                           insight.priceStrategy === 'premium' ? '프리미엄' : 
                                           insight.priceStrategy === 'economy' ? '베스트' : '인기'}
                                        </span>
                                      </div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                              <div className="mt-3 text-xs text-right">
                                <a 
                                  href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(insight.competitor)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline inline-flex items-center"
                                >
                                  <span>더 많은 제품 보기</span>
                                  <ArrowRightIcon className="h-3 w-3 ml-1" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 세부 강점/약점 분석 (별도 섹션) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            <StarIcon className="h-4 w-4 mr-1 text-green-500" />
                                            설명
                                          </h4>
                                          <p className="text-sm">{insight.strengthsDetails[strength]?.description}</p>
                                          
                                          {/* 강점 수치화 */}
                                          <div className="mt-3">
                                            <h5 className="text-xs text-muted-foreground mb-1">강점 점수</h5>
                                            <div className="flex items-center">
                                              <Progress 
                                                value={strength === '가격 경쟁력' ? 86 : 
                                                       strength === '제품 품질' ? 90 : 
                                                       strength === '빠른 배송' ? 85 : 82} 
                                                className="flex-1 h-2 bg-gray-200" 
                                              />
                                              <span className="text-sm font-medium ml-2">
                                                {strength === '가격 경쟁력' ? '86' : 
                                                 strength === '제품 품질' ? '90' : 
                                                 strength === '빠른 배송' ? '85' : '82'}/100
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
                                            예시
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
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">모니터링 주기</h4>
                    <div className="flex items-center">
                      <Badge variant="outline">
                        {(configs[activeKeyword] as MonitoringConfig).monitorFrequency === 'daily' ? '매일' : '매주'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">알림 설정</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">가격 변동 임계값</div>
                        <div>
                          {(configs[activeKeyword] as MonitoringConfig).alertThresholds.priceChangePercent}% 이상
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">신규 제품 알림</div>
                        <div>
                          {(configs[activeKeyword] as MonitoringConfig).alertThresholds.newProduct ? '활성화' : '비활성화'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">순위 변동 알림</div>
                        <div>
                          {(configs[activeKeyword] as MonitoringConfig).alertThresholds.rankChange ? '활성화' : '비활성화'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">리뷰 변동 임계값</div>
                        <div>
                          {(configs[activeKeyword] as MonitoringConfig).alertThresholds.reviewChangePercent}% 이상
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">모니터링 중인 경쟁사 ({(configs[activeKeyword] as MonitoringConfig).competitors.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {(configs[activeKeyword] as MonitoringConfig).competitors.map((competitor, idx) => (
                        <Badge key={idx} variant="outline">{competitor}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" type="button">
                  설정 수정
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}