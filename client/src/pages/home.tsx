import React, { useState } from "react";
import HeroSearch from "@/components/home/hero-search";
import KeywordTrends from "@/components/home/keyword-trends";
import CategoryKeywords from "@/components/home/sales-ranking";
import KeywordAnalysis from "@/components/home/keyword-analysis";
import ProductRanking from "@/components/home/product-ranking";
import FAQSection from "@/components/home/faq-section";
import CTASection from "@/components/home/cta-section";

// 카테고리 코드 매핑 객체 추가 - 네이버 쇼핑인사이트 API 규격에 맞게 수정
const categoryCodeMap: Record<string, string> = {
  "전체": "all",
  "패션의류": "50000000",
  "패션잡화": "50000001",
  "화장품/미용": "50000002",
  "디지털/가전": "50000003",
  "가구/인테리어": "50000004",
  "출산/육아": "50000005",
  "식품": "50000006",
  "스포츠/레저": "50000007",
  "생활/건강": "50000008",
};

// 카테고리 이름 매핑 객체 추가 (코드 -> 이름)
const categoryNameMap: Record<string, string> = {
  "all": "전체",
  "50000000": "패션의류",
  "50000001": "패션잡화", 
  "50000002": "화장품/미용",
  "50000003": "디지털/가전",
  "50000004": "가구/인테리어",
  "50000005": "출산/육아",
  "50000006": "식품",
  "50000007": "스포츠/레저",
  "50000008": "생활/건강"
};

const Home: React.FC = () => {
  const [category, setCategory] = useState<string>("전체");
  const [trendType, setTrendType] = useState<"daily" | "weekly">("daily");
  
  // 카테고리 코드 가져오기
  const getCategoryCode = (categoryName: string): string => {
    return categoryCodeMap[categoryName] || "all";
  };
  
  // 카테고리 이름 가져오기
  const getCategoryName = (categoryCode: string): string => {
    return categoryNameMap[categoryCode] || "전체";
  };
  
  return (
    <div>
      <HeroSearch 
        selectedCategory={category} 
        onCategoryChange={setCategory}
        selectedTrendType={trendType}
        onTrendTypeChange={setTrendType}
      />
      
      {/* 키워드 트렌드 섹션 - 표준 UI 적용 */}
      <section className="bg-gray-50 w-full pt-2 mt-2">
        <div className="container mx-auto px-4 py-3">
          <h2 className="text-xl font-semibold mb-3">실시간 트렌드</h2>
          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KeywordTrends 
                period={trendType} 
                category={getCategoryCode(category)} 
                categoryName={category}
              />
              <CategoryKeywords 
                period={trendType} 
                category={getCategoryCode(category)} 
                categoryName={category}
              />
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
