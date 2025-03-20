import express from 'express';
import axios from 'axios';
import { Request, Response } from 'express';

const router = express.Router();

// 이미지 캐시 (메모리에 저장)
const imageCache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

// 이미지 프록시 엔드포인트
router.get('/', async (req: Request, res: Response) => {
  try {
    const imageUrl = req.query.url as string;
    
    if (!imageUrl) {
      return res.status(400).send('이미지 URL이 필요합니다');
    }

    // URL 디코딩
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // 캐시된 이미지가 있는지 확인
    const cached = imageCache.get(decodedUrl);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('X-Cache', 'HIT');
      return res.send(cached.data);
    }
    
    // 이미지 요청
    const response = await axios.get(decodedUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Naver-Bot/1.0; +http://search.naver.com)',
        'Referer': 'https://search.naver.com/'
      }
    });
    
    const contentType = response.headers['content-type'];
    const data = Buffer.from(response.data, 'binary');
    
    // 캐시에 저장
    imageCache.set(decodedUrl, {
      data,
      contentType,
      timestamp: now
    });
    
    // 응답 헤더 설정
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // 이미지 데이터 반환
    res.send(data);
  } catch (error) {
    console.error('이미지 프록시 오류:', error);
    res.status(500).send('이미지를 가져오는 중 오류가 발생했습니다');
  }
});

// 캐시 정리 함수 (주기적으로 실행)
const cleanupCache = () => {
  const now = Date.now();
  for (const [url, { timestamp }] of imageCache.entries()) {
    if (now - timestamp > CACHE_DURATION) {
      imageCache.delete(url);
    }
  }
};

// 1시간마다 캐시 정리
setInterval(cleanupCache, 60 * 60 * 1000);

export default router;