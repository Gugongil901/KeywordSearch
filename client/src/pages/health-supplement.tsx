import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Line, 
  LineChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Search, Filter, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

// 건강기능식품 12개 브랜드 목록
const BRANDS = [
  { id: 'drlin', name: '닥터린', productCount: 48, newProducts: 3, priceChanges: 4 },
  { id: 'naturalplus', name: '내츄럴플러스', productCount: 52, newProducts: 1, priceChanges: 3 },
  { id: 'esthermall', name: '에스더몰', productCount: 39, newProducts: 0, priceChanges: 2 },
  { id: 'angukhealthcare', name: '안국건강', productCount: 73, newProducts: 2, priceChanges: 5 },
  { id: 'koreaeundan', name: '고려은단', productCount: 62, newProducts: 2, priceChanges: 7 },
  { id: 'nutrione', name: '뉴트리원', productCount: 44, newProducts: 1, priceChanges: 3 },
  { id: 'ckdhc', name: '종근당건강', productCount: 86, newProducts: 5, priceChanges: 9 },
  { id: 'gnm', name: 'GNM 자연의품격', productCount: 59, newProducts: 2, priceChanges: 4 },
  { id: 'nutriday', name: '뉴트리데이', productCount: 41, newProducts: 1, priceChanges: 2 },
  { id: 'jooyoungns', name: '주영엔에스', productCount: 35, newProducts: 0, priceChanges: 1 },
  { id: 'hanmipharm', name: '한미양행', productCount: 67, newProducts: 3, priceChanges: 6 },
  { id: 'yuhan', name: '유한양행', productCount: 58, newProducts: 2, priceChanges: 5 },
];

// 관련 키워드 목록
const HEALTH_KEYWORDS = [
  '비타민', '종합비타민', '멀티비타민', '마그네슘', '철분제', '프로바이오틱스', 
  '유산균', '루테인', '비타민D', '비타민C', '오메가3', '밀크씨슬', 'EPA', 'DHA', 
  '글루코사민', '코큐텐', '콜라겐', '보조제', '건강기능식품', '영양제', '면역기능', 
  '피로회복', '눈건강', '관절건강', '혈행개선', '장건강', '간건강', '칼슘', '아연', 
  '루테인지아잔틴'
];

// 키워드 분석 데이터
const KEYWORD_ANALYSIS = [
  { keyword: '비타민D', searchCount: 68427, competition: 72.8, productCount: 1234, avgPrice: 18900 },
  { keyword: '프로바이오틱스', searchCount: 56892, competition: 68.3, productCount: 958, avgPrice: 35600 },
  { keyword: '루테인', searchCount: 42134, competition: 65.7, productCount: 764, avgPrice: 24300 },
  { keyword: '종합비타민', searchCount: 38756, competition: 77.2, productCount: 1087, avgPrice: 29800 },
  { keyword: '오메가3', searchCount: 34129, competition: 71.9, productCount: 895, avgPrice: 27500 },
  { keyword: '콜라겐', searchCount: 32784, competition: 63.4, productCount: 682, avgPrice: 32100 },
  { keyword: '글루코사민', searchCount: 29456, competition: 59.7, productCount: 528, avgPrice: 38400 },
  { keyword: '비타민C', searchCount: 27845, competition: 68.9, productCount: 872, avgPrice: 19700 },
  { keyword: '밀크씨슬', searchCount: 21736, competition: 57.8, productCount: 415, avgPrice: 34200 },
  { keyword: '마그네슘', searchCount: 18934, competition: 55.2, productCount: 389, avgPrice: 22800 },
];

// 트렌드 데이터
const TREND_DATA = [
  { month: '1월', 종합비타민: 65, 장건강: 48, 눈건강: 38, 관절건강: 29 },
  { month: '2월', 종합비타민: 68, 장건강: 52, 눈건강: 41, 관절건강: 32 },
  { month: '3월', 종합비타민: 67, 장건강: 55, 눈건강: 43, 관절건강: 34 },
  { month: '4월', 종합비타민: 69, 장건강: 59, 눈건강: 47, 관절건강: 36 },
  { month: '5월', 종합비타민: 72, 장건강: 62, 눈건강: 51, 관절건강: 38 },
  { month: '6월', 종합비타민: 74, 장건강: 68, 눈건강: 56, 관절건강: 42 },
];

