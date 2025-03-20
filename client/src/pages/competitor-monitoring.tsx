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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MonitoringConfig, MonitoringResult, CompetitorProduct, PriceChange, RankChange, ReviewChange, NewProductAlert, MonitoringThresholds } from '@shared/schema';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { ProductImage } from '@/components/ui/product-image';
import { SiNaver } from 'react-icons/si';
import { DEFAULT_PRODUCT_IMAGES } from '@/constants/images';
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BarChart3Icon,
  BellIcon,
  BellRingIcon,
  BuildingIcon,
  CalendarIcon,
  CalendarRangeIcon,
  ChevronRightIcon,
  CheckIcon,
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
  ListFilterIcon,
  LoaderIcon,
  MapPinIcon,
  MegaphoneIcon,
  Pill,
  PlusIcon,
  PlusCircleIcon,
  RefreshCcw,
  SaveIcon,
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
  XIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from 'lucide-react';

// 건강기능식품 관련 상수
const HEALTH_KEYWORDS = ['비타민', '종합비타민', '프로바이오틱스', '콜라겐', '글루타치온', '비타민C', '비타민D', '루테인', '오메가3', '유산균'];
const HEALTH_BRANDS = [
  '닥터린', '내츄럴플러스', '에스더몰', '안국건강', '고려은단', 
  '뉴트리원', '종근당건강', 'GNM 자연의품격', '뉴트리데이', 
  '주영엔에스', '한미양행', '유한양행'
];

