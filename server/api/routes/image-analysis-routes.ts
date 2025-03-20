/**
 * 이미지 분석 관련 API 라우트
 */

import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { analyzeImage, batchAnalyzeImages } from '../image-analyzer';

// 라우터 생성
const router = Router();

/**
 * 단일 이미지 분석 API
 * 특정 이미지 URL과 제품명을 받아 분석 결과 반환
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { imageUrl, productName } = req.body;
    
    // 필수 파라미터 확인
    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }
    
    // 제품명이 없으면 기본값 사용
    const productNameToUse = productName || '제품';
    
    logger.info(`이미지 분석 요청: ${imageUrl}`);
    const result = await analyzeImage(imageUrl, productNameToUse);
    
    res.json(result);
  } catch (error) {
    logger.error(`이미지 분석 오류: ${error}`);
    res.status(500).json({ error: `이미지 분석 중 오류가 발생했습니다: ${error}` });
  }
});

/**
 * 이미지 일괄 분석 API
 * 여러 이미지 URL과 제품명을 받아 일괄 분석
 */
router.post('/batch-analyze', async (req: Request, res: Response) => {
  try {
    const { images } = req.body;
    
    // 필수 파라미터 확인
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: '이미지 목록이 필요합니다.' });
    }
    
    // 최대 분석 개수 제한 (서버 부하 방지)
    const MAX_IMAGES = 20;
    if (images.length > MAX_IMAGES) {
      return res.status(400).json({ 
        error: `한 번에 최대 ${MAX_IMAGES}개까지 분석 가능합니다.` 
      });
    }
    
    // 이미지 데이터 유효성 검사
    const validImages = images.filter(img => 
      typeof img === 'object' && img !== null && typeof img.url === 'string'
    );
    
    if (validImages.length === 0) {
      return res.status(400).json({ error: '유효한 이미지 정보가 없습니다.' });
    }
    
    logger.info(`이미지 일괄 분석 요청: ${validImages.length}개 이미지`);
    const results = await batchAnalyzeImages(validImages);
    
    res.json({
      total: validImages.length,
      analyzed: results.length,
      results
    });
  } catch (error) {
    logger.error(`이미지 일괄 분석 오류: ${error}`);
    res.status(500).json({ error: `이미지 일괄 분석 중 오류가 발생했습니다: ${error}` });
  }
});

/**
 * 제품 이미지 품질 평가 API
 * 제품 이미지 URL을 받아 품질 점수 반환
 */
router.post('/product-quality', async (req: Request, res: Response) => {
  try {
    const { imageUrl, productName } = req.body;
    
    // 필수 파라미터 확인
    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }
    
    logger.info(`제품 이미지 품질 평가 요청: ${imageUrl}`);
    
    // 전체 분석 결과 중 품질 부분만 추출
    const analysisResult = await analyzeImage(imageUrl, productName || '제품');
    const { quality } = analysisResult;
    
    res.json({
      imageUrl,
      quality,
      recommendations: generateQualityRecommendations(quality)
    });
  } catch (error) {
    logger.error(`제품 이미지 품질 평가 오류: ${error}`);
    res.status(500).json({ error: `제품 이미지 품질 평가 중 오류가 발생했습니다: ${error}` });
  }
});

/**
 * 이미지 SEO 분석 API
 * 이미지 URL을 받아 SEO 최적화 정보 반환
 */
router.post('/seo', async (req: Request, res: Response) => {
  try {
    const { imageUrl, productName } = req.body;
    
    // 필수 파라미터 확인
    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }
    
    logger.info(`이미지 SEO 분석 요청: ${imageUrl}`);
    
    // 전체 분석 결과 중 SEO 부분만 추출
    const analysisResult = await analyzeImage(imageUrl, productName || '제품');
    const { seo } = analysisResult;
    
    res.json({
      imageUrl,
      seo,
      recommendations: generateSEORecommendations(seo)
    });
  } catch (error) {
    logger.error(`이미지 SEO 분석 오류: ${error}`);
    res.status(500).json({ error: `이미지 SEO 분석 중 오류가 발생했습니다: ${error}` });
  }
});

