/**
 * 숫자를 천 단위 콤마가 포함된 문자열로 변환
 * @param num 변환할 숫자
 * @returns 포맷팅된 문자열
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/**
 * 날짜를 한국어 형식으로 변환
 * @param dateString 날짜 문자열
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 백분율을 소수점 1자리 문자열로 변환
 * @param value 백분율 값 (0-100)
 * @returns 포맷팅된 백분율 문자열
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * 가격을 원화 형식으로 변환
 * @param price 가격
 * @returns 포맷팅된 가격 문자열
 */
export function formatPrice(price: number): string {
  return `₩${formatNumber(price)}`;
}

/**
 * 긍정/부정 수치에 따라 색상 클래스 반환
 * @param value 변화량
 * @param inverse 부호 반전 여부 (기본값: false)
 * @returns 색상 클래스명
 */
export function getChangeColorClass(value: number, inverse: boolean = false): string {
  // 부호 반전 옵션 (예: 가격이 내려가면 좋은 것이므로 초록색으로 표시)
  value = inverse ? -value : value;
  
  if (value > 0) {
    return 'text-emerald-600';
  } else if (value < 0) {
    return 'text-red-600';
  }
  return 'text-gray-600';
}