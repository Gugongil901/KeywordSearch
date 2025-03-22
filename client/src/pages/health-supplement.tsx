import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, FlaskConical, Search, Layers, BarChart3 } from 'lucide-react';
import HealthSupplementAnalyzer from '@/components/health-supplement/HealthSupplementAnalyzer';

export default function HealthSupplementPage() {
  return (
    <div className="flex flex-col space-y-8 p-4 md:p-8">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold">건강기능식품 전문 분석</h1>
        <p className="text-muted-foreground mt-2">
          건강기능식품 키워드 분석, 경쟁사 모니터링, 제품 순위 분석 등 전문 분석 도구를 제공합니다.
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
            <AlertTitle>건강기능식품 전문 분석 시스템</AlertTitle>
            <AlertDescription>
              이 페이지에서는 건강기능식품 시장 분석을 위한 전문 도구를 제공합니다. 
              경쟁사 제품 모니터링과 키워드 분석으로 시장 트렌드를 파악하세요.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  건강식품 키워드 분석
                </CardTitle>
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">키워드 최적화</div>
                <p className="text-xs text-muted-foreground mt-1">
                  건강기능식품 관련 키워드의 검색량과 경쟁도를 분석합니다.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  제품 노출 모니터링
                </CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">노출 개선</div>
                <p className="text-xs text-muted-foreground mt-1">
                  건강기능식품 키워드별 제품 노출 여부와 순위를 분석합니다.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  경쟁사 제품 분석
                </CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">경쟁사 추적</div>
                <p className="text-xs text-muted-foreground mt-1">
                  12개 주요 건강기능식품 브랜드의 제품 정보를 분석합니다.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  최적 제품 키워드
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">키워드 최적화</div>
                <p className="text-xs text-muted-foreground mt-1">
                  건강기능식품 제품의 최적 키워드를 자동으로 찾아줍니다.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>건강기능식품 분석 기능 소개</CardTitle>
              <CardDescription>
                각 기능의 특징과 활용 방법을 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">건강기능식품 키워드 분석</h3>
                <p className="text-sm text-muted-foreground">
                  비타민, 유산균, 프로바이오틱스, 오메가3 등 주요 건강기능식품 관련 키워드의 
                  검색량과 경쟁도를 분석하여 효과적인 마케팅 전략 수립을 지원합니다.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">제품 노출 모니터링</h3>
                <p className="text-sm text-muted-foreground">
                  건강기능식품 관련 주요 키워드에 대한 제품 페이지의 검색 노출 여부와 순위를 
                  모니터링하여 SEO 최적화 방향을 제시합니다.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">경쟁사 제품 분석</h3>
                <p className="text-sm text-muted-foreground">
                  닥터린, 내츄럴플러스, 에스더몰, 안국건강, 고려은단, 뉴트리원, 
                  종근당건강, GNM 자연의품격, 뉴트리데이, 주영엔에스, 한미양행, 유한양행 등 
                  주요 건강기능식품 브랜드의 제품 정보와 마케팅 전략을 분석합니다.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">최적 제품 키워드 분석</h3>
                <p className="text-sm text-muted-foreground">
                  건강기능식품 제품이 가장 높은 순위로 노출되는 최적의 키워드를 자동으로 
                  찾아주어 광고 및 콘텐츠 전략 수립에 활용할 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis">
          <HealthSupplementAnalyzer />
        </TabsContent>
      </Tabs>
    </div>
  );
}