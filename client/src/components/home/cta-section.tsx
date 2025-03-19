import React from "react";
import { Button } from "@/components/ui/button";

const CTASection: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-primary to-blue-600 rounded-lg shadow-lg p-8 text-center text-white">
      <h2 className="text-2xl font-bold mb-4">
        키워드 스카우터는 더 나은 온라인커머스 시작을 위해
      </h2>
      <p className="max-w-2xl mx-auto mb-8">
        어떤 정보가 효과적이며, 필요할까 고민하며 만들어가고 있습니다.
        <br />
        혹시 제안하고 싶은 내용이 있나요?
      </p>
      <Button
        className="bg-white text-primary px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition"
        variant="outline"
      >
        제안하기
      </Button>
    </div>
  );
};

export default CTASection;
