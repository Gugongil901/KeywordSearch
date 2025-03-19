"""
의미적 키워드 분석 모듈

한국어 자연어 처리를 통해 키워드의 의미적 분석과 관련 키워드 발굴을 담당합니다.
"""
import os
import json
import numpy as np
import spacy
from collections import Counter

# scikit-learn은 선택적으로 가져오기 (벡터 작업에서만 사용)
try:
    from sklearn.cluster import KMeans
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class SemanticKeywordAnalyzer:
    """
    의미적 키워드 분석 클래스
    
    키워드의 의미 분석, 관련 키워드 발굴, 시장 세그먼트 식별 등을 수행합니다.
    """
    
    def __init__(self, db_connector=None):
        """
        초기화
        
        Args:
            db_connector: 데이터베이스 커넥터 인스턴스
        """
        # 한국어 NLP 모델 로드
        try:
            self.nlp = spacy.load('ko_core_news_sm')
        except:
            # 모델이 없으면 더 작은 모델 시도
            self.nlp = spacy.load('ko_core_news_sm')
        
        self.db = db_connector
        self.intent_keywords = self._load_intent_keywords()
        self.categories_map = self._load_categories_map()
        
    def _load_intent_keywords(self):
        """검색 의도 관련 키워드 사전 로드"""
        return {
            "정보 탐색": ["뜻", "의미", "효능", "효과", "기능", "역할", "사용법", "활용", "방법", "종류"],
            "구매 의도": ["구매", "구입", "사다", "사기", "주문", "결제", "가격", "최저가", "할인", "구입처"],
            "비교 의도": ["비교", "차이", "대비", "vs", "또는", "아니면", "추천", "좋은", "나은", "어떤"],
            "문제 해결": ["문제", "오류", "에러", "고장", "수리", "해결", "방법", "원인", "이유", "대처"]
        }
        
    def _load_categories_map(self):
        """의미 카테고리 매핑 정보 로드"""
        return {
            "제품": ["제품", "상품", "물건", "아이템", "굿즈", "제조", "생산", "만들기"],
            "브랜드": ["브랜드", "회사", "업체", "메이커", "제조사", "공식", "정품"],
            "가격": ["가격", "금액", "원", "비용", "할인", "세일", "특가", "프로모션"],
            "품질": ["품질", "성능", "내구성", "튼튼", "단단", "효과", "효능", "효율"],
            "사용": ["사용", "활용", "쓰임", "용도", "기능", "작동", "동작", "운용"],
            "구매": ["구매", "구입", "쇼핑", "주문", "결제", "배송", "택배", "배달"],
            "건강": ["건강", "다이어트", "영양", "보충제", "보조", "약", "영양제", "식품"]
        }
        
    def analyze_keyword_meaning(self, keyword):
        """
        키워드의 의미적 분석
        
        Args:
            keyword: 분석할 키워드 문자열
        
        Returns:
            의미 분석 결과 딕셔너리
        """
        # 형태소 분석 및 품사 태깅
        doc = self.nlp(keyword)
        
        # 명사 추출
        nouns = [token.text for token in doc if token.pos_ == 'NOUN']
        
        # 의미 카테고리 분류
        categories = self._classify_semantic_categories(keyword, nouns)
        
        # 키워드 의도 분석 (정보 탐색, 구매 의도 등)
        intent = self._analyze_search_intent(keyword)
        
        # 키워드 감성 분석
        sentiment = self._analyze_sentiment(keyword)
        
        return {
            'keyword': keyword,
            'nouns': nouns,
            'categories': categories,
            'intent': intent,
            'sentiment': sentiment
        }
    
    def _classify_semantic_categories(self, keyword, nouns):
        """
        키워드의 의미 카테고리 분류
        
        Args:
            keyword: 키워드 문자열
            nouns: 추출된 명사 목록
            
        Returns:
            카테고리와 점수 목록
        """
        categories = []
        
        # 전체 키워드와 명사 결합
        tokens = [keyword] + nouns
        
        # 각 카테고리별 점수 계산
        for category, related_words in self.categories_map.items():
            score = 0
            matches = []
            
            for token in tokens:
                for word in related_words:
                    if word in token:
                        score += 1
                        matches.append(word)
            
            if score > 0:
                categories.append({
                    'category': category,
                    'score': score,
                    'matches': matches
                })
        
        # 점수 기준 내림차순 정렬
        categories.sort(key=lambda x: x['score'], reverse=True)
        
        # 상위 3개만 반환
        return categories[:3]
    
    def _analyze_search_intent(self, keyword):
        """
        검색 의도 분석
        
        Args:
            keyword: 키워드 문자열
            
        Returns:
            의도 분석 결과 딕셔너리
        """
        intents = []
        
        for intent, words in self.intent_keywords.items():
            score = 0
            matches = []
            
            for word in words:
                if word in keyword:
                    score += 1
                    matches.append(word)
            
            if score > 0:
                intents.append({
                    'intent': intent,
                    'score': score,
                    'matches': matches
                })
        
        intents.sort(key=lambda x: x['score'], reverse=True)
        
        # 상위 의도가 있으면 반환
        if intents:
            return intents[0]
            
        # 기본값은 정보 탐색
        return {
            'intent': '정보 탐색',
            'score': 0,
            'matches': []
        }
    
    def _analyze_sentiment(self, keyword):
        """
        감성 분석
        
        Args:
            keyword: 키워드 문자열
            
        Returns:
            감성 분석 결과
        """
        positive_words = ["좋은", "훌륭한", "추천", "최고", "베스트", "인기", "효과"]
        negative_words = ["나쁜", "최악", "문제", "안좋은", "부작용", "위험", "사기"]
        
        pos_score = 0
        neg_score = 0
        
        for word in positive_words:
            if word in keyword:
                pos_score += 1
                
        for word in negative_words:
            if word in keyword:
                neg_score += 1
        
        # 긍정/부정 점수 산출
        sentiment = "중립"
        if pos_score > neg_score:
            sentiment = "긍정"
        elif neg_score > pos_score:
            sentiment = "부정"
            
        return {
            'sentiment': sentiment,
            'positive_score': pos_score,
            'negative_score': neg_score
        }
    
    def find_semantic_related_keywords(self, keyword, top_n=20):
        """
        의미적으로 관련된 키워드 찾기
        
        Args:
            keyword: 기준 키워드
            top_n: 반환할 최대 키워드 수
            
        Returns:
            관련 키워드 리스트
        """
        # scikit-learn 모듈이 없으면 기본 키워드로 대체
        if not SKLEARN_AVAILABLE:
            return self._generate_default_related_keywords(keyword)
        
        # 키워드 토크나이징
        tokenized = self.nlp(keyword)
        
        try:
            # 벡터 표현
            keyword_vector = np.mean([token.vector for token in tokenized if token.has_vector], axis=0)
        except:
            # 벡터가 없거나 오류가 발생하면 기본 키워드 제시
            return self._generate_default_related_keywords(keyword)
        
        # 데이터베이스에서 키워드 목록 가져오기
        if self.db:
            try:
                all_keywords = self.db.getAllKeywords(limit=1000)  # DB 키워드 사용
            except:
                all_keywords = self._generate_default_keywords(keyword)  # 기본 키워드 사용
        else:
            all_keywords = self._generate_default_keywords(keyword)  # 기본 키워드 사용
            
        # 의미적 유사 키워드 후보 목록
        candidates = []
        
        for kw in all_keywords:
            try:
                # 유사도 계산
                kw_doc = self.nlp(kw)
                kw_vector = np.mean([token.vector for token in kw_doc if token.has_vector], axis=0)
                similarity = cosine_similarity([keyword_vector], [kw_vector])[0][0]
                
                if similarity > 0.6:  # 유사도 임계값
                    candidates.append({
                        'keyword': kw,
                        'similarity': float(similarity)
                    })
            except Exception as e:
                continue
                
        # 유사도 기준 상위 n개 반환
        candidates.sort(key=lambda x: x['similarity'], reverse=True)
        
        # 결과가 충분하지 않으면 기본 키워드로 보충
        if len(candidates) < top_n:
            candidates.extend(self._generate_default_related_keywords(keyword))
            
        return candidates[:top_n]
    
    def _generate_default_keywords(self, base_keyword):
        """기본 키워드 생성"""
        return [
            "의류", "가전", "식품", "화장품", "가구", "도서", "스포츠", "자동차",
            "여행", "주방", "컴퓨터", "가방", "신발", "액세서리", "건강식품"
        ]
    
    def _generate_default_related_keywords(self, keyword):
        """기본 연관 키워드 생성"""
        default_suffixes = ["추천", "가격", "할인", "후기", "구매", "비교", "종류", "브랜드", "사용법", "효과"]
        default_prefixes = ["인기", "최고", "저렴한", "고급", "추천", "신상", "할인", "프리미엄"]
        
        result = []
        for suffix in default_suffixes:
            result.append({
                'keyword': f"{keyword} {suffix}",
                'similarity': 0.8
            })
            
        for prefix in default_prefixes:
            result.append({
                'keyword': f"{prefix} {keyword}",
                'similarity': 0.7
            })
            
        return result
        
    def identify_market_segments(self, keyword, related_keywords):
        """
        키워드 기반 시장 세그먼트 식별
        
        Args:
            keyword: 기준 키워드
            related_keywords: 관련 키워드 목록
            
        Returns:
            시장 세그먼트 목록
        """
        # scikit-learn 모듈이 없으면 기본 세그먼트 생성
        if not SKLEARN_AVAILABLE:
            return self._generate_default_segments(keyword, related_keywords)
            
        # 모든 키워드 통합
        all_keywords = [keyword] + [kw['keyword'] for kw in related_keywords]
        
        # 각 키워드의 벡터 표현
        vectors = []
        valid_keywords = []
        
        for kw in all_keywords:
            try:
                doc = self.nlp(kw)
                vec = np.mean([token.vector for token in doc if token.has_vector], axis=0)
                vectors.append(vec)
                valid_keywords.append(kw)
            except Exception as e:
                continue
                
        if not vectors:
            return self._generate_default_segments(keyword, related_keywords)
            
        try:
            # 클러스터링 (K-means)
            n_clusters = min(5, len(vectors))  # 최대 5개 세그먼트
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            clusters = kmeans.fit_predict(vectors)
            
            # 세그먼트별 키워드 그룹화
            segments = {}
            for i, cluster_id in enumerate(clusters):
                if cluster_id not in segments:
                    segments[cluster_id] = []
                segments[cluster_id].append(valid_keywords[i])
                
            # 각 세그먼트에 대표 레이블 부여
            labeled_segments = []
            for cluster_id, keywords in segments.items():
                # 가장 높은 빈도의 명사 추출
                all_nouns = []
                for kw in keywords:
                    doc = self.nlp(kw)
                    nouns = [token.text for token in doc if token.pos_ == 'NOUN']
                    all_nouns.extend(nouns)
                    
                noun_counter = Counter(all_nouns)
                top_nouns = [noun for noun, _ in noun_counter.most_common(3)]
                
                labeled_segments.append({
                    'id': int(cluster_id),
                    'label': ' '.join(top_nouns),
                    'keywords': keywords
                })
                
            return labeled_segments
        except Exception as e:
            return self._generate_default_segments(keyword, related_keywords)
            
    def _generate_default_segments(self, keyword, related_keywords):
        """기본 세그먼트 생성"""
        # 키워드 목록을 카테고리별로 그룹화
        segments = [
            {
                'id': 0,
                'label': '가격 정보',
                'keywords': [
                    k['keyword'] for k in related_keywords 
                    if any(w in k['keyword'] for w in ['가격', '할인', '특가', '원', '비용'])
                ][:5]
            },
            {
                'id': 1,
                'label': '브랜드 정보',
                'keywords': [
                    k['keyword'] for k in related_keywords 
                    if any(w in k['keyword'] for w in ['브랜드', '회사', '메이커', '정품'])
                ][:5]
            },
            {
                'id': 2,
                'label': '제품 리뷰',
                'keywords': [
                    k['keyword'] for k in related_keywords 
                    if any(w in k['keyword'] for w in ['리뷰', '후기', '평가', '추천'])
                ][:5]
            }
        ]
        
        # 빈 세그먼트 필터링 및 추가 키워드 채우기
        result_segments = []
        for segment in segments:
            if not segment['keywords']:
                continue
                
            # 적어도 기준 키워드 추가
            if keyword not in segment['keywords']:
                segment['keywords'].append(keyword)
                
            result_segments.append(segment)
            
        return result_segments

