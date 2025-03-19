import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTopProducts, Product } from "@/lib/naver-api";
import { Skeleton } from "@/components/ui/skeleton";

interface TrackedProduct {
  id: string;
  image: string;
  name: string;
  brand: string;
  price: number;
  reviewCount: number;
  keyword: string;
  currentRank: number;
  previousRank: number;
  rankChange: number;
}

const TrackRanking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("daily");
  const [productUrl, setProductUrl] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // This would normally get data from the backend
  const mockTrackedProducts: TrackedProduct[] = [
    {
      id: "1",
      image:
        "https://shopping-phinf.pstatic.net/main_8527474/85274747835.22.jpg",
      name: "순금 돌반지 3.75g 1.875g 금수저 아기 돌 백일 반지 용띠",
      brand: "순금장인",
      price: 458000,
      reviewCount: 675,
      keyword: "돌반지",
      currentRank: 3,
      previousRank: 5,
      rankChange: 2, // positive = up, negative = down, 0 = no change
    },
    {
      id: "2",
      image:
        "https://shopping-phinf.pstatic.net/main_8274781/82747810205.7.jpg",
      name: "[게임패스 증정]Xbox 무선 컨트롤러 - 카본 블랙",
      brand: "Xbox공식스토어",
      price: 59000,
      reviewCount: 245,
      keyword: "Xbox 컨트롤러",
      currentRank: 7,
      previousRank: 2,
      rankChange: -5,
    },
    {
      id: "3",
      image:
        "https://shopping-phinf.pstatic.net/main_8326625/83266257397.4.jpg",
      name: "노시부 프로 전동식 의료용 아기 콧물흡입기",
      brand: "노시부코리아",
      price: 39800,
      reviewCount: 3827,
      keyword: "콧물흡입기",
      currentRank: 1,
      previousRank: 1,
      rankChange: 0,
    },
    {
      id: "4",
      image:
        "https://shopping-phinf.pstatic.net/main_8289288/82892881441.10.jpg",
      name: "(본사 직영) 삼다수 무라벨 2L 12입 (유 무라벨 랜덤발송)",
      brand: "광동제약 직영스토어",
      price: 13200,
      reviewCount: 8492,
      keyword: "삼다수",
      currentRank: 4,
      previousRank: 11,
      rankChange: 7,
    },
  ];

  const { data: topProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/top"],
  });

  const getRankChangeClass = (change: number) => {
    if (change > 0) return "bg-green-100 text-green-600";
    if (change < 0) return "bg-red-100 text-red-500";
    return "bg-gray-200 text-gray-900";
  };

  const getRankChangeText = (change: number) => {
    if (change > 0) return `상승 +${change}`;
    if (change < 0) return `하락 ${change}`;
    return "유지 0";
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    // This would normally send data to the backend
    setIsAdding(false);
    setProductUrl("");
    setKeyword("");
    // Show success message
    alert("상품 추적이 추가되었습니다.");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-bar-chart-big inline-block mr-2 text-primary"
          >
            <path d="M3 3v18h18" />
            <rect x="7" y="10" width="4" height="8" />
            <rect x="15" y="5" width="4" height="13" />
          </svg>
          내 상품 순위 추적
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto mb-6">
          네이버 쇼핑에서 내 상품이 어떻게 노출되고 있는지 확인하고 추적하세요. 순위 변화와 트렌드를 쉽게 분석할 수 있습니다.
        </p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="daily">일간 추적</TabsTrigger>
            <TabsTrigger value="realtime">실시간 추적</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-primary text-white hover:bg-primary/90"
        >
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
            className="mr-2"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          새 상품 추적하기
        </Button>
      </div>

      {isAdding && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">새 상품 추적 추가</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상품 URL
                </label>
                <Input
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://shopping.naver.com/..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  키워드
                </label>
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="추적할 키워드"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
                  추가하기
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <TabsContent value="daily" className="m-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    ></th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      상품명
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      가격
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      키워드
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      리뷰수
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      현재 순위
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      변동
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockTrackedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">{product.brand}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.price.toLocaleString()}원
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-primary font-medium">
                        {product.keyword}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.reviewCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.currentRank}위
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getRankChangeClass(
                            product.rankChange
                          )}`}
                        >
                          {getRankChangeText(product.rankChange)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="realtime" className="m-0">
            <div className="p-6 text-center">
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
                className="mx-auto mb-4 text-primary"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                실시간 추적 기능
              </h2>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                이 기능은 프리미엄 사용자에게만 제공됩니다. 실시간으로 상품 순위 변화를 추적해보세요.
              </p>
              <Button className="bg-primary text-white hover:bg-primary/90">
                프리미엄으로 업그레이드
              </Button>
            </div>
          </TabsContent>
        </CardContent>
      </Card>

      {/* Suggested Products to Track */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          추적 추천 인기 상품
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array(4)
                .fill(0)
                .map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <Skeleton className="h-32 w-full mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))
            : topProducts?.slice(0, 4).map((product) => (
                <Card key={product.productId}>
                  <CardContent className="p-4">
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                      <span className="absolute top-0 left-0 bg-primary text-white text-xs px-2 py-1 rounded-br">
                        인기 {product.rank}위
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">{product.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{product.brandName}</p>
                    <Button
                      onClick={() => {
                        setIsAdding(true);
                        setProductUrl(product.productUrl);
                      }}
                      className="w-full text-sm"
                      variant="outline"
                    >
                      이 상품 추적하기
                    </Button>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
};

export default TrackRanking;