/**
 * 경쟁사 제품 이미지 비교 API
 * 여러 경쟁사 제품 이미지를 비교 분석
 */
router.post('/compare-competitors', async (req: Request, res: Response) => {
  try {
    const { images } = req.body;
    
    // 필수 파라미터 확인
    if (!images || !Array.isArray(images) || images.length < 2) {
      return res.status(400).json({ 
        error: '최소 2개 이상의 이미지 정보가 필요합니다.'
      });
    }
    
    logger.info(`경쟁사 제품 이미지 비교 요청: ${images.length}개 이미지`);
    
    // 여러 이미지 분석
    const results = await batchAnalyzeImages(images);
    
    // 품질 점수 기준 내림차순 정렬
    results.sort((a, b) => b.quality.score - a.quality.score);
    
    // 최고/최저 품질 이미지 선정
    const bestImage = results[0];
    const worstImage = results[results.length - 1];
    
    // 선도 기업 및 개선 필요 기업 파악
    const leadingCompany = bestImage ? images.find(img => img.url === bestImage.imageUrl)?.productName || '알 수 없음' : '없음';
    const needsImprovementCompany = worstImage ? images.find(img => img.url === worstImage.imageUrl)?.productName || '알 수 없음' : '없음';
    
    // 전체 평균 품질 점수 계산
    const avgQualityScore = results.reduce((sum, r) => sum + r.quality.score, 0) / results.length;
    
    // 응답 생성
    res.json({
      totalCompared: results.length,
      avgQualityScore: Math.round(avgQualityScore * 10) / 10,
      leadingCompany,
      needsImprovementCompany,
      bestImage: bestImage || null,
      worstImage: worstImage || null,
      allResults: results,
      insights: generateCompetitorInsights(results),
      recommendations: generateCompetitorRecommendations(results)
    });
  } catch (error) {
    logger.error(`경쟁사 제품 이미지 비교 오류: ${error}`);
    res.status(500).json({ error: `경쟁사 제품 이미지 비교 중 오류가 발생했습니다: ${error}` });
  }
});

/**
 * 품질 개선 추천사항 생성
 * @param quality 품질 분석 결과
 * @returns 추천사항 목록
 */
function generateQualityRecommendations(quality: any): string[] {
  const recommendations: string[] = [];
  
  if (quality.score < 70) {
    recommendations.push('더 높은 해상도의 제품 이미지를 사용하세요.');
  }
  
  if (quality.clarity === '흐림' || quality.clarity === '보통') {
    recommendations.push('더 선명한, 초점이 맞은 제품 이미지를 사용하세요.');
  }
  
  if (quality.lighting === '어두움') {
    recommendations.push('더 밝은 조명 조건에서 제품 이미지를 촬영하세요.');
  }
  
  if (quality.resolution === '저해상도') {
    recommendations.push('최소 1200x1200 픽셀 이상의 고해상도 이미지를 사용하세요.');
  }
  
  // 기본 추천사항
  if (recommendations.length === 0) {
    recommendations.push('현재 이미지의 품질이 양호합니다.');
    recommendations.push('다양한 각도에서의 제품 이미지를 추가로 제공하는 것을 고려하세요.');
  }
  
  return recommendations;
}

/**
 * SEO 개선 추천사항 생성
 * @param seo SEO 분석 결과
 * @returns 추천사항 목록
 */
function generateSEORecommendations(seo: any): string[] {
  const recommendations: string[] = [];
  
  if (!seo.optimized) {
    recommendations.push('파일명에 의미 있는 키워드를 포함시키세요. 숫자나 임의 문자열은 피하세요.');
  }
  
  if (seo.fileName.length < 5) {
    recommendations.push('파일명이 너무 짧습니다. 더 설명적인 파일명을 사용하세요.');
  }
  
  if (seo.altTextSuggestion !== seo.fileName && !seo.optimized) {
    recommendations.push(`이미지의 alt 텍스트로 "${seo.altTextSuggestion}"를 사용하는 것이 좋습니다.`);
  }
  
  // 기본 추천사항
  if (recommendations.length === 0) {
    recommendations.push('현재 이미지 SEO 최적화가 잘 되어있습니다.');
    recommendations.push('이미지 압축을 통해 로딩 속도를 더 개선할 수 있습니다.');
  }
  
  return recommendations;
}

