/**
 * 상위 노출 광고 키워드 필터링 모듈
 * 
 * 이미 상위에 노출되는 광고 키워드를 자동으로 식별하고 필터링하는 기능 제공
 */

import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

interface KeywordAdData {
  keywordId: string;
  keyword: string;
  averageBidPrice: number;
  competitionRate: number;
  isTopExposure: boolean;
}

export class KeywordAdFilter {
  private readonly customerId: string;
  private readonly accessLicense: string;
  private readonly secretKey: string;

  constructor() {
    this.customerId = process.env.NAVER_AD_CUSTOMER_ID || '3405855';
    this.accessLicense = process.env.NAVER_AD_ACCESS_LICENSE || '01000000005a79e0d0ffff30be92041e87dd2444c689e1209efbe2f9ea58fd3a3ae67ee01e';
    this.secretKey = process.env.NAVER_AD_SECRET_KEY || 'AQAAAABaeeDQ//8wvpIEHofdJETGcg3aHhG5YRGgFHPnSsNISw==';
  }

  /**
   * 네이버 검색광고 API 서명 헤더 생성
   */
  private getAuthHeaders(method: string, path: string): Record<string, string> {
    const timestamp = Date.now().toString();
    
    // HMAC 서명 생성
    const hmac = crypto.createHmac('sha256', this.secretKey);
    const message = `${timestamp}.${method}.${path}`;
    hmac.update(message);
    const signature = hmac.digest('base64');
    
    return {
      'X-Timestamp': timestamp,
      'X-Customer': this.customerId,
      'X-API-KEY': this.accessLicense,
      'X-Signature': signature,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 네이버 검색광고 API를 통해 키워드 정보를 가져옴
   */
  async getKeywordAdInfo(keywords: string[]): Promise<KeywordAdData[]> {
    try {
      logger.info(`[KeywordAdFilter] ${keywords.length}개 키워드 광고 정보 조회 시작`);
      
      const path = '/keywordstool';
      const headers = this.getAuthHeaders('POST', path);
      
      const response = await axios.post(
        `https://api.naver.com${path}`,
        { keywords: keywords.slice(0, 100) }, // API 제한으로 100개까지만 요청
        { headers }
      );
      
      // API 응답 처리
      if (!response.data || !response.data.keywordList) {
        logger.warn('[KeywordAdFilter] 검색광고 API 응답에 키워드 목록이 없습니다');
        return [];
      }
      
      // 응답 데이터 매핑
      const results: KeywordAdData[] = response.data.keywordList.map((item: any) => ({
        keywordId: item.relKeyword,
        keyword: item.relKeyword,
        averageBidPrice: item.averageBidAmount || 0,
        competitionRate: item.competitionIndex || 0,
        // 노출 상위 키워드 판단 기준: 월 평균 클릭 수와 경쟁도 지수 활용
        isTopExposure: (
          (item.monthlyAvePcClkCnt > 100 || item.monthlyAveMobileClkCnt > 200) && 
          item.competitionIndex > 70
        )
      }));
      
      logger.info(`[KeywordAdFilter] ${results.length}개 키워드 광고 정보 조회 완료`);
      return results;
    } catch (error: any) {
      logger.error(`[KeywordAdFilter] 검색광고 API 호출 실패: ${error.message}`);
      // 에러 발생시 빈 배열 반환
      return [];
    }
  }

  /**
   * 이미 상위 노출되는 광고 키워드 필터링
   */
  async filterTopExposureKeywords(industryKeywords: string[]): Promise<string[]> {
    try {
      const keywordInfoList = await this.getKeywordAdInfo(industryKeywords);
      
      const topExposureKeywords = keywordInfoList
        .filter(keyword => keyword.isTopExposure)
        .map(keyword => keyword.keyword);
        
      logger.info(`[KeywordAdFilter] ${topExposureKeywords.length}개의 상위 노출 키워드 필터링 완료`);
      return topExposureKeywords;
    } catch (error: any) {
      logger.error(`[KeywordAdFilter] 상위 노출 키워드 필터링 실패: ${error.message}`);
      return [];
    }
  }

  /**
   * 광고 키워드 제안 (상위 노출 키워드 제외)
   */
  async suggestAdKeywords(industryKeywords: string[]): Promise<string[]> {
    try {
      const keywordInfoList = await this.getKeywordAdInfo(industryKeywords);
      
      const suggestedKeywords = keywordInfoList
        .filter(keyword => !keyword.isTopExposure)
        .map(keyword => keyword.keyword);
        
      logger.info(`[KeywordAdFilter] ${suggestedKeywords.length}개의 광고 추천 키워드 생성 완료`);
      return suggestedKeywords;
    } catch (error: any) {
      logger.error(`[KeywordAdFilter] 광고 키워드 제안 실패: ${error.message}`);
      return [];
    }
  }
}

// 싱글톤 인스턴스
let keywordAdFilter: KeywordAdFilter | null = null;

/**
 * 키워드 광고 필터 인스턴스 가져오기
 */
export function getKeywordAdFilter(): KeywordAdFilter {
  if (!keywordAdFilter) {
    keywordAdFilter = new KeywordAdFilter();
  }
  return keywordAdFilter;
}