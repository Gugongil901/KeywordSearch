/**
 * KeywordDashboard.tsx - 메인 대시보드 컴포넌트
 * 키워드 분석 결과를 종합적으로 보여주는 대시보드
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import SearchBar from '@/components/dashboard/SearchBar';
import SummaryPanel from '@/components/dashboard/SummaryPanel';
import CompetitionAnalysis from '@/components/dashboard/CompetitionAnalysis';
import GrowthAnalysis from '@/components/dashboard/GrowthAnalysis';
import ProfitAnalysis from '@/components/dashboard/ProfitAnalysis';
import RelatedKeywords from '@/components/dashboard/RelatedKeywords';
import TopProducts from '@/components/dashboard/TopProducts';
import MLAnalysisPanel from '@/components/dashboard/MLAnalysisPanel';

// Shadcn UI 컴포넌트들
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ConfettiEffect } from '@/components/ui/confetti-effect';
import { Skeleton } from '@/components/ui/skeleton';

// API 주소 설정 - 전체 URL로 변경하여 상대 경로 문제 해결
const API_BASE_URL = `${window.location.origin}/api/v1`;

const KeywordDashboard: React.FC = () => {
  const [keyword, setKeyword] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingTask, setPollingTask] = useState<NodeJS.Timeout | null>(null);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [pollingErrorCount, setPollingErrorCount] = useState<number>(0);
  
  const { toast } = useToast();
  
  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingTask) {
        clearInterval(pollingTask);
      }
    }
  }, [pollingTask]);
  
  // 키워드 검색 처리
  const handleSearch = async (searchKeyword: string) => {
    if (!searchKeyword.trim()) {
      toast({
        title: "검색어를 입력하세요",
        description: "분석할 키워드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setKeyword(searchKeyword);
      setLoading(true);
      setError(null);
      setPollingErrorCount(0);
      
      console.log(`키워드 분석 요청: "${searchKeyword}"`);
      
      // 키워드 분석 요청 (fetch API 사용)
      const response = await fetch(`${window.location.origin}/api/v1/keywords/${encodeURIComponent(searchKeyword)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`키워드 분석 API 오류: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`키워드 분석 요청 실패: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('키워드 분석 응답:', responseData);
      
      if (responseData.status === 'completed') {
        // 이미 완료된 분석 결과
        console.log('이미 완료된 분석 결과:', responseData.data);
        
        if (responseData.data && responseData.data.dashboard) {
          setDashboardData(responseData.data.dashboard);
          setLoading(false);
          setShowConfetti(true);
          
          toast({
            title: "분석 완료",
            description: `"${searchKeyword}" 키워드 분석이 완료되었습니다.`,
          });
          
          setTimeout(() => {
            setShowConfetti(false);
          }, 3000);
        } else {
          console.error('대시보드 데이터가 없음:', responseData);
          setError('분석 결과를 불러오는데 실패했습니다. 다시 시도해주세요.');
          setLoading(false);
        }
      } else if (responseData.status === 'processing') {
        // 진행 중인 작업 폴링
        const taskId = responseData.taskId;
        console.log(`키워드 진행 중, 태스크 ID: ${taskId}`);
        startPolling(taskId);
        
        toast({
          title: "분석 진행 중",
          description: "키워드 분석이 진행 중입니다. 잠시만 기다려주세요.",
        });
      } else {
        // 예상치 못한 상태
        console.error('예상치 못한 응답 상태:', responseData);
        setError('서버에서 예상치 못한 응답이 반환되었습니다.');
        setLoading(false);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '키워드 분석 중 오류가 발생했습니다.';
      console.error('검색 오류:', err, errorMessage);
      setError(errorMessage);
      setLoading(false);
      
      toast({
        title: "분석 오류",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  // 작업 상태 폴링
  const startPolling = (taskId: string) => {
    // 이전 폴링 중지
    if (pollingTask) {
      clearInterval(pollingTask);
    }
    
    console.log(`태스크 ID로 폴링 시작: ${taskId}, 키워드: ${keyword}`);
    
    // 새 폴링 시작 (3초 간격)
    const intervalId = setInterval(async () => {
      try {
        console.log(`태스크 상태 확인 중: ${taskId}`);
        const response = await fetch(`${window.location.origin}/api/v1/tasks/${taskId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error(`태스크 조회 API 오류: ${response.status} ${response.statusText}`);
          throw new Error(`태스크 조회 실패: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('태스크 응답:', responseData);
        
        if (responseData.status === 'completed') {
          console.log(`작업 완료됨, 결과 조회 중: ${keyword}`);
          // 작업 완료, 결과 조회
          try {
            // fetch API를 사용하여 명시적으로 JSON 응답을 처리
            const resultResponse = await fetch(`${window.location.origin}/api/v1/keywords/${encodeURIComponent(keyword)}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
            
            if (!resultResponse.ok) {
              const errorText = await resultResponse.text();
              console.error(`결과 조회 API 오류: ${resultResponse.status} ${resultResponse.statusText}`, errorText);
              throw new Error(`결과 조회 실패: ${resultResponse.status}`);
            }
            
            // 명시적 JSON 파싱
            const resultData = await resultResponse.json();
            console.log('결과 응답:', resultData);
            
            if (resultData.status === 'completed' && resultData.data) {
              console.log('대시보드 데이터 설정:', resultData.data.dashboard);
              setDashboardData(resultData.data.dashboard);
              setLoading(false);
              setShowConfetti(true);
              
              toast({
                title: "분석 완료",
                description: `"${keyword}" 키워드 분석이 완료되었습니다.`,
              });
              
              setTimeout(() => {
                setShowConfetti(false);
              }, 3000);
            } else {
              // 분석은 완료되었지만 데이터가 없는 경우 직접 다시 가져오기 시도
              console.log('태스크는 완료되었지만 데이터가 없습니다. 직접 로드 시도...');
              
              const forceResponse = await fetch(`${window.location.origin}/api/v1/keywords/${encodeURIComponent(keyword)}?refresh=true`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              });
              
              if (!forceResponse.ok) {
                const errorText = await forceResponse.text();
                console.error(`강제 조회 API 오류: ${forceResponse.status}`, errorText);
                throw new Error(`강제 조회 실패: ${forceResponse.status}`);
              }
              
              const forceData = await forceResponse.json();
              
              if (forceData.data && forceData.data.dashboard) {
                setDashboardData(forceData.data.dashboard);
                setLoading(false);
              } else {
                setError('데이터를 불러오는데 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요.');
                setLoading(false);
              }
            }
          } catch (resultErr) {
            console.error('결과 조회 중 오류:', resultErr);
            setError('결과를 조회하는 중 오류가 발생했습니다. API 응답 형식이 올바르지 않을 수 있습니다.');
            setLoading(false);
          }
          
          clearInterval(intervalId);
          setPollingTask(null);
        } else if (responseData.status === 'failed') {
          // 작업 실패
          const errorMessage = responseData.error || '키워드 분석 작업이 실패했습니다.';
          console.error('분석 작업 실패:', errorMessage);
          setError(errorMessage);
          setLoading(false);
          
          toast({
            title: "분석 실패",
            description: errorMessage,
            variant: "destructive",
          });
          
          clearInterval(intervalId);
          setPollingTask(null);
        } else {
          console.log(`작업 진행 중: ${responseData.status}`);
        }
      } catch (err) {
        console.error('폴링 오류:', err);
        
        // 5회 이상 오류 발생 시 폴링 중단
        setPollingErrorCount(prevCount => {
          const newCount = prevCount + 1;
          if (newCount >= 5) {
            console.error('폴링 오류가 여러 번 발생하여 중단합니다.');
            clearInterval(intervalId);
            setPollingTask(null);
            setError('서버 응답 처리 중 연속 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.');
            setLoading(false);
          }
          return newCount;
        });
      }
    }, 3000);
    
    setPollingTask(intervalId);
  };
  
  // 키워드 등급에 따른 배지 색상
  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'bg-gradient-to-r from-purple-500 to-blue-500 text-white';
      case 'A': return 'bg-blue-500 text-white';
      case 'B': return 'bg-green-500 text-white';
      case 'C': return 'bg-yellow-500 text-white';
      case 'D': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <ConfettiEffect trigger={showConfetti} duration={3000} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">네이버 키워드 분석 대시보드</h1>
        <p className="text-gray-600">네이버 쇼핑과 검색광고 데이터를 기반으로 키워드의 경쟁도, 성장성, 수익성을 분석합니다.</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <SearchBar onSearch={handleSearch} isLoading={loading} />
        </CardContent>
      </Card>
      
      {loading ? (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-6 w-20" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
              <div className="mt-8">
                <Skeleton className="h-64" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <Card className="mt-8 border-red-300">
          <CardHeader>
            <CardTitle className="text-red-500">오류 발생</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-2 text-sm text-gray-600">다른 키워드로 다시 시도해보세요.</p>
          </CardContent>
        </Card>
      ) : dashboardData ? (
        <div className="mt-8">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  "{keyword}" 분석 결과
                  {dashboardData.summary.overallGrade && (
                    <Badge className={getGradeBadgeColor(dashboardData.summary.overallGrade)}>
                      {dashboardData.summary.overallGrade} 등급
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString()} 기준
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="summary">요약</TabsTrigger>
                  <TabsTrigger value="competition">경쟁 분석</TabsTrigger>
                  <TabsTrigger value="growth">성장성 분석</TabsTrigger>
                  <TabsTrigger value="profit">수익성 분석</TabsTrigger>
                  <TabsTrigger value="ml">ML 분석</TabsTrigger>
                  <TabsTrigger value="related">연관 키워드</TabsTrigger>
                  <TabsTrigger value="products">상위 제품</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary">
                  <SummaryPanel data={dashboardData.summary} />
                </TabsContent>
                
                <TabsContent value="competition">
                  <CompetitionAnalysis data={dashboardData.competition} />
                </TabsContent>
                
                <TabsContent value="growth">
                  <GrowthAnalysis data={dashboardData.growth} />
                </TabsContent>
                
                <TabsContent value="profit">
                  <ProfitAnalysis data={dashboardData.profit} />
                </TabsContent>
                
                <TabsContent value="ml">
                  <MLAnalysisPanel keyword={keyword} />
                </TabsContent>
                
                <TabsContent value="related">
                  <RelatedKeywords data={dashboardData.relatedKeywords} onKeywordClick={handleSearch} />
                </TabsContent>
                
                <TabsContent value="products">
                  <TopProducts data={dashboardData.topProducts} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default KeywordDashboard;