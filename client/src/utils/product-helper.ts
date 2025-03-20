/**
 * 제품 ID 또는 URL에서 네이버 상품 ID를 추출하는 유틸리티 함수 모음
 */

/**
 * 네이버 상품 URL에서 상품 ID를 추출합니다.
 * @param url 네이버 상품 URL
 * @returns 추출된 상품 ID 또는 null
 */
export function extractProductIdFromUrl(url: string): string | null {
  if (!url) return null;

  try {
    // URL 형식이 다양하므로 여러 패턴에 대응
    
    // 1. smartstore.naver.com/xxx/products/12345 패턴
    let match = url.match(/smartstore\.naver\.com\/[^\/]+\/products\/(\d+)/i);
    if (match) return match[1];
    
    // 2. catalog.naver.com/catalog/12345 패턴
    match = url.match(/catalog\.naver\.com\/catalog\/(\d+)/i);
    if (match) return match[1];
    
    // 3. brandstore.naver.com/xxx/products/12345 패턴
    match = url.match(/brandstore\.naver\.com\/[^\/]+\/products\/(\d+)/i);
    if (match) return match[1];
    
    // 4. search.shopping.naver.com/catalog/12345 패턴
    match = url.match(/search\.shopping\.naver\.com\/catalog\/(\d+)/i);
    if (match) return match[1];

    // 5. shopping.naver.com/products/12345 패턴
    match = url.match(/shopping\.naver\.com\/products\/(\d+)/i);
    if (match) return match[1];
    
    // 숫자로만 된 문자열이면 그대로 반환
    if (/^\d+$/.test(url)) return url;
    
    // 추출 실패
    return null;
  } catch (e) {
    console.error('URL에서 상품 ID 추출 실패:', e);
    return null;
  }
}

/**
 * 제품 ID 또는 이름으로 네이버 상품 URL을 생성합니다.
 * @param productId 제품 ID
 * @param productName 제품 이름 (ID가 없을 경우 사용)
 * @returns 네이버 상품 URL
 */
export function createProductUrl(productId?: string, productName?: string): string {
  if (!productId && !productName) {
    return '#';
  }
  
  // 이미 URL 형태인 경우
  if (productId && (productId.startsWith('http://') || productId.startsWith('https://'))) {
    return productId;
  }
  
  // 네이버 상품 ID인 경우
  if (productId && /^\d+$/.test(productId)) {
    return `https://smartstore.naver.com/main/products/${productId}`;
  }
  
  // 상품명이 있는 경우 검색 URL 반환
  if (productName) {
    return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(productName)}`;
  }
  
  // 상품 ID를 검색어로 사용
  return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(productId || '')}`;
}

/**
 * 제품 이름에서 제조사나 브랜드를 추출합니다.
 * @param productName 제품 이름
 * @returns 추출된 브랜드명 또는 null
 */
export function extractBrandFromProductName(productName: string): string | null {
  if (!productName) return null;
  
  // 1. "브랜드명 제품명" 패턴
  const firstWordMatch = productName.match(/^([가-힣a-zA-Z0-9]+)(?:\s+|\s*[_-]\s*)/);
  if (firstWordMatch) return firstWordMatch[1];
  
  // 2. "[브랜드]" 패턴
  const bracketMatch = productName.match(/\[([^\]]+)\]/);
  if (bracketMatch) return bracketMatch[1];
  
  return null;
}

/**
 * 특수 패턴의 제품명을 쿼리용 키워드로 변환합니다.
 * @param productName 제품 이름
 * @returns 검색에 적합한 키워드
 */
export function convertProductNameToSearchKeyword(productName: string): string {
  if (!productName) return '';
  
  let keyword = productName;
  
  // 괄호와 그 내용 제거 (예: "제품 (고급형)" -> "제품")
  keyword = keyword.replace(/\s*\([^)]+\)\s*/g, ' ');
  
  // 불필요한 접미사 제거 (예: "제품 1+1" -> "제품")
  keyword = keyword.replace(/\s+\d+\+\d+\s*$/g, '');
  
  // 과도한 공백 제거
  keyword = keyword.replace(/\s+/g, ' ').trim();
  
  // 너무 짧은 경우 원래 이름 반환
  if (keyword.length < 2) return productName;
  
  return keyword;
}