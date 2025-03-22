/**
 * 경쟁사 제품 목록 렌더링 컴포넌트
 * 가격 변경, 순위 변경, 리뷰 변경, 신제품 목록을 렌더링하는 컴포넌트
 */
import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SortSelect } from "@/components/ui/sort-select";
import { ArrowUpDown } from "lucide-react";
import { PriceChangeCard } from "@/components/price-change-card";
import { RankChangeCard } from "@/components/rank-change-card";
import { ReviewChangeCard } from "@/components/review-change-card";
import { NewProductCard } from "@/components/new-product-card";

// 인터페이스 타입
interface CompetitorProduct {
  productId: string;
  name: string;
  price: number;
  reviews: number;
  rank: number;
  image?: string;
  url?: string;
  collectedAt?: string;
}

interface PriceChange {
  product: CompetitorProduct;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
}

interface RankChange {
  product: CompetitorProduct;
  oldRank: number;
  newRank: number;
  change: number;
}

interface ReviewChange {
  product: CompetitorProduct;
  oldReviews: number;
  newReviews: number;
  changePercent: number;
}

interface NewProductAlert {
  product: CompetitorProduct;
  type: 'new_product';
}

// 가격 변경 목록 컴포넌트
export function PriceChangeList({ changes, competitor }: { changes: PriceChange[], competitor: string }) {
  const [sortBy, setSortBy] = useState<string>("percent-desc");
  
  // 변경사항이 없을 때 메시지 표시
  if (changes.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-medium mb-2">가격 변경</h4>
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-md">
          가격 변경사항이 없습니다.
        </div>
        <Separator className="my-4" />
      </div>
    );
  }
  
  const sortedChanges = [...changes].sort((a, b) => {
    switch (sortBy) {
      case "percent-desc":
        return b.changePercent - a.changePercent;
      case "percent-asc":
        return a.changePercent - b.changePercent;
      case "price-desc":
        return b.newPrice - a.newPrice;
      case "price-asc":
        return a.newPrice - b.newPrice;
      case "name-asc":
        return a.product.name.localeCompare(b.product.name);
      case "name-desc":
        return b.product.name.localeCompare(a.product.name);
      default:
        return b.changePercent - a.changePercent;
    }
  });
  
  const sortOptions = [
    { value: "percent-desc", label: "변화율 ↓" },
    { value: "percent-asc", label: "변화율 ↑" },
    { value: "price-desc", label: "가격 ↓" },
    { value: "price-asc", label: "가격 ↑" },
    { value: "name-asc", label: "이름 ↑" },
    { value: "name-desc", label: "이름 ↓" }
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">가격 변경 ({changes.length}개)</h4>
        <div className="flex items-center">
          <ArrowUpDown className="h-4 w-4 mr-1 text-gray-500" />
          <SortSelect
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            placeholder="정렬"
            className="h-7 ml-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedChanges.map((change, index) => (
          <PriceChangeCard 
            key={`${change.product.productId}-price-${index}`} 
            change={change} 
            brandName={competitor}
            brandId={competitor.toLowerCase().replace(/\s+/g, '')}
          />
        ))}
      </div>
      <Separator className="my-4" />
    </div>
  );
}

// 순위 변경 목록 컴포넌트
export function RankChangeList({ changes, competitor }: { changes: RankChange[], competitor: string }) {
  const [sortBy, setSortBy] = useState<string>("change-desc");
  
  // 변경사항이 없을 때 메시지 표시
  if (changes.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-medium mb-2">순위 변경</h4>
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-md">
          순위 변경사항이 없습니다.
        </div>
        <Separator className="my-4" />
      </div>
    );
  }
  
  const sortedChanges = [...changes].sort((a, b) => {
    switch (sortBy) {
      case "change-desc":
        return b.change - a.change;
      case "change-asc":
        return a.change - b.change;
      case "rank-desc":
        return a.newRank - b.newRank; // 낮은 순위(1위)가 더 높게 표시
      case "rank-asc":
        return b.newRank - a.newRank; // 높은 순위(100위)가 더 높게 표시
      case "name-asc":
        return a.product.name.localeCompare(b.product.name);
      case "name-desc":
        return b.product.name.localeCompare(a.product.name);
      default:
        return b.change - a.change;
    }
  });
  
  const sortOptions = [
    { value: "change-desc", label: "순위 변화 ↓" },
    { value: "change-asc", label: "순위 변화 ↑" },
    { value: "rank-desc", label: "현재 순위 ↑" },
    { value: "rank-asc", label: "현재 순위 ↓" },
    { value: "name-asc", label: "이름 ↑" },
    { value: "name-desc", label: "이름 ↓" }
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">순위 변경 ({changes.length}개)</h4>
        <div className="flex items-center">
          <ArrowUpDown className="h-4 w-4 mr-1 text-gray-500" />
          <SortSelect
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            placeholder="정렬"
            className="h-7 ml-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedChanges.map((change, index) => (
          <RankChangeCard 
            key={`${change.product.productId}-rank-${index}`} 
            change={change} 
            brandName={competitor}
            brandId={competitor.toLowerCase().replace(/\s+/g, '')}
          />
        ))}
      </div>
      <Separator className="my-4" />
    </div>
  );
}

