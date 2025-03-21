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
      
      {/* 실시간 키워드 분석 섹션 - 빨간색 영역 제거 */}
      <section className="bg-[#f5f7f8] w-full pt-4 mt-4">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-medium text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 text-primary"><path d="m2 12 10 10 10-10"/><path d="m2 12 10-10 10 10"/></svg>
            실시간 키워드 분석
          </h2>
          
          {/* 일간/주간 선택 탭 - 중앙 정렬 */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-white rounded-md shadow-sm p-1">
              <button 
                className={`px-4 py-1 rounded-md text-sm transition ${trendPeriod === 'daily' ? 'bg-primary text-white font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setTrendPeriod('daily')}
              >
                일간 트렌드
              </button>
              <button 
                className={`px-4 py-1 rounded-md text-sm transition ${trendPeriod === 'weekly' ? 'bg-primary text-white font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setTrendPeriod('weekly')}
              >
                주간 트렌드
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
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

      {/* 도움말 섹션 삭제 - 사용자 요청에 따라 빨간색 영역 제거 */}

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
