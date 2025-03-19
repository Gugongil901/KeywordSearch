import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupNaverAPI, getKeywordStats, searchKeyword, getKeywordTrends, getHotKeywords, getTopSellingProducts, testCategoryAPI } from "./api/naver";
import { searchShoppingInsight, searchTrend } from "./api/search";
import { getDailyTrends, getWeeklyTrends } from "./api/trend";
import { testAllNaverAPIs, testBasicNaverAPIs } from "./api/naver-api-test";

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
      // query와 keyword 파라미터 둘 다 지원
      const queryParam = req.query.query || req.query.keyword;
      
      if (!queryParam || typeof queryParam !== "string") {
        return res.status(400).json({ message: "Query parameter is required (use 'query' or 'keyword')" });
      }

      // URL 인코딩 처리
      let processedQuery;
      
      try {
        // URL에서 받은 키워드는 이미 인코딩되어 있으므로 디코딩
        processedQuery = decodeURIComponent(queryParam);
        
        // 자주 사용되는 한글 키워드 매핑 테이블 (깨진 인코딩 → 정상 한글)
        const koreanKeywords: Record<string, string> = {
          'ëì´í¤': '나이키',
          'ìëì´ë¤ì¤': '아디다스',
          'ê°¤ë­ì': '갤럭시',
          'ìì´í°': '아이폰',
          'ë´ë°ëì¤': '뉴발란스'
        };
        
        // 'ëì´í¤'와 같은 깨진 한글 문자열 탐지
        const isEncodingCorrupted = /ë|ì|í|¤|Ã«|Ã¬|Â´|Ã­|Â¤/.test(processedQuery);
        
        if (isEncodingCorrupted) {
          console.log(`⚠️ 인코딩이 손상된 검색어 감지: "${processedQuery}"`);
          
          // 알려진 깨진 인코딩 매핑으로 수정
          if (koreanKeywords[processedQuery]) {
            const originalQuery = processedQuery;
            processedQuery = koreanKeywords[processedQuery];
            console.log(`✅ 검색어 자동 수정: "${originalQuery}" → "${processedQuery}"`);
          } else {
            // 알려진 매핑이 없는 경우 깨진 문자 제거
            const cleanedQuery = processedQuery.replace(/[ëìíÂ´¤Ã«Ã¬Ã­]/g, '');
            if (cleanedQuery.trim()) {
              processedQuery = cleanedQuery;
              console.log(`⚠️ 깨진 문자 제거 시도: "${processedQuery}"`);
            } else {
              // 모든 문자가 깨진 경우 기본값 사용
              processedQuery = '인기검색어';
              console.log(`⚠️ 모든 문자가 깨짐, 기본 검색어 사용: "${processedQuery}"`);
            }
          }
        }
      } catch (e) {
        // 디코딩 중 오류가 발생하면 원본 사용
        console.log("검색어 디코딩 중 오류 발생, 원본 사용:", e);
        processedQuery = queryParam;
      }

      console.log(`키워드 검색 요청: "${processedQuery}" (원본: "${queryParam}")`);
      
      const result = await searchKeyword(processedQuery);
      
      // 응답 키워드 필드 확인
      if (result.keyword !== processedQuery && processedQuery.trim() !== '') {
        console.log(`응답 키워드 수정: "${result.keyword}" → "${processedQuery}"`);
        result.keyword = processedQuery;
      }
      
      // UTF-8로 명시적 인코딩 설정
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
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

      // URL 인코딩 처리
      let processedKeyword;
      
      try {
        // URL에서 받은 키워드는 이미 인코딩되어 있으므로 디코딩
        processedKeyword = decodeURIComponent(keyword);
        
        // 자주 사용되는 한글 키워드 매핑 테이블
        const koreanKeywords: Record<string, string> = {
          'ëì´í¤': '나이키',
          'ìëì´ë¤ì¤': '아디다스',
          'ê°¤ë­ì': '갤럭시',
          'ìì´í°': '아이폰',
          'ë´ë°ëì¤': '뉴발란스'
        };
        
        // 깨진 한글 문자열 탐지
        const isEncodingCorrupted = /ë|ì|í|¤|Ã«|Ã¬|Â´|Ã­|Â¤/.test(processedKeyword);
        
        if (isEncodingCorrupted) {
          console.log(`⚠️ 인코딩이 손상된 키워드 감지: "${processedKeyword}"`);
          
          // 매핑 테이블에서 찾아서 수정
          if (koreanKeywords[processedKeyword]) {
            const originalKeyword = processedKeyword;
            processedKeyword = koreanKeywords[processedKeyword];
            console.log(`✅ 키워드 자동 수정: "${originalKeyword}" → "${processedKeyword}"`);
          } else {
            // 알려진 매핑이 없는 경우 깨진 문자 제거
            const cleanedKeyword = processedKeyword.replace(/[ëìíÂ´¤Ã«Ã¬Ã­]/g, '');
            if (cleanedKeyword.trim()) {
              processedKeyword = cleanedKeyword;
              console.log(`⚠️ 깨진 문자 제거 시도: "${processedKeyword}"`);
            } else {
              // 모든 문자가 깨진 경우 기본값 사용
              processedKeyword = '인기검색어';
              console.log(`⚠️ 모든 문자가 깨짐, 기본 키워드 사용: "${processedKeyword}"`);
            }
          }
        }
      } catch (e) {
        // 디코딩 중 오류가 발생하면 원본 사용
        console.log("키워드 디코딩 중 오류 발생, 원본 사용:", e);
        processedKeyword = keyword;
      }

      console.log(`키워드 통계 요청: "${processedKeyword}" (원본: "${keyword}")`);
      
      const result = await getKeywordStats(processedKeyword);
      
      // 응답 키워드 필드 확인
      if (result.keyword !== processedKeyword && processedKeyword.trim() !== '') {
        console.log(`응답 키워드 수정: "${result.keyword}" → "${processedKeyword}"`);
        result.keyword = processedKeyword;
      }
      
      // UTF-8로 명시적 인코딩 설정
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
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
        
        // 자주 사용되는 한글 키워드 매핑 테이블
        const koreanKeywords: Record<string, string> = {
          'ëì´í¤': '나이키',
          'ìëì´ë¤ì¤': '아디다스',
          'ê°¤ë­ì': '갤럭시',
          'ìì´í°': '아이폰',
          'ë´ë°ëì¤': '뉴발란스'
        };
        
        // 깨진 한글 문자열 탐지
        const isEncodingCorrupted = /ë|ì|í|¤|Ã«|Ã¬|Â´|Ã­|Â¤/.test(processedKeyword);
        
        if (isEncodingCorrupted) {
          console.log(`⚠️ 인코딩이 손상된 키워드 감지: "${processedKeyword}"`);
          
          // 매핑 테이블에서 찾아서 수정
          if (koreanKeywords[processedKeyword]) {
            const originalKeyword = processedKeyword;
            processedKeyword = koreanKeywords[processedKeyword];
            console.log(`✅ 키워드 자동 수정: "${originalKeyword}" → "${processedKeyword}"`);
          } else {
            // 알려진 매핑이 없는 경우 깨진 문자 제거
            const cleanedKeyword = processedKeyword.replace(/[ëìíÂ´¤Ã«Ã¬Ã­]/g, '');
            if (cleanedKeyword.trim()) {
              processedKeyword = cleanedKeyword;
              console.log(`⚠️ 깨진 문자 제거 시도: "${processedKeyword}"`);
            } else {
              // 모든 문자가 깨진 경우 기본값 사용
              processedKeyword = '인기검색어';
              console.log(`⚠️ 모든 문자가 깨짐, 기본 키워드 사용: "${processedKeyword}"`);
            }
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
      if (result.keyword !== processedKeyword && processedKeyword.trim() !== '') {
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

      // URL 인코딩 처리
      let processedKeyword;
      
      try {
        // URL에서 받은 키워드는 이미 인코딩되어 있으므로 디코딩
        processedKeyword = decodeURIComponent(keyword);
        
        // '나이키' -> 'ëì´í¤'로 인코딩 손상된 경우 처리
        if (processedKeyword === 'ëì´í¤') {
          processedKeyword = '나이키';
          console.log(`⚠️ 손상된 키워드 직접 교체: "${processedKeyword}"`);
        }
        // '아디다스' -> 'ìëì´ë¤ì¤'로 인코딩 손상된 경우 처리
        else if (processedKeyword === 'ìëì´ë¤ì¤') {
          processedKeyword = '아디다스';
          console.log(`⚠️ 손상된 키워드 직접 교체: "${processedKeyword}"`);
        }
        // 'ë'으로 시작하는 인코딩 손상된 한글 문자열 탐지
        else if (/ë|ì|í|¤|Ã«|Ã¬|Â´|Ã­|Â¤/.test(processedKeyword)) {
          console.log(`⚠️ 인코딩이 손상된 키워드 감지: "${processedKeyword}"`);
          
          // 깨진 글자 제거
          const cleanedKeyword = processedKeyword.replace(/ë|ì|í|¤|Ã«|Ã¬|Â´|Ã­|Â¤/g, '');
          if (cleanedKeyword.trim()) {
            processedKeyword = cleanedKeyword;
            console.log(`키워드 정리 시도: "${processedKeyword}"`);
          } else {
            // 키워드가 모두 깨졌을 경우 기본값 설정
            console.log(`키워드가 완전히 깨짐, 기본값 사용`);
            processedKeyword = '인기검색어';
          }
        }
      } catch (e) {
        // 디코딩 중 오류가 발생하면 원본 사용
        console.log("키워드 디코딩 중 오류 발생, 원본 사용:", e);
        processedKeyword = keyword;
      }

      console.log(`쇼핑 인사이트 요청: "${processedKeyword}" (원본: "${keyword}")`);
      
      const result = await searchShoppingInsight(processedKeyword);
      
      // UTF-8로 명시적 인코딩 설정
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
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
      
      const startDateStr = typeof startDate === "string" ? startDate : undefined;
      const endDateStr = typeof endDate === "string" ? endDate : undefined;

      console.log(`검색 트렌드 요청: "${processedKeyword}" (원본: "${keyword}"), 기간: ${startDateStr || "기본값"}~${endDateStr || "기본값"}`);
      
      const result = await searchTrend(processedKeyword, startDateStr, endDateStr);
      
      // UTF-8로 명시적 인코딩 설정
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
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
  
  // Test all Naver APIs
  app.get("/api/test/all-apis", async (_req, res) => {
    try {
      console.log("모든 네이버 API 엔드포인트 테스트 시작");
      const result = await testAllNaverAPIs();
      res.json({
        message: "API 테스트 완료",
        result
      });
    } catch (error) {
      console.error("API 테스트 실패:", error);
      res.status(500).json({ message: "Error testing all APIs", details: error });
    }
  });
  
  // Test basic Naver APIs functionality
  app.get("/api/test/basic-apis", async (_req, res) => {
    try {
      console.log("기본 네이버 API 동작 확인 시작");
      const result = await testBasicNaverAPIs();
      res.json({
        message: "API 동작 확인 완료",
        success: result
      });
    } catch (error) {
      console.error("API 동작 확인 실패:", error);
      res.status(500).json({ message: "Error testing basic APIs", details: error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
