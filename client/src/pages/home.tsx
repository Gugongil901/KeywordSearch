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
      
      <section className="bg-[#f5f7f8] w-full pt-6 mt-8 pb-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xl font-medium mb-2">실시간 키워드 분석</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-2xl mx-auto">
            최신 트렌드와 인기 키워드를 분석하여 성공적인 마케팅 전략을 수립하세요.
          </p>
          
          {/* 일간/주간 선택 탭 - 중앙 정렬 */}
          <div className="pb-6 flex justify-center items-center">
            <div className="flex space-x-4">
              <button 
                className={`px-5 py-2 rounded-md text-sm ${trendPeriod === 'daily' ? 'bg-primary text-white font-medium' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setTrendPeriod('daily')}
              >
                일간 트렌드
              </button>
              <button 
                className={`px-5 py-2 rounded-md text-sm ${trendPeriod === 'weekly' ? 'bg-primary text-white font-medium' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setTrendPeriod('weekly')}
              >
                주간 트렌드
              </button>
            </div>
          </div>
          
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
