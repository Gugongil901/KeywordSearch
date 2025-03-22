// src/services/nicheKeywordService.ts
import { logger } from '../utils/logger';
import { cacheManager } from '../utils/cacheManager';
import { KeywordData, NicheKeywordResult, KeywordMetrics, KeywordOpportunityScore } from '../types/keywords';
import keywordAnalysisService from './keywordAnalysisService';
import { dataLabClient, searchAdClient, generateAdApiHeaders } from '../config/naverApi';

// 캐시 키 설정
const CACHE_KEY_NICHE_KEYWORDS = 'niche_keywords';
const CACHE_TTL = 86400; // 1일 (초 단위)

/**
 * 소형 키워드 분석 서비스
 * 건강기능식품 시장에서 경쟁이 적고 성장 잠재력이 높은 키워드를 발굴
 */
export class NicheKeywordService {
  /**
   * 소형 틈새 키워드를 찾아내는 고급 알고리즘
   * @param category - 검색할 상위 카테고리 (예: 건강기능식품)
   * @param options - 검색 옵션 및 임계값 설정
   * @returns 틈새 키워드 분석 결과
   */
  async findNicheKeywords(
    category: string = '건강기능식품',
    options: {
      minSearchVolume?: number;  // 최소 검색량
      maxCompetition?: number;   // 최대 경쟁강도
      minGrowthRate?: number;    // 최소 성장률
      minProfitPotential?: number; // 최소 수익 잠재력
      seasonalityFactor?: boolean; // 계절성 고려 여부
      limit?: number;            // 결과 제한 수
      includeTrends?: boolean;   // 트렌드 데이터 포함 여부
    } = {}
  ): Promise<NicheKeywordResult> {
    // 기본 옵션 설정
    const {
      minSearchVolume = 100,
      maxCompetition = 0.4,
      minGrowthRate = 1.1,
      minProfitPotential = 0.5,
      seasonalityFactor = true,
      limit = 50,
      includeTrends = true
    } = options;

    // 캐시 키 생성 (옵션에 기반한 유니크 키)
    const cacheKey = `${CACHE_KEY_NICHE_KEYWORDS}_${category}_${JSON.stringify(options)}`;
    
    // 캐시 확인
    const cachedResult = await cacheManager.get(cacheKey);
    if (cachedResult) {
      logger.info(`캐시에서 틈새 키워드 데이터 로드: ${category}`);
      return cachedResult as NicheKeywordResult;
    }

    try {
      // 1. 키워드 기본 데이터 수집
      const baseKeywords = await this.collectBaseKeywords(category);
      
      // 2. 키워드 메트릭스 계산
      const keywordsWithMetrics = await this.calculateKeywordMetrics(baseKeywords);
      
      // 3. 소형 틈새 키워드 필터링
      const nicheKeywords = keywordsWithMetrics.filter(keyword => {
        // 기본 필터링 기준
        const basicFilter = (
          keyword.searchVolume >= minSearchVolume &&
          keyword.competition <= maxCompetition &&
          keyword.growthRate >= minGrowthRate &&
          keyword.profitPotential >= minProfitPotential
        );
        
        // 계절성 고려 (선택적)
        if (seasonalityFactor && keyword.seasonality > 0.5) {
          // 계절성이 높은 키워드는 현재 시즌에 맞는지 확인
          return this.isCurrentlyInSeason(keyword) && basicFilter;
        }
        
        return basicFilter;
      });
      
      // 4. 기회 점수 계산 및 정렬
      const scoredKeywords = this.calculateOpportunityScore(nicheKeywords);
      
      // 5. 결과 제한 및 포맷팅
      const topNicheKeywords = scoredKeywords
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, limit);
      
      // 6. 트렌드 데이터 추가 (선택적)
      let keywordTrends = {};
      if (includeTrends && topNicheKeywords.length > 0) {
        keywordTrends = await this.getKeywordTrends(
          topNicheKeywords.map(k => k.keyword)
        );
      }
      
      // 7. 결과 구성
      const result: NicheKeywordResult = {
        category,
        totalKeywordsAnalyzed: baseKeywords.length,
        nicheKeywordsFound: topNicheKeywords.length,
        keywordOpportunities: topNicheKeywords,
        searchCriteria: {
          minSearchVolume,
          maxCompetition,
          minGrowthRate,
          minProfitPotential,
          seasonalityFactorApplied: seasonalityFactor
        },
        trends: keywordTrends,
        recommendedActions: this.generateRecommendedActions(topNicheKeywords),
        timestamp: new Date().toISOString()
      };
      
      // 8. 결과 캐싱
      await cacheManager.set(cacheKey, result, CACHE_TTL);
      
      return result;
    } catch (error) {
      logger.error('틈새 키워드 분석 중 오류 발생:', error);
      throw new Error(`틈새 키워드 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }
  
  /**
   * 네이버 API를 통해 기본 키워드 데이터를 수집
   * @param category - 검색할 카테고리
   * @returns 기본 키워드 데이터 배열
   */
  private async collectBaseKeywords(category: string): Promise<KeywordData[]> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const uri = '/keywordstool';
      const headers = generateAdApiHeaders('GET', uri, timestamp);
      
      // 네이버 검색광고 API를 통해 키워드 데이터 가져오기
      const response = await searchAdClient.get(
        `${uri}?hintKeywords=${encodeURIComponent(category)}&showDetail=1`, 
        { headers }
      );
      
      if (!response.data || !response.data.keywordList) {
        throw new Error('키워드 데이터를 가져오는데 실패했습니다.');
      }
      
      // 기본 데이터 변환
      return response.data.keywordList.map((item: any) => ({
        keyword: item.relKeyword,
        searchVolume: item.monthlyPcQcCnt + item.monthlyMobileQcCnt,
        competition: item.compIdx,
        pcClicks: item.monthlyAvePcClkCnt,
        mobileClicks: item.monthlyAveMobileClkCnt,
        clickCost: item.avgPcClkCost,
        competitorCount: item.plAvgDepth || 0,
        commercialIntent: this.estimateCommercialIntent(item),
        categoryRelevance: 1.0, // 기본값, 후속 분석에서 조정
        rawData: item
      }));
    } catch (error) {
      logger.error('기본 키워드 수집 중 오류:', error);
      throw error;
    }
  }
  
  /**
   * 키워드 메트릭스를 계산하여 분석 데이터 강화
   * @param keywords - 기본 키워드 데이터
   * @returns 메트릭스가 추가된 키워드 데이터
   */
  private async calculateKeywordMetrics(keywords: KeywordData[]): Promise<KeywordMetrics[]> {
    try {
      // 최소/최대 검색량 계산 (정규화용)
      const volumes = keywords.map(k => k.searchVolume);
      const minVolume = Math.min(...volumes);
      const maxVolume = Math.max(...volumes);
      
      // 카테고리 관련성 점수 계산 (건강기능식품 관련 키워드)
      const healthKeywords = [
        '영양제', '비타민', '프로바이오틱스', '오메가3', '루테인', '콜라겐',
        '칼슘', '마그네슘', '아연', '철분', '비타민D', '비타민C', '글루타민',
        '효소', '유산균', '홍삼', '녹용', '홍경천', '밀크씨슬', '피로회복',
        '면역력', '관절', '혈압', '혈당', '콜레스테롤', '다이어트', '체중감량'
      ];
      
      // 시계열 데이터로 성장률 예측 (가상의 데이터 사용)
      // 실제 구현에서는 히스토리컬 데이터를 활용해야 함
      const growthRates = await this.simulateHistoricalGrowth(keywords);
      
      // 계절성 계산 (가상의 데이터 사용)
      const seasonality = await this.analyzeSeasonality(keywords);
      
      // 메트릭스 계산
      return keywords.map((keyword, idx) => {
        // 검색량 점수 정규화 (0~1)
        const volumeScore = maxVolume > minVolume
          ? (keyword.searchVolume - minVolume) / (maxVolume - minVolume)
          : 0.5;
        
        // 카테고리 관련성 계산
        const relevanceScore = healthKeywords.some(term => 
          keyword.keyword.toLowerCase().includes(term.toLowerCase())
        ) ? 1.0 : 0.7;
        
        // 수익 잠재력 계산
        const profitPotential = this.calculateProfitPotential(
          keyword.searchVolume,
          keyword.competition,
          keyword.commercialIntent,
          keyword.clickCost
        );
        
        // 메트릭스 객체 구성
        return {
          ...keyword,
          categoryRelevance: relevanceScore,
          growthRate: growthRates[idx] || 1.0,
          profitPotential,
          seasonality: seasonality[idx] || 0.0,
          volumeScore
        };
      });
    } catch (error) {
      logger.error('키워드 메트릭스 계산 중 오류:', error);
      throw error;
    }
  }
  
  /**
   * 기회 점수를 계산하여 가장 유망한 키워드 식별
   * @param keywords - 메트릭스가 계산된 키워드 배열
   * @returns 기회 점수가 추가된 키워드 배열
   */
  private calculateOpportunityScore(keywords: KeywordMetrics[]): KeywordOpportunityScore[] {
    // 가중치 설정
    const weights = {
      searchVolume: 0.2,      // 검색량
      competition: 0.25,      // 경쟁 정도 (낮을수록 좋음)
      growthRate: 0.2,        // 성장률
      profitPotential: 0.25,  // 수익성
      relevance: 0.1          // 카테고리 관련성
    };
    
    return keywords.map(keyword => {
      // 경쟁 점수 계산 (낮을수록 좋으므로 역산)
      const competitionScore = 1 - keyword.competition;
      
      // 기회 점수 계산
      const opportunityScore = (
        weights.searchVolume * keyword.volumeScore +
        weights.competition * competitionScore +
        weights.growthRate * (keyword.growthRate > 1 ? (keyword.growthRate - 1) / 0.5 : 0) +
        weights.profitPotential * keyword.profitPotential +
        weights.relevance * keyword.categoryRelevance
      );
      
      // 경쟁 난이도 등급 부여
      const competitionLevel = this.determineCompetitionLevel(keyword.competition);
      
      // 추천 마케팅 채널 결정
      const recommendedChannels = this.recommendMarketingChannels(keyword);
      
      return {
        ...keyword,
        opportunityScore: parseFloat(opportunityScore.toFixed(2)),
        competitionLevel,
        recommendedChannels,
        difficultyLevel: this.getDifficultyLevel(opportunityScore)
      };
    });
  }
  
  /**
   * 추천 마케팅 채널 결정
   * @param keyword - 키워드 메트릭스
   * @returns 추천 마케팅 채널 배열
   */
  private recommendMarketingChannels(keyword: KeywordMetrics): string[] {
    const channels = [];
    
    // 검색량이 높고 경쟁이 낮으면 SEO에 적합
    if (keyword.searchVolume > 300 && keyword.competition < 0.4) {
      channels.push('SEO');
    }
    
    // 상업적 의도가 높고 수익 잠재력이 좋으면 PPC에 적합
    if (keyword.commercialIntent > 0.7 && keyword.profitPotential > 0.6) {
      channels.push('PPC');
    }
    
    // 성장률이 높으면 컨텐츠 마케팅에 적합
    if (keyword.growthRate > 1.2) {
      channels.push('컨텐츠 마케팅');
    }
    
    // 검색량이 적지만 관련성이 높으면 소셜 미디어에 적합
    if (keyword.searchVolume < 500 && keyword.categoryRelevance > 0.8) {
      channels.push('소셜 미디어');
    }
    
    // 적어도 하나는 추천
    if (channels.length === 0) {
      channels.push('SEO');
    }
    
    return channels;
  }
  
  /**
   * 경쟁 난이도 수준 결정
   * @param competitionIndex - 경쟁 지수 (0~1)
   * @returns 경쟁 난이도 레벨 문자열
   */
  private determineCompetitionLevel(competitionIndex: number): string {
    if (competitionIndex < 0.2) return '매우 낮음';
    if (competitionIndex < 0.4) return '낮음';
    if (competitionIndex < 0.6) return '중간';
    if (competitionIndex < 0.8) return '높음';
    return '매우 높음';
  }
  
  /**
   * 기회 점수에 따른 난이도 레벨 결정
   * @param score - 기회 점수
   * @returns 난이도 레벨
   */
  private getDifficultyLevel(score: number): string {
    if (score > 0.8) return '매우 쉬움';
    if (score > 0.6) return '쉬움';
    if (score > 0.4) return '보통';
    if (score > 0.2) return '어려움';
    return '매우 어려움';
  }
  
  /**
   * 연관 키워드 그룹에 대한 추천 액션 생성
   * @param keywords - 소형 키워드 배열
   * @returns 추천 액션 객체
   */
  private generateRecommendedActions(keywords: KeywordOpportunityScore[]): any {
    // 키워드 그룹화
    const groups = this.groupKeywordsByTopic(keywords);
    
    // 그룹별 추천 액션 생성
    const recommendations = Object.keys(groups).map(topic => {
      const topicKeywords = groups[topic];
      const avgOpportunity = topicKeywords.reduce((sum, k) => sum + k.opportunityScore, 0) / topicKeywords.length;
      const topChannels = this.findTopChannels(topicKeywords);
      
      return {
        topic,
        keywordCount: topicKeywords.length,
        opportunityScore: parseFloat(avgOpportunity.toFixed(2)),
        suggestedChannels: topChannels,
        primaryKeywords: topicKeywords
          .sort((a, b) => b.opportunityScore - a.opportunityScore)
          .slice(0, 3)
          .map(k => k.keyword)
      };
    }).sort((a, b) => b.opportunityScore - a.opportunityScore);
    
    return {
      topKeywordGroups: recommendations.slice(0, 5),
      overallStrategy: this.determineOverallStrategy(keywords)
    };
  }
  
  /**
   * 키워드를 주제별로 그룹화
   * @param keywords - 키워드 배열
   * @returns 주제별 그룹화된 키워드 맵
   */
  private groupKeywordsByTopic(keywords: KeywordOpportunityScore[]): Record<string, KeywordOpportunityScore[]> {
    // 단순화된 그룹화 로직 (실제로는 NLP나 클러스터링 알고리즘 사용 권장)
    const groups: Record<string, KeywordOpportunityScore[]> = {};
    
    // 건강기능식품 관련 주요 카테고리
    const topics = [
      '비타민', '미네랄', '프로바이오틱스', '오메가3', '식이섬유', 
      '단백질', '다이어트', '관절', '눈건강', '간건강', '장건강', 
      '피부건강', '면역력', '혈관건강', '혈당', '콜레스테롤', '수면', '스트레스'
    ];
    
    // 각 키워드를 가장 관련성 높은 주제에 할당
    keywords.forEach(keyword => {
      const matchedTopic = topics.find(topic => 
        keyword.keyword.toLowerCase().includes(topic.toLowerCase())
      );
      
      const topic = matchedTopic || '기타';
      
      if (!groups[topic]) {
        groups[topic] = [];
      }
      
      groups[topic].push(keyword);
    });
    
    // 빈 그룹 제거
    return Object.fromEntries(Object.entries(groups).filter(([_, items]) => items.length > 0));
  }
  
  /**
   * 키워드 그룹에서 가장 효과적인 마케팅 채널 찾기
   * @param keywords - 키워드 그룹
   * @returns 추천 채널 배열
   */
  private findTopChannels(keywords: KeywordOpportunityScore[]): string[] {
    // 채널별 빈도수 계산
    const channelCounts: Record<string, number> = {};
    
    keywords.forEach(keyword => {
      keyword.recommendedChannels.forEach(channel => {
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      });
    });
    
    // 가장 빈번한 채널 선택 (최대 3개)
    return Object.entries(channelCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([channel]) => channel);
  }
  
  /**
   * 전체 키워드 세트에 대한 마케팅 전략 결정
   * @param keywords - 분석된 키워드 배열
   * @returns 전략 문자열
   */
  private determineOverallStrategy(keywords: KeywordOpportunityScore[]): string {
    // 기회 점수 평균
    const avgOpportunity = keywords.reduce((sum, k) => sum + k.opportunityScore, 0) / keywords.length;
    
    // 경쟁 지수 평균
    const avgCompetition = keywords.reduce((sum, k) => sum + k.competition, 0) / keywords.length;
    
    // 검색량 평균
    const avgVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0) / keywords.length;
    
    // 전략 결정
    if (avgOpportunity > 0.7) {
      if (avgCompetition < 0.3) {
        return "틈새 키워드 집중 공략 - 빠른 성장이 가능한 키워드에 리소스 집중";
      } else {
        return "수익성 기반 선택적 접근 - 경쟁이 있지만 가치가 높은 키워드 선별적 공략";
      }
    } else if (avgOpportunity > 0.4) {
      if (avgVolume > 500) {
        return "브랜딩 강화 전략 - 중간 수준 경쟁의 주요 키워드에 브랜드 노출 확대";
      } else {
        return "롱테일 키워드 확장 - 다양한 롱테일 키워드로 트래픽 유입 다각화";
      }
    } else {
      return "틈새 카테고리 개발 - 신규 키워드 개발 및 컨텐츠 강화로 시장 개척";
    }
  }
  
  /**
   * 상업적 의도 추정 (검색 광고를 클릭할 가능성)
   * @param keywordData - 네이버 API 응답 키워드 데이터
   * @returns 상업적 의도 점수 (0~1)
   */
  private estimateCommercialIntent(keywordData: any): number {
    // 간단한 상업적 의도 추정 로직
    // 실제로는 더 복잡한 모델 사용 권장
    
    // 클릭당 비용이 높을수록 상업적 의도가 높음
    const costFactor = Math.min(keywordData.avgPcClkCost / 2000, 1);
    
    // 클릭률이 높을수록 상업적 의도가 높음
    const clickFactor = keywordData.monthlyAvePcClkCnt > 0 && keywordData.monthlyPcQcCnt > 0
      ? Math.min(keywordData.monthlyAvePcClkCnt / keywordData.monthlyPcQcCnt, 1)
      : 0.5;
    
    // 경쟁이 치열할수록 상업적 의도가 높음
    const competitionFactor = keywordData.compIdx;
    
    // 가중 평균
    return (costFactor * 0.4) + (clickFactor * 0.3) + (competitionFactor * 0.3);
  }
  
  /**
   * 수익 잠재력 계산
   * @param searchVolume - 검색량
   * @param competition - 경쟁 지수
   * @param commercialIntent - 상업적 의도
   * @param clickCost - 클릭당 비용
   * @returns 수익 잠재력 점수 (0~1)
   */
  private calculateProfitPotential(
    searchVolume: number,
    competition: number,
    commercialIntent: number,
    clickCost: number
  ): number {
    // 검색량 정규화 (최대 10000)
    const volumeFactor = Math.min(searchVolume / 10000, 1);
    
    // 경쟁 역산 (낮을수록 좋음)
    const competitionFactor = 1 - competition;
    
    // 비용 대비 가치 (높은 상업적 의도, 낮은 클릭 비용이 좋음)
    const valueFactor = commercialIntent / (Math.max(1, clickCost / 1000));
    
    // 가중 평균
    return (volumeFactor * 0.3) + (competitionFactor * 0.4) + (valueFactor * 0.3);
  }
  
  /**
   * 계절성 분석 (키워드 검색량의 계절적 변동 분석)
   * @param keywords - 키워드 배열
   * @returns 계절성 점수 배열 (0~1)
   */
  private async analyzeSeasonality(keywords: KeywordData[]): Promise<number[]> {
    // 실제 구현에서는 과거 시계열 데이터를 분석하여 계절성 패턴 파악
    // 여기서는 시뮬레이션을 위해 간단한 예시 데이터 사용
    
    // 계절성이 강한 키워드 패턴
    const seasonalKeywordPatterns = [
      { pattern: '다이어트', season: 'spring', value: 0.8 },
      { pattern: '체중', season: 'spring', value: 0.7 },
      { pattern: '비타민D', growth: 1.4 },
      { pattern: '오메가3', growth: 1.3 },
      { pattern: '유산균', growth: 1.6 },
      { pattern: '콜라겐', growth: 1.2 },
      { pattern: '루테인', growth: 1.1 },
      { pattern: '홍삼', growth: 0.9 },
      { pattern: '다이어트', growth: 1.0 },
    ];
    
    // 각 키워드의 성장률 계산
    return keywords.map(keyword => {
      const matchedPattern = growthPatterns.find(pattern => 
        keyword.keyword.toLowerCase().includes(pattern.pattern.toLowerCase())
      );
      
      if (matchedPattern) {
        return matchedPattern.growth;
      }
      
      // 기본 성장률 (약간의 랜덤성 추가)
      return 0.9 + (Math.random() * 0.4);
    });
  }
  
  /**
   * 키워드 트렌드 데이터 가져오기
   * @param keywords - 키워드 배열
   * @returns 트렌드 데이터 객체
   */
  private async getKeywordTrends(keywords: string[]): Promise<any> {
    try {
      // 날짜 범위 설정 (최근 6개월)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };
      
      // 네이버 데이터랩 API 요청
      const response = await dataLabClient.post('/shopping/category/keywords', {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        timeUnit: 'month',
        category: '50000008', // 건강기능식품 카테고리 코드
        keyword: keywords.slice(0, 5).map(keyword => ({ name: keyword, param: [keyword] })),
        device: 'pc',
        ages: ['20', '30', '40', '50', '60'],
        gender: 'f'
      });
      
      return response.data;
    } catch (error) {
      logger.error('키워드 트렌드 데이터 가져오기 실패:', error);
      return {}; // 오류 시 빈 객체 반환
    }
  }
}

export default new NicheKeywordService(); season: 'winter', value: 0.7 },
      { pattern: '비타민C', season: 'winter', value: 0.6 },
      { pattern: '면역', season: 'winter', value: 0.9 },
      { pattern: '피부', season: 'summer', value: 0.7 },
      { pattern: '자외선', season: 'summer', value: 0.9 },
      { pattern: '수면', season: 'all', value: 0.2 },
      { pattern: '관절', season: 'all', value: 0.3 },
      { pattern: '피로', season: 'all', value: 0.3 },
    ];
    
    // 현재 계절 결정
    const currentMonth = new Date().getMonth();
    let currentSeason;
    
    if (currentMonth >= 2 && currentMonth <= 4) currentSeason = 'spring';
    else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = 'summer';
    else if (currentMonth >= 8 && currentMonth <= 10) currentSeason = 'fall';
    else currentSeason = 'winter';
    
    // 각 키워드의 계절성 점수 계산
    return keywords.map(keyword => {
      const matchedPattern = seasonalKeywordPatterns.find(pattern => 
        keyword.keyword.toLowerCase().includes(pattern.pattern.toLowerCase())
      );
      
      if (matchedPattern) {
        if (matchedPattern.season === 'all' || matchedPattern.season === currentSeason) {
          return matchedPattern.value;
        }
        return matchedPattern.value * 0.3; // 다른 계절일 경우 감소
      }
      
      return 0.1; // 기본값 (낮은 계절성)
    });
  }
  
  /**
   * 현재 키워드가 시즌에 맞는지 확인
   * @param keyword - 키워드 메트릭스
   * @returns 시즌 적합성 여부
   */
  private isCurrentlyInSeason(keyword: KeywordMetrics): boolean {
    // 실제 구현에서는 더 복잡한 시즌 적합성 분석
    // 이 예시에서는 계절성이 0.6 이상이면 시즌에 맞는 것으로 가정
    return keyword.seasonality >= 0.6;
  }
  
  /**
   * 키워드 성장률 시뮬레이션 (실제로는 과거 데이터 사용)
   * @param keywords - 키워드 배열
   * @returns 성장률 배열
   */
  private async simulateHistoricalGrowth(keywords: KeywordData[]): Promise<number[]> {
    // 성장 트렌드가 있는 키워드 패턴 (실제로는 API 데이터 사용)
    const growthPatterns = [
      { pattern: '프로바이오틱스', growth: 1.5 },
      { pattern: '면역력', growth: 1.3 },
      { pattern: '장건강', growth: 1.2 },
      { pattern: '비타민D',