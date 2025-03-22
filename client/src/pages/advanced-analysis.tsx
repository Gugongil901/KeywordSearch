import React from 'react';
import IntegratedSearch from '@/components/keyword-analysis/IntegratedSearch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Settings, SearchCheck, Layers, BarChart3 } from 'lucide-react';

export default function AdvancedAnalysisPage() {
  return (
    <div className="flex flex-col space-y-8 p-4 md:p-8">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold">고급 키워드 분석</h1>
        <p className="text-muted-foreground mt-2">
          키워드 광고 필터링, 페이지 노출 모니터링, 상품 순위 분석 등 고급 분석 도구를 제공합니다.
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="analysis">통합 분석 도구</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>고급 키워드 분석 시스템</AlertTitle>
            <AlertDescription>
              이 페이지에서는 네이버 쇼핑 키워드 분석을 위한 고급 기능을 제공합니다. 
              다양한 분석 도구를 활용하여 효율적인 키워드 전략을 수립하세요.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  광고 키워드 필터링
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">효율적 광고</div>
                <p className="text-xs text-muted-foreground mt-1">
                  이미 상위에 노출되는 키워드를 필터링하여 광고 예산을 최적화합니다.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  페이지 노출 모니터링
                </CardTitle>
                <SearchCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">SEO 최적화</div>
                <p className="text-xs text-muted-foreground mt-1">
                  특정 키워드 검색 시 웹페이지가 노출되는지 확인하고 순위를 추적합니다.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  상품 순위 분석
                </CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">순위 추적</div>
                <p className="text-xs text-muted-foreground mt-1">
                  각 상품이 어떤 키워드에서 어떤 순위로 노출되는지 분석합니다.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  최적 키워드 찾기
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">키워드 최적화</div>
                <p className="text-xs text-muted-foreground mt-1">
                  상품이 가장 높은 순위로 노출되는 최적의 키워드를 찾습니다.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>고급 분석 기능 소개</CardTitle>
              <CardDescription>
                각 기능의 특징과 활용 방법을 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">광고 키워드 필터링 시스템</h3>
                <p className="text-sm text-muted-foreground">
                  이미 상위에 노출되는 광고 키워드를 자동으로 식별하고 필터링합니다. 
                  불필요한 광고비 지출을 줄이고 효율적인 광고 예산 분배를 위한 중복 키워드 제거가 가능합니다.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">키워드별 페이지 노출 모니터링 시스템</h3>
                <p className="text-sm text-muted-foreground">
                  특정 키워드에 대해 상품 페이지가 검색 결과에 노출되는지 확인합니다. 
                  페이지 노출 순위 및 시간에 따른 순위 변동을 추적하여 SEO 최적화에 활용할 수 있습니다.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">상품별 키워드 순위 분석 시스템</h3>
                <p className="text-sm text-muted-foreground">
                  각 상품이 어떤 키워드에서 어떤 순위로 노출되는지 종합적으로 분석합니다. 
                  시간에 따른 순위 변화를 추적하여 마케팅 전략 수립에 활용할 수 있습니다.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">통합 검색 인터페이스</h3>
                <p className="text-sm text-muted-foreground">
                  모든 분석 기능을 하나의 인터페이스에서 편리하게 이용할 수 있습니다. 
                  키워드별, 상품별 다양한 시각화를 제공하여 데이터 기반 의사결정을 돕습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis">
          <IntegratedSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}