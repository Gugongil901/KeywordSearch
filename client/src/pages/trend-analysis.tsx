import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const placeholderTrendData = {
  daily: [
    { keyword: "비타민", rank: 1, change: "up" },
    { keyword: "루테인", rank: 2, change: "up" },
    { keyword: "오메가3", rank: 3, change: "down" },
    { keyword: "유산균", rank: 4, change: "same" },
    { keyword: "종합비타민", rank: 5, change: "up" },
    { keyword: "칼슘", rank: 6, change: "down" },
    { keyword: "마그네슘", rank: 7, change: "up" },
    { keyword: "철분", rank: 8, change: "down" },
    { keyword: "콜라겐", rank: 9, change: "up" },
  ],
  weekly: [
    { keyword: "비타민", rank: 1, change: "up" },
    { keyword: "루테인", rank: 2, change: "same" },
    { keyword: "오메가3", rank: 3, change: "up" },
    { keyword: "유산균", rank: 4, change: "down" },
    { keyword: "종합비타민", rank: 5, change: "up" },
    { keyword: "마그네슘", rank: 6, change: "up" },
    { keyword: "칼슘", rank: 7, change: "down" },
    { keyword: "글루타민", rank: 8, change: "up" },
    { keyword: "철분", rank: 9, change: "down" },
  ],
};

