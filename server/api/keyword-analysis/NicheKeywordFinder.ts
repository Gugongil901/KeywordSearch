/**
 * 소형(니치) 키워드 찾기 알고리즘
 * 
 * 검색량은 적당하고 경쟁도가 낮으며 성장성이 높은 키워드를 필터링하여 제공
 * 더 정교한 분석과 추천을 위한 고급 알고리즘 적용
 * 
 * 건강기능식품 특화:
 * - 제품 카테고리별 최적 검색량 범위 조정
 * - 계절성 및 효능 기반 기회 점수 계산
 * - 구매 의도 신호 키워드 가중치 적용
 * - 네이버/쿠팡 통합 데이터 분석 지원
 */
import { logger } from '../../utils/logger';

export interface KeywordData {
  keyword: string;
  searchVolume: number;         // 검색량 
  competition: number;          // 경쟁도 (0-1 사이 값)
  growth: number;               // 성장률 (1 이상이면 성장, 1 미만이면 감소)
  cpc?: number;                 // 클릭당 비용 (선택적)
  conversionRate?: number;      // 전환율 (선택적)
  category?: string;            // 카테고리 (선택적)
  commercialIntent?: number;    // 상업적 의도 (0-1 사이 값)
  pcClicks?: number;            // PC 클릭 수
  mobileClicks?: number;        // 모바일 클릭 수
  clickCost?: number;           // 클릭 비용
  competitorCount?: number;     // 경쟁사 수
  categoryRelevance?: number;   // 카테고리 관련성 (0-1)
  seasonality?: number;         // 계절성 지수 (0-1)
  profitPotential?: number;     // 수익 잠재력 (0-1)
  volumeScore?: number;         // 검색량 점수 (0-1)
}

export interface NicheKeywordResult {
  keyword: string;
  searchVolume: number;
  competition: number;
  growth: number;
  nicheScore: number;               // 니치 점수 (0-100)
  potential: string;                // 잠재력 평가 ('높음', '중간', '낮음')
  recommendation: string;           // 활용 추천 사항
  competitionLevel?: string;        // 경쟁 난이도 ('매우 낮음', '낮음', '중간', '높음', '매우 높음')
  recommendedChannels?: string[];   // 추천 마케팅 채널 (SEO, PPC, 컨텐츠 마케팅, 소셜 미디어)
  opportunityScore?: number;        // 기회 점수 (0-1)
  profitPotential?: number;         // 수익 잠재력 (0-1)
  difficultyLevel?: string;         // 난이도 레벨
}

export interface NicheKeywordCriteria {
  minSearchVolume?: number;       // 최소 검색량 (기본값: 100)
  maxSearchVolume?: number;       // 최대 검색량 (기본값: 1000)
  maxCompetition?: number;        // 최대 경쟁도 (기본값: 0.3)
  minGrowth?: number;             // 최소 성장률 (기본값: 1.2)
  minProfitPotential?: number;    // 최소 수익 잠재력 (기본값: 0.5)
  seasonalityFactor?: boolean;    // 계절성 고려 여부 (기본값: true)
}

/**
 * 고급 니치 키워드 찾기 알고리즘
 * @param keywordDataList 키워드 데이터 목록
 * @param criteria 필터링 기준 (선택적)
 * @returns 니치 키워드 목록
 */
