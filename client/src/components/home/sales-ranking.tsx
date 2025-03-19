import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface KeywordTrend {
  keyword: string;
  rank: number;
  change: "up" | "down" | "same";
}

interface CategoryData {
  id: string;
  name: string;
  code: string; // 네이버 카테고리 코드
}

interface CategoryKeywordsProps {
  period: "daily" | "weekly";
}

const CategoryKeywords: React.FC<CategoryKeywordsProps> = ({ period }) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // 네이버 쇼핑 인사이트 카테고리 목록
  const categories: CategoryData[] = [
    { id: "all", name: "전체", code: "all" },
    { id: "fashion", name: "패션의류", code: "50000000" },
    { id: "accessory", name: "패션잡화", code: "50000001" },
    { id: "beauty", name: "화장품/미용", code: "50000002" },
    { id: "digital", name: "디지털/가전", code: "50000003" },
    { id: "furniture", name: "가구/인테리어", code: "50000004" },
    { id: "baby", name: "출산/육아", code: "50000005" },
    { id: "food", name: "식품", code: "50000006" },
    { id: "sports", name: "스포츠/레저", code: "50000007" },
    { id: "life", name: "생활/건강", code: "50000008" }
  ];

  const { data, isLoading } = useQuery({
    queryKey: [`/api/trends/${period}?category=${activeCategory}`],
    refetchOnWindowFocus: false,
  });

  // 카테고리별 인기 키워드
  const getKeywords = (): KeywordTrend[] => {
    // 서버에서 반환된 데이터가 없거나 키워드가 없을 때 기본값 사용
    if (!data || typeof data !== 'object' || !('keywords' in data) || !Array.isArray(data.keywords) || data.keywords.length === 0) {
      // 카테고리별 백업 키워드
      const backupKeywords: Record<string, KeywordTrend[]> = {
        all: [
          { keyword: "제킷", rank: 1, change: "same" },
          { keyword: "티셔츠", rank: 2, change: "up" },
          { keyword: "원피스", rank: 3, change: "up" },
          { keyword: "티셔츠", rank: 4, change: "down" },
          { keyword: "제킷", rank: 5, change: "down" },
        ],
        fashion: [
          { keyword: "제킷", rank: 1, change: "same" },
          { keyword: "티셔츠", rank: 2, change: "up" },
          { keyword: "원피스", rank: 3, change: "up" },
          { keyword: "티셔츠", rank: 4, change: "down" },
          { keyword: "제킷", rank: 5, change: "down" },
        ],
        digital: [
          { keyword: "후대폰케이스", rank: 1, change: "same" },
          { keyword: "키보드", rank: 2, change: "up" },
          { keyword: "블루투스스피커", rank: 3, change: "up" },
          { keyword: "노트북", rank: 4, change: "up" },
          { keyword: "모니터", rank: 5, change: "down" },
        ],
      };
      
      return backupKeywords[activeCategory] || backupKeywords.all;
    }
    
    return data.keywords;
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case "up":
        return (
          <span className="text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
          </span>
        );
      case "down":
        return (
          <span className="text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
          </span>
        );
      default:
        return (
          <span className="text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus"><path d="M5 12h14"/></svg>
          </span>
        );
    }
  };

  const handleKeywordClick = (keyword: string) => {
    window.open(`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(keyword)}`, '_blank');
  };

  const formatDate = () => {
    const today = new Date();
    
    // 현재 한국 날짜 포맷으로 변환 (YYYY.MM.DD)
    return today.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\./g, '').replace(/\s+/g, '.');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">
          카테고리별 인기 키워드
        </h2>
        <span className="text-xs text-gray-500">{formatDate()}({period === 'daily' ? '일' : '주'}) 기준</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`px-3 py-2 rounded-md text-sm transition ${
              activeCategory === cat.id
                ? "bg-primary text-white font-medium"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
      
      {isLoading ? (
        <div className="py-10 text-center text-gray-500">로딩 중...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-gray-50 rounded p-4">
            <ul className="space-y-1">
              {getKeywords().map((keyword, index) => (
                <li 
                  key={index} 
                  className="flex items-center py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleKeywordClick(keyword.keyword)}
                >
                  <span className="w-8 text-center font-semibold text-gray-700">{keyword.rank}</span>
                  <span className="flex-grow text-gray-800">{keyword.keyword}</span>
                  {getChangeIcon(keyword.change)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryKeywords;