# API 처리 함수들
def analyze_keyword(keyword):
    """키워드 의미 분석"""
    analyzer = SemanticKeywordAnalyzer()
    analysis = analyzer.analyze_keyword_meaning(keyword)
    return analysis

def find_related_keywords(keyword, limit=20):
    """의미적 연관 키워드 찾기"""
    analyzer = SemanticKeywordAnalyzer()
    related = analyzer.find_semantic_related_keywords(keyword, top_n=limit)
    return related

def identify_segments(keyword):
    """키워드 시장 세그먼트 식별"""
    analyzer = SemanticKeywordAnalyzer()
    related = analyzer.find_semantic_related_keywords(keyword, top_n=30)
    segments = analyzer.identify_market_segments(keyword, related)
    return segments

# CLI 테스트
if __name__ == "__main__":
    test_keyword = "다이어트 보조제"
    print(f"테스트 키워드: {test_keyword}")
    
    # 분석 실행
    analysis = analyze_keyword(test_keyword)
    print("\n의미 분석 결과:")
    print(json.dumps(analysis, ensure_ascii=False, indent=2))
    
    # 연관 키워드 찾기
    related = find_related_keywords(test_keyword, limit=10)
    print("\n연관 키워드:")
    print(json.dumps(related, ensure_ascii=False, indent=2))
    
    # 세그먼트 식별
    segments = identify_segments(test_keyword)
    print("\n시장 세그먼트:")
    print(json.dumps(segments, ensure_ascii=False, indent=2))