import express, { Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../../utils/logger';

const router = express.Router();

// 이미지 캐시 설정 (메모리에 최대 100개까지 캐싱)
const imageCache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>();
const MAX_CACHE_SIZE = 100;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24시간

/**
 * 이미지 프록시 라우트
 * CORS 문제를 해결하기 위해 서버에서 이미지를 가져와 클라이언트에 전달
 */
router.get('/', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  
  if (!imageUrl) {
    return res.status(400).json({ error: '이미지 URL이 제공되지 않았습니다.' });
  }

  // URL 디코딩 (중복 인코딩 방지)
  const decodedUrl = decodeURIComponent(imageUrl);
  
  try {
    // 캐시에서 이미지 확인
    const cachedImage = imageCache.get(decodedUrl);
    if (cachedImage && (Date.now() - cachedImage.timestamp) < CACHE_EXPIRY_MS) {
      logger.debug(`이미지 캐시 히트: ${decodedUrl.substring(0, 50)}...`);
      return res
        .set('Content-Type', cachedImage.contentType)
        .set('Cache-Control', 'public, max-age=86400')
        .send(cachedImage.data);
    }

    // 캐시 미스: 원본 URL에서 이미지 가져오기
    logger.debug(`이미지 프록시 요청: ${decodedUrl.substring(0, 50)}...`);

    const response = await axios.get(decodedUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Referer': 'https://shopping.naver.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000 // 5초 타임아웃
    });

    // 이미지 데이터와 컨텐츠 타입 추출
    const imageData = Buffer.from(response.data, 'binary');
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // 캐시에 이미지 저장
    imageCache.set(decodedUrl, {
      data: imageData,
      contentType,
      timestamp: Date.now()
    });

    // 캐시 크기 관리
    if (imageCache.size > MAX_CACHE_SIZE) {
      // 가장 오래된 항목 제거 (LRU 방식)
      // Array.from으로 변환하여 타입 이슈 해결
      const cacheEntries = Array.from(imageCache.entries());
      const oldestEntry = cacheEntries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];

      if (oldestEntry) {
        imageCache.delete(oldestEntry[0]);
      }
    }

    // 클라이언트에게 이미지 전송
    return res
      .set('Content-Type', contentType)
      .set('Cache-Control', 'public, max-age=86400')
      .send(imageData);

  } catch (error) {
    logger.error(`이미지 프록시 에러: ${(error as Error).message}`);
    
    // 에러 상태 코드 추출
    const statusCode = axios.isAxiosError(error) && error.response?.status
      ? error.response.status
      : 500;
    
    // 클라이언트에게 에러 응답
    return res.status(statusCode).json({
      error: '이미지를 가져오는 중 오류가 발생했습니다.',
      details: (error as Error).message
    });
  }
});

export default router;