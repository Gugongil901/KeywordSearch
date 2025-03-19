import React, { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { searchKeyword, getKeywordTrends, KeywordSearchResult } from "@/lib/naver-api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfettiEffect, shouldTriggerConfetti } from "@/components/ui/confetti-effect";
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

const KeywordDetail: React.FC = () => {
  const { keyword } = useParams<{ keyword: string }>();
  const decodedKeyword = decodeURIComponent(keyword || "");
  const [chartPeriod, setChartPeriod] = useState<string>("daily");
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const { data, isLoading, error } = useQuery<KeywordSearchResult>({
    queryKey: [`/api/search?query=${decodedKeyword}`],
    refetchOnWindowFocus: false
  });

  // 데이터 로드 후 고성능 키워드 체크
  useEffect(() => {
    if (data) {
      // 고성능 키워드 발견 시 축하 효과 표시
      if (
        data.searchCount > 20000 || // 검색량이 많거나
        data.competitionIndex < 1.5 || // 경쟁이 낮거나
        data.realProductRatio > 70 || // 실제 상품 비율이 높거나
        data.totalSales > 5000 // 매출액이 높은 경우
      ) {
        setShowConfetti(true);
        // 5초 후 효과 종료
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <Skeleton className="h-10 w-1/3 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-2/3" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-48 rounded-lg" />
            </div>
            <div className="col-span-1">
              <Skeleton className="h-48 rounded-lg mb-4" />
              <Skeleton className="h-48 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">데이터를 불러오는데 실패했습니다</h2>
          <p className="text-gray-500 mb-4">키워드 데이터를 가져오는 중에 문제가 발생했습니다.</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary text-white hover:bg-primary/90"
          >
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  // Chart data
  const trendData = {
    labels: data.trends.map(trend => trend.date),
    datasets: [
      {
        label: "검색량",
        data: data.trends.map(trend => trend.count),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Price distribution data - create buckets from product prices
  const priceRanges = ["~1만원", "1~3만원", "3~5만원", "5~10만원", "10만원~"];
  const priceBuckets = [0, 0, 0, 0, 0];

  data.products.forEach(product => {
    if (product.price < 10000) priceBuckets[0]++;
    else if (product.price < 30000) priceBuckets[1]++;
    else if (product.price < 50000) priceBuckets[2]++;
    else if (product.price < 100000) priceBuckets[3]++;
    else priceBuckets[4]++;
  });

  const priceDistributionData = {
    labels: priceRanges,
    datasets: [
      {
        label: "상품 수",
        data: priceBuckets,
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(59, 130, 246, 0.6)",
          "rgba(59, 130, 246, 0.5)",
          "rgba(59, 130, 246, 0.4)",
          "rgba(59, 130, 246, 0.3)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(59, 130, 246, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0,0,0,0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const formatCompetitionLevel = (index: number) => {
    if (index < 1.5) return { text: "아주좋음", color: "text-green-600" };
    if (index < 2.5) return { text: "좋음", color: "text-green-600" };
    if (index < 3.5) return { text: "보통", color: "text-yellow-500" };
    return { text: "나쁨", color: "text-red-500" };
  };

  const formatRatio = (ratio: number) => {
    if (ratio > 60) return { text: "좋음", color: "text-green-600" };
    if (ratio > 30) return { text: "보통", color: "text-yellow-500" };
    return { text: "나쁨", color: "text-red-500" };
  };

  const competition = formatCompetitionLevel(data.competitionIndex);
  const realProductRatioFormatted = formatRatio(data.realProductRatio);
  const foreignProductRatioFormatted = formatRatio(100 - data.foreignProductRatio);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Confetti 효과 */}
      <ConfettiEffect 
        trigger={showConfetti} 
        particleCount={150}
        spread={180}
        origin={{ x: 0.5, y: 0.3 }}
      />
      
      {/* 고성능 키워드 발견 시 축하 메시지 */}
      {showConfetti && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 flex items-center">
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
            className="mr-2"
          >
            <path d="m9 12 2 2 4-4" />
            <path d="M12 3c.764.12 1.53.225 2.286.346a1.13 1.13 0 0 1 .684 1.912c-.324.315-.656.622-.964.909-.431.4-.431 1.118 0 1.352.46.252.906.504 1.354.756a1.15 1.15 0 0 1 .273 1.932c-.498.368-.695.798-.92 1.229-.353.678.388 1.452 1.106 1.32.73-.135 1.459-.27 2.194-.404a1.158 1.158 0 0 1 1.356 1.494c-.5.827-.912 1.647-1.35 2.348-.308.49-.778.91-1.338.88-.452-.025-.899-.061-1.342-.089-.71-.046-1.313.541-1.313 1.253v2.528a1.133 1.133 0 0 1-1.306 1.133c-.726-.147-1.455-.3-2.176-.435-.5-.093-.84-.511-.83-1.016v-1.463c0-.788-.778-1.35-1.485-1.085a16.446 16.446 0 0 0-1.166.56c-.423.235-.927.27-1.296-.065-.65-.59-1.296-1.188-1.944-1.786-.413-.38-.435-1.006-.129-1.421.33-.445.66-.89.99-1.333.264-.355.34-.835.015-1.16a5.223 5.223 0 0 1-.573-1.066c-.332-.95-1.46-1.08-2.04-.223-.29.43-.582.86-.87 1.293-.41.61-1.31.748-1.875.259L5.77 8.526a1.135 1.135 0 0 1-.15-1.698c.435-.508.887-1.001 1.32-1.508.383-.448 1.018-.51 1.441-.234.42.273.838.55 1.258.825.769.505 1.738-.105 1.661-.987a13.973 13.973 0 0 1-.082-1.396c.032-.563.42-1.06.982-1.136.805-.11 1.609-.219 2.414-.328.43-.059.85.145 1.066.485.161.252.31.512.47.77.368.592 1.31.642 1.765.151.193-.207.386-.414.579-.62.292-.313.748-.437 1.155-.3" />
          </svg>
          <span>축하합니다! 고성능 키워드를 발견했습니다! 이 키워드는 경쟁력이 있어 비즈니스에 유리할 수 있습니다.</span>
        </div>
      )}

      <div className="mb-4">
        <Link href="/" className="text-primary hover:underline flex items-center">
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
            className="mr-1"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          홈으로 돌아가기
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          '{decodedKeyword}' 키워드 분석
        </h1>
        <p className="text-gray-500 mb-6">
          네이버 쇼핑에서 {decodedKeyword} 키워드에 대한 분석 결과입니다.
        </p>

        <Tabs defaultValue="overview">
          <TabsList className="mb-4 border-b border-gray-200 w-full justify-start">
            <TabsTrigger value="overview" className="text-sm">키워드 개요</TabsTrigger>
            <TabsTrigger value="products" className="text-sm">상품 목록</TabsTrigger>
            <TabsTrigger value="related" className="text-sm">연관 키워드</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Key Metrics */}
              <div className="col-span-1 md:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-xs text-gray-500 mb-1">상품수</h3>
                    <div className="text-xl font-bold text-primary">
                      {data.productCount.toLocaleString()} <span className="text-sm font-normal">개</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-xs text-gray-500 mb-1">한 달 검색수</h3>
                    <div className="text-xl font-bold text-primary">
                      {data.searchCount.toLocaleString()} <span className="text-sm font-normal">회</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-xs text-gray-500 mb-1">검색 비율</h3>
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-xs text-gray-500 mb-1">6개월 매출</h3>
                    <div className="text-xl font-bold text-primary">
                      {data.totalSales.toLocaleString()} <span className="text-sm font-normal">만원</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-xs text-gray-500 mb-1">6개월 판매량</h3>
                    <div className="text-xl font-bold text-primary">
                      {data.totalSalesCount.toLocaleString()} <span className="text-sm font-normal">개</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-xs text-gray-500 mb-1">평균 가격</h3>
                    <div className="text-xl font-bold text-primary">
                      {data.averagePrice.toLocaleString()} <span className="text-sm font-normal">원</span>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">검색량 추이</h3>
                    <div className="flex space-x-2">
                      <button
                        className={`text-xs px-2 py-1 rounded ${
                          chartPeriod === "daily"
                            ? "bg-primary text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                        onClick={() => setChartPeriod("daily")}
                      >
                        일간
                      </button>
                      <button
                        className={`text-xs px-2 py-1 rounded ${
                          chartPeriod === "weekly"
                            ? "bg-primary text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                        onClick={() => setChartPeriod("weekly")}
                      >
                        주간
                      </button>
                      <button
                        className={`text-xs px-2 py-1 rounded ${
                          chartPeriod === "monthly"
                            ? "bg-primary text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                        onClick={() => setChartPeriod("monthly")}
                      >
                        월간
                      </button>
                    </div>
                  </div>
                  <div className="h-48">
                    <Line data={trendData} options={chartOptions} />
                  </div>
                </div>
              </div>

              {/* Competitive Analysis */}
              <div className="col-span-1">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium mb-4">경쟁 분석</h3>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center">
                      <span className="text-sm">경쟁 종합 지표</span>
                      <span className={`text-sm font-medium ${competition.color}`}>
                        {competition.text}
                      </span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm">경쟁강도</span>
                      <span className={`text-sm font-medium ${competition.color}`}>
                        {data.competitionIndex.toFixed(2)}{" "}
                        <span className="text-xs">{competition.text}</span>
                      </span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm">실거래상품 비율</span>
                      <span className={`text-sm font-medium ${realProductRatioFormatted.color}`}>
                        {data.realProductRatio}%{" "}
                        <span className="text-xs">{realProductRatioFormatted.text}</span>
                      </span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-sm">해외상품 비율</span>
                      <span className={`text-sm font-medium ${foreignProductRatioFormatted.color}`}>
                        {data.foreignProductRatio}%{" "}
                        <span className="text-xs">{foreignProductRatioFormatted.text}</span>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Distribution Chart */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-4">가격대별 분포</h3>
                  <div className="h-48">
                    <Bar data={priceDistributionData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상품</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">판매자</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가격</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리뷰수</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">랭킹</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.products.map((product, index) => (
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.reviewCount.toLocaleString()}
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
          </TabsContent>

          <TabsContent value="related">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.relatedKeywords.map((keyword, index) => (
                <Link
                  key={index}
                  href={`/keyword/${encodeURIComponent(keyword)}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
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
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default KeywordDetail;
