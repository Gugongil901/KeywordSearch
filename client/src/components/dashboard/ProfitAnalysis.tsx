/**
 * ProfitAnalysis.tsx - 키워드 수익성 분석 컴포넌트
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  PieChart, 
  BarChart, 
  ShoppingBag, 
  TrendingUp, 
  Target
} from 'lucide-react';

interface ProfitData {
  profitScore: number;
  estimatedMargin: number;
  marginRate: number;
  marginToCpcRatio: number;
  avgPrice: number;
  avgCPC: number;
  conversionRate: number;
  ROAS: number;
  profitabilityLevel: string;
  priceDistribution: {
    min: number;
    max: number;
    average: number;
    median: number;
    ranges: {
      range: string;
      count: number;
      percentage: number;
    }[];
  }
}

interface ProfitAnalysisProps {
  data: ProfitData;
}

const ProfitAnalysis: React.FC<ProfitAnalysisProps> = ({ data }) => {
  // 숫자 포맷팅 (천 단위 콤마)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // 가격 포맷팅
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(num);
  };

  // 퍼센트 포맷팅
  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  // 수익성 레벨에 따른 색상
  const getProfitabilityColor = (level: string) => {
    switch (level) {
      case '매우 높음':
        return 'text-green-500';
      case '높음':
        return 'text-green-400';
      case '보통':
        return 'text-yellow-500';
      case '낮음':
        return 'text-orange-500';
      case '매우 낮음':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm font-medium">수익 점수</span>
                </div>
                <span className="text-sm font-bold">{data.profitScore}/100</span>
              </div>
              <Progress value={data.profitScore} className="h-2" />
              <p className={`text-sm font-medium ${getProfitabilityColor(data.profitabilityLevel)}`}>
                {data.profitabilityLevel}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm font-medium">평균 판매가</span>
              </div>
              <span className="text-sm font-bold">{formatCurrency(data.avgPrice)}</span>
            </div>
            <p className="text-sm text-gray-500">
              카테고리 평균 대비 {data.avgPrice > data.priceDistribution.average ? '높음' : '낮음'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-2 text-purple-500" />
                <span className="text-sm font-medium">예상 마진율</span>
              </div>
              <span className="text-sm font-bold">{formatPercent(data.marginRate)}</span>
            </div>
            <p className="text-sm text-gray-500">
              예상 마진: {formatCurrency(data.estimatedMargin)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              가격 분포 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">최저가</p>
                  <p className="text-lg font-bold">{formatCurrency(data.priceDistribution.min)}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">최고가</p>
                  <p className="text-lg font-bold">{formatCurrency(data.priceDistribution.max)}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">평균가</p>
                  <p className="text-lg font-bold">{formatCurrency(data.priceDistribution.average)}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">중간값</p>
                  <p className="text-lg font-bold">{formatCurrency(data.priceDistribution.median)}</p>
                </div>
              </div>

              <div className="space-y-2">
                {data.priceDistribution.ranges.map((range, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{range.range}</span>
                      <span>{formatPercent(range.percentage)}</span>
                    </div>
                    <Progress value={range.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              광고 효율성 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">평균 CPC</p>
                  <p className="text-lg font-bold">{formatCurrency(data.avgCPC)}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">마진/CPC 비율</p>
                  <p className="text-lg font-bold">{data.marginToCpcRatio.toFixed(1)}x</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">전환율</p>
                  <p className="text-lg font-bold">{formatPercent(data.conversionRate)}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">ROAS</p>
                  <p className="text-lg font-bold">{data.ROAS.toFixed(1)}x</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                  <h3 className="font-medium text-blue-700">수익성 인사이트</h3>
                </div>
                <p className="text-sm text-blue-600">
                  {data.marginToCpcRatio > 5 
                    ? '마진이 광고 비용 대비 매우 높아 광고 ROI가 우수합니다.' 
                    : data.marginToCpcRatio > 3 
                      ? '마진이 광고 비용보다 충분히 높아 적절한 ROI를 기대할 수 있습니다.'
                      : '마진이 광고 비용에 비해 낮아 광고 효율성에 주의가 필요합니다.'}
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  {data.ROAS > 4 
                    ? '광고 투자 대비 매출이 매우 좋습니다.' 
                    : data.ROAS > 2 
                      ? '광고 투자 대비 매출이 적절합니다.'
                      : '광고 투자 대비 매출이 낮아 개선이 필요합니다.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfitAnalysis;