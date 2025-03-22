// =========================================================================
// analyzer.js - 건강기능식품 키워드 분석 알고리즘 모듈
// =========================================================================
// 설명: 고급 키워드 분석 및 인사이트 제공 알고리즘

const { config, logger, utils } = require('./core');
const collector = require('./collector');

/**
 * 키워드 분석기 클래스
 */
class KeywordAnalyzer {
  constructor() {
    // 분석 결과 캐시
    this.cache = utils.createCache({
      ttl: 60 * 60 * 1000 // 1시간
    });
    
    // 경쟁 강도 계산을 위한 신호 키워드
    this.competitionSignals = {
      high: ['최저가', '할인', '인기', '베스트', '추천', '랭킹', '가성비'],
      medium: ['브랜드', '효과', '리뷰', '후기', '비교'],
      low: ['성분', '함량', '원료', '복용법', '부작용']
    };
    
    // 구매 의도 신호 키워드
    this.purchaseIntentSignals = {
      high: ['구매', '주문', '최저가', '할인', '쿠폰', '무료배송'],
      medium: ['추천', '인기', '랭킹', '비교', '효과'],
      low: ['정보', '복용법', '성분', '부작용', '후기']
    };
    
    // 계절성 키워드 패턴
    this.seasonalPatterns = {
      spring: ['알레르기', '꽃가루', '환절기', '미세먼지', '다이어트'],
      summer: ['자외선', '피부', '수분', '다이어트', '체력', '더위'],
      fall: ['환절기', '면역', '감기', '호흡기', '건조'],
      winter: ['면역력', '감기', '독감', '호흡기', '보습', '관절']
    };
  }
  
  /**
   * 키워드 분석 실행
   * @param {string} keyword - 분석할 키워드
   * @returns {Promise<Object>} 분석 결과
   */
  async analyzeKeyword(keyword) {
    const normalizedKeyword = utils.normalizeKeyword(keyword);
    const cacheKey = `analysis:${normalizedKeyword}`;
    
    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      logger.debug(`캐시에서 분석 결과 로드: ${normalizedKeyword}`);
      return this.cache.get(cacheKey);
    }
    
