// =========================================================================
// collector.js - 건강기능식품 키워드 데이터 수집 모듈
// =========================================================================
// 설명: 네이버 데이터랩 API와 웹 스크래핑을 통한 키워드 데이터 수집

const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { config, logger, utils } = require('./core');

// 스텔스 플러그인 추가 (봇 감지 회피)
puppeteer.use(StealthPlugin());

// 브라우저 인스턴스 (지연 초기화)
let browser = null;

/**
 * 데이터 수집기 클래스
 */
class KeywordCollector {
  constructor() {
    // 네이버 API 클라이언트 초기화
    this.apiClient = axios.create({
      baseURL: config.naver.baseUrl,
      headers: {
        'X-Naver-Client-Id': config.naver.clientId,
        'X-Naver-Client-Secret': config.naver.clientSecret,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    // 데이터 수집 캐시 초기화
    this.cache = utils.createCache({
      ttl: 30 * 60 * 1000 // 30분
    });
  }
  
  /**
   * 키워드 데이터 수집 (자동 소스 선택)
   * @param {string} keyword - 수집할 키워드
   * @returns {Promise<Object>} 수집된 키워드 데이터
   */
  async collectKeywordData(keyword) {
    const normalizedKeyword = utils.normalizeKeyword(keyword);
    const cacheKey = `keyword_data:${normalizedKeyword}`;
    
    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      logger.debug(`캐시에서 키워드 데이터 로드: ${normalizedKeyword}`);
      return this.cache.get(cacheKey);
    }
    
    try {
      // 1. API 시도
      const apiData = await this._collectFromApi(normalizedKeyword);
      const result = {
        keyword: normalizedKeyword,
        source: 'API',
        timestamp: new Date(),
        data: apiData
      };
      
      // 캐시 저장
      this.cache.set(cacheKey, result);
      return result;
    } catch (apiError) {
      logger.warn(`API 수집 실패, 스크래핑으로 전환: ${normalizedKeyword}`);
      
      try {
        // 2. 스크래핑 시도
        const scrapedData = await this._collectFromScraping(normalizedKeyword);
        const result = {
          keyword: normalizedKeyword,
          source: 'SCRAPING',
          timestamp: new Date(),
          data: scrapedData
        };
        
        // 캐시 저장
        this.cache.set(cacheKey, result);
        return result;
      } catch (scrapingError) {
        logger.error(`키워드 수집 실패: ${normalizedKeyword}`, {
          apiError: apiError.message,
          scrapingError: scrapingError.message
        });
        
        throw new Error(`키워드 데이터 수집 실패: ${scrapingError.message}`);
      }
    }
  }
  
  /**
   * 네이버 데이터랩 API를 통한 데이터 수집
   * @param {string} keyword - 수집할 키워드
   * @returns {Promise<Object>} API 응답 데이터
   * @private
   */
  async _collectFromApi(keyword) {
    // 6개월 기간 설정
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 6);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // API 요청 페이로드
    const payload = {
      startDate: startDateStr,
      endDate: endDateStr,
      timeUnit: 'month',
      category: config.categories.health,
      keywordGroups: [
        {
          groupName: keyword,
          keywords: [keyword]
        }
      ]
    };
    
    try {
      const response = await this.apiClient.post('/trends', payload);
      logger.info(`API 데이터 수집 성공: ${keyword}`);
      
      // 키워드 카테고리 정보 추가 조회
      try {
        const categoryResponse = await this.apiClient.get('/category', {
          params: { keyword }
        });
        
        return {
          trends: response.data,
          categories: categoryResponse.data
        };
      } catch (categoryError) {
        logger.warn(`카테고리 정보 조회 실패: ${keyword}`);
        return { trends: response.data };
      }
    } catch (error) {
      logger.error(`API 요청 실패: ${error.message}`, {
        keyword,
        status: error.response?.status,
        data: error.response?.data
      });
      
      throw error;
    }
  }
  
  /**
   * 웹 스크래핑을 통한 데이터 수집
   * @param {string} keyword - 수집할 키워드
   * @returns {Promise<Object>} 스크래핑된 데이터
   * @private
   */
  async _collectFromScraping(keyword) {
    // 브라우저 인스턴스 초기화 (필요 시)
    if (!browser) {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage'
        ]
      });
      
