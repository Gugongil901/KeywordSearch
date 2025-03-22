/**
 * 경쟁사 모니터링 대시보드 페이지
 * 키워드와 경쟁사들의 상품 변화를 모니터링하는 페이지
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, RefreshCw, Search, LineChart } from 'lucide-react';
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
  const [keyword, setKeyword] = useState('루테인');
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>(['drlin', 'naturalplus', 'anguk']);
  const [searchValue, setSearchValue] = useState('루테인'); // 검색창에 표시될 값
  const [isSearching, setIsSearching] = useState(false); // 검색 중 상태
  const [configOpen, setConfigOpen] = useState(false); // 설정 다이얼로그 상태
  const [monitoringFrequency, setMonitoringFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [alertThresholds, setAlertThresholds] = useState({
    priceChangePercent: 5,
    newProduct: true,
    rankChange: true,
    reviewChangePercent: 10
  });
  
  // 임계값 변경 처리
  const handleThresholdChange = (key: string, value: any) => {
    setAlertThresholds(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // 키워드 검색 처리
  const handleSearch = () => {
    if (searchValue.trim()) {
      setIsSearching(true);
      // 약간의 지연 효과를 주어 사용자에게 검색이 실행됨을 알림
      setTimeout(() => {
        setKeyword(searchValue.trim());
        setIsSearching(false);
      }, 300);
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-gray-50 to-gray-50 pb-10">
      <div className="container mx-auto max-w-6xl p-4">
        <div className="flex flex-col mb-6">
          <div className="flex items-center justify-between mb-3 bg-white p-4 rounded-lg shadow-md border-b-2 border-blue-500">
            <div className="flex items-center">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 mr-3">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-900">경쟁사 모니터링</h2>
                <p className="text-blue-600 text-sm">실시간 건강기능식품 시장 분석</p>
              </div>
            </div>
            
            <div className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full shadow-sm">
              Pro 버전
            </div>
          </div>
          
          <p className="text-gray-600 text-sm bg-white p-3 rounded-lg shadow-sm my-2 border-l-4 border-blue-400">
            경쟁사 제품의 <span className="font-semibold text-blue-700">가격</span>, <span className="font-semibold text-blue-700">순위</span>, <span className="font-semibold text-blue-700">리뷰</span> 변화를 지속적으로 모니터링하고 즉각적인 알림을 받을 수 있습니다.
          </p>
        </div>

        <Card className="mb-6 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg pb-2">
            <CardTitle className="text-lg flex items-center text-blue-800">
              <Search className="h-5 w-5 mr-2 text-blue-600" />
              키워드 검색
            </CardTitle>
            <CardDescription>
              제품 키워드를 입력하여 건강기능식품 경쟁사를 모니터링하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex space-x-2 mb-5 relative">
              <div className="relative flex-1">
                <Input 
                  type="text" 
                  placeholder="예: 루테인, 비타민, 프로바이오틱스" 
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-11 border-blue-200 focus:border-blue-400 transition-all shadow-sm"
                />
                <Search className="h-4 w-4 text-blue-500 absolute left-3 top-3.5" />
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  className="bg-blue-600 hover:bg-blue-700 transition-all h-11 px-4"
                >
                  {isSearching ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> 검색 중...</>
                  ) : (
                    <><Search className="h-4 w-4 mr-2" /> 검색</>
                  )}
                </Button>
                <Button 
                  onClick={() => setConfigOpen(true)} 
                  variant="outline"
                  className="border-blue-200 hover:bg-blue-50 transition-all h-11"
                >
                  <Settings className="h-4 w-4 mr-2 text-blue-600" />
                  설정
                </Button>
              </div>
            </div>
            
            {selectedCompetitors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-600 w-full mb-2 flex items-center">
                  <Settings className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  모니터링 중인 경쟁사 ({selectedCompetitors.length}개)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCompetitors.map((competitorId) => (
                    <div 
                      key={competitorId}
                      className="border border-blue-200 rounded-full px-3 py-1 text-sm flex items-center justify-between gap-1 bg-white text-blue-700 shadow-sm"
                    >
                      {getCompetitorName(competitorId)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="bg-white rounded-lg shadow-lg p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-2 pb-2 border-b">
            <div className="flex items-center">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 mr-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
              </span>
              <h3 className="text-md font-medium text-gray-700">모니터링 결과</h3>
            </div>
            {isSearching && (
              <div className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full animate-pulse">
                데이터 업데이트 중...
              </div>
            )}
          </div>
          <CompetitorMonitoringContent 
            keyword={keyword}
            onKeywordChange={setKeyword}
            onCompetitorsChange={handleCompetitorsChange}
          />
        </div>
      </div>
      
      {/* 설정 다이얼로그 */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800">
              <Settings className="h-5 w-5 text-blue-600" />
              모니터링 설정
            </DialogTitle>
            <DialogDescription>
              모니터링 주기와 알림 조건을 설정하세요
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="frequency" className="text-sm font-medium text-gray-700">
                모니터링 주기
              </Label>
              <Select 
                value={monitoringFrequency}
                onValueChange={(value) => setMonitoringFrequency(value as 'daily' | 'weekly')}
              >
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="주기 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">매일</SelectItem>
                  <SelectItem value="weekly">주 1회</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-4 pt-2 mb-4">
              <h4 className="text-sm font-medium text-gray-700">모니터링할 경쟁사 선택</h4>
              <div className="max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-md border border-gray-100">
                {HEALTH_SUPPLEMENT_BRANDS.map((brand) => (
                  <div key={brand.id} className="flex items-center space-x-2 py-1.5 border-b border-gray-100 last:border-0">
                    <Checkbox 
                      id={`brand-${brand.id}`}
                      checked={selectedCompetitors.includes(brand.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCompetitors(prev => [...prev, brand.id]);
                        } else {
                          setSelectedCompetitors(prev => prev.filter(id => id !== brand.id));
                        }
                      }}
                    />
                    <Label 
                      htmlFor={`brand-${brand.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {brand.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 pt-2">
              <h4 className="text-sm font-medium text-gray-700">알림 조건</h4>
              
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <div className="space-y-0.5">
                  <Label className="text-sm">가격 변동</Label>
                  <p className="text-xs text-gray-500">가격이 {alertThresholds.priceChangePercent}% 이상 변경되면 알림</p>
                </div>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={alertThresholds.priceChangePercent} 
                    onChange={(e) => handleThresholdChange('priceChangePercent', parseInt(e.target.value))}
                    className="w-14 h-7 rounded border border-gray-200 text-center text-sm mr-2"
                    min={1}
                    max={50}
                  />
                  <span className="text-xs text-gray-600">%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <div className="space-y-0.5">
                  <Label className="text-sm">새 제품 출시</Label>
                  <p className="text-xs text-gray-500">새 제품 등록 시 알림</p>
                </div>
                <Switch 
                  checked={alertThresholds.newProduct}
                  onCheckedChange={(checked) => handleThresholdChange('newProduct', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <div className="space-y-0.5">
                  <Label className="text-sm">순위 변경</Label>
                  <p className="text-xs text-gray-500">제품 순위 변동 시 알림</p>
                </div>
                <Switch 
                  checked={alertThresholds.rankChange}
                  onCheckedChange={(checked) => handleThresholdChange('rankChange', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-sm">리뷰 증가</Label>
                  <p className="text-xs text-gray-500">리뷰가 {alertThresholds.reviewChangePercent}% 이상 증가하면 알림</p>
                </div>
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={alertThresholds.reviewChangePercent} 
                    onChange={(e) => handleThresholdChange('reviewChangePercent', parseInt(e.target.value))}
                    className="w-14 h-7 rounded border border-gray-200 text-center text-sm mr-2"
                    min={5}
                    max={100}
                  />
                  <span className="text-xs text-gray-600">%</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfigOpen(false)}
              className="border-gray-300"
            >
              취소
            </Button>
            <Button 
              onClick={() => setConfigOpen(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              설정 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}