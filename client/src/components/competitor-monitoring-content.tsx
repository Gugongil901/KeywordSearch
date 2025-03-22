/**
 * 경쟁사 모니터링 콘텐츠 컴포넌트
 * 키워드와 경쟁사들의 상품 변화를 모니터링하는 내용
 */

// 제품 이미지 컴포넌트 임포트
import { ProductImage } from "@/components/ui/product-image";
import { CompetitorProductImage } from "@/components/competitor-product-image-new";
import { ProductCard } from "@/components/product-card";
import { formatNumber, formatDate, formatPercent, getChangeColorClass } from "@/utils/format";
// 차트 컴포넌트 임포트
import { StrengthWeaknessChart } from "@/components/charts/strength-weakness-radar";
import { CompetitorComparisonChart } from "@/components/charts/competitor-comparison-chart";
// 색상 팔레트 선택기
import { ColorPaletteSelector, COLOR_PALETTES } from "@/components/ui/color-palette-selector";
// 새로운 제품 목록 컴포넌트 임포트
import { PriceChangeList, RankChangeList, ReviewChangeList, NewProductList } from "@/components/competitor-product-lists";
import { ArrowUpDown } from "lucide-react";
// 공통 상수 임포트
import { DEFAULT_PRODUCT_IMAGES } from "@/constants/images";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, ArrowDown, ArrowUp, Info, Loader2, RefreshCw, Settings, ShoppingBag, Star, Trash, Clock, LineChart, Lightbulb, CheckCircle } from "lucide-react";
import { SiNaver } from "react-icons/si";

// 건강기능식품 브랜드 상수
const HEALTH_SUPPLEMENT_BRANDS = [
  { id: 'drlin', name: '닥터린', searchTerm: '닥터린 영양제' },
  { id: 'naturalplus', name: '내츄럴플러스', searchTerm: '내츄럴플러스 영양제' },
  { id: 'esthermall', name: '에스더몰', searchTerm: '에스더포뮬러' },
  { id: 'anguk', name: '안국건강', searchTerm: '안국건강 영양제' },
  { id: 'koreaeundan', name: '고려은단', searchTerm: '고려은단 영양제' },
  { id: 'nutrione', name: '뉴트리원', searchTerm: '뉴트리원 영양제' },
  { id: 'ckdhc', name: '종근당건강', searchTerm: '종근당건강 영양제' },
  { id: 'gnm', name: 'GNM 자연의품격', searchTerm: 'GNM 자연의품격 영양제' },
  { id: 'nutriday', name: '뉴트리데이', searchTerm: '뉴트리데이 영양제' },
  { id: 'jyns', name: '주영엔에스', searchTerm: '주영엔에스 영양제' },
  { id: 'hanmi', name: '한미양행', searchTerm: '한미양행 영양제' },
  { id: 'yuhan', name: '유한양행', searchTerm: '유한양행 비타민' }
];

// 브랜드 공식 스토어 URL
const BRAND_STORE_URLS = {
  // ID 기반 URL
  'drlin': 'https://smartstore.naver.com/drlin',
  'naturalplus': 'https://smartstore.naver.com/enatural', 
  'esthermall': 'https://smartstore.naver.com/esthermall',
  'anguk': 'https://smartstore.naver.com/anguk',
  'koreaeundan': 'https://smartstore.naver.com/eundan',
  'nutrione': 'https://smartstore.naver.com/nutrione',
  'ckdhc': 'https://smartstore.naver.com/ckdhc',
  'gnm': 'https://smartstore.naver.com/natureofpurety',
  'nutriday': 'https://smartstore.naver.com/nutriday',
  'jyns': 'https://smartstore.naver.com/jooyoung-ns',
  'hanmi': 'https://smartstore.naver.com/hanmibiologics',
  'yuhan': 'https://smartstore.naver.com/yuhan',
  
  // 이름 기반 URL (API 응답 ID와 매핑)
  '닥터린': 'https://smartstore.naver.com/drlin',
  '바디닥터': 'https://smartstore.naver.com/bodydoctor',
  '내츄럴플러스': 'https://smartstore.naver.com/enatural',
  '에스더몰': 'https://smartstore.naver.com/esthermall',
  '안국건강': 'https://smartstore.naver.com/anguk',
  '고려은단': 'https://smartstore.naver.com/eundan',
  '뉴트리원': 'https://smartstore.naver.com/nutrione',
  '종근당건강': 'https://smartstore.naver.com/ckdhc',
  'GNM 자연의품격': 'https://smartstore.naver.com/natureofpurety',
  '뉴트리데이': 'https://smartstore.naver.com/nutriday',
  '주영엔에스': 'https://smartstore.naver.com/jooyoung-ns',
  '한미양행': 'https://smartstore.naver.com/hanmibiologics',
  '유한양행': 'https://smartstore.naver.com/yuhan'
};

// 브랜드별 대표 제품 이미지
const BRAND_PRODUCT_IMAGES = {
  'drlin': 'https://shop-phinf.pstatic.net/20230710_217/1688952676288NvNm4_JPEG/26121391946684402_1287609349.jpg',
  'naturalplus': 'https://shop-phinf.pstatic.net/20230915_147/1694758066431zJKR3_JPEG/32926782127064937_1822402951.jpg',
  'esthermall': 'https://shop-phinf.pstatic.net/20230721_271/1689926539095raqFn_JPEG/29195234962308650_1780833913.jpg',
  'anguk': 'https://shop-phinf.pstatic.net/20230807_13/1691407115516KsaIC_JPEG/30745812128626636_1056185345.jpg',
  'koreaeundan': 'https://shop-phinf.pstatic.net/20230526_167/1685090592258zLQ3X_JPEG/23059307964536430_1984189809.jpg',
  'nutrione': 'https://shop-phinf.pstatic.net/20230830_143/1693371972252dNqlJ_JPEG/31540687839671376_2007286594.jpg',
  'ckdhc': 'https://shop-phinf.pstatic.net/20230817_110/1692260729457aGj7M_JPEG/30429445111935644_1876483308.jpg',
  'gnm': 'https://shop-phinf.pstatic.net/20220913_254/1663053635767gO5uL_JPEG/3222351466060232_1857158095.jpg',
  'nutriday': 'https://shop-phinf.pstatic.net/20230804_18/1691134339370e2DXG_JPEG/29303054934659166_1507551594.jpg',
  'jyns': 'https://shop-phinf.pstatic.net/20231023_4/16980118729982kz1J_JPEG/36180588683271784_2077002188.jpg',
  'hanmi': 'https://shop-phinf.pstatic.net/20231109_45/1699507600992f6i9g_JPEG/37676316657248520_33345781.jpg',
  'yuhan': 'https://shop-phinf.pstatic.net/20230508_102/1683530064193Bk0aL_JPEG/21698779851636714_1051203064.jpg'
};

// 인터페이스 정의
interface CompetitorProduct {
  productId: string;
  name: string;
  price: number;
  reviews: number;
  rank: number;
  image?: string;
  url?: string;
  collectedAt?: string;
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
    productId: string;
    collectedAt: string;
  };
}

export interface CompetitorMonitoringContentProps {
  keyword: string;
  onKeywordChange?: (keyword: string) => void;
  onCompetitorsChange?: (competitors: string[]) => void;
}

