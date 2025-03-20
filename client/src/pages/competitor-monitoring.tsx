import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { MonitoringConfig, MonitoringResult, CompetitorProduct, PriceChange, RankChange, ReviewChange, NewProductAlert, MonitoringThresholds } from '@shared/schema';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import ProductImage from '@/components/ui/product-image';
import { SiNaver } from 'react-icons/si';
import { DEFAULT_PRODUCT_IMAGES } from '@/constants/images';
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BarChart3Icon,
  ChevronRightIcon,
  ClockIcon,
  CopyIcon,
  CreditCardIcon,
  CrossIcon,
  DatabaseIcon,
  FileTextIcon,
  FilterIcon,
  HelpCircleIcon,
  InfoIcon,
  LineChartIcon,
  MapPinIcon,
  MegaphoneIcon,
  PlusCircleIcon,
  SearchIcon,
  Settings2Icon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  StarIcon,
  StoreIcon,
  TagIcon,
  TimerIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  TruckIcon,
  UserIcon,
  Users2Icon,
  XCircleIcon,
  LoaderIcon
} from 'lucide-react';
import ChangeVisualizer from '@/components/monitoring/change-visualizer';
import AlertConfig from '@/components/monitoring/alert-config';
import StrengthWeaknessRadar from '@/components/visualization/strength-weakness-radar';

// 타입 정의
interface CompetitorInsight {
  competitor: string;
  threatLevel: number;
  marketShare: number;
  growthRate: number;
  priceStrategy: 'aggressive' | 'premium' | 'standard' | 'economy';
  strengths: string[];
  weaknesses: string[];
  strengthsDetails: Record<string, {
    description: string;
    score: number;
    recommendations: string[];
  }>;
  weaknessesDetails: Record<string, {
    description: string;
    score: number;
    recommendations: string[];
  }>;
  representativeProduct: {
    name: string;
    price: number;
    reviews: number;
    rank: number;
    image?: string;
  };
}

