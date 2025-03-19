/**
 * 로깅 유틸리티
 * 서버 로그 관리를 위한 모듈
 */

// 로그 레벨 타입
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 현재 환경 (개발/운영)
const isDevelopment = process.env.NODE_ENV !== 'production';

// 로거 클래스
class Logger {
  private static instance: Logger;
  
  private constructor() {
    // 싱글톤 패턴
  }
  
  // 싱글톤 인스턴스 접근
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  // 로그 포맷팅 (시간 + 레벨 + 메시지)
  private formatLog(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level.toUpperCase()}] ${message}`;
  }
  
  // 디버그 로그
  public debug(message: string): void {
    if (isDevelopment) {
      console.debug(this.formatLog('debug', message));
    }
  }
  
  // 정보 로그
  public info(message: string): void {
    console.info(this.formatLog('info', message));
  }
  
  // 경고 로그
  public warn(message: string): void {
    console.warn(this.formatLog('warn', message));
  }
  
  // 에러 로그
  public error(message: string): void {
    console.error(this.formatLog('error', message));
  }
}

// 로거 인스턴스 생성 및 내보내기
export const logger = Logger.getInstance();