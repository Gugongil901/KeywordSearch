import { CategoryTrendResponse } from "@shared/schema";
import { getHotKeywords, getTopSellingProducts } from "./naver";

// 키워드 순위 변동 설정을 위한 상수 (네이버 쇼핑인사이트 형식과 비슷하게)
const DAILY_TREND_PATTERN = {
  "제킷": "same",
  "티셔츠": "up",
  "원피스": "up",
  "패딩": "down", 
  "바지": "up",
  "블라우스": "up",
  "청바지": "down",
  "니트": "same",
  "신발": "up",
  "맨투맨": "up",
  
  // 카테고리별 키워드에 대한 기본 변동 패턴
  "크로스백": "up",
  "스니커즈": "up",
  "선크림": "up",
  "에어팟": "down",
  "맥북": "same",
  "책상": "up",
  "젖병": "down",
  "닭가슴살": "up",
  "런닝화": "same",
  "마스크": "down",
};

const WEEKLY_TREND_PATTERN = {
  "제킷": "up",
  "티셔츠": "down",
  "원피스": "same",
  "패딩": "up", 
  "바지": "up",
  "블라우스": "down",
  "청바지": "up",
  "니트": "down",
  "신발": "same",
  "맨투맨": "up",
  
  // 카테고리별 키워드에 대한 기본 변동 패턴
  "크로스백": "down",
  "스니커즈": "same",
  "선크림": "up",
  "에어팟": "up",
  "맥북": "up",
  "책상": "down",
  "젖병": "up",
  "닭가슴살": "same",
  "런닝화": "up",
  "마스크": "up",
};

// Get daily trends
export async function getDailyTrends(category: string = "all"): Promise<CategoryTrendResponse> {
  try {
    // Get hot keywords
    const hotKeywords = await getHotKeywords(category);
    
    // Map keywords to include rank and change status (네이버 쇼핑인사이트와 비슷한 패턴으로)
    const keywordsWithMeta = hotKeywords.map((keyword, index) => {
      // 특정 키워드에 대해 미리 정의된 변화 패턴 사용 (없으면 랜덤)
      let change = DAILY_TREND_PATTERN[keyword];
      
      if (!change) {
        const changeOptions = ["up", "down", "same"] as const;
        change = changeOptions[Math.floor(Math.random() * changeOptions.length)];
      }
      
      return {
        keyword,
        rank: index + 1,
        change
      };
    });
    
    // Get top products
    const topProducts = await getTopSellingProducts(category, 7);
    
    return {
      category,
      keywords: keywordsWithMeta,
      products: topProducts
    };
  } catch (error) {
    console.error("Error getting daily trends:", error);
    throw new Error("Failed to get daily trends");
  }
}

// Get weekly trends
export async function getWeeklyTrends(category: string = "all"): Promise<CategoryTrendResponse> {
  try {
    // Get hot keywords for weekly trends - slight variation from daily
    const hotKeywords = await getHotKeywords(category);
    
    // Map keywords to include rank and change status
    const keywordsWithMeta = hotKeywords.map((keyword, index) => {
      // 특정 키워드에 대해 미리 정의된 변화 패턴 사용 (없으면 랜덤)
      let change = WEEKLY_TREND_PATTERN[keyword];
      
      if (!change) {
        const changeOptions = ["up", "down", "same"] as const;
        change = changeOptions[Math.floor(Math.random() * changeOptions.length)];
      }
      
      return {
        keyword,
        rank: index + 1,
        change 
      };
    });
    
    // Get top products
    const topProducts = await getTopSellingProducts(category, 7);
    
    return {
      category,
      keywords: keywordsWithMeta,
      products: topProducts
    };
  } catch (error) {
    console.error("Error getting weekly trends:", error);
    throw new Error("Failed to get weekly trends");
  }
}
