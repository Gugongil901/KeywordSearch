import { apiRequest } from "./queryClient";

// Naver API client - Frontend interface
export interface KeywordStats {
  keyword: string;
  searchCount: number;
  pcSearchRatio: number;
  mobileSearchRatio: number;
  competitionIndex: number;
  relatedKeywords: string[];
}

export interface Product {
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

export interface KeywordTrend {
  date: string;
  count: number;
}

export interface KeywordSearchResult {
  keyword: string;
  searchCount: number;
  pcSearchRatio: number;
  mobileSearchRatio: number;
  productCount: number;
  averagePrice: number;
  totalSales: number;
  totalSalesCount: number;
  competitionIndex: number;
  realProductRatio: number;
  foreignProductRatio: number;
  products: Product[];
  relatedKeywords: string[];
  trends: KeywordTrend[];
}

export interface CategoryTrend {
  category: string;
  keywords: Array<{
    keyword: string;
    rank: number;
    change: 'up' | 'down' | 'same';
  }>;
  products: Product[];
}

// API functions
export async function searchKeyword(keyword: string): Promise<KeywordSearchResult> {
  const response = await apiRequest("GET", `/api/search?query=${encodeURIComponent(keyword)}`, undefined);
  return await response.json();
}

export async function getKeywordStats(keyword: string): Promise<KeywordStats> {
  const response = await apiRequest("GET", `/api/keyword/stats?keyword=${encodeURIComponent(keyword)}`, undefined);
  return await response.json();
}

export async function getKeywordTrends(keyword: string, period: string = "daily"): Promise<{ keyword: string; trends: KeywordTrend[] }> {
  const response = await apiRequest(
    "GET", 
    `/api/keyword/trends?keyword=${encodeURIComponent(keyword)}&period=${period}`,
    undefined
  );
  return await response.json();
}

export async function getDailyTrends(category: string = "all"): Promise<CategoryTrend> {
  const response = await apiRequest("GET", `/api/trends/daily?category=${category}`, undefined);
  return await response.json();
}

export async function getWeeklyTrends(category: string = "all"): Promise<CategoryTrend> {
  const response = await apiRequest("GET", `/api/trends/weekly?category=${category}`, undefined);
  return await response.json();
}

export async function getTopProducts(category: string = "all", limit: number = 10): Promise<Product[]> {
  const response = await apiRequest("GET", `/api/products/top?category=${category}&limit=${limit}`, undefined);
  return await response.json();
}
