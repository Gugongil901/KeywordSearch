import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { DEFAULT_PRODUCT_IMAGES } from "@/constants/images";
import { ProductImage } from "@/components/ui/product-image";

interface TrackedProduct {
  id: string;
  image: string;
  name: string;
  brand: string;
  price: number;
  reviewCount: number;
  rankChange: number;
}

const ProductRanking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("daily");

  const trackedProducts: TrackedProduct[] = [
    {
      id: "1",
      image:
        "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80",
      name: "RISATORP 리사토르프 수납바스켓",
      brand: "IKEA",
      price: 9900,
      reviewCount: 2,
      rankChange: 2, // positive = up, negative = down, 0 = no change
    },
    {
      id: "2",
      image:
        "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80",
      name: "TÄRNABY 테르나뷔 탁상 스탠드",
      brand: "IKEA",
      price: 29900,
      reviewCount: 85,
      rankChange: -5,
    },
    {
      id: "3",
      image:
        "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80",
      name: "NIKKEBY 니케뷔 4칸서랍장",
      brand: "IKEA",
      price: 99900,
      reviewCount: 3,
      rankChange: 0,
    },
    {
      id: "4",
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&h=100&q=80",
      name: "HÖGSTEN 획스텐 야외용 암체어",
      brand: "IKEA",
      price: 129000,
      reviewCount: 3,
      rankChange: 7,
    },
  ];

  const getRankChangeClass = (change: number) => {
    if (change > 0) return "bg-green-100 text-green-600";
    if (change < 0) return "bg-red-100 text-red-500";
    return "bg-gray-200 text-gray-900";
  };

  const getRankChangeText = (change: number) => {
    if (change > 0) return `상승 +${change}`;
    if (change < 0) return `하락 ${change}`;
    return "유지 0";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-glasses inline-block mr-2 text-primary"
          >
            <circle cx="6" cy="15" r="4" />
            <circle cx="18" cy="15" r="4" />
            <path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
            <path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2" />
            <path d="M21.5 13 19 7c-.7-1.3-1.4-2-3-2" />
          </svg>
          내 상품은 네이버에서 몇 위에 노출 중일까요?
        </h2>
        <p className="text-gray-500 max-w-3xl mx-auto">
          상품이 어떤 키워드에서 몇위에 노출되고 있는지 키워드 스카우터가 다 관리할게요.
          <br />
          경쟁력있는 상품이 되도록 리뷰와 가격 변화까지 꼼꼼히 보세요.
        </p>
        <div className="mt-6 flex justify-center space-x-4">
          <Link href="/tracking">
            <Button className="bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary/90">
              랭킹 추적 바로가기
            </Button>
          </Link>
          <Link href="/guide/tracking">
            <Button variant="outline" className="bg-white border border-primary text-primary px-6 py-3 rounded-md font-medium hover:bg-gray-50">
              자세히 알아보기
            </Button>
          </Link>
        </div>
      </div>

      {/* Ranking Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("daily")}
              className={`inline-block py-2 px-4 font-medium text-sm ${
                activeTab === "daily"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              상품 일간 추적
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("realtime")}
              className={`inline-block py-2 px-4 font-medium text-sm ${
                activeTab === "realtime"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              실시간 랭킹 추적
            </button>
          </li>
        </ul>
      </div>

      {/* Product Tracking Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              ></th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                상품명
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                가격
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                리뷰수
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                노출 순위
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trackedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <ProductImage
                    src={product.image}
                    title={product.name}
                    productId={product.id}
                    width={48}
                    height={48}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {product.name}
                  </div>
                  <div className="text-xs text-gray-500">{product.brand}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.price.toLocaleString()}원
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.reviewCount}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getRankChangeClass(
                      product.rankChange
                    )}`}
                  >
                    {getRankChangeText(product.rankChange)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductRanking;
