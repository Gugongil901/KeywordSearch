import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const CategoryKeywords: React.FC = () => {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
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

  const { data: dailyData, isLoading: isDailyLoading } = useQuery({
    queryKey: [`/api/trends/daily?category=${activeCategory}`],
    refetchOnWindowFocus: false,
  });

  const { data: weeklyData, isLoading: isWeeklyLoading } = useQuery({
    queryKey: [`/api/trends/weekly?category=${activeCategory}`],
    refetchOnWindowFocus: false,
  });

  // 카테고리별 인기 키워드 mock 데이터
  const getCategoryKeywords = (category: string, isPeriodDaily: boolean) => {
    // 실제로는 API에서 받아오지만 현재는 카테고리별로 mock 데이터 생성
    const mockData: Record<string, KeywordTrend[]> = {
      all: isPeriodDaily 
        ? [
            { keyword: "파로", rank: 1, change: "same" },
            { keyword: "코스", rank: 2, change: "up" },
            { keyword: "닭가슴살", rank: 3, change: "up" },
            { keyword: "당근", rank: 4, change: "up" },
            { keyword: "스투시", rank: 5, change: "up" },
          ]
        : [
            { keyword: "명품가방", rank: 1, change: "same" },
            { keyword: "아이폰15", rank: 2, change: "up" },
            { keyword: "에어팟", rank: 3, change: "up" },
            { keyword: "여성원피스", rank: 4, change: "down" },
            { keyword: "운동화", rank: 5, change: "up" },
          ],
      fashion: isPeriodDaily
        ? [
            { keyword: "스투시", rank: 1, change: "up" },
            { keyword: "겨울 코트", rank: 2, change: "up" },
            { keyword: "패딩", rank: 3, change: "up" },
            { keyword: "니트", rank: 4, change: "same" },
            { keyword: "데님", rank: 5, change: "down" },
          ]
        : [
            { keyword: "여성원피스", rank: 1, change: "up" },
            { keyword: "겨울옷", rank: 2, change: "up" },
            { keyword: "겨울아우터", rank: 3, change: "up" },
            { keyword: "겨울점퍼", rank: 4, change: "up" },
            { keyword: "남자 겨울 코트", rank: 5, change: "up" },
          ],
      accessory: isPeriodDaily
        ? [
            { keyword: "비니", rank: 1, change: "up" },
            { keyword: "귀걸이", rank: 2, change: "up" },
            { keyword: "목걸이", rank: 3, change: "down" },
            { keyword: "겨울 양말", rank: 4, change: "up" },
            { keyword: "가죽장갑", rank: 5, change: "up" },
          ]
        : [
            { keyword: "목도리", rank: 1, change: "up" },
            { keyword: "겨울모자", rank: 2, change: "up" },
            { keyword: "귀마개", rank: 3, change: "same" },
            { keyword: "겨울장갑", rank: 4, change: "up" },
            { keyword: "크로스백", rank: 5, change: "down" },
          ],
      beauty: isPeriodDaily
        ? [
            { keyword: "립밤", rank: 1, change: "up" },
            { keyword: "파운데이션", rank: 2, change: "same" },
            { keyword: "마스카라", rank: 3, change: "up" },
            { keyword: "토너", rank: 4, change: "up" },
            { keyword: "선크림", rank: 5, change: "down" },
          ]
        : [
            { keyword: "에센스", rank: 1, change: "same" },
            { keyword: "핸드크림", rank: 2, change: "up" },
            { keyword: "마스크팩", rank: 3, change: "up" },
            { keyword: "클렌징폼", rank: 4, change: "down" },
            { keyword: "바디로션", rank: 5, change: "up" },
          ],
      digital: isPeriodDaily
        ? [
            { keyword: "아이폰15", rank: 1, change: "up" },
            { keyword: "에어팟", rank: 2, change: "up" },
            { keyword: "갤럭시", rank: 3, change: "same" },
            { keyword: "노트북", rank: 4, change: "up" },
            { keyword: "블루투스 이어폰", rank: 5, change: "up" },
          ]
        : [
            { keyword: "아이패드", rank: 1, change: "up" },
            { keyword: "맥북", rank: 2, change: "up" },
            { keyword: "공기청정기", rank: 3, change: "down" },
            { keyword: "전기히터", rank: 4, change: "up" },
            { keyword: "가습기", rank: 5, change: "up" },
          ],
      furniture: isPeriodDaily
        ? [
            { keyword: "침대", rank: 1, change: "same" },
            { keyword: "소파", rank: 2, change: "up" },
            { keyword: "책상", rank: 3, change: "down" },
            { keyword: "이케아", rank: 4, change: "up" },
            { keyword: "커튼", rank: 5, change: "up" },
          ]
        : [
            { keyword: "원목테이블", rank: 1, change: "up" },
            { keyword: "식탁", rank: 2, change: "up" },
            { keyword: "수납장", rank: 3, change: "up" },
            { keyword: "행거", rank: 4, change: "down" },
            { keyword: "매트리스", rank: 5, change: "same" },
          ],
      baby: isPeriodDaily
        ? [
            { keyword: "분유", rank: 1, change: "up" },
            { keyword: "물티슈", rank: 2, change: "up" },
            { keyword: "기저귀", rank: 3, change: "same" },
            { keyword: "이유식", rank: 4, change: "down" },
            { keyword: "아기옷", rank: 5, change: "up" },
          ]
        : [
            { keyword: "젖병", rank: 1, change: "up" },
            { keyword: "아기이불", rank: 2, change: "same" },
            { keyword: "유모차", rank: 3, change: "up" },
            { keyword: "카시트", rank: 4, change: "down" },
            { keyword: "아기띠", rank: 5, change: "up" },
          ],
      food: isPeriodDaily
        ? [
            { keyword: "닭가슴살", rank: 1, change: "up" },
            { keyword: "김치", rank: 2, change: "up" },
            { keyword: "삼겹살", rank: 3, change: "up" },
            { keyword: "고구마", rank: 4, change: "same" },
            { keyword: "사과", rank: 5, change: "down" },
          ]
        : [
            { keyword: "과일", rank: 1, change: "up" },
            { keyword: "견과류", rank: 2, change: "up" },
            { keyword: "쌀", rank: 3, change: "same" },
            { keyword: "홍삼", rank: 4, change: "up" },
            { keyword: "간식", rank: 5, change: "down" },
          ],
      sports: isPeriodDaily
        ? [
            { keyword: "런닝화", rank: 1, change: "up" },
            { keyword: "홈트레이닝", rank: 2, change: "up" },
            { keyword: "요가매트", rank: 3, change: "down" },
            { keyword: "덤벨", rank: 4, change: "up" },
            { keyword: "헬스장갑", rank: 5, change: "same" },
          ]
        : [
            { keyword: "운동화", rank: 1, change: "up" },
            { keyword: "골프채", rank: 2, change: "up" },
            { keyword: "자전거", rank: 3, change: "down" },
            { keyword: "등산화", rank: 4, change: "up" },
            { keyword: "스키복", rank: 5, change: "up" },
          ],
      life: isPeriodDaily
        ? [
            { keyword: "비타민", rank: 1, change: "up" },
            { keyword: "종이컵", rank: 2, change: "up" },
            { keyword: "마스크", rank: 3, change: "same" },
            { keyword: "화장지", rank: 4, change: "down" },
            { keyword: "생수", rank: 5, change: "up" },
          ]
        : [
            { keyword: "프로바이오틱스", rank: 1, change: "up" },
            { keyword: "루테인", rank: 2, change: "up" },
            { keyword: "오메가3", rank: 3, change: "up" },
            { keyword: "칫솔", rank: 4, change: "down" },
            { keyword: "샴푸", rank: 5, change: "same" },
          ],
    };

    return mockData[category] || mockData.all;
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
            className="lucide lucide-layout-grid inline-block mr-2 text-primary"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          카테고리별 인기 키워드
        </h2>
        <span className="text-xs text-gray-500">네이버쇼핑인사이트 분야별 인기키워드</span>
      </div>

      <Tabs defaultValue="daily" onValueChange={(value) => setPeriod(value as "daily" | "weekly")}>
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="daily">일간 트렌드</TabsTrigger>
          <TabsTrigger value="weekly">주간 트렌드</TabsTrigger>
        </TabsList>

        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`px-3 py-1 rounded-full text-xs transition ${
                activeCategory === cat.id
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-primary hover:text-white"
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        <TabsContent value="daily">
          <ul className="space-y-1">
            {getCategoryKeywords(activeCategory, true).map((keyword, index) => (
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
            {getCategoryKeywords(activeCategory, false).map((keyword, index) => (
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

export default CategoryKeywords;