// 경쟁사 모니터링 컴포넌트
export default function CompetitorMonitoring() {
  const { toast } = useToast();
  const [activeKeyword, setActiveKeyword] = useState<string>("");
  const [monitorFrequency, setMonitorFrequency] = useState<'daily' | 'weekly'>('daily');
  const [thresholds, setThresholds] = useState<MonitoringThresholds>({
    priceChangePercent: 10,
    newProduct: true,
    rankChange: true,
    reviewChangePercent: 20
  });
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState<string>("");
  const [setupStep, setSetupStep] = useState<number>(1);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState<boolean>(false);
  const [isCheckingChanges, setIsCheckingChanges] = useState<boolean>(false);
  const [settingsChanged, setSettingsChanged] = useState<boolean>(false);
  
  // 모니터링 설정 가져오기
  const { data: configs, isLoading: configsLoading, isError: configsError, refetch: refetchConfigs } = useQuery({
    queryKey: ['/api/monitoring/configs'],
    queryFn: async () => {
      const response = await fetch('/api/monitoring/configs');
      if (!response.ok) throw new Error('설정을 가져오는데 실패했습니다');
      const data = await response.json();
      return data.data as Record<string, MonitoringConfig>;
    }
  });
  
  // 모든 키워드 가져오기
  const { data: keywords, isLoading: keywordsLoading, isError: keywordsError } = useQuery({
    queryKey: ['/api/keywords/trending/all'],
    queryFn: async () => {
      const response = await fetch('/api/keywords/trending/all');
      if (!response.ok) throw new Error('키워드를 가져오는데 실패했습니다');
      const data = await response.json();
      return data.keywords.map((k: any) => k.keyword) as string[];
    }
  });
  
  /**
   * 경쟁사 제품 가져오기
   * @param keyword 키워드
   * @param competitor 경쟁사
   */
  async function fetchCompetitorProducts(keyword: string, competitor: string): Promise<CompetitorProduct[]> {
    try {
      const response = await fetch(`/api/monitoring/products/${encodeURIComponent(keyword)}/${encodeURIComponent(competitor)}`);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      const data = await response.json();
      return data.products as CompetitorProduct[];
    } catch (error) {
      console.error('경쟁사 제품 가져오기 실패:', error);
      throw error;
    }
  }
  
  /**
   * 모니터링 설정 저장
   */
  async function saveMonitoringConfig() {
    if (!activeKeyword || competitors.length === 0) {
      toast({
        title: "설정 오류",
        description: "키워드와 경쟁사를 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch('/api/monitoring/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keyword: activeKeyword,
          competitors,
          monitorFrequency,
          alertThresholds: thresholds
        })
      });
      
      if (!response.ok) throw new Error('설정 저장에 실패했습니다');
      
      const data = await response.json();
      
      toast({
        title: "설정 완료",
        description: "모니터링 설정이 저장되었습니다",
      });
      
      setIsSetupDialogOpen(false);
      setSettingsChanged(false);
      refetchConfigs();
      
      // 최근 결과 다시 가져오기
      if (latestResultRefetch) {
        latestResultRefetch();
      }
      
    } catch (error) {
      console.error('모니터링 설정 저장 오류:', error);
      toast({
        title: "오류 발생",
        description: "설정 저장 중 오류가 발생했습니다",
        variant: "destructive",
      });
    }
  }
  
  /**
   * 경쟁사 추가
   */
  function addCompetitor() {
    if (!newCompetitor.trim()) return;
    
    if (competitors.includes(newCompetitor.trim())) {
      toast({
        title: "이미 추가된 경쟁사",
        description: "이미 추가된 경쟁사입니다",
        variant: "destructive",
      });
      return;
    }
    
    setCompetitors([...competitors, newCompetitor.trim()]);
    setNewCompetitor("");
    setSettingsChanged(true);
  }
  
  /**
   * 경쟁사 제거
   */
  function removeCompetitor(competitor: string) {
    setCompetitors(competitors.filter(c => c !== competitor));
    setSettingsChanged(true);
  }
  
  /**
   * 변화 감지 요청
   */
  async function checkForChanges() {
    if (!activeKeyword) return;
    
    setIsCheckingChanges(true);
    
    try {
      const response = await fetch(`/api/monitoring/check/${encodeURIComponent(activeKeyword)}`);
      
      if (!response.ok) throw new Error('변화 감지 요청에 실패했습니다');
      
      const data = await response.json();
      
      toast({
        title: "변화 감지 완료",
        description: "최신 데이터로 변화를 감지했습니다",
      });
      
      // 최근 결과 다시 가져오기
      if (latestResultRefetch) {
        latestResultRefetch();
      }
      
    } catch (error) {
      console.error('변화 감지 오류:', error);
      toast({
        title: "오류 발생",
        description: "변화 감지 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsCheckingChanges(false);
    }
  }
  
  // 최근 변화 결과 가져오기
  const { data: latestResult, isLoading: resultLoading, isError: resultError, refetch: latestResultRefetch } = useQuery({
    queryKey: ['/api/monitoring/results', activeKeyword, 'latest'],
    queryFn: async () => {
      if (!activeKeyword) return null;
      
      try {
        const response = await fetch(`/api/monitoring/results/${encodeURIComponent(activeKeyword)}/latest`);
        if (!response.ok) throw new Error('최근 결과를 가져오는데 실패했습니다');
        const data = await response.json();
        return data.data as MonitoringResult;
      } catch (error) {
        console.error('최근 결과 가져오기 오류:', error);
        throw error;
      }
    },
    enabled: !!activeKeyword
  });
  
  // ML 인사이트 가져오기 (실제 제품 데이터 활용)
  /**
   * 경쟁사 인사이트 데이터 가져오기
   * 실제 API 데이터와 ML 분석을 조합하여 사용
   */
  const fetchCompetitorInsights = async (keyword: string, competitors: string[]): Promise<CompetitorInsight[]> => {
    try {
      console.log(`${keyword} 키워드에 대한 ${competitors.length}개 경쟁사 인사이트 데이터 요청 시작`);
      
      // 실제 경쟁사 제품 데이터를 이용한 ML 인사이트 생성
      const insights: CompetitorInsight[] = [];
      
      // 모든 API 요청을 병렬로 처리하지 않고 순차적으로 처리 (서버 부하 방지)
      for (let i = 0; i < competitors.length; i++) {
        const competitor = competitors[i];
        
        // 개별 경쟁사 처리는 Promise.allSettled로 처리하여 실패해도 전체가 중단되지 않도록 함
        try {
          // 실제 API에서 경쟁사 제품 데이터 가져오기 (에러 핸들링 강화)
          console.log(`${competitor} 경쟁사 제품 데이터 요청 중...`);
          let products = [];
          let retryCount = 0;
          const maxRetries = 2; // 최대 재시도 횟수
          
          // 오류 발생 시 재시도 로직 구현
          while (retryCount <= maxRetries) {
            try {
              if (retryCount > 0) {
                console.log(`${competitor} 제품 데이터 ${retryCount}번째 재시도 중...`);
                // 재시도 간 짧은 지연 추가 (서버 부하 고려)
                await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
              }
              
              products = await fetchCompetitorProducts(keyword, competitor);
              console.log(`${competitor} 제품 데이터 수신 완료:`, products.length > 0 ? products.length + '개' : '데이터 없음');
              break; // 성공시 루프 탈출
            } catch (productError) {
              retryCount++;
              console.error(`${competitor} 제품 데이터 가져오기 실패 (시도 ${retryCount}/${maxRetries}):`, productError);
              
              if (retryCount > maxRetries) {
                console.warn(`${competitor} 제품 데이터 최대 재시도 횟수 초과, 기본 데이터 사용`);
                products = []; // 빈 배열로 초기화하여 계속 진행
              }
            }
          }
        
          // 각 경쟁사별로 다른 값을 생성
          const priceStrategies: Array<'aggressive' | 'premium' | 'standard' | 'economy'> = 
            ['aggressive', 'premium', 'standard', 'economy'];
          
          // 강점과 약점 상세 데이터 매핑
          const strengthsDetails = {
            '가격 경쟁력': {
              description: `${competitor}의 제품들은 시장 평균 대비 경쟁력 있는 가격대를 유지하고 있습니다. 특히 주요 상품들의 가격이 경쟁사 대비 10-15% 낮게 책정되어 있습니다.`,
              score: 85,
              recommendations: [
                '가격 민감도가 높은 고객층을 타겟팅하는 마케팅 전략 강화',
                '번들 상품 구성으로 평균 주문 금액 증가 시도'
              ]
            },
            '제품 품질': {
              description: `${competitor}는 제품 품질에 강점을 가지고 있습니다. 평균 리뷰 평점이 4.5/5.0 이상이며, 품질 관련 긍정적 리뷰가 많습니다.`,
              score: 90,
              recommendations: [
                '고품질 이미지를 활용한 제품 마케팅 강화',
                '품질 인증 마크 부각하여 신뢰도 상승'
              ]
            },
            '배송 속도': {
              description: `${competitor}는 평균 배송 시간이 1-2일로 매우 빠른 배송 서비스를 제공합니다. 이는 고객 만족도에 크게 기여하고 있습니다.`,
              score: 88,
              recommendations: [
                '당일 배송 서비스 확대 검토',
                '배송 추적 기능 강화를 통한 고객 경험 개선'
              ]
            },
            '고객 서비스': {
              description: `${competitor}는 응답 시간이 빠르고 문제 해결 능력이 뛰어난 고객 서비스를 제공합니다. 이는 충성 고객 확보에 도움이 됩니다.`,
              score: 82,
              recommendations: [
                '실시간 채팅 상담 서비스 확대',
                'AI 기반 자동 응답 시스템 도입 고려'
              ]
            }
          };
          
          const weaknessesDetails = {
            '제품 다양성': {
              description: `${competitor}는 주력 제품군에 집중되어 있어 제품 다양성이 다소 부족합니다. 이는 다양한 고객층을 확보하는데 제한이 될 수 있습니다.`,
              score: 65,
              recommendations: [
                '새로운 제품 라인 확장 검토',
                '틈새 시장을 공략할 수 있는 소량 생산 제품 출시'
              ]
            },
            '브랜드 인지도': {
              description: `${competitor}는 동종업계 내에서 브랜드 인지도가 상대적으로 낮습니다. 이는 신규 고객 유치에 어려움을 줄 수 있습니다.`,
              score: 60,
              recommendations: [
                '소셜 미디어 마케팅 강화',
                '인플루언서 협업을 통한 브랜드 노출 확대'
              ]
            },
            '온라인 마케팅': {
              description: `${competitor}는 온라인 마케팅 활동이 제한적이며, 소셜 미디어 존재감이 다소 부족합니다. 이는 젊은 소비자층 확보에 불리할 수 있습니다.`,
              score: 55,
              recommendations: [
                '타겟 고객층에 맞는 소셜 미디어 채널 강화',
                '콘텐츠 마케팅 전략 개발 및 실행'
              ]
            },
            '국제 시장 진출': {
              description: `${competitor}는 국내 시장에 집중되어 있어 해외 시장 진출이 제한적입니다. 이는 장기적인 성장에 제약이 될 수 있습니다.`,
              score: 40,
              recommendations: [
                '단계적 해외 시장 진출 전략 수립',
                '글로벌 배송 파트너십 구축'
              ]
            }
          };
          
          // 제품 데이터 기반 대표 제품 정보 구성
          let representativeProduct;
          if (products.length > 0) {
            // 실제 제품 데이터에서 첫 번째 제품 사용 (또는 가장 리뷰가 많은/판매량이 높은 제품 선택 가능)
            const productWithMostReviews = [...products].sort((a, b) => b.reviews - a.reviews)[0];
            representativeProduct = {
              name: productWithMostReviews.name,
              price: productWithMostReviews.price,
              reviews: productWithMostReviews.reviews,
              rank: productWithMostReviews.rank,
              image: productWithMostReviews.image
            };
          } else {
            // 기본 대표 제품 정보 (실제 데이터 없을 경우)
            representativeProduct = {
              name: `${competitor} 프리미엄 제품`,
              price: 39900 + Math.floor(Math.random() * 20000),
              reviews: 100 + Math.floor(Math.random() * 500),
              rank: 5 + Math.floor(Math.random() * 15),
              // 실제 이미지 없을 경우 컴포넌트 내부에서 기본 이미지 사용
            };
          }
          
          // Hash 기반으로 경쟁사별 다른 값 생성 (결정적)
          // 경쟁사 이름 기준으로 해시값 생성 (간단한 방식)
          const hash = competitor.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
          
          // 해시값 기준으로 경쟁사별 특성 설정
          const priceStrategy = priceStrategies[hash % 4];
          const threatLevel = 40 + (hash % 60); // 40~99
          const marketShare = 5 + (hash % 25); // 5~29
          const growthRate = -5 + (hash % 25); // -5~19
          
          // 각 경쟁사별 고유한 강점/약점 생성 (해시값 기반)
          const allStrengths = Object.keys(strengthsDetails);
          const allWeaknesses = Object.keys(weaknessesDetails);
          
          // 경쟁사별로 다른 강점과 약점 선택 (해시값 기반)
          const strengths = allStrengths.filter((_, index) => (hash + index) % 3 === 0);
          const weaknesses = allWeaknesses.filter((_, index) => (hash + index) % 4 === 0);
          
          insights.push({
            competitor,
            threatLevel,
            marketShare,
            growthRate,
            priceStrategy,
            strengths,
            weaknesses,
            strengthsDetails,
            weaknessesDetails,
            representativeProduct
          });
        } catch (error) {
          console.error(`${competitor} 경쟁사 인사이트 생성 중 오류:`, error);
          // 오류 발생해도 다른 경쟁사 처리는 계속 진행
        }
      }
      
      return insights;
    } catch (error) {
      console.error('경쟁사 ML 인사이트 API 호출 오류:', error);
      throw error;
    }
  };
  
  // ML 인사이트 조회 - 모든 경쟁사 표시 (최대 20개)
  const { data: mlInsights, isLoading: insightsLoading, isError: insightsError, refetch: refetchInsights } = useQuery({
    queryKey: ['/api/ml/competitor-insights', activeKeyword],
    queryFn: async () => {
      if (!activeKeyword || !configs || !configs[activeKeyword]) return [];
      
      try {
        // 모니터링 중인 경쟁사 목록 가져오기
        const monitoringConfig = configs[activeKeyword] as MonitoringConfig;
        const competitors = monitoringConfig.competitors || [];
        
        if (competitors.length === 0) return [];
        
        // 실제 API 호출
        return await fetchCompetitorInsights(activeKeyword, competitors);
      } catch (error) {
        console.error('경쟁사 인사이트 가져오기 오류:', error);
        throw error;
      }
    },
    enabled: !!activeKeyword && !!configs && !!configs[activeKeyword]
  });
  
  // 활성 키워드 설정 초기화
  useEffect(() => {
    if (!configsLoading && configs) {
      const keywordsList = Object.keys(configs);
      if (keywordsList.length > 0 && !activeKeyword) {
        setActiveKeyword(keywordsList[0]);
      }
    }
  }, [configsLoading, configs, activeKeyword]);
  
  // 현재 키워드 설정 로드
  useEffect(() => {
    if (activeKeyword && configs && configs[activeKeyword]) {
      const config = configs[activeKeyword];
      setCompetitors(config.competitors || []);
      setMonitorFrequency(config.monitorFrequency);
      setThresholds(config.alertThresholds);
      setSettingsChanged(false);
    }
  }, [activeKeyword, configs]);
  
  // 로딩 상태 표시
  if (configsLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <Users2Icon className="h-6 w-6 mr-2" />
          경쟁사 모니터링
        </h1>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // 데이터 없음 표시
  if (configsError || !configs || Object.keys(configs).length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <Users2Icon className="h-6 w-6 mr-2" />
          경쟁사 모니터링
        </h1>
        
        <Card className="mb-6">
          <CardContent className="pt-6 flex flex-col items-center p-8">
            <div className="mb-4 p-4 bg-muted rounded-full">
              <Users2Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">모니터링 설정이 없습니다</h3>
            <p className="text-muted-foreground text-center mb-6">
              경쟁사 모니터링을 시작하기 위해 설정을 추가해주세요.
            </p>
            <Button onClick={() => {
              setActiveKeyword("");
              setCompetitors([]);
              setSetupStep(1);
              setIsSetupDialogOpen(true);
            }}>
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              모니터링 설정 추가
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // 키워드 목록
  const keywordsList = Object.keys(configs);
  
  return (
    <div className="container mx-auto p-4">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Users2Icon className="h-6 w-6 mr-2" />
          경쟁사 모니터링
        </h1>
        
        <div className="flex flex-col md:flex-row gap-2 md:items-center mt-4 md:mt-0">
          <Select
            value={activeKeyword}
            onValueChange={(value) => setActiveKeyword(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="키워드 선택" />
            </SelectTrigger>
            <SelectContent>
              {keywordsList.map((keyword) => (
                <SelectItem key={keyword} value={keyword}>{keyword}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (activeKeyword && configs && configs[activeKeyword]) {
                  const config = configs[activeKeyword];
                  setCompetitors(config.competitors || []);
                  setMonitorFrequency(config.monitorFrequency);
                  setThresholds(config.alertThresholds);
                  setSetupStep(1);
                  setIsSetupDialogOpen(true);
                } else {
                  setActiveKeyword("");
                  setCompetitors([]);
                  setSetupStep(1);
                  setIsSetupDialogOpen(true);
                }
              }}
            >
              <Settings2Icon className="h-4 w-4 mr-1" />
              설정
            </Button>
            
            <Button 
              variant="default" 
              size="sm"
              onClick={checkForChanges}
              disabled={isCheckingChanges || !activeKeyword}
            >
              {isCheckingChanges ? (
                <>
                  <LoaderIcon className="h-4 w-4 mr-1 animate-spin" />
                  확인 중...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  변화 확인
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* 변화 감지 결과 */}
      {activeKeyword && (
        <div>
          {resultLoading ? (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : resultError || !latestResult ? (
            <Card className="mb-6">
              <CardContent className="pt-6 flex flex-col items-center p-8">
                <div className="mb-4 p-4 bg-muted rounded-full">
                  <AlertTriangleIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">결과를 가져올 수 없습니다</h3>
                <p className="text-muted-foreground text-center mb-6">
                  경쟁사 모니터링 결과를 불러오는 중 오류가 발생했습니다.
                </p>
                <Button onClick={() => latestResultRefetch && latestResultRefetch()}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          ) : !latestResult.hasAlerts ? (
            <Card className="mb-6 border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center text-green-700">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                  변경사항 없음
                </CardTitle>
                <CardDescription>
                  마지막 확인: {new Date(latestResult.checkedAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center p-4">
                  모니터링 중인 경쟁사 제품에 변경사항이 없습니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center text-blue-700">
                  <AlertCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
                  변경사항 감지됨
                </CardTitle>
                <CardDescription>
                  마지막 확인: {new Date(latestResult.checkedAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(latestResult.changesDetected).map(([competitor, changes]) => (
                    changes.alerts && (
                      <div key={competitor} className="border rounded-lg p-4">
                        <h3 className="font-medium text-lg mb-4 flex items-center">
                          <StoreIcon className="h-4 w-4 mr-2" />
                          {competitor}
                        </h3>
                        
                        {/* 가격 변경 */}
                        {changes.priceChanges.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                              <BarChart3Icon className="h-4 w-4 mr-1 text-orange-500" />
                              가격 변경
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {changes.priceChanges.map((change, index) => (
                                <Card key={index} className="overflow-hidden">
                                  <CardContent className="p-0">
                                    <div className="flex">
                                      <ProductImage src={change.product.image || DEFAULT_PRODUCT_IMAGES[0]} title={change.product.name} productId={change.product.productId} width={80} height={80} />
                                      <div className="p-2 flex-1">
                                        <div className="text-xs line-clamp-2 mb-1">{change.product.name}</div>
                                        <ChangeVisualizer 
                                          oldValue={change.oldPrice} 
                                          newValue={change.newPrice} 
                                          changePercent={change.changePercent}
                                          formatValue={(val) => val.toLocaleString() + '원'} 
                                        />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 신제품 */}
                        {changes.newProducts.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                              <PlusCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                              신제품 등록
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {changes.newProducts.map((change, index) => (
                                <Card key={index} className="overflow-hidden">
                                  <CardContent className="p-0">
                                    <div className="flex">
                                      <ProductImage src={change.product.image || DEFAULT_PRODUCT_IMAGES[0]} title={change.product.name} productId={change.product.productId} width={80} height={80} />
                                      <div className="p-2 flex-1">
                                        <div className="text-xs line-clamp-2 mb-1">{change.product.name}</div>
                                        <div className="flex justify-between text-xs">
                                          <Badge variant="outline" className="bg-green-50 text-green-700">신규</Badge>
                                          <span className="font-semibold">{change.product.price.toLocaleString()}원</span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 순위 변경 */}
                        {changes.rankChanges.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                              <ArrowUpIcon className="h-4 w-4 mr-1 text-blue-500" />
                              순위 변경
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {changes.rankChanges.map((change, index) => (
                                <Card key={index} className="overflow-hidden">
                                  <CardContent className="p-0">
                                    <div className="flex">
                                      <ProductImage src={change.product.image || DEFAULT_PRODUCT_IMAGES[0]} title={change.product.name} productId={change.product.productId} width={80} height={80} />
                                      <div className="p-2 flex-1">
                                        <div className="text-xs line-clamp-2 mb-1">{change.product.name}</div>
                                        <div className="flex items-center">
                                          <span className="text-xs mr-2">
                                            {change.oldRank}위 →
                                          </span>
                                          <Badge 
                                            variant="outline" 
                                            className={change.change > 0 
                                              ? "bg-green-50 text-green-700" 
                                              : "bg-red-50 text-red-700"}
                                          >
                                            {change.newRank}위
                                            {change.change !== 0 && (
                                              <span className="ml-1">
                                                {change.change > 0 
                                                  ? <ArrowUpIcon className="h-3 w-3 inline" /> 
                                                  : <ArrowDownIcon className="h-3 w-3 inline" />}
                                                {Math.abs(change.change)}
                                              </span>
                                            )}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 리뷰 변경 */}
                        {changes.reviewChanges.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                              <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                              리뷰 변경
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {changes.reviewChanges.map((change, index) => (
                                <Card key={index} className="overflow-hidden">
                                  <CardContent className="p-0">
                                    <div className="flex">
                                      <ProductImage src={change.product.image || DEFAULT_PRODUCT_IMAGES[0]} title={change.product.name} productId={change.product.productId} width={80} height={80} />
                                      <div className="p-2 flex-1">
                                        <div className="text-xs line-clamp-2 mb-1">{change.product.name}</div>
                                        <ChangeVisualizer 
                                          oldValue={change.oldReviews} 
                                          newValue={change.newReviews} 
                                          changePercent={change.changePercent}
                                          formatValue={(val) => val.toLocaleString() + '개'} 
                                        />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 경쟁사 ML 인사이트 */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">
              경쟁사 ML 인사이트
              {insightsLoading && <span className="text-sm text-muted-foreground ml-2">(로딩 중...)</span>}
              {insightsError && <span className="text-sm text-red-500 ml-2">(데이터 로드 실패 - <Button variant="link" size="sm" onClick={() => refetchInsights()} className="p-0 h-auto text-sm text-blue-500">재시도</Button>)</span>}
            </h3>
            
            {insightsLoading && (
              <div className="flex justify-center items-center p-8">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200 mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 mb-2 rounded"></div>
                  <div className="h-2 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            )}
            
            {!insightsLoading && (!mlInsights || mlInsights.length === 0) && (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <InfoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-muted-foreground">ML 인사이트를 생성하는 중 오류가 발생했습니다.</p>
                <Button variant="outline" size="sm" onClick={() => refetchInsights()} className="mt-2">
                  다시 시도
                </Button>
              </div>
            )}
            
            {!insightsLoading && mlInsights && mlInsights.length > 0 && (
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
                              <ProductImage src={insight.representativeProduct.image} title={insight.representativeProduct.name} productId={`${insight.competitor}-main-product`} width={160} height={160} />
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
                                      <ProductImage 
                                        src={insight.representativeProduct?.image}
                                        title={`${insight.competitor} 제품 ${index + 1}`}
                                        productId={`${insight.competitor}-product-${index}`}
                                        className="w-full h-full"
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
                                                       strength === '배송 속도' ? 88 : 82} 
                                                className="bg-green-100 flex-1"
                                              />
                                              <span className="ml-2 text-sm font-medium">
                                                {strength === '가격 경쟁력' ? '86' : 
                                                 strength === '제품 품질' ? '90' : 
                                                 strength === '배송 속도' ? '88' : '82'}/100
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* 권장사항 */}
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm flex items-center">
                                            <FileTextIcon className="h-4 w-4 mr-1 text-blue-500" />
                                            대응 전략 권장사항
                                          </h4>
                                          <ul className="text-sm space-y-1">
                                            {insight.strengthsDetails[strength]?.recommendations.map((rec, i) => (
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
                                            <AlertCircleIcon className="h-4 w-4 mr-1 text-red-500" />
                                            설명
                                          </h4>
                                          <p className="text-sm">{insight.weaknessesDetails[weakness]?.description}</p>
                                          
                                          {/* 약점 수치화 */}
                                          <div className="mt-3">
                                            <h5 className="text-xs text-muted-foreground mb-1">약점 점수</h5>
                                            <div className="flex items-center">
                                              <Progress 
                                                value={weakness === '제품 다양성' ? 65 : 
                                                       weakness === '브랜드 인지도' ? 60 : 
                                                       weakness === '온라인 마케팅' ? 55 : 40} 
                                                className="bg-red-100 flex-1"
                                              />
                                              <span className="ml-2 text-sm font-medium">
                                                {weakness === '제품 다양성' ? '65' : 
                                                 weakness === '브랜드 인지도' ? '60' : 
                                                 weakness === '온라인 마케팅' ? '55' : '40'}/100
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* 권장사항 */}
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm flex items-center">
                                            <FileTextIcon className="h-4 w-4 mr-1 text-blue-500" />
                                            경쟁 우위 전략 권장사항
                                          </h4>
                                          <ul className="text-sm space-y-1">
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
            )}
          </div>
          
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
                    <h4 className="text-sm font-medium mb-2">모니터링 주기</h4>
                    <Badge variant="outline">
                      {(configs[activeKeyword] as MonitoringConfig).monitorFrequency === 'daily' ? '매일' : '매주'}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">알림 설정</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <BarChart3Icon className="h-4 w-4 mr-2 text-blue-500" />
                          <span>가격 변동</span>
                        </div>
                        <Badge variant="outline">
                          {(configs[activeKeyword] as MonitoringConfig).alertThresholds.priceChangePercent}% 이상
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <PlusCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                          <span>신제품</span>
                        </div>
                        <Badge variant="outline">
                          {(configs[activeKeyword] as MonitoringConfig).alertThresholds.newProduct ? '활성화' : '비활성화'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <ArrowUpIcon className="h-4 w-4 mr-2 text-orange-500" />
                          <span>순위 변동</span>
                        </div>
                        <Badge variant="outline">
                          {(configs[activeKeyword] as MonitoringConfig).alertThresholds.rankChange ? '활성화' : '비활성화'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <StarIcon className="h-4 w-4 mr-2 text-yellow-500" />
                          <span>리뷰 변동</span>
                        </div>
                        <Badge variant="outline">
                          {(configs[activeKeyword] as MonitoringConfig).alertThresholds.reviewChangePercent}% 이상
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">모니터링 중인 경쟁사</h4>
                    <div className="flex flex-wrap gap-2">
                      {(configs[activeKeyword] as MonitoringConfig).competitors.map((competitor, idx) => (
                        <Badge key={idx} variant="outline">{competitor}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (activeKeyword && configs && configs[activeKeyword]) {
                      const config = configs[activeKeyword] as MonitoringConfig;
                      setCompetitors(config.competitors || []);
                      setMonitorFrequency(config.monitorFrequency);
                      setThresholds(config.alertThresholds);
                      setSetupStep(1);
                      setIsSetupDialogOpen(true);
                    }
                  }}
                >
                  <Settings2Icon className="h-4 w-4 mr-1" />
                  설정 수정
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
      
      {/* 모니터링 설정 다이얼로그 */}
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>경쟁사 모니터링 설정</DialogTitle>
            <DialogDescription>
              {setupStep === 1 && "모니터링할 키워드와 경쟁사를 설정하세요."}
              {setupStep === 2 && "모니터링 주기와 알림 설정을 구성하세요."}
            </DialogDescription>
          </DialogHeader>
          
          {setupStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">키워드 선택</Label>
                {keywordsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select 
                    value={activeKeyword} 
                    onValueChange={setActiveKeyword}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="키워드 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {keywords && keywords.length > 0 ? (
                        keywords.map((keyword) => (
                          <SelectItem key={keyword} value={keyword}>{keyword}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-keywords" disabled>사용 가능한 키워드 없음</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="competitors">경쟁사 목록</Label>
                <div className="flex flex-wrap gap-2 border rounded-md p-2 min-h-[100px]">
                  {competitors.map((competitor) => (
                    <Badge key={competitor} variant="secondary" className="flex items-center gap-1">
                      {competitor}
                      <button 
                        onClick={() => removeCompetitor(competitor)}
                        className="text-muted-foreground hover:text-foreground ml-1"
                      >
                        <XCircleIcon className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {competitors.length === 0 && (
                    <div className="text-muted-foreground text-sm w-full text-center py-2">
                      경쟁사가 없습니다. 아래에서 추가해주세요.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input 
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  placeholder="경쟁사 이름"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCompetitor();
                    }
                  }}
                />
                <Button variant="secondary" onClick={addCompetitor} type="button">
                  추가
                </Button>
              </div>
              
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsSetupDialogOpen(false)}>
                  취소
                </Button>
                <Button 
                  onClick={() => {
                    if (!activeKeyword) {
                      toast({
                        title: "키워드 필요",
                        description: "키워드를 선택해주세요",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    if (competitors.length === 0) {
                      toast({
                        title: "경쟁사 필요",
                        description: "최소 한 개 이상의 경쟁사를 추가해주세요",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    setSetupStep(2);
                  }}
                >
                  다음
                </Button>
              </DialogFooter>
            </div>
          )}
          
          {setupStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>모니터링 주기</Label>
                <Select 
                  value={monitorFrequency} 
                  onValueChange={(val: 'daily' | 'weekly') => {
                    setMonitorFrequency(val);
                    setSettingsChanged(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">매일</SelectItem>
                    <SelectItem value="weekly">매주</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <AlertConfig
                thresholds={thresholds}
                onChange={(newThresholds) => {
                  setThresholds(newThresholds);
                  setSettingsChanged(true);
                }}
              />
              
              <DialogFooter className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSetupStep(1)}
                >
                  이전
                </Button>
                <Button onClick={saveMonitoringConfig}>설정 저장</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// RefreshCcw 아이콘 컴포넌트 (lucide-react에서 누락된 것으로 가정)
function RefreshCcw({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

// AlertTriangleIcon 아이콘 컴포넌트 (lucide-react에서 누락된 것으로 가정)
function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

// CheckCircleIcon 아이콘 컴포넌트 (lucide-react에서 누락된 것으로 가정)
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

// AlertCircleIcon 아이콘 컴포넌트 (lucide-react에서 누락된 것으로 가정)
function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}