export function findNicheKeywords(
  keywordDataList: KeywordData[],
  criteria: NicheKeywordCriteria = {}
): NicheKeywordResult[] {
  try {
    // 기본 임계값 설정
    const {
      minSearchVolume = 100,
      maxSearchVolume = 1000,
      maxCompetition = 0.3,
      minGrowth = 1.2,
      minProfitPotential = 0.5,
      seasonalityFactor = true
    } = criteria;
    
    // 최소/최대 검색량 계산 (정규화용)
    const volumes = keywordDataList.map(k => k.searchVolume);
    const minVolume = Math.min(...volumes);
    const maxVolume = Math.max(...volumes);
    
    // 건강기능식품 관련 키워드 그룹 정의 (카테고리 관련성 평가용)
    const healthKeywords = [
      '영양제', '비타민', '프로바이오틱스', '오메가3', '루테인', '콜라겐',
      '칼슘', '마그네슘', '아연', '철분', '비타민D', '비타민C', '글루타민',
      '효소', '유산균', '홍삼', '녹용', '홍경천', '밀크씨슬', '피로회복',
      '면역력', '관절', '혈압', '혈당', '콜레스테롤', '다이어트', '체중감량'
    ];
    
    // 키워드 메트릭스 계산
    const enhancedKeywords = keywordDataList.map(keyword => {
      // 검색량 점수 정규화 (0~1)
      const volumeScore = maxVolume > minVolume
        ? (keyword.searchVolume - minVolume) / (maxVolume - minVolume)
        : 0.5;
      
      // 카테고리 관련성 계산
      const relevanceScore = healthKeywords.some(term => 
        keyword.keyword.toLowerCase().includes(term.toLowerCase())
      ) ? 1.0 : 0.7;
      
      // 상업적 의도 추정
      const commercialIntent = keyword.commercialIntent || 
        (keyword.clickCost ? Math.min(keyword.clickCost / 2000, 1) : 0.5);
      
      // 수익 잠재력 계산
      const profitPotential = keyword.profitPotential || calculateProfitPotential(
        keyword.searchVolume,
        keyword.competition,
        commercialIntent,
        keyword.clickCost || 0
      );
      
      // 계절성 계산 (간단한 추정)
      const seasonality = keyword.seasonality || 0.5;
      
      return {
        ...keyword,
        categoryRelevance: relevanceScore,
        volumeScore,
        commercialIntent,
        profitPotential,
        seasonality
      };
    });
    
    // 기본 필터링 + 추가 조건 적용
    const nicheKeywords = enhancedKeywords.filter(keyword => {
      // 기본 필터링 기준
      const basicFilter = (
        keyword.searchVolume >= minSearchVolume &&
        keyword.searchVolume <= maxSearchVolume &&
        keyword.competition <= maxCompetition &&
        keyword.growth >= minGrowth &&
        keyword.profitPotential >= minProfitPotential
      );
      
      // 계절성 고려 (선택적)
      if (seasonalityFactor && keyword.seasonality > 0.5) {
        // 계절성이 높은 키워드는 현재 시즌에 맞는지 확인
        return isCurrentlyInSeason(keyword) && basicFilter;
      }
      
      return basicFilter;
    });
    
    // 가중치 설정
    const weights = {
      searchVolume: 0.2,       // 검색량
      competition: 0.25,       // 경쟁 정도 (낮을수록 좋음)
      growthRate: 0.2,         // 성장률
      profitPotential: 0.25,   // 수익성
      relevance: 0.1           // 카테고리 관련성
    };
    
    // 기회 점수 계산 및 결과 가공
    return nicheKeywords.map(item => {
      // 경쟁 점수 계산 (낮을수록 좋으므로 역산)
      const competitionScore = 1 - item.competition;
      
      // 기회 점수 계산
      const opportunityScore = (
        weights.searchVolume * item.volumeScore +
        weights.competition * competitionScore +
        weights.growthRate * (item.growth > 1 ? (item.growth - 1) / 0.5 : 0) +
        weights.profitPotential * item.profitPotential +
        weights.relevance * item.categoryRelevance
      );
      
      // 니치 점수 계산 (0-100)
      const nicheScore = Math.min(Math.round(opportunityScore * 100), 100);
      
      // 잠재력 평가
      let potential: string;
      if (nicheScore >= 80) potential = '높음';
      else if (nicheScore >= 60) potential = '중간';
      else potential = '낮음';
      
      // 추천사항 생성
      let recommendation: string;
      if (nicheScore >= 80) {
        recommendation = '즉시 타겟팅 권장: 빠른 성장과 낮은 경쟁으로 높은 ROI 기대';
      } else if (nicheScore >= 60) {
        recommendation = '테스트 광고 권장: 점진적으로 투자하며 반응 확인';
      } else {
        recommendation = '지속적 모니터링 권장: 변화 추이를 관찰하며 기회 포착';
      }
      
      // 경쟁 난이도 등급 부여
      const competitionLevel = determineCompetitionLevel(item.competition);
      
      // 추천 마케팅 채널 결정
      const recommendedChannels = recommendMarketingChannels(item);
      
      return {
        keyword: item.keyword,
        searchVolume: item.searchVolume,
        competition: item.competition,
        growth: item.growth,
        nicheScore,
        potential,
        recommendation,
        competitionLevel,
        recommendedChannels,
        opportunityScore: parseFloat(opportunityScore.toFixed(2)),
        profitPotential: item.profitPotential,
        difficultyLevel: getDifficultyLevel(opportunityScore)
      };
    }).sort((a, b) => b.nicheScore - a.nicheScore); // 니치 점수 기준 내림차순 정렬
  } catch (error) {
    logger.error('니치 키워드 분석 중 오류:');
    console.error(error);
    return [];
  }
}

