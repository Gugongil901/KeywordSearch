# 네이버 쇼핑인사이트 API 통합 가이드

이 문서는 네이버 쇼핑인사이트 API 연동을 위한 상세 가이드입니다. 공식 API 문서를 기반으로 올바른 요청 형식과 응답 처리 방법을 제공합니다.

## 1. API 개요

네이버 쇼핑인사이트 API는 네이버 데이터랩의 쇼핑인사이트를 API로 실행할 수 있는 RESTful API입니다. 주요 특징은 다음과 같습니다:

- 네이버 통합검색의 쇼핑 영역과 네이버쇼핑에서의 검색 클릭 추이 데이터를 JSON 형식으로 반환
- 쇼핑 분야별 검색 클릭 추이와 특정 쇼핑 분야의 검색 키워드별 검색 클릭 추이 제공
- 비로그인 방식 오픈 API (클라이언트 ID와 시크릿 필요)
- 하루 호출 한도: 1,000회

## 2. 주요 엔드포인트

네이버 쇼핑인사이트 API는 다양한 엔드포인트를 제공합니다:

| 엔드포인트 | 설명 |
|------------|------|
| `/v1/datalab/shopping/categories` | 쇼핑 분야별 트렌드 조회 |
| `/v1/datalab/shopping/category/device` | 특정 쇼핑 분야의 기기별 트렌드 조회 |
| `/v1/datalab/shopping/category/gender` | 특정 쇼핑 분야의 성별 트렌드 조회 |
| `/v1/datalab/shopping/category/age` | 특정 쇼핑 분야의 연령별 트렌드 조회 |
| `/v1/datalab/shopping/category/keywords` | **특정 쇼핑 분야의 키워드별 트렌드 조회** |
| `/v1/datalab/shopping/category/keyword/device` | 특정 쇼핑 분야와 키워드의 기기별 트렌드 조회 |
| `/v1/datalab/shopping/category/keyword/gender` | 특정 쇼핑 분야와 키워드의 성별 트렌드 조회 |
| `/v1/datalab/shopping/category/keyword/age` | 특정 쇼핑 분야와 키워드의 연령별 트렌드 조회 |

이 가이드에서는 `/v1/datalab/shopping/category/keywords` 엔드포인트에 중점을 둡니다.

## 3. 인기 키워드 API 요청 형식

### 엔드포인트
```
https://openapi.naver.com/v1/datalab/shopping/category/keywords
```

### HTTP 메서드
POST

### 헤더
```
X-Naver-Client-Id: {애플리케이션 등록 시 발급받은 클라이언트 아이디 값}
X-Naver-Client-Secret: {애플리케이션 등록 시 발급받은 클라이언트 시크릿 값}
Content-Type: application/json
```

### 요청 파라미터

| 파라미터 | 타입 | 필수 여부 | 설명 |
|----------|------|-----------|------|
| startDate | string | Y | 조회 기간 시작 날짜(yyyy-mm-dd 형식) |
| endDate | string | Y | 조회 기간 종료 날짜(yyyy-mm-dd 형식) |
| timeUnit | string | Y | 구간 단위 (date, week, month) |
| category | string | Y | 쇼핑 분야 코드 |
| keyword | array(JSON) | Y | 검색 키워드 그룹 이름과 검색 키워드 쌍의 배열 |
| device | string | N | 기기 유형 (빈값, pc, mo) |
| gender | string | N | 성별 (빈값, m, f) |
| ages | array(JSON) | N | 연령 (빈값, "10", "20", "30", "40", "50", "60") |

### 요청 본문 예시

```json
{
  "startDate": "2025-03-14",
  "endDate": "2025-03-21",
  "timeUnit": "date",
  "category": "50000000",
  "keyword": [
    {"name": "디지털/가전", "param": ["스마트폰"]}
  ],
  "device": "",
  "gender": "",
  "ages": []
}
```

## 4. 응답 형식

API 응답은 JSON 형식으로 반환됩니다:

```json
{
  "startDate": "2025-03-14",
  "endDate": "2025-03-21",
  "timeUnit": "date",
  "results": [
    {
      "title": "디지털/가전",
      "keyword": ["스마트폰"],
      "data": [
        {
          "period": "2025-03-14",
          "ratio": 84.01252
        },
        {
          "period": "2025-03-15",
          "ratio": 91.32512
        },
        // ... 나머지 날짜별 데이터
      ]
    }
  ]
}
```

## 5. 카테고리 ID 참조

네이버 쇼핑의 주요 카테고리 ID:

| 카테고리 ID | 카테고리명 |
|-------------|------------|
| 50000000 | 디지털/가전 |
| 50000001 | 패션의류 |
| 50000002 | 가구/인테리어 |
| 50000003 | 화장품/미용 |
| 50000004 | 식품 |
| 50000005 | 스포츠/레저 |
| 50000006 | 생활/건강 |
| 50000007 | 여가/문화 |

## 6. 구현 시 고려사항

### 속도 제한 준수

API 호출 한도는 하루 1,000회로 제한되어 있습니다. 효율적인 API 사용을 위해:

- 배치 요청으로 여러 카테고리를 한 번에 처리하지 말고 순차적으로 처리
- 데이터 캐싱 구현으로 반복 요청 최소화
- 요청 간 적절한 지연 시간 삽입 (너무 빠른 연속 요청 방지)

### 오류 처리

네이버 API는 다양한 오류 상황을 반환할 수 있습니다:

- 400 오류: 잘못된 요청 (파라미터 확인)
- 401 오류: 인증 실패 (API 키 확인)
- 403 오류: 권한 부족 (API 사용 권한 확인)
- 404 오류: 리소스 없음 (엔드포인트 확인)
- 429 오류: 요청 한도 초과
- 500 오류: 서버 내부 오류

각 오류 상황에 대한 적절한 처리와 재시도 로직을 구현하세요.

### 백업 메커니즘

API 장애 또는 제한에 대비한 백업 메커니즘을 구현하세요:

- 마지막으로 성공한 API 응답 캐싱
- 정적 백업 데이터 준비
- 사용자에게 백업 데이터 사용 중임을 알림

## 7. 코드 예제

### Node.js 예제

```javascript
const axios = require('axios');

async function getShoppingInsightKeywords(categoryId, startDate, endDate) {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://openapi.naver.com/v1/datalab/shopping/category/keywords',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': 'YOUR_CLIENT_ID',
        'X-Naver-Client-Secret': 'YOUR_CLIENT_SECRET'
      },
      data: {
        startDate: startDate,
        endDate: endDate,
        timeUnit: 'date',
        category: categoryId,
        keyword: [
          {"name": "검색어", "param": [""]}
        ],
        device: '',
        gender: '',
        ages: []
      },
      timeout: 10000
    });
    
    return response.data;
  } catch (error) {
    console.error('쇼핑인사이트 API 호출 실패:', error);
    throw error;
  }
}
```

## 8. API 테스트 방법

API 연동 전에 다음 테스트를 수행하여 올바른 요청 형식을 확인하세요:

1. 제공된 테스트 스크립트를 사용하여 다양한 요청 형식 테스트
2. 응답 데이터 구조 분석
3. 성공하는 형식을 코드에 적용

## 9. 추가 자원

- [네이버 개발자 센터](https://developers.naver.com)
- [쇼핑인사이트 API 문서](https://developers.naver.com/docs/serviceapi/datalab/shopping/datalab.shopping.api.md)
- [네이버 개발자 포럼](https://developers.naver.com/forum)

네이버 API 연동 시 문제가 발생할 경우 네이버 개발자 포럼에 문의하세요.