    try {
      logger.info(`키워드 분석 시작: ${normalizedKeyword}`);
      
      // 1. 키워드 데이터 수집
      const collectionResult = await collector.collectKeywordData(normalizedKeyword);
      const { data, source } = collectionResult;
      
      // 2. 데이터 소스에 따른 분석 실행
      let analysisResult;
      
      if (source === 'API') {
        analysisResult = this._analyzeApiData(normalizedKeyword, data);
      } else {
        analysisResult = this._analyzeScrapedData(normalizedKeyword, data);
      }
      
      // 3. 인텐트 분석 추가
      const intentAnalysis = utils.analyzeIntent(normalizedKeyword);
      analysisResult.intent = intentAnalysis;
      
      // 4. 카테고리 정보 추가
      analysisResult.category = utils.categorizeHealthKeyword(normalizedKeyword);
      
      // 5. 계절성 분석 추가
      analysisResult.seasonality = this._analyzeSeasonality(normalizedKeyword, data);
      
      // 6. 최종 복합 점수 계산
      analysisResult.scores.composite = this._calculateCompositeScore(analysisResult.scores);
      
      // 분석 메타데이터 추가
      const result = {
        keyword: normalizedKeyword,
        source,
        timestamp: new Date(),
        analysis: analysisResult
      };
      
      // 캐시 저장
      this.cache.set(cacheKey, result);
      
      logger.info(`키워드 분석 완료: ${normalizedKeyword}`);
      return result;
    } catch (error) {
      logger.error(`키워드 분석 실패: ${error.message}`, { keyword: normalizedKeyword });
      throw error;
    }
  }
  
  /**
   * API 데이터 분석
   * @param {string} keyword - 키워드
   * @param {Object} data - API 데이터
   * @returns {Object} 분석 결과
   * @private
   */
  _analyzeApiData(keyword, data) {
    // 기본 구조 초기화
    const analysis = {
      scores: {
        searchVolume: 0,
        competition: 0,
        purchaseIntent: 0,
        growth: 0,
        seasonality: 0,
        composite: 0
      },
      metrics: {},
      trends: [],
      relatedKeywords: [],
      insights: []
    };
    
    // 트렌드 데이터 처리
    if (data.trends && data.trends.results && data.trends.results.length > 0) {
      const result = data.trends.results[0];
      
      // 검색량 점수 (0-100)
      analysis.scores.searchVolume = Math.min(100, result.data.reduce((sum, item) => sum + item.ratio, 0) * 100);
      
      // 트렌드 추출 및 성장률 계산
      const trends = result.data.map((item, index, arr) => {
        const previousValue = index > 0 ? arr[index - 1].ratio : item.ratio;
        const changeRate = previousValue > 0 
          ? ((item.ratio - previousValue) / previousValue) * 100 
          : 0;
        
        return {
          period: item.period,
          value: item.ratio * 100, // 퍼센트로 변환
          changeRate
        };
      });
      
      analysis.trends = trends;
      
      // 성장률 점수 계산 (최근 3개월 평균 성장률)
      const recentTrends = trends.slice(-3);
      const avgGrowthRate = recentTrends.reduce((sum, item) => sum + item.changeRate, 0) / recentTrends.length;
      
      // 성장률을 0-100 점수로 정규화 (-50%~+50% 범위를 0-100으로 매핑)
      analysis.scores.growth = Math.max(0, Math.min(100, (avgGrowthRate + 50) * 100 / 100));
    }
    
    // 카테고리 정보 처리
    if (data.categories && data.categories.items) {
      const categories = data.categories.items.map(item => ({
        id: item.id,
        name: item.name,
        weight: item.weight
      }));
      
      analysis.metrics.categories = categories;
    }
    
    // 스크래핑으로 보완 데이터 없음: 기본값 설정
    analysis.scores.competition = 50; // 중간 경쟁 강도
    analysis.scores.purchaseIntent = 50; // 중간 구매 의도
    
    // 인사이트 생성
    analysis.insights = this._generateInsights(keyword, analysis);
    
    return analysis;
  }
  
  /**
   * 스크래핑 데이터 분석
   * @param {string} keyword - 키워드
   * @param {Object} data - 스크래핑 데이터
   * @returns {Object} 분석 결과
   * @private
   */
  _analyzeScrapedData(keyword, data) {
    // 기본 구조 초기화
    const analysis = {
      scores: {
        searchVolume: 0,
        competition: 0,
        purchaseIntent: 0,
        growth: 0,
        seasonality: 0,
        composite: 0
      },
      metrics: {},
      trends: [],
      relatedKeywords: [],
      insights: []
    };
    
    // 노출 데이터 처리
    if (data.exposure && data.exposure.results) {
      // 쇼핑 노출 여부에 따른 검색량 점수 추정
      analysis.scores.searchVolume = data.exposure.hasShoppingBox ? 70 : 40;
      
      // 관련 키워드 추출
      analysis.relatedKeywords = [...data.exposure.results];
    }
    
    // 연관 키워드 처리
    if (data.related && data.related.length > 0) {
      // 기존 관련 키워드에 추가
      analysis.relatedKeywords = [
        ...analysis.relatedKeywords,
        ...data.related
      ];
      
      // 중복 제거
      const keywordSet = new Set();
      analysis.relatedKeywords = analysis.relatedKeywords.filter(item => {
        if (keywordSet.has(item.keyword)) {
          return false;
        }
        keywordSet.add(item.keyword);
        return true;
      });
    }
    
    // 경쟁 강도 계산
    analysis.scores.competition = this._calculateCompetitionScore(analysis.relatedKeywords);
    
    // 구매 의도 점수 계산
    analysis.scores.purchaseIntent = this._calculatePurchaseIntentScore(analysis.relatedKeywords);
    
    // 쇼핑 인사이트 데이터 처리
    if (data.insights && data.insights.trends) {
      // 트렌드 데이터 추출
      analysis.trends = data.insights.trends.map(item => ({
        period: item.period,
        value: item.value,
        changeRate: item.changeRate || 0
      }));
      
      // 성장률 계산
      const recentTrends = analysis.trends.slice(-3);
      const avgGrowthRate = recentTrends.length > 0
        ? recentTrends.reduce((sum, item) => sum + item.changeRate, 0) / recentTrends.length
        : 0;
      
      // 성장률 점수 정규화
      analysis.scores.growth = Math.max(0, Math.min(100, (avgGrowthRate + 50) * 100 / 100));
      
      // 인구통계 정보 추가
      if (data.insights.demographics) {
        analysis.metrics.demographics = data.insights.demographics;
      }
      
      // 추가 연관 키워드
      if (data.insights.relatedKeywords) {
        // 중복을 피하며 연관 키워드에 추가
        const existingKeywords = new Set(analysis.relatedKeywords.map(k => k.keyword));
        
        const newRelatedKeywords = data.insights.relatedKeywords
          .filter(item => !existingKeywords.has(item.keyword))
          .map(item => ({
            keyword: item.keyword,
            type: 'insight_related',
            rank: item.rank
          }));
        
        analysis.relatedKeywords = [
          ...analysis.relatedKeywords,
          ...newRelatedKeywords
        ];
      }
    }
    
    // 인사이트 생성
    analysis.insights = this._generateInsights(keyword, analysis);
    
    return analysis;
  }
  
  /**
   * 경쟁 강도 점수 계산
   * @param {Array} relatedKeywords - 연관 키워드 배열
   * @returns {number} 경쟁 강도 점수 (0-100)
   * @private
   */
  _calculateCompetitionScore(relatedKeywords) {
    if (!relatedKeywords || relatedKeywords.length === 0) {
      return 50; // 기본값
    }
    
    let highSignalCount = 0;
    let mediumSignalCount = 0;
    let lowSignalCount = 0;
    
    // 키워드별 경쟁 신호 카운트
    relatedKeywords.forEach(item => {
      const keyword = item.keyword.toLowerCase();
      
      // 높은 경쟁 신호
      for (const signal of this.competitionSignals.high) {
        if (keyword.includes(signal)) {
          highSignalCount++;
          break;
        }
      }
      
      // 중간 경쟁 신호
      for (const signal of this.competitionSignals.medium) {
        if (keyword.includes(signal)) {
          mediumSignalCount++;
          break;
        }
      }
      
      // 낮은 경쟁 신호
      for (const signal of this.competitionSignals.low) {
        if (keyword.includes(signal)) {
          lowSignalCount++;
          break;
        }
      }
    });
    
    // 가중 점수 계산
    const weightedScore = (
      (highSignalCount * 3) + 
      (mediumSignalCount * 2) + 
      (lowSignalCount * 1)
    ) / (relatedKeywords.length * 3) * 100;
    
    return Math.min(100, weightedScore);
  }
  
  /**
   * 구매 의도 점수 계산
   * @param {Array} relatedKeywords - 연관 키워드 배열
   * @returns {number} 구매 의도 점수 (0-100)
   * @private
   */
  _calculatePurchaseIntentScore(relatedKeywords) {
    if (!relatedKeywords || relatedKeywords.length === 0) {
      return 50; // 기본값
    }
    
    let highSignalCount = 0;
    let mediumSignalCount = 0;
    let lowSignalCount = 0;
    
    // 키워드별 구매 의도 신호 카운트
    relatedKeywords.forEach(item => {
      const keyword = item.keyword.toLowerCase();
      
      // 높은 구매 의도 신호
      for (const signal of this.purchaseIntentSignals.high) {
        if (keyword.includes(signal)) {
          highSignalCount++;
          break;
        }
      }
      
      // 중간 구매 의도 신호
      for (const signal of this.purchaseIntentSignals.medium) {
        if (keyword.includes(signal)) {
          mediumSignalCount++;
          break;
        }
      }
      
      // 낮은 구매 의도 신호
      for (const signal of this.purchaseIntentSignals.low) {
        if (keyword.includes(signal)) {
          lowSignalCount++;
          break;
        }
      }
    });
    
    // 가중 점수 계산
    const weightedScore = (
      (highSignalCount * 3) + 
      (mediumSignalCount * 2) + 
      (lowSignalCount * 1)
    ) / (relatedKeywords.length * 3) * 100;
    
    return Math.min(100, weightedScore);
  }
  
  /**
   * 계절성 분석
   * @param {string} keyword - 키워드
   * @param {Object} data - 수집 데이터
   * @returns {Object} 계절성 분석 결과
   * @private
   */
  _analyzeSeasonality(keyword, data) {
    const normalizedKeyword = keyword.toLowerCase();
    const seasonality = {
      score: 0,
      pattern: 'none',
      seasons: {
        spring: 0,
        summer: 0,
        fall: 0,
        winter: 0
      }
    };
    
    // 1. 키워드 기반 계절성 평가
    for (const [season, patterns] of Object.entries(this.seasonalPatterns)) {
      for (const pattern of patterns) {
        if (normalizedKeyword.includes(pattern)) {
          seasonality.seasons[season] += 1;
        }
      }
    }
    
    // 2. 트렌드 데이터 기반 계절성 평가
    let trends = [];
    
    if (data.trends && data.trends.results && data.trends.results.length > 0) {
      trends = data.trends.results[0].data;
    } else if (data.insights && data.insights.trends) {
      trends = data.insights.trends;
    }
    
    if (trends.length > 0) {
      // 월별 데이터 그룹화
      const monthlyData = {};
      
      trends.forEach(item => {
        const month = new Date(item.period).getMonth();
        if (!monthlyData[month]) {
          monthlyData[month] = [];
        }
        monthlyData[month].push(item.value || item.ratio * 100);
      });
      
      // 계절별 평균 검색량 계산
      const seasonMonths = {
        spring: [2, 3, 4], // 3-5월
        summer: [5, 6, 7], // 6-8월
        fall: [8, 9, 10],  // 9-11월
        winter: [11, 0, 1] // 12-2월
      };
      
      // 계절별 데이터 계산
      for (const [season, months] of Object.entries(seasonMonths)) {
        let total = 0;
        let count = 0;
        
        months.forEach(month => {
          if (monthlyData[month] && monthlyData[month].length > 0) {
            total += monthlyData[month].reduce((sum, val) => sum + val, 0);
            count += monthlyData[month].length;
          }
        });
        
        const average = count > 0 ? total / count : 0;
        seasonality.seasons[season] = average;
      }
    }
    
    // 3. 우세한 계절 결정
    let dominantSeason = 'none';
    let maxScore = 0;
    
    for (const [season, score] of Object.entries(seasonality.seasons)) {
      if (score > maxScore) {
        maxScore = score;
        dominantSeason = season;
      }
    }
    
    // 4. 계절성 점수 계산 (계절 간 변동성)
    const values = Object.values(seasonality.seasons);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // 표준편차를 0-100 점수로 변환 (높은 표준편차 = 높은 계절성)
    seasonality.score = Math.min(100, stdDev * 10);
    seasonality.pattern = dominantSeason;
    
    return seasonality;
  }
  
  /**
   * 복합 점수 계산
   * @param {Object} scores - 개별 점수 객체
   * @returns {number} 복합 점수 (0-100)
   * @private
   */
  _calculateCompositeScore(scores) {
    // 가중치 설정
    const weights = {
      searchVolume: 0.25,   // 검색량 (중요)
      competition: 0.20,    // 경쟁 강도
      purchaseIntent: 0.25, // 구매 의도 (중요)
      growth: 0.20,         // 성장률
      seasonality: 0.10     // 계절성
    };
    
    // 가중 평균 계산
    return utils.weightedScore(scores, weights);
  }
  
  /**
   * 인사이트 생성
   * @param {string} keyword - 키워드
   * @param {Object} analysis - 분석 결과
   * @returns {Array} 인사이트 배열
   * @private
   */
  _generateInsights(keyword, analysis) {
    const insights = [];
    const { scores, trends, relatedKeywords } = analysis;
    
    // 1. 검색량 기반 인사이트
    if (scores.searchVolume > 75) {
      insights.push({
        type: 'volume',
        level: 'high',
        message: `'${keyword}'는 높은 검색량을 가진 인기 키워드입니다. 주요 상품 페이지와 마케팅 자료에 적극 활용하세요.`
      });
    } else if (scores.searchVolume < 30) {
      insights.push({
        type: 'volume',
        level: 'low',
        message: `'${keyword}'는 검색량이 적은 틈새 키워드입니다. 더 많이 검색되는 유사 키워드를 고려해보세요.`
      });
    }
    
    // 2. 경쟁 강도 기반 인사이트
    if (scores.competition > 70) {
      insights.push({
        type: 'competition',
        level: 'high',
        message: `'${keyword}'는 경쟁이 매우 치열한 키워드입니다. 더 구체적인 하위 키워드로 타겟팅하는 것이 효과적일 수 있습니다.`
      });
    } else if (scores.competition < 30) {
      insights.push({
        type: 'competition',
        level: 'low',
        message: `'${keyword}'는 경쟁이 상대적으로 낮은 기회 키워드입니다. 이 키워드에 집중하면 효율적인 트래픽을 확보할 수 있습니다.`
      });
    }
    
    // 3. 구매 의도 기반 인사이트
    if (scores.purchaseIntent > 70) {
      insights.push({
        type: 'intent',
        level: 'high',
        message: `'${keyword}'는 구매 의도가 높은 키워드입니다. 상품 페이지와 광고에서 우선순위를 두고 전환율을 최적화하세요.`
      });
    } else if (scores.purchaseIntent < 30) {
      insights.push({
        type: 'intent',
        level: 'low',
        message: `'${keyword}'는 정보 탐색 목적의 키워드로 보입니다. 교육적 콘텐츠를 제공하여 잠재 고객을 유치하세요.`
      });
    }
    
    // 4. 성장률 기반 인사이트
    if (scores.growth > 70) {
      insights.push({
        type: 'growth',
        level: 'high',
        message: `'${keyword}'는 성장세가 강한 트렌드 키워드입니다. 빠르게 콘텐츠를 최적화하여 초기 기회를 잡으세요.`
      });
    } else if (scores.growth < 30) {
      insights.push({
        type: 'growth',
        level: 'declining',
        message: `'${keyword}'는 하락 추세에 있는 키워드입니다. 장기적인 전략에서 다른 키워드로 중심을 옮기는 것이 좋습니다.`
      });
    }
    
    // 5. 계절성 기반 인사이트
    if (analysis.seasonality && analysis.seasonality.score > 60) {
      const season = analysis.seasonality.pattern;
      let seasonKr = '연중';
      
      if (season === 'spring') seasonKr = '봄철';
      else if (season === 'summer') seasonKr = '여름철';
      else if (season === 'fall') seasonKr = '가을철';
      else if (season === 'winter') seasonKr = '겨울철';
      
      insights.push({
        type: 'seasonality',
        level: 'significant',
        message: `'${keyword}'는 ${seasonKr}에 검색량이 증가하는 계절성 키워드입니다. 시즌 마케팅을 미리 준비하세요.`
      });
    }
    
    // 6. 추천 연관 키워드
    if (relatedKeywords && relatedKeywords.length > 0) {
      // 구매 의도가 높은 연관 키워드 찾기
      const highIntentKeywords = relatedKeywords
        .filter(item => {
          const keyword = item.keyword.toLowerCase();
          return this.purchaseIntentSignals.high.some(signal => keyword.includes(signal));
        })
        .map(item => item.keyword)
        .slice(0, 3);
      
      if (highIntentKeywords.length > 0) {
        insights.push({
          type: 'recommendation',
          level: 'high_intent',
          message: `구매 의도가 높은 연관 키워드: ${highIntentKeywords.join(', ')} - 이 키워드들을 상품 페이지에 추가하세요.`
        });
      }
    }
    
    return insights;
  }
  
  /**
   * 키워드 랭킹 분석
   * @param {Array} keywords - 분석할 키워드 배열
   * @returns {Promise<Array>} 랭킹 결과
   */
  async analyzeKeywordRanking(keywords) {
    const results = [];
    
    // 병렬 분석 실행 (5개씩 배치 처리)
    const batchSize = 5;
    
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      const promises = batch.map(keyword => this.analyzeKeyword(keyword));
      
      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          logger.error(`키워드 '${batch[index]}' 분석 실패: ${result.reason.message}`);
        }
      });
    }
    
    // 복합 점수 기준으로 정렬
    return results.sort((a, b) => {
      return b.analysis.scores.composite - a.analysis.scores.composite;
    });
  }
  
  /**
   * 키워드 추천 생성
   * @param {string} baseKeyword - 기준 키워드
   * @param {number} limit - 추천 개수
   * @returns {Promise<Array>} 추천 키워드 배열
   */
  async generateKeywordRecommendations(baseKeyword, limit = 10) {
    try {
      // 기준 키워드 분석
      const baseAnalysis = await this.analyzeKeyword(baseKeyword);
      
      // 연관 키워드 추출
      const relatedKeywords = baseAnalysis.analysis.relatedKeywords
        .map(item => item.keyword)
        .filter(kw => kw !== baseKeyword);
      
      // 중복 제거
      const uniqueKeywords = [...new Set(relatedKeywords)];
      
      // 추천 키워드 수 제한
      const recommendKeywords = uniqueKeywords.slice(0, Math.min(limit * 2, 20));
      
      // 추천 키워드 분석
      const recommendations = await this.analyzeKeywordRanking(recommendKeywords);
      
      // 상위 키워드 반환
      return recommendations.slice(0, limit);
    } catch (error) {
      logger.error(`키워드 추천 생성 실패: ${error.message}`, { baseKeyword });
      throw error;
    }
  }
}

module.exports = new KeywordAnalyzer();
