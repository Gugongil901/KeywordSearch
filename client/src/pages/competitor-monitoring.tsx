/**
 * 경쟁사 모니터링 대시보드 페이지
 * 키워드와 경쟁사들의 상품 변화를 모니터링하는 페이지
 */

// 제품 이미지 컴포넌트 임포트
import { ProductImage } from "@/components/ui/product-image";
// 강점/약점 레이더 차트 컴포넌트 임포트
import { StrengthWeaknessChart } from "@/components/charts/strength-weakness-radar";
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
import { AlertCircle, ArrowDown, ArrowUp, Info, Loader2, RefreshCw, Settings, ShoppingBag, Star, Trash } from "lucide-react";
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
  'yuhan': 'https://smartstore.naver.com/yuhan'
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

// 건강기능식품 상위 제품 데이터
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
    { productId: 'yuhan-probiotics', name: '유한 프로바이오틱스', price: 28900, reviews: 3876, rank: 3, image: 'https://shop-phinf.pstatic.net/20220614_4/1655163844809vPPnf_JPEG/56291638694976708_1383602939.jpg', collectedAt: new Date().toISOString() },
  ]
};

// 경쟁사 통찰력 샘플 데이터
const COMPETITOR_INSIGHTS_DATA: Record<string, CompetitorInsight> = {
  'drlin': {
    competitor: '닥터린',
    threatLevel: 78,
    marketShare: 21.5,
    growthRate: 15.3,
    priceStrategy: 'premium',
    strengths: ['제품 품질', '브랜드 인지도', '효과적인 마케팅'],
    weaknesses: ['높은 가격대', '재구매율 저조', '한정된 제품 라인업'],
    strengthsDetails: {
      '제품 품질': {
        description: '고품질 원료와 효과적인 제품 포뮬레이션',
        metrics: '고객 평점 4.8/5, 부작용 신고 0.1% 미만',
        impact: '높은 초기 구매 전환율',
        examples: ['특허받은 흡수 기술', '임상실험 데이터 공개']
      },
      '브랜드 인지도': {
        description: '건강 전문가로서의 강력한 브랜드 이미지',
        metrics: '브랜드 인지도 조사 상위 15%, SNS 언급량 월 3,200회',
        impact: '높은 초기 구매 신뢰도',
        examples: ['의사 추천 마케팅', '언론 보도 노출']
      },
      '효과적인 마케팅': {
        description: '타겟 고객층에 효과적으로 도달하는 마케팅 전략',
        metrics: 'CPA 12,000원, ROAS 380%',
        impact: '효율적인 고객 획득',
        examples: ['건강 인플루언서 협업', '유튜브 교육 컨텐츠']
      }
    },
    weaknessesDetails: {
      '높은 가격대': {
        description: '경쟁사 대비 25-40% 높은 가격 정책',
        metrics: '평균 판매가 32,600원 (경쟁사 평균 24,800원)',
        impact: '가격 민감층 고객 이탈',
        recommendations: ['중간 가격대 제품 라인 출시', '정기구독 할인 강화']
      },
      '재구매율 저조': {
        description: '초기 구매 후 재구매율이 낮음',
        metrics: '3개월 재구매율 26% (업계 평균 38%)',
        impact: '장기적 수익성 및 고객 생애 가치 감소',
        recommendations: ['리마인더 마케팅 강화', '복용 추적 앱 제공']
      },
      '한정된 제품 라인업': {
        description: '주요 카테고리에만 집중된 제한적 제품군',
        metrics: '제품 카테고리 8개 (경쟁사 평균 14개)',
        impact: '교차 판매 기회 제한',
        recommendations: ['라인업 확장 계획 수립', '번들 상품 구성']
      }
    },
    representativeProduct: {
      name: '프리미엄 오메가3',
      price: 32900,
      image: 'https://shop-phinf.pstatic.net/20220923_300/1663869679546cF7Rh_JPEG/64997452449318461_1244795245.jpg',
      url: 'https://smartstore.naver.com/drlin/products/4695586207',
      reviews: 1203,
      rank: 1,
      productId: 'drlin-omega3',
      collectedAt: new Date().toISOString()
    }
  },
  'naturalplus': {
    competitor: '내츄럴플러스',
    threatLevel: 65,
    marketShare: 18.7,
    growthRate: 9.5,
    priceStrategy: 'standard',
    strengths: ['제품 다양성', '천연 원료 포지셔닝', '우수한 고객 서비스'],
    weaknesses: ['품질 일관성 부족', '약한 온라인 존재감', '마케팅 메시지 불명확'],
    strengthsDetails: {
      '제품 다양성': {
        description: '다양한 건강 니즈를 충족하는 넓은 제품 포트폴리오',
        metrics: '22개 제품 카테고리, 65개 이상의 SKU',
        impact: '다양한 고객층 확보',
        examples: ['연령별 맞춤 라인업', '니치 건강 이슈 제품']
      },
      '천연 원료 포지셔닝': {
        description: '천연, 유기농 원료 중심의 브랜드 아이덴티티',
        metrics: '90% 이상의 제품에서 천연 원료 사용',
        impact: '친환경, 건강 지향적 소비자층 확보',
        examples: ['유기농 인증 획득', '무첨가물 정책']
      },
      '우수한 고객 서비스': {
        description: '개인화된 고객 지원 및 상담 서비스',
        metrics: '고객 만족도 92%, 응답 시간 1시간 이내',
        impact: '높은 고객 충성도 및 추천율',
        examples: ['1:1 영양사 상담', '맞춤형 복용 가이드']
      }
    },
    weaknessesDetails: {
      '품질 일관성 부족': {
        description: '제품별 품질 편차가 존재',
        metrics: '제품별 평점 편차 1.2점, 불만 신고율 3.2%',
        impact: '브랜드 신뢰도 손상',
        recommendations: ['품질 관리 시스템 강화', '표준화된 생산 프로세스 도입']
      },
      '약한 온라인 존재감': {
        description: '디지털 채널 활용 미흡',
        metrics: 'SNS 팔로워 경쟁사 대비 32% 수준, 웹사이트 트래픽 저조',
        impact: '젊은 소비자층 접근성 제한',
        recommendations: ['디지털 마케팅 강화', '커뮤니티 구축 전략']
      },
      '마케팅 메시지 불명확': {
        description: '일관성 없는 브랜드 메시지',
        metrics: '브랜드 메시지 인지도 조사 하위 25%',
        impact: '브랜드 아이덴티티 약화',
        recommendations: ['브랜드 스토리텔링 재정립', '핵심 가치 명확화']
      }
    },
    representativeProduct: {
      name: '루테인 지아잔틴',
      price: 34900,
      image: 'https://shop-phinf.pstatic.net/20230317_164/1679039485346xtDnk_JPEG/18308183272623729_1396195305.jpg',
      url: 'https://smartstore.naver.com/enatural/products/5361485552',
      reviews: 1543,
      rank: 1,
      productId: 'naturalplus-lutein',
      collectedAt: new Date().toISOString()
    }
  },
  'esthermall': {
    competitor: '에스더몰',
    threatLevel: 82,
    marketShare: 15.3,
    growthRate: 23.7,
    priceStrategy: 'premium',
    strengths: ['프리미엄 브랜드 포지셔닝', '혁신적 제품 개발', '강력한 인플루언서 마케팅'],
    weaknesses: ['매우 높은 가격대', '접근성 제한', '공급망 불안정'],
    strengthsDetails: {
      '프리미엄 브랜드 포지셔닝': {
        description: '럭셔리 건강기능식품 브랜드로서의 확고한 입지',
        metrics: '브랜드 가치 평가 업계 상위 5%, 프리미엄 소비자 충성도 72%',
        impact: '높은 마진율 유지',
        examples: ['고급 패키징', '전용 멤버십 서비스']
      },
      '혁신적 제품 개발': {
        description: '독자적인 성분 조합과 혁신적 제품 개발력',
        metrics: '특허 출원 6건, R&D 투자 매출의 8.3%',
        impact: '차별화된 경쟁 우위 확보',
        examples: ['특허받은 포뮬레이션', '임상 연구 투자']
      },
      '강력한 인플루언서 마케팅': {
        description: '유명 인플루언서 및 셀러브리티 네트워크 활용',
        metrics: '인플루언서 도달율 월 320만명, 콘텐츠 인게이지먼트 5.8%',
        impact: '고급 브랜드 이미지 강화 및 바이럴 효과',
        examples: ['유명인 브랜드 앰배서더', '전문가 추천 마케팅']
      }
    },
    weaknessesDetails: {
      '매우 높은 가격대': {
        description: '경쟁사 대비 최고 수준의 가격대',
        metrics: '평균 판매가 58,000원 (업계 평균의 2.3배)',
        impact: '대중 시장 접근성 제한',
        recommendations: ['가격대별 라인 세분화', '입문 제품 출시']
      },
      '접근성 제한': {
        description: '제한된 유통 채널과 배타적 판매 전략',
        metrics: '판매 채널 3개, 실 구매 가능 소비자 커버리지 18%',
        impact: '성장 잠재력 제한',
        recommendations: ['채널 다각화', '오프라인 판매점 확대']
      },
      '공급망 불안정': {
        description: '고품질 원료 수급의 불안정성',
        metrics: '재고 부족으로 인한 판매 기회 손실 연 4회, 납기 지연율 12%',
        impact: '고객 경험 저하 및 기회 비용 발생',
        recommendations: ['원료 공급업체 다변화', '재고 관리 시스템 개선']
      }
    },
    representativeProduct: {
      name: '멀티비타민 미네랄',
      price: 59000,
      image: 'https://shop-phinf.pstatic.net/20230721_271/1689926539095raqFn_JPEG/29195234962308650_1780833913.jpg',
      url: 'https://smartstore.naver.com/esthermall/products/4866324240',
      reviews: 824,
      rank: 1,
      productId: 'esther-multivit',
      collectedAt: new Date().toISOString()
    }
  },
  'yuhan': {
    competitor: '유한양행',
    threatLevel: 85,
    marketShare: 24.3,
    growthRate: 11.2,
    priceStrategy: 'standard',
    strengths: ['강력한 기업 신뢰도', '광범위한 유통망', '효율적인 생산 규모'],
    weaknesses: ['혁신성 부족', '젊은 층 공략 미흡', '디지털 전환 지연'],
    strengthsDetails: {
      '강력한 기업 신뢰도': {
        description: '80년 이상의 역사와 높은 기업 신뢰도',
        metrics: '브랜드 신뢰도 조사 1위, 소비자 신뢰도 92%',
        impact: '높은 초기 구매 의사 결정률',
        examples: ['제약회사 배경', '품질 관리 인증']
      },
      '광범위한 유통망': {
        description: '온/오프라인 포괄하는 강력한 유통 네트워크',
        metrics: '전국 15,000개 이상 판매처, 유통 커버리지 92%',
        impact: '높은 접근성 및 구매 편의성',
        examples: ['약국 네트워크 활용', '대형마트 전용 코너']
      },
      '효율적인 생산 규모': {
        description: '대규모 생산 설비 통한 원가 경쟁력',
        metrics: '생산 효율성 업계 평균 대비 32% 높음, 규모의 경제 실현',
        impact: '가격 경쟁력 확보',
        examples: ['자동화 생산 라인', 'GMP 인증 시설']
      }
    },
    weaknessesDetails: {
      '혁신성 부족': {
        description: '새로운 소비자 니즈에 대한 대응 부족',
        metrics: '신제품 출시 주기 18개월 (업계 평균 8개월)',
        impact: '트렌드 선도 어려움',
        recommendations: ['민첩한 R&D 프로세스 도입', '시장 트렌드 모니터링 강화']
      },
      '젊은 층 공략 미흡': {
        description: '주 고객층이 40대 이상에 집중',
        metrics: '20-30대 고객 비중 18% (업계 평균 35%)',
        impact: '장기적 고객 기반 확보 어려움',
        recommendations: ['Z세대 타겟 제품 개발', '젊은 이미지의 서브브랜드 런칭']
      },
      '디지털 전환 지연': {
        description: '디지털 기술 및 플랫폼 활용 미흡',
        metrics: '디지털 채널 매출 비중 22% (업계 평균 41%)',
        impact: '옴니채널 경쟁력 약화',
        recommendations: ['디지털 트랜스포메이션 가속화', '데이터 기반 마케팅 강화']
      }
    },
    representativeProduct: {
      name: '유한 오메가3',
      price: 22900,
      image: 'https://shop-phinf.pstatic.net/20210510_264/16206595319421oR4j_JPEG/21787318783259990_277337275.jpg',
      url: 'https://smartstore.naver.com/yuhan/products/5023613090',
      reviews: 5387,
      rank: 1,
      productId: 'yuhan-omega3',
      collectedAt: new Date().toISOString()
    }
  }
};

