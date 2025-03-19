import axios from "axios";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || "ErTaCUGQWfhKvcEnftat";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || "Xoq9VSewrv";

// Shopping Insight API
export async function searchShoppingInsight(keyword: string) {
  try {
    const url = "https://openapi.naver.com/v1/datalab/shopping/categories";
    
    const response = await axios.post(
      url,
      {
        startDate: getFormattedDate(90), // 90 days ago
        endDate: getFormattedDate(0),   // today
        timeUnit: "week",
        category: [
          { name: "패션의류", param: ["50000000"] },
          { name: "패션잡화", param: ["50000001"] },
          { name: "화장품/미용", param: ["50000002"] }
        ],
        keyword: keyword
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Naver-Client-Id": NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error in searchShoppingInsight:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("API response error:", error.response.data);
    }
    throw new Error("Failed to fetch shopping insight");
  }
}

// Search Trend API
export async function searchTrend(
  keyword: string, 
  startDate?: string, 
  endDate?: string
) {
  try {
    const url = "https://openapi.naver.com/v1/datalab/search";
    
    const requestBody = {
      startDate: startDate || getFormattedDate(90), // 90 days ago
      endDate: endDate || getFormattedDate(0),     // today
      timeUnit: "week",
      keywordGroups: [
        {
          groupName: keyword,
          keywords: [keyword]
        }
      ]
    };
    
    const response = await axios.post(
      url,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Naver-Client-Id": NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error in searchTrend:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("API response error:", error.response.data);
    }
    throw new Error("Failed to fetch search trend");
  }
}

// Helper function to get formatted date string (YYYY-MM-DD)
function getFormattedDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}
