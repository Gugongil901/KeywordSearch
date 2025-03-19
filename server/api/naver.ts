import axios from "axios";
import { NaverKeywordResult, NaverProductResult, NaverTrendResult, KeywordSearchResponse } from "@shared/schema";

// Naver API Credentials
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || "ErTaCUGQWfhKvcEnftat";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "Xoq9VSewrv";
const NAVER_AD_API_CUSTOMER_ID = process.env.NAVER_AD_API_CUSTOMER_ID || "3405855";
const NAVER_AD_API_ACCESS_LICENSE = process.env.NAVER_AD_API_ACCESS_LICENSE || "01000000005a79e0d0ffff30be92041e87dd2444c689e1209efbe2f9ea58fd3a3ae67ee01e";
const NAVER_AD_API_SECRET_KEY = process.env.NAVER_AD_API_SECRET_KEY || "AQAAAABaeeDQ//8wvpIEHofdJETGcg3aHhG5YRGgFHPnSsNISw==";

// API endpoints
const NAVER_SEARCH_API = "https://openapi.naver.com/v1/search/shop.json";
const NAVER_TREND_API = "https://openapi.naver.com/v1/datalab/shopping/category/keywords";
const NAVER_AD_API_BASE = "https://api.naver.com";

// Setup axios instances
let naverSearchClient: any;
let naverAdClient: any;

export function setupNaverAPI() {
  // Initialize Naver Search API client
  naverSearchClient = axios.create({
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    },
  });

  // Initialize Naver Ad API client
  naverAdClient = axios.create({
    baseURL: NAVER_AD_API_BASE,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": NAVER_AD_API_ACCESS_LICENSE,
      "X-Customer": NAVER_AD_API_CUSTOMER_ID,
      "X-Signature": NAVER_AD_API_SECRET_KEY,
    },
  });
}

// Search keywords in Naver Shopping
export async function searchKeyword(keyword: string): Promise<KeywordSearchResponse> {
  try {
    // Get search results
    const searchResponse = await naverSearchClient.get(NAVER_SEARCH_API, {
      params: {
        query: keyword,
        display: 20,
        start: 1,
        sort: "sim",
      },
    });

    // Calculate stats from results
    const products = searchResponse.data.items.map((item: any, index: number) => ({
      productId: `naver-${item.productId || index}`,
      title: item.title.replace(/<[^>]*>?/gm, ''),
      price: parseInt(item.lprice, 10),
      image: item.image,
      category: item.category1,
      brandName: item.brand || item.maker || "Unknown",
      reviewCount: 0, // Not available in basic API
      rank: index + 1,
      productUrl: item.link,
    }));

    // Mock some trend data since we don't have real trend API access
    const mockTrends = generateMockTrendData(keyword);

    // Generate keyword stats
    const stats = calculateKeywordStats(products);

    // Get related keywords
    const relatedKeywords = await getRelatedKeywords(keyword);

    return {
      keyword,
      searchCount: Math.floor(Math.random() * 50000) + 5000, // Mock data
      pcSearchRatio: Math.floor(Math.random() * 40) + 20,
      mobileSearchRatio: Math.floor(Math.random() * 40) + 40,
      productCount: searchResponse.data.total,
      averagePrice: stats.averagePrice,
      totalSales: stats.totalSales,
      totalSalesCount: stats.totalSalesCount,
      competitionIndex: Math.floor(Math.random() * 10) / 10 + 1, // Mock data between 1.0-2.0
      realProductRatio: Math.floor(Math.random() * 30) + 50, // Mock data
      foreignProductRatio: Math.floor(Math.random() * 20) + 5, // Mock data
      products,
      relatedKeywords,
      trends: mockTrends,
    };
  } catch (error) {
    console.error("Error searching keyword:", error);
    throw new Error("Failed to search keyword");
  }
}

// Get keyword statistics
export async function getKeywordStats(keyword: string): Promise<NaverKeywordResult> {
  try {
    // We would normally call the Naver Ad API here for real data
    // For this demo, we'll generate some mock data
    return {
      keyword,
      searchCount: Math.floor(Math.random() * 50000) + 5000,
      pcSearchRatio: Math.floor(Math.random() * 40) + 20,
      mobileSearchRatio: Math.floor(Math.random() * 40) + 40,
      competitionIndex: Math.floor(Math.random() * 10) / 10 + 1,
      relatedKeywords: await getRelatedKeywords(keyword),
    };
  } catch (error) {
    console.error("Error getting keyword stats:", error);
    throw new Error("Failed to get keyword statistics");
  }
}

// Get keyword trends
export async function getKeywordTrends(keyword: string, period: string): Promise<NaverTrendResult> {
  try {
    // Generate mock trend data based on the period
    const trendData = generateMockTrendData(keyword, period);
    
    return {
      keyword,
      trends: trendData,
    };
  } catch (error) {
    console.error("Error getting keyword trends:", error);
    throw new Error("Failed to get keyword trends");
  }
}

