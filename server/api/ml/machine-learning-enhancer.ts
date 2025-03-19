/**
 * 머신러닝 강화 시스템
 * 
 * Python으로 구현된 ML 모델을 호출하여 키워드 분석을 강화하는 모듈
 */

import { spawn } from 'child_process';
import { logger } from '../../utils/logger';
import { DatabaseConnector } from '../collectors/database-connector';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM 환경에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 검색량 예측 결과 인터페이스
 */
export interface SearchVolumeForecast {
  month: number;
  forecast: number;
  lower: number;
  upper: number;
}

/**
 * 성공 확률 예측 결과 인터페이스
 */
export interface SuccessProbability {
  probability: number;
  score: number;
  important_factors: Array<{
    factor: string;
    importance: number;
  }>;
}

/**
 * 키워드 의미 분석 결과 인터페이스
 */
export interface KeywordMeaning {
  keyword: string;
  nouns: string[];
  categories: Array<{
    category: string;
    score: number;
    matches: string[];
  }>;
  intent: {
    intent: string;
    score: number;
    matches: string[];
  };
  sentiment: {
    sentiment: string;
    positive_score: number;
    negative_score: number;
  };
}

/**
 * 의미적 연관 키워드 인터페이스
 */
export interface SemanticRelatedKeyword {
  keyword: string;
  similarity: number;
}

/**
 * 시장 세그먼트 인터페이스
 */
export interface MarketSegment {
  id: number;
  label: string;
  keywords: string[];
}

/**
 * 머신러닝 강화 시스템 클래스
 */
export class MachineLearningEnhancer {
  private db: DatabaseConnector;
  private pythonPath: string;
  private mlBridgePath: string;

  /**
   * 생성자
   * @param db 데이터베이스 커넥터
   */
  constructor(db: DatabaseConnector) {
    this.db = db;
    this.pythonPath = 'python3';
    this.mlBridgePath = path.join(__dirname, 'ml-bridge.py');
  }

