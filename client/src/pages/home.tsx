import React from "react";
import HeroSearch from "@/components/home/hero-search";
import KeywordTrends from "@/components/home/keyword-trends";
import SalesRanking from "@/components/home/sales-ranking";
import KeywordAnalysis from "@/components/home/keyword-analysis";
import ProductRanking from "@/components/home/product-ranking";
import HelpSection from "@/components/home/help-section";
import FAQSection from "@/components/home/faq-section";
import CTASection from "@/components/home/cta-section";

const Home: React.FC = () => {
  return (
    <div>
      <HeroSearch />

      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <KeywordTrends />
          <SalesRanking />
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
