/**
 * 소형(니치) 키워드 찾기 알고리즘
 * 
 * 검색량은 적당하고 경쟁도가 낮으며 성장성이 높은 키워드를 필터링하여 제공
 */

export interface KeywordData {
  keyword: string;
  searchVolume: number;    // 검색량 
  competition: number;     // 경쟁도 (0-1 사이 값)
  growth: number;          // 성장률 (1 이상이면 성장, 1 미만이면 감소)
  cpc?: number;            // 클릭당 비용 (선택적)
  conversionRate?: number; // 전환율 (선택적)
  category?: string;       // 카테고리 (선택적)
}

export interface NicheKeywordResult {
  keyword: string;
  searchVolume: number;
  competition: number;
  growth: number;
  nicheScore: number;      // 니치 점수 (0-100)
  potential: string;       // 잠재력 평가 ('높음', '중간', '낮음')
  recommendation: string;  // 활용 추천 사항
}

export interface NicheKeywordCriteria {
  minSearchVolume?: number;  // 최소 검색량 (기본값: 100)
  maxSearchVolume?: number;  // 최대 검색량 (기본값: 1000)
  maxCompetition?: number;   // 최대 경쟁도 (기본값: 0.3)
  minGrowth?: number;        // 최소 성장률 (기본값: 1.2)
}

/**
 * 니치 키워드 찾기 알고리즘
 * @param keywordDataList 키워드 데이터 목록
 * @param criteria 필터링 기준 (선택적)
 * @returns 니치 키워드 목록
 */
export function findNicheKeywords(
  keywordDataList: KeywordData[],
  criteria: NicheKeywordCriteria = {}
): NicheKeywordResult[] {
  // 기본 임계값 설정
  const {
    minSearchVolume = 100,
    maxSearchVolume = 1000,
    maxCompetition = 0.3,
    minGrowth = 1.2
  } = criteria;
  
  // 니치 키워드 필터링
  const nicheKeywords = keywordDataList.filter(item =>
    item.searchVolume >= minSearchVolume &&
    item.searchVolume <= maxSearchVolume &&
    item.competition <= maxCompetition &&
    item.growth >= minGrowth
  );
  
  // 니치 점수 계산 및 결과 가공
  return nicheKeywords.map(item => {
    // 니치 점수 계산 (0-100): 검색량, 낮은 경쟁도, 높은 성장률 기반
    const searchVolumeScore = Math.min(item.searchVolume / maxSearchVolume, 1) * 30;
    const competitionScore = (1 - item.competition / maxCompetition) * 40;
    const growthScore = Math.min((item.growth - 1) / (minGrowth - 1), 2) * 30;
    
    const nicheScore = Math.min(
      Math.round(searchVolumeScore + competitionScore + growthScore),
      100
    );
    
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
    
    return {
      keyword: item.keyword,
      searchVolume: item.searchVolume,
      competition: item.competition,
      growth: item.growth,
      nicheScore,
      potential,
      recommendation
    };
  }).sort((a, b) => b.nicheScore - a.nicheScore); // 니치 점수 기준 내림차순 정렬
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