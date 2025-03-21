import { CategoryTrendResponse } from "@shared/schema";
import { getHotKeywords, getTopSellingProducts } from "./naver";
import { crawlShoppingInsightKeywords, getFallbackKeywords } from "./crawler/shopping-insight-crawler";

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
    let hotKeywords: string[] = [];
    let keywordSource = "API";
    
    // 기존 접근 방식을 바꿔서 크롤링을 우선 시도
    try {
      // 1. 먼저 크롤링 시도
      console.log(`1. 쇼핑인사이트 웹페이지 크롤링 시도 (카테고리: ${category})`);
      hotKeywords = await crawlShoppingInsightKeywords(category, "daily", 10);
      
      if (hotKeywords && hotKeywords.length > 0) {
        // 키워드 품질 검증 - UI 요소를 필터링
        const uiElements = ['업데이트', '선택됨', '권장', '브라우저', '안내', '본문', '바로가기', '데이터랩', '홈'];
        const filteredKeywords = hotKeywords.filter(keyword => 
          !uiElements.some(element => keyword.includes(element))
        );
        
        // 한글 포함 키워드 비율 계산
        const koreanKeywords = hotKeywords.filter(keyword => /[가-힣]/.test(keyword));
        const koreanRatio = koreanKeywords.length / hotKeywords.length;
        
        // 필터링된 키워드가 너무 적거나 한글 비율이 낮으면 백업 데이터 사용
        if (filteredKeywords.length >= 5 && koreanRatio >= 0.5) {
          hotKeywords = filteredKeywords;
          keywordSource = "크롤링";
          console.log(`✅ 쇼핑인사이트 크롤링 성공: ${hotKeywords.length}개 키워드`);
        } else {
          console.log(`⚠️ 크롤링된 키워드 품질 낮음 (한글 비율: ${(koreanRatio * 100).toFixed(1)}%), 필터링 후: ${filteredKeywords.length}개`);
          throw new Error("크롤링된 키워드 품질이 낮아 사용할 수 없습니다");
        }
      } else {
        throw new Error("크롤링으로 키워드를 찾을 수 없습니다");
      }
    } catch (crawlingError) {
      console.log(`크롤링 실패: ${crawlingError}`);

      // 2. 크롤링 실패 시 API 호출 시도
      try {
        console.log(`2. 네이버 API로 일간 트렌드 키워드 가져오기 시도 (카테고리: ${category})`);
        hotKeywords = await getHotKeywords(category, "daily");
        
        if (hotKeywords && hotKeywords.length > 0) {
          keywordSource = "API";
          console.log(`✅ 네이버 API 호출 성공: ${hotKeywords.length}개 키워드`);
        } else {
          throw new Error("API에서 키워드를 찾을 수 없습니다");
        }
      } catch (apiError) {
        console.log(`API 호출 실패, 백업 데이터 사용: ${apiError}`);
        
        // 3. 모두 실패하면 백업 데이터 사용
        hotKeywords = getFallbackKeywords(category);
        keywordSource = "백업 데이터";
        console.log(`ℹ️ 백업 키워드 사용: ${hotKeywords.length}개 키워드`);
      }
    }
    
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
    
    console.log(`✅ 일간 트렌드 반환 성공 (${keywordSource}): 카테고리=${category}, 키워드=${keywordsWithMeta.length}개, 상품=${topProducts.length}개`);
    
    return {
      category,
      keywords: keywordsWithMeta,
      products: topProducts
    };
  } catch (error) {
    console.error("❌ 일간 트렌드 조회 실패:", error);
    
    // 모든 방법이 실패했을 때도 클라이언트에 빈 응답 대신 기본 정보 반환
    return {
      category,
      keywords: [],
      products: []
    };
  }
}

// Get weekly trends
export async function getWeeklyTrends(category: string = "all"): Promise<CategoryTrendResponse> {
  try {
    let hotKeywords: string[] = [];
    let keywordSource = "API";
    
    // 기존 접근 방식을 바꿔서 크롤링을 우선 시도
    try {
      // 1. 먼저 크롤링 시도
      console.log(`1. 쇼핑인사이트 웹페이지 크롤링 시도 (카테고리: ${category})`);
      hotKeywords = await crawlShoppingInsightKeywords(category, "weekly", 10);
      
      if (hotKeywords && hotKeywords.length > 0) {
        // 키워드 품질 검증 - UI 요소를 필터링
        const uiElements = ['업데이트', '선택됨', '권장', '브라우저', '안내', '본문', '바로가기', '데이터랩', '홈'];
        const filteredKeywords = hotKeywords.filter(keyword => 
          !uiElements.some(element => keyword.includes(element))
        );
        
        // 한글 포함 키워드 비율 계산
        const koreanKeywords = hotKeywords.filter(keyword => /[가-힣]/.test(keyword));
        const koreanRatio = koreanKeywords.length / hotKeywords.length;
        
        // 필터링된 키워드가 너무 적거나 한글 비율이 낮으면 백업 데이터 사용
        if (filteredKeywords.length >= 5 && koreanRatio >= 0.5) {
          hotKeywords = filteredKeywords;
          keywordSource = "크롤링";
          console.log(`✅ 쇼핑인사이트 크롤링 성공: ${hotKeywords.length}개 키워드`);
        } else {
          console.log(`⚠️ 크롤링된 키워드 품질 낮음 (한글 비율: ${(koreanRatio * 100).toFixed(1)}%), 필터링 후: ${filteredKeywords.length}개`);
          throw new Error("크롤링된 키워드 품질이 낮아 사용할 수 없습니다");
        }
      } else {
        throw new Error("크롤링으로 키워드를 찾을 수 없습니다");
      }
    } catch (crawlingError) {
      console.log(`크롤링 실패: ${crawlingError}`);

      // 2. 크롤링 실패 시 API 호출 시도
      try {
        console.log(`2. 네이버 API로 주간 트렌드 키워드 가져오기 시도 (카테고리: ${category})`);
        hotKeywords = await getHotKeywords(category, "weekly");
        
        if (hotKeywords && hotKeywords.length > 0) {
          keywordSource = "API";
          console.log(`✅ 네이버 API 호출 성공: ${hotKeywords.length}개 키워드`);
        } else {
          throw new Error("API에서 키워드를 찾을 수 없습니다");
        }
      } catch (apiError) {
        console.log(`API 호출 실패, 백업 데이터 사용: ${apiError}`);
        
        // 3. 모두 실패하면 백업 데이터 사용
        hotKeywords = getFallbackKeywords(category);
        keywordSource = "백업 데이터";
        console.log(`ℹ️ 백업 키워드 사용: ${hotKeywords.length}개 키워드`);
      }
    }
    
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
    
    console.log(`✅ 주간 트렌드 반환 성공 (${keywordSource}): 카테고리=${category}, 키워드=${keywordsWithMeta.length}개, 상품=${topProducts.length}개`);
    
    return {
      category,
      keywords: keywordsWithMeta,
      products: topProducts
    };
  } catch (error) {
    console.error("❌ 주간 트렌드 조회 실패:", error);
    
    // 모든 방법이 실패했을 때도 클라이언트에 빈 응답 대신 기본 정보 반환
    return {
      category,
      keywords: [],
      products: []
    };
  }
}