  /**
   * Python 스크립트 실행
   * @param command 실행할 명령어
   * @param data 전송할 데이터
   * @returns Python 스크립트의 출력 결과
   */
  private async executePythonScript(command: string, data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const dataString = JSON.stringify(data);
        const pythonProcess = spawn(this.pythonPath, [this.mlBridgePath, command, dataString]);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          logger.warn(`ML 브릿지 오류: ${data.toString()}`);
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            logger.error(`ML 브릿지 실행 오류 (코드: ${code}): ${errorOutput}`);
            reject(new Error(`ML 브릿지 실행 오류 (코드: ${code}): ${errorOutput}`));
          } else {
            resolve(output);
          }
        });
      } catch (error) {
        logger.error(`ML 브릿지 호출 오류: ${error}`);
        reject(error);
      }
    });
  }

  /**
   * 키워드 검색량 예측
   * @param keyword 키워드
   * @param historicalData 과거 데이터 (선택)
   * @returns 향후 6개월 검색량 예측 결과
   */
  async predictSearchVolume(keyword: string, historicalData?: any[]): Promise<SearchVolumeForecast[]> {
    try {
      // 과거 데이터가 없으면 DB에서 조회
      if (!historicalData) {
        const keywordData = this.db.getKeywordData(keyword);
        if (keywordData && keywordData.trends) {
          historicalData = keywordData.trends;
        }
      }

      // 키워드 특성 추출 (현재는 간단한 데모 구현)
      const features = this.extractKeywordFeatures(keyword, historicalData);
      
      // ML 브릿지 호출
      const result = await this.executePythonScript('predict_search_volume', features);
      
      // 결과 파싱
      const forecasts: SearchVolumeForecast[] = JSON.parse(result);
      
      return forecasts;
    } catch (error) {
      logger.error(`검색량 예측 오류: ${error}`);
      return this.generateDefaultSearchForecast();
    }
  }

  /**
   * 키워드 성공 확률 예측
   * @param keyword 키워드
   * @param metrics 키워드 분석 지표
   * @returns 성공 확률 및 중요 요인
   */
  async predictSuccessProbability(keyword: string, metrics?: any): Promise<SuccessProbability> {
    try {
      // 메트릭이 없으면 DB에서 조회
      if (!metrics) {
        const keywordData = this.db.getKeywordData(keyword);
        if (keywordData && keywordData.metrics) {
          metrics = keywordData.metrics;
        }
      }

      // 특성 추출
      const features = this.extractSuccessFeatures(keyword, metrics);
      
      // ML 브릿지 호출
      const result = await this.executePythonScript('predict_success_probability', features);
      
      // 결과 파싱
      const probability: SuccessProbability = JSON.parse(result);
      
      return probability;
    } catch (error) {
      logger.error(`성공 확률 예측 오류: ${error}`);
      return {
        probability: 0.5,
        score: 50,
        important_factors: []
      };
    }
  }
  
  /**
   * 키워드 의미 분석
   * @param keyword 분석할 키워드
   * @returns 의미 분석 결과
   */
  async analyzeKeywordMeaning(keyword: string): Promise<KeywordMeaning> {
    try {
      // Python 스크립트 실행
      const result = await this.executePythonScript('analyze_keyword_meaning', { keyword });
      
      // 결과 파싱
      const analysis = JSON.parse(result);
      
      // 오류 확인
      if (analysis.error) {
        throw new Error(analysis.message || analysis.error);
      }
      
      return analysis as KeywordMeaning;
    } catch (error) {
      logger.error(`키워드 의미 분석 오류: ${error}`);
      return {
        keyword,
        nouns: [],
        categories: [],
        intent: {
          intent: '정보 탐색',
          score: 0,
          matches: []
        },
        sentiment: {
          sentiment: '중립',
          positive_score: 0,
          negative_score: 0
        }
      };
    }
  }
  
  /**
   * 의미적 연관 키워드 찾기
   * @param keyword 기준 키워드
   * @param limit 반환할 최대 키워드 수
   * @returns 연관 키워드 목록
   */
  async findSemanticRelatedKeywords(keyword: string, limit: number = 20): Promise<SemanticRelatedKeyword[]> {
    try {
      // Python 스크립트 실행
      const result = await this.executePythonScript('find_semantic_related', { keyword, limit });
      
      // 결과 파싱
      const related = JSON.parse(result);
      
      // 오류 확인
      if (related.error) {
        throw new Error(related.message || related.error);
      }
      
      return related as SemanticRelatedKeyword[];
    } catch (error) {
      logger.error(`의미적 연관 키워드 검색 오류: ${error}`);
      return this.generateDefaultRelatedKeywords(keyword);
    }
  }
  
  /**
   * 시장 세그먼트 식별
   * @param keyword 기준 키워드
   * @returns 시장 세그먼트 목록
   */
  async identifyMarketSegments(keyword: string): Promise<MarketSegment[]> {
    try {
      // Python 스크립트 실행
      const result = await this.executePythonScript('identify_market_segments', { keyword });
      
      // 결과 파싱
      const segments = JSON.parse(result);
      
      // 오류 확인
      if (segments.error) {
        throw new Error(segments.message || segments.error);
      }
      
      return segments as MarketSegment[];
    } catch (error) {
      logger.error(`시장 세그먼트 식별 오류: ${error}`);
      return this.generateDefaultMarketSegments(keyword);
    }
  }

  /**
   * 키워드 특성 추출
   * @param keyword 키워드
   * @param historicalData 과거 데이터
   * @returns 특성 배열
   */
  private extractKeywordFeatures(keyword: string, historicalData?: any[]): number[] {
    // 특성 추출 로직
    // 실제 구현에서는 키워드의 여러 특성(길이, 단어 수, 검색량 추세 등)을 분석해야 함
    
    // 간단한 데모 특성
    const features: number[] = [];
    
    // 키워드 길이
    features.push(keyword.length);
    
    // 키워드 단어 수
    features.push(keyword.split(/\s+/).length);
    
    // 과거 데이터에서 특성 추출
    if (historicalData && historicalData.length > 0) {
      // 최근 3개월 평균
      const recent = historicalData.slice(-3);
      const recentAvg = recent.reduce((sum, item) => sum + (item.count || 0), 0) / recent.length;
      features.push(recentAvg);
      
      // 전체 평균
      const totalAvg = historicalData.reduce((sum, item) => sum + (item.count || 0), 0) / historicalData.length;
      features.push(totalAvg);
      
      // 성장 추세
      if (historicalData.length > 1) {
        const first = historicalData[0].count || 0;
        const last = historicalData[historicalData.length - 1].count || 0;
        const growth = (last - first) / first;
        features.push(growth);
      } else {
        features.push(0);
      }
    } else {
      // 과거 데이터가 없는 경우 기본값
      features.push(100); // 최근 평균
      features.push(100); // 전체 평균
      features.push(0.05); // 성장 추세
    }
    
    // 나머지 필요한 특성을 채워 20개로 맞춤 (모델이 20개 특성을 기대)
    while (features.length < 20) {
      features.push(Math.random()); // 임시 값
    }
    
    return features;
  }

  /**
   * 성공 확률 예측을 위한 특성 추출
   * @param keyword 키워드
   * @param metrics 키워드 분석 지표
   * @returns 특성 배열
   */
  private extractSuccessFeatures(keyword: string, metrics?: any): number[] {
    // 특성 추출 로직
    const features: number[] = [];
    
    // 키워드 특성
    features.push(keyword.length); // 키워드 길이
    features.push(keyword.split(/\s+/).length); // 단어 수
    
    if (metrics) {
      // 기본 지표
      features.push(metrics.searchVolume?.total || 0); // 검색량
      features.push(metrics.productCount || 0); // 상품 수
      features.push(metrics.priceStats?.avg || 0); // 평균 가격
      
      // 경쟁 지표
      features.push(metrics.competition?.competitionScore || 50); // 경쟁도
      features.push(metrics.competition?.adRatio || 0.2); // 광고 비율
      features.push(metrics.competition?.brandRatio || 0.3); // 브랜드 비율
      
      // 성장 지표
      features.push(metrics.growth?.growthRates?.['3month'] || 0.05); // 3개월 성장률
      features.push(metrics.growth?.trendDirection === '상승' ? 1 : 0); // 상승 추세
      
      // 수익성 지표
      features.push(metrics.profit?.marginRate || 0.3); // 마진율
      features.push(metrics.profit?.marginToCpcRatio || 5); // CPC 대비 마진
    } else {
      // 메트릭이 없는 경우 기본값
      features.push(100); // 검색량
      features.push(50); // 상품 수
      features.push(10000); // 평균 가격
      features.push(50); // 경쟁도
      features.push(0.2); // 광고 비율
      features.push(0.3); // 브랜드 비율
      features.push(0.05); // 3개월 성장률
      features.push(1); // 상승 추세
      features.push(0.3); // 마진율
      features.push(5); // CPC 대비 마진
    }
    
    return features;
  }

  /**
   * 기본 검색량 예측 결과 생성
   * @returns 기본 검색량 예측 결과
   */
  private generateDefaultSearchForecast(): SearchVolumeForecast[] {
    const forecasts: SearchVolumeForecast[] = [];
    const baseValue = 1000;
    
    for (let i = 0; i < 6; i++) {
      const monthValue = baseValue * (1 + i * 0.05);
      forecasts.push({
        month: i + 1,
        forecast: monthValue,
        lower: monthValue * 0.9,
        upper: monthValue * 1.1
      });
    }
    
    return forecasts;
  }
  
  /**
   * 기본 연관 키워드 생성
   * @param keyword 기준 키워드
   * @returns 기본 연관 키워드 목록
   */
  private generateDefaultRelatedKeywords(keyword: string): SemanticRelatedKeyword[] {
    const suffixes = ['추천', '가격', '할인', '후기', '구매', '비교', '종류', '사용법', '효과', '브랜드'];
    const prefixes = ['인기', '최고', '저렴한', '고급', '추천', '신상', '할인', '프리미엄'];
    
    const result: SemanticRelatedKeyword[] = [];
    
    // 접미사 키워드 생성
    suffixes.forEach((suffix, index) => {
      result.push({
        keyword: `${keyword} ${suffix}`,
        similarity: 0.9 - (index * 0.05)
      });
    });
    
    // 접두사 키워드 생성
    prefixes.forEach((prefix, index) => {
      result.push({
        keyword: `${prefix} ${keyword}`,
        similarity: 0.8 - (index * 0.05)
      });
    });
    
    return result;
  }
  
  /**
   * 기본 시장 세그먼트 생성
   * @param keyword 기준 키워드
   * @returns 기본 시장 세그먼트 목록
   */
  private generateDefaultMarketSegments(keyword: string): MarketSegment[] {
    const segments = [
      {
        id: 1,
        label: '가격 중심',
        keywords: [
          `${keyword} 가격`, 
          `${keyword} 최저가`, 
          `저렴한 ${keyword}`, 
          `${keyword} 할인`, 
          `${keyword} 특가`
        ]
      },
      {
        id: 2,
        label: '품질 중심',
        keywords: [
          `${keyword} 품질`, 
          `고급 ${keyword}`, 
          `프리미엄 ${keyword}`, 
          `${keyword} 내구성`, 
          `${keyword} 성능`
        ]
      },
      {
        id: 3,
        label: '정보 탐색',
        keywords: [
          `${keyword} 추천`, 
          `${keyword} 후기`, 
          `${keyword} 비교`, 
          `${keyword} 종류`, 
          `${keyword} 기능`
        ]
      }
    ];
    
    return segments;
  }
}