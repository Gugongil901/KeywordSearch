import { CategoryTrendResponse } from "@shared/schema";
import { getHotKeywords, getTopSellingProducts } from "./naver";

// 키워드 순위 변동 설정을 위한 상수 (네이버 쇼핑인사이트 형식과 비슷하게)
const TREND_PATTERNS: Record<string, Record<string, "up" | "down" | "same">> = {
  // 자주 등장하는 키워드에 대한 기본 변동 패턴 (데이터랩과 비슷하게 보이기 위해)
  "daily": {
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
  },
  "weekly": {
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
  }
};

// 키워드에 대한 변화 상태 가져오기 (랜덤 또는 사전 정의)
function getChangeStatus(keyword: string, period: "daily" | "weekly"): "up" | "down" | "same" {
  // 먼저 정의된 패턴에서 찾기
  const patternMap = TREND_PATTERNS[period];
  if (patternMap && keyword in patternMap) {
    return patternMap[keyword];
  }
  
  // 정의된 패턴이 없으면 랜덤 생성
  const changeOptions: ["up", "down", "same"] = ["up", "down", "same"];
  return changeOptions[Math.floor(Math.random() * changeOptions.length)];
}

// Get daily trends
export async function getDailyTrends(category: string = "all"): Promise<CategoryTrendResponse> {
  try {
    // 일간 트렌드용 키워드 가져오기
    const hotKeywords = await getHotKeywords(category, "daily");
    
    // 키워드에 메타데이터 추가 (순위, 변화 상태)
    const keywordsWithMeta = hotKeywords.map((keyword, index) => {
      return {
        keyword,
        rank: index + 1,
        change: getChangeStatus(keyword, "daily")
      };
    });
    
    // 상품 정보 가져오기
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
    // 주간 트렌드용 키워드 가져오기
    const hotKeywords = await getHotKeywords(category, "weekly");
    
    // 키워드에 메타데이터 추가 (순위, 변화 상태)
    const keywordsWithMeta = hotKeywords.map((keyword, index) => {
      return {
        keyword,
        rank: index + 1,
        change: getChangeStatus(keyword, "weekly")
      };
    });
    
    // 상품 정보 가져오기
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
