/**
 * 이미지 분석 모듈
 * 
 * 제품 이미지를 분석하여 주요 특징과 품질을 평가하는 기능 제공
 */

import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * 이미지 분석 결과 인터페이스
 */
export interface ImageAnalysisResult {
  imageUrl: string;
  quality: {
    score: number;        // 0-100 점수
    resolution: string;   // 저해상도, 중간해상도, 고해상도
    clarity: string;      // 흐림, 보통, 선명함
    lighting: string;     // 어두움, 보통, 밝음
  };
  features: {
    colors: string[];     // 주요 색상
    dominantColor: string; // 지배적 색상
    background: string;   // 배경 유형 (단색, 그라데이션, 복잡함)
    style: string;        // 이미지 스타일 (스튜디오샷, 실제사용샷, 제품만)
  };
  productInfo: {
    category: string;     // 추정 제품 카테고리
    visibleBranding: boolean; // 브랜드 로고 표시 여부
    packagingVisible: boolean; // 포장 표시 여부
    multipleViews: boolean; // 다각도 이미지 여부
  };
  seo: {
    fileName: string;     // 파일명
    altTextSuggestion: string; // 추천 대체 텍스트
    optimized: boolean;   // SEO 최적화 여부
  };
}

/**
 * 이미지 URL에서 파일명 추출
 * @param url 이미지 URL
 * @returns 파일명
 */
function extractFilenameFromUrl(url: string): string {
  try {
    // URL의 경로 부분에서 마지막 '/' 이후의 문자열을 파일명으로 추출
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'unknown';
    
    // URL 파라미터 제거
    return filename.split('?')[0];
  } catch (error) {
    logger.error(`이미지 URL에서 파일명 추출 실패: ${error}`);
    return 'unknown';
  }
}

/**
 * 이미지 URL에서 확장자 추출
 * @param url 이미지 URL
 * @returns 파일 확장자
 */
function getImageExtension(url: string): string {
  try {
    const filename = extractFilenameFromUrl(url);
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    // 유효한 이미지 확장자 확인
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    return validExtensions.includes(extension) ? extension : 'unknown';
  } catch (error) {
    logger.error(`이미지 URL에서 확장자 추출 실패: ${error}`);
    return 'unknown';
  }
}

/**
 * 이미지 URL이 유효한지 확인
 * @param url 이미지 URL
 * @returns 유효성 여부
 */
async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    // HEAD 요청으로 이미지 URL 유효성 검사 (실제 다운로드 없이)
    const response = await axios.head(url, { timeout: 3000 });
    
    // 상태 코드 확인
    if (response.status !== 200) {
      return false;
    }
    
    // Content-Type 확인
    const contentType = response.headers['content-type'];
    return contentType ? contentType.startsWith('image/') : false;
  } catch (error) {
    logger.error(`이미지 URL 유효성 검사 실패: ${error}`);
    return false;
  }
}

/**
 * 이미지 품질 평가
 * @param imageUrl 이미지 URL
 * @returns 품질 평가 결과
 */
async function analyzeImageQuality(imageUrl: string): Promise<ImageAnalysisResult['quality']> {
  try {
    // 이미지 확장자 확인
    const extension = getImageExtension(imageUrl);
    
    // 확장자 기반 초기 점수 할당
    let initialScore = 70; // 기본 점수
    
    // 확장자에 따른 점수 조정
    switch (extension) {
      case 'svg':
        initialScore = 90; // SVG는 벡터 이미지로 고품질
        break;
      case 'webp':
        initialScore = 85; // WebP는 최신 포맷으로 최적화된 경우가 많음
        break;
      case 'png':
        initialScore = 80; // PNG는 무손실 압축으로 품질이 좋음
        break;
      case 'jpg':
      case 'jpeg':
        initialScore = 75; // JPEG는 손실 압축이나 일반적으로 사용됨
        break;
      case 'gif':
        initialScore = 65; // GIF는 제한된 색상 팔레트
        break;
      default:
        initialScore = 70; // 알 수 없는 포맷
    }
    
    // URL 패턴 기반 추가 분석
    // 고해상도 이미지 패턴 (URL에 해상도 힌트가 있는 경우)
    if (imageUrl.includes('large') || 
        imageUrl.includes('high') || 
        imageUrl.includes('hd') || 
        imageUrl.includes('2x') || 
        imageUrl.includes('original')) {
      initialScore += 10;
    }
    
    // 저해상도 또는 썸네일 패턴
    if (imageUrl.includes('thumb') || 
        imageUrl.includes('small') || 
        imageUrl.includes('icon') || 
        imageUrl.includes('mini')) {
      initialScore -= 15;
    }
    
    // 점수 범위 조정
    const score = Math.max(0, Math.min(100, initialScore));
    
    // 해상도 카테고리
    let resolution;
    if (score >= 85) resolution = "고해상도";
    else if (score >= 65) resolution = "중간해상도";
    else resolution = "저해상도";
    
    // 선명도 카테고리 (점수 기반 추정)
    let clarity;
    if (score >= 85) clarity = "선명함";
    else if (score >= 60) clarity = "보통";
    else clarity = "흐림";
    
    // 조명 카테고리 (네이버 쇼핑 이미지는 대체로 밝은 조명 사용)
    let lighting = "보통";
    
    return {
      score,
      resolution,
      clarity,
      lighting
    };
  } catch (error) {
    logger.error(`이미지 품질 분석 실패: ${error}`);
    return {
      score: 60,
      resolution: "중간해상도",
      clarity: "보통",
      lighting: "보통"
    };
  }
}

