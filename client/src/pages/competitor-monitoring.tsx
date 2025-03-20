/**
 * 경쟁사 모니터링 대시보드 페이지
 * 키워드와 경쟁사들의 상품 변화를 모니터링하는 페이지
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, AlertCircleIcon, BarChart3Icon, LineChartIcon, TagIcon } from "lucide-react";

// 타입 정의
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

interface CompetitorProduct {
  productId: string;
  name: string;
  price: number;
  reviews: number;
  rank: number;
  image?: string;
  url?: string;
  collectedAt: string;
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

// API 호출 함수
const fetchConfigs = async () => {
  const response = await axios.get('/api/monitoring/configs');
  return response.data;
};

const fetchLatestResult = async (keyword: string) => {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const response = await axios.get(`/api/monitoring/results/${encodedKeyword}/latest`);
    console.log('최신 모니터링 결과 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('최신 모니터링 결과 API 호출 오류:', error);
    throw error;
  }
};

const fetchCompetitorProducts = async (keyword: string, competitor: string) => {
  const response = await axios.get(`/api/monitoring/products/${keyword}/${competitor}`);
  return response.data;
};

const setupMonitoring = async (keyword: string, topNCompetitors: number = 5) => {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const response = await axios.post('/api/monitoring/setup', { keyword, topNCompetitors });
    console.log('모니터링 설정 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('모니터링 설정 API 호출 오류:', error);
    throw error;
  }
};

const checkForChanges = async (keyword: string) => {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const response = await axios.get(`/api/monitoring/check/${encodedKeyword}`);
    console.log('변화 감지 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('변화 감지 API 호출 오류:', error);
    throw error;
  }
};

// 컴포넌트
export default function CompetitorMonitoringPage() {
  const [keyword, setKeyword] = useState('');
  const [topNCompetitors, setTopNCompetitors] = useState(5);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<string | null>(null);
  const [checkStatus, setCheckStatus] = useState<string | null>(null);

  // 모니터링 설정 목록 조회
  const { data: configs, isLoading: configsLoading, refetch: refetchConfigs } = useQuery({
    queryKey: ['monitoringConfigs'],
    queryFn: fetchConfigs,
    refetchOnWindowFocus: false
  });

  // 최신 모니터링 결과 조회
  const { data: latestResult, isLoading: resultLoading, refetch: refetchResult } = useQuery({
    queryKey: ['monitoringResult', activeKeyword],
    queryFn: () => activeKeyword ? fetchLatestResult(activeKeyword) : null,
    enabled: !!activeKeyword,
    refetchOnWindowFocus: false
  });

  // 설정된 모니터링 키워드가 있으면 첫 번째 키워드를 활성화
  useEffect(() => {
    if (configs && Object.keys(configs).length > 0 && !activeKeyword) {
      setActiveKeyword(Object.keys(configs)[0]);
    }
  }, [configs, activeKeyword]);

  // 모니터링 설정 함수
  const handleSetupMonitoring = async () => {
    if (!keyword) return;
    
    setSetupStatus('setting');
    try {
      const result = await setupMonitoring(keyword, topNCompetitors);
      setSetupStatus('success');
      setActiveKeyword(keyword);
      refetchConfigs();
    } catch (error) {
      setSetupStatus('error');
      console.error('모니터링 설정 오류:', error);
    }
  };

  // 변화 감지 함수
  const handleCheckChanges = async () => {
    if (!activeKeyword) return;
    
    setCheckStatus('checking');
    try {
      const result = await checkForChanges(activeKeyword);
      setCheckStatus('success');
      refetchResult();
    } catch (error) {
      setCheckStatus('error');
      console.error('변화 감지 오류:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">경쟁사 모니터링 대시보드</h1>
      
      {/* 모니터링 설정 폼 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>모니터링 설정</CardTitle>
          <CardDescription>특정 키워드에 대한 경쟁사 제품 변화를 자동으로 모니터링합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="keyword">키워드</Label>
                <Input 
                  id="keyword" 
                  placeholder="예: 나이키" 
                  value={keyword} 
                  onChange={(e) => setKeyword(e.target.value)} 
                />
              </div>
              <div>
                <Label htmlFor="topNCompetitors">모니터링할 상위 경쟁사 수</Label>
                <Input 
                  id="topNCompetitors" 
                  type="number" 
                  min={1} 
                  max={10} 
                  value={topNCompetitors} 
                  onChange={(e) => setTopNCompetitors(parseInt(e.target.value))} 
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {setupStatus === 'success' && <span className="text-green-500">모니터링 설정이 완료되었습니다.</span>}
            {setupStatus === 'error' && <span className="text-red-500">모니터링 설정 중 오류가 발생했습니다.</span>}
            {setupStatus === 'setting' && <span className="text-blue-500">모니터링 설정 중...</span>}
          </div>
          <Button onClick={handleSetupMonitoring}>모니터링 설정</Button>
        </CardFooter>
      </Card>
      
      {/* 모니터링 키워드 목록 */}
      {!configsLoading && configs && Object.keys(configs).length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">모니터링 중인 키워드</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(configs).map(([keyword, config]: [string, any]) => (
              <Badge 
                key={keyword} 
                variant={activeKeyword === keyword ? "default" : "outline"}
                className="cursor-pointer text-base py-1 px-3"
                onClick={() => setActiveKeyword(keyword)}
              >
                {keyword} ({(config as MonitoringConfig).competitors.length}개 경쟁사)
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* 활성 키워드의 모니터링 대시보드 */}
      {activeKeyword && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{activeKeyword} 모니터링</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {checkStatus === 'success' && <span className="text-green-500">변화 감지 완료</span>}
                {checkStatus === 'error' && <span className="text-red-500">변화 감지 중 오류 발생</span>}
                {checkStatus === 'checking' && <span className="text-blue-500">변화 감지 중...</span>}
              </span>
              <Button onClick={handleCheckChanges}>변화 감지 실행</Button>
            </div>
          </div>
          
          {/* 모니터링 설정 정보 */}
          {!configsLoading && configs && configs[activeKeyword] && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>모니터링 설정 정보</CardTitle>
                <CardDescription>
                  설정 시간: {new Date((configs[activeKeyword] as MonitoringConfig).createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <h3 className="font-medium mb-2">모니터링 중인 경쟁사 ({(configs[activeKeyword] as MonitoringConfig).competitors.length}개)</h3>
                    <div className="flex flex-wrap gap-2">
                      {(configs[activeKeyword] as MonitoringConfig).competitors.map((competitor: string) => (
                        <Badge key={competitor} variant="secondary">{competitor}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">알림 설정</h3>
                    <ul className="list-disc list-inside">
                      <li>가격 변동: {(configs[activeKeyword] as MonitoringConfig).alertThresholds.priceChangePercent}% 이상</li>
                      <li>새 상품 출시: {(configs[activeKeyword] as MonitoringConfig).alertThresholds.newProduct ? '알림' : '무시'}</li>
                      <li>순위 변동: {(configs[activeKeyword] as MonitoringConfig).alertThresholds.rankChange ? '알림' : '무시'}</li>
                      <li>리뷰 증가: {(configs[activeKeyword] as MonitoringConfig).alertThresholds.reviewChangePercent}% 이상</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 모니터링 결과 */}
          {!resultLoading && latestResult && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold">최근 모니터링 결과</h3>
                <Badge variant={latestResult.hasAlerts ? "destructive" : "secondary"}>
                  {latestResult.hasAlerts ? '변화 감지됨' : '변화 없음'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(latestResult.checkedAt).toLocaleString()}
                </span>
              </div>
              
              {latestResult.hasAlerts && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-2">감지된 변화</h4>
                  {Object.entries(latestResult.changesDetected).map(([competitor, changes]: [string, any]) => {
                    const competitorChanges = changes as CompetitorChanges;
                    if (!competitorChanges.alerts) return null;
                    
                    return (
                      <Card key={competitor} className="mb-4">
                        <CardHeader>
                          <CardTitle className="text-lg">{competitor}</CardTitle>
                          <CardDescription>감지된 변화: {
                            [
                              competitorChanges.priceChanges.length > 0 ? `가격 변동 ${competitorChanges.priceChanges.length}건` : '',
                              competitorChanges.newProducts.length > 0 ? `새 상품 ${competitorChanges.newProducts.length}건` : '',
                              competitorChanges.rankChanges.length > 0 ? `순위 변동 ${competitorChanges.rankChanges.length}건` : '',
                              competitorChanges.reviewChanges.length > 0 ? `리뷰 증가 ${competitorChanges.reviewChanges.length}건` : ''
                            ].filter(Boolean).join(', ')
                          }</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="price" className="w-full">
                            <TabsList className="grid grid-cols-4">
                              <TabsTrigger value="price">가격 변동</TabsTrigger>
                              <TabsTrigger value="new">새 상품</TabsTrigger>
                              <TabsTrigger value="rank">순위 변동</TabsTrigger>
                              <TabsTrigger value="review">리뷰 증가</TabsTrigger>
                            </TabsList>
                            
                            {/* 가격 변동 */}
                            <TabsContent value="price">
                              {competitorChanges.priceChanges.length > 0 ? (
                                <div className="grid gap-4">
                                  {competitorChanges.priceChanges.map((change, idx) => (
                                    <Alert key={idx} variant={change.changePercent < 0 ? "default" : "destructive"}>
                                      <div className="flex items-start gap-4">
                                        {change.product.image && (
                                          <img 
                                            src={change.product.image} 
                                            alt={change.product.name} 
                                            className="w-16 h-16 object-cover rounded"
                                          />
                                        )}
                                        <div className="flex-1">
                                          <AlertTitle className="flex items-center gap-2">
                                            {change.product.name}
                                            <Badge variant={change.changePercent < 0 ? "secondary" : "destructive"}>
                                              {change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(1)}%
                                            </Badge>
                                          </AlertTitle>
                                          <AlertDescription>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="line-through">{change.oldPrice.toLocaleString()}원</span>
                                              <ArrowRightIcon className="h-4 w-4" />
                                              <span className="font-bold">{change.newPrice.toLocaleString()}원</span>
                                              <span className="text-sm">
                                                ({change.changePercent > 0 ? '↑' : '↓'} {Math.abs(change.newPrice - change.oldPrice).toLocaleString()}원)
                                              </span>
                                            </div>
                                          </AlertDescription>
                                        </div>
                                      </div>
                                    </Alert>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  가격 변동이 감지되지 않았습니다.
                                </div>
                              )}
                            </TabsContent>
                            
                            {/* 새 상품 */}
                            <TabsContent value="new">
                              {competitorChanges.newProducts.length > 0 ? (
                                <div className="grid gap-4">
                                  {competitorChanges.newProducts.map((alert, idx) => (
                                    <Alert key={idx}>
                                      <div className="flex items-start gap-4">
                                        {alert.product.image && (
                                          <img 
                                            src={alert.product.image} 
                                            alt={alert.product.name} 
                                            className="w-16 h-16 object-cover rounded"
                                          />
                                        )}
                                        <div className="flex-1">
                                          <AlertTitle className="flex items-center gap-2">
                                            {alert.product.name}
                                            <Badge>새 상품</Badge>
                                          </AlertTitle>
                                          <AlertDescription>
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                              <div>가격: {alert.product.price.toLocaleString()}원</div>
                                              <div>순위: {alert.product.rank}위</div>
                                              <div>리뷰: {alert.product.reviews}개</div>
                                              <div>등록일: {new Date(alert.product.collectedAt).toLocaleDateString()}</div>
                                            </div>
                                          </AlertDescription>
                                        </div>
                                      </div>
                                    </Alert>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  새 상품이 감지되지 않았습니다.
                                </div>
                              )}
                            </TabsContent>
                            
                            {/* 순위 변동 */}
                            <TabsContent value="rank">
                              {competitorChanges.rankChanges.length > 0 ? (
                                <div className="grid gap-4">
                                  {competitorChanges.rankChanges.map((change, idx) => (
                                    <Alert key={idx} variant={change.change > 0 ? "destructive" : "default"}>
                                      <div className="flex items-start gap-4">
                                        {change.product.image && (
                                          <img 
                                            src={change.product.image} 
                                            alt={change.product.name} 
                                            className="w-16 h-16 object-cover rounded"
                                          />
                                        )}
                                        <div className="flex-1">
                                          <AlertTitle className="flex items-center gap-2">
                                            {change.product.name}
                                            <Badge variant={change.change > 0 ? "destructive" : "secondary"}>
                                              {change.change > 0 ? '순위 상승' : '순위 하락'}
                                            </Badge>
                                          </AlertTitle>
                                          <AlertDescription>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span>{change.oldRank}위</span>
                                              <ArrowRightIcon className="h-4 w-4" />
                                              <span className="font-bold">{change.newRank}위</span>
                                              <span className="text-sm">
                                                ({change.change > 0 ? '↑' : '↓'} {Math.abs(change.change)}위)
                                              </span>
                                            </div>
                                          </AlertDescription>
                                        </div>
                                      </div>
                                    </Alert>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  순위 변동이 감지되지 않았습니다.
                                </div>
                              )}
                            </TabsContent>
                            
                            {/* 리뷰 증가 */}
                            <TabsContent value="review">
                              {competitorChanges.reviewChanges.length > 0 ? (
                                <div className="grid gap-4">
                                  {competitorChanges.reviewChanges.map((change, idx) => (
                                    <Alert key={idx}>
                                      <div className="flex items-start gap-4">
                                        {change.product.image && (
                                          <img 
                                            src={change.product.image} 
                                            alt={change.product.name} 
                                            className="w-16 h-16 object-cover rounded"
                                          />
                                        )}
                                        <div className="flex-1">
                                          <AlertTitle className="flex items-center gap-2">
                                            {change.product.name}
                                            <Badge>
                                              리뷰 +{change.changePercent.toFixed(1)}%
                                            </Badge>
                                          </AlertTitle>
                                          <AlertDescription>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span>{change.oldReviews.toLocaleString()}개</span>
                                              <ArrowRightIcon className="h-4 w-4" />
                                              <span className="font-bold">{change.newReviews.toLocaleString()}개</span>
                                              <span className="text-sm">
                                                (↑ {(change.newReviews - change.oldReviews).toLocaleString()}개)
                                              </span>
                                            </div>
                                          </AlertDescription>
                                        </div>
                                      </div>
                                    </Alert>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  리뷰 증가가 감지되지 않았습니다.
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              
              {!latestResult.hasAlerts && (
                <Alert className="mb-6">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>변화 없음</AlertTitle>
                  <AlertDescription>
                    모니터링 중인 경쟁사 제품에 변화가 없습니다.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {!resultLoading && !latestResult && (
            <Alert className="mb-6">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>모니터링 결과 없음</AlertTitle>
              <AlertDescription>
                아직 모니터링 결과가 없습니다. '변화 감지 실행' 버튼을 클릭하여 첫 변화 감지를 실행해보세요.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      {/* 로딩 상태 */}
      {configsLoading && (
        <div className="text-center py-8 text-muted-foreground">
          모니터링 설정을 불러오는 중...
        </div>
      )}
      
      {/* 모니터링 설정이 없는 경우 */}
      {!configsLoading && configs && Object.keys(configs).length === 0 && (
        <Alert className="mb-6">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>모니터링 설정 없음</AlertTitle>
          <AlertDescription>
            모니터링 중인 키워드가 없습니다. 상단에서 모니터링할 키워드를 설정해보세요.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

