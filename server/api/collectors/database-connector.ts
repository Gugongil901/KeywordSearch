/**
 * 데이터베이스 커넥터
 * 키워드 데이터를 저장하고 관리하는 모듈
 */

import { logger } from '../../utils/logger';

// 현재는 인메모리 저장소를 사용하지만 추후 실제 DB로 대체 가능합니다.
export class DatabaseConnector {
  private static instance: DatabaseConnector;
  private keywordData: Map<string, any>;
  
  constructor() {
    this.keywordData = new Map<string, any>();
    logger.info('데이터베이스 커넥터 초기화 완료');
  }
  
  // 싱글톤 인스턴스 접근
  public static getInstance(): DatabaseConnector {
    if (!DatabaseConnector.instance) {
      DatabaseConnector.instance = new DatabaseConnector();
    }
    return DatabaseConnector.instance;
  }
  
  /**
   * 키워드 데이터 저장
   * @param keyword 키워드
   * @param data 수집된 데이터
   */
  public saveKeywordData(keyword: string, data: any): void {
    try {
      // 키워드 정규화 (소문자, 공백 제거)
      const normalizedKeyword = keyword.toLowerCase().trim();
      
      // 기존 데이터 가져오기
      const existingData = this.keywordData.get(normalizedKeyword) || {};
      
      // 타임스탬프 추가
      const timestamp = new Date();
      const dataWithTimestamp = {
        ...data,
        lastUpdated: timestamp.toISOString(),
        createdAt: existingData.createdAt || timestamp.toISOString()
      };
      
      // 데이터 저장
      this.keywordData.set(normalizedKeyword, dataWithTimestamp);
      
      logger.info(`[${keyword}] 데이터 저장 완료`);
    } catch (error) {
      logger.error(`[${keyword}] 데이터 저장 오류: ${error}`);
      throw error;
    }
  }
  
  /**
   * 키워드 데이터 조회
   * @param keyword 키워드
   * @returns 저장된 데이터
   */
  public getKeywordData(keyword: string): any {
    const normalizedKeyword = keyword.toLowerCase().trim();
    return this.keywordData.get(normalizedKeyword) || null;
  }
  
  /**
   * 저장된 모든 키워드 목록 조회
   * @returns 키워드 목록
   */
  public getAllKeywords(): string[] {
    return Array.from(this.keywordData.keys());
  }
  
  /**
   * 키워드 데이터 삭제
   * @param keyword 키워드
   * @returns 삭제 성공 여부
   */
  public deleteKeywordData(keyword: string): boolean {
    const normalizedKeyword = keyword.toLowerCase().trim();
    return this.keywordData.delete(normalizedKeyword);
  }
  
  /**
   * 최근 업데이트된 키워드 목록 조회
   * @param limit 조회할 키워드 수
   * @returns 최근 업데이트된 키워드 목록
   */
  public getRecentKeywords(limit: number = 10): Array<{keyword: string, lastUpdated: string}> {
    const keywords = Array.from(this.keywordData.entries())
      .map(([keyword, data]) => ({
        keyword,
        lastUpdated: data.lastUpdated
      }))
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, limit);
      
    return keywords;
  }
}

// 커넥터 인스턴스 생성 및 내보내기
export const dbConnector = DatabaseConnector.getInstance();