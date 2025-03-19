import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface KeywordTrend {
  keyword: string;
  rank: number;
  change: "up" | "down" | "same";
}

interface KeywordTrendsProps {
  period: "daily" | "weekly";
}

const KeywordTrends: React.FC<KeywordTrendsProps> = ({ period }) => {
  const [category, setCategory] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: [`/api/trends/${period}?category=${category}`],
    refetchOnWindowFocus: false,
  });

  const keywords: KeywordTrend[] = data?.keywords || [
    { keyword: "제킷", rank: 1, change: "same" },
    { keyword: "티셔츠", rank: 2, change: "up" },
    { keyword: "닭가슴살", rank: 3, change: "up" },
    { keyword: "당근", rank: 4, change: "up" },
    { keyword: "스투시", rank: 5, change: "up" },
    { keyword: "나이키", rank: 6, change: "same" },
    { keyword: "쭈꾸미", rank: 7, change: "up" },
    { keyword: "나이키운동화", rank: 8, change: "up" },
    { keyword: "호카", rank: 9, change: "up" },
    { keyword: "꼬망세", rank: 10, change: "down" },
  ];

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
          키워드 Best
        </h2>
        <span className="text-xs text-gray-500">{formatDate()}({period === 'daily' ? '일' : '주'}) 기준</span>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-gray-500">로딩 중...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-gray-50 rounded p-4">
            <ul className="space-y-1">
              {keywords.map((keyword, index) => (
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

export default KeywordTrends;
