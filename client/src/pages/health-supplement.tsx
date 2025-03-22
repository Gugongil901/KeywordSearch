import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const HealthSupplement = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">건강기능식품 분석</h1>
        <p className="text-muted-foreground">
          건강기능식품 브랜드, 제품, 키워드 분석 및 모니터링 시스템
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>건강기능식품 브랜드 인사이트</CardTitle>
          <CardDescription>
            12개 주요 건강기능식품 브랜드의 제품, 가격, 리뷰 분석 및 모니터링
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="brand-monitoring" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="brand-monitoring">브랜드 모니터링</TabsTrigger>
              <TabsTrigger value="keyword-analysis">제품 키워드 분석</TabsTrigger>
              <TabsTrigger value="trend-analysis">시장 트렌드</TabsTrigger>
            </TabsList>
            <TabsContent value="brand-monitoring" className="pt-6">
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-4">브랜드 모니터링 기능</h3>
                <p>12개 건강기능식품 브랜드의 가격, 신제품, 순위, 리뷰 변화를 자동으로 모니터링합니다.</p>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                  <li>닥터린, 내츄럴플러스, 에스더몰, 안국건강, 고려은단, 뉴트리원</li>
                  <li>종근당건강, GNM 자연의품격, 뉴트리데이, 주영엔에스, 한미양행, 유한양행</li>
                </ul>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">닥터린</h4>
                      <Badge variant="outline" className="text-green-600 bg-green-50">모니터링 중</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">제품 수:</span>
                        <span>48개</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">신제품:</span>
                        <span className="text-green-600">+3 (7일간)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">가격 변화:</span>
                        <span className="text-amber-600">4개 제품</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">고려은단</h4>
                      <Badge variant="outline" className="text-green-600 bg-green-50">모니터링 중</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">제품 수:</span>
                        <span>62개</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">신제품:</span>
                        <span className="text-green-600">+2 (7일간)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">가격 변화:</span>
                        <span className="text-amber-600">7개 제품</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="keyword-analysis" className="pt-6">
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-4">제품 키워드 분석</h3>
                <p>건강기능식품 관련 키워드의 경쟁도, 검색량, 상품 수, 평균 가격 등을 분석합니다.</p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {['비타민', '종합비타민', '멀티비타민', '마그네슘', '철분제', '프로바이오틱스', '유산균', '루테인', '비타민D'].map(keyword => (
                    <div key={keyword} className="px-3 py-2 bg-gray-100 rounded-md text-sm">{keyword}</div>
                  ))}
                </div>
                
                <div className="mt-6 border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">키워드</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">검색량</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">경쟁도</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품 수</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 가격</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">비타민D</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">68,427</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">72.8%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1,234</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18,900원</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">프로바이오틱스</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">56,892</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">68.3%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">958</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">35,600원</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">루테인</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">42,134</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">65.7%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">764</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">24,300원</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="trend-analysis" className="pt-6">
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-4">시장 트렌드</h3>
                <p>건강기능식품 시장의 최신 트렌드와 인기 상승/하락 키워드를 추적합니다.</p>
                <div className="mt-4">
                  <div className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">인기 급상승 키워드</span>
                    <span className="text-green-600">▲ 28.5%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span>프로바이오틱스 유산균</span>
                    <span className="text-green-600">▲ 34.2%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span>면역력 증진 비타민</span>
                    <span className="text-green-600">▲ 21.7%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border-b">
                    <span>눈 건강 루테인</span>
                    <span className="text-green-600">▲ 18.9%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-3">카테고리별 인기도</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>종합 비타민</span>
                          <span>74%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '74%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>장 건강</span>
                          <span>68%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>눈 건강</span>
                          <span>56%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '56%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>관절 건강</span>
                          <span>42%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '42%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-3">브랜드 검색 인기도</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>종근당건강</span>
                          <span>81%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '81%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>고려은단</span>
                          <span>76%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '76%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>GNM 자연의품격</span>
                          <span>64%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '64%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>닥터린</span>
                          <span>58%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '58%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthSupplement;