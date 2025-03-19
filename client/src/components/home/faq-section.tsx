import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQSection: React.FC = () => {
  const faqs: FAQItem[] = [
    {
      id: "faq-1",
      question: "키워드 스카우터, 왜 사용해야하나요?",
      answer: "온라인 판매업에도 데이터에 기반한 시장조사와 의사결정 과정이 필요합니다. 키워드 스카우터는 셀러 여러분의 판매 상품 발굴, 판매 전략 수립, 상품의 노출 순위 관리를 위한 다양한 데이터와 기능을 제공합니다. 무척 빠르고 간편하게요!",
    },
    {
      id: "faq-2",
      question: "키워드 스카우터, 꼭 유료로 사용해야하나요?",
      answer: "키워드 스카우터는 기본적인 검색 기능과 트렌드 정보는 무료로 제공하고 있습니다. 하지만 더 깊이 있는 데이터 분석, 경쟁 분석, 실시간 랭킹 추적 등의 고급 기능은 유료 서비스로 제공됩니다. 비즈니스 규모와 필요에 맞는 적절한 요금제를 선택하실 수 있습니다.",
    },
    {
      id: "faq-3",
      question: "유료서비스를 미리 체험해 볼 수 있을까요?",
      answer: "네, 물론입니다! 키워드 스카우터는 유료 서비스 가입 전 7일간의 무료 체험 기간을 제공합니다. 이 기간 동안 모든 프리미엄 기능을 제한 없이 사용해보실 수 있습니다. 무료 체험 후에도 부담 없이 서비스를 계속할지 결정하실 수 있습니다.",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
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
          className="lucide lucide-book-open inline-block mr-2 text-primary"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        자주 묻는 질문
      </h2>
      <div className="space-y-4">
        <Accordion type="single" collapsible>
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-4 text-left font-medium hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="p-4 bg-gray-50 border-t border-gray-200 text-gray-500">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQSection;
