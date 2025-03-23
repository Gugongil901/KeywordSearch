# 네이버 검색광고 API 오류 해결 가이드

## 1. 오류 분석

로그 메시지를 분석한 결과, 다음과 같은 주요 문제점이 발견되었습니다:

1. **404 Not Found 오류**
   - `/estimate/performance` API 경로에서 발생
   - API 오류: `API 오류: 404 Not Found`

2. **인증 관련 오류**
   - 서명 생성(Signature) 과정의 문제일 가능성
   - API 키 및 시크릿 키 처리 방식 문제

3. **API 요청 처리 방식**
   - 요청 경로나 파라미터 형식이 잘못되었을 가능성

## 2. 주요 오류 원인 및 해결책

### 2.1 잘못된 API 경로 사용

**문제:**
- 로그에서 `/estimate/performance` 경로에 대한 404 오류가 확인됨
- 해당 경로가 정확하지 않거나 네이버 API에서 변경되었을 가능성

**해결책:**
- 최신 네이버 검색광고 API 문서 확인 (https://naver.github.io/searchad-apidoc/)
- 정확한 엔드포인트 경로 확인: `/estimate/performance` 또는 `/estimate`
- API 버전이 변경되었을 수 있으므로 최신 문서 참고

### 2.2 인증 서명 생성 오류

**문제:**
- HMAC-SHA256 서명 생성 과정에서 오류 발생 가능성
- 시간 타임스탬프, 메서드, 경로 형식 불일치

**해결책:**
- 정확한 서명 생성 로직 구현:
  ```
  message = timestamp + "." + method + "." + path
  signature = Base64(HMAC-SHA256(secret_key, message))
  ```
- 타임스탬프는 밀리초 단위(13자리)로 사용
- HTTP 메서드는 대문자로 사용 (GET, POST)
- 경로는 쿼리 파라미터를 제외한 URI 경로만 사용

### 2.3 요청 본문 형식 오류

**문제:**
- JSON 요청 본문 형식이 잘못되었을 가능성
- 필수 필드 누락 또는 잘못된 형식 사용

**해결책:**
- 올바른 요청 형식 사용:
  ```json
  {
    "device": "PC",
    "keywordplus": false,
    "key": "키워드명",
    "bids": [100, 300, 500, 1000]
  }
  ```
- Content-Type 헤더를 'application/json; charset=UTF-8'로 설정
- 요청 본문을 JSON 형식으로 직렬화하여 전송

### 2.4 API 키 및 인증 정보 확인

**문제:**
- 잘못된 API 키, 시크릿 키, 고객 ID 사용 가능성
- 권한이 부족한 API 키 사용

**해결책:**
- 네이버 검색광고 관리자 콘솔에서 API 키 재확인
- 키가 유효한지, 만료되지 않았는지 확인
- 모든 필요한 API에 대한 권한이 있는지 확인

## 3. 코드 수정 사항

### 3.1 서명 생성 함수 수정

**기존 코드:**
```typescript
// 잘못된 서명 생성 방식
const generateSignature = (timestamp, method, path) => {
  const message = timestamp + "," + method + "," + path;  // 쉼표(,) 사용 오류
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  return hmac.update(message).digest('base64');
};
```

**수정된 코드:**
```typescript
// 올바른 서명 생성 방식
const generateSignature = (timestamp, method, path, secretKey) => {
  const message = `${timestamp}.${method}.${path}`;  // 마침표(.) 사용
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  return hmac.digest('base64');
};
```

### 3.2 API 경로 수정

**기존 코드:**
```typescript
// 잘못된 API 경로
const path = '/estimate';
```

**수정된 코드:**
```typescript
// 올바른 API 경로
const path = '/estimate/performance';
```

### 3.3 요청 본문 형식 수정

**기존 코드:**
```typescript
// 잘못된 요청 본문 형식
const data = {
  device: "PC",
  keywordplus: "false",  // 문자열로 잘못 설정
  key: keyword,
  bids: bids.toString()  // 배열이 아닌 문자열로 변환 오류
};
```

**수정된 코드:**
```typescript
// 올바른 요청 본문 형식
const data = {
  device: "PC",
  keywordplus: false,    // 불리언으로 올바르게 설정
  key: keyword,
  bids: bids             // 배열 형태 유지
};
```

## 4. 문제 해결 체크리스트

API 호출 시 다음 사항을 확인하세요:

1. **API 인증 정보**
   - [x] 올바른 고객 ID (CUSTOMER_ID) 사용
   - [x] 올바른 API 접근 라이센스 (ACCESS_LICENSE) 사용
   - [x] 올바른 시크릿 키 (SECRET_KEY) 사용

2. **요청 헤더**
   - [x] Content-Type 헤더가 'application/json; charset=UTF-8'로 설정
   - [x] X-Timestamp가 밀리초 단위의 현재 시간으로 설정
   - [x] X-API-KEY가 API 접근 라이센스로 설정
   - [x] X-Customer가 고객 ID로 설정
   - [x] X-Signature가 올바르게 생성된 서명으로 설정

3. **API 경로 및 메서드**
   - [x] 올바른 기본 URL (https://api.naver.com) 사용
   - [x] 올바른 API 경로 사용 (/keywordstool, /estimate/performance 등)
   - [x] 적절한 HTTP 메서드 사용 (GET, POST)

4. **요청 본문 및 파라미터**
   - [x] GET 요청의 경우, 올바른 쿼리 파라미터 사용
   - [x] POST 요청의 경우, 올바른 JSON 형식의 요청 본문 사용
   - [x] 필수 파라미터가 모두 포함되어 있는지 확인

5. **오류 처리**
   - [x] API 응답 상태 코드 확인
   - [x] 오류 응답 본문 확인 및 로깅
   - [x] 적절한 재시도 메커니즘 구현

## 5. API 응답 해석

### 5.1 정상 응답 예시

**키워드 검색량 조회 (/keywordstool)**
```json
{
  "keywordList": [
    {
      "relKeyword": "건강기능식품",
      "monthlyPcQcCnt": "9900",
      "monthlyMobileQcCnt": "35200",
      "monthlyAvePcClkCnt": "372",
      "monthlyAveMobileClkCnt": "1355",
      "monthlyAvePcCtr": "0.99",
      "monthlyAveMobileCtr": "1.03",
      "plAvgDepth": "14.33",
      "compIdx": "높음"
    },
    // ... 더 많은 키워드
  ]
}
```

**성과 예측 조회 (/estimate/performance)**
```json
[
  {
    "bid": 100,
    "clicks": 0.44,
    "impressions": 20.04,
    "cost": 44,
    "position": 12.97
  },
  {
    "bid": 500,
    "clicks": 1.38,
    "impressions": 46.71,
    "cost": 689,
    "position": 7.42
  }
  // ... 더 많은 입찰가 결과
]
```

### 5.2 오류 응답 해석

**404 Not Found**
- API 경로가 잘못되었을 가능성
- 리소스가 존재하지 않음

**401 Unauthorized**
- 인증 정보가 잘못되었을 가능성
- API 키 또는 서명이 잘못됨

**400 Bad Request**
- 요청 본문 또는 파라미터가 잘못됨
- 필수 필드 누락 또는 잘못된 형식

## 6. API 사용 팁

1. **테스트 및 디버깅**
   - API 호출 전후에 요청 및 응답 로깅
   - 주요 정보를 제외한 모든 파라미터와 헤더 로깅
   - 응답 형식 및 구조 정확히 파악

2. **재시도 메커니즘**
   - 일시적인 오류에 대한 재시도 로직 구현
   - 지수 백오프 적용 (시간 간격을 점점 늘려가며 재시도)
   - 최대 재시도 횟수 설정

3. **캐싱 구현**
   - 자주 사용되는 데이터 캐싱
   - API 호출 횟수 최소화
   - 캐시 유효 기간 적절히 설정

4. **에러 핸들링**
   - 모든 예외 상황 처리
   - 사용자에게 친절한 오류 메시지 제공
   - 중요 오류 알림 시스템 구현

## 7. 유용한 디버깅 도구

1. **API 요청 디버깅**
   - Postman: API 요청 테스트 및 디버깅
   - curl: 명령줄에서 API 요청 테스트
   - network 모니터링 도구: 요청 및 응답 확인

2. **로깅 도구**
   - Winston: Node.js 로깅 라이브러리
   - Morgan: Express 요청 로깅 미들웨어
   - Debug: 조건부 로깅을 위한 Node.js 패키지

## 8. 결론

네이버 검색광고 API 연동 시 가장 중요한 사항은 다음과 같습니다:

1. **정확한 인증 정보 사용**: 올바른 고객 ID, API 키, 시크릿 키 사용
2. **올바른 서명 생성**: 타임스탬프, 메서드, 경로를 올바른 형식으로 결합하여 서명 생성
3. **API 경로 확인**: 최신 API 문서를 참고하여 올바른 경로 사용
4. **요청 형식 준수**: 각 API에 맞는 올바른 파라미터 및 요청 본문 형식 사용
5. **오류 처리**: 모든 예외 상황에 대한 적절한 처리 및 로깅

이 가이드를 따라 문제를 해결하면 네이버 검색광고 API를 안정적으로 활용할 수 있습니다.
