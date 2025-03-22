// =========================================================================
// core.js - 건강기능식품 키워드 분석 시스템 핵심 모듈
// =========================================================================
// 설명: 시스템 설정과 공통 유틸리티 함수 모음

// 1. 환경 설정
require('dotenv').config();

// 2. 핵심 설정 객체
const config = {
  naver: {
    clientId: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    baseUrl: 'https://openapi.naver.com/v1/datalab/shopping'
  },
  db: {
    url: process.env.DB_URL || 'mongodb://localhost:27017/keyword_analytics',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  scraping: {
    timeout: parseInt(process.env.SCRAPING_TIMEOUT) || 30000,
    interval: parseInt(process.env.SCRAPING_INTERVAL) || 2000,
    retryLimit: parseInt(process.env.RETRY_LIMIT) || 3,
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ]
  },
  categories: {
    health: '50000008', // 건강기능식품 카테고리 코드
    subCategories: {
      vitamin: '50000155',      // 비타민
      probiotic: '50000156',    // 유산균
      omega: '50000159',        // 오메가3
      collagen: '50000165',     // 콜라겐
      redGinseng: '50000167'    // 홍삼
    }
  },
  cache: {
    ttl: 60 * 60 * 1000, // 1시간 (밀리초)
    maxSize: 100 // 최대 캐시 항목 수
  }
};

// 3. 간소화된 로깅 유틸리티
const logger = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${message}`, data);
  },
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message, data = {}) => {
    console.error(`[ERROR] ${message}`, data);
  },
  debug: (message, data = {}) => {
    if (process.env.DEBUG === 'true') {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
};

// 4. 유틸리티 함수
const utils = {
  // 4.1 랜덤 지연 생성 (밀리초)
  randomDelay: (min = 1000, max = 3000) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  // 4.2 문자열 정규화 (검색어 전처리)
  normalizeKeyword: (keyword) => {
    return keyword
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  },
  
  // 4.3 객체 깊은 병합
  deepMerge: (target, source) => {
    const output = Object.assign({}, target);
    
    if (utils.isObject(target) && utils.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (utils.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = utils.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  },
  
  // 4.4 객체 체크
  isObject: (item) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
  },
  
  // 4.5 가중치 기반 점수 계산
  weightedScore: (scores, weights) => {
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.keys(weights).forEach(key => {
      if (scores[key] !== undefined) {
        totalScore += scores[key] * weights[key];
        totalWeight += weights[key];
      }
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  },
  
  // 4.6 간단한 인메모리 캐시
  createCache: (options = {}) => {
    const opts = {
      ttl: options.ttl || config.cache.ttl,
      maxSize: options.maxSize || config.cache.maxSize
    };
    
    const cache = new Map();
    const timestamps = new Map();
    
    return {
      get: (key) => {
        const now = Date.now();
        const timestamp = timestamps.get(key) || 0;
        
        // TTL 체크
        if (now - timestamp > opts.ttl) {
          cache.delete(key);
          timestamps.delete(key);
          return undefined;
        }
        
        return cache.get(key);
      },
      
      set: (key, value) => {
        // 캐시 크기 제한 관리
        if (cache.size >= opts.maxSize) {
          // 가장 오래된 항목 제거
          let oldestKey = null;
          let oldestTime = Date.now();
          
          for (const [k, time] of timestamps.entries()) {
            if (time < oldestTime) {
              oldestTime = time;
              oldestKey = k;
            }
          }
          
          if (oldestKey) {
            cache.delete(oldestKey);
            timestamps.delete(oldestKey);
          }
        }
        
        cache.set(key, value);
        timestamps.set(key, Date.now());
        return value;
      },
      
      has: (key) => {
        const hasKey = cache.has(key);
        if (!hasKey) return false;
        
        // TTL 체크
        const now = Date.now();
        const timestamp = timestamps.get(key) || 0;
        
        if (now - timestamp > opts.ttl) {
          cache.delete(key);
          timestamps.delete(key);
          return false;
        }
        
        return true;
      },
      
      delete: (key) => {
        cache.delete(key);
        timestamps.delete(key);
      },
      
      clear: () => {
        cache.clear();
        timestamps.clear();
      }
    };
  },
  
  // 4.7 건강기능식품 관련 키워드 분류
  categorizeHealthKeyword: (keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    
    // 카테고리 매핑 룰
    const categoryRules = [
      { pattern: /(비타민|멀티비타민|종합비타민)/, category: '비타민' },
      { pattern: /(유산균|프로바이오틱스|장건강)/, category: '프로바이오틱스' },
      { pattern: /(오메가3|오메가|피쉬오일|생선유)/, category: '오메가3' },
      { pattern: /(콜라겐|피부|탄력)/, category: '콜라겐' },
      { pattern: /(홍삼|인삼|면역)/, category: '홍삼' },
      { pattern: /(칼슘|뼈|관절)/, category: '뼈/관절' },
      { pattern: /(루테인|눈|시력)/, category: '눈건강' },
      { pattern: /(마그네슘|피로|에너지)/, category: '피로회복' },
      { pattern: /(다이어트|체중|슬림)/, category: '다이어트' }
    ];
    
    // 키워드 카테고리 찾기
    for (const rule of categoryRules) {
      if (rule.pattern.test(normalizedKeyword)) {
        return rule.category;
      }
    }
    
    return '기타';
  },
  
  // 4.8 구매 의도 분석
  analyzeIntent: (keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    
    // 의도 패턴 정의
    const intentPatterns = {
      purchase: /(구매|구입|주문|최저가|가격|할인|쿠폰)/,
      information: /(효능|효과|정보|리뷰|후기|사용법|복용법|성분)/,
      comparison: /(비교|추천|순위|랭킹|인기|최고|베스트)/
    };
    
    // 의도 점수 계산
    const intentScores = {
      purchase: intentPatterns.purchase.test(normalizedKeyword) ? 1 : 0,
      information: intentPatterns.information.test(normalizedKeyword) ? 1 : 0,
      comparison: intentPatterns.comparison.test(normalizedKeyword) ? 1 : 0
    };
    
    // 주요 의도 결정
    let primaryIntent = 'general';
    let maxScore = 0;
    
    for (const [intent, score] of Object.entries(intentScores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryIntent = intent;
      }
    }
    
    return {
      primaryIntent,
      intentScores
    };
  }
};

// 5. 모듈 내보내기
module.exports = {
  config,
  logger,
  utils
};
