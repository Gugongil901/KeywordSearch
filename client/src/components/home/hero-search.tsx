import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const categories = [
  "전체",
  "패션의류",
  "패션잡화",
  "화장품/미용",
  "디지털/가전",
  "가구/인테리어",
  "출산/육아",
  "식품",
  "스포츠/레저",
  "생활/건강",
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
  const [searchTerm, setSearchTerm] = useState<string>("");
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
      
      // 분석 탭으로 스크롤 이동
      const analysisElement = document.getElementById('keyword-analysis-section');
      if (analysisElement) {
        analysisElement.scrollIntoView({ behavior: 'smooth' });
      }
      
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
          <div className="max-w-2xl mx-auto">
            {/* Search Bar */}
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
                    className="lucide lucide-search text-gray-500"
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
                  className="bg-primary text-white px-5 py-3 rounded-none font-medium hover:bg-primary/90"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? "분석중..." : "검색"}
                </Button>
              </div>
            </div>

            {/* 인기 키워드 */}
            <div className="flex flex-wrap mt-4 justify-center gap-2">
              {["비타민", "루테인", "오메가3", "유산균", "종합비타민", "칼슘", "마그네슘"].map((keyword) => (
                <span
                  key={keyword}
                  className="px-3 py-1 rounded-full text-xs cursor-pointer bg-white text-gray-900 hover:bg-primary hover:text-white transition"
                  onClick={() => {
                    setSearchTerm(keyword);
                    setTimeout(handleSearch, 100);
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>

            {/* 상품 카테고리 */}
            <div className="flex flex-wrap mt-4 justify-center gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className={`px-3 py-1 rounded-full text-xs cursor-pointer transition ${
                    selectedCategory === cat
                      ? "bg-primary text-white"
                      : "bg-white text-gray-900 hover:bg-primary hover:text-white"
                  }`}
                  onClick={() => onCategoryChange(cat)}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
