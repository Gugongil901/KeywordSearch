import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const KeywordAnalysis: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("trending");
  const [keyword, setKeyword] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  
  // localStorage에서 검색 결과 가져오기
  useEffect(() => {
    try {
      const savedAnalysis = localStorage.getItem('currentKeywordAnalysis');
      const savedKeyword = localStorage.getItem('currentKeyword');
      
      if (savedAnalysis && savedKeyword) {
        setSearchResult(JSON.parse(savedAnalysis));
        setKeyword(savedKeyword);
        setActiveTab("analysis");
      }
    } catch (error) {
      console.error("로컬 스토리지 데이터 로드 오류:", error);
    }
  }, []);

  // 키워드 검색 요청 처리
  const handleKeywordSearch = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    if (!keyword.trim()) {
      toast({
        title: "키워드를 입력해주세요",
        description: "분석할 키워드를 입력해야 합니다.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      // 키워드 분석 API 호출
      const response = await fetch(`/api/keyword/analysis?keyword=${encodeURIComponent(keyword)}`);
      
      if (!response.ok) {
        throw new Error("키워드 분석 중 오류가 발생했습니다.");
      }
      
      const data = await response.json();
      setSearchResult(data);
      setActiveTab("analysis");
    } catch (error) {
      console.error("키워드 검색 오류:", error);
      toast({
        title: "검색 오류",
        description: "키워드 분석 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // 데모용 인기 키워드 목록
  const popularKeywords = [
    { keyword: "비타민", rank: 1, change: "up" },
    { keyword: "루테인", rank: 2, change: "up" },
    { keyword: "오메가3", rank: 3, change: "down" },
    { keyword: "유산균", rank: 4, change: "same" },
    { keyword: "종합비타민", rank: 5, change: "up" },
    { keyword: "칼슘", rank: 6, change: "down" },
    { keyword: "마그네슘", rank: 7, change: "up" },
    { keyword: "철분", rank: 8, change: "down" },
    { keyword: "콜라겐", rank: 9, change: "up" },
  ];
  
  // 인기 키워드 클릭 핸들러
  const handlePopularKeywordClick = (clickedKeyword: string) => {
    setKeyword(clickedKeyword);
    handleKeywordSearch();
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
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-bar-chart-2 inline-block mr-2 text-primary"
          >
            <line x1="18" x2="18" y1="20" y2="10" />
            <line x1="12" x2="12" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="14" />
          </svg>
          셀러를 위한 모든 데이터 분석
        </h2>
        <p className="text-gray-500 max-w-3xl mx-auto text-sm">
          네이버 쇼핑 데이터를 기반으로 키워드 트렌드, 인기 상품 정보 제공
        </p>
      </div>

      {/* 키워드 검색 폼 */}
      <form onSubmit={handleKeywordSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="상품명 검색(예: 오메가3, 루테인, 콘드로이친)"
            className="pl-10 pr-4 py-2 h-12 text-base border rounded-md shadow-sm focus:ring-primary focus:border-primary"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button 
            type="submit" 
            className="absolute right-0 top-0 bg-primary text-white px-4 h-12 rounded-r-md"
            disabled={isSearching}
          >
            {isSearching ? "검색 중..." : "검색"}
          </Button>
        </div>
      </form>

      {/* 탭 컨테이너 */}
      <Tabs defaultValue="trending" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="trending">인기 키워드</TabsTrigger>
          <TabsTrigger value="analysis" disabled={!searchResult}>키워드 분석</TabsTrigger>
        </TabsList>

        {/* 인기 키워드 탭 콘텐츠 */}
        <TabsContent value="trending" className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 인기 키워드 */}
            <div className="bg-gray-50 rounded-lg p-4 flex flex-col" style={{ height: '460px' }}>
              <h3 className="text-base font-medium mb-4 flex justify-between items-center">
                <span>일간 인기 키워드</span>
                <span className="text-xs text-gray-500">2025.03.22 기준</span>
              </h3>
              <ul className="divide-y divide-gray-100 flex-grow">
                {popularKeywords.map((item, index) => (
                  <li 
                    key={index} 
                    className="py-2 flex items-center cursor-pointer hover:bg-gray-100"
                    onClick={() => handlePopularKeywordClick(item.keyword)}
                  >
                    <span className="w-8 text-center font-medium text-gray-500">{item.rank}</span>
                    <span className="flex-grow">{item.keyword}</span>
                    {getChangeIcon(item.change)}
                  </li>
                ))}
              </ul>
            </div>

            {/* 카테고리별 키워드 */}
            <div className="bg-gray-50 rounded-lg p-4 flex flex-col" style={{ height: '460px' }}>
              <h3 className="text-base font-medium mb-4 flex justify-between items-center">
                <span>카테고리별 키워드</span>
                <span className="text-xs text-gray-500">2025.03.22 기준</span>
              </h3>
              <ul className="divide-y divide-gray-100 flex-grow">
                {popularKeywords.slice(0, 5).map((item, index) => (
                  <li 
                    key={index} 
                    className="py-2 flex items-center cursor-pointer hover:bg-gray-100"
                    onClick={() => handlePopularKeywordClick(item.keyword)}
                  >
                    <span className="w-8 text-center font-medium text-gray-500">{index + 1}</span>
                    <span className="flex-grow">{item.keyword}</span>
                    {getChangeIcon(item.change)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* 키워드 분석 탭 콘텐츠 */}
        <TabsContent value="analysis" className="py-4">
          {searchResult ? (
            <div>
              {/* 키워드 분석 결과 헤더 */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{searchResult.keyword} 검색 결과</h3>
                <div className="text-sm text-gray-500">월 검색량: {searchResult.monthlySearches?.toLocaleString() || 0}회 • PC: {searchResult.pcRatio || 0}% • 모바일: {searchResult.mobileRatio || 0}%</div>
              </div>

              {/* 분석 지표 요약 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">상품 수</p>
                  <p className="text-2xl font-bold">{searchResult.productCount?.toLocaleString() || '0'}개</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">평균 가격</p>
                  <p className="text-2xl font-bold">{searchResult.averagePrice?.toLocaleString() || '0'}원</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">총 판매액</p>
                  <p className="text-2xl font-bold">{searchResult.totalSales ? Math.floor(searchResult.totalSales/10000) : '0'}만원</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">경쟁 강도</p>
                  <p className="text-2xl font-bold text-red-600">매우 높음</p>
                </div>
              </div>

              {/* 상세 지표 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">실거래 상품 비율</p>
                  <p className="text-xl font-bold">{searchResult.realProductRatio || '0'}%</p>
                  <p className="text-xs text-gray-500">리뷰가 있는 상품 비율</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">해외 상품 비율</p>
                  <p className="text-xl font-bold">{searchResult.foreignProductRatio || '5'}%</p>
                  <p className="text-xs text-gray-500">해외 브랜드 제품 비율</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">클릭당 경쟁상품</p>
                  <p className="text-xl font-bold">{searchResult.competitionIndex ? searchResult.competitionIndex.toFixed(1) : '0'}개</p>
                  <p className="text-xs text-gray-500">CTR 3% 가정</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">키워드 점수</p>
                  <p className="text-xl font-bold">{searchResult.score || '0'}</p>
                  <p className="text-xs text-gray-500">검색량 / 상품수 (높을수록 좋음)</p>
                </div>
              </div>

              {/* 상위 상품 섹션 */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">상위 상품</h3>
                <div className="bg-white border border-gray-200 rounded-lg mb-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품명</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격대</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리뷰 수</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {searchResult.products?.slice(0, 10).map((product: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.price.toLocaleString()}원</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.reviewCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              키워드를 검색하면 분석 결과가 표시됩니다.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KeywordAnalysis;
