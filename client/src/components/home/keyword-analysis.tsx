import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
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

const KeywordAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [chartPeriod, setChartPeriod] = useState<string>("daily");

  // Search trend chart data
  const searchTrendData = {
    labels: ["1월", "2월", "3월", "4월", "5월", "6월", "7월"],
    datasets: [
      {
        label: "검색량",
        data: [1200, 1900, 3000, 5000, 4200, 3800, 6000],
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Price distribution chart data
  const priceDistributionData = {
    labels: ["~1만원", "1~3만원", "3~5만원", "5~10만원", "10만원~"],
    datasets: [
      {
        label: "상품 수",
        data: [15, 30, 40, 10, 5],
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

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
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
            className="lucide lucide-gem inline-block mr-2 text-primary"
          >
            <path d="M6 3h12l4 6-10 13L2 9Z" />
            <path d="M11 3 8 9l4 13 4-13-3-6" />
            <path d="M2 9h20" />
          </svg>
          셀러를 위한 모든 데이터 분석
        </h2>
        <p className="text-gray-500 max-w-3xl mx-auto">
          키워드 데이터만큼은 구글, 네이버 대신 GUGONGIL! <br />
          키워드의 지표, 차트, 등록된 상품, 연관 키워드까지 모두 확인해보세요.
        </p>
        <div className="mt-4 flex justify-center space-x-4">
          <Link href="/keyword">
            <Button className="bg-primary text-white px-5 py-2 rounded-md font-medium hover:bg-primary/90">
              키워드분석 바로가기
            </Button>
          </Link>
          <Link href="/guide/keyword">
            <Button variant="outline" className="bg-white border border-primary text-primary px-5 py-2 rounded-md font-medium hover:bg-gray-50">
              자세히 알아보기
            </Button>
          </Link>
        </div>
      </div>

      {/* Keyword Analysis Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`inline-block py-2 px-4 font-medium text-sm ${
                activeTab === "overview"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              키워드 개요
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("products")}
              className={`inline-block py-2 px-4 font-medium text-sm ${
                activeTab === "products"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              상품 목록
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("related")}
              className={`inline-block py-2 px-4 font-medium text-sm ${
                activeTab === "related"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              연관 키워드
            </button>
          </li>
        </ul>
      </div>

      {/* Content based on active tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">상품수</h3>
                <div className="text-xl font-bold text-primary">
                  58,432 <span className="text-sm font-normal">개</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">한 달 검색수</h3>
                <div className="text-xl font-bold text-primary">
                  15,230 <span className="text-sm font-normal">회</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">검색 비율</h3>
                <div className="flex">
                  <div className="mr-4">
                    <span className="text-xs text-gray-500">PC</span>
                    <p className="text-lg font-bold text-primary">32%</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">모바일</span>
                    <p className="text-lg font-bold text-primary">68%</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">6개월 매출</h3>
                <div className="text-xl font-bold text-primary">
                  2,543 <span className="text-sm font-normal">만원</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">6개월 판매량</h3>
                <div className="text-xl font-bold text-primary">
                  4,876 <span className="text-sm font-normal">개</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xs text-gray-500 mb-1">평균 가격</h3>
                <div className="text-xl font-bold text-primary">
                  52,150 <span className="text-sm font-normal">원</span>
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
                <Line data={searchTrendData} options={chartOptions} />
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
                  <span className="text-sm font-medium text-green-600">
                    아주좋음
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm">경쟁강도</span>
                  <span className="text-sm font-medium text-green-600">
                    1.74{" "}
                    <span className="text-xs">아주좋음</span>
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm">실거래상품 비율</span>
                  <span className="text-sm font-medium text-green-600">
                    63% <span className="text-xs">좋음</span>
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-sm">해외상품 비율</span>
                  <span className="text-sm font-medium text-red-500">
                    10% <span className="text-xs">나쁨</span>
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
      )}

      {/* Placeholder for other tabs */}
      {activeTab === "products" && (
        <div className="py-4 text-center text-gray-500">
          이 데모에서는 상품 목록 탭의 내용이 표시되지 않습니다.
          <br />
          실제 서비스에서는 이 키워드에 해당하는 상품 목록이 표시됩니다.
        </div>
      )}
      {activeTab === "related" && (
        <div className="py-4 text-center text-gray-500">
          이 데모에서는 연관 키워드 탭의 내용이 표시되지 않습니다.
          <br />
          실제 서비스에서는 이 키워드와 연관된 키워드 목록이 표시됩니다.
        </div>
      )}
    </div>
  );
};

export default KeywordAnalysis;
