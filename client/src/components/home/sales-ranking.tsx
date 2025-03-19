import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface Product {
  productId: string;
  title: string;
  price: number;
  image: string;
  category: string;
  brandName: string;
  reviewCount: number;
  rank: number;
  productUrl: string;
}

const SalesRanking: React.FC = () => {
  const [category, setCategory] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/products/top?category=${category}&limit=6`],
  });

  const products: Product[] = data || [
    {
      productId: "product-1",
      title: "[게임패스 증정]Xbox 무선 컨트롤러 - 카본 블랙",
      price: 59000,
      image: "https://shopping-phinf.pstatic.net/main_8274781/82747810205.7.jpg",
      category: "디지털/가전",
      brandName: "Xbox공식스토어",
      reviewCount: 245,
      rank: 1,
      productUrl: "https://shopping.naver.com/",
    },
    {
      productId: "product-2",
      title: "일본이심 eSIM 후쿠오카 오사카 도쿄 5G로컬망 소프트뱅크1일 1GB e심 로밍전화",
      price: 8900,
      image: "https://shopping-phinf.pstatic.net/main_8473989/84739899624.8.jpg",
      category: "디지털/가전",
      brandName: "말톡",
      reviewCount: 1024,
      rank: 2,
      productUrl: "https://shopping.naver.com/",
    },
    {
      productId: "product-3",
      title: "노시부 프로 전동식 의료용 아기 콧물흡입기",
      price: 39800,
      image: "https://shopping-phinf.pstatic.net/main_8326625/83266257397.4.jpg",
      category: "출산/육아",
      brandName: "노시부코리아",
      reviewCount: 3827,
      rank: 3,
      productUrl: "https://shopping.naver.com/",
    },
    {
      productId: "product-4",
      title: "(본사 직영) 삼다수 무라벨 2L 12입 (유 무라벨 랜덤발송)",
      price: 13200,
      image: "https://shopping-phinf.pstatic.net/main_8289288/82892881441.10.jpg",
      category: "식품",
      brandName: "광동제약 직영스토어",
      reviewCount: 8492,
      rank: 4,
      productUrl: "https://shopping.naver.com/",
    },
    {
      productId: "product-5",
      title: "사과 경북 부사 못난이 꿀사과 5kg 10kg",
      price: 29900,
      image: "https://shopping-phinf.pstatic.net/main_8335589/83355896133.11.jpg",
      category: "식품",
      brandName: "청송홈골농원",
      reviewCount: 1543,
      rank: 5,
      productUrl: "https://shopping.naver.com/",
    },
    {
      productId: "product-6",
      title: "[도착보장] 노시부 프로 전동식 의료용 아기 콧물흡입기",
      price: 39800,
      image: "https://shopping-phinf.pstatic.net/main_8833526/88335267915.5.jpg",
      category: "출산/육아",
      brandName: "노시부코리아",
      reviewCount: 2102,
      rank: 6,
      productUrl: "https://shopping.naver.com/",
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-bar-chart-2 inline-block mr-2 text-primary"
          >
            <line x1="18" x2="18" y1="20" y2="10" />
            <line x1="12" x2="12" y1="20" y2="4" />
            <line x1="6" x2="6" y1="20" y2="14" />
          </svg>
          판매량 Best
        </h2>
        <span className="text-xs text-gray-500">네이버쇼핑에서 판매량이 높았던 상품들입니다.</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 py-8 text-center text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="col-span-3 py-8 text-center text-red-500">
            데이터를 불러오는데 실패했습니다.
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.productId}
              className="bg-gray-50 rounded p-2 flex flex-col"
            >
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-32 object-cover rounded"
                />
                <span className="absolute top-0 left-0 bg-primary text-white text-xs px-2 py-1 rounded-br">
                  판매량 {product.rank}위
                </span>
              </div>
              <div className="mt-2">
                <span className="text-xs text-gray-500 block">{product.brandName}</span>
                <h3 className="text-sm font-medium line-clamp-2">{product.title}</h3>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SalesRanking;