// Get hot/trending keywords
export async function getHotKeywords(category: string = "all"): Promise<string[]> {
  try {
    // Mock data for hot keywords based on category
    const allHotKeywords = [
      "파로", "코스", "닭가슴살", "당근", "스투시", 
      "파로효소", "쭈꾸미", "나이키운동화", "호카", "꼬망세",
      "여름옷", "선크림", "가디건", "휴대폰케이스", "노트북"
    ];

    // Filter or modify based on category if needed
    return allHotKeywords.slice(0, 10);
  } catch (error) {
    console.error("Error getting hot keywords:", error);
    throw new Error("Failed to get hot keywords");
  }
}

// Get top selling products
export async function getTopSellingProducts(category: string = "all", limit: number = 10): Promise<NaverProductResult[]> {
  try {
    // Mock data for top selling products
    const topProducts: NaverProductResult[] = [
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
      },
      {
        productId: "product-7",
        title: "순금 돌반지 3.75g 1.875g 금수저 아기 돌 백일 반지 용띠",
        price: 458000,
        image: "https://shopping-phinf.pstatic.net/main_8527474/85274747835.22.jpg",
        category: "패션잡화",
        brandName: "순금장인",
        reviewCount: 675,
        rank: 7,
        productUrl: "https://shopping.naver.com/",
      }
    ];

    // Filter by category if needed
    let filteredProducts = topProducts;
    if (category !== "all") {
      filteredProducts = topProducts.filter(product => product.category === category);
    }

    return filteredProducts.slice(0, limit);
  } catch (error) {
    console.error("Error getting top selling products:", error);
    throw new Error("Failed to get top selling products");
  }
}

// Helper function to generate mock trend data
function generateMockTrendData(keyword: string, period: string = "daily"): Array<{date: string, count: number}> {
  const result = [];
  const now = new Date();
  const dataPoints = period === "daily" ? 7 : period === "weekly" ? 10 : 6;
  
  // Base value influenced by keyword length to make it somewhat deterministic
  const baseValue = keyword.length * 500 + 1000;
  
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date();
    
    if (period === "daily") {
      date.setDate(now.getDate() - (dataPoints - i - 1));
    } else if (period === "weekly") {
      date.setDate(now.getDate() - (dataPoints - i - 1) * 7);
    } else { // monthly
      date.setMonth(now.getMonth() - (dataPoints - i - 1));
    }
    
    // Generate a somewhat random but trending value
    const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 to 1.25
    const trendFactor = 1 + (i / dataPoints) * 0.5; // Increasing trend
    const count = Math.floor(baseValue * randomFactor * trendFactor);
    
    result.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }
  
  return result;
}

// Helper function to calculate various stats from product data
function calculateKeywordStats(products: NaverProductResult[]) {
  if (products.length === 0) {
    return {
      averagePrice: 0,
      totalSales: 0,
      totalSalesCount: 0
    };
  }

  const totalPrice = products.reduce((sum, product) => sum + product.price, 0);
  const averagePrice = Math.floor(totalPrice / products.length);
  
  // Estimate sales based on rank and price (just for mock data)
  let totalSales = 0;
  let totalSalesCount = 0;
  
  products.forEach(product => {
    // Inverse relationship with rank - higher ranks (lower numbers) sell more
    const estimatedSalesCount = Math.floor((1000 / (product.rank + 5)) * (Math.random() * 0.5 + 0.75));
    const estimatedSales = estimatedSalesCount * product.price;
    
    totalSalesCount += estimatedSalesCount;
    totalSales += estimatedSales;
  });
  
  // Convert to 10,000 KRW units (만원)
  totalSales = Math.floor(totalSales / 10000);
  
  return {
    averagePrice,
    totalSales,
    totalSalesCount
  };
}

// Helper function to get related keywords
async function getRelatedKeywords(keyword: string): Promise<string[]> {
  // This would normally call the Naver API, but we'll return mock data for now
  const commonKeywords = [
    "가격", "후기", "추천", "브랜드", "할인", "최저가", "인기", "사용법", "비교"
  ];
  
  // Generate related keywords by combining the input keyword with common suffixes
  const related = commonKeywords.map(suffix => `${keyword} ${suffix}`);
  
  // Add some general related terms
  if (keyword.includes("의류") || keyword.includes("옷")) {
    related.push("여름옷", "가을옷", "브랜드의류", "세일");
  } else if (keyword.includes("전자") || keyword.includes("폰") || keyword.includes("컴퓨터")) {
    related.push("노트북", "스마트폰", "태블릿", "애플", "삼성");
  } else if (keyword.includes("식품") || keyword.includes("음식")) {
    related.push("건강식품", "유기농", "다이어트", "식단");
  }
  
  // Shuffle and limit the array
  return related.sort(() => 0.5 - Math.random()).slice(0, 10);
}
