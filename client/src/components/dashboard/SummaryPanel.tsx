/**
 * SummaryPanel.tsx - 키워드 분석 요약 컴포넌트
 */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Search,
  ShoppingBag,
  TrendingUp,
  Award,
  DollarSign,
  Users
} from 'lucide-react';

interface KeywordSummary {
  keyword: string;
  searchVolume: {
    total: number;
    pc: number;
    mobile: number;
  };
  productCount: number;
  competitionLevel: string;
  growthTrend: string;
  profitPotential: string;
  overallScore: number;
  overallGrade: string;
}

interface SummaryPanelProps {
  data: KeywordSummary;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ data }) => {
  // 숫자 포맷팅 (천 단위 콤마)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // 경쟁도 레벨에 따른 색상
  const getCompetitionColor = (level: string) => {
    switch (level) {
      case '매우 낮음': return 'text-green-500';
      case '낮음': return 'text-green-400';
      case '보통': return 'text-yellow-500';
      case '높음': return 'text-orange-500';
      case '매우 높음': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // 성장 트렌드에 따른 색상
  const getGrowthColor = (trend: string) => {
    switch (trend) {
      case '급상승': return 'text-green-500';
      case '상승': return 'text-green-400';
      case '안정': return 'text-blue-500';
      case '하락': return 'text-orange-500';
      case '급하락': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // 수익 잠재력에 따른 색상
  const getProfitColor = (potential: string) => {
    switch (potential) {
      case '매우 높음': return 'text-green-500';
      case '높음': return 'text-green-400';
      case '보통': return 'text-yellow-500';
      case '낮음': return 'text-orange-500';
      case '매우 낮음': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">월간 검색량</p>
                <h3 className="text-2xl font-bold mt-1">{formatNumber(data.searchVolume.total)}</h3>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <div className="mr-2">PC: {data.searchVolume.pc}%</div>
                  <div>모바일: {data.searchVolume.mobile}%</div>
                </div>
              </div>
              <div className="rounded-full bg-blue-100 p-2">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">상품 수</p>
                <h3 className="text-2xl font-bold mt-1">{formatNumber(data.productCount)}</h3>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <div className="mr-2">상품 다양성 지수</div>
                </div>
              </div>
              <div className="rounded-full bg-green-100 p-2">
                <ShoppingBag className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">종합 점수</p>
                <h3 className="text-2xl font-bold mt-1">{data.overallScore}/100</h3>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <div className="mr-2">{data.overallGrade} 등급</div>
                </div>
              </div>
              <div className="rounded-full bg-purple-100 p-2">
                <Award className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-2">
              <BarChart className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="font-medium">경쟁 강도</h3>
            </div>
            <p className={`text-lg font-semibold ${getCompetitionColor(data.competitionLevel)}`}>
              {data.competitionLevel}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              경쟁 강도는 키워드 검색량 대비 상품 수와 경쟁사 수를 고려합니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              <h3 className="font-medium">성장 추세</h3>
            </div>
            <p className={`text-lg font-semibold ${getGrowthColor(data.growthTrend)}`}>
              {data.growthTrend}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              최근 3개월 검색량 변화 추세를 반영한 성장성 지표입니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 mr-2 text-green-500" />
              <h3 className="font-medium">수익 잠재력</h3>
            </div>
            <p className={`text-lg font-semibold ${getProfitColor(data.profitPotential)}`}>
              {data.profitPotential}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              예상 마진율과 시장 규모를 기반으로 한 수익성 지표입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SummaryPanel;