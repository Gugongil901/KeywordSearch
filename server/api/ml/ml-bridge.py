#!/usr/bin/env python3
"""
ML 브릿지 - TypeScript 서버에서 Python 머신러닝 모델에 액세스하기 위한 API
"""
import os
import sys
import json
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler()]
)

# 모델 디렉토리 설정
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

class MachineLearningBridge:
    def __init__(self):
        self.models = {}
        self.initialize_models()
        
    def initialize_models(self):
        """모델 초기화 또는 훈련"""
        try:
            # 모델 파일이 있는지 확인하고, 없으면 간단한 데모 모델 생성
            search_model_path = os.path.join(MODEL_DIR, 'search_volume_predictor.pkl')
            if not os.path.exists(search_model_path):
                logging.info("검색량 예측 모델 생성 중...")
                self._create_demo_search_model(search_model_path)
                
            competition_model_path = os.path.join(MODEL_DIR, 'competition_predictor.pkl')
            if not os.path.exists(competition_model_path):
                logging.info("경쟁도 예측 모델 생성 중...")
                self._create_demo_competition_model(competition_model_path)
                
            trend_model_path = os.path.join(MODEL_DIR, 'trend_classifier.pkl')
            if not os.path.exists(trend_model_path):
                logging.info("트렌드 분류 모델 생성 중...")
                self._create_demo_trend_model(trend_model_path)
                
            success_model_path = os.path.join(MODEL_DIR, 'success_probability.pkl')
            if not os.path.exists(success_model_path):
                logging.info("성공 확률 모델 생성 중...")
                self._create_demo_success_model(success_model_path)
                
            # 모델 로드
            self.models['search_volume_predictor'] = joblib.load(search_model_path)
            self.models['competition_predictor'] = joblib.load(competition_model_path)
            self.models['trend_classifier'] = joblib.load(trend_model_path)
            self.models['success_probability'] = joblib.load(success_model_path)
            
            logging.info("모든 모델 로드 완료")
        except Exception as e:
            logging.error(f"모델 초기화 오류: {str(e)}")
    
    def _create_demo_search_model(self, model_path):
        """검색량 예측을 위한 데모 모델 생성"""
        # 간단한 데모 데이터 생성
        X = np.random.rand(100, 20)  # 20개 특성을 가진 100개 샘플
        y = np.sin(X[:, 0]) + 0.1 * np.random.randn(100) + X[:, 1] * 2
        
        # 랜덤 포레스트 회귀 모델 훈련
        model = RandomForestRegressor(n_estimators=10, random_state=42)
        model.fit(X, y)
        
        # 모델 저장
        joblib.dump(model, model_path)
    
    def _create_demo_competition_model(self, model_path):
        """경쟁도 예측을 위한 데모 모델 생성"""
        X = np.random.rand(100, 10)
        y = X[:, 0] * 50 + X[:, 1] * 30 + np.random.randn(100) * 5
        
        model = RandomForestRegressor(n_estimators=10, random_state=42)
        model.fit(X, y)
        
        joblib.dump(model, model_path)
    
    def _create_demo_trend_model(self, model_path):
        """트렌드 분류를 위한 데모 모델 생성"""
        X = np.random.rand(100, 15)
        y = (X[:, 0] + X[:, 1] > 1).astype(int)
        
        model = RandomForestClassifier(n_estimators=10, random_state=42)
        model.fit(X, y)
        
        joblib.dump(model, model_path)
    
    def _create_demo_success_model(self, model_path):
        """성공 확률 예측을 위한 데모 모델 생성"""
        X = np.random.rand(100, 12)
        y = (X[:, 0] * 0.3 + X[:, 1] * 0.3 + X[:, 2] * 0.4 > 0.5).astype(int)
        
        model = RandomForestClassifier(n_estimators=10, random_state=42)
        model.fit(X, y)
        
        joblib.dump(model, model_path)
    
    def predict_search_volume(self, features_json):
        """검색량 예측"""
        try:
            features = json.loads(features_json)
            features_array = np.array(features).reshape(1, -1)
            
            prediction = self.models['search_volume_predictor'].predict(features_array)[0]
            
            # 예측 결과에 약간의 변동성 추가
            months_ahead = 6
            predictions = []
            base = prediction
            
            for i in range(months_ahead):
                # 작은 증가 또는 감소 추세 추가
                trend_factor = 1 + (i * 0.03)
                seasonal_factor = 1 + 0.1 * np.sin(i * np.pi / 6)  # 계절적 변동
                random_factor = 1 + np.random.randn() * 0.05  # 무작위성
                
                month_prediction = base * trend_factor * seasonal_factor * random_factor
                
                predictions.append({
                    'month': i + 1,
                    'forecast': float(month_prediction),
                    'lower': float(month_prediction * 0.9),
                    'upper': float(month_prediction * 1.1)
                })
            
            return json.dumps(predictions)
        except Exception as e:
            logging.error(f"검색량 예측 오류: {str(e)}")
            return json.dumps([])
    
    def predict_success_probability(self, features_json):
        """성공 확률 예측"""
        try:
            features = json.loads(features_json)
            features_array = np.array(features).reshape(1, -1)
            
            # 성공 확률 예측
            probability = float(self.models['success_probability'].predict_proba(features_array)[0][1])
            
            # 중요 요인 분석
            feature_names = [
                '검색량', '상품 수', '평균 가격', '경쟁도', '광고 비율', '브랜드 비율',
                '3개월 성장률', '상승 추세', '마진율', 'CPC 대비 마진', '키워드 길이', '단어 수'
            ]
            
            # 더 많은 feature_names가 필요한 경우 추가
            while len(feature_names) < len(features):
                feature_names.append(f'특성_{len(feature_names)+1}')
                
            # feature_names를 features 크기에 맞게 자름
            feature_names = feature_names[:len(features)]
            
            # 특성 중요도 계산
            importances = self.models['success_probability'].feature_importances_
            
            # 중요도 상위 5개 요인
            important_indices = np.argsort(importances)[-5:][::-1]
            
            important_factors = [
                {'factor': feature_names[i], 'importance': float(importances[i])}
                for i in important_indices if i < len(feature_names)
            ]
            
            result = {
                'probability': probability,
                'score': int(probability * 100),
                'important_factors': important_factors
            }
            
            return json.dumps(result)
        except Exception as e:
            logging.error(f"성공 확률 예측 오류: {str(e)}")
            return json.dumps({
                'probability': 0.5,
                'score': 50,
                'important_factors': []
            })

    def process_command(self, command, data):
        """명령어 처리"""
        if command == 'predict_search_volume':
            return self.predict_search_volume(data)
        elif command == 'predict_success_probability':
            return self.predict_success_probability(data)
        else:
            return json.dumps({'error': f'알 수 없는 명령어: {command}'})

def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': '명령어와 데이터가 필요합니다.'}))
        sys.exit(1)
        
    command = sys.argv[1]
    data = sys.argv[2]
    
    bridge = MachineLearningBridge()
    result = bridge.process_command(command, data)
    
    print(result)

if __name__ == '__main__':
    main()