// 리뷰 변경 목록 컴포넌트
export function ReviewChangeList({ changes, competitor }: { changes: ReviewChange[], competitor: string }) {
  const [sortBy, setSortBy] = useState<string>("percent-desc");
  
  // 변경사항이 없을 때 메시지 표시
  if (changes.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-medium mb-2">리뷰 변경</h4>
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-md">
          리뷰 변경사항이 없습니다.
        </div>
        <Separator className="my-4" />
      </div>
    );
  }
  
  const sortedChanges = [...changes].sort((a, b) => {
    switch (sortBy) {
      case "percent-desc":
        return b.changePercent - a.changePercent;
      case "percent-asc":
        return a.changePercent - b.changePercent;
      case "reviews-desc":
        return b.newReviews - a.newReviews;
      case "reviews-asc":
        return a.newReviews - b.newReviews;
      case "name-asc":
        return a.product.name.localeCompare(b.product.name);
      case "name-desc":
        return b.product.name.localeCompare(a.product.name);
      default:
        return b.changePercent - a.changePercent;
    }
  });
  
  const sortOptions = [
    { value: "percent-desc", label: "변화율 ↓" },
    { value: "percent-asc", label: "변화율 ↑" },
    { value: "reviews-desc", label: "리뷰 수 ↓" },
    { value: "reviews-asc", label: "리뷰 수 ↑" },
    { value: "name-asc", label: "이름 ↑" },
    { value: "name-desc", label: "이름 ↓" }
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">리뷰 변경 ({changes.length}개)</h4>
        <div className="flex items-center">
          <ArrowUpDown className="h-4 w-4 mr-1 text-gray-500" />
          <SortSelect
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            placeholder="정렬"
            className="h-7 ml-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedChanges.map((change, index) => (
          <ReviewChangeCard 
            key={`${change.product.productId}-review-${index}`} 
            change={change} 
            brandName={competitor}
            brandId={competitor.toLowerCase().replace(/\s+/g, '')}
          />
        ))}
      </div>
      <Separator className="my-4" />
    </div>
  );
}

// 신제품 목록 컴포넌트
export function NewProductList({ changes, competitor }: { changes: NewProductAlert[], competitor: string }) {
  const [sortBy, setSortBy] = useState<string>("price-desc");
  
  // 변경사항이 없을 때 메시지 표시
  if (changes.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-medium mb-2">신제품</h4>
        <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-md">
          신규 출시 제품이 없습니다.
        </div>
        <Separator className="my-4" />
      </div>
    );
  }
  
  const sortedChanges = [...changes].sort((a, b) => {
    switch (sortBy) {
      case "price-desc":
        return b.product.price - a.product.price;
      case "price-asc":
        return a.product.price - b.product.price;
      case "rank-desc":
        return a.product.rank - b.product.rank; // 낮은 순위(1위)가 더 높게 표시
      case "rank-asc":
        return b.product.rank - a.product.rank; // 높은 순위(100위)가 더 높게 표시
      case "name-asc":
        return a.product.name.localeCompare(b.product.name);
      case "name-desc":
        return b.product.name.localeCompare(a.product.name);
      case "reviews-desc":
        return b.product.reviews - a.product.reviews;
      case "reviews-asc":
        return a.product.reviews - b.product.reviews;
      default:
        return b.product.price - a.product.price;
    }
  });
  
  const sortOptions = [
    { value: "price-desc", label: "가격 ↓" },
    { value: "price-asc", label: "가격 ↑" },
    { value: "rank-desc", label: "순위 ↑" },
    { value: "rank-asc", label: "순위 ↓" },
    { value: "reviews-desc", label: "리뷰 ↓" },
    { value: "reviews-asc", label: "리뷰 ↑" },
    { value: "name-asc", label: "이름 ↑" },
    { value: "name-desc", label: "이름 ↓" }
  ];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">신제품 ({changes.length}개)</h4>
        <div className="flex items-center">
          <ArrowUpDown className="h-4 w-4 mr-1 text-gray-500" />
          <SortSelect
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            placeholder="정렬"
            className="h-7 ml-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedChanges.map((alert, index) => (
          <NewProductCard 
            key={`${alert.product.productId}-new-${index}`} 
            item={alert} 
            brandName={competitor}
            brandId={competitor.toLowerCase().replace(/\s+/g, '')}
          />
        ))}
      </div>
      <Separator className="my-4" />
    </div>
  );
}