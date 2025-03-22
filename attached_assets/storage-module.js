// =========================================================================
// storage.js - 건강기능식품 키워드 분석 시스템 데이터 저장 모듈
// =========================================================================
// 설명: 경량화된 데이터 저장 및 관리 구현

const fs = require('fs').promises;
const path = require('path');
const { config, logger, utils } = require('./core');

/**
 * 키워드 데이터 저장소 클래스
 */
class KeywordStorage {
  constructor() {
    // 기본 저장 디렉토리
    this.dataDir = path.join(process.cwd(), 'data');
    this.analysisDir = path.join(this.dataDir, 'analysis');
    this.trendsDir = path.join(this.dataDir, 'trends');
    
    // 인메모리 캐시
    this.analysisCache = utils.createCache();
    this.trendsCache = utils.createCache();
    this.popularCache = utils.createCache({ ttl: 24 * 60 * 60 * 1000 }); // 24시간
    
    // 인메모리 인덱스
    this.keywordIndex = new Map();
    this.categoryIndex = new Map();
    
    // 최근 접근 키워드 (LRU)
    this.recentKeywords = [];
    this.MAX_RECENT = 100;
  }
  
  /**
   * 저장소 초기화
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // 디렉토리 생성
      await this._ensureDirectories();
      
      // 인덱스 로드
      await this._loadIndices();
      
      logger.info('키워드 저장소 초기화 완료');
    } catch (error) {
      logger.error(`저장소 초기화 오류: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * 필요한 디렉토리 생성
   * @returns {Promise<void>}
   * @private
   */
  async _ensureDirectories() {
    const dirs = [this.dataDir, this.analysisDir, this.trendsDir];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }
  }
  
  /**
   * 인덱스 로드
   * @returns {Promise<void>}
   * @private
   */
  async _loadIndices() {
    try {
      // 분석 디렉토리에서 파일 목록 가져오기
      const files = await fs.readdir(this.analysisDir);
      
      // 파일명에서 키워드 추출 및 인덱싱
      for (const file of files) {
        if (file.endsWith('.json')) {
          const keyword = decodeURIComponent(file.replace('.json', ''));
          this.keywordIndex.set(keyword.toLowerCase(), path.join(this.analysisDir, file));
          
          try {
            // 파일 읽기
            const data = JSON.parse(
              await fs.readFile(path.join(this.analysisDir, file), 'utf8')
            );
            
            // 최신 분석 결과 찾기
            const latestAnalysis = data.sort((a, b) => 
              new Date(b.timestamp) - new Date(a.timestamp)
            )[0];
            
            // 카테고리 인덱싱
            if (latestAnalysis && latestAnalysis.analysis && latestAnalysis.analysis.category) {
              const category = latestAnalysis.analysis.category;
              
              if (!this.categoryIndex.has(category)) {
                this.categoryIndex.set(category, new Set());
              }
              
              this.categoryIndex.get(category).add(keyword);
            }
          } catch (error) {
            logger.warn(`파일 읽기 오류 (무시됨): ${file} - ${error.message}`);
          }
        }
      }
      
      logger.info(`${this.keywordIndex.size}개 키워드 인덱싱 완료`);
    } catch (error) {
      logger.error(`인덱스 로드 오류: ${error.message}`);
    }
  }
  
  /**
   * 분석 결과 저장
   * @param {Object} analysisResult - 분석 결과
   * @returns {Promise<void>}
   */
  async saveAnalysis(analysisResult) {
    try {
      const { keyword } = analysisResult;
      const normalizedKeyword = keyword.toLowerCase();
      
      // 파일 경로 생성
      const fileName = encodeURIComponent(normalizedKeyword) + '.json';
      const filePath = path.join(this.analysisDir, fileName);
      
      // 인덱스 업데이트
      this.keywordIndex.set(normalizedKeyword, filePath);
      
      // 카테고리 인덱스 업데이트
      if (analysisResult.analysis && analysisResult.analysis.category) {
        const category = analysisResult.analysis.category;
        
        if (!this.categoryIndex.has(category)) {
          this.categoryIndex.set(category, new Set());
        }
        
        this.categoryIndex.get(category).add(keyword);
      }
      
      // 기존 데이터 로드 (있으면)
      let analysisHistory = [];
      
      try {
        if (await this._fileExists(filePath)) {
          analysisHistory = JSON.parse(await fs.readFile(filePath, 'utf8'));
        }
      } catch (error) {
        logger.warn(`기존 분석 파일 로드 오류 (새로 생성): ${error.message}`);
      }
      
      // 이력 제한 (최대 10개)
      analysisHistory.push(analysisResult);
      if (analysisHistory.length > 10) {
        analysisHistory = analysisHistory.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        ).slice(0, 10);
      }
      
      // 파일에 저장
      await fs.writeFile(filePath, JSON.stringify(analysisHistory, null, 2));
      
      // 캐시 업데이트
      this.analysisCache.set(normalizedKeyword, analysisHistory);
      
      // 최근 키워드 업데이트
      this._updateRecentKeywords(normalizedKeyword);
      
      logger.info(`분석 결과 저장 완료: ${keyword}`);
    } catch (error) {
      logger.error(`분석 결과 저장 오류: ${error.message}`, { keyword: analysisResult.keyword });
      throw error;
    }
  }
  
  /**
   * 최근 키워드 업데이트 (LRU)
   * @param {string} keyword - 키워드
   * @private
   */
  _updateRecentKeywords(keyword) {
    // 기존 항목 제거
    const index = this.recentKeywords.indexOf(keyword);
    if (index !== -1) {
      this.recentKeywords.splice(index, 1);
    }
    
    // 앞에 추가
    this.recentKeywords.unshift(keyword);
    
    // 최대 개수 유지
    if (this.recentKeywords.length > this.MAX_RECENT) {
      this.recentKeywords.pop();
    }
  }
  
  /**
   * 파일 존재 여부 확인
   * @param {string} filePath - 파일 경로
   * @returns {Promise<boolean>} 존재 여부
   * @private
   */
  async _fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 분석 이력 조회
   * @param {string} keyword - 키워드
   * @returns {Promise<Array>} 분석 이력
   */
  async getAnalysisHistory(keyword) {
    const normalizedKeyword = keyword.toLowerCase();
    
    // 캐시 확인
    if (this.analysisCache.has(normalizedKeyword)) {
      logger.debug(`캐시에서 분석 이력 로드: ${normalizedKeyword}`);
      return this.analysisCache.get(normalizedKeyword);
    }
    
    // 인덱스에서 파일 경로 확인
    const filePath = this.keywordIndex.get(normalizedKeyword);
    
    if (!filePath || !await this._fileExists(filePath)) {
      return [];
    }
    
    try {
      // 파일에서 데이터 로드
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      // 캐시 업데이트
      this.analysisCache.set(normalizedKeyword, data);
      
      // 최근 키워드 업데이트
      this._updateRecentKeywords(normalizedKeyword);
      
      return data;
    } catch (error) {
      logger.error(`분석 이력 로드 오류: ${error.message}`, { keyword });
      return [];
    }
  }
  
  /**
   * 최신 분석 결과 조회
   * @param {string} keyword - 키워드
   * @returns {Promise<Object|null>} 최신 분석 결과
   */
  async getLatestAnalysis(keyword) {
    const history = await this.getAnalysisHistory(keyword);
    
    if (history.length === 0) {
      return null;
    }
    
    // 최신 항목 반환
    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  }
  
  /**
   * 카테고리별 트렌드 조회
   * @param {string} category - 카테고리
   * @param {number} months - 개월 수
   * @returns {Promise<Object>} 트렌드 데이터
   */
  async getCategoryTrends(category, months = 6) {
    const cacheKey = `trends:${category}:${months}`;
    
    // 캐시 확인
    if (this.trendsCache.has(cacheKey)) {
      return this.trendsCache.get(cacheKey);
    }
    
    try {
      // 카테고리 키워드 조회
      const keywords = this.categoryIndex.get(category) || new Set();
      
      if (keywords.size === 0) {
        return { keywords: [], trends: [] };
      }
      
      // 각 키워드별 최신 분석 결과 조회
      const keywordAnalyses = await Promise.all(
        [...keywords].map(async keyword => {
          const analysis = await this.getLatestAnalysis(keyword);
          return analysis;
        })
      );
      
      // 유효한 분석 결과만 필터링
      const validAnalyses = keywordAnalyses.filter(analysis => 
        analysis && analysis.analysis && analysis.analysis.trends && 
        analysis.analysis.trends.length > 0
      );
      
      // 트렌드 데이터 추출 및 통합
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
      const trends = {};
      
      validAnalyses.forEach(analysis => {
        // 각 키워드의 트렌드 데이터
        const keywordTrends = analysis.analysis.trends;
        
        keywordTrends.forEach(trend => {
          const trendDate = new Date(trend.period);
          
          // 지정된 기간 내 데이터만 포함
          if (trendDate >= startDate) {
            const yearMonth = `${trendDate.getFullYear()}-${(trendDate.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!trends[yearMonth]) {
              trends[yearMonth] = {
                period: yearMonth,
                keywords: {}
              };
            }
            
            trends[yearMonth].keywords[analysis.keyword] = trend.value;
          }
        });
      });
      
      // 결과 포맷팅
      const result = {
        keywords: validAnalyses.map(a => a.keyword),
        trends: Object.values(trends).sort((a, b) => a.period.localeCompare(b.period))
      };
      
      // 캐시 저장
      this.trendsCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      logger.error(`카테고리 트렌드 조회 오류: ${error.message}`, { category, months });
      return { keywords: [], trends: [] };
    }
  }
  
  /**
   * 인기 키워드 조회
   * @param {number} days - 최근 일수
   * @param {number} limit - 최대 개수
   * @returns {Promise<Array>} 인기 키워드 배열
   */
  async getPopularKeywords(days = 7, limit = 20) {
    const cacheKey = `popular:${days}:${limit}`;
    
    // 캐시 확인
    if (this.popularCache.has(cacheKey)) {
      return this.popularCache.get(cacheKey);
    }
    
    try {
      // 인덱스에서 모든 키워드 가져오기
      const allKeywords = [...this.keywordIndex.keys()];
      
      // 각 키워드별 최신 분석 결과 조회
      const keywordsWithScores = await Promise.all(
        allKeywords.map(async keyword => {
          try {
            const analysis = await this.getLatestAnalysis(keyword);
            
            // 유효한 분석 결과이고 최근 데이터인 경우만 포함
            if (analysis && analysis.timestamp) {
              const analysisDate = new Date(analysis.timestamp);
              const daysDiff = (new Date() - analysisDate) / (1000 * 60 * 60 * 24);
              
              if (daysDiff <= days && analysis.analysis && analysis.analysis.scores) {
                return {
                  keyword,
                  score: analysis.analysis.scores.composite || 0,
                  timestamp: analysisDate
                };
              }
            }
          } catch (error) {
            logger.debug(`키워드 스코어 조회 오류 (무시됨): ${keyword}`);
          }
          
          return null;
        })
      );
      
      // 유효한 결과만 필터링하고 점수 기준 정렬
      const validResults = keywordsWithScores
        .filter(item => item !== null)
        .sort((a, b) => b.score - a.score);
      
      // 상위 N개 키워드 추출
      const popularKeywords = validResults.slice(0, limit).map(item => item.keyword);
      
      // 캐시 저장
      this.popularCache.set(cacheKey, popularKeywords);
      
      return popularKeywords;
    } catch (error) {
      logger.error(`인기 키워드 조회 오류: ${error.message}`, { days, limit });
      return [];
    }
  }
  
  /**
   * 저장소 종료
   * @returns {Promise<void>}
   */
  async close() {
    // 필요한 정리 작업 수행
    this.analysisCache.clear();
    this.trendsCache.clear();
    this.popularCache.clear();
    
    logger.info('저장소 연결 종료');
  }
}

module.exports = new KeywordStorage();