// 브랜드별 기본 제품 데이터 생성 함수
// 브랜드별 제품 생성 함수
function generateBrandProducts(brandId: string): CompetitorProduct[] {
  const brandInfo = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === brandId);
  const brandName = brandInfo ? brandInfo.name : brandId;
  const brandImage = BRAND_PRODUCT_IMAGES[brandId as keyof typeof BRAND_PRODUCT_IMAGES];
  const storeUrl = BRAND_STORE_URLS[brandId as keyof typeof BRAND_STORE_URLS];
  
  // 브랜드별 기본 제품 3개 생성
  return [
    {
      productId: `${brandId}-multivit-${Date.now()}`,
      name: `${brandName} 종합비타민`,
      price: 25000 + Math.floor(Math.random() * 15000),
      reviews: 100 + Math.floor(Math.random() * 900),
      rank: 1,
      image: brandImage,
      url: storeUrl ? `${storeUrl}/products/${Date.now()}` : undefined,
      collectedAt: new Date().toISOString()
    },
    {
      productId: `${brandId}-omega3-${Date.now()}`,
      name: `${brandName} 오메가3`,
      price: 20000 + Math.floor(Math.random() * 20000),
      reviews: 100 + Math.floor(Math.random() * 700),
      rank: 2,
      image: brandImage,
      url: storeUrl ? `${storeUrl}/products/${Date.now()+1}` : undefined,
      collectedAt: new Date().toISOString()
    },
    {
      productId: `${brandId}-probiotic-${Date.now()}`,
      name: `${brandName} 프로바이오틱스`,
      price: 30000 + Math.floor(Math.random() * 25000),
      reviews: 100 + Math.floor(Math.random() * 1000),
      rank: 3,
      image: brandImage,
      url: storeUrl ? `${storeUrl}/products/${Date.now()+2}` : undefined,
      collectedAt: new Date().toISOString()
    }
  ];
};

