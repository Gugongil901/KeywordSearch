import { CategoryTrendResponse } from "@shared/schema";
import { getHotKeywords, getTopSellingProducts } from "./naver";

// Get daily trends
export async function getDailyTrends(category: string = "all"): Promise<CategoryTrendResponse> {
  try {
    // Get hot keywords
    const hotKeywords = await getHotKeywords(category);
    
    // Map keywords to include rank and change status
    const keywordsWithMeta = hotKeywords.map((keyword, index) => {
      // Generate random change status
      const changeOptions = ["up", "down", "same"] as const;
      const randomChange = changeOptions[Math.floor(Math.random() * changeOptions.length)];
      
      return {
        keyword,
        rank: index + 1,
        change: randomChange
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
    // For simplicity, we'll use slightly different data for weekly trends
    // In a real implementation, you would call different API endpoints or use different parameters
    
    // Get hot keywords for weekly trends - slight variation from daily
    const baseKeywords = await getHotKeywords(category);
    
    // Shuffle the array to create variation from daily trends
    const shuffledKeywords = [...baseKeywords].sort(() => 0.5 - Math.random());
    
    // Map keywords to include rank and change status
    const keywordsWithMeta = shuffledKeywords.map((keyword, index) => {
      // Generate random change status with more "up" and "down" than "same"
      const changeOptions = ["up", "up", "down", "down", "same"] as const;
      const randomChange = changeOptions[Math.floor(Math.random() * changeOptions.length)];
      
      return {
        keyword,
        rank: index + 1,
        change: randomChange
      };
    });
    
    // Get top products - slightly different set than daily
    const topProducts = await getTopSellingProducts(category, 7);
    
    // Sort in a different order to create variation
    const shuffledProducts = [...topProducts].sort(() => 0.5 - Math.random());
    
    return {
      category,
      keywords: keywordsWithMeta,
      products: shuffledProducts
    };
  } catch (error) {
    console.error("Error getting weekly trends:", error);
    throw new Error("Failed to get weekly trends");
  }
}
