/**
 * 상품별 키워드 순위 분석 시스템
 * 
 * 각 상품이 어떤 키워드에서 어떤 순위로 노출되는지 분석하고 시간에 따른 변화를 추적하는 기능 제공
 */

import axios from 'axios';
import { logger } from '../../utils/logger';

export interface ProductRanking {
  productId: string;
  productName: string;
  keyword: string;
  rank: number | null;
  prevRank: number | null;
  change: number | null;
  timestamp: Date;
}

interface RankingHistory {
  [key: string]: { // productId_keyword 형식의 키
    timestamp: Date;
    rank: number | null;
  }[]
}

export class ProductRankingAnalyzer {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private rankingHistory: RankingHistory = {};

  constructor() {
    this.clientId = process.env.NAVER_CLIENT_ID || 'ErTaCUGQWfhKvcEnftat';
    this.clientSecret = process.env.NAVER_CLIENT_SECRET || 'Xoq9VSewrv';
  }

  /**
   * 네이버 쇼핑 검색 결과에서 상품 순위 확인
   */
  async getProductRanking(keyword: string, productId: string, productName: string): Promise<ProductRanking> {
    try {
      logger.info(`[ProductRankingAnalyzer] 키워드 "${keyword}"에서 상품 "${productName}" 순위 분석 시작`);
      
      // 네이버 쇼핑 검색 API 호출
      const response = await axios.get('https://openapi.naver.com/v1/search/shop.json', {
        params: {
          query: keyword,
          display: 100, // 최대 결과 표시
          start: 1
        },
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret
        }
      });
      
      const items = response.data.items || [];
      let currentRank = null;
      
      // 상품명과 상품 ID로 매칭 시도
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemTitle = item.title.replace(/<[^>]*>/g, ''); // HTML 태그 제거
        
        // 상품명이 포함되어 있거나 상품 ID가 URL에 포함된 경우
        if (
          itemTitle.includes(productName) || 
          (item.link && item.link.includes(productId)) ||
          (item.productId && item.productId === productId)
        ) {
          currentRank = i + 1;
          break;
        }
      }
      
      // 이전 순위 조회
      const historyKey = `${productId}_${keyword}`;
      const prevRanking = this.getPreviousRanking(historyKey);
      const prevRank = prevRanking ? prevRanking.rank : null;
      const change = (currentRank !== null && prevRank !== null) ? prevRank - currentRank : null;
      
      // 새 순위 기록 저장
      this.saveRankingHistory(historyKey, currentRank);
      
      const result: ProductRanking = {
        productId,
        productName,
        keyword,
        rank: currentRank,
        prevRank,
        change,
        timestamp: new Date()
      };
      
      logger.info(`[ProductRankingAnalyzer] 키워드 "${keyword}"에서 상품 "${productName}" 순위 분석 완료: ${currentRank !== null ? currentRank : '미노출'}`);
      return result;
    } catch (error: any) {
      logger.error(`[ProductRankingAnalyzer] 상품 순위 조회 실패: ${error.message}`);
      return {
        productId,
        productName,
        keyword,
        rank: null,
        prevRank: null,
        change: null,
        timestamp: new Date()
      };
    }
  }

  /**
   * 이전 순위 데이터 조회
   */
  private getPreviousRanking(historyKey: string): { timestamp: Date; rank: number | null } | null {
    const history = this.rankingHistory[historyKey];
    if (!history || history.length === 0) {
      return null;
    }
    
    // 최신 순으로 정렬하고 가장 최근 기록 반환
    const sortedHistory = [...history].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return sortedHistory[0];
  }

  /**
   * 순위 기록 저장
   */
  private saveRankingHistory(historyKey: string, rank: number | null): void {
    if (!this.rankingHistory[historyKey]) {
      this.rankingHistory[historyKey] = [];
    }
    
    // 최대 30개 기록 유지
    if (this.rankingHistory[historyKey].length >= 30) {
      this.rankingHistory[historyKey].shift();
    }
    
    this.rankingHistory[historyKey].push({
      timestamp: new Date(),
      rank
    });
  }

  /**
   * 여러 키워드에 대한 상품 순위 한번에 분석
   */
  async analyzeProductRankings(productId: string, productName: string, keywords: string[]): Promise<ProductRanking[]> {
    try {
      logger.info(`[ProductRankingAnalyzer] 상품 "${productName}"의 ${keywords.length}개 키워드 순위 일괄 분석 시작`);
      
      // API 부하 방지를 위해 동시에 5개 요청으로 제한
      const results: ProductRanking[] = [];
      const batchSize = 5;
      
      for (let i = 0; i < keywords.length; i += batchSize) {
        const batch = keywords.slice(i, i + batchSize);
        const batchPromises = batch.map(keyword => 
          this.getProductRanking(keyword, productId, productName)
        );
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // API 부하 방지를 위한 지연
        if (i + batchSize < keywords.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      logger.info(`[ProductRankingAnalyzer] 상품 "${productName}"의 키워드 순위 일괄 분석 완료`);
      return results;
    } catch (error: any) {
      logger.error(`[ProductRankingAnalyzer] 상품 순위 일괄 분석 실패: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 특정 상품의 순위가 가장 높은 키워드 찾기
   */
  async findBestRankingKeywords(productId: string, productName: string, keywords: string[], limit: number = 10): Promise<ProductRanking[]> {
    try {
      const rankings = await this.analyzeProductRankings(productId, productName, keywords);
      
      // 순위가 있는 결과만 필터링하고 순위 기준 정렬
      const validRankings = rankings.filter(r => r.rank !== null);
      const sortedRankings = validRankings.sort((a, b) => (a.rank || 999) - (b.rank || 999));
      
      logger.info(`[ProductRankingAnalyzer] 상품 "${productName}"의 최적 키워드 ${limit}개 추출 완료`);
      return sortedRankings.slice(0, limit);
    } catch (error: any) {
      logger.error(`[ProductRankingAnalyzer] 최적 키워드 찾기 실패: ${error.message}`);
      return [];
    }
  }
}

// 싱글톤 인스턴스
let productRankingAnalyzer: ProductRankingAnalyzer | null = null;

/**
 * 상품 순위 분석기 인스턴스 가져오기
 */
export function getProductRankingAnalyzer(): ProductRankingAnalyzer {
  if (!productRankingAnalyzer) {
    productRankingAnalyzer = new ProductRankingAnalyzer();
  }
  return productRankingAnalyzer;
}