// 경쟁사 모니터링 메인 컴포넌트
export default function CompetitorMonitoring() {
  // 상태 관리
  const [keyword, setKeyword] = useState<string>('영양제');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [monitoringFrequency, setMonitoringFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [alertThresholds, setAlertThresholds] = useState({
    priceChangePercent: 5,
    newProduct: true,
    rankChange: true,
    reviewChangePercent: 10
  });
  const [monitoringResults, setMonitoringResults] = useState<MonitoringResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfigDialog, setShowConfigDialog] = useState<boolean>(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [insightsMode, setInsightsMode] = useState<boolean>(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 경쟁사 선택 핸들러
  const handleCompetitorToggle = (competitorId: string) => {
    if (competitors.includes(competitorId)) {
      setCompetitors(competitors.filter(id => id !== competitorId));
    } else {
      setCompetitors([...competitors, competitorId]);
    }
  };

  // 모니터링 설정 저장
  const saveMonitoringConfig = () => {
    if (keyword.trim() === '') {
      toast({
        title: "키워드를 입력하세요",
        description: "모니터링할 키워드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (competitors.length === 0) {
      toast({
        title: "경쟁사를 선택하세요",
        description: "최소 한 개 이상의 경쟁사를 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    const config: MonitoringConfig = {
      keyword,
      competitors,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      monitorFrequency: monitoringFrequency,
      alertThresholds: {
        priceChangePercent: alertThresholds.priceChangePercent,
        newProduct: alertThresholds.newProduct,
        rankChange: alertThresholds.rankChange,
        reviewChangePercent: alertThresholds.reviewChangePercent
      }
    };

    // API 호출 대신 즉시 모니터링 실행
    setTimeout(() => {
      setShowConfigDialog(false);
      runMonitoring();
    }, 1000);
  };

  // 모니터링 실행
  const runMonitoring = () => {
    setLoading(true);
    setTimeout(() => {
      // 모니터링 결과 생성 (실제로는 API 호출)
      const mockResult = generateMockResults();
      setMonitoringResults(mockResult);
      setLoading(false);
    }, 1500);
  };

  // 샘플 결과 생성 (실제로는 API 연동)
  const generateMockResults = (): MonitoringResult => {
    const changesDetected: Record<string, CompetitorChanges> = {};
    
    // 선택된 모든 경쟁사에 대해 결과 생성
    competitors.forEach(competitor => {
      const priceChanges: PriceChange[] = [];
      const newProducts: NewProductAlert[] = [];
      const rankChanges: RankChange[] = [];
      const reviewChanges: ReviewChange[] = [];
      
      // 각 경쟁사별 제품 데이터 사용
      const products = TOP_HEALTH_PRODUCTS[competitor as keyof typeof TOP_HEALTH_PRODUCTS] || [];
      
      // 제품 데이터가 없는 경우 브랜드에 맞는 기본 제품 데이터 생성
      const brandProducts = products.length > 0 ? products : generateBrandProducts(competitor);
      
      // 가격 변화 (약 50% 확률로 발생)
      if (Math.random() > 0.5 && brandProducts.length > 0) {
        const product = brandProducts[0];
        const oldPrice = product.price;
        const newPrice = Math.round(oldPrice * (1 + (Math.random() * 0.2 - 0.1)));
        const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
        
        if (Math.abs(changePercent) >= alertThresholds.priceChangePercent) {
          priceChanges.push({
            product: { ...product, collectedAt: new Date().toISOString() },
            oldPrice,
            newPrice,
            changePercent
          });
        }
      }
      
      // 순위 변화 (약 40% 확률로 발생)
      if (alertThresholds.rankChange && Math.random() > 0.6 && brandProducts.length > 0) {
        const product = brandProducts[Math.floor(Math.random() * brandProducts.length)];
        const oldRank = product.rank;
        const change = Math.floor(Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1);
        const newRank = Math.max(1, oldRank - change);
        
        rankChanges.push({
          product: { ...product, collectedAt: new Date().toISOString() },
          oldRank,
          newRank,
          change
        });
      }
      
      // 리뷰 변화 (약 50% 확률로 발생)
      if (Math.random() > 0.5 && brandProducts.length > 0) {
        const product = brandProducts[Math.floor(Math.random() * brandProducts.length)];
        const oldReviews = product.reviews;
        const newReviews = Math.round(oldReviews * (1 + (Math.random() * 0.3)));
        const changePercent = ((newReviews - oldReviews) / oldReviews) * 100;
        
        if (changePercent >= alertThresholds.reviewChangePercent) {
          reviewChanges.push({
            product: { ...product, collectedAt: new Date().toISOString() },
            oldReviews,
            newReviews,
            changePercent
          });
        }
      }
      
      // 새 제품 알림 (약 25% 확률로 발생)
      if (alertThresholds.newProduct && Math.random() > 0.75) {
        const brandInfo = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === competitor);
        const brandName = brandInfo ? brandInfo.name : competitor;
        
        // 브랜드별 신제품 이미지 및 정보 생성
        const brandImage = BRAND_PRODUCT_IMAGES[competitor as keyof typeof BRAND_PRODUCT_IMAGES] || 
          'https://shop-phinf.pstatic.net/20230111_10/1673421821959A6DYz_JPEG/12690534937377620_942697878.jpg';
        
        newProducts.push({
          product: {
            productId: `${competitor}-new-${Date.now()}`,
            name: `신제품 ${brandName} ${Math.random() > 0.5 ? '종합비타민' : '프로바이오틱스'}`,
            price: Math.round(15000 + Math.random() * 35000),
            reviews: Math.floor(Math.random() * 50),
            rank: Math.floor(Math.random() * 10) + 4,
            image: brandImage,
            collectedAt: new Date().toISOString()
          },
          type: 'new_product'
        });
      }
      
      // 변화 감지 데이터 저장 (알림 여부 계산)
      changesDetected[competitor] = {
        priceChanges,
        newProducts,
        rankChanges,
        reviewChanges,
        alerts: priceChanges.length > 0 || newProducts.length > 0 || rankChanges.length > 0 || reviewChanges.length > 0
      };
    });
    
    // 전체 알림 여부 설정
    const hasAlerts = Object.values(changesDetected).some(changes => changes.alerts);
    
    return {
      keyword,
      checkedAt: new Date().toISOString(),
      changesDetected,
      hasAlerts
    };
  };
  
  // UI 비교 모드 토글
  const toggleInsightsMode = () => {
    setInsightsMode(!insightsMode);
  };
  
  // 날짜 포맷팅 유틸리티
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date);
  };
  
  // 숫자 포맷팅 유틸리티
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };
  
  // 변경률 표시 컴포넌트
  const ChangeIndicator = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-gray-500">0%</span>;
    
    const isPositive = value > 0;
    const color = isPositive ? "text-green-600" : "text-red-600";
    const icon = isPositive ? <ArrowUp className="inline w-3 h-3" /> : <ArrowDown className="inline w-3 h-3" />;
    
    return (
      <span className={color}>
        {icon} {Math.abs(value).toFixed(1)}%
      </span>
    );
  };
  
  // 가격 변화 랜더링
  const renderPriceChanges = (changes: PriceChange[], competitor: string) => {
    if (changes.length === 0) return null;
    
    const brandInfo = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === competitor);
    const brandName = brandInfo ? brandInfo.name : competitor;
    
    return (
      <div className="space-y-3 mb-4">
        <h4 className="font-medium text-sm">가격 변동</h4>
        {changes.map((change, index) => (
          <div key={`price-${index}-${change.product.productId}`} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md">
            <div className="flex-shrink-0 w-12 h-12">
              <ProductImage src={change.product.image} alt={change.product.name} className="rounded-md" />
            </div>
            <div className="flex-grow min-w-0">
              <h5 className="text-sm font-medium truncate">{change.product.name}</h5>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">₩{formatNumber(change.oldPrice)} → ₩{formatNumber(change.newPrice)}</span>
                <ChangeIndicator value={change.changePercent} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // 순위 변화 랜더링
  const renderRankChanges = (changes: RankChange[], competitor: string) => {
    if (changes.length === 0) return null;
    
    const brandInfo = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === competitor);
    const brandName = brandInfo ? brandInfo.name : competitor;
    
    return (
      <div className="space-y-3 mb-4">
        <h4 className="font-medium text-sm">순위 변동</h4>
        {changes.map((change, index) => (
          <div key={`rank-${index}-${change.product.productId}`} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md">
            <div className="flex-shrink-0 w-12 h-12">
              <ProductImage src={change.product.image} alt={change.product.name} className="rounded-md" />
            </div>
            <div className="flex-grow min-w-0">
              <h5 className="text-sm font-medium truncate">{change.product.name}</h5>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{change.oldRank}위 → {change.newRank}위</span>
                <span className={change.change > 0 ? "text-green-600" : "text-red-600"}>
                  {change.change > 0 ? <ArrowUp className="inline w-3 h-3" /> : <ArrowDown className="inline w-3 h-3" />}
                  {Math.abs(change.change)} 단계
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // 리뷰 변화 랜더링
  const renderReviewChanges = (changes: ReviewChange[], competitor: string) => {
    if (changes.length === 0) return null;
    
    const brandInfo = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === competitor);
    const brandName = brandInfo ? brandInfo.name : competitor;
    
    return (
      <div className="space-y-3 mb-4">
        <h4 className="font-medium text-sm">리뷰 변동</h4>
        {changes.map((change, index) => (
          <div key={`review-${index}-${change.product.productId}`} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md">
            <div className="flex-shrink-0 w-12 h-12">
              <ProductImage src={change.product.image} alt={change.product.name} className="rounded-md" />
            </div>
            <div className="flex-grow min-w-0">
              <h5 className="text-sm font-medium truncate">{change.product.name}</h5>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500"><Star className="inline w-3 h-3 text-yellow-500" /> {formatNumber(change.oldReviews)} → {formatNumber(change.newReviews)}</span>
                <ChangeIndicator value={change.changePercent} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // 새 제품 알림 랜더링
  const renderNewProducts = (products: NewProductAlert[], competitor: string) => {
    if (products.length === 0) return null;
    
    const brandInfo = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === competitor);
    const brandName = brandInfo ? brandInfo.name : competitor;
    
    return (
      <div className="space-y-3 mb-4">
        <h4 className="font-medium text-sm">신규 제품</h4>
        {products.map((item, index) => (
          <div key={`new-${index}-${item.product.productId}`} className="flex items-center space-x-3 p-2 bg-indigo-50 rounded-md">
            <div className="flex-shrink-0 w-12 h-12">
              <ProductImage src={item.product.image} alt={item.product.name} className="rounded-md" />
            </div>
            <div className="flex-grow min-w-0">
              <h5 className="text-sm font-medium truncate">{item.product.name}</h5>
              <div className="flex justify-between text-sm">
                <Badge variant="outline" className="bg-indigo-100 border-indigo-200 text-indigo-700">신규</Badge>
                <span className="text-gray-700">₩{formatNumber(item.product.price)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // UI 렌더링
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">경쟁사 모니터링</h1>
      
      {/* 탭 UI */}
      <Tabs defaultValue="monitoring" className="mt-4">
        <TabsList className="mb-4">
          <TabsTrigger value="monitoring">모니터링</TabsTrigger>
          <TabsTrigger value="insights">ML 인사이트</TabsTrigger>
        </TabsList>
        
        {/* 모니터링 탭 내용 */}
        <TabsContent value="monitoring">
          <div className="mb-4 flex justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">경쟁사 변화 모니터링</h2>
              <p className="text-gray-500 text-sm">선택한 경쟁사의 제품 가격, 순위, 리뷰 변화를 모니터링합니다.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowConfigDialog(true)}
                className="flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                설정
              </Button>
              <div className="relative w-[280px]">
                <Input
                  type="text"
                  placeholder="키워드 입력 (영양제, 비타민 등)"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button 
                onClick={runMonitoring} 
                disabled={loading || competitors.length === 0 || !keyword.trim()}
                className="flex items-center whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    모니터링 실행
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* 설정 다이얼로그 */}
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>모니터링 설정</DialogTitle>
                <DialogDescription>
                  모니터링할 키워드와 경쟁사를 선택하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="keyword">모니터링할 키워드</Label>
                  <Input
                    id="keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="영양제, 비타민, 건강기능식품 등 키워드 입력"
                  />
                </div>
                <div className="space-y-2">
                  <Label>경쟁사 선택</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {HEALTH_SUPPLEMENT_BRANDS.map((brand) => (
                      <div key={brand.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`competitor-${brand.id}`}
                          checked={competitors.includes(brand.id)}
                          onCheckedChange={() => handleCompetitorToggle(brand.id)}
                        />
                        <Label htmlFor={`competitor-${brand.id}`} className="text-sm font-normal cursor-pointer">
                          {brand.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>모니터링 주기</Label>
                  <Select 
                    value={monitoringFrequency} 
                    onValueChange={(value) => setMonitoringFrequency(value as 'daily' | 'weekly')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="모니터링 주기 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">매일</SelectItem>
                      <SelectItem value="weekly">매주</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>알림 설정</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="price-change" className="text-sm font-normal">
                        가격 변동 (%)
                      </Label>
                      <Input
                        id="price-change"
                        type="number"
                        value={alertThresholds.priceChangePercent}
                        onChange={(e) => setAlertThresholds({
                          ...alertThresholds,
                          priceChangePercent: parseInt(e.target.value) || 0
                        })}
                        className="w-20 h-8"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="reviews-change" className="text-sm font-normal">
                        리뷰 증가 (%)
                      </Label>
                      <Input
                        id="reviews-change"
                        type="number"
                        value={alertThresholds.reviewChangePercent}
                        onChange={(e) => setAlertThresholds({
                          ...alertThresholds,
                          reviewChangePercent: parseInt(e.target.value) || 0
                        })}
                        className="w-20 h-8"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="new-product" className="text-sm font-normal">
                        신규 제품 알림
                      </Label>
                      <Switch
                        id="new-product"
                        checked={alertThresholds.newProduct}
                        onCheckedChange={(checked) => setAlertThresholds({
                          ...alertThresholds,
                          newProduct: checked
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rank-change" className="text-sm font-normal">
                        순위 변동 알림
                      </Label>
                      <Switch
                        id="rank-change"
                        checked={alertThresholds.rankChange}
                        onCheckedChange={(checked) => setAlertThresholds({
                          ...alertThresholds,
                          rankChange: checked
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  취소
                </Button>
                <Button onClick={saveMonitoringConfig}>
                  저장
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* 모니터링 결과 */}
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">경쟁사 데이터를 분석 중입니다...</p>
              </div>
            </div>
          ) : monitoringResults ? (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium">모니터링 결과: {monitoringResults.keyword}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(monitoringResults.checkedAt)} 기준
                  </p>
                </div>
                {monitoringResults.hasAlerts && (
                  <Badge variant="destructive" className="px-3 py-1">
                    변경 감지됨
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(monitoringResults.changesDetected).map(([competitor, changes]) => {
                  const brandInfo = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === competitor);
                  const brandName = brandInfo ? brandInfo.name : competitor;
                  const hasChanges = changes.alerts;
                  
                  return (
                    <Card key={competitor} className={`overflow-hidden ${hasChanges ? 'border-orange-300' : ''}`}>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-lg flex justify-between items-center">
                          {brandName}
                          {hasChanges && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                              변경 감지
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {BRAND_STORE_URLS[competitor as keyof typeof BRAND_STORE_URLS] ? (
                            <a 
                              href={BRAND_STORE_URLS[competitor as keyof typeof BRAND_STORE_URLS]} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1 text-xs"
                            >
                              <SiNaver className="inline text-green-600" /> 스토어 방문
                            </a>
                          ) : ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        {hasChanges ? (
                          <div className="space-y-3">
                            {renderPriceChanges(changes.priceChanges, competitor)}
                            {renderRankChanges(changes.rankChanges, competitor)}
                            {renderReviewChanges(changes.reviewChanges, competitor)}
                            {renderNewProducts(changes.newProducts, competitor)}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-gray-500">
                            <p>변경 사항이 감지되지 않았습니다</p>
                            <p className="text-sm mt-1">모든 제품이 이전 상태와 동일합니다</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : competitors.length > 0 ? (
            <div className="text-center p-10 border border-dashed rounded-lg my-8">
              <ShoppingBag className="h-10 w-10 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">모니터링 준비 완료</h3>
              <p className="text-gray-500 mt-2 mb-4">
                {competitors.length}개 경쟁사에 대한 모니터링이 설정되었습니다.<br />
                '모니터링 실행' 버튼을 클릭하여 분석을 시작하세요.
              </p>
              <Button onClick={runMonitoring} className="mt-2">
                모니터링 실행
              </Button>
            </div>
          ) : (
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle>모니터링 설정이 필요합니다</AlertTitle>
              <AlertDescription>
                '설정' 버튼을 클릭하여 모니터링할 브랜드와 키워드를 설정하세요.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        {/* ML 인사이트 탭 내용 */}
        <TabsContent value="insights">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">경쟁사 ML 인사이트</h2>
            <p className="text-gray-500 text-sm">인공지능 분석을 통한 경쟁사 강점, 약점 및 시장 포지셔닝 분석</p>
          </div>
          
          {/* 브랜드 선택 */}
          <div className="mb-6 flex flex-wrap gap-2">
            {HEALTH_SUPPLEMENT_BRANDS.slice(0, 4).map((brand) => (
              <Button
                key={brand.id}
                variant={selectedCompetitor === brand.id ? "default" : "outline"}
                onClick={() => setSelectedCompetitor(brand.id)}
                className="px-4"
              >
                {brand.name}
              </Button>
            ))}
          </div>
          
          {/* 선택된 브랜드 인사이트 */}
          {selectedCompetitor && COMPETITOR_INSIGHTS_DATA[selectedCompetitor] && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>기본 인사이트</span>
                    <Badge 
                      variant={
                        COMPETITOR_INSIGHTS_DATA[selectedCompetitor].threatLevel > 80 ? "destructive" : 
                        COMPETITOR_INSIGHTS_DATA[selectedCompetitor].threatLevel > 60 ? "outline" : "outline"
                      }
                      className={`ml-2 ${COMPETITOR_INSIGHTS_DATA[selectedCompetitor].threatLevel > 60 && COMPETITOR_INSIGHTS_DATA[selectedCompetitor].threatLevel <= 80 ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : ""}`}
                    >
                      위협도 {COMPETITOR_INSIGHTS_DATA[selectedCompetitor].threatLevel}%
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {COMPETITOR_INSIGHTS_DATA[selectedCompetitor].competitor}의 시장 포지션과 전략 분석
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">시장 점유율</p>
                        <p className="text-lg font-medium">{COMPETITOR_INSIGHTS_DATA[selectedCompetitor].marketShare}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">성장률</p>
                        <p className="text-lg font-medium">{COMPETITOR_INSIGHTS_DATA[selectedCompetitor].growthRate > 0 ? '+' : ''}{COMPETITOR_INSIGHTS_DATA[selectedCompetitor].growthRate}%</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">가격 전략</p>
                        <p className="capitalize text-lg font-medium">
                          {COMPETITOR_INSIGHTS_DATA[selectedCompetitor].priceStrategy === 'premium' ? '프리미엄' :
                           COMPETITOR_INSIGHTS_DATA[selectedCompetitor].priceStrategy === 'aggressive' ? '공격적' :
                           COMPETITOR_INSIGHTS_DATA[selectedCompetitor].priceStrategy === 'economy' ? '저가형' : '표준'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">대표 제품</h4>
                      <div className="flex gap-4 items-center">
                        <div className="flex-shrink-0 w-16 h-16">
                          <ProductImage 
                            src={COMPETITOR_INSIGHTS_DATA[selectedCompetitor].representativeProduct.image}
                            alt={COMPETITOR_INSIGHTS_DATA[selectedCompetitor].representativeProduct.name}
                          />
                        </div>
                        <div>
                          <h5 className="font-medium">{COMPETITOR_INSIGHTS_DATA[selectedCompetitor].representativeProduct.name}</h5>
                          <p className="text-sm text-gray-500">₩{formatNumber(COMPETITOR_INSIGHTS_DATA[selectedCompetitor].representativeProduct.price)}</p>
                          <div className="flex items-center text-sm gap-2 mt-1">
                            <span className="flex items-center"><Star className="w-3 h-3 text-yellow-500 mr-1" />{COMPETITOR_INSIGHTS_DATA[selectedCompetitor].representativeProduct.reviews}</span>
                            <span>#{COMPETITOR_INSIGHTS_DATA[selectedCompetitor].representativeProduct.rank} 랭킹</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">강점 & 약점 분석</CardTitle>
                  <CardDescription>
                    AI 기반 경쟁사 핵심 강점과 취약점 분석
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {/* 강점/약점 레이더 차트 */}
                  <div className="h-56 mb-4">
                    <StrengthWeaknessChart 
                      competitor={COMPETITOR_INSIGHTS_DATA[selectedCompetitor].competitor}
                      strengthsData={{
                        '강점 수': COMPETITOR_INSIGHTS_DATA[selectedCompetitor].strengths.length * 20,
                        '위협도': COMPETITOR_INSIGHTS_DATA[selectedCompetitor].threatLevel,
                        '시장점유율': COMPETITOR_INSIGHTS_DATA[selectedCompetitor].marketShare
                      }}
                      weaknessesData={{
                        '약점 수': COMPETITOR_INSIGHTS_DATA[selectedCompetitor].weaknesses.length * 20,
                        '성장률': COMPETITOR_INSIGHTS_DATA[selectedCompetitor].growthRate > 0 
                          ? COMPETITOR_INSIGHTS_DATA[selectedCompetitor].growthRate : 0
                      }}
                    />
                  </div>
                  
                  {/* 강점 목록 */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2 text-green-700">주요 강점</h4>
                    <ul className="space-y-1">
                      {COMPETITOR_INSIGHTS_DATA[selectedCompetitor].strengths.map((strength, index) => (
                        <li key={`strength-${index}`} className="text-sm flex items-start gap-2">
                          <span className="text-green-500 flex-shrink-0">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* 약점 목록 */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2 text-red-700">주요 약점</h4>
                    <ul className="space-y-1">
                      {COMPETITOR_INSIGHTS_DATA[selectedCompetitor].weaknesses.map((weakness, index) => (
                        <li key={`weakness-${index}`} className="text-sm flex items-start gap-2">
                          <span className="text-red-500 flex-shrink-0">✗</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              {/* 강점 상세 정보 */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">강점 상세 분석</CardTitle>
                  <CardDescription>
                    경쟁사 핵심 강점과 관련 메트릭스
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {COMPETITOR_INSIGHTS_DATA[selectedCompetitor].strengths.map((strength, index) => {
                      const details = COMPETITOR_INSIGHTS_DATA[selectedCompetitor].strengthsDetails[strength];
                      return (
                        <div key={`strength-detail-${index}`} className="p-4 bg-green-50 rounded-lg">
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
                              <h5 className="text-sm font-medium text-gray-700 mb-1">대표 사례</h5>
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
                </CardContent>
              </Card>
              
              {/* 약점 상세 정보 */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">약점 상세 분석 및 대응 전략</CardTitle>
                  <CardDescription>
                    경쟁사 약점 및 이를, 활용한 시장 대응 전략
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {COMPETITOR_INSIGHTS_DATA[selectedCompetitor].weaknesses.map((weakness, index) => {
                      const details = COMPETITOR_INSIGHTS_DATA[selectedCompetitor].weaknessesDetails[weakness];
                      return (
                        <div key={`weakness-detail-${index}`} className="p-4 bg-red-50 rounded-lg">
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
                </CardContent>
              </Card>
            </div>
          )}
          
          {!selectedCompetitor && (
            <div className="text-center p-10 border border-dashed rounded-lg my-8">
              <Info className="h-10 w-10 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">브랜드를 선택하세요</h3>
              <p className="text-gray-500 mt-2">
                위의 브랜드 중 하나를 선택하여 ML 인사이트를 확인하세요.
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* 키워드 분석 탭 내용 */}
        <TabsContent value="keywords">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">키워드 분석</h2>
            <p className="text-gray-500 text-sm">건강기능식품 관련 키워드 트렌드 및 인사이트 분석</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">인기 검색어</CardTitle>
                <CardDescription>
                  최근 인기 건강기능식품 검색어
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["멀티비타민", "유산균", "오메가3", "홍삼", "비타민D", "콜라겐", "루테인", "마그네슘", "철분", "프로폴리스"].map((kw, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm w-6 text-center">{i+1}</span>
                        <span>{kw}</span>
                      </div>
                      <Badge variant={i < 3 ? "default" : "outline"} className="text-xs">
                        {i === 0 ? "+12%" : i === 1 ? "+8%" : i === 2 ? "+5%" : 
                         i === 8 ? "-3%" : i === 9 ? "-5%" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">계절별 인기 키워드</CardTitle>
                <CardDescription>
                  계절에 따른 건강기능식품 트렌드
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">봄 (3월-5월)</h3>
                    <div className="flex flex-wrap gap-2">
                      {["알레르기 케어", "눈건강", "피로회복", "다이어트", "피부관리"].map((tag, i) => (
                        <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">여름 (6월-8월)</h3>
                    <div className="flex flex-wrap gap-2">
                      {["유산균", "다이어트", "피부관리", "면역력", "장건강"].map((tag, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">가을 (9월-11월)</h3>
                    <div className="flex flex-wrap gap-2">
                      {["면역력", "홍삼", "오메가3", "관절", "눈건강"].map((tag, i) => (
                        <Badge key={i} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">겨울 (12월-2월)</h3>
                    <div className="flex flex-wrap gap-2">
                      {["면역력", "비타민D", "홍삼", "멀티비타민", "수면개선"].map((tag, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">2025 주목 키워드</CardTitle>
                <CardDescription>
                  올해 성장세가 두드러진 건강 키워드
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "항산화 영양제", growth: "+38%" },
                    { name: "면역력 강화", growth: "+32%" },
                    { name: "수면 개선", growth: "+27%" },
                    { name: "슈퍼푸드", growth: "+24%" },
                    { name: "남성 갱년기", growth: "+21%" },
                    { name: "탈모 영양제", growth: "+18%" },
                    { name: "관절 건강", growth: "+16%" },
                    { name: "뇌 건강", growth: "+15%" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>{item.name}</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {item.growth}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">브랜드별 주력 키워드</CardTitle>
                <CardDescription>
                  경쟁사 브랜드별 주력 마케팅 키워드 분석
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { 
                      brand: '닥터린',
                      keywords: ['프리미엄', '스마트 영양', '첨단 기술', '과학적 검증', '효능 중심'],
                      color: 'blue'
                    },
                    { 
                      brand: '내츄럴플러스',
                      keywords: ['자연주의', '천연', '유기농', '안전성', '무첨가'],
                      color: 'green'
                    },
                    { 
                      brand: '에스더몰',
                      keywords: ['명품', '프리미엄', '고급화', '특허', '엄선된 원료'],
                      color: 'purple'
                    },
                    { 
                      brand: '안국건강',
                      keywords: ['전통', '신뢰', '국민 건강', '가성비', '효도'],
                      color: 'red'
                    },
                    { 
                      brand: '고려은단',
                      keywords: ['역사', '전통', '믿음', '국민 브랜드', '가족 건강'],
                      color: 'yellow'
                    },
                    { 
                      brand: '종근당건강',
                      keywords: ['국내 1위', '검증된', '정직한', '의약학 전문', '품질'],
                      color: 'indigo'
                    },
                    { 
                      brand: '유한양행',
                      keywords: ['전통', '신뢰', '국민 건강', '의약품 전문', '품질 관리'],
                      color: 'cyan'
                    }
                  ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-lg ${
                      item.color === 'blue' ? 'bg-blue-50' :
                      item.color === 'green' ? 'bg-green-50' :
                      item.color === 'purple' ? 'bg-purple-50' :
                      item.color === 'red' ? 'bg-red-50' :
                      item.color === 'yellow' ? 'bg-yellow-50' :
                      item.color === 'indigo' ? 'bg-indigo-50' :
                      item.color === 'cyan' ? 'bg-cyan-50' : 'bg-gray-50'
                    }`}>
                      <h3 className={`font-medium mb-2 ${
                      item.color === 'blue' ? 'text-blue-800' :
                      item.color === 'green' ? 'text-green-800' :
                      item.color === 'purple' ? 'text-purple-800' :
                      item.color === 'red' ? 'text-red-800' :
                      item.color === 'yellow' ? 'text-yellow-800' :
                      item.color === 'indigo' ? 'text-indigo-800' :
                      item.color === 'cyan' ? 'text-cyan-800' : 'text-gray-800'
                    }`}>{item.brand}</h3>
                      <div className="flex flex-wrap gap-2">
                        {item.keywords.map((keyword, j) => (
                          <Badge key={j} variant="outline" className={
                            item.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            item.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
                            item.color === 'purple' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            item.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
                            item.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            item.color === 'indigo' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                            item.color === 'cyan' ? 'bg-cyan-100 text-cyan-700 border-cyan-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                          }>
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}