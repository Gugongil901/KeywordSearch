/**
 * CompetitionAnalysis.tsx - 키워드 경쟁 분석 컴포넌트
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  TrendingUp, 
  ShieldAlert, 
  Users, 
  DollarSign, 
  Activity 
} from 'lucide-react';

interface CompetitionData {
  competitionScore: number;
  adRatio: number;
  brandRatio: number;
  bidPrice: number;
  marketConcentration: number;
  topCompetitors: {
    seller: string;
    marketShare: number;
    productCount: number;
    averagePrice: number;
  }[];
}

interface CompetitionAnalysisProps {
  data: CompetitionData;
}

const CompetitionAnalysis: React.FC<CompetitionAnalysisProps> = ({ data }) => {
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

  // 경쟁 점수에 따른 난이도 레벨
  const getDifficultyLevel = (score: number) => {
    if (score < 20) return { level: '매우 쉬움', color: 'text-green-500' };
    if (score < 40) return { level: '쉬움', color: 'text-green-400' };
    if (score < 60) return { level: '보통', color: 'text-yellow-500' };
    if (score < 80) return { level: '어려움', color: 'text-orange-500' };
    return { level: '매우 어려움', color: 'text-red-500' };
  };

  // 시장 집중도 해석
  const getConcentrationLevel = (hhi: number) => {
    if (hhi < 0.01) return { level: '매우 분산됨', color: 'text-green-500' };
    if (hhi < 0.15) return { level: '적당히 분산됨', color: 'text-green-400' };
    if (hhi < 0.25) return { level: '보통 집중됨', color: 'text-yellow-500' };
    if (hhi < 0.4) return { level: '높게 집중됨', color: 'text-orange-500' };
    return { level: '매우 집중됨', color: 'text-red-500' };
  };

  const difficultyInfo = getDifficultyLevel(data.competitionScore);
  const concentrationInfo = getConcentrationLevel(data.marketConcentration);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShieldAlert className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm font-medium">경쟁 점수</span>
                </div>
                <span className="text-sm font-bold">{data.competitionScore}/100</span>
              </div>
              <Progress value={data.competitionScore} className="h-2" />
              <p className={`text-sm font-medium ${difficultyInfo.color}`}>
                {difficultyInfo.level}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="text-sm font-medium">광고 비율</span>
                </div>
                <span className="text-sm font-bold">{formatPercent(data.adRatio)}</span>
              </div>
              <Progress value={data.adRatio} className="h-2" />
              <p className="text-sm text-gray-500">
                상위 노출 중 광고 비율
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="text-sm font-medium">브랜드 비율</span>
                </div>
                <span className="text-sm font-bold">{formatPercent(data.brandRatio)}</span>
              </div>
              <Progress value={data.brandRatio} className="h-2" />
              <p className="text-sm text-gray-500">
                상위 제품 중 브랜드 비율
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm font-medium">입찰가</span>
                </div>
                <span className="text-sm font-bold">{formatNumber(data.bidPrice)}원</span>
              </div>
              <p className="text-sm text-gray-500">
                광고 권장 입찰가
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              시장 집중도 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">시장 집중도 지수 (HHI)</span>
                  <span className="text-sm font-bold">{data.marketConcentration.toFixed(3)}</span>
                </div>
                <Progress value={data.marketConcentration * 100} className="h-2" />
                <p className={`text-sm mt-1 ${concentrationInfo.color}`}>
                  {concentrationInfo.level} - {concentrationInfo.level === '매우 집중됨' ? '소수 판매자가 시장 지배' : concentrationInfo.level === '매우 분산됨' ? '다수 판매자가 경쟁' : '다양한 판매자가 참여 중'}
                </p>
              </div>

              <p className="text-sm text-gray-500">
                허핀달-허시만 지수(HHI)는 시장 집중도를 측정하는 지표로, 0에 가까울수록 경쟁이 치열하고 1에 가까울수록 독점 상태를 의미합니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <Users className="h-5 w-5 mr-2" />
              주요 경쟁 판매자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topCompetitors && data.topCompetitors.length > 0 ? (
                data.topCompetitors.slice(0, 5).map((competitor, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{competitor.seller}</span>
                      <span className="text-sm text-gray-500">{formatPercent(competitor.marketShare)} 점유율</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>상품 {formatNumber(competitor.productCount)}개</span>
                      <span>평균 {formatCurrency(competitor.averagePrice)}</span>
                    </div>
                    {index < (data.topCompetitors?.length || 0) - 1 && <Separator className="my-2" />}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">경쟁 판매자 데이터가 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompetitionAnalysis;