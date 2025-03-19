import React, { useState } from "react";
import HeroSearch from "@/components/home/hero-search";
import KeywordTrends from "@/components/home/keyword-trends";
import CategoryKeywords from "@/components/home/sales-ranking";
import KeywordAnalysis from "@/components/home/keyword-analysis";
import ProductRanking from "@/components/home/product-ranking";
import HelpSection from "@/components/home/help-section";
import FAQSection from "@/components/home/faq-section";
import CTASection from "@/components/home/cta-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Home: React.FC = () => {
  const [trendPeriod, setTrendPeriod] = useState<"daily" | "weekly">("daily");
  
  return (
    <div>
      <HeroSearch />
      
      {/* 네이버 DataLab 스타일 상단바 */}
      <div className="bg-[#f5f7f8] w-full pt-4 mt-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-medium mb-2">쇼핑인사이트</h2>
          <p className="text-sm text-gray-500 mb-6">
            쇼핑 분야별 검색 추이와 분야별 검색어 통계를 확인할 수 있습니다.
          </p>
          
          {/* 메인 탭 */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 text-base">
              <a className={`pb-4 px-1 border-b-2 border-primary font-medium text-primary`}>
                분야별 인기 검색어
              </a>
              <a className={`pb-4 px-1 text-gray-500 hover:text-gray-800`}>
                인기분야
              </a>
            </div>
          </div>
          
          {/* 일간/주간 선택 탭 */}
          <div className="pt-6 pb-4 flex justify-between items-center">
            <div className="flex space-x-4">
              <button 
                className={`px-3 py-2 rounded-md text-sm ${trendPeriod === 'daily' ? 'bg-white border shadow-sm font-medium' : 'text-gray-500'}`}
                onClick={() => setTrendPeriod('daily')}
              >
                일간 트렌드
              </button>
              <button 
                className={`px-3 py-2 rounded-md text-sm ${trendPeriod === 'weekly' ? 'bg-white border shadow-sm font-medium' : 'text-gray-500'}`}
                onClick={() => setTrendPeriod('weekly')}
              >
                주간 트렌드
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })} 기준
            </div>
          </div>
        </div>
      </div>

      <section className="bg-[#f5f7f8] pt-4 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <KeywordTrends period={trendPeriod} />
            <CategoryKeywords period={trendPeriod} />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <KeywordAnalysis />
      </section>

      <section className="container mx-auto px-4 py-8 mb-12">
        <ProductRanking />
      </section>

      <section className="container mx-auto px-4 py-8 mb-12">
        <HelpSection />
      </section>

      <section className="container mx-auto px-4 py-8 mb-12">
        <FAQSection />
      </section>

      <section className="container mx-auto px-4 py-12 mb-12">
        <CTASection />
      </section>
    </div>
  );
};

export default Home;
