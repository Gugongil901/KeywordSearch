import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const HelpSection: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
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
              className="lucide lucide-school inline-block mr-2 text-primary"
            >
              <path d="m4 6 8-4 8 4" />
              <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" />
              <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
              <path d="M4 10v12" />
              <path d="M20 10v12" />
              <path d="m12 12 8-4-8-4-8 4Z" />
            </svg>
            키워드 스카우터 사용에 어려움이 있으시다면
          </h2>
          <p className="text-gray-500 mb-6">
            각 메뉴와 기능, 용어들 모두 낯설어서 어떻게 사용해야할지 아직 잘 모르시겠다구요?
            <br />
            지금 가이드센터에서 사용 방법과 활용 꿀팁까지 차근차근 확인해보세요.
          </p>
          <Link href="/guides">
            <Button className="bg-primary text-white px-6 py-3 rounded-md font-medium inline-block hover:bg-primary/90">
              가이드센터 바로가기
            </Button>
          </Link>
        </div>
        <div className="md:w-1/2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">추천 가이드 컨텐츠</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/guide/keyword" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
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
                className="lucide lucide-quote text-primary text-xl mr-3"
              >
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900">키워드에 대한 모든 것</h4>
                <span className="text-xs text-primary">보기</span>
              </div>
            </Link>
            <Link href="/guide/products" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
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
                className="lucide lucide-lightbulb text-primary text-xl mr-3"
              >
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900">무엇을 팔면 좋을까?</h4>
                <span className="text-xs text-primary">보기</span>
              </div>
            </Link>
            <Link href="/guide/tracking" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
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
                className="lucide lucide-line-chart text-primary text-xl mr-3"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900">랭킹 추적 활용팁</h4>
                <span className="text-xs text-primary">보기</span>
              </div>
            </Link>
            <Link href="/guide/ranking" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
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
                className="lucide lucide-trending-up text-primary text-xl mr-3"
              >
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900">노출 순위 올리기 전략</h4>
                <span className="text-xs text-primary">보기</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