const TrendAnalysis: React.FC = () => {
  const { toast } = useToast();
  const [currentKeyword, setCurrentKeyword] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [trendData, setTrendData] = useState<any>(null);
  const [keywordData, setKeywordData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [trendType, setTrendType] = useState<"daily" | "weekly">("daily");

  useEffect(() => {
    // 페이지 로드 시 트렌드 데이터 가져오기
    setTrendData(placeholderTrendData);
    
    // 저장된 검색 결과 가져오기
    const savedKeyword = localStorage.getItem('currentKeyword');
    const savedAnalysis = localStorage.getItem('currentKeywordAnalysis');
    
    if (savedKeyword && savedAnalysis) {
      setCurrentKeyword(savedKeyword);
      setSearchTerm(savedKeyword);
      setAnalysisData(JSON.parse(savedAnalysis));
      fetchKeywordData(savedKeyword);
    }
  }, []);

  const handleKeywordClick = (keyword: string) => {
    setCurrentKeyword(keyword);
    setSearchTerm(keyword);
    fetchKeywordData(keyword);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // 검색 데이터를 가져온 후 분석 데이터에도 적용
      fetchKeywordData(searchTerm.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 키워드 데이터 가져오기
  const fetchKeywordData = async (keyword: string) => {
    setLoading(true);
    try {
      console.log(`API 요청: GET /api/search?query=${encodeURIComponent(keyword)}`);
      const response = await fetch(`/api/search?query=${encodeURIComponent(keyword)}`);
      if (!response.ok) {
        throw new Error("데이터를 가져오는데 실패했습니다.");
      }
      const data = await response.json();
      
      // 응답 데이터 확인 및 가공
      console.log("검색 결과 데이터:", data);
      
      setKeywordData(data);
      setCurrentKeyword(keyword);
      
      // 검색 결과 데이터가 있는지 확인
      if (data) {
        // 상품 정보 로그 출력
        if (data.products && data.products.length > 0) {
          console.log(`검색 결과: ${data.products.length}개 상품 로드됨`);
        } else {
          console.log("검색 결과: 상품 없음");
        }
        
        // 검색 데이터로 분석 데이터 만들기 (항상 생성)
        const analysisData = {
          keyword: data.keyword,
          monthlySearches: data.searchCount || 0,
          pcRatio: data.pcSearchRatio || 0,
          mobileRatio: data.mobileSearchRatio || 0,
          productCount: data.productCount || 0,
          averagePrice: data.averagePrice || 0,
          totalSales: data.totalSales || 0,
          products: data.products || []
        };
        
        // 분석 데이터 설정
        setAnalysisData(analysisData);
        
        // 로컬 스토리지에 저장
        localStorage.setItem('currentKeywordAnalysis', JSON.stringify(analysisData));
        localStorage.setItem('currentKeyword', keyword);
        
        toast({
          title: "검색 완료",
          description: `"${keyword}" 키워드 검색이 완료되었습니다.`,
        });
      } else {
        console.log("검색 결과: 데이터 없음");
        toast({
          title: "데이터 없음",
          description: `"${keyword}" 키워드에 대한 정보를 찾을 수 없습니다.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("키워드 데이터 가져오기 오류:", error);
      toast({
        title: "데이터 로딩 실패",
        description: "키워드 데이터를 가져오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 키워드 분석 데이터 가져오기
  const fetchKeywordAnalysis = async (keyword: string) => {
    try {
      console.log(`API 요청: GET /api/keyword/analysis?keyword=${encodeURIComponent(keyword)}`);
      const response = await fetch(`/api/keyword/analysis?keyword=${encodeURIComponent(keyword)}`);
      if (!response.ok) {
        throw new Error("키워드 분석 중 오류가 발생했습니다.");
      }
      
      const data = await response.json();
      console.log("분석 결과 데이터:", data);
      
      // 데이터 형식이 올바른지 확인하고 필요한 경우 초기값 설정
      const processedData = {
        ...data,
        monthlySearches: data.monthlySearches || 0,
        pcRatio: data.pcRatio || 0,
        mobileRatio: data.mobileRatio || 0,
        productCount: data.productCount || 0,
        averagePrice: data.averagePrice || 0,
        totalSales: data.totalSales || 0,
        products: Array.isArray(data.products) ? data.products : []
      };
      
      setAnalysisData(processedData);

      // 키워드 분석 결과 저장
      localStorage.setItem('currentKeywordAnalysis', JSON.stringify(processedData));
      localStorage.setItem('currentKeyword', keyword);
      
      // 분석 데이터의 상품 정보 로그 확인
      if (processedData.products && processedData.products.length > 0) {
        console.log(`분석 결과: ${processedData.products.length}개 상품 정보 로드됨`);
      } else {
        console.log("분석 결과: 상품 정보 없음");
      }
      
      toast({
        title: "분석 완료",
        description: `"${keyword}" 키워드 분석이 완료되었습니다.`,
      });
    } catch (error) {
      console.error("키워드 분석 오류:", error);
      toast({
        title: "분석 오류",
        description: "키워드 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  // 변화 아이콘 표시
  const getChangeIcon = (change: string) => {
    switch (change) {
      case "up":
        return <span className="text-green-600">▲</span>;
      case "down":
        return <span className="text-red-600">▼</span>;
      default:
        return <span className="text-gray-500">-</span>;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">트렌드 분석</h1>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={trendType === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => setTrendType("daily")}
              className="rounded-full"
            >
              일간 트렌드
            </Button>
            <Button
              variant={trendType === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setTrendType("weekly")}
              className="rounded-full"
            >
              주간 트렌드
            </Button>
          </div>

          <div className="mb-8">
            <div className="relative">
              <div className="flex items-center rounded-lg border overflow-hidden">
                <Input
                  type="text"
                  placeholder="키워드 검색"
                  className="flex-grow py-2 px-4 outline-none border-none shadow-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  className="bg-primary text-white px-4 py-2 rounded-none font-medium hover:bg-primary/90"
                  onClick={handleSearch}
                >
                  검색
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {trendType === "daily" ? "일간" : "주간"} 인기 키워드
                  </CardTitle>
                  <CardDescription>
                    {new Date().toISOString().slice(0, 10)} 기준
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-gray-100">
                    {trendData &&
                      trendData[trendType].map((item: any, index: number) => (
                        <li
                          key={index}
                          className="py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                          onClick={() => handleKeywordClick(item.keyword)}
                        >
                          <div className="flex items-center">
                            <span className="w-6 text-center font-medium text-gray-500">
                              {item.rank}
                            </span>
                            <span className="ml-2">{item.keyword}</span>
                          </div>
                          {getChangeIcon(item.change)}
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              {currentKeyword ? (
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {currentKeyword} 검색 결과
                      </CardTitle>
                      <CardDescription>
                        월 검색량: {keywordData?.searchCount?.toLocaleString() || analysisData?.monthlySearches?.toLocaleString() || 0}회 • 
                        PC: {keywordData?.pcSearchRatio || analysisData?.pcRatio || 0}% • 
                        모바일: {keywordData?.mobileSearchRatio || analysisData?.mobileRatio || 0}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8">로딩 중...</div>
                      ) : keywordData || analysisData ? (
                        <div>
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">상품 수</p>
                              <p className="text-xl font-bold">{(keywordData?.productCount || analysisData?.productCount || 0).toLocaleString()}개</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">평균 가격</p>
                              <p className="text-xl font-bold">{(keywordData?.averagePrice || analysisData?.averagePrice || 0).toLocaleString()}원</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">총 판매액</p>
                              <p className="text-xl font-bold">{keywordData?.totalSales ? Math.floor(keywordData.totalSales/10000) : analysisData?.totalSales ? Math.floor(analysisData.totalSales/10000) : '0'}만원</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">경쟁 강도</p>
                              <p className="text-xl font-bold text-red-600">
                                매우 높음
                              </p>
                            </div>
                          </div>

                          <h3 className="text-md font-medium mb-2">상위 상품</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th
                                    scope="col"
                                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    상품명
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    가격
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    리뷰 수
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {(keywordData?.products?.length > 0 || analysisData?.products?.length > 0) ? (
                                  (keywordData?.products || analysisData?.products || []).slice(0, 5).map((product: any, index: number) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {product.title}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {product.price?.toLocaleString()}원
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {product.reviewCount}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={3}
                                      className="px-4 py-4 text-center text-sm text-gray-500"
                                    >
                                      검색 결과가 없습니다.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          검색어를 입력하거나 인기 키워드를 선택하세요.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 p-8">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-search mx-auto mb-4 text-gray-400"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <p>키워드를 검색하거나 인기 키워드를 선택하세요.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;