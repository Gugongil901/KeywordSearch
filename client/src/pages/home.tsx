import React from "react";
import HeroSearch from "@/components/home/hero-search";
import KeywordTrends from "@/components/home/keyword-trends";
import CategoryKeywords from "@/components/home/sales-ranking";
import KeywordAnalysis from "@/components/home/keyword-analysis";
import ProductRanking from "@/components/home/product-ranking";
import FAQSection from "@/components/home/faq-section";
import CTASection from "@/components/home/cta-section";

const Home: React.FC = () => {
  
  return (
    <div>
      <HeroSearch />
      
      {/* 키워드 트렌드 섹션 - 너비 조정 */}
      <section className="bg-[#f5f7f8] w-full pt-4 mt-4">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 pt-4">
              <KeywordTrends period="daily" />
              <CategoryKeywords period="daily" />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <KeywordAnalysis />
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 mb-12">
        <div className="max-w-4xl mx-auto">
          <ProductRanking />
        </div>
      </section>

      {/* 도움말 섹션 삭제 - 사용자 요청에 따라 빨간색 영역 제거 */}

      <section className="container mx-auto px-4 py-8 mb-12">
        <div className="max-w-4xl mx-auto">
          <FAQSection />
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 mb-12">
        <div className="max-w-4xl mx-auto">
          <CTASection />
        </div>
      </section>
    </div>
  );
};

export default Home;
