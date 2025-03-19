/**
 * RelatedKeywords.tsx - 연관 키워드 분석 컴포넌트
 */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  TrendingUp,
  TrendingDown,
  BarChart,
  ChevronRight,
  CornerRightDown
} from 'lucide-react';

interface RelatedKeyword {
  keyword: string;
  searchVolume: number;
  competitionScore: number;
  growthScore: number;
  trending: 'up' | 'down' | 'stable';
}

interface RelatedKeywordsProps {
  data: RelatedKeyword[];
  onKeywordClick: (keyword: string) => void;
}

const RelatedKeywords: React.FC<RelatedKeywordsProps> = ({ data, onKeywordClick }) => {
  // 숫자 포맷팅 (천 단위 콤마)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // 스코어 등급 계산
  const getGradeFromScore = (score: number) => {
    if (score >= 90) return { grade: 'S', color: 'bg-purple-500' };
    if (score >= 80) return { grade: 'A', color: 'bg-blue-500' };
    if (score >= 70) return { grade: 'B', color: 'bg-green-500' };
    if (score >= 60) return { grade: 'C', color: 'bg-yellow-500' };
    return { grade: 'D', color: 'bg-red-500' };
  };

  // 트렌드 아이콘과 색상
  const getTrendingInfo = (trending: 'up' | 'down' | 'stable') => {
    switch (trending) {
      case 'up':
        return { icon: <TrendingUp className="h-3 w-3" />, color: 'text-green-500' };
      case 'down':
        return { icon: <TrendingDown className="h-3 w-3" />, color: 'text-red-500' };
      default:
        return { icon: <BarChart className="h-3 w-3" />, color: 'text-blue-500' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {data.length > 0 ? (
          data.map((keyword, index) => {
            const competitionGrade = getGradeFromScore(keyword.competitionScore);
            const growthGrade = getGradeFromScore(keyword.growthScore);
            const trendingInfo = getTrendingInfo(keyword.trending);
            
            return (
              <Card key={index} className="hover:border-blue-200 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="flex items-center mb-2 md:mb-0 md:mr-6">
                        <Search className="h-4 w-4 mr-2 text-gray-500" />
                        <h3 className="font-medium">{keyword.keyword}</h3>
                        <span className={`ml-2 flex items-center ${trendingInfo.color}`}>
                          {trendingInfo.icon}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-1">검색량:</span>
                          <span className="font-medium">{formatNumber(keyword.searchVolume)}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="mr-1">경쟁:</span>
                          <Badge className={`${competitionGrade.color} text-white`}>
                            {competitionGrade.grade}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="mr-1">성장:</span>
                          <Badge className={`${growthGrade.color} text-white`}>
                            {growthGrade.grade}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onKeywordClick(keyword.keyword)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">연관 키워드 데이터가 없습니다.</p>
          </div>
        )}
      </div>
      
      {data.length > 0 && (
        <div className="text-sm text-gray-500 flex items-start mt-2">
          <CornerRightDown className="h-4 w-4 mr-1 mt-0.5" />
          <p>
            키워드를 클릭하여 해당 키워드에 대한 자세한 분석을 확인할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default RelatedKeywords;