/**
 * 이미지 특성 분석
 * @param imageUrl 이미지 URL
 * @param category 제품 카테고리
 * @returns 이미지 특성
 */
function analyzeImageFeatures(imageUrl: string, category: string): ImageAnalysisResult['features'] {
  try {
    // URL 패턴과 카테고리 기반 색상 추정
    let colors: string[] = [];
    let dominantColor = '';
    let background = '';
    let style = '';
    
    // 카테고리별 특성 추정
    if (category.includes('비타민') || category.includes('건강식품')) {
      colors = ['녹색', '노란색', '흰색'];
      dominantColor = '녹색';
      background = '단색';
      style = '제품만';
    } else if (category.includes('화장품') || category.includes('스킨케어')) {
      colors = ['흰색', '파란색', '분홍색'];
      dominantColor = '흰색';
      background = '그라데이션';
      style = '스튜디오샷';
    } else if (category.includes('식품') || category.includes('간식')) {
      colors = ['빨간색', '노란색', '갈색'];
      dominantColor = '빨간색';
      background = '단색';
      style = '제품만';
    } else if (category.includes('의류') || category.includes('패션')) {
      colors = ['흰색', '검정색', '회색'];
      dominantColor = '흰색';
      background = '단색';
      style = '스튜디오샷';
    } else {
      colors = ['흰색', '검정색', '회색'];
      dominantColor = '흰색';
      background = '단색';
      style = '제품만';
    }
    
    // URL에서 스타일 힌트 추출
    if (imageUrl.includes('model') || imageUrl.includes('person') || imageUrl.includes('wear')) {
      style = '모델샷';
    } else if (imageUrl.includes('detail') || imageUrl.includes('close')) {
      style = '상세샷';
    } else if (imageUrl.includes('studio') || imageUrl.includes('white_bg')) {
      style = '스튜디오샷';
    } else if (imageUrl.includes('use') || imageUrl.includes('lifestyle')) {
      style = '실제사용샷';
    }
    
    return {
      colors,
      dominantColor,
      background,
      style
    };
  } catch (error) {
    logger.error(`이미지 특성 분석 실패: ${error}`);
    return {
      colors: ['흰색', '검정색'],
      dominantColor: '흰색',
      background: '단색',
      style: '제품만'
    };
  }
}

/**
 * 제품 정보 분석
 * @param imageUrl 이미지 URL
 * @param productName 제품명
 * @returns 제품 정보
 */
function analyzeProductInfo(imageUrl: string, productName: string): ImageAnalysisResult['productInfo'] {
  try {
    // 제품명과 URL 패턴을 기반으로 카테고리 추정
    let category = '기타';
    
    // 카테고리 추정 로직
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('비타민') || lowerName.includes('영양제') || lowerName.includes('건강기능식품')) {
      category = '건강기능식품';
    } else if (lowerName.includes('화장품') || lowerName.includes('스킨') || lowerName.includes('로션')) {
      category = '화장품/스킨케어';
    } else if (lowerName.includes('식품') || lowerName.includes('간식') || lowerName.includes('식이')) {
      category = '식품';
    } else if (lowerName.includes('의류') || lowerName.includes('옷') || lowerName.includes('패션')) {
      category = '의류/패션';
    } else if (lowerName.includes('전자') || lowerName.includes('기기') || lowerName.includes('디지털')) {
      category = '전자/디지털';
    }
    
    // 브랜딩 표시 여부 추정
    // URL에 브랜드명 힌트가 있거나 고품질 이미지인 경우 브랜딩 표시 가능성 높음
    const visibleBranding = imageUrl.includes('brand') || 
                          imageUrl.includes('official') ||
                          imageUrl.includes('logo');
    
    // 포장 표시 여부 추정
    const packagingVisible = !imageUrl.includes('unbox') && 
                           !imageUrl.includes('detail') && 
                           !imageUrl.includes('open');
    
    // 다각도 이미지 여부 추정
    const multipleViews = imageUrl.includes('view') || 
                         imageUrl.includes('angle') || 
                         imageUrl.includes('set');
    
    return {
      category,
      visibleBranding,
      packagingVisible,
      multipleViews
    };
  } catch (error) {
    logger.error(`제품 정보 분석 실패: ${error}`);
    return {
      category: '기타',
      visibleBranding: false,
      packagingVisible: true,
      multipleViews: false
    };
  }
}

