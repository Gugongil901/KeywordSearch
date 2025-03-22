import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const categories = [
  "비타민",
  "루테인",
  "오메가3",
  "유산균",
  "종합비타민",
  "칼슘",
  "마그네슘",
];

interface HeroSearchProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedTrendType: "daily" | "weekly";
  onTrendTypeChange: (type: "daily" | "weekly") => void;
}

const HeroSearch: React.FC<HeroSearchProps> = ({
  selectedCategory,
  onCategoryChange,
  selectedTrendType,
  onTrendTypeChange
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState<string>("루테인");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<any>(null);

  // 키워드 분석 직접 수행
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
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
      const response = await fetch(`/api/keyword/analysis?keyword=${encodeURIComponent(searchTerm.trim())}`);
      
      if (!response.ok) {
        throw new Error("키워드 분석 중 오류가 발생했습니다.");
      }
      
      const data = await response.json();
      setSearchResult(data);

      // 키워드 분석 컴포넌트에 검색결과 전달을 위해 로컬 스토리지 사용
      localStorage.setItem('currentKeywordAnalysis', JSON.stringify(data));
      localStorage.setItem('currentKeyword', searchTerm.trim());
      
      toast({
        title: "분석 완료",
        description: `"${searchTerm.trim()}" 키워드 분석이 완료되었습니다.`,
      });
      
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 인기 키워드 클릭 핸들러
  const handleCategoryClick = (clickedCategory: string) => {
    setSearchTerm(clickedCategory);
    setTimeout(() => handleSearch(), 100);
  };

  // localStorage에서 검색 결과 가져오기
  useEffect(() => {
    try {
      const savedAnalysis = localStorage.getItem('currentKeywordAnalysis');
      const savedKeyword = localStorage.getItem('currentKeyword');
      
      if (savedAnalysis && savedKeyword) {
        setSearchResult(JSON.parse(savedAnalysis));
        setSearchTerm(savedKeyword);
      } else {
        // 기본 검색어로 시작 (루테인)
        handleSearch();
      }
    } catch (error) {
      console.error("로컬 스토리지 데이터 로드 오류:", error);
      // 기본 검색어로 시작 (루테인)
      handleSearch();
    }
  }, []);

  return (
    <section className="bg-gradient-to-r from-blue-50 to-gray-100 py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6">
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
          </h1>

          {/* 검색 바 */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <div className="flex items-center bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-search text-blue-600"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="상품명 검색(예: 오메가3, 루테인, 콘드로이친)"
                  className="flex-grow py-3 px-2 outline-none border-none shadow-none text-gray-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  className="bg-blue-600 text-white px-5 py-3 rounded-none font-medium hover:bg-blue-700"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? "분석중..." : "검색"}
                </Button>
              </div>
            </div>

            {/* 인기 키워드 섹션이 제거되었습니다 */}
          </div>

          {/* 검색 결과 컨테이너 */}
          {searchResult && (
            <div className="bg-white rounded-lg shadow-sm p-6">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <a 
                                href={product.productUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {product.title}
                              </a>
                            </td>
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
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
