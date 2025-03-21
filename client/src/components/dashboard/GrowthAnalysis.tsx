/**
 * GrowthAnalysis.tsx - 키워드 성장성 분석 컴포넌트
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  LineChart, 
  Calendar, 
  BarChart3, 
  Activity 
} from 'lucide-react';

interface GrowthData {
  growthScore: number;
  growthRates: {
    '3month': number;
    '6month': number;
    '12month': number;
  };
  forecast: Array<{
    date: string;
    count: number;
  }>;
  trendDirection: string;
  seasonalityStrength: number;
  peakMonths: number[];
  currentSeasonStatus: string;
}

interface GrowthAnalysisProps {
  data: GrowthData;
}

const GrowthAnalysis: React.FC<GrowthAnalysisProps> = ({ data }) => {
  // 퍼센트 포맷팅
  const formatPercent = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  // 소수점 포맷팅
  const formatDecimal = (num: number) => {
    return num.toFixed(2);
  };

  // 트렌드 방향에 따른 아이콘과 색상
  const getTrendInfo = (trend: string) => {
    switch (trend) {
      case '급상승':
        return { icon: <TrendingUp className="h-5 w-5" />, color: 'text-green-500 bg-green-100' };
      case '상승':
        return { icon: <TrendingUp className="h-5 w-5" />, color: 'text-green-500 bg-green-100' };
      case '유지':
        return { icon: <Activity className="h-5 w-5" />, color: 'text-blue-500 bg-blue-100' };
      case '하락':
        return { icon: <TrendingDown className="h-5 w-5" />, color: 'text-orange-500 bg-orange-100' };
      case '급하락':
        return { icon: <TrendingDown className="h-5 w-5" />, color: 'text-red-500 bg-red-100' };
      default:
        return { icon: <Activity className="h-5 w-5" />, color: 'text-gray-500 bg-gray-100' };
    }
  };

  // 시즌 상태에 따른 색상
  const getSeasonStatusColor = (status: string) => {
    switch (status) {
      case '성수기':
        return 'text-green-500';
      case '비수기':
        return 'text-orange-500';
      default:
        return 'text-blue-500';
    }
  };

  // 월 이름 변환
  const getMonthName = (monthNum: number) => {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    return months[monthNum - 1];
  };

  const trendInfo = getTrendInfo(data.trendDirection);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <LineChart className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm font-medium">성장 점수</span>
                </div>
                <span className="text-sm font-bold">{data.growthScore}/100</span>
              </div>
              <Progress value={data.growthScore} className="h-2" />
              <p className="text-sm text-gray-500">
                키워드의 전반적인 성장 가능성
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">트렌드 방향</span>
              <Badge className={trendInfo.color} variant="outline">
                <div className="flex items-center">
                  {trendInfo.icon}
                  <span className="ml-1">{data.trendDirection}</span>
                </div>
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              최근 3개월 검색량 변화 추세
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">현재 시즌 상태</span>
              <span className={`text-sm font-bold ${getSeasonStatusColor(data.currentSeasonStatus)}`}>
                {data.currentSeasonStatus}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              계절성 강도: {formatDecimal(data.seasonalityStrength)} (0-1)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              기간별 성장률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">최근 3개월</span>
                  <span className={`text-sm font-bold ${data.growthRates['3month'] >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercent(data.growthRates['3month'])}
                  </span>
                </div>
                <Progress 
                  value={50 + (data.growthRates['3month'] / 2)} 
                  className="h-2" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">최근 6개월</span>
                  <span className={`text-sm font-bold ${data.growthRates['6month'] >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercent(data.growthRates['6month'])}
                  </span>
                </div>
                <Progress 
                  value={50 + (data.growthRates['6month'] / 2)} 
                  className="h-2" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">최근 12개월</span>
                  <span className={`text-sm font-bold ${data.growthRates['12month'] >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercent(data.growthRates['12month'])}
                  </span>
                </div>
                <Progress 
                  value={50 + (data.growthRates['12month'] / 2)} 
                  className="h-2" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              계절성 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                  const isPeakMonth = data.peakMonths && data.peakMonths.includes(month);
                  return (
                    <Badge 
                      key={month}
                      variant={isPeakMonth ? "default" : "outline"}
                      className={isPeakMonth ? "bg-green-500" : ""}
                    >
                      {getMonthName(month)}
                    </Badge>
                  );
                })}
              </div>
              
              <div className="text-sm text-gray-600">
                <div className="flex items-center mb-1">
                  <Badge variant="default" className="bg-green-500 mr-2">예시</Badge>
                  <span>성수기 월</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2">예시</Badge>
                  <span>비수기 월</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-2">
                계절성이 {data.seasonalityStrength < 0.3 ? '약함' : data.seasonalityStrength < 0.6 ? '보통' : '강함'}
                : {data.seasonalityStrength < 0.3 
                  ? '연중 안정적인 수요' 
                  : data.seasonalityStrength < 0.6 
                    ? '약간의 계절적 변동 있음' 
                    : '뚜렷한 계절적 패턴 있음'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <LineChart className="h-5 w-5 mr-2" />
            트렌드 및 예측 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60 flex items-center justify-center">
            <p className="text-gray-500">이 영역에 검색량 트렌드와 예측 차트가 표시됩니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GrowthAnalysis;