/**
 * SEO 분석
 * @param imageUrl 이미지 URL
 * @param productName 제품명
 * @returns SEO 분석 결과
 */
function analyzeSEO(imageUrl: string, productName: string): ImageAnalysisResult['seo'] {
  try {
    // 파일명 추출
    const fileName = extractFilenameFromUrl(imageUrl);
    
    // 파일명 기반 SEO 최적화 평가
    // 좋은 파일명은 제품명과 관련이 있고, 의미있는 단어로 구성되어야 함
    const optimized = fileName.length > 5 && 
                    !fileName.includes('img') && 
                    !fileName.includes('image') && 
                    !fileName.includes('pic') && 
                    !fileName.includes('photo') &&
                    !fileName.match(/^[0-9]+$/);
    
    // 추천 대체 텍스트 생성
    let altTextSuggestion = productName;
    
    // 제품명이 너무 길면 축약
    if (altTextSuggestion.length > 50) {
      altTextSuggestion = altTextSuggestion.substring(0, 50) + '...';
    }
    
    return {
      fileName,
      altTextSuggestion,
      optimized
    };
  } catch (error) {
    logger.error(`SEO 분석 실패: ${error}`);
    return {
      fileName: extractFilenameFromUrl(imageUrl),
      altTextSuggestion: productName,
      optimized: false
    };
  }
}

/**
 * 이미지 종합 분석
 * @param imageUrl 이미지 URL
 * @param productName 제품명
 * @returns 분석 결과
 */
export async function analyzeImage(imageUrl: string, productName: string): Promise<ImageAnalysisResult> {
  try {
    logger.info(`이미지 분석 시작: ${imageUrl}`);
    
    // 이미지 URL 유효성 검사
    const isValid = await isImageUrlValid(imageUrl);
    if (!isValid) {
      logger.warn(`유효하지 않은 이미지 URL: ${imageUrl}`);
      throw new Error('유효하지 않은 이미지 URL');
    }
    
    // 이미지 품질 분석
    const quality = await analyzeImageQuality(imageUrl);
    
    // 제품 정보 분석
    const productInfo = analyzeProductInfo(imageUrl, productName);
    
    // 이미지 특성 분석
    const features = analyzeImageFeatures(imageUrl, productInfo.category);
    
    // SEO 분석
    const seo = analyzeSEO(imageUrl, productName);
    
    // 종합 분석 결과
    const result: ImageAnalysisResult = {
      imageUrl,
      quality,
      features,
      productInfo,
      seo
    };
    
    logger.info(`이미지 분석 완료: ${imageUrl}`);
    return result;
  } catch (error) {
    logger.error(`이미지 분석 오류: ${error}`);
    throw error;
  }
}

/**
 * 복수 이미지 일괄 분석
 * @param images 이미지 정보 배열 (URL과 제품명)
 * @returns 분석 결과 배열
 */
export async function batchAnalyzeImages(images: Array<{ url: string; productName: string }>): Promise<ImageAnalysisResult[]> {
  try {
    logger.info(`일괄 이미지 분석 시작: ${images.length}개 이미지`);
    
    // 이미지당 병렬 처리하지만 최대 5개로 제한 (서버 부하 방지)
    const results = await Promise.all(
      images.map(async ({ url, productName }) => {
        try {
          return await analyzeImage(url, productName);
        } catch (error) {
          logger.error(`개별 이미지 분석 실패 (${url}): ${error}`);
          // 실패한 이미지는 null 반환 (나중에 필터링)
          return null;
        }
      })
    );
    
    // 실패한 항목 제거
    const validResults = results.filter((r): r is ImageAnalysisResult => r !== null);
    
    logger.info(`일괄 이미지 분석 완료: ${validResults.length}/${images.length}개 성공`);
    return validResults;
  } catch (error) {
    logger.error(`일괄 이미지 분석 오류: ${error}`);
    throw error;
  }
}