      // 프로세스 종료 시 브라우저 정리
      process.on('exit', () => {
        if (browser) {
          browser.close();
        }
      });
    }
    
    // 여러 소스에서 데이터 수집
    const [exposureData, relatedData, insightsData] = await Promise.allSettled([
      this._scrapeKeywordExposure(keyword),
      this._scrapeRelatedKeywords(keyword),
      this._scrapeShoppingInsights(keyword)
    ]);
    
    // 결과 통합
    return {
      exposure: exposureData.status === 'fulfilled' ? exposureData.value : [],
      related: relatedData.status === 'fulfilled' ? relatedData.value : [],
      insights: insightsData.status === 'fulfilled' ? insightsData.value : null
    };
  }
  
  /**
   * 키워드 노출 데이터 스크래핑
   * @param {string} keyword - 수집할 키워드
   * @returns {Promise<Array>} 키워드 노출 데이터
   * @private
   */
  async _scrapeKeywordExposure(keyword, retryCount = 0) {
    let page = null;
    
    try {
      page = await browser.newPage();
      
      // 사용자 에이전트 설정
      const userAgent = config.scraping.userAgents[
        Math.floor(Math.random() * config.scraping.userAgents.length)
      ];
      await page.setUserAgent(userAgent);
      
      // 리소스 차단 (이미지, 폰트 등 불필요한 요소)
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceTypes = ['image', 'stylesheet', 'font'];
        if (resourceTypes.includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // 네이버 검색 페이지 로드
      const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
      
      // 랜덤 지연 적용
      await new Promise(r => setTimeout(r, utils.randomDelay()));
      
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.scraping.timeout
      });
      
      // 키워드 노출 데이터 추출
      const exposureData = await page.evaluate(() => {
        const results = [];
        
        // 쇼핑 박스 정보
        const shoppingBox = document.querySelector('.shop_section');
        const hasShoppingBox = !!shoppingBox;
        
        // 연관 검색어
        document.querySelectorAll('.related_list > li > a').forEach((el, index) => {
          results.push({
            keyword: el.textContent.trim(),
            type: 'related',
            rank: index + 1
          });
        });
        
        // 자동완성 추천
        document.querySelectorAll('.atcmp_layer .atcmp_suggestion .atcmp_title').forEach((el, index) => {
          results.push({
            keyword: el.textContent.trim(),
            type: 'autocomplete',
            rank: index + 1
          });
        });
        
        // 실시간 인기 검색어
        document.querySelectorAll('.list_realtime .title_area .title').forEach((el, index) => {
          results.push({
            keyword: el.textContent.trim(),
            type: 'trending',
            rank: index + 1
          });
        });
        
        return {
          results,
          hasShoppingBox
        };
      });
      
      logger.info(`노출 데이터 스크래핑 완료: ${keyword}`);
      return exposureData;
    } catch (error) {
      logger.error(`노출 데이터 스크래핑 실패: ${error.message}`, { keyword });
      
      // 재시도 로직
      if (retryCount < config.scraping.retryLimit) {
        logger.info(`재시도 중... (${retryCount + 1}/${config.scraping.retryLimit})`);
        await new Promise(r => setTimeout(r, utils.randomDelay()));
        return this._scrapeKeywordExposure(keyword, retryCount + 1);
      }
      
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
  
  /**
   * 연관 키워드 스크래핑
   * @param {string} keyword - 수집할 키워드
   * @returns {Promise<Array>} 연관 키워드 데이터
   * @private
   */
  async _scrapeRelatedKeywords(keyword, retryCount = 0) {
    let page = null;
    
    try {
      page = await browser.newPage();
      
      // 사용자 에이전트 설정
      const userAgent = config.scraping.userAgents[
        Math.floor(Math.random() * config.scraping.userAgents.length)
      ];
      await page.setUserAgent(userAgent);
      
      // 리소스 차단
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceTypes = ['image', 'stylesheet', 'font'];
        if (resourceTypes.includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // 네이버 쇼핑 페이지 로드
      const shoppingUrl = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(keyword)}`;
      
      // 랜덤 지연 적용
      await new Promise(r => setTimeout(r, utils.randomDelay()));
      
      await page.goto(shoppingUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.scraping.timeout
      });
      
      // 연관 키워드 추출
      const relatedKeywords = await page.evaluate(() => {
        const keywords = [];
        
        // 연관 검색어
        document.querySelectorAll('.relatedTags_relation_srh__YG9s7 li a').forEach((el, index) => {
          keywords.push({
            keyword: el.textContent.trim(),
            type: 'shopping_related',
            rank: index + 1
          });
        });
        
        // 인기 검색어
        document.querySelectorAll('.relatedTags_trend_srh__F8hvh li a').forEach((el, index) => {
          keywords.push({
            keyword: el.textContent.trim(),
            type: 'shopping_trending',
            rank: index + 1
          });
        });
        
        return keywords;
      });
      
      logger.info(`연관 키워드 스크래핑 완료: ${keyword}`);
      return relatedKeywords;
    } catch (error) {
      logger.error(`연관 키워드 스크래핑 실패: ${error.message}`, { keyword });
      
      // 재시도 로직
      if (retryCount < config.scraping.retryLimit) {
        logger.info(`재시도 중... (${retryCount + 1}/${config.scraping.retryLimit})`);
        await new Promise(r => setTimeout(r, utils.randomDelay()));
        return this._scrapeRelatedKeywords(keyword, retryCount + 1);
      }
      
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
  
  /**
   * 쇼핑 인사이트 데이터 스크래핑
   * @param {string} keyword - 수집할 키워드
   * @returns {Promise<Object>} 쇼핑 인사이트 데이터
   * @private
   */
  async _scrapeShoppingInsights(keyword, retryCount = 0) {
    let page = null;
    
    try {
      page = await browser.newPage();
      
      // 사용자 에이전트 설정
      const userAgent = config.scraping.userAgents[
        Math.floor(Math.random() * config.scraping.userAgents.length)
      ];
      await page.setUserAgent(userAgent);
      
      // 리소스 최적화
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceTypes = ['image', 'stylesheet', 'font'];
        if (resourceTypes.includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // 데이터랩 쇼핑인사이트 페이지 로드
      const insightUrl = `https://datalab.naver.com/shoppingInsight/sCategory.naver?cid=${config.categories.health}&keyword=${encodeURIComponent(keyword)}`;
      
      // 랜덤 지연 적용
      await new Promise(r => setTimeout(r, utils.randomDelay()));
      
      await page.goto(insightUrl, {
        waitUntil: 'networkidle2',
        timeout: config.scraping.timeout
      });
      
      // 쇼핑인사이트 데이터 추출
      const insightData = await page.evaluate(() => {
        // 차트 데이터
        const chartData = window.chartObject ? window.chartObject.data : null;
        
        // 인구통계 데이터
        const genderData = Array.from(document.querySelectorAll('.gender_chart .graph_legend li')).map(el => ({
          gender: el.querySelector('.legend').textContent.trim(),
          value: parseFloat(el.querySelector('.value').textContent.replace('%', ''))
        }));
        
        const ageData = Array.from(document.querySelectorAll('.age_chart .graph_legend li')).map(el => ({
          age: el.querySelector('.legend').textContent.trim(),
          value: parseFloat(el.querySelector('.value').textContent.replace('%', ''))
        }));
        
        // 연관 검색어
        const relatedKeywords = Array.from(document.querySelectorAll('.rank_top1000 > li')).map(el => ({
          keyword: el.querySelector('a').textContent.trim(),
          rank: parseInt(el.querySelector('.rank').textContent.trim())
        }));
        
        return {
          trends: chartData,
          demographics: {
            gender: genderData,
            age: ageData
          },
          relatedKeywords
        };
      });
      
      logger.info(`쇼핑 인사이트 스크래핑 완료: ${keyword}`);
      return insightData;
    } catch (error) {
      logger.error(`쇼핑 인사이트 스크래핑 실패: ${error.message}`, { keyword });
      
      // 재시도 로직
      if (retryCount < config.scraping.retryLimit) {
        logger.info(`재시도 중... (${retryCount + 1}/${config.scraping.retryLimit})`);
        await new Promise(r => setTimeout(r, utils.randomDelay()));
        return this._scrapeShoppingInsights(keyword, retryCount + 1);
      }
      
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
  
  /**
   * 브라우저 인스턴스 종료
   */
  async closeBrowser() {
    if (browser) {
      await browser.close();
      browser = null;
      logger.info('브라우저 인스턴스 종료됨');
    }
  }
}

module.exports = new KeywordCollector();