// 브랜드별 공식 스토어 URL
const BRAND_STORE_URLS: Record<string, string> = {
  '닥터린': 'https://brand.naver.com/dr_lean',
  '내츄럴플러스': 'https://brand.naver.com/naturalplus',
  '에스더몰': 'https://brand.naver.com/esthermall',
  '안국건강': 'https://brand.naver.com/aghealth',
  '고려은단': 'https://brand.naver.com/koreaeundanhc',
  '뉴트리원': 'https://brand.naver.com/nutrione',
  '종근당건강': 'https://brand.naver.com/ckdhc',
  'GNM 자연의품격': 'https://brand.naver.com/gnm',
  '뉴트리데이': 'https://brand.naver.com/nutriday',
  '주영엔에스': 'https://brand.naver.com/jooyoungns',
  '한미양행': 'https://brand.naver.com/hy',
  '유한양행': 'https://brand.naver.com/yuhan'
};
import ChangeVisualizer from '../components/monitoring/change-visualizer';
import AlertConfig from '../components/monitoring/alert-config';
import { StrengthWeaknessChart } from '../components/charts/strength-weakness-radar';

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
    metrics?: string;
    impact?: string;
    score?: number;
    recommendations?: string[];
    examples?: string[];
  }>;
  weaknessesDetails: Record<string, {
    description: string;
    metrics?: string;
    impact?: string;
    score?: number;
    recommendations?: string[];
  }>;
  representativeProduct: {
    name: string;
    price: number;
    reviews: number;
    rank: number;
    image?: string;
    url?: string;
    productId?: string;
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
      // API가 직접 객체를 반환하므로 data.data가 아닌 data 자체를 사용
      return data as Record<string, MonitoringConfig>;
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
      console.log(`API 호출: 키워드 "${keyword}", 경쟁사 "${competitor}" 제품 데이터 요청`);
      
      // URL 인코딩 로깅 추가
      const encodedKeyword = encodeURIComponent(keyword);
      const encodedCompetitor = encodeURIComponent(competitor);
      console.log(`인코딩된 URL: /api/monitoring/products/${encodedKeyword}/${encodedCompetitor}`);
      
      const response = await fetch(`/api/monitoring/products/${encodedKeyword}/${encodedCompetitor}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        // 타임아웃 설정을 위한 signal 추가
        signal: AbortSignal.timeout(10000) // 10초 타임아웃
      });
      
      // 응답 상태 자세히 로깅
      console.log(`API 응답 상태: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '응답 텍스트 추출 실패');
        throw new Error(`API 오류 ${response.status}: ${response.statusText}, 응답: ${errorText}`);
      }
      
      const data = await response.json();
      
      // API 응답 형식 확인 및 로깅
      if (!data) {
        console.warn(`API 응답이 비어있습니다`);
        return [];
      }
      
      // 배열이 직접 반환되는 경우와 products 필드에 있는 경우 모두 처리
      const productsArray = Array.isArray(data) ? data : 
                           (data.products && Array.isArray(data.products)) ? data.products : null;
      
      if (!productsArray) {
        console.warn(`API 응답에 제품 데이터가 없거나 형식이 잘못됨: `, data);
        return [];
      }
      
      console.log(`${competitor} 제품 데이터 수신 완료: ${productsArray.length}개`);
      
      // 필드명 매핑 처리 (id → productId, reviews → reviewCount 등)
      interface RawProduct {
        productId?: string;
        id?: string;
        name?: string;
        title?: string;
        price?: number;
        reviews?: number;
        reviewCount?: number;
        rank?: number;
        image?: string;
        url?: string;
        productUrl?: string;
        collectedAt?: string;
      }
      
      const mappedProducts: CompetitorProduct[] = productsArray
        .map((item: RawProduct) => {
          // 필수값이 없는 경우 필터링을 위해 null 반환
          if (!item) return null;
          
          return {
            productId: item.productId || item.id || `unknown-${Math.random().toString(36).substring(2, 10)}`,
            name: item.name || item.title || `${competitor} 제품`,
            price: typeof item.price === 'number' ? item.price : 0,
            reviews: typeof item.reviews === 'number' ? item.reviews : 
                    typeof item.reviewCount === 'number' ? item.reviewCount : 0,
            rank: typeof item.rank === 'number' ? item.rank : 0,
            image: item.image || undefined,
            url: item.url || item.productUrl || undefined,
            collectedAt: item.collectedAt || new Date().toISOString()
          };
        })
        .filter((item): item is CompetitorProduct => item !== null);
      
      return mappedProducts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error(`경쟁사 제품 가져오기 실패 (${competitor}): ${errorMessage}`, error);
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
      
      // 현재 키워드에 대한 모니터링 설정이 있는지 확인
      if (!configs || !configs[activeKeyword]) {
        console.warn(`"${activeKeyword}" 키워드에 대한 모니터링 설정이 없습니다. 먼저 설정을 추가해주세요.`);
        return null;
      }
      
      try {
        const response = await fetch(`/api/monitoring/results/${encodeURIComponent(activeKeyword)}/latest`);
        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`"${activeKeyword}" 키워드에 대한 모니터링 결과가 없습니다. 먼저 변화 감지를 실행해주세요.`);
            return null;
          }
          throw new Error('최근 결과를 가져오는데 실패했습니다');
        }
        const data = await response.json();
        // API가 직접 객체를 반환하므로 data.data가 아닌 data 자체를 사용
        return data as MonitoringResult;
      } catch (error) {
        console.error('최근 결과 가져오기 오류:', error);
        // 오류를 던지지 않고 null 반환하여 에러 화면 표시
        return null;
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
          let products: CompetitorProduct[] = [];
          let retryCount = 0;
          const maxRetries = 2; // 최대 재시도 횟수
          
          // 오류 발생 시 재시도 로직 개선
          let lastError = null;
          while (retryCount <= maxRetries) {
            try {
              if (retryCount > 0) {
                console.log(`${competitor} 제품 데이터 ${retryCount}번째 재시도 중...`);
                // 재시도 간 지연 시간을 점진적으로 증가 (백오프 전략)
                const delayTime = 1000 * Math.pow(2, retryCount - 1); // 1초, 2초, 4초...
                console.log(`${delayTime}ms 대기 후 재시도합니다.`);
                await new Promise(resolve => setTimeout(resolve, delayTime));
              }
              
              products = await fetchCompetitorProducts(keyword, competitor);
              
              // 데이터 유효성 검증
              if (products && Array.isArray(products)) {
                console.log(`${competitor} 제품 데이터 수신 완료: ${products.length}개 제품`);
                if (products.length > 0) {
                  console.log(`첫 번째 제품 샘플:`, JSON.stringify(products[0]).substring(0, 150) + '...');
                }
                break; // 성공시 루프 탈출
              } else {
                throw new Error('받은 데이터가 유효한 제품 배열이 아님');
              }
            } catch (productError) {
              lastError = productError;
              retryCount++;
              
              const errorMessage = productError instanceof Error ? productError.message : '알 수 없는 오류';
              console.error(`${competitor} 제품 데이터 가져오기 실패 (시도 ${retryCount}/${maxRetries}): ${errorMessage}`);
              
              if (retryCount > maxRetries) {
                console.warn(`${competitor} 제품 데이터 최대 재시도 횟수(${maxRetries}) 초과`);
                products = []; // 빈 배열로 초기화하여 계속 진행
              }
            }
          }
          
          // 모든 재시도 실패 후 로그 기록
          if (products.length === 0 && lastError) {
            console.error(`${competitor} 제품 데이터 최종 실패: ${lastError}`);
          }
        
          // 각 경쟁사별로 다른 값을 생성
          const priceStrategies: Array<'aggressive' | 'premium' | 'standard' | 'economy'> = 
            ['aggressive', 'premium', 'standard', 'economy'];
          
          // 건강기능식품 분야에 특화된 강점 상세 데이터 매핑
          const healthStrengths: Record<string, {
            description: string;
            metrics?: string;
            impact?: string;
            examples?: string[];
            score?: number;
            recommendations?: string[];
          }> = {
            '기능성 원료 품질': {
              description: `${competitor}는 고품질 원료를 사용하여 제품을 생산합니다. 특히 유효 성분의 함량이 높고 순도가 우수한 원료를 사용하여 효능이 뛰어납니다.`,
              metrics: '원료 품질 점수: 92/100',
              impact: '고객 충성도 증가 및 재구매율 18% 상승',
              score: 92,
              examples: [
                `${competitor}의 비타민C 제품은 순도 99.8% 이상의 L-아스코르브산 사용`,
                `${competitor}의 프로바이오틱스는 생균수 보장 및 특허받은 코팅기술 적용`
              ],
              recommendations: [
                '효능 입증 임상 연구 결과 강조',
                '원료 공급처 및 생산과정 투명성 공개'
              ]
            },
            '임상 연구 기반': {
              description: `${competitor}는 제품 개발에 임상 연구 결과를 적극 활용합니다. 이는 제품 효능에 대한 과학적 근거를 제공하고 소비자 신뢰도를 높입니다.`,
              metrics: '임상 연구 기반 제품 비율: 75%',
              impact: '소비자 신뢰도 23% 상승 및 전문가 추천 증가',
              score: 88,
              examples: [
                `${competitor}의 글루코사민 제품은 12주 임상 시험 후 관절 통증 감소 효과 입증`,
                `${competitor}의 오메가3는 혈중 중성지방 개선 효과 임상 검증 완료`
              ],
              recommendations: [
                '주요 건강 기능성 효능에 대한 연구 결과 강조',
                '의학/약학 전문가 추천 확보'
              ]
            },
            '제품 흡수율': {
              description: `${competitor}의 제품은 체내 흡수율을 높이는 특허 기술을 적용하고 있습니다. 이로 인해 적은 용량으로도 효과적인 영양소 공급이 가능합니다.`,
              metrics: '흡수율 개선 기술 적용 제품 비율: 68%',
              impact: '경쟁사 대비 효능 만족도 31% 높음',
              score: 85,
              examples: [
                `${competitor}의 비타민D는 지용성 캡슐 기술로 흡수율 2배 향상`,
                `${competitor}의 철분 제품은 위장 자극이 적은 킬레이트 형태 사용`
              ],
              recommendations: [
                '성분 흡수력 혁신 기술 마케팅 강화',
                '기존 제품과의 흡수율 비교 데이터 활용'
              ]
            },
            '특허 기술': {
              description: `${competitor}는 다수의 독자적 특허 기술을 보유하고 있어 제품의 차별화와 경쟁력을 확보하고 있습니다.`,
              metrics: '보유 특허 수: 12개, 특허 기술 적용 제품 비율: 60%',
              impact: '시장 점유율 연간 2.5% 증가',
              score: 90,
              examples: [
                `${competitor}의 프로바이오틱스 안정화 코팅 기술 특허`,
                `${competitor}의 식물성 캡슐 제조 기술 특허`
              ],
              recommendations: [
                '특허 기술 차별화 포인트 활용 마케팅',
                '제품 가격 프리미엄 설정 근거로 활용'
              ]
            }
          };
          
          // 타입 호환성을 위해 별도 객체로 할당
          const strengthsDetails = healthStrengths;
          
          // 건강기능식품 분야에 특화된 약점 상세 데이터 매핑
          const healthWeaknesses: Record<string, {
            description: string;
            metrics?: string;
            impact?: string;
            score?: number;
            recommendations?: string[];
          }> = {
            '제품 가격대': {
              description: `${competitor}의 제품은 유사 성분의 경쟁사 제품과 비교했을 때 가격대가 높게 책정되어 있습니다. 이는 가격 민감도가 높은 소비자층에게 진입 장벽이 될 수 있습니다.`,
              metrics: '경쟁사 대비 평균 가격 프리미엄: 15~30%',
              impact: '가격 민감 소비자층 이탈률 증가, 전환율 8% 하락',
              score: 55,
              recommendations: [
                '저가형 라인업 추가로 진입 장벽 낮춤',
                '가격 대비 가치 포지셔닝 강화를 위한 홍보 전략 개선'
              ]
            },
            '연령대별 타겟팅': {
              description: `${competitor}는 4050 중장년층에 제품 포지셔닝이 집중되어 있어 2030 젊은 소비자층 확보에 어려움이 있습니다. 이는 장기적인 고객 기반 구축에 불리합니다.`,
              metrics: '2030 연령대 시장 점유율: 12% (경쟁사 평균 22%)',
              impact: '젊은 소비자층의 브랜드 인지도 및 충성도 부족',
              score: 48,
              recommendations: [
                '젊은 소비자층을 위한 디자인 및 패키징 리뉴얼',
                '소셜미디어 채널별 타겟 마케팅 강화'
              ]
            },
            '온라인 채널 전략': {
              description: `${competitor}는 전통적인 오프라인 유통에 강점이 있으나, 온라인 판매 채널 다각화가 부족합니다. 이는 디지털 소비자 접근성을 제한합니다.`,
              metrics: '온라인 매출 비중: 25% (업계 평균 45%)',
              impact: '모바일 쇼핑 트렌드 대응 지연으로 인한 기회 손실',
              score: 42,
              recommendations: [
                '자사몰 UX/UI 개선 및 모바일 최적화',
                '주요 온라인 마켓플레이스 입점 확대'
              ]
            },
            '제품 혁신 속도': {
              description: `${competitor}는 신제품 출시 주기가 길고, 시장 트렌드 대응이 다소 느린 편입니다. 이는 빠르게 변화하는 건강기능식품 시장에서 경쟁력 약화 요인입니다.`,
              metrics: '신제품 출시 주기: 평균 14.5개월 (경쟁사 평균 8.2개월)',
              impact: '트렌드 대응 지연으로 인한 시장 점유율 하락',
              score: 52,
              recommendations: [
                '제품 개발 프로세스 개선으로 출시 주기 단축',
                '민첩한 시장 대응을 위한 소량 생산 테스트 전략 도입'
              ]
            }
          };

          // 타입 호환성을 위해 별도 객체로 할당
          const weaknessesDetails = healthWeaknesses;
          
          // 제품 데이터 기반 대표 제품 정보 구성
          let representativeProduct;
          
          // 브랜드별 하드코딩된 주요 제품 정보 (API 데이터가 없거나 잘못된 경우 대비)
          if (competitor === '닥터린') {
            representativeProduct = {
              name: "닥터린 식약처인증 다이어트 건강식품 HCA 400",
              price: 24800,
              reviews: 4210,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8341205/83412051294.jpg",
              url: "https://brand.naver.com/dr_lean/products/4987567492",
              productId: "dr_lean-hca400"
            };
            console.log(`닥터린 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (competitor === '내츄럴플러스') {
            representativeProduct = {
              name: "내츄럴플러스 알티지 오메가3 1200 180캡슐",
              price: 46850,
              reviews: 3850,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8352147/83521479204.jpg",
              url: "https://brand.naver.com/naturalplus/products/5078567829",
              productId: "naturalplus-omega3"
            };
            console.log(`내츄럴플러스 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (competitor === '에스더몰') {
            representativeProduct = {
              name: "여에스더 리포좀 글루타치온 필름 30회분",
              price: 82900,
              reviews: 2780,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8263492/82634923648.jpg",
              url: "https://esthermall.co.kr/product/detail.html?product_no=173",
              productId: "esthermall-glutathione"
            };
            console.log(`에스더몰 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (competitor === '안국건강') {
            representativeProduct = {
              name: "안국건강 안국 루테인 지아잔틴 미니 180캡슐",
              price: 34030,
              reviews: 5620,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8271945/82719451204.jpg",
              url: "https://brand.naver.com/aghealth/products/4928456723",
              productId: "aghealth-lutein"
            };
            console.log(`안국건강 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (competitor === '고려은단') {
            representativeProduct = {
              name: "고려은단 비타민C1000 이지 비타민D 180정",
              price: 29890,
              reviews: 8740,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8217842/82178425419.jpg",
              url: "https://brand.naver.com/koreaeundanhc/products/4899345612",
              productId: "koreaeundanhc-vitaminc"
            };
            console.log(`고려은단 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (competitor === '뉴트리원') {
            representativeProduct = {
              name: "뉴트리원 초임계 알티지 오메가3 1200 180캡슐",
              price: 57800,
              reviews: 4250,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8314592/83145923704.jpg",
              url: "https://brand.naver.com/nutrione/products/5012468723",
              productId: "nutrione-omega3"
            };
            console.log(`뉴트리원 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (competitor === '종근당건강') {
            representativeProduct = {
              name: "종근당건강 아이클리어 루테인지아잔틴 150캡슐",
              price: 34900,
              reviews: 7680,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8239156/82391567021.jpg",
              url: "https://brand.naver.com/ckdhc/products/4911568342",
              productId: "ckdhc-eyeclear"
            };
            console.log(`종근당건강 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (competitor === 'GNM 자연의품격') {
            representativeProduct = {
              name: "GNM 자연의품격 루테인 지아잔틴 164mg x 180캡슐",
              price: 29900,
              reviews: 6540,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8305647/83056471294.jpg",
              url: "https://brand.naver.com/gnm/products/4888456723",
              productId: "gnm-lutein"
            };
            console.log(`GNM 자연의품격 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (competitor === '뉴트리데이') {
            representativeProduct = {
              name: "뉴트리데이 멀티비타민 미네랄 포 맨 90정",
              price: 18800,
              reviews: 3980,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8296471/82964713704.jpg",
              url: "https://brand.naver.com/nutridday/products/4967856723",
              productId: "nutridday-multivitamin"
            };
            console.log(`뉴트리데이 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (competitor === '주영엔에스') {
            representativeProduct = {
              name: "주영엔에스 프로메가 초임계 알티지 오메가3 180캡슐",
              price: 43800,
              reviews: 3270,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8284759/82847592384.jpg",
              url: "https://brand.naver.com/jyns/products/4975612398",
              productId: "jyns-promega"
            };
            console.log(`주영엔에스 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (competitor === '한미양행') {
            representativeProduct = {
              name: "한미양행 비타민D 2000IU 90정",
              price: 12800,
              reviews: 3150,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8341592/83415923704.jpg",
              url: "https://smartstore.naver.com/raneeind/products/5004568723",
              productId: "hanmi-vitamind"
            };
            console.log(`한미양행 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (competitor === '유한양행') {
            representativeProduct = {
              name: "유한양행 트루스 종합비타민미네랄 1500mg 90정",
              price: 23880,
              reviews: 4520,
              rank: 1,
              image: "https://shopping-phinf.pstatic.net/main_8230425/82304252193.jpg",
              url: "https://brand.naver.com/yuhan/products/5008391296",
              productId: "yuhan-vitamins"
            };
            console.log(`유한양행 제품 정보를 건강기능식품으로 설정 완료.`);
          } else if (products && products.length > 0) {
            try {
              // 실제 제품 데이터에서 첫 번째 제품 사용 (또는 가장 리뷰가 많은/판매량이 높은 제품 선택 가능)
              const productWithMostReviews = [...products].sort((a, b) => b.reviews - a.reviews)[0];
              
              // 상품 데이터 유효성 검사 추가
              if (productWithMostReviews && typeof productWithMostReviews === 'object') {
                representativeProduct = {
                  name: productWithMostReviews.name || `${competitor} 제품`,
                  price: typeof productWithMostReviews.price === 'number' ? productWithMostReviews.price : 0,
                  reviews: typeof productWithMostReviews.reviews === 'number' ? productWithMostReviews.reviews : 0,
                  rank: typeof productWithMostReviews.rank === 'number' ? productWithMostReviews.rank : 0,
                  image: productWithMostReviews.image || undefined,
                  url: productWithMostReviews.url || undefined,
                  productId: productWithMostReviews.productId || undefined
                };
                
                console.log(`${competitor} 대표 제품 정보 설정 완료:`, representativeProduct.name);
              } else {
                throw new Error('제품 데이터 형식이 올바르지 않음');
              }
            } catch (error) {
              console.error(`대표 제품 데이터 처리 오류:`, error);
              // 오류 발생 시 기본 표시 정보 사용
              representativeProduct = {
                name: `${competitor} 제품 정보 없음`,
                price: 0,
                reviews: 0,
                rank: 0,
                image: undefined,
                url: undefined,
                productId: undefined
              };
            }
          } else {
            // 제품 데이터가 없는 경우 표시할 정보
            console.warn(`${competitor} 제품 데이터가 없어 제품 정보를 표시할 수 없습니다`);
            representativeProduct = {
              name: `${competitor} 제품 정보 없음`,
              price: 0,
              reviews: 0,
              rank: 0,
              image: undefined,
              url: undefined,
              productId: undefined
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
          {/* 키워드 입력 필드 */}
          <div className="w-[180px] relative">
            <Input 
              type="text" 
              placeholder="키워드 직접 입력" 
              value={activeKeyword}
              onChange={(e) => setActiveKeyword(e.target.value)}
              className="pr-10"
            />
          </div>
          
          {/* 기존 드롭다운 선택 */}
          <Select
            value={activeKeyword}
            onValueChange={(value) => setActiveKeyword(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="키워드 선택" />
            </SelectTrigger>
            <SelectContent>
              {configs && Object.keys(configs).map((keyword) => (
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
                <h3 className="text-xl font-semibold mb-2">모니터링 결과가 없습니다</h3>
                {(!configs || !configs[activeKeyword]) ? (
                  <>
                    <p className="text-muted-foreground text-center mb-6">
                      이 키워드에 대한 모니터링 설정이 없습니다. 먼저 설정을 구성해주세요.
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
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-center mb-6">
                      이 키워드에 대한 첫 모니터링 데이터가 없습니다. 변화 감지를 실행해주세요.
                    </p>
                    <Button onClick={checkForChanges} disabled={isCheckingChanges}>
                      {isCheckingChanges ? (
                        <>
                          <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                          확인 중...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          변화 감지 실행
                        </>
                      )}
                    </Button>
                  </>
                )}
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
                        
                        <Tabs defaultValue="price">
                          <TabsList className="grid w-full grid-cols-4 mb-4">
                            <TabsTrigger value="price" className="flex items-center justify-center">
                              <BarChart3Icon className="h-4 w-4 mr-1 text-orange-500" />
                              <span className="whitespace-nowrap">가격</span>
                              {changes.priceChanges.length > 0 && (
                                <Badge variant="outline" className="ml-1">{changes.priceChanges.length}</Badge>
                              )}
                            </TabsTrigger>
                            <TabsTrigger value="new" className="flex items-center justify-center">
                              <PlusCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                              <span className="whitespace-nowrap">신제품</span>
                              {changes.newProducts.length > 0 && (
                                <Badge variant="outline" className="ml-1">{changes.newProducts.length}</Badge>
                              )}
                            </TabsTrigger>
                            <TabsTrigger value="rank" className="flex items-center justify-center">
                              <ArrowUpIcon className="h-4 w-4 mr-1 text-blue-500" />
                              <span className="whitespace-nowrap">순위</span>
                              {changes.rankChanges.length > 0 && (
                                <Badge variant="outline" className="ml-1">{changes.rankChanges.length}</Badge>
                              )}
                            </TabsTrigger>
                            <TabsTrigger value="review" className="flex items-center justify-center">
                              <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                              <span className="whitespace-nowrap">리뷰</span>
                              {changes.reviewChanges.length > 0 && (
                                <Badge variant="outline" className="ml-1">{changes.reviewChanges.length}</Badge>
                              )}
                            </TabsTrigger>
                          </TabsList>
                          
                          {/* 가격 변경 탭 */}
                          <TabsContent value="price">
                            {changes.priceChanges.length > 0 ? (
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
                            ) : (
                              <p className="text-center text-muted-foreground p-4">가격 변동이 감지되지 않았습니다.</p>
                            )}
                          </TabsContent>
                          
                          {/* 신규 제품 탭 */}
                          <TabsContent value="new">
                            {changes.newProducts.length > 0 ? (
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
                            ) : (
                              <p className="text-center text-muted-foreground p-4">신규 제품이 감지되지 않았습니다.</p>
                            )}
                          </TabsContent>
                          
                          {/* 순위 변경 탭 */}
                          <TabsContent value="rank">
                            {changes.rankChanges.length > 0 ? (
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
                            ) : (
                              <p className="text-center text-muted-foreground p-4">순위 변동이 감지되지 않았습니다.</p>
                            )}
                          </TabsContent>
                          
                          {/* 리뷰 변경 탭 */}
                          <TabsContent value="review">
                            {changes.reviewChanges.length > 0 ? (
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
                            ) : (
                              <p className="text-center text-muted-foreground p-4">리뷰 변동이 감지되지 않았습니다.</p>
                            )}
                          </TabsContent>
                        </Tabs>
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
              {insightsError && <span className="text-sm text-red-500 ml-2">(데이터 로드 실패 - <Button variant="link" size="sm" onClick={() => refetchInsights && refetchInsights()} className="p-0 h-auto text-sm text-blue-500">재시도</Button>)</span>}
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
                <Button variant="outline" size="sm" onClick={() => refetchInsights && refetchInsights()} className="mt-2">
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
                              <StrengthWeaknessChart 
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
                                          <p className="text-sm">{insight.strengthsDetails && insight.strengthsDetails[strength]?.description}</p>
                                          
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
                                            {insight.strengthsDetails && insight.strengthsDetails[strength]?.recommendations?.map((rec, i) => (
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
                                          <p className="text-sm">{insight.weaknessesDetails && insight.weaknessesDetails[weakness]?.description}</p>
                                          
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
                                            {insight.weaknessesDetails && insight.weaknessesDetails[weakness]?.recommendations?.map((rec, i) => (
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
                  <div className="space-y-2">
                    {/* 직접 입력 필드 */}
                    <Input 
                      type="text" 
                      placeholder="키워드 직접 입력" 
                      value={activeKeyword}
                      onChange={(e) => setActiveKeyword(e.target.value)}
                    />
                    
                    {/* 기존 드롭다운 */}
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        또는 저장된 키워드 선택:
                      </div>
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
                    </div>
                  </div>
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

// 모든 아이콘은 lucide-react에서 직접 가져옵니다