// 브랜드 검색 인기도 데이터
const BRAND_POPULARITY = [
  { brand: '종근당건강', popularity: 81 },
  { brand: '고려은단', popularity: 76 },
  { brand: 'GNM 자연의품격', popularity: 64 },
  { brand: '닥터린', popularity: 58 },
  { brand: '유한양행', popularity: 53 },
  { brand: '안국건강', popularity: 49 },
  { brand: '내츄럴플러스', popularity: 42 },
  { brand: '뉴트리원', popularity: 38 },
];

// 급상승 키워드 데이터
const RISING_KEYWORDS = [
  { keyword: '프로바이오틱스 유산균', increase: 34.2 },
  { keyword: '면역력 증진 비타민', increase: 21.7 },
  { keyword: '눈 건강 루테인', increase: 18.9 },
  { keyword: '혈행개선 오메가3', increase: 17.5 },
  { keyword: '관절 글루코사민', increase: 16.8 },
  { keyword: '간 건강 밀크씨슬', increase: 15.3 },
  { keyword: '수면 개선 마그네슘', increase: 14.2 },
  { keyword: '장건강 유산균', increase: 13.6 },
];

const HealthSupplement = () => {
  const [selectedBrands, setSelectedBrands] = useState<string[]>(['drlin', 'koreaeundan', 'ckdhc', 'gnm']);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(['비타민D', '프로바이오틱스', '루테인', '종합비타민', '오메가3']);
  const [keywordSearchTerm, setKeywordSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 브랜드 선택 토글 함수
  const toggleBrandSelection = (brandId: string) => {
    if (selectedBrands.includes(brandId)) {
      setSelectedBrands(selectedBrands.filter(id => id !== brandId));
    } else {
      setSelectedBrands([...selectedBrands, brandId]);
    }
  };

  // 키워드 검색 필터링
  const filteredKeywords = HEALTH_KEYWORDS.filter(keyword => 
    keyword.toLowerCase().includes(keywordSearchTerm.toLowerCase())
  );

  // 데이터 업데이트 시뮬레이션
  const simulateDataUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
    }, 1500);
  };

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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>건강기능식품 브랜드 인사이트</CardTitle>
              <CardDescription>
                12개 주요 건강기능식품 브랜드의 제품, 가격, 리뷰 분석 및 모니터링
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1" 
              onClick={simulateDataUpdate}
              disabled={isUpdating}
            >
              <RefreshCw size={14} className={`${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? '데이터 업데이트 중...' : '데이터 업데이트'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="brand-monitoring" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="brand-monitoring">브랜드 모니터링</TabsTrigger>
              <TabsTrigger value="keyword-analysis">제품 키워드 분석</TabsTrigger>
              <TabsTrigger value="trend-analysis">시장 트렌드</TabsTrigger>
            </TabsList>
            
            {/* 브랜드 모니터링 탭 */}
            <TabsContent value="brand-monitoring" className="pt-6">
              <div className="p-4 border rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">브랜드 모니터링 기능</h3>
                  <span className="text-sm text-muted-foreground">
                    마지막 업데이트: {new Date().toLocaleDateString('ko-KR')} {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p>12개 건강기능식품 브랜드의 가격, 신제품, 순위, 리뷰 변화를 자동으로 모니터링합니다.</p>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {BRANDS.map(brand => (
                    <Button
                      key={brand.id}
                      variant={selectedBrands.includes(brand.id) ? "outline" : "outline"}
                      size="sm"
                      onClick={() => toggleBrandSelection(brand.id)}
                      className={`text-xs ${selectedBrands.includes(brand.id) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                    >
                      {brand.name}
                    </Button>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {BRANDS.filter(brand => selectedBrands.includes(brand.id)).map(brand => (
                    <div key={brand.id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">{brand.name}</h4>
                        <Badge variant="outline" className="text-green-600 bg-green-50">모니터링 중</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">제품 수:</span>
                          <span>{brand.productCount}개</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">신제품:</span>
                          <span className={brand.newProducts > 0 ? "text-green-600" : "text-gray-500"}>
                            {brand.newProducts > 0 ? `+${brand.newProducts}` : "0"} (7일간)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">가격 변화:</span>
                          <span className={brand.priceChanges > 0 ? "text-amber-600" : "text-gray-500"}>
                            {brand.priceChanges > 0 ? `${brand.priceChanges}개 제품` : "없음"}
                          </span>
                        </div>
                        <div className="mt-3 pt-2 border-t border-dashed">
                          <Button variant="link" size="sm" className="p-0 h-auto text-xs">세부 정보 보기</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedBrands.length === 0 && (
                    <div className="col-span-full p-8 text-center text-muted-foreground">
                      모니터링할 브랜드를 선택해주세요
                    </div>
                  )}
                </div>
                
                {selectedBrands.length > 0 && (
                  <div className="mt-6 p-4 border rounded-md">
                    <h3 className="text-md font-medium mb-4">선택된 브랜드 제품 분포</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={BRANDS.filter(brand => selectedBrands.includes(brand.id))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="productCount" name="제품 수" fill="#8884d8" />
                        <Bar dataKey="newProducts" name="신제품" fill="#82ca9d" />
                        <Bar dataKey="priceChanges" name="가격 변동" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* 제품 키워드 분석 탭 */}
            <TabsContent value="keyword-analysis" className="pt-6">
              <div className="p-4 border rounded-md">
                <h3 className="text-lg font-medium mb-4">제품 키워드 분석</h3>
                <p>건강기능식품 관련 키워드의 경쟁도, 검색량, 상품 수, 평균 가격 등을 분석합니다.</p>
                
                <div className="flex items-center mt-6 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="키워드 검색..."
                      value={keywordSearchTerm}
                      onChange={(e) => setKeywordSearchTerm(e.target.value)}
                      className="pl-9 h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="ml-2">
                    <Filter className="h-4 w-4 mr-1" />
                    필터
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-4">
                  {filteredKeywords.map(keyword => (
                    <div 
                      key={keyword} 
                      className={`px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                        selectedKeywords.includes(keyword) 
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      onClick={() => {
                        if (selectedKeywords.includes(keyword)) {
                          setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
                        } else if (selectedKeywords.length < 5) {
                          setSelectedKeywords([...selectedKeywords, keyword]);
                        }
                      }}
                    >
                      {keyword}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-medium">키워드 분석 결과</h4>
                    <span className="text-sm text-muted-foreground">
                      최대 5개 키워드 분석 가능 (현재 {selectedKeywords.length}개 선택됨)
                    </span>
                  </div>
                  
                  {selectedKeywords.length > 0 ? (
                    <>
                      <div className="border rounded-md overflow-hidden">
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
                            {KEYWORD_ANALYSIS
                              .filter(item => selectedKeywords.includes(item.keyword))
                              .map(item => (
                                <tr key={item.keyword}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.keyword}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.searchCount.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center">
                                      <span className={`mr-2 ${
                                        item.competition > 70 ? 'text-red-600' : 
                                        item.competition > 60 ? 'text-amber-600' : 
                                        'text-green-600'
                                      }`}>{item.competition}%</span>
                                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                        <div 
                                          className={`h-1.5 rounded-full ${
                                            item.competition > 70 ? 'bg-red-600' : 
                                            item.competition > 60 ? 'bg-amber-600' : 
                                            'bg-green-600'
                                          }`} 
                                          style={{ width: `${item.competition}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.productCount.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.avgPrice.toLocaleString()}원</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="text-md font-medium mb-4">검색량 비교</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={KEYWORD_ANALYSIS.filter(item => selectedKeywords.includes(item.keyword))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="keyword" />
                            <YAxis />
                            <Tooltip formatter={(value) => Number(value).toLocaleString()} />
                            <Legend />
                            <Bar dataKey="searchCount" name="월간 검색량" fill="#1E40AF" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground border rounded-md">
                      분석할 키워드를 선택해주세요 (최대 5개)
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* 시장 트렌드 탭 */}
            <TabsContent value="trend-analysis" className="pt-6">
              <div className="p-4 border rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">시장 트렌드</h3>
                  <Badge variant="outline" className="gap-1 px-3">
                    <TrendingUp size={14} className="text-green-600" />
                    <span>실시간 업데이트</span>
                  </Badge>
                </div>
                
                <p>건강기능식품 시장의 최신 트렌드와 인기 상승/하락 키워드를 추적합니다.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* 인기 급상승 키워드 */}
                  <div className="border rounded-md">
                    <div className="p-3 border-b bg-gray-50">
                      <h4 className="font-medium">인기 급상승 키워드</h4>
                    </div>
                    <div>
                      {RISING_KEYWORDS.map((item, index) => (
                        <div 
                          key={item.keyword} 
                          className={`flex justify-between items-center p-3 ${
                            index < RISING_KEYWORDS.length - 1 ? 'border-b' : ''
                          }`}
                        >
                          <span className="flex items-center">
                            <span className="w-5 text-center text-xs font-medium text-gray-500">{index + 1}</span>
                            <span className="ml-2">{item.keyword}</span>
                          </span>
                          <span className="text-green-600">▲ {item.increase}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 브랜드 검색 인기도 */}
                  <div className="border rounded-md">
                    <div className="p-3 border-b bg-gray-50">
                      <h4 className="font-medium">브랜드 검색 인기도</h4>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        {BRAND_POPULARITY.map(item => (
                          <div key={item.brand}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{item.brand}</span>
                              <span>{item.popularity}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  item.popularity > 70 ? 'bg-green-600' : 
                                  item.popularity > 50 ? 'bg-blue-600' : 
                                  'bg-purple-600'
                                }`} 
                                style={{ width: `${item.popularity}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 트렌드 차트 */}
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-4">카테고리별 인기도 추이 (6개월)</h4>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={TREND_DATA}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="종합비타민" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="장건강" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="눈건강" stroke="#ffc658" />
                      <Line type="monotone" dataKey="관절건강" stroke="#ff7300" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* 시장 이슈 알림 */}
                <div className="mt-6 p-4 border rounded-md bg-amber-50">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800">주목할 시장 이슈</h4>
                      <p className="mt-1 text-sm text-amber-700">
                        최근 건강보험심사평가원의 발표에 따르면 프로바이오틱스 관련 제품의 판매량이 전년 대비 34% 증가했습니다.
                        면역 강화와 장 건강에 대한 소비자 관심이 높아진 것으로 분석됩니다.
                      </p>
                      <div className="mt-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs border-amber-600 text-amber-600 hover:bg-amber-100">
                          자세히 보기
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 인기 키워드 연관성 분석 */}
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-4">인기 키워드 연관 분석</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-md">
                      <h5 className="font-medium mb-2">프로바이오틱스</h5>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">유산균</Badge>
                        <Badge variant="secondary">장건강</Badge>
                        <Badge variant="secondary">면역력</Badge>
                        <Badge variant="secondary">알러지</Badge>
                        <Badge variant="secondary">피부건강</Badge>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md">
                      <h5 className="font-medium mb-2">루테인</h5>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">눈건강</Badge>
                        <Badge variant="secondary">블루라이트</Badge>
                        <Badge variant="secondary">스마트폰</Badge>
                        <Badge variant="secondary">황반변성</Badge>
                        <Badge variant="secondary">노안</Badge>
                      </div>
                    </div>
                    <div className="p-4 border rounded-md">
                      <h5 className="font-medium mb-2">오메가3</h5>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">혈행개선</Badge>
                        <Badge variant="secondary">기억력</Badge>
                        <Badge variant="secondary">DHA</Badge>
                        <Badge variant="secondary">EPA</Badge>
                        <Badge variant="secondary">혈중지질</Badge>
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