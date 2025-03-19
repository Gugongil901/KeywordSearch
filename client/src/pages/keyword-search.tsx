import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { KeywordSearchResult, searchKeyword } from "@/lib/naver-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const KeywordSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [submittedSearch, setSubmittedSearch] = useState<string>("");
  const [location, navigate] = useLocation();

  const { data, isLoading, error } = useQuery<KeywordSearchResult>({
    queryKey: [`/api/search?query=${submittedSearch}`],
    enabled: !!submittedSearch,
    refetchOnWindowFocus: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSubmittedSearch(searchTerm.trim());
    }
  };

  const handleKeywordClick = (keyword: string) => {
    navigate(`/keyword/${encodeURIComponent(keyword)}`);
  };

  const formatCompetitionLevel = (index: number) => {
    if (!index) return { text: "-", color: "text-gray-500" };
    if (index < 1.5) return { text: "아주좋음", color: "text-green-600" };
    if (index < 2.5) return { text: "좋음", color: "text-green-600" };
    if (index < 3.5) return { text: "보통", color: "text-yellow-500" };
    return { text: "나쁨", color: "text-red-500" };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
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
            className="lucide lucide-search inline-block mr-2 text-primary"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          키워드 분석
        </h1>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
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
              placeholder="분석할 키워드를 검색해보세요"
              className="flex-grow py-3 px-2 outline-none border-none shadow-none text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              type="submit"
              className="bg-primary text-white px-5 py-3 rounded-none font-medium hover:bg-primary/90"
            >
              검색
            </Button>
          </div>
        </form>
      </div>

      {isLoading && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-1/3 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-8 w-1/4 mt-8 mb-4" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
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
              className="mx-auto mb-4 text-red-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">검색 중 오류가 발생했습니다</h2>
            <p className="text-gray-500 mb-4">
              키워드 검색 중에 문제가 발생했습니다. 다시 시도해 주세요.
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-primary mr-2">'{data.keyword}'</span> 키워드 분석 결과
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">월 검색량</h3>
                <div className="text-xl font-bold text-primary">
                  {data.searchCount.toLocaleString()} <span className="text-sm font-normal">회</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">상품 수</h3>
                <div className="text-xl font-bold text-primary">
                  {data.productCount.toLocaleString()} <span className="text-sm font-normal">개</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">평균 가격</h3>
                <div className="text-xl font-bold text-primary">
                  {data.averagePrice.toLocaleString()} <span className="text-sm font-normal">원</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">총 매출액</h3>
                <div className="text-xl font-bold text-primary">
                  {data.totalSales.toLocaleString()} <span className="text-sm font-normal">만원</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">경쟁강도</h3>
                <div className="text-xl font-bold text-primary flex items-center">
                  {data.competitionIndex.toFixed(2)}{" "}
                  <span className={`text-sm ml-2 ${formatCompetitionLevel(data.competitionIndex).color}`}>
                    {formatCompetitionLevel(data.competitionIndex).text}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">기기별 검색 비율</h3>
                <div className="flex">
                  <div className="mr-4">
                    <span className="text-xs text-gray-500">PC</span>
                    <p className="text-lg font-bold text-primary">{data.pcSearchRatio}%</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">모바일</span>
                    <p className="text-lg font-bold text-primary">{data.mobileSearchRatio}%</p>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="products">
              <TabsList className="mb-4">
                <TabsTrigger value="products">상품 목록</TabsTrigger>
                <TabsTrigger value="related">연관 키워드</TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">판매자</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">랭킹</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.products.slice(0, 10).map((product, index) => (
                        <tr key={product.productId} className="hover:bg-gray-50">
                          <td className="px-4 py-4 flex items-center space-x-3">
                            <img src={product.image} alt={product.title} className="w-12 h-12 object-cover rounded" />
                            <div className="max-w-xs">
                              <a 
                                href={product.productUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-gray-900 hover:text-primary line-clamp-2"
                              >
                                {product.title}
                              </a>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.brandName}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.price.toLocaleString()}원
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 py-1 text-xs rounded-full bg-primary bg-opacity-10 text-primary">
                              {product.rank}위
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-center mt-4">
                  <Button 
                    onClick={() => handleKeywordClick(data.keyword)}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    상세 분석 보기
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="related">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.relatedKeywords.map((keyword, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                      onClick={() => handleKeywordClick(keyword)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{keyword}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {!isLoading && !data && !error && submittedSearch && (
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
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
              className="mx-auto mb-4 text-yellow-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">검색 결과가 없습니다</h2>
            <p className="text-gray-500 mb-4">
              입력하신 키워드에 대한 검색 결과가 없습니다. 다른 키워드로 시도해 보세요.
            </p>
          </CardContent>
        </Card>
      )}

      {!submittedSearch && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-4 text-primary"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                키워드를 검색해보세요
              </h2>
              <p className="text-gray-500 max-w-md mx-auto">
                분석하고 싶은 키워드를 검색하면 해당 키워드의 검색량, 경쟁강도, 관련 상품 등의 정보를 확인할 수 있습니다.
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                추천 검색 키워드
              </h3>
              <div className="flex flex-wrap gap-2">
                {["닭가슴살", "화장품", "에어팟", "노트북", "운동화", "다이어트", "유아용품", "스킨케어"].map(
                  (keyword, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(keyword);
                        setSubmittedSearch(keyword);
                      }}
                      className="px-3 py-1 bg-gray-50 hover:bg-primary hover:text-white rounded-full text-sm text-gray-700 transition"
                    >
                      {keyword}
                    </button>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KeywordSearch;
