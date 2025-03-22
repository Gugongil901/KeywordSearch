/**
 * 키워드별 페이지 노출 모니터링 시스템
 * 
 * 특정 키워드 검색 시 웹페이지가 노출되는지 확인하고 순위를 추적하는 기능 제공
 */

import axios from 'axios';
import { logger } from '../../utils/logger';

export interface PageExposure {
  keyword: string;
  url: string;
  isExposed: boolean;
  rank: number | null;
  timestamp: Date;
}

export class PageExposureTracker {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.clientId = process.env.NAVER_CLIENT_ID || 'ErTaCUGQWfhKvcEnftat';
    this.clientSecret = process.env.NAVER_CLIENT_SECRET || 'Xoq9VSewrv';
  }

  /**
   * 네이버 검색 API를 통해 특정 키워드 검색 결과 가져오기
   */
  async getSearchResults(keyword: string, display: number = 100): Promise<any[]> {
    try {
      logger.info(`[PageExposureTracker] 키워드 "${keyword}" 검색 결과 조회 시작 (최대 ${display}개)`);
      
      const response = await axios.get('https://openapi.naver.com/v1/search/shop.json', {
        params: {
          query: keyword,
          display,
          start: 1,
          sort: 'sim' // 정확도순 정렬
        },
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret
        }
      });
      
      if (!response.data || !response.data.items) {
        logger.warn(`[PageExposureTracker] 키워드 "${keyword}" 검색 결과 없음`);
        return [];
      }
      
      logger.info(`[PageExposureTracker] 키워드 "${keyword}" 검색 결과 ${response.data.items.length}개 조회 완료`);
      return response.data.items || [];
    } catch (error: any) {
      logger.error(`[PageExposureTracker] 네이버 검색 API 호출 실패: ${error.message}`);
      throw new Error('검색 결과 조회에 실패했습니다.');
    }
  }

  /**
   * 특정 URL이 검색 결과에 노출되는지 확인
   */
  async checkPageExposure(keyword: string, targetUrl: string): Promise<PageExposure> {
    try {
      const searchResults = await this.getSearchResults(keyword);
      
      // URL 패턴 매칭 (도메인 기준)
      let targetDomain: string;
      try {
        targetDomain = new URL(targetUrl).hostname;
      } catch (e) {
        // URL 파싱 실패시 원본 문자열 사용
        targetDomain = targetUrl;
      }
      
      for (let i = 0; i < searchResults.length; i++) {
        const item = searchResults[i];
        try {
          let itemDomain = '';
          if (item.link) {
            itemDomain = new URL(item.link).hostname;
          } else if (item.productUrl) {
            itemDomain = new URL(item.productUrl).hostname;
          } else {
            continue;
          }
          
          if (itemDomain.includes(targetDomain) || targetDomain.includes(itemDomain)) {
            logger.info(`[PageExposureTracker] 키워드 "${keyword}"에서 URL "${targetUrl}" 노출 감지 (순위: ${i + 1})`);
            return {
              keyword,
              url: targetUrl,
              isExposed: true,
              rank: i + 1,
              timestamp: new Date()
            };
          }
        } catch (e) {
          // 유효하지 않은 URL 무시
          continue;
        }
      }
      
      logger.info(`[PageExposureTracker] 키워드 "${keyword}"에서 URL "${targetUrl}" 노출되지 않음`);
      return {
        keyword,
        url: targetUrl,
        isExposed: false,
        rank: null,
        timestamp: new Date()
      };
    } catch (error: any) {
      logger.error(`[PageExposureTracker] 페이지 노출 확인 실패: ${error.message}`);
      return {
        keyword,
        url: targetUrl,
        isExposed: false,
        rank: null,
        timestamp: new Date()
      };
    }
  }

  /**
   * 여러 키워드에 대한 페이지 노출 상태 한번에 확인
   */
  async batchCheckPageExposure(keywords: string[], targetUrl: string): Promise<PageExposure[]> {
    try {
      logger.info(`[PageExposureTracker] ${keywords.length}개 키워드에 대한 URL "${targetUrl}" 노출 일괄 확인 시작`);
      
      // API 부하 방지를 위해 동시에 5개 요청으로 제한
      const results: PageExposure[] = [];
      const batchSize = 5;
      
      for (let i = 0; i < keywords.length; i += batchSize) {
        const batch = keywords.slice(i, i + batchSize);
        const batchPromises = batch.map(keyword => this.checkPageExposure(keyword, targetUrl));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // API 부하 방지를 위한 지연
        if (i + batchSize < keywords.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      logger.info(`[PageExposureTracker] ${keywords.length}개 키워드에 대한 URL "${targetUrl}" 노출 일괄 확인 완료`);
      return results;
    } catch (error: any) {
      logger.error(`[PageExposureTracker] 일괄 페이지 노출 확인 실패: ${error.message}`);
      return [];
    }
  }
}

// 싱글톤 인스턴스
let pageExposureTracker: PageExposureTracker | null = null;

/**
 * 페이지 노출 추적기 인스턴스 가져오기
 */
export function getPageExposureTracker(): PageExposureTracker {
  if (!pageExposureTracker) {
    pageExposureTracker = new PageExposureTracker();
  }
  return pageExposureTracker;
}