/**
 * 경쟁사 비교 인사이트 생성
 * @param results 분석 결과 목록
 * @returns 인사이트 목록
 */
function generateCompetitorInsights(results: any[]): string[] {
  // 결과가 없으면 빈 배열 반환
  if (!results || results.length === 0) {
    return [];
  }
  
  const insights: string[] = [];
  
  // 스타일 유형 분포 분석
  const styleTypes = results.map(r => r.features.style);
  const styleCount: Record<string, number> = {};
  
  for (const style of styleTypes) {
    styleCount[style] = (styleCount[style] || 0) + 1;
  }
  
  const dominantStyle = Object.entries(styleCount)
    .sort((a, b) => b[1] - a[1])
    .map(([style]) => style)[0];
  
  insights.push(`이 카테고리에서 가장 많이 사용되는 이미지 스타일은 '${dominantStyle}'입니다.`);
  
  // 색상 분석
  const allColors = results.flatMap(r => r.features.colors);
  const colorCount: Record<string, number> = {};
  
  for (const color of allColors) {
    colorCount[color] = (colorCount[color] || 0) + 1;
  }
  
  const topColors = Object.entries(colorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([color]) => color);
  
  insights.push(`이 카테고리의 제품 이미지에서 가장 자주 사용되는 색상은 ${topColors.join(', ')}입니다.`);
  
  // 품질 점수 분석
  const qualityScores = results.map(r => r.quality.score);
  const avgScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  
  if (avgScore > 80) {
    insights.push('전반적으로 경쟁사들은 고품질 이미지를 사용하고 있습니다.');
  } else if (avgScore < 60) {
    insights.push('이 카테고리는 이미지 품질 개선의 여지가 있습니다.');
  } else {
    insights.push('이 카테고리의 이미지 품질은 평균적입니다.');
  }
  
  // 브랜딩 가시성 분석
  const brandingVisible = results.filter(r => r.productInfo.visibleBranding).length;
  const brandingPercentage = (brandingVisible / results.length) * 100;
  
  if (brandingPercentage > 70) {
    insights.push('대부분의 경쟁사는 제품 이미지에 브랜드를 명확히 표시하고 있습니다.');
  } else if (brandingPercentage < 30) {
    insights.push('이 카테고리에서는 브랜드를 강조하지 않는 경향이 있습니다.');
  }
  
  return insights;
}

/**
 * 경쟁사 비교 기반 추천사항 생성
 * @param results 분석 결과 목록
 * @returns 추천사항 목록
 */
function generateCompetitorRecommendations(results: any[]): string[] {
  // 결과가 없으면 빈 배열 반환
  if (!results || results.length === 0) {
    return [];
  }
  
  const recommendations: string[] = [];
  
  // 최고 품질 이미지의 특성 추출
  const bestImage = results[0]; // 이미 정렬되어 있음
  
  recommendations.push(`최고 품질 이미지 특성 (${bestImage.quality.score}점)을 벤치마킹하세요:`);
  recommendations.push(`- 이미지 스타일: ${bestImage.features.style}`);
  recommendations.push(`- 주요 색상: ${bestImage.features.colors.join(', ')}`);
  recommendations.push(`- 배경 유형: ${bestImage.features.background}`);
  
  // 전체 평균 품질과 시장 트렌드 기반 추천
  const avgScore = results.reduce((sum, r) => sum + r.quality.score, 0) / results.length;
  
  if (avgScore > bestImage.quality.score - 15) {
    recommendations.push('시장 평균 이미지 품질이 높으므로, 경쟁력 확보를 위해 전문 제품 사진 촬영에 투자하는 것이 중요합니다.');
  } else {
    recommendations.push('시장 평균 이미지 품질이 상대적으로 낮으므로, 고품질 이미지를 사용해 차별화가 가능합니다.');
  }
  
  // 일반적인 추천사항
  recommendations.push('최고 품질의 이미지는 조명, 구도, 해상도 모두 우수하며 제품을 효과적으로 표현합니다.');
  
  return recommendations;
}

export default router;