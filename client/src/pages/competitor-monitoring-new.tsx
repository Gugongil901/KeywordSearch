/**
 * 경쟁사 모니터링 대시보드 페이지
 * 키워드와 경쟁사들의 상품 변화를 모니터링하는 페이지
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Settings, RefreshCw, Search } from 'lucide-react';
import { CompetitorMonitoringContent } from '../components/competitor-monitoring-content';

// 경쟁사 브랜드 목록 (competitor-monitoring-content.tsx에서 가져옴)
const HEALTH_SUPPLEMENT_BRANDS = [
  { id: 'drlin', name: '닥터린' },
  { id: 'naturalplus', name: '내츄럴플러스' },
  { id: 'esthermall', name: '에스더몰' },
  { id: 'anguk', name: '안국건강' },
  { id: 'koreaeundan', name: '고려은단' },
  { id: 'nutrione', name: '뉴트리원' },
  { id: 'ckdhc', name: '종근당건강' },
  { id: 'gnm', name: 'GNM 자연의품격' },
  { id: 'nutriday', name: '뉴트리데이' },
  { id: 'jyns', name: '주영엔에스' },
  { id: 'hanmi', name: '한미양행' },
  { id: 'yuhan', name: '유한양행' }
];

export default function CompetitorMonitoring() {
  const [keyword, setKeyword] = useState('영양제');
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState(''); // 검색창에 표시될 값
  
  // 키워드 검색 처리
  const handleSearch = () => {
    if (searchValue.trim()) {
      setKeyword(searchValue.trim());
    }
  };
  
  // 엔터 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // 선택된 경쟁사 변경 처리
  const handleCompetitorsChange = (competitors: string[]) => {
    setSelectedCompetitors(competitors);
  };
  
  // 경쟁사 이름 가져오기 (ID로 경쟁사 찾기)
  const getCompetitorName = (id: string): string => {
    const brand = HEALTH_SUPPLEMENT_BRANDS.find(b => b.id === id);
    return brand ? brand.name : id;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="p-4">
        <div className="flex flex-col mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">경쟁사 모니터링</h2>
          </div>
          
          <p className="text-gray-500 text-sm">
            경쟁사 제품의 가격, 순위, 리뷰 변화를 지속적으로 모니터링합니다.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">모니터링 설정</CardTitle>
            <CardDescription>
              모니터링할 키워드와 경쟁사를 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input 
                type="text" 
                placeholder="예: 루테인, 비타민, 프로바이오틱스" 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button type="submit" onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                검색
              </Button>
            </div>
            
            {selectedCompetitors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <p className="text-sm text-gray-500 w-full mb-1">선택된 경쟁사:</p>
                {selectedCompetitors.map((competitorId) => (
                  <div 
                    key={competitorId}
                    className="border rounded-md px-3 py-1.5 text-sm flex items-center justify-between gap-2 bg-gray-50"
                  >
                    {getCompetitorName(competitorId)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="bg-white rounded-lg shadow p-4">
          <CompetitorMonitoringContent 
            keyword={keyword}
            onKeywordChange={setKeyword}
            onCompetitorsChange={handleCompetitorsChange}
          />
        </div>
      </div>
    </div>
  );
}