export function CompetitorMonitoringContent({ 
  keyword = '영양제', 
  onKeywordChange, 
  onCompetitorsChange 
}: CompetitorMonitoringContentProps) {
  // 상태 관리
  const [competitors, setCompetitors] = useState<string[]>(['drlin', 'naturalplus', 'esthermall', 'anguk', 'koreaeundan', 'nutrione', 'ckdhc', 'gnm', 'nutriday', 'jyns', 'hanmi', 'yuhan']);
  const [monitoringFrequency, setMonitoringFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [alertThresholds, setAlertThresholds] = useState({
    priceChangePercent: 5,
    newProduct: true,
    rankChange: true,
    reviewChangePercent: 10
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [configOpen, setConfigOpen] = useState<boolean>(false);
  const [monitoringResult, setMonitoringResult] = useState<MonitoringResult | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>('drlin'); // 기본값으로 첫 번째 경쟁사 ID로 설정
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('insights'); // 기본값을 인사이트로 변경
  const [keywordDebounceTimeout, setKeywordDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [competitorInsights, setCompetitorInsights] = useState<Record<string, CompetitorInsight>>({});
  const [selectedColorPaletteId, setSelectedColorPaletteId] = useState<string>('pastel'); // 기본 색상 팔레트
  const [innerTabState, setInnerTabState] = useState<string>('strengths'); // 내부 탭(강점/약점)용 상태

  // 이제 정렬 상태 변수가 각 리스트 컴포넌트에 내장됨
  
  const { toast } = useToast();
  
  // 경쟁사 선택 처리
  const handleCompetitorToggle = (competitorId: string) => {
    const newCompetitors = competitors.includes(competitorId)
      ? competitors.filter(id => id !== competitorId)
      : [...competitors, competitorId];
    
    setCompetitors(newCompetitors);
    
    // 부모 컴포넌트에 변경 알림
    if (onCompetitorsChange) {
      onCompetitorsChange(newCompetitors);
    }
    
    // 방금 선택된 경쟁사를 현재 선택된 경쟁사로 설정
    if (!competitors.includes(competitorId) && newCompetitors.includes(competitorId)) {
      setSelectedCompetitor(competitorId);
    }
    
    // 경쟁사가 선택되면 자동으로 변경사항 확인
    if (keyword && newCompetitors.length > 0) {
      checkChanges();
    }
  };
  
  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    // 처음 로드될 때 한 번만 실행되는 초기화 로직
    const initialize = async () => {
      // 1. 로컬 스토리지에서 저장된 데이터 불러오기
      try {
        // 인사이트 데이터 불러오기
        const savedInsights = localStorage.getItem('competitorInsights');
        if (savedInsights) {
          const parsedInsights = JSON.parse(savedInsights);
          setCompetitorInsights(parsedInsights);
          console.log('로컬 스토리지에서 인사이트 데이터 불러옴');
        }
        
        // 모니터링 결과 데이터 불러오기
        const savedMonitoringResult = localStorage.getItem('monitoringResult');
        if (savedMonitoringResult) {
          const parsedMonitoringResult = JSON.parse(savedMonitoringResult);
          setMonitoringResult(parsedMonitoringResult);
          console.log('로컬 스토리지에서 모니터링 결과 불러옴');
        }
        
        // 선택된 경쟁사 ID 불러오기
        // 로컬 스토리지에서 선택된 경쟁사 불러오기
        try {
          const savedSelectedCompetitor = localStorage.getItem('selectedCompetitor');
          if (savedSelectedCompetitor) {
            // 이름으로 저장된 경우 ID로 변환
            const existingBrand = HEALTH_SUPPLEMENT_BRANDS.find(
              b => b.id === savedSelectedCompetitor || b.name === savedSelectedCompetitor
            );
            
            if (existingBrand) {
              // ID로 저장 (일관성을 위해)
              setSelectedCompetitor(existingBrand.id);
              console.log('로컬 스토리지에서 선택된 경쟁사 불러옴(ID로 변환):', existingBrand.id);
            } else {
              // ID로 간주하고 사용
              setSelectedCompetitor(savedSelectedCompetitor);
              console.log('로컬 스토리지에서 선택된 경쟁사 불러옴:', savedSelectedCompetitor);
            }
          }
        } catch (err) {
          console.warn('로컬 스토리지에서 경쟁사 불러오기 실패:', err);
        }
        
        // 선택된 색상 팔레트 ID 불러오기
        const savedColorPaletteId = localStorage.getItem('selectedColorPaletteId');
        if (savedColorPaletteId) {
          setSelectedColorPaletteId(savedColorPaletteId);
          console.log('로컬 스토리지에서 색상 팔레트 불러옴:', savedColorPaletteId);
        }
      } catch (err) {
        console.warn('로컬 스토리지에서 데이터 불러오기 실패:', err);
      }
    };
    
    initialize();
    // 초기 페이지 로드 시 인사이트 데이터 로드
    loadCompetitorInsights();
  }, []); // 마운트 시 한 번만 실행
  
  // 키워드나 경쟁사가 변경되면 변경사항 확인
  useEffect(() => {
    if (keyword && competitors.length > 0) {
      checkChanges();
      loadCompetitorInsights();
      
      // 경쟁사가 있고 아직 선택된 경쟁사가 없으면 첫 번째 경쟁사 선택
      if (competitors.length > 0 && !selectedCompetitor) {
        // 일관성을 위해 ID를 사용
        const competitorId = competitors[0];
        setSelectedCompetitor(competitorId);
        localStorage.setItem('selectedCompetitor', competitorId);
        console.log('새 경쟁사 선택(자동/ID):', competitorId);
      }
      
      // 만약 선택된 경쟁사가 현재 경쟁사 목록에 없으면 첫 번째 경쟁사로 변경
      if (selectedCompetitor) {
        // 현재 경쟁사 목록에 이름이나 ID가 포함되어 있는지 확인
        const isIncluded = competitors.some(id => 
          id === selectedCompetitor || 
          HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === id)?.name === selectedCompetitor
        );
        
        if (!isIncluded) {
          // 일관성을 위해 ID를 사용
          const competitorId = competitors[0];
          setSelectedCompetitor(competitorId);
          localStorage.setItem('selectedCompetitor', competitorId);
          console.log('경쟁사 목록 변경으로 새 경쟁사 선택(ID):', competitorId);
        }
      }
    }
  }, [keyword, competitors.join(',')]); // 키워드나 경쟁사 목록이 변경될 때마다 실행
  
  // 모니터링 결과가 변경되면 로컬 스토리지에 저장
  useEffect(() => {
    if (monitoringResult) {
      try {
        localStorage.setItem('monitoringResult', JSON.stringify(monitoringResult));
        console.log('모니터링 결과 로컬 스토리지에 저장됨');
      } catch (error) {
        console.warn('모니터링 결과 저장 실패:', error);
      }
    }
  }, [monitoringResult]);
  
  // 컴포넌트 마운트 시 경쟁사 인사이트 데이터를 로드하기 위한 별도의 useEffect
  useEffect(() => {
    // 페이지 로드 시 바로 경쟁사 인사이트 로드
    loadCompetitorInsights();
    
    // 30초마다 자동으로 인사이트 데이터 새로고침
    const insightRefreshTimer = setInterval(() => {
      loadCompetitorInsights();
    }, 120000); // 2분마다 새로고침 (30초는 너무 빈번)
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      clearInterval(insightRefreshTimer);
    };
  }, []);
  
  // 선택된 경쟁사가 변경될 때마다 해당 경쟁사의 인사이트 데이터 유지
  useEffect(() => {
    if (selectedCompetitor) {
      // 선택된 경쟁사가 변경될 때마다 인사이트 데이터를 새로 로드
      loadCompetitorInsights();
    }
  }, [selectedCompetitor]);
  
  // 임계값 변경 처리
  const handleThresholdChange = (key: string, value: any) => {
    setAlertThresholds(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // 변화율 표시
  const renderChangePercent = (value: number) => {
    const isPositive = value > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const icon = isPositive ? <ArrowUp className="h-3 w-3 inline mr-1" /> : <ArrowDown className="h-3 w-3 inline mr-1" />;
    
    return (
      <span className={color}>
        {icon} {Math.abs(value).toFixed(1)}%
      </span>
    );
  };
  
  // 모니터링 구성 설정
  const setupMonitoring = async () => {
    if (!keyword) {
      toast({
        title: "키워드 필요",
        description: "모니터링할 키워드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (competitors.length === 0) {
      toast({
        title: "경쟁사 선택 필요",
        description: "최소 하나 이상의 경쟁사를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${window.location.origin}/api/monitoring/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          competitors,
          monitorFrequency: monitoringFrequency,
          alertThresholds
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`모니터링 설정 오류: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      toast({
        title: "모니터링 설정 완료",
        description: `"${keyword}" 키워드에 대한 모니터링이 설정되었습니다.`,
      });
      
      setConfigOpen(false);
      checkChanges();
      
    } catch (err: any) {
      console.error('모니터링 설정 오류:', err);
      setError(err.message || '모니터링 설정 중 오류가 발생했습니다.');
      
      toast({
        title: "설정 오류",
        description: err.message || '모니터링 설정 중 오류가 발생했습니다.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 변경사항 확인
  const checkChanges = async () => {
    if (!keyword) {
      toast({
        title: "키워드 필요",
        description: "모니터링할 키워드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${window.location.origin}/api/monitoring/check/${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`변경사항 확인 오류: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        // 설정을 찾을 수 없는 경우 사용자에게 알림 메시지 표시
        if (data.error.includes('모니터링 설정을 찾을 수 없습니다')) {
          toast({
            title: "모니터링 설정 필요",
            description: `"${keyword}" 키워드에 대한 모니터링 설정이 필요합니다. 설정 버튼을 클릭하여 모니터링을 구성하세요.`,
            variant: "default",
          });
          console.warn(`변경사항 확인 오류: ${data.error}`);
          setConfigOpen(true); // 설정 다이얼로그 자동 표시
          setLoading(false);
          return;
        }
        throw new Error(data.error);
      }
      
      setMonitoringResult(data);
      
      // 만약 결과에 데이터가 있고 선택된 경쟁사가 없다면 첫 번째 경쟁사를 자동으로 선택
      if (data.changesDetected && Object.keys(data.changesDetected).length > 0) {
        const availableCompetitors = Object.keys(data.changesDetected);
        if (availableCompetitors.length > 0) {
          // 이미 선택된 경쟁사가 결과에 포함되지 않은 경우에도 새로운 첫 번째 경쟁사로 설정
          // 경쟁사 이름이나 ID 모두 지원
          const found = availableCompetitors.find(
            competitor => competitor === selectedCompetitor ||
            HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === selectedCompetitor || b.name === selectedCompetitor)?.name === competitor
          );
            
          if (!selectedCompetitor || !found) {
            // API 응답에서는 이름을 사용하므로 매핑해서 ID 얻기
            const brandName = availableCompetitors[0];
            const brand = HEALTH_SUPPLEMENT_BRANDS.find(b => b.name === brandName);
            
            if (brand) {
              // ID 사용
              setSelectedCompetitor(brand.id);
              localStorage.setItem('selectedCompetitor', brand.id);
              console.log('API 응답에서 새 경쟁사로 변경(ID):', brand.id);
            } else {
              // 직접 사용 (ID일 수도 있음)
              setSelectedCompetitor(brandName);
              localStorage.setItem('selectedCompetitor', brandName);
              console.log('API 응답에서 새 경쟁사로 변경(미매핑):', brandName);
            }
          }
        }
      }
      
      // 경쟁사 인사이트 로드
      loadCompetitorInsights();
      
      toast({
        title: "확인 완료",
        description: `"${keyword}" 키워드의 변경사항 확인이 완료되었습니다.`,
      });
      
    } catch (err: any) {
      console.error('변경사항 확인 오류:', err);
      setError(err.message || '변경사항 확인 중 오류가 발생했습니다.');
      
      toast({
        title: "확인 오류",
        description: err.message || '변경사항 확인 중 오류가 발생했습니다.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 경쟁사 인사이트 로드
  const loadCompetitorInsights = async () => {
    try {
      const localInsights: Record<string, CompetitorInsight> = {};
      
      // 현재는 더미 데이터를 사용
      for (const brand of HEALTH_SUPPLEMENT_BRANDS) {
        // 실제로는 API에서 가져와야 하지만, 여기서는 로컬 데이터 사용
        const dummyInsight = generateDummyInsight(brand.id, brand.name);
        localInsights[brand.id] = dummyInsight;
      }
      
      // 기존 인사이트와 병합하여 값이 사라지지 않도록 함
      setCompetitorInsights(prevInsights => {
        // 기존 데이터가 있으면 기존 데이터와 새 데이터를 병합
        if (Object.keys(prevInsights).length > 0) {
          return { ...prevInsights, ...localInsights };
        }
        // 기존 데이터가 없으면 새 데이터만 사용
        return localInsights;
      });
      
      // 로컬 스토리지에 인사이트 데이터 캐싱
      try {
        localStorage.setItem('competitorInsights', JSON.stringify(localInsights));
      } catch (storageErr) {
        console.warn('로컬 스토리지 저장 실패:', storageErr);
      }
    } catch (err) {
      console.error('경쟁사 인사이트 로드 오류:', err);
    }
  };
  
  // 더미 인사이트 생성 (실제로는 서버에서 가져와야 함)
  const generateDummyInsight = (id: string, name: string): CompetitorInsight => {
    const brandIndex = HEALTH_SUPPLEMENT_BRANDS.findIndex(b => b.id === id);
    
    // 위치에 따라 다른 위협도/점유율 설정
    const threatLevel = Math.min(85, 35 + (12 - brandIndex) * 5);
    const marketShare = Math.min(60, 15 + (12 - brandIndex) * 4);
    const growthRate = Math.min(50, 5 + (12 - brandIndex) * 3);
    
    // 가격 전략 랜덤 선택
    const priceStrategies: Array<'aggressive' | 'premium' | 'standard' | 'economy'> = ['aggressive', 'premium', 'standard', 'economy'];
    const priceStrategy = priceStrategies[brandIndex % 4];
    
    return {
      competitor: name,
      threatLevel,
      marketShare,
      growthRate,
      priceStrategy,
      strengths: [
        '강력한 브랜드 인지도',
        '높은 제품 리뷰 수',
        '광범위한 제품 라인업'
      ],
      weaknesses: [
        '고가 가격대 포지셔닝',
        '신제품 출시 주기 느림',
        '마케팅 활동 부족'
      ],
      strengthsDetails: {
        '강력한 브랜드 인지도': {
          description: '소비자들 사이에서 높은 인지도와 신뢰를 보유',
          metrics: '브랜드 검색량 월 15,000회 이상',
          impact: '신규 제품 출시 시 초기 판매 속도가 경쟁사 대비 30% 빠름',
          examples: ['건강기능식품 Top10 브랜드 선정', '소비자만족도 4.5/5.0']
        },
        '높은 제품 리뷰 수': {
          description: '주요 제품들이 많은 사용자 리뷰 보유',
          metrics: '평균 리뷰 수 3,200개 이상',
          impact: '새로운 구매자의 구매 결정에 긍정적 영향',
          examples: ['대표 제품 리뷰 4,500개 이상', '평균 평점 4.7/5.0']
        },
        '광범위한 제품 라인업': {
          description: '다양한 건강 카테고리를 커버하는 제품군',
          metrics: '40개 이상의 제품 라인',
          impact: '다양한 고객층 확보 가능',
          examples: ['비타민, 미네랄, 프로바이오틱스 등 모든 주요 카테고리 보유', '맞춤형 건강솔루션 제공']
        }
      },
      weaknessesDetails: {
        '고가 가격대 포지셔닝': {
          description: '대부분의 제품이 시장 평균 이상의 가격대 형성',
          metrics: '주요 제품 평균 가격 경쟁사 대비 15-25% 높음',
          impact: '가격 민감 소비자층 유입 제한',
          recommendations: ['중간 가격대 라인 확장 고려', '가격 대비 가치 강조 마케팅']
        },
        '신제품 출시 주기 느림': {
          description: '제품 개발 및 출시 주기가 경쟁사 대비 느림',
          metrics: '신제품 출시 간격 평균 8-10개월',
          impact: '시장 트렌드 대응 지연으로 인한 기회 손실',
          recommendations: ['제품 개발 프로세스 최적화', '기존 제품 리뉴얼 주기 단축']
        },
        '마케팅 활동 부족': {
          description: '디지털 채널 마케팅 활동이 경쟁사 대비 낮은 수준',
          metrics: '소셜미디어 활동 지수 업계 평균의 70%',
          impact: 'MZ 세대 고객층 확보 어려움',
          recommendations: ['디지털 마케팅 강화', '인플루언서 협업 확대']
        }
      },
      representativeProduct: {
        name: TOP_HEALTH_PRODUCTS[id as keyof typeof TOP_HEALTH_PRODUCTS][0].name,
        price: TOP_HEALTH_PRODUCTS[id as keyof typeof TOP_HEALTH_PRODUCTS][0].price,
        image: TOP_HEALTH_PRODUCTS[id as keyof typeof TOP_HEALTH_PRODUCTS][0].image || '',
        url: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(TOP_HEALTH_PRODUCTS[id as keyof typeof TOP_HEALTH_PRODUCTS][0].name)}`,
        reviews: TOP_HEALTH_PRODUCTS[id as keyof typeof TOP_HEALTH_PRODUCTS][0].reviews,
        rank: TOP_HEALTH_PRODUCTS[id as keyof typeof TOP_HEALTH_PRODUCTS][0].rank,
        productId: TOP_HEALTH_PRODUCTS[id as keyof typeof TOP_HEALTH_PRODUCTS][0].productId,
        collectedAt: new Date().toISOString()
      }
    };
  };
  
  // 빈 상태 표시
  const renderEmptyState = () => {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 mb-3 flex items-center justify-center rounded-full bg-gray-100">
          <ShoppingBag className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">모니터링 데이터 없음</h3>
        <p className="text-gray-500 mb-4 max-w-md text-sm">
          키워드를 입력하고 경쟁사를 선택하여 모니터링을 설정하세요.
          설정 후 변경사항을 확인할 수 있습니다.
        </p>
        <Button onClick={() => setConfigOpen(true)} size="sm">
          모니터링 설정하기
        </Button>
      </div>
    );
  };
  
  // 모니터링 설정 다이얼로그
  const renderConfigDialog = () => {
    return (
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>경쟁사 모니터링 설정</DialogTitle>
            <DialogDescription>
              모니터링할 키워드와 경쟁사, 알림 설정을 지정하세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* 키워드 입력은 상위 컴포넌트에서 처리하므로 제거 */}
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                경쟁사 선택
              </Label>
              <div className="col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-2">
                {HEALTH_SUPPLEMENT_BRANDS.map((brand) => (
                  <div key={brand.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand.id}`}
                      checked={competitors.includes(brand.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleCompetitorToggle(brand.id);
                        } else {
                          handleCompetitorToggle(brand.id);
                        }
                      }}
                    />
                    <Label
                      htmlFor={`brand-${brand.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {brand.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monitor-frequency" className="text-right">
                모니터링 주기
              </Label>
              <Select
                value={monitoringFrequency}
                onValueChange={(value: 'daily' | 'weekly') => setMonitoringFrequency(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="모니터링 주기 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">매일</SelectItem>
                  <SelectItem value="weekly">매주</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                알림 설정
              </Label>
              <div className="col-span-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="price-threshold">가격 변동률 임계치</Label>
                    <p className="text-xs text-muted-foreground">가격이 설정한 퍼센트 이상 변경되면 알림</p>
                  </div>
                  <div className="flex items-center">
                    <Input
                      id="price-threshold"
                      type="number"
                      className="w-16 mr-2"
                      min={1}
                      max={50}
                      value={alertThresholds.priceChangePercent}
                      onChange={(e) => handleThresholdChange('priceChangePercent', parseInt(e.target.value) || 5)}
                    />
                    <span>%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="review-threshold">리뷰 변동률 임계치</Label>
                    <p className="text-xs text-muted-foreground">리뷰가 설정한 퍼센트 이상 변경되면 알림</p>
                  </div>
                  <div className="flex items-center">
                    <Input
                      id="review-threshold"
                      type="number"
                      className="w-16 mr-2"
                      min={1}
                      max={50}
                      value={alertThresholds.reviewChangePercent}
                      onChange={(e) => handleThresholdChange('reviewChangePercent', parseInt(e.target.value) || 10)}
                    />
                    <span>%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-product-alert">신제품 출시 알림</Label>
                    <p className="text-xs text-muted-foreground">새로운 제품이 발견되면 알림</p>
                  </div>
                  <Switch
                    id="new-product-alert"
                    checked={alertThresholds.newProduct}
                    onCheckedChange={(checked) => handleThresholdChange('newProduct', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="rank-change-alert">순위 변화 알림</Label>
                    <p className="text-xs text-muted-foreground">제품 순위가 변경되면 알림</p>
                  </div>
                  <Switch
                    id="rank-change-alert"
                    checked={alertThresholds.rankChange}
                    onCheckedChange={(checked) => handleThresholdChange('rankChange', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)}>취소</Button>
            <Button onClick={setupMonitoring} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              설정 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // 상태 추가
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  
  // 헤더 섹션 렌더링
  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-1">경쟁사 모니터링</h3>
          <p className="text-sm text-gray-500">경쟁사 제품의 가격, 순위, 리뷰 변화를 지속적으로 모니터링합니다.</p>
        </div>
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          <Switch
            id="show-only-changes"
            checked={showOnlyChanges}
            onCheckedChange={setShowOnlyChanges}
          />
          <Label htmlFor="show-only-changes" className="text-sm font-normal">
            변경사항 있는 경쟁사만 표시
          </Label>
        </div>
      </div>
    );
  };
  
  // 메인 컴포넌트 렌더링
  return (
    <>
      {renderHeader()}
      {renderConfigDialog()}
      
      {!monitoringResult ? (
        renderEmptyState()
      ) : (
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-blue-800 text-xl">
                    <span className="font-bold">"{monitoringResult.keyword}"</span> 모니터링 결과
                  </CardTitle>
                  {monitoringResult.hasAlerts && (
                    <Badge variant="destructive" className="animate-pulse bg-red-600 hover:bg-red-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      변경 알림
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center text-blue-600 mt-1">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {new Date(monitoringResult.checkedAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} 기준
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-600 border-blue-200 mt-2 sm:mt-0">
                모니터링 대상: {competitors.length}개 경쟁사
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full">
              <div className="w-full rounded-none justify-start bg-gray-100 p-0 h-auto flex">
                <button 
                  onClick={() => setSelectedTab('changes')}
                  className={`flex items-center py-3 flex-1 max-w-[200px] ${selectedTab === 'changes' ? 'bg-white border-b-2 border-blue-500 text-blue-700' : 'text-gray-600'}`}
                >
                  <LineChart className="h-4 w-4 mx-2" />
                  변경사항
                </button>
                <button 
                  onClick={() => setSelectedTab('insights')}
                  className={`flex items-center py-3 flex-1 max-w-[200px] ${selectedTab === 'insights' ? 'bg-white border-b-2 border-blue-500 text-blue-700' : 'text-gray-600'}`}
                >
                  <Lightbulb className="h-4 w-4 mx-2" />
                  경쟁사 인사이트
                </button>
              </div>
              
              {selectedTab === 'changes' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">모니터링 경쟁사</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="space-y-2">
                          {/* 무조건 12개 브랜드 모두 표시 */}
                          {HEALTH_SUPPLEMENT_BRANDS.map((brandItem) => {
                            const competitorId = brandItem.id;
                            const competitorName = brandItem.name;
                            
                            // ID나 브랜드명으로 데이터 찾기 (API 응답은 브랜드명으로 되어 있을 수 있음)
                            const competitorData = monitoringResult?.changesDetected?.[competitorId] || 
                                                  monitoringResult?.changesDetected?.[competitorName] || null;
                            
                            // 변경사항 있는지 확인
                            const hasChanges = competitorData && (
                              (competitorData.priceChanges && competitorData.priceChanges.length > 0) || 
                              (competitorData.newProducts && competitorData.newProducts.length > 0) || 
                              (competitorData.rankChanges && competitorData.rankChanges.length > 0) || 
                              (competitorData.reviewChanges && competitorData.reviewChanges.length > 0)
                            );
                            
                            return (
                              <div 
                                key={competitorId}
                                className={`p-2 rounded-md cursor-pointer ${selectedCompetitor === competitorId ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                                onClick={() => {
                                  setSelectedCompetitor(competitorId);
                                  localStorage.setItem('selectedCompetitor', competitorId);
                                  console.log('경쟁사 선택(변경사항 탭): ID 저장', competitorId);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="font-medium">{brandItem.name}</div>
                                  </div>
                                  {competitorData && competitorData.alerts && (
                                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      변경
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {hasChanges ? (
                                    <div className="flex items-center space-x-2">
                                      {competitorData?.priceChanges?.length > 0 && 
                                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full">가격 {competitorData.priceChanges.length}</span>
                                      }
                                      {competitorData?.rankChanges?.length > 0 && 
                                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-full">순위 {competitorData.rankChanges.length}</span>
                                      }
                                      {competitorData?.reviewChanges?.length > 0 && 
                                        <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full">리뷰 {competitorData.reviewChanges.length}</span>
                                      }
                                      {competitorData?.newProducts?.length > 0 && 
                                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full">신제품 {competitorData.newProducts.length}</span>
                                      }
                                    </div>
                                  ) : (
                                    <span>변경사항 없음</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="lg:col-span-3">
                    {!selectedCompetitor ? (
                      <div className="flex flex-col items-center justify-center p-8 h-full">
                        <Info className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-center">
                          경쟁사를 선택하여 변경사항을 확인하세요.
                        </p>
                      </div>
                    ) : (
                      <Card>
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              {/* 이름이나 ID로 경쟁사 찾기 */}
                              {HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === selectedCompetitor || b.name === selectedCompetitor)?.name || selectedCompetitor} 변경사항
                            </CardTitle>
                            <a 
                              href={BRAND_STORE_URLS[selectedCompetitor as keyof typeof BRAND_STORE_URLS] || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-xs text-blue-600 hover:underline"
                            >
                              <SiNaver className="h-3 w-3 mr-1" />
                              스토어 방문
                            </a>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="space-y-6">
                            {/* 모든 변경사항이 없는 경우 - 직접 경쟁사 ID이거나 이름으로 찾기 */}
                            {(() => {
                              // ID 또는 이름으로 경쟁사 데이터 찾기
                              const selectedName = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === selectedCompetitor)?.name;
                              const competitorData = Object.entries(monitoringResult.changesDetected)
                                .find(([key, _]) => key === selectedCompetitor || key === selectedName)
                                ?.[1];
                              
                              return !competitorData?.priceChanges?.length && 
                                     !competitorData?.rankChanges?.length && 
                                     !competitorData?.reviewChanges?.length && 
                                     !competitorData?.newProducts?.length;
                            })() ? (
                              <div className="flex flex-col items-center justify-center p-10 text-center border rounded-lg bg-gray-50">
                                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                                <h3 className="text-lg font-medium mb-1">변경사항이 없습니다</h3>
                                <p className="text-gray-500 max-w-md">
                                  현재 <strong>{HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === selectedCompetitor || b.name === selectedCompetitor)?.name || selectedCompetitor}</strong>에 대한 
                                  가격, 순위, 리뷰, 신제품 변경사항이 감지되지 않았습니다. 다음 확인 시에 다시 검사합니다.
                                </p>
                              </div>
                            ) : (
                              <>
                                {/* 가격 변경 - ID 또는 이름으로 경쟁사 찾기 */}
                                <PriceChangeList 
                                  changes={Object.entries(monitoringResult.changesDetected)
                                    .find(([key, _]) => {
                                      // ID 또는 이름으로 경쟁사 찾기
                                      const selectedName = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === selectedCompetitor)?.name;
                                      return key === selectedCompetitor || key === selectedName;
                                    })
                                    ?.[1]?.priceChanges || []}
                                  competitor={selectedCompetitor}
                                />
                                
                                {/* 순위 변경 - ID 또는 이름으로 경쟁사 찾기 */}
                                <RankChangeList 
                                  changes={Object.entries(monitoringResult.changesDetected)
                                    .find(([key, _]) => {
                                      const selectedName = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === selectedCompetitor)?.name;
                                      return key === selectedCompetitor || key === selectedName;
                                    })
                                    ?.[1]?.rankChanges || []}
                                  competitor={selectedCompetitor}
                                />
                                
                                {/* 리뷰 변경 - ID 또는 이름으로 경쟁사 찾기 */}
                                <ReviewChangeList 
                                  changes={Object.entries(monitoringResult.changesDetected)
                                    .find(([key, _]) => {
                                      const selectedName = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === selectedCompetitor)?.name;
                                      return key === selectedCompetitor || key === selectedName;
                                    })
                                    ?.[1]?.reviewChanges || []}
                                  competitor={selectedCompetitor}
                                />
                                
                                {/* 신제품 - ID 또는 이름으로 경쟁사 찾기 */}
                                <NewProductList 
                                  changes={Object.entries(monitoringResult.changesDetected)
                                    .find(([key, _]) => {
                                      const selectedName = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === selectedCompetitor)?.name;
                                      return key === selectedCompetitor || key === selectedName;
                                    })
                                    ?.[1]?.newProducts || []}
                                  competitor={selectedCompetitor}
                                />
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
              
              {selectedTab === 'insights' && (
                <div>
                  {/* 차트 설정 */}
                  <div className="flex justify-end mb-2">
                  <ColorPaletteSelector
                    selectedPaletteId={selectedColorPaletteId}
                    onSelectPalette={(palette) => {
                      setSelectedColorPaletteId(palette.id);
                      // 로컬 스토리지에 선택된 팔레트 ID 저장
                      try {
                        localStorage.setItem('selectedColorPaletteId', palette.id);
                      } catch (err) {
                        console.warn('색상 팔레트 ID 저장 실패:', err);
                      }
                    }}
                  />
                </div>
                
                {/* 경쟁사 비교 차트 섹션 */}
                <div className="mb-4">
                  <CompetitorComparisonChart
                    insights={competitorInsights}
                    competitors={competitors}
                    chartType="bar"
                    metric="marketShare"
                    title="경쟁사 시장 점유율 비교"
                    description="선택된 경쟁사들의 시장 점유율을 비교합니다."
                    colorPalette={COLOR_PALETTES.find(p => p.id === selectedColorPaletteId) || COLOR_PALETTES[0]}
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">경쟁사 목록</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="space-y-2">
                          {/* 선택된 경쟁사 목록을 기반으로 표시 */}
                          {competitors.length > 0 ? (
                            competitors.map((competitorId) => {
                              // 해당 경쟁사 ID에 대한 인사이트가 있는지 확인
                              const insight = competitorInsights[competitorId];
                              if (!insight) {
                                // 인사이트가 없으면 기본 정보만 표시
                                const brand = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === competitorId);
                                return (
                                  <div 
                                    key={competitorId}
                                    className={`p-2 rounded-md cursor-pointer ${selectedCompetitor === competitorId ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                                    onClick={() => {
                                      setSelectedCompetitor(competitorId);
                                      localStorage.setItem('selectedCompetitor', competitorId);
                                      console.log('경쟁사 선택(인사이트 로드중 탭): ID 저장', competitorId);
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="font-medium">{HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === competitorId)?.name || competitorId}</div>
                                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">로드 중</Badge>
                                    </div>
                                  </div>
                                );
                              }
                              
                              // 인사이트가 있으면 상세 정보 표시
                              const threatLevel = insight.threatLevel;
                              let threatBadge;
                              
                              if (threatLevel >= 80) {
                                threatBadge = <Badge className="bg-red-100 text-red-800 hover:bg-red-200">매우 높음</Badge>;
                              } else if (threatLevel >= 60) {
                                threatBadge = <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">높음</Badge>;
                              } else if (threatLevel >= 40) {
                                threatBadge = <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">중간</Badge>;
                              } else {
                                threatBadge = <Badge className="bg-green-100 text-green-800 hover:bg-green-200">낮음</Badge>;
                              }
                              
                              return (
                                <div 
                                  key={competitorId}
                                  className={`p-2 rounded-md cursor-pointer ${selectedCompetitor === competitorId ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                                  onClick={() => {
                                    setSelectedCompetitor(competitorId);
                                    localStorage.setItem('selectedCompetitor', competitorId);
                                    console.log('경쟁사 선택(인사이트 탭): ID 저장', competitorId);
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium">
                                      {HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === competitorId)?.name || insight.competitor}
                                    </div>
                                    {threatBadge}
                                  </div>
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <span>시장점유율: {insight.marketShare}%</span>
                                    <span className="mx-2">•</span>
                                    <span>성장률: {insight.growthRate > 0 ? '+' : ''}{insight.growthRate}%</span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-2 text-sm text-gray-500">
                              선택된 경쟁사가 없습니다. 경쟁사를 선택해주세요.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="lg:col-span-3">
                    {!selectedCompetitor ? (
                      // 선택된 경쟁사가 없는 경우
                      <div className="flex flex-col items-center justify-center p-8 h-full">
                        <Info className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-center">
                          경쟁사를 선택하여 인사이트를 확인하세요.
                        </p>
                      </div>
                    ) : !competitorInsights[selectedCompetitor] ? (
                      // 선택된 경쟁사는 있지만 아직 인사이트 데이터가 로딩되지 않은 경우
                      <div className="flex flex-col items-center justify-center p-8 h-full">
                        <Loader2 className="h-12 w-12 text-gray-300 mb-2 animate-spin" />
                        <p className="text-gray-500 text-center">
                          {HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === selectedCompetitor || b.name === selectedCompetitor)?.name || selectedCompetitor} 인사이트 로딩 중...
                        </p>
                      </div>
                    ) : (
                      <Card>
                        <CardHeader className="py-3">
                          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between">
                            <CardTitle className="text-base mb-1 xs:mb-0">
                              {HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === selectedCompetitor)?.name || competitorInsights[selectedCompetitor].competitor} 인사이트
                            </CardTitle>
                            <div className="flex items-center text-xs gap-2">
                              <Badge variant="outline" className="bg-gray-50">
                                <span className="capitalize">
                                  {competitorInsights[selectedCompetitor].priceStrategy === 'premium' ? '프리미엄 가격' : 
                                   competitorInsights[selectedCompetitor].priceStrategy === 'aggressive' ? '공격적 가격' :
                                   competitorInsights[selectedCompetitor].priceStrategy === 'economy' ? '경제적 가격' : '표준 가격'}
                                </span>
                              </Badge>
                              <a 
                                href={BRAND_STORE_URLS[selectedCompetitor as keyof typeof BRAND_STORE_URLS] || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center text-xs text-blue-600 hover:underline"
                              >
                                <SiNaver className="h-3 w-3 mr-1" />
                                스토어 방문
                              </a>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="space-y-6">
                            {/* 요약 섹션 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card className="bg-gray-50 border-gray-200">
                                <CardContent className="pt-4">
                                  <div className="text-center">
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">위협 수준</h4>
                                    <div className="flex items-center justify-center">
                                      <div 
                                        className="radial-progress text-primary" 
                                        style={{ 
                                          "--value": competitorInsights[selectedCompetitor].threatLevel, 
                                          "--size": "5rem",
                                          "--thickness": "0.5rem"
                                        } as any}
                                      >
                                        <span className="text-lg font-semibold">{competitorInsights[selectedCompetitor].threatLevel}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              <Card className="bg-gray-50 border-gray-200">
                                <CardContent className="pt-4">
                                  <div className="text-center">
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">시장 점유율</h4>
                                    <div className="flex items-center justify-center">
                                      <div 
                                        className="radial-progress text-blue-500" 
                                        style={{ 
                                          "--value": competitorInsights[selectedCompetitor].marketShare, 
                                          "--size": "5rem",
                                          "--thickness": "0.5rem"
                                        } as any}
                                      >
                                        <span className="text-lg font-semibold">{competitorInsights[selectedCompetitor].marketShare}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              <Card className="bg-gray-50 border-gray-200">
                                <CardContent className="pt-4">
                                  <div className="text-center">
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">성장률</h4>
                                    <div className="flex items-center justify-center">
                                      <div 
                                        className={`radial-progress ${competitorInsights[selectedCompetitor].growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}
                                        style={{ 
                                          "--value": Math.abs(competitorInsights[selectedCompetitor].growthRate), 
                                          "--size": "5rem",
                                          "--thickness": "0.5rem"
                                        } as any}
                                      >
                                        <span className="text-lg font-semibold">
                                          {competitorInsights[selectedCompetitor].growthRate > 0 ? '+' : ''}
                                          {competitorInsights[selectedCompetitor].growthRate}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                            
                            {/* 대표 제품 섹션 */}
                            <div>
                              <h3 className="text-sm font-medium text-gray-500 mb-3">대표 제품</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex md:flex-col items-center">
                                  <img 
                                    src={competitorInsights[selectedCompetitor].representativeProduct.image} 
                                    alt={competitorInsights[selectedCompetitor].representativeProduct.name}
                                    className="w-20 h-20 md:w-32 md:h-32 object-contain mr-4 md:mr-0 md:mb-3"
                                  />
                                  <div className="md:text-center">
                                    <h4 className="text-sm font-medium">{competitorInsights[selectedCompetitor].representativeProduct.name}</h4>
                                    <p className="text-sm text-gray-500 mt-1">가격: {competitorInsights[selectedCompetitor].representativeProduct.price.toLocaleString()}원</p>
                                    <div className="flex items-center space-x-3 mt-2 justify-center">
                                      <div className="flex items-center">
                                        <Star className="h-3.5 w-3.5 text-yellow-500 mr-1" />
                                        <span className="text-xs">{competitorInsights[selectedCompetitor].representativeProduct.reviews.toLocaleString()} 리뷰</span>
                                      </div>
                                      <div className="text-xs">순위: {competitorInsights[selectedCompetitor].representativeProduct.rank}위</div>
                                    </div>
                                    <div className="mt-3 md:mt-4">
                                      <a 
                                        href={competitorInsights[selectedCompetitor].representativeProduct.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs inline-flex items-center justify-center text-blue-600 hover:underline"
                                      >
                                        <SiNaver className="h-3 w-3 mr-1" />
                                        제품 보기
                                      </a>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-center">
                                  <StrengthWeaknessChart 
                                    competitor={selectedCompetitor}
                                    strengthsData={competitorInsights[selectedCompetitor].strengths.reduce((acc, item) => ({...acc, [item]: 80}), {})}
                                    weaknessesData={competitorInsights[selectedCompetitor].weaknesses.reduce((acc, item) => ({...acc, [item]: 60}), {})}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* 탭 섹션 */}
                            <div>
                              <div className="flex w-full border-b mb-4">
                                <button 
                                  onClick={() => setInnerTabState('strengths')} 
                                  className={`py-2 px-4 font-medium text-sm flex-1 text-center ${innerTabState === 'strengths' ? 'border-b-2 border-blue-500 text-blue-700' : 'text-gray-500'}`}
                                >
                                  강점
                                </button>
                                <button 
                                  onClick={() => setInnerTabState('weaknesses')} 
                                  className={`py-2 px-4 font-medium text-sm flex-1 text-center ${innerTabState === 'weaknesses' ? 'border-b-2 border-blue-500 text-blue-700' : 'text-gray-500'}`}
                                >
                                  약점
                                </button>
                              </div>
                              {innerTabState === 'strengths' && (
                                <div className="mt-4">
                                <div className="space-y-6">
                                  {competitorInsights[selectedCompetitor].strengths.map((strength, index) => {
                                    const details = competitorInsights[selectedCompetitor].strengthsDetails[strength];
                                    if (!details) return null;
                                    
                                    return (
                                      <div key={index} className="p-4 bg-green-50 rounded-md">
                                        <h4 className="font-medium text-green-800 mb-2">{strength}</h4>
                                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                          <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">설명</h5>
                                            <p className="text-sm text-gray-600">{details.description}</p>
                                          </div>
                                          <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">측정 지표</h5>
                                            <p className="text-sm text-gray-600">{details.metrics}</p>
                                          </div>
                                          <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">영향</h5>
                                            <p className="text-sm text-gray-600">{details.impact}</p>
                                          </div>
                                        </div>
                                        {details.examples && details.examples.length > 0 && (
                                          <div className="mt-3">
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">사례</h5>
                                            <ul className="list-disc list-inside text-sm text-gray-600">
                                              {details.examples.map((example, i) => (
                                                <li key={i}>{example}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                </div>
                              )}
                              {innerTabState === 'weaknesses' && (
                                <div className="mt-4">
                                <div className="space-y-6">
                                  {competitorInsights[selectedCompetitor].weaknesses.map((weakness, index) => {
                                    const details = competitorInsights[selectedCompetitor].weaknessesDetails[weakness];
                                    if (!details) return null;
                                    
                                    return (
                                      <div key={index} className="p-4 bg-red-50 rounded-md">
                                        <h4 className="font-medium text-red-800 mb-2">{weakness}</h4>
                                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                          <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">설명</h5>
                                            <p className="text-sm text-gray-600">{details.description}</p>
                                          </div>
                                          <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">측정 지표</h5>
                                            <p className="text-sm text-gray-600">{details.metrics}</p>
                                          </div>
                                          <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">영향</h5>
                                            <p className="text-sm text-gray-600">{details.impact}</p>
                                          </div>
                                        </div>
                                        {details.recommendations && details.recommendations.length > 0 && (
                                          <div className="mt-3">
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">대응 전략 추천</h5>
                                            <ul className="list-disc list-inside text-sm text-gray-600">
                                              {details.recommendations.map((rec, i) => (
                                                <li key={i}>{rec}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                </div>
                              )}
                            </div>
                            
                            {/* 레이더 차트 추가 */}
                            <div className="mt-6">
                              <h3 className="text-sm font-medium text-gray-500 mb-3">종합 성과 분석</h3>
                              <CompetitorComparisonChart
                                insights={competitorInsights}
                                competitors={[selectedCompetitor]}
                                chartType="radar"
                                title="성과 레이더 차트"
                                description="위협 수준, 시장 점유율, 성장률을 종합적으로 분석합니다."
                                height={250}
                                colorPalette={COLOR_PALETTES.find(p => p.id === selectedColorPaletteId) || COLOR_PALETTES[0]}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// 렌더링 콘텐츠 컴포넌트들 - 외부에서 독립적으로 정의

// TOP_HEALTH_PRODUCTS 객체 정의(상위에 임포트해도 됨)
const TOP_HEALTH_PRODUCTS = {
  'drlin': [
    { productId: 'drlin-omega3', name: '프리미엄 오메가3', price: 32900, reviews: 1203, rank: 1, image: 'https://shop-phinf.pstatic.net/20220923_300/1663869679546cF7Rh_JPEG/64997452449318461_1244795245.jpg', collectedAt: new Date().toISOString() },
    { productId: 'drlin-multivit', name: '종합비타민미네랄', price: 28900, reviews: 987, rank: 2, image: 'https://shop-phinf.pstatic.net/20220910_264/1662773040332I56l2_JPEG/63900817132950771_917085381.jpg', collectedAt: new Date().toISOString() },
    { productId: 'drlin-vitamin-d', name: '비타민D 5000IU', price: 19800, reviews: 754, rank: 3, image: 'https://shop-phinf.pstatic.net/20220504_13/1651647286713Dz9io_JPEG/52775071594963526_950200108.jpg', collectedAt: new Date().toISOString() },
  ],
  'naturalplus': [
    { productId: 'naturalplus-lutein', name: '루테인 지아잔틴', price: 34900, reviews: 1543, rank: 1, image: 'https://shop-phinf.pstatic.net/20230317_164/1679039485346xtDnk_JPEG/18308183272623729_1396195305.jpg', collectedAt: new Date().toISOString() },
    { productId: 'naturalplus-collagen', name: '더 콜라겐 히알루론산', price: 29900, reviews: 1322, rank: 2, image: 'https://shop-phinf.pstatic.net/20230327_299/1679884558132KpuPf_JPEG/19153252052429752_1613380331.jpg', collectedAt: new Date().toISOString() },
    { productId: 'naturalplus-probiotics', name: '장에 좋은 유산균', price: 37900, reviews: 987, rank: 3, image: 'https://shop-phinf.pstatic.net/20210902_159/1630544961088Mj9Sh_JPEG/31672748028842652_1866841073.jpg', collectedAt: new Date().toISOString() },
  ],
  'esthermall': [
    { productId: 'esther-multivit', name: '멀티비타민 미네랄', price: 59000, reviews: 824, rank: 1, image: 'https://shop-phinf.pstatic.net/20230721_271/1689926539095raqFn_JPEG/29195234962308650_1780833913.jpg', collectedAt: new Date().toISOString() },
    { productId: 'esther-prorobiotic', name: '프로바이오틱스', price: 69000, reviews: 612, rank: 2, image: 'https://shop-phinf.pstatic.net/20221207_251/1670377444278eHnOY_JPEG/10646139175414682_1021037816.jpg', collectedAt: new Date().toISOString() },
    { productId: 'esther-collagen', name: '히알루론산 콜라겐', price: 57000, reviews: 495, rank: 3, image: 'https://shop-phinf.pstatic.net/20220708_212/1657268845249r4Iio_JPEG/58396632191512798_1577577913.jpg', collectedAt: new Date().toISOString() },
  ],
  'anguk': [
    { productId: 'anguk-iron', name: '철분 플러스', price: 19800, reviews: 3254, rank: 1, image: 'https://shop-phinf.pstatic.net/20230419_252/1681889825359mLVa1_JPEG/21158535259736380_658984878.jpg', collectedAt: new Date().toISOString() },
    { productId: 'anguk-vitamin-d', name: '비타민D 1000IU', price: 9800, reviews: 2876, rank: 2, image: 'https://shop-phinf.pstatic.net/20220413_264/1649818184992jCOoS_JPEG/50945975887204344_1651673133.jpg', collectedAt: new Date().toISOString() },
    { productId: 'anguk-omega3', name: '식물성 오메가3', price: 29800, reviews: 1932, rank: 3, image: 'https://shop-phinf.pstatic.net/20230110_25/1673325559033LkxQ3_JPEG/12594256935451834_184431566.jpg', collectedAt: new Date().toISOString() },
  ],
  'koreaeundan': [
    { productId: 'eundan-vitamin-c', name: '비타민C 1000', price: 16900, reviews: 5327, rank: 1, image: 'https://shop-phinf.pstatic.net/20230505_9/1683252702946gOo2A_JPEG/22521407895271368_442223604.jpg', collectedAt: new Date().toISOString() },
    { productId: 'eundan-vitamin-b', name: '활력비타민B', price: 18900, reviews: 3246, rank: 2, image: 'https://shop-phinf.pstatic.net/20220803_185/1659516207733lrF62_JPEG/27402054737143694_218246605.jpg', collectedAt: new Date().toISOString() },
    { productId: 'eundan-probiotics', name: '장에 좋은 유산균', price: 23900, reviews: 2869, rank: 3, image: 'https://shop-phinf.pstatic.net/20220725_234/1658714267032YXSbS_JPEG/26600114035455764_1986884467.jpg', collectedAt: new Date().toISOString() },
  ],
  'nutrione': [
    { productId: 'nutrione-lactobacillus', name: '장쾌동 유산균', price: 29800, reviews: 4387, rank: 1, image: 'https://shop-phinf.pstatic.net/20220822_28/1661133613839BObxQ_JPEG/29019460799109804_1358335370.jpg', collectedAt: new Date().toISOString() },
    { productId: 'nutrione-omega3', name: '알티지 오메가3', price: 31900, reviews: 2965, rank: 2, image: 'https://shop-phinf.pstatic.net/20220614_159/16550920952493uoI9_JPEG/56219879098475798_2042764686.jpg', collectedAt: new Date().toISOString() },
    { productId: 'nutrione-multivit', name: '종합비타민 미네랄', price: 24900, reviews: 2547, rank: 3, image: 'https://shop-phinf.pstatic.net/20220617_86/1655451629826CvBMz_JPEG/23337473691050352_1000832853.jpg', collectedAt: new Date().toISOString() },
  ],
  'ckdhc': [
    { productId: 'ckd-lactofit', name: '락토핏 생유산균', price: 17900, reviews: 8754, rank: 1, image: 'https://shop-phinf.pstatic.net/20220406_300/16492198417698hnLn_JPEG/50347632664059004_1040409731.jpg', collectedAt: new Date().toISOString() },
    { productId: 'ckd-omega3', name: '프로메가 오메가3', price: 19900, reviews: 6582, rank: 2, image: 'https://shop-phinf.pstatic.net/20230103_45/1672709864903gFKhA_JPEG/11978562863342562_16776074.jpg', collectedAt: new Date().toISOString() },
    { productId: 'ckd-redginseng', name: '홍삼정 에브리타임', price: 43900, reviews: 4389, rank: 3, image: 'https://shop-phinf.pstatic.net/20220603_25/1654234243993nTIBL_JPEG/55362027784397134_1272008747.jpg', collectedAt: new Date().toISOString() },
  ],
  'gnm': [
    { productId: 'gnm-garlic', name: '흑마늘 진액', price: 28900, reviews: 5243, rank: 1, image: 'https://shop-phinf.pstatic.net/20220524_180/1653381536396l9XVW_JPEG/54509320284697598_1193600621.jpg', collectedAt: new Date().toISOString() },
    { productId: 'gnm-probiotics', name: '장건강 데일리 유산균', price: 27900, reviews: 4765, rank: 2, image: 'https://shop-phinf.pstatic.net/20230721_189/1689898845436PORsO_JPEG/29167541307791778_1507301384.jpg', collectedAt: new Date().toISOString() },
    { productId: 'gnm-collagen', name: '저분자 콜라겐', price: 29900, reviews: 3654, rank: 3, image: 'https://shop-phinf.pstatic.net/20230330_12/1680139201693Ncfmi_JPEG/19407897623972774_1857072546.jpg', collectedAt: new Date().toISOString() },
  ],
  'nutriday': [
    { productId: 'nutriday-vitaminc', name: '비타민C 1000', price: 19800, reviews: 1874, rank: 1, image: 'https://shop-phinf.pstatic.net/20230726_258/1690336669818tYF86_JPEG/29605365690161488_1663889608.jpg', collectedAt: new Date().toISOString() },
    { productId: 'nutriday-calcium', name: '칼슘 마그네슘 아연', price: 14900, reviews: 1245, rank: 2, image: 'https://shop-phinf.pstatic.net/20230102_22/16726366906428OCPB_JPEG/11905388539181066_1881349018.jpg', collectedAt: new Date().toISOString() },
    { productId: 'nutriday-eye', name: '아이케어 루테인', price: 25800, reviews: 983, rank: 3, image: 'https://shop-phinf.pstatic.net/20230301_241/1677639799989t2OMq_JPEG/16908500044362372_1290702651.jpg', collectedAt: new Date().toISOString() },
  ],
  'jyns': [
    { productId: 'jyns-calcium', name: '칼마디 앤 비타민D', price: 27800, reviews: 2421, rank: 1, image: 'https://shop-phinf.pstatic.net/20221017_62/1665964818405lJV1u_JPEG/6233492294598176_1935169879.jpg', collectedAt: new Date().toISOString() },
    { productId: 'jyns-propolis', name: '브라질 그린 프로폴리스', price: 38700, reviews: 1854, rank: 2, image: 'https://shop-phinf.pstatic.net/20221216_75/1671153525293WVj5o_JPEG/11422198152469956_1380900621.jpg', collectedAt: new Date().toISOString() },
    { productId: 'jyns-zinc', name: '아연 비타민C 셀렌', price: 19800, reviews: 1432, rank: 3, image: 'https://shop-phinf.pstatic.net/20220614_108/1655198069384UrdaO_JPEG/56325852226650654_2035584873.jpg', collectedAt: new Date().toISOString() },
  ],
  'hanmi': [
    { productId: 'hanmi-probiotic', name: '한미 프로바이오틱스', price: 39800, reviews: 4287, rank: 1, image: 'https://shop-phinf.pstatic.net/20220316_59/1647425578873I9wgA_JPEG/48553361715238608_1539518774.jpg', collectedAt: new Date().toISOString() },
    { productId: 'hanmi-omega3', name: '한미 프리미엄 오메가3', price: 32800, reviews: 3254, rank: 2, image: 'https://shop-phinf.pstatic.net/20220915_191/1663231639532q6pjL_JPEG/1630341533738754_1107798969.jpg', collectedAt: new Date().toISOString() },
    { productId: 'hanmi-redginseng', name: '한미 홍삼정 스틱', price: 59800, reviews: 2154, rank: 3, image: 'https://shop-phinf.pstatic.net/20220322_23/1647921323266WfY9e_JPEG/49049106107630664_1835629657.jpg', collectedAt: new Date().toISOString() },
  ],
  'yuhan': [
    { productId: 'yuhan-omega3', name: '유한 오메가3', price: 22900, reviews: 5387, rank: 1, image: 'https://shop-phinf.pstatic.net/20210510_264/16206595319421oR4j_JPEG/21787318783259990_277337275.jpg', collectedAt: new Date().toISOString() },
    { productId: 'yuhan-multivit', name: '유한 종합비타민', price: 19900, reviews: 4329, rank: 2, image: 'https://shop-phinf.pstatic.net/20210510_249/1620659580245FOvSh_JPEG/21787367086586696_1231272000.jpg', collectedAt: new Date().toISOString() },
    { productId: 'yuhan-probiotics', name: '유한 락토바실러스', price: 25900, reviews: 3254, rank: 3, image: 'https://shop-phinf.pstatic.net/20220817_13/1660704232458PJFzR_JPEG/31872935306819722_2009653231.jpg', collectedAt: new Date().toISOString() },
  ],
};