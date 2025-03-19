import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupNaverAPI, getKeywordStats, searchKeyword, getKeywordTrends, getHotKeywords, getTopSellingProducts, testCategoryAPI } from "./api/naver";
import { searchShoppingInsight, searchTrend } from "./api/search";
import { getDailyTrends, getWeeklyTrends } from "./api/trend";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Naver API
  setupNaverAPI();

  // API routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Keyword search and analysis
  app.get("/api/search", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Query parameter is required" });
      }

      const result = await searchKeyword(query);
      res.json(result);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Error searching keyword" });
    }
  });

  // Get keyword statistics
  app.get("/api/keyword/stats", async (req, res) => {
    try {
      const { keyword } = req.query;
      if (!keyword || typeof keyword !== "string") {
        return res.status(400).json({ message: "Keyword parameter is required" });
      }

      const result = await getKeywordStats(keyword);
      res.json(result);
    } catch (error) {
      console.error("Keyword stats error:", error);
      res.status(500).json({ message: "Error fetching keyword statistics" });
    }
  });

  // Get keyword trends (time series data)
  app.get("/api/keyword/trends", async (req, res) => {
    try {
      const { keyword, period } = req.query;
      if (!keyword || typeof keyword !== "string") {
        return res.status(400).json({ message: "Keyword parameter is required" });
      }

      // URL 인코딩 처리
      let processedKeyword;
      
      try {
        // URL에서 받은 키워드는 이미 인코딩되어 있으므로 디코딩
        processedKeyword = decodeURIComponent(keyword);
        
        // 'ëì´í¤'와 같은 깨진 한글 문자열 탐지
        const isEncodingCorrupted = /ë|ì|í|¤/.test(processedKeyword);
        
        if (isEncodingCorrupted) {
          console.log(`⚠️ 인코딩이 손상된 키워드 감지: "${processedKeyword}"`);
          
          // 나이키 키워드인 경우 직접 수정 (테스트 용도)
          if (processedKeyword === 'ëì´í¤') {
            processedKeyword = '나이키';
            console.log(`키워드 복구: "${processedKeyword}"`);
          }
        }
      } catch (e) {
        // 디코딩 중 오류가 발생하면 원본 사용
        console.log("키워드 디코딩 중 오류 발생, 원본 사용:", e);
        processedKeyword = keyword;
      }

      console.log(`키워드 트렌드 요청: "${processedKeyword}" (원본: "${keyword}"), 기간: ${period || "daily"}`);
      
      const periodStr = typeof period === "string" ? period : "daily";
      const result = await getKeywordTrends(processedKeyword, periodStr);
      
      // 응답 전에 키워드 확인: 응답 객체의 키워드 값 확인
      if (result.keyword !== processedKeyword) {
        console.log(`응답 키워드 수정: "${result.keyword}" → "${processedKeyword}"`);
        result.keyword = processedKeyword;
      }
      
      // UTF-8로 명시적 인코딩 설정
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json(result);
    } catch (error) {
      console.error("Keyword trends error:", error);
      res.status(500).json({ message: "Error fetching keyword trends" });
    }
  });

  // Get hot keywords (trending)
  app.get("/api/trends/daily", async (req, res) => {
    try {
      const { category } = req.query;
      const categoryStr = typeof category === "string" ? category : "all";
      
      const result = await getDailyTrends(categoryStr);
      res.json(result);
    } catch (error) {
      console.error("Daily trends error:", error);
      res.status(500).json({ message: "Error fetching daily trends" });
    }
  });

  // Get weekly trends
  app.get("/api/trends/weekly", async (req, res) => {
    try {
      const { category } = req.query;
      const categoryStr = typeof category === "string" ? category : "all";
      
      const result = await getWeeklyTrends(categoryStr);
      res.json(result);
    } catch (error) {
      console.error("Weekly trends error:", error);
      res.status(500).json({ message: "Error fetching weekly trends" });
    }
  });

  // Get top selling products
  app.get("/api/products/top", async (req, res) => {
    try {
      const { category, limit } = req.query;
      const categoryStr = typeof category === "string" ? category : "all";
      const limitNum = typeof limit === "string" ? parseInt(limit, 10) : 10;
      
      const result = await getTopSellingProducts(categoryStr, limitNum);
      res.json(result);
    } catch (error) {
      console.error("Top products error:", error);
      res.status(500).json({ message: "Error fetching top products" });
    }
  });

  // Search Shopping Insight API (Naver API)
  app.get("/api/search/insight", async (req, res) => {
    try {
      const { keyword } = req.query;
      if (!keyword || typeof keyword !== "string") {
        return res.status(400).json({ message: "Keyword parameter is required" });
      }

      const result = await searchShoppingInsight(keyword);
      res.json(result);
    } catch (error) {
      console.error("Shopping insight error:", error);
      res.status(500).json({ message: "Error fetching shopping insight" });
    }
  });

  // Search Trend API (Naver API)
  app.get("/api/search/trend", async (req, res) => {
    try {
      const { keyword, startDate, endDate } = req.query;
      if (!keyword || typeof keyword !== "string") {
        return res.status(400).json({ message: "Keyword parameter is required" });
      }

      const startDateStr = typeof startDate === "string" ? startDate : undefined;
      const endDateStr = typeof endDate === "string" ? endDate : undefined;

      const result = await searchTrend(keyword, startDateStr, endDateStr);
      res.json(result);
    } catch (error) {
      console.error("Search trend error:", error);
      res.status(500).json({ message: "Error fetching search trend" });
    }
  });

  // Test Naver Category API
  app.get("/api/test/category", async (_req, res) => {
    try {
      console.log("카테고리 API 테스트 엔드포인트 호출");
      const result = await testCategoryAPI();
      res.json(result);
    } catch (error) {
      console.error("Category API test error:", error);
      res.status(500).json({ message: "Error testing category API" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
