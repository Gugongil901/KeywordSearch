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

export default function CompetitorMonitoring() {
  const [keyword, setKeyword] = useState('');
  
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="p-4">
        <div className="flex flex-col mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">경쟁사 모니터링</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                설정
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                변경 확인
              </Button>
            </div>
          </div>
          
          <p className="text-gray-500 text-sm">
            경쟁사 제품의 가격, 순위, 리뷰 변화를 지속적으로 모니터링합니다.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">모니터링 설정</CardTitle>
            <CardDescription>
              모니터링할 키워드를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input 
                type="text" 
                placeholder="예: 루테인, 비타민, 프로바이오틱스" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                검색
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['닥터린', '내츄럴플러스', '에스더몰', '안국건강', '고려은단'].map((brand, index) => (
                <div 
                  key={index}
                  className="border rounded-md px-3 py-1.5 text-sm flex items-center justify-between gap-2 bg-gray-50"
                >
                  {brand}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="bg-white rounded-lg shadow p-4">
          <CompetitorMonitoringContent />
        </div>
      </div>
    </div>
  );
}