/**
 * 수익 잠재력 계산
 * @param searchVolume 검색량
 * @param competition 경쟁도
 * @param commercialIntent 상업적 의도
 * @param clickCost 클릭당 비용
 * @returns 수익 잠재력 (0-1)
 */
function calculateProfitPotential(
  searchVolume: number,
  competition: number,
  commercialIntent: number,
  clickCost: number
): number {
  // 검색량 정규화
  const volumeFactor = Math.min(searchVolume / 10000, 1);
  
  // 경쟁 역산 (낮을수록 좋음)
  const competitionFactor = 1 - competition;
  
  // 비용 대비 가치
  const valueFactor = commercialIntent / (Math.max(1, clickCost / 1000));
  
  // 가중 평균
  return (volumeFactor * 0.3) + (competitionFactor * 0.4) + (valueFactor * 0.3);
}

/**
 * 현재 시즌에 맞는 키워드인지 확인
 * @param keyword 키워드 데이터
 * @returns 현재 시즌 적합 여부
 */
function isCurrentlyInSeason(keyword: KeywordData): boolean {
  const currentMonth = new Date().getMonth(); // 0-11
  
  // 계절별 시즌 키워드 맵핑 (간단한 구현)
  const winterKeywords = ['감기', '독감', '면역력', '온열', '보온'];
  const springKeywords = ['알레르기', '황사', '미세먼지', '꽃가루', '다이어트'];
  const summerKeywords = ['자외선', '썬크림', '수분', '다이어트', '체중감량'];
  const fallKeywords = ['환절기', '보습', '면역력', '피부건조'];
  
  // 계절별 키워드 검사
  const isWinterKeyword = winterKeywords.some(k => keyword.keyword.includes(k));
  const isSpringKeyword = springKeywords.some(k => keyword.keyword.includes(k));
  const isSummerKeyword = summerKeywords.some(k => keyword.keyword.includes(k));
  const isFallKeyword = fallKeywords.some(k => keyword.keyword.includes(k));
  
  // 현재 계절 확인
  const isWinter = currentMonth >= 11 || currentMonth <= 1;  // 12-2월
  const isSpring = currentMonth >= 2 && currentMonth <= 4;   // 3-5월
  const isSummer = currentMonth >= 5 && currentMonth <= 7;   // 6-8월
  const isFall = currentMonth >= 8 && currentMonth <= 10;    // 9-11월
  
  // 계절성 없는 키워드는 항상 시즌으로 간주
  if (!isWinterKeyword && !isSpringKeyword && !isSummerKeyword && !isFallKeyword) {
    return true;
  }
  
  // 현재 계절에 맞는 키워드인지 확인
  return (isWinter && isWinterKeyword) ||
         (isSpring && isSpringKeyword) ||
         (isSummer && isSummerKeyword) ||
         (isFall && isFallKeyword);
}

/**
 * 경쟁 난이도 수준 결정
 * @param competitionIndex 경쟁 지수 (0~1)
 * @returns 경쟁 난이도 레벨 문자열
 */
function determineCompetitionLevel(competitionIndex: number): string {
  if (competitionIndex < 0.2) return '매우 낮음';
  if (competitionIndex < 0.4) return '낮음';
  if (competitionIndex < 0.6) return '중간';
  if (competitionIndex < 0.8) return '높음';
  return '매우 높음';
}

/**
 * 기회 점수에 따른 난이도 레벨 결정
 * @param score 기회 점수
 * @returns 난이도 레벨
 */
function getDifficultyLevel(score: number): string {
  if (score > 0.8) return '매우 쉬움';
  if (score > 0.6) return '쉬움';
  if (score > 0.4) return '보통';
  if (score > 0.2) return '어려움';
  return '매우 어려움';
}

/**
 * 추천 마케팅 채널 결정
 * @param keyword 키워드 메트릭스
 * @returns 추천 마케팅 채널 배열
 */
function recommendMarketingChannels(keyword: KeywordData): string[] {
  const channels = [];
  
  // 검색량이 높고 경쟁이 낮으면 SEO에 적합
  if (keyword.searchVolume > 300 && keyword.competition < 0.4) {
    channels.push('SEO');
  }
  
  // 상업적 의도가 높고 수익 잠재력이 좋으면 PPC에 적합
  if ((keyword.commercialIntent || 0.5) > 0.7 && (keyword.profitPotential || 0.5) > 0.6) {
    channels.push('PPC');
  }
  
  // 성장률이 높으면 컨텐츠 마케팅에 적합
  if (keyword.growth > 1.2) {
    channels.push('컨텐츠 마케팅');
  }
  
  // 검색량이 적지만 관련성이 높으면 소셜 미디어에 적합
  if (keyword.searchVolume < 500 && (keyword.categoryRelevance || 0.5) > 0.8) {
    channels.push('소셜 미디어');
  }
  
  // 적어도 하나는 추천
  if (channels.length === 0) {
    channels.push('SEO');
  }
  
  return channels;
}

/**
 * 건강보조제 관련 니치 키워드 샘플 데이터 생성 (테스트용)
 * @returns 샘플 키워드 데이터
 */
export function generateSampleKeywordData(): KeywordData[] {
  const baseKeywords = [
    '비타민', '종합비타민', '멀티비타민', '비타민D', '비타민C', '마그네슘', 
    '아연', '오메가3', '루테인', '칼슘', '철분', '프로바이오틱스', 
    '콜라겐', '밀크씨슬', 'EPA', 'DHA', '글루코사민', '코엔자임Q10', 
    '코큐텐', '홍삼', '녹용', '아르기닌', '돌외잎', '엘러지', '엽산'
  ];
  
  // 니치 키워드 패턴 추가
  const nichePatterns = [
    '액상', '고함량', '유기농', '천연', '효소', '저자극', '친환경', 
    '무설탕', '무향료', '고흡수', '발효', '저분자', '수용성', '식물성', 
    '비건', '어린이용', '시니어용', '임산부용', '남성용', '여성용'
  ];
  
  const result: KeywordData[] = [];
  
  // 기본 키워드 생성
  baseKeywords.forEach(keyword => {
    result.push({
      keyword,
      searchVolume: 1000 + Math.floor(Math.random() * 5000),
      competition: 0.3 + Math.random() * 0.7,
      growth: 0.8 + Math.random() * 0.5
    });
    
    // 니치 키워드 패턴 조합
    nichePatterns.forEach(pattern => {
      // 30% 확률로 니치 조합 생성
      if (Math.random() > 0.7) return;
      
      const nicheKeyword = `${pattern} ${keyword}`;
      const isNiche = Math.random() > 0.6; // 40% 확률로 니치 키워드 특성 부여
      
      result.push({
        keyword: nicheKeyword,
        searchVolume: isNiche ? 
          100 + Math.floor(Math.random() * 900) : 
          800 + Math.floor(Math.random() * 2000),
        competition: isNiche ? 
          0.05 + Math.random() * 0.25 : 
          0.3 + Math.random() * 0.6,
        growth: isNiche ? 
          1.2 + Math.random() * 1.3 : 
          0.8 + Math.random() * 0.5
      });
    });
  });
  
  return result;
}