import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KeywordTrend {
  keyword: string;
  rank: number;
  change: "up" | "down" | "same";
}

const KeywordTrends: React.FC = () => {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const [category, setCategory] = useState<string>("all");

  const { data: dailyData, isLoading: isDailyLoading } = useQuery({
    queryKey: [`/api/trends/daily?category=${category}`],
    refetchOnWindowFocus: false,
  });

  const { data: weeklyData, isLoading: isWeeklyLoading } = useQuery({
    queryKey: [`/api/trends/weekly?category=${category}`],
    refetchOnWindowFocus: false,
  });

  const dailyKeywords: KeywordTrend[] = dailyData?.keywords || [
    { keyword: "파로", rank: 1, change: "same" },
    { keyword: "코스", rank: 2, change: "up" },
    { keyword: "닭가슴살", rank: 3, change: "up" },
    { keyword: "당근", rank: 4, change: "up" },
    { keyword: "스투시", rank: 5, change: "up" },
    { keyword: "파로효소", rank: 6, change: "same" },
    { keyword: "쭈꾸미", rank: 7, change: "up" },
    { keyword: "나이키운동화", rank: 8, change: "up" },
    { keyword: "호카", rank: 9, change: "up" },
    { keyword: "꼬망세", rank: 10, change: "down" },
  ];

  const weeklyKeywords: KeywordTrend[] = weeklyData?.keywords || [
    { keyword: "명품가방", rank: 1, change: "same" },
    { keyword: "아이폰15", rank: 2, change: "up" },
    { keyword: "에어팟", rank: 3, change: "up" },
    { keyword: "여성원피스", rank: 4, change: "down" },
    { keyword: "운동화", rank: 5, change: "up" },
    { keyword: "다이슨", rank: 6, change: "down" },
    { keyword: "노트북", rank: 7, change: "same" },
    { keyword: "가을자켓", rank: 8, change: "up" },
    { keyword: "비타민", rank: 9, change: "up" },
    { keyword: "캠핑용품", rank: 10, change: "up" },
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
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
            className="lucide lucide-list inline-block mr-2 text-primary"
          >
            <line x1="8" x2="21" y1="6" y2="6" />
            <line x1="8" x2="21" y1="12" y2="12" />
            <line x1="8" x2="21" y1="18" y2="18" />
            <line x1="3" x2="3.01" y1="6" y2="6" />
            <line x1="3" x2="3.01" y1="12" y2="12" />
            <line x1="3" x2="3.01" y1="18" y2="18" />
          </svg>
          키워드 Best
        </h2>
        <span className="text-xs text-gray-500">네이버쇼핑인사이트 인기키워드</span>
      </div>

      <Tabs defaultValue="daily" onValueChange={(value) => setPeriod(value as "daily" | "weekly")}>
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="daily">일간 트렌드</TabsTrigger>
          <TabsTrigger value="weekly">주간 트렌드</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <ul className="space-y-1">
            {dailyKeywords.map((keyword, index) => (
              <li 
                key={index} 
                className="flex items-center py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                onClick={() => handleKeywordClick(keyword.keyword)}
              >
                <span className="w-8 text-center font-semibold text-primary">{keyword.rank}</span>
                <span className="flex-grow">{keyword.keyword}</span>
                {getChangeIcon(keyword.change)}
              </li>
            ))}
          </ul>
        </TabsContent>
        
        <TabsContent value="weekly">
          <ul className="space-y-1">
            {weeklyKeywords.map((keyword, index) => (
              <li 
                key={index} 
                className="flex items-center py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                onClick={() => handleKeywordClick(keyword.keyword)}
              >
                <span className="w-8 text-center font-semibold text-primary">{keyword.rank}</span>
                <span className="flex-grow">{keyword.keyword}</span>
                {getChangeIcon(keyword.change)}
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KeywordTrends;
