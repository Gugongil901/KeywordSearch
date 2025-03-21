import React, { useState } from "react";
import { useLocation } from "wouter";
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
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [_, navigate] = useLocation();

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/keyword?query=${encodeURIComponent(searchTerm.trim())}`);
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
              className="lucide lucide-line-chart inline-block mr-2 text-primary"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
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
                  placeholder="상품을 검색해보세요"
                  className="flex-grow py-3 px-2 outline-none border-none shadow-none text-gray-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  className="bg-primary text-white px-5 py-3 rounded-none font-medium hover:bg-primary/90"
                  onClick={handleSearch}
                >
                  검색
                </Button>
              </div>
            </div>

            {/* Trend Buttons */}
            <div className="flex mt-4 justify-center space-x-4">
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedTrendType === "daily"
                    ? "bg-white shadow-sm text-primary border border-gray-200"
                    : "bg-gray-50 text-gray-900"
                }`}
                onClick={() => onTrendTypeChange("daily")}
              >
                일간 트렌드
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedTrendType === "weekly"
                    ? "bg-white shadow-sm text-primary border border-gray-200"
                    : "bg-gray-50 text-gray-900"
                }`}
                onClick={() => onTrendTypeChange("weekly")}
              >
                주간 트렌드
              </button>
            </div>

            {/* Category Filters */}
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
