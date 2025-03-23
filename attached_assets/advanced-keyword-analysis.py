"""
구공길(GUGONGIL) 키워드 분석 시스템 고도화 프로젝트
- 네이버 API와 웹 크롤링을 결합한 하이브리드 데이터 수집 시스템
- 건강기능식품 판매자를 위한 키워드 분석 및 최적화 솔루션
- 수집 과정 실시간 모니터링 및 데이터 시각화 기능 제공
- 키워드 경쟁도, 트렌드, 상품 순위 분석 자동화
"""

import os
import re
import json
import time
import random
import sqlite3
import logging
import asyncio
import requests
import numpy as np
import pandas as pd
import urllib.parse
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Union, Any, Optional

# 웹 크롤링 및 비동기 처리 라이브러리
import aiohttp
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# 데이터 시각화 및 웹 서버 라이브러리
import matplotlib
matplotlib.use('Agg')  # GUI 없이 사용
import matplotlib.pyplot as plt
import seaborn as sns
from flask import Flask, render_template, request, jsonify, send_file
from flask_socketio import SocketIO, emit
from flask_cors import CORS

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("keyword_analyzer.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("KeywordAnalyzer")

# 설정 정보
CONFIG = {
    "NAVER_CLIENT_ID": "ErTaCUGQWfhKvcEnftat",
    "NAVER_CLIENT_SECRET": "Xoq9VSewrv",
    "NAVER_CUSTOMER_ID": "3405855",
    "NAVER_ACCESS_LICENSE": "01000000005a79e0d0ffff30be92041e87dd2444c689e1209efbe2f9ea58fd3a3ae67ee01e",
    "NAVER_SECRET_KEY": "AQAAAABaeeDQ//8wvpIEHofdJETGcg3aHhG5YRGgFHPnSsNISw==",
    "DB_PATH": "gugongil_keywords.db",
    "MAX_PAGES": 20,            # 크롤링할 최대 페이지 수
    "CRAWL_DELAY": 1.5,         # 페이지 간 딜레이(초)
    "REQUEST_TIMEOUT": 10,      # API 및 크롤링 요청 타임아웃(초)
    "MAX_RETRIES": 3,           # 최대 재시도 횟수
    "PROXY_ROTATION": True,     # 프록시 IP 순환 사용 여부
    "DATA_EXPIRY_DAYS": 7,      # 데이터 유효 기간(일)
    "PORT": 5000,               # 웹 서버 포트
    "DEFAULT_CATEGORY": "건강기능식품", # 기본 카테고리
    "USER_AGENTS_FILE": "user_agents.json", # 유저 에이전트 목록 파일
    "PROXY_LIST_FILE": "proxy_list.json",  # 프록시 목록 파일
}

class DatabaseManager:
    """
    데이터베이스 관리 클래스
    - 키워드 데이터 저장, 조회, 분석 기능 제공
    - SQLite 기반으로 구현
    """
    
    def __init__(self, db_path: str = CONFIG["DB_PATH"]):
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self) -> None:
        """데이터베이스 초기화 및 필요한 테이블 생성"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 키워드 테이블
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS keywords (
            id INTEGER PRIMARY KEY,
            keyword TEXT NOT NULL,
            category TEXT,
            search_volume INTEGER,
            competition REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(keyword, category)
        )
        ''')
        
        # 관련 키워드 테이블
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS related_keywords (
            id INTEGER PRIMARY KEY,
            main_keyword_id INTEGER,
            related_keyword TEXT NOT NULL,
            relation_strength REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (main_keyword_id) REFERENCES keywords(id),
            UNIQUE(main_keyword_id, related_keyword)
        )
        ''')
        
        # 상품 정보 테이블
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            keyword_id INTEGER,
            product_name TEXT NOT NULL,
            price INTEGER,
            brand TEXT,
            mall_name TEXT,
            product_url TEXT UNIQUE,
            image_url TEXT,
            rank INTEGER,
            review_count INTEGER DEFAULT 0,
            rating REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (keyword_id) REFERENCES keywords(id)
        )
        ''')
        
        # 키워드 트렌드 데이터 테이블
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS keyword_trends (
            id INTEGER PRIMARY KEY,
            keyword_id INTEGER,
            date DATE,
            search_volume INTEGER,
            pc_ratio REAL,
            mobile_ratio REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (keyword_id) REFERENCES keywords(id),
            UNIQUE(keyword_id, date)
        )
        ''')
        
        # 크롤링 로그 테이블
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS crawl_logs (
            id INTEGER PRIMARY KEY,
            keyword TEXT,
            source TEXT,  -- 'api' 또는 'crawl'
            status TEXT,  -- 'success' 또는 'failure'
            details TEXT,
            products_count INTEGER,
            related_keywords_count INTEGER,
            execution_time REAL,  -- 실행 시간(초)
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # 광고 키워드 테이블
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ad_keywords (
            id INTEGER PRIMARY KEY,
            keyword TEXT UNIQUE,
            ad_rank INTEGER,
            ad_cpc REAL,  -- 클릭당 비용
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # 키워드 순위 추적 테이블
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS keyword_rankings (
            id INTEGER PRIMARY KEY,
            keyword_id INTEGER,
            product_id INTEGER,
            rank INTEGER,
            date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (keyword_id) REFERENCES keywords(id),
            FOREIGN KEY (product_id) REFERENCES products(id),
            UNIQUE(keyword_id, product_id, date)
        )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("데이터베이스 초기화 완료: %s", self.db_path)
    
    def save_keyword(self, keyword: str, category: str = None, search_volume: int = 0, 
                   competition: float = 0) -> int:
        """키워드 정보 저장 및 ID 반환"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 이미 존재하는 키워드인지 확인
            cursor.execute('''
            SELECT id FROM keywords WHERE keyword = ? AND (category = ? OR category IS NULL)
            ''', (keyword, category))
            result = cursor.fetchone()
            
            if result:
                # 기존 키워드 업데이트
                keyword_id = result[0]
                cursor.execute('''
                UPDATE keywords 
                SET search_volume = ?, competition = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                ''', (search_volume, competition, keyword_id))
            else:
                # 새 키워드 삽입
                cursor.execute('''
                INSERT INTO keywords (keyword, category, search_volume, competition)
                VALUES (?, ?, ?, ?)
                ''', (keyword, category, search_volume, competition))
                keyword_id = cursor.lastrowid
            
            conn.commit()
            return keyword_id
        
        except Exception as e:
            conn.rollback()
            logger.error("키워드 저장 오류: %s - %s", keyword, str(e))
            return None
        
        finally:
            conn.close()
    
    def save_related_keywords(self, main_keyword_id: int, related_keywords: List[Dict]) -> bool:
        """관련 키워드 저장"""
        if not related_keywords:
            return True
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            for keyword_data in related_keywords:
                related_keyword = keyword_data.get('keyword', '')
                relation_strength = keyword_data.get('strength', 1.0)
                
                if not related_keyword:
                    continue
                
                # UPSERT 구문 (INSERT OR REPLACE)
                cursor.execute('''
                INSERT OR REPLACE INTO related_keywords 
                (main_keyword_id, related_keyword, relation_strength, created_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ''', (main_keyword_id, related_keyword, relation_strength))
            
            conn.commit()
            return True
        
        except Exception as e:
            conn.rollback()
            logger.error("관련 키워드 저장 오류: %s - %s", main_keyword_id, str(e))
            return False
        
        finally:
            conn.close()
    
    def save_products(self, keyword_id: int, products_data: List[Dict]) -> bool:
        """상품 정보 저장"""
        if not products_data:
            return True
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            for rank, product in enumerate(products_data, 1):
                # 기본 필드
                product_name = product.get('title', '')
                price = product.get('price', 0)
                brand = product.get('brand', '')
                mall_name = product.get('mall', '')
                product_url = product.get('url', '')
                image_url = product.get('image_url', '')
                review_count = product.get('reviews', 0)
                rating = product.get('rating', 0.0)
                
                if not product_name or not product_url:
                    continue
                
                # UPSERT 구문
                cursor.execute('''
                INSERT INTO products 
                (keyword_id, product_name, price, brand, mall_name, product_url, image_url, rank, review_count, rating, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(product_url) DO UPDATE SET
                product_name = excluded.product_name,
                price = excluded.price,
                brand = excluded.brand,
                mall_name = excluded.mall_name,
                image_url = excluded.image_url,
                rank = excluded.rank,
                review_count = excluded.review_count,
                rating = excluded.rating,
                updated_at = CURRENT_TIMESTAMP
                ''', (keyword_id, product_name, price, brand, mall_name, product_url, image_url, rank, review_count, rating))
                
                # 순위 추적 테이블에도 저장
                product_id = cursor.lastrowid
                today = datetime.now().strftime('%Y-%m-%d')
                
                cursor.execute('''
                INSERT OR REPLACE INTO keyword_rankings
                (keyword_id, product_id, rank, date)
                VALUES (?, ?, ?, ?)
                ''', (keyword_id, product_id, rank, today))
            
            conn.commit()
            return True
        
        except Exception as e:
            conn.rollback()
            logger.error("상품 정보 저장 오류: %s - %s", keyword_id, str(e))
            return False
        
        finally:
            conn.close()
    
    def save_keyword_trend(self, keyword_id: int, trend_data: List[Dict]) -> bool:
        """키워드 트렌드 데이터 저장"""
        if not trend_data:
            return True
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            for data_point in trend_data:
                date = data_point.get('date', '')
                search_volume = data_point.get('volume', 0)
                pc_ratio = data_point.get('pc_ratio', 0.0)
                mobile_ratio = data_point.get('mobile_ratio', 0.0)
                
                if not date:
                    continue
                
                cursor.execute('''
                INSERT OR REPLACE INTO keyword_trends
                (keyword_id, date, search_volume, pc_ratio, mobile_ratio)
                VALUES (?, ?, ?, ?, ?)
                ''', (keyword_id, date, search_volume, pc_ratio, mobile_ratio))
            
            conn.commit()
            return True
        
        except Exception as e:
            conn.rollback()
            logger.error("트렌드 데이터 저장 오류: %s - %s", keyword_id, str(e))
            return False
        
        finally:
            conn.close()
    
    def log_crawl_activity(self, keyword: str, source: str, status: str, details: str = "",
                         products_count: int = 0, related_keywords_count: int = 0,
                         execution_time: float = 0.0) -> None:
        """크롤링 활동 로그 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
            INSERT INTO crawl_logs
            (keyword, source, status, details, products_count, related_keywords_count, execution_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (keyword, source, status, details, products_count, related_keywords_count, execution_time))
            
            conn.commit()
        
        except Exception as e:
            conn.rollback()
            logger.error("로그 저장 오류: %s - %s", keyword, str(e))
        
        finally:
            conn.close()
    
    def get_keyword_data(self, keyword: str, category: str = None) -> Dict:
        """키워드 관련 모든 데이터 조회"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        result = {
            'keyword': keyword,
            'category': category,
            'search_volume': 0,
            'competition': 0,
            'related_keywords': [],
            'products': [],
            'trends': [],
            'found': False
        }
        
        try:
            # 키워드 기본 정보 조회
            cursor.execute('''
            SELECT id, search_volume, competition, created_at, updated_at
            FROM keywords
            WHERE keyword = ? AND (category = ? OR category IS NULL)
            ''', (keyword, category))
            
            keyword_data = cursor.fetchone()
            if not keyword_data:
                return result
                
            keyword_id = keyword_data['id']
            result['search_volume'] = keyword_data['search_volume']
            result['competition'] = keyword_data['competition']
            result['created_at'] = keyword_data['created_at']
            result['updated_at'] = keyword_data['updated_at']
            result['found'] = True
            
            # 관련 키워드 조회
            cursor.execute('''
            SELECT related_keyword, relation_strength
            FROM related_keywords
            WHERE main_keyword_id = ?
            ORDER BY relation_strength DESC
            ''', (keyword_id,))
            
            related_keywords = cursor.fetchall()
            result['related_keywords'] = [
                {'keyword': row['related_keyword'], 'strength': row['relation_strength']}
                for row in related_keywords
            ]
            
            # 상품 정보 조회
            cursor.execute('''
            SELECT product_name, price, brand, mall_name, product_url, image_url, rank, review_count, rating
            FROM products
            WHERE keyword_id = ?
            ORDER BY rank
            ''', (keyword_id,))
            
            products = cursor.fetchall()
            result['products'] = [
                {
                    'title': row['product_name'],
                    'price': row['price'],
                    'brand': row['brand'],
                    'mall': row['mall_name'],
                    'url': row['product_url'],
                    'image_url': row['image_url'],
                    'rank': row['rank'],
                    'reviews': row['review_count'],
                    'rating': row['rating']
                }
                for row in products
            ]
            
            # 트렌드 데이터 조회
            cursor.execute('''
            SELECT date, search_volume, pc_ratio, mobile_ratio
            FROM keyword_trends
            WHERE keyword_id = ?
            ORDER BY date
            ''', (keyword_id,))
            
            trends = cursor.fetchall()
            result['trends'] = [
                {
                    'date': row['date'],
                    'volume': row['search_volume'],
                    'pc_ratio': row['pc_ratio'],
                    'mobile_ratio': row['mobile_ratio']
                }
                for row in trends
            ]
            
            return result
        
        except Exception as e:
            logger.error("키워드 데이터 조회 오류: %s - %s", keyword, str(e))
            return result
        
        finally:
            conn.close()
    
    def get_all_keywords(self, category: str = None, limit: int = 100, offset: int = 0) -> List[Dict]:
        """모든 키워드 목록 조회"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        keywords = []
        
        try:
            if category:
                cursor.execute('''
                SELECT id, keyword, category, search_volume, competition, created_at, updated_at
                FROM keywords
                WHERE category = ?
                ORDER BY updated_at DESC
                LIMIT ? OFFSET ?
                ''', (category, limit, offset))
            else:
                cursor.execute('''
                SELECT id, keyword, category, search_volume, competition, created_at, updated_at
                FROM keywords
                ORDER BY updated_at DESC
                LIMIT ? OFFSET ?
                ''', (limit, offset))
            
            rows = cursor.fetchall()
            for row in rows:
                keywords.append({
                    'id': row['id'],
                    'keyword': row['keyword'],
                    'category': row['category'],
                    'search_volume': row['search_volume'],
                    'competition': row['competition'],
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at']
                })
            
            return keywords
        
        except Exception as e:
            logger.error("키워드 목록 조회 오류: %s", str(e))
            return []
        
        finally:
            conn.close()
    
    def get_top_related_keywords(self, main_keyword: str, limit: int = 10) -> List[str]:
        """특정 키워드의 상위 관련 키워드 조회"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
            SELECT k.id FROM keywords k
            WHERE k.keyword = ?
            ''', (main_keyword,))
            
            result = cursor.fetchone()
            if not result:
                return []
                
            main_keyword_id = result[0]
            
            cursor.execute('''
            SELECT related_keyword
            FROM related_keywords
            WHERE main_keyword_id = ?
            ORDER BY relation_strength DESC
            LIMIT ?
            ''', (main_keyword_id, limit))
            
            rows = cursor.fetchall()
            return [row[0] for row in rows]
        
        except Exception as e:
            logger.error("관련 키워드 조회 오류: %s - %s", main_keyword, str(e))
            return []
        
        finally:
            conn.close()
    
    def get_keyword_stats(self, days: int = 7) -> Dict:
        """키워드 데이터 통계 정보 조회"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        stats = {
            'total_keywords': 0,
            'total_products': 0,
            'total_related_keywords': 0,
            'crawl_success_rate': 0,
            'top_categories': [],
            'recent_activity': []
        }
        
        try:
            # 총 키워드 수
            cursor.execute('SELECT COUNT(*) FROM keywords')
            stats['total_keywords'] = cursor.fetchone()[0]
            
            # 총 상품 수
            cursor.execute('SELECT COUNT(*) FROM products')
            stats['total_products'] = cursor.fetchone()[0]
            
            # 총 관련 키워드 수
            cursor.execute('SELECT COUNT(*) FROM related_keywords')
            stats['total_related_keywords'] = cursor.fetchone()[0]
            
            # 크롤링 성공률
            cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
            FROM crawl_logs
            WHERE created_at >= datetime('now', '-7 day')
            ''')
            
            result = cursor.fetchone()
            total_crawls = result[0] if result[0] else 0
            success_crawls = result[1] if result[1] else 0
            
            if total_crawls > 0:
                stats['crawl_success_rate'] = round((success_crawls / total_crawls) * 100, 2)
            
            # 인기 카테고리
            cursor.execute('''
            SELECT category, COUNT(*) as count
            FROM keywords
            WHERE category IS NOT NULL
            GROUP BY category
            ORDER BY count DESC
            LIMIT 5
            ''')
            
            categories = cursor.fetchall()
            stats['top_categories'] = [
                {'category': row[0], 'count': row[1]}
                for row in categories
            ]
            
            # 최근 활동
            cursor.execute('''
            SELECT keyword, source, status, created_at
            FROM crawl_logs
            ORDER BY created_at DESC
            LIMIT 10
            ''')
            
            activities = cursor.fetchall()
            stats['recent_activity'] = [
                {
                    'keyword': row[0],
                    'source': row[1],
                    'status': row[2],
                    'timestamp': row[3]
                }
                for row in activities
            ]
            
            return stats
        
        except Exception as e:
            logger.error("통계 정보 조회 오류: %s", str(e))
            return stats
        
        finally:
            conn.close()
    
    def is_ad_keyword(self, keyword: str) -> bool:
        """광고 키워드인지 확인"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
            SELECT is_active FROM ad_keywords
            WHERE keyword = ?
            ''', (keyword,))
            
            result = cursor.fetchone()
            return bool(result and result[0])
        
        except Exception as e:
            logger.error("광고 키워드 확인 오류: %s - %s", keyword, str(e))
            return False
        
        finally:
            conn.close()
    
    def save_ad_keyword(self, keyword: str, ad_rank: int = 0, ad_cpc: float = 0.0) -> bool:
        """광고 키워드 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
            INSERT OR REPLACE INTO ad_keywords
            (keyword, ad_rank, ad_cpc, is_active, updated_at)
            VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
            ''', (keyword, ad_rank, ad_cpc))
            
            conn.commit()
            return True
        
        except Exception as e:
            conn.rollback()
            logger.error("광고 키워드 저장 오류: %s - %s", keyword, str(e))
            return False
        
        finally:
            conn.close()
    
    def get_ranking_history(self, keyword: str, product_url: str = None, days: int = 30) -> List[Dict]:
        """특정 키워드의 상품 순위 변동 이력 조회"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        history = []
        
        try:
            # 키워드 ID 조회
            cursor.execute('SELECT id FROM keywords WHERE keyword = ?', (keyword,))
            keyword_result = cursor.fetchone()
            
            if not keyword_result:
                return history
                
            keyword_id = keyword_result['id']
            
            if product_url:
                # 특정 상품의 순위 이력
                cursor.execute('''
                SELECT kr.date, kr.rank, p.product_name, p.brand
                FROM keyword_rankings kr
                JOIN products p ON kr.product_id = p.id
                WHERE kr.keyword_id = ? AND p.product_url = ?
                AND kr.date >= date('now', '-' || ? || ' day')
                ORDER BY kr.date
                ''', (keyword_id, product_url, days))
            else:
                # 전체 상품 순위 이력 (최근 30일)
                cursor.execute('''
                SELECT kr.date, kr.rank, p.product_name, p.brand, p.product_url
                FROM keyword_rankings kr
                JOIN products p ON kr.product_id = p.id
                WHERE kr.keyword_id = ?
                AND kr.date >= date('now', '-' || ? || ' day')
                ORDER BY kr.date, kr.rank
                ''', (keyword_id, days))
            
            rows = cursor.fetchall()
            
            for row in rows:
                history.append({
                    'date': row['date'],
                    'rank': row['rank'],
                    'product_name': row['product_name'],
                    'brand': row['brand'],
                    'product_url': row.get('product_url', '')
                })
            
            return history
        
        except Exception as e:
            logger.error("순위 이력 조회 오류: %s - %s", keyword, str(e))
            return []
        
        finally:
            conn.close()
    
    def clean_old_data(self, days: int = CONFIG["DATA_EXPIRY_DAYS"]) -> bool:
        """오래된 데이터 정리"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 오래된 크롤링 로그 삭제
            cursor.execute('''
            DELETE FROM crawl_logs
            WHERE created_at < datetime('now', '-' || ? || ' day')
            ''', (days,))
            
            # 오래된 키워드 순위 데이터 삭제
            cursor.execute('''
            DELETE FROM keyword_rankings
            WHERE date < date('now', '-' || ? || ' day')
            ''', (days,))
            
            conn.commit()
            return True
        
        except Exception as e:
            conn.rollback()
            logger.error("데이터 정리 오류: %s", str(e))
            return False
        
        finally:
            conn.close()

class NaverAPI:
    """
    네이버 API 래퍼 클래스
    - 데이터랩, 쇼핑, 검색, 광고 API 호출 기능 제공
    - 오류 발생 시 자동 재시도 및 로깅
    """
    
    def __init__(self):
        self.client_id = CONFIG["NAVER_CLIENT_ID"]
        self.client_secret = CONFIG["NAVER_CLIENT_SECRET"]
        self.customer_id = CONFIG["NAVER_CUSTOMER_ID"]
        self.access_license = CONFIG["NAVER_ACCESS_LICENSE"]
        self.secret_key = CONFIG["NAVER_SECRET_KEY"]
        self.timeout = CONFIG["REQUEST_TIMEOUT"]
        self.max_retries = CONFIG["MAX_RETRIES"]
        
        # API 호출용 공통 헤더
        self.common_headers = {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret,
            "Content-Type": "application/json"
        }
        
        # 검색광고 API 헤더
        self.ad_headers = {
            "Content-Type": "application/json",
            "X-API-KEY": self.access_license,
            "X-Customer": self.customer_id
        }
        
        # 유효한 API 응답 캐시
        self.cache = {}
        
        logger.info("네이버 API 클라이언트 초기화 완료")
    
    async def get_datalab_trend(self, keyword: str, start_date: str = None, end_date: str = None) -> Dict:
        """네이버 데이터랩 검색어 트렌드 API 호출"""
        if not start_date or not end_date:
            # 기본값: 최근 30일
            end_date = datetime.now().strftime("%Y-%m-%d")
            start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        # 캐시 키 생성
        cache_key = f"datalab_trend_{keyword}_{start_date}_{end_date}"
        
        # 캐시된 결과가 있으면 반환
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        url = "https://openapi.naver.com/v1/datalab/search"
        
        # 요청 데이터 준비
        request_body = {
            "startDate": start_date,
            "endDate": end_date,
            "timeUnit": "date",
            "keywordGroups": [
                {
                    "groupName": keyword,
                    "keywords": [keyword]
                }
            ]
        }
        
        for attempt in range(self.max_retries):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        url,
                        headers=self.common_headers,
                        json=request_body,
                        timeout=self.timeout
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            # 성공 시 캐시에 저장
                            self.cache[cache_key] = result
                            return result
                        else:
                            error_text = await response.text()
                            logger.error("데이터랩 API 오류: %s - %s", response.status, error_text)
                
                # 재시도 전 대기
                await asyncio.sleep(1 * (attempt + 1))
            
            except asyncio.TimeoutError:
                logger.error("데이터랩 API 타임아웃 (시도 %d/%d)", attempt+1, self.max_retries)
            
            except Exception as e:
                logger.error("데이터랩 API 호출 예외: %s (시도 %d/%d)", str(e), attempt+1, self.max_retries)
        
        # 모든 시도 실패
        return {"error": "데이터랩 API 호출 실패", "keyword": keyword}
    
    async def get_search_ad_keywords(self, keyword: str) -> Dict:
        """네이버 검색광고 키워드 도구 API 호출"""
        # 캐시 키 생성
        cache_key = f"search_ad_{keyword}"
        
        # 캐시된 결과가 있으면 반환
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        url = "https://api.naver.com/keywordstool"
        params = {
            "hintKeywords": keyword,
            "showDetail": 1
        }
        
        for attempt in range(self.max_retries):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        url,
                        params=params,
                        headers=self.ad_headers,
                        timeout=self.timeout
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            # 성공 시 캐시에 저장
                            self.cache[cache_key] = result
                            return result
                        else:
                            error_text = await response.text()
                            logger.error("검색광고 API 오류: %s - %s", response.status, error_text)
                
                # 재시도 전 대기
                await asyncio.sleep(1 * (attempt + 1))
            
            except asyncio.TimeoutError:
                logger.error("검색광고 API 타임아웃 (시도 %d/%d)", attempt+1, self.max_retries)
            
            except Exception as e:
                logger.error("검색광고 API 호출 예외: %s (시도 %d/%d)", str(e), attempt+1, self.max_retries)
        
        # 모든 시도 실패
        return {"error": "검색광고 API 호출 실패", "keyword": keyword}
    
    async def get_shopping_search(self, keyword: str, display: int = 20, start: int = 1, sort: str = "sim") -> Dict:
        """네이버 쇼핑 검색 API 호출"""
        # 캐시 키 생성
        cache_key = f"shopping_{keyword}_{display}_{start}_{sort}"
        
        # 캐시된 결과가 있으면 반환
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        url = "https://openapi.naver.com/v1/search/shop.json"
        params = {
            "query": keyword,
            "display": display,
            "start": start,
            "sort": sort  # 정렬방법: sim (유사도), date (날짜), asc (가격오름차순), dsc (가격내림차순)
        }
        
        for attempt in range(self.max_retries):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        url,
                        params=params,
                        headers=self.common_headers,
                        timeout=self.timeout
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            # 성공 시 캐시에 저장
                            self.cache[cache_key] = result
                            return result
                        else:
                            error_text = await response.text()
                            logger.error("쇼핑 검색 API 오류: %s - %s", response.status, error_text)
                
                # 재시도 전 대기
                await asyncio.sleep(1 * (attempt + 1))
            
            except asyncio.TimeoutError:
                logger.error("쇼핑 검색 API 타임아웃 (시도 %d/%d)", attempt+1, self.max_retries)
            
            except Exception as e:
                logger.error("쇼핑 검색 API 호출 예외: %s (시도 %d/%d)", str(e), attempt+1, self.max_retries)
        
        # 모든 시도 실패
        return {"error": "쇼핑 검색 API 호출 실패", "keyword": keyword}
    
    async def get_related_keywords(self, keyword: str) -> Dict:
        """네이버 관련 검색어 API 호출 (비공식)"""
        # 캐시 키 생성
        cache_key = f"related_{keyword}"
        
        # 캐시된 결과가 있으면 반환
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        url = "https://ac.search.naver.com/nx/ac"
        params = {
            "q": keyword,
            "con": 1,
            "frm": "nv",
            "_callback": "autocomplete"
        }
        
        for attempt in range(self.max_retries):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        url,
                        params=params,
                        timeout=self.timeout
                    ) as response:
                        if response.status == 200:
                            text = await response.text()
                            # JSONP 형식 파싱
                            json_text = text.replace("autocomplete(", "")[:-1]
                            result = json.loads(json_text)
                            # 성공 시 캐시에 저장
                            self.cache[cache_key] = result
                            return result
                        else:
                            error_text = await response.text()
                            logger.error("관련 검색어 API 오류: %s - %s", response.status, error_text)
                
                # 재시도 전 대기
                await asyncio.sleep(1 * (attempt + 1))
            
            except asyncio.TimeoutError:
                logger.error("관련 검색어 API 타임아웃 (시도 %d/%d)", attempt+1, self.max_retries)
            
            except Exception as e:
                logger.error("관련 검색어 API 호출 예외: %s (시도 %d/%d)", str(e), attempt+1, self.max_retries)
        
        # 모든 시도 실패
        return {"error": "관련 검색어 API 호출 실패", "keyword": keyword}
    
    def clear_cache(self):
        """API 응답 캐시 초기화"""
        self.cache = {}
        logger.info("API 캐시 초기화 완료")

class NaverCrawler:
    """
    네이버 웹 크롤링 클래스
    - 데이터랩, 쇼핑, 검색결과, 광고 정보 크롤링 기능 제공
    - 다양한 크롤링 방지 우회 기술 적용
    - 비동기 및 병렬 처리를 통한 성능 최적화
    """
    
    def __init__(self, headless: bool = True, use_proxy: bool = CONFIG["PROXY_ROTATION"]):
        self.headless = headless
        self.use_proxy = use_proxy
        self.driver = None
        self.user_agents = self._load_user_agents()
        self.proxies = self._load_proxies() if use_proxy else []
        self.current_proxy_idx = 0
        self.delay = CONFIG["CRAWL_DELAY"]
        self.max_pages = CONFIG["MAX_PAGES"]
        self.timeout = CONFIG["REQUEST_TIMEOUT"]
        
        # 웹드라이버 초기화는 필요할 때 lazy loading
        logger.info("네이버 크롤러 초기화 완료 (헤드리스: %s, 프록시 사용: %s)", headless, use_proxy)
    
    def _load_user_agents(self) -> List[str]:
        """유저 에이전트 목록 로드"""
        default_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
        ]
        
        try:
            if os.path.exists(CONFIG["USER_AGENTS_FILE"]):
                with open(CONFIG["USER_AGENTS_FILE"], "r") as f:
                    agents = json.load(f)
                    if isinstance(agents, list) and len(agents) > 0:
                        return agents
        except Exception as e:
            logger.error("유저 에이전트 목록 로드 실패: %s", str(e))
        
        return default_agents
    
    def _load_proxies(self) -> List[str]:
        """프록시 목록 로드"""
        default_proxies = []
        
        try:
            if os.path.exists(CONFIG["PROXY_LIST_FILE"]):
                with open(CONFIG["PROXY_LIST_FILE"], "r") as f:
                    proxies = json.load(f)
                    if isinstance(proxies, list) and len(proxies) > 0:
                        return proxies
        except Exception as e:
            logger.error("프록시 목록 로드 실패: %s", str(e))
        
        return default_proxies
    
    def _get_random_user_agent(self) -> str:
        """랜덤 유저 에이전트 선택"""
        return random.choice(self.user_agents)
    
    def _get_next_proxy(self) -> Optional[str]:
        """다음 프록시 선택"""
        if not self.proxies:
            return None
            
        proxy = self.proxies[self.current_proxy_idx]
        self.current_proxy_idx = (self.current_proxy_idx + 1) % len(self.proxies)
        return proxy
    
    def initialize_driver(self) -> None:
        """셀레니움 웹드라이버 초기화"""
        if self.driver:
            self.close_driver()
        
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument('--headless')
            
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--lang=ko_KR')
        
        # 랜덤 유저 에이전트 설정
        user_agent = self._get_random_user_agent()
        chrome_options.add_argument(f'--user-agent={user_agent}')
        
        # 자동화 감지 방지
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # 프록시 설정 (있는 경우)
        if self.use_proxy:
            proxy = self._get_next_proxy()
            if proxy:
                chrome_options.add_argument(f'--proxy-server={proxy}')
        
        # 웹드라이버 서비스 설정
        service = Service(ChromeDriverManager().install())
        
        # 드라이버 생성
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # 자동화 감지 방지 스크립트 실행
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        # 타임아웃 설정
        self.driver.set_page_load_timeout(self.timeout)
        self.driver.implicitly_wait(5)
        
        logger.info("웹드라이버 초기화 완료 (User-Agent: %s)", user_agent)
    
    def close_driver(self) -> None:
        """웹드라이버 종료"""
        if self.driver:
            try:
                self.driver.quit()
            except Exception as e:
                logger.error("웹드라이버 종료 오류: %s", str(e))
            finally:
                self.driver = None
    
    def random_sleep(self, base: float = None, variation: float = 0.5) -> None:
        """봇 감지 방지를 위한 랜덤 대기 시간"""
        if base is None:
            base = self.delay
            
        sleep_time = base + random.uniform(0, variation)
        time.sleep(sleep_time)
    
    def scroll_page(self, scroll_count: int = 3, scroll_pause: float = 1.0) -> None:
        """더 많은 데이터 로드를 위한 페이지 스크롤"""
        if not self.driver:
            return
            
        try:
            for i in range(scroll_count):
                # 스크롤 다운
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                
                # 로딩 대기
                time.sleep(scroll_pause)
                
                # 가끔 위로 약간 스크롤 (자연스러운 사용자 행동 시뮬레이션)
                if i < scroll_count - 1 and random.random() < 0.3:
                    self.driver.execute_script("window.scrollTo(0, window.scrollY - 200);")
                    time.sleep(0.5)
        
        except Exception as e:
            logger.error("페이지 스크롤 오류: %s", str(e))
    
    def extract_number(self, text: str) -> int:
        """텍스트에서 숫자만 추출"""
        if not text:
            return 0
            
        try:
            number_text = re.sub(r'[^\d]', '', text)
            return int(number_text) if number_text else 0
        except:
            return 0
    
    def extract_price(self, price_text: str) -> int:
        """가격 텍스트에서 숫자만 추출"""
        return self.extract_number(price_text)
    
    async def crawl_naver_shopping(self, keyword: str, max_pages: int = None) -> Dict:
        """네이버 쇼핑에서 상품 및 관련 키워드 정보 크롤링"""
        if max_pages is None:
            max_pages = self.max_pages
            
        # 결과 구조
        results = {
            "keyword": keyword,
            "total_products": 0,
            "products": [],
            "related_keywords": [],
            "ad_keywords": [],
            "timestamp": datetime.now().isoformat()
        }
        
        # 웹드라이버 초기화
        if not self.driver:
            self.initialize_driver()
        
        try:
            # 네이버 쇼핑 검색 URL
            encoded_keyword = urllib.parse.quote(keyword)
            url = f"https://search.shopping.naver.com/search/all?query={encoded_keyword}"
            
            # 페이지 로드
            self.driver.get(url)
            self.random_sleep()
            
            # 페이지 로딩 대기
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.product_list_item__2tuDF"))
                )
            except:
                logger.warning("상품 목록 로딩 대기 시간 초과: %s", keyword)
            
            # 페이지 스크롤 (더 많은 상품 로드)
            self.scroll_page(scroll_count=3)
            
            # 총 상품 수 가져오기
            try:
                total_products_elem = self.driver.find_element(By.CLASS_NAME, "subFilter_num__2x0jq")
                if total_products_elem:
                    total_text = total_products_elem.text
                    results["total_products"] = self.extract_number(total_text)
            except Exception as e:
                logger.warning("총 상품 수 추출 실패: %s - %s", keyword, str(e))
            
            # 광고 키워드 추출
            try:
                ad_elements = self.driver.find_elements(By.CSS_SELECTOR, ".ad_ad_stk__12U34")
                for ad_elem in ad_elements:
                    parent = ad_elem.find_element(By.XPATH, "./ancestor::div[contains(@class, 'product_item')]")
                    title_elem = parent.find_element(By.CSS_SELECTOR, "a.product_link__TrAac")
                    if title_elem:
                        results["ad_keywords"].append(title_elem.text.strip())
            except:
                pass
            
            # 관련 키워드 추출
            try:
                related_keywords_div = self.driver.find_element(By.CSS_SELECTOR, "div.relatedTags_relation_srh__YG9s7")
                keyword_elements = related_keywords_div.find_elements(By.TAG_NAME, "a")
                
                for element in keyword_elements:
                    keyword_text = element.text.strip()
                    if keyword_text:
                        results["related_keywords"].append({
                            "keyword": keyword_text,
                            "strength": 1.0  # 기본 강도 값
                        })
            except Exception as e:
                logger.warning("관련 키워드 추출 실패: %s - %s", keyword, str(e))
            
            # 페이지별 상품 정보 수집
            collected_products = []
            visited_pages = 0
            
            for page in range(1, max_pages + 1):
                if page > 1:
                    # 다음 페이지로 이동
                    try:
                        next_page_url = f"{url}&pagingIndex={page}"
                        self.driver.get(next_page_url)
                        self.random_sleep()
                    except Exception as e:
                        logger.error("다음 페이지 이동 실패: %s - 페이지 %d - %s", keyword, page, str(e))
                        break
                
                # 페이지 스크롤 (더 많은 상품 로드)
                self.scroll_page(scroll_count=2)
                
                # 상품 정보 추출
                try:
                    product_elements = self.driver.find_elements(By.CSS_SELECTOR, "div.product_item__MDtDF")
                    
                    if not product_elements:
                        logger.warning("상품 요소를 찾을 수 없음: %s - 페이지 %d", keyword, page)
                        break
                    
                    for element in product_elements:
                        try:
                            # 상품명
                            title_element = element.find_element(By.CSS_SELECTOR, "a.product_link__TrAac")
                            title = title_element.text.strip() if title_element else ""
                            
                            # 상품 URL
                            product_url = title_element.get_attribute("href") if title_element else ""
                            
                            # 가격
                            price_element = element.find_element(By.CSS_SELECTOR, "span.price_num__S2p_v")
                            price_text = price_element.text.strip() if price_element else ""
                            price = self.extract_price(price_text)
                            
                            # 쇼핑몰
                            mall_element = element.find_element(By.CSS_SELECTOR, "a.product_mall__hCUUi")
                            mall_name = mall_element.text.strip() if mall_element else ""
                            
                            # 브랜드 (별도 요소가 없으면 추출 시도)
                            brand = ""
                            try:
                                brand_element = element.find_element(By.CSS_SELECTOR, "span.product_brand__xugAn")
                                brand = brand_element.text.strip() if brand_element else ""
                            except:
                                # 브랜드 요소가 없는 경우 상품명에서 추출 시도
                                if title:
                                    brand_match = re.match(r'^[\[(]?([a-zA-Z가-힣]+)[\])]?\s', title)
                                    if brand_match:
                                        brand = brand_match.group(1)
                            
                            # 이미지 URL
                            image_element = element.find_element(By.CSS_SELECTOR, "img.product_image__Oryt3")
                            image_url = image_element.get_attribute("src") if image_element else ""
                            
                            # 리뷰 수
                            review_count = 0
                            try:
                                review_element = element.find_element(By.CSS_SELECTOR, "em.product_num__iEwQH")
                                review_count = self.extract_number(review_element.text)
                            except:
                                pass
                            
                            # 평점
                            rating = 0.0
                            try:
                                rating_element = element.find_element(By.CSS_SELECTOR, "span.product_rate__c6xF5")
                                rating_text = rating_element.text.strip()
                                rating = float(rating_text) if rating_text else 0.0
                            except:
                                pass
                            
                            # 광고 여부
                            is_ad = False
                            try:
                                ad_element = element.find_element(By.CSS_SELECTOR, ".ad_ad_stk__12U34")
                                is_ad = True
                            except:
                                pass
                            
                            # 유효한 정보만 추가
                            if title and price > 0:
                                product_info = {
                                    "title": title,
                                    "price": price,
                                    "brand": brand,
                                    "mall": mall_name,
                                    "url": product_url,
                                    "image_url": image_url,
                                    "reviews": review_count,
                                    "rating": rating,
                                    "is_ad": is_ad,
                                    "rank": len(collected_products) + 1
                                }
                                
                                collected_products.append(product_info)
                        
                        except Exception as e:
                            logger.error("상품 정보 추출 오류: %s - %s", keyword, str(e))
                    
                    visited_pages += 1
                    
                except Exception as e:
                    logger.error("페이지 %d 상품 추출 실패: %s - %s", page, keyword, str(e))
                    break
            
            # 결과 업데이트
            results["products"] = collected_products
            results["pages_crawled"] = visited_pages
            
            return results
            
        except Exception as e:
            logger.error("네이버 쇼핑 크롤링 실패: %s - %s", keyword, str(e))
            return results
        
        finally:
            # 드라이버는 유지 (재사용)
            pass
    
    async def crawl_naver_datalab(self, keyword: str) -> Dict:
        """네이버 데이터랩에서 검색어 트렌드 데이터 크롤링"""
        # 결과 구조
        results = {
            "keyword": keyword,
            "period": "최근 30일",
            "data": [],
            "timestamp": datetime.now().isoformat()
        }
        
        # 웹드라이버 초기화
        if not self.driver:
            self.initialize_driver()
        
        try:
            # 네이버 데이터랩 검색어 트렌드 페이지
            url = "https://datalab.naver.com/keyword/trendSearch.naver"
            self.driver.get(url)
            self.random_sleep()
            
            # 키워드 입력
            try:
                keyword_input = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input.input_txt._searchInput"))
                )
                keyword_input.clear()
                keyword_input.send_keys(keyword)
                
                # 검색 버튼 클릭
                search_button = self.driver.find_element(By.CSS_SELECTOR, "button.btn_submit._searchBtn")
                search_button.click()
                self.random_sleep(2)
                
                # 결과 로딩 대기
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.section_insite"))
                )
                
            except Exception as e:
                logger.error("데이터랩 검색 실패: %s - %s", keyword, str(e))
                return results
            
            # 트렌드 데이터 추출
            try:
                # 자바스크립트 변수에서 데이터 추출
                trend_data = self.driver.execute_script("""
                try {
                    if (typeof searchTrendChart !== 'undefined' && searchTrendChart.data) {
                        return {
                            data: searchTrendChart.data,
                            period: searchTrendChart.period
                        };
                    }
                    return null;
                } catch (e) {
                    return null;
                }
                """)
                
                if trend_data and "data" in trend_data:
                    # 날짜 정보 생성
                    date_range = []
                    end_date = datetime.now()
                    for i in range(30):
                        date = (end_date - timedelta(days=29-i)).strftime("%Y-%m-%d")
                        date_range.append(date)
                    
                    # 트렌드 데이터 포맷팅
                    for i, value in enumerate(trend_data["data"]):
                        if i < len(date_range):
                            results["data"].append({
                                "date": date_range[i],
                                "volume": value,
                                "pc_ratio": None,  # API에서는 제공되지만 웹에서는 추출 어려움
                                "mobile_ratio": None
                            })
                
            except Exception as e:
                logger.error("트렌드 데이터 추출 실패: %s - %s", keyword, str(e))
            
            return results
            
        except Exception as e:
            logger.error("네이버 데이터랩 크롤링 실패: %s - %s", keyword, str(e))
            return results
        
        finally:
            # 드라이버는 유지 (재사용)
            pass
    
    async def crawl_naver_smartstore(self, keyword: str, max_pages: int = None) -> Dict:
        """네이버 스마트스토어 관련 정보 크롤링"""
        if max_pages is None:
            max_pages = self.max_pages
            
        # 결과 구조
        results = {
            "keyword": keyword,
            "stores": [],
            "related_keywords": [],
            "timestamp": datetime.now().isoformat()
        }
        
        # 웹드라이버 초기화
        if not self.driver:
            self.initialize_driver()
        
        try:
            # 네이버 쇼핑 검색 URL (스마트스토어 필터 적용)
            encoded_keyword = urllib.parse.quote(keyword)
            url = f"https://search.shopping.naver.com/search/all?frm=NVSHATC&origQuery={encoded_keyword}&pagingIndex=1&pagingSize=40&productSet=total&query={encoded_keyword}&sort=rel&timestamp=&viewType=list"
            
            # 페이지 로드
            self.driver.get(url)
            self.random_sleep()
            
            # 스마트스토어 필터 적용
            try:
                # 필터 버튼 찾기
                mall_filter_button = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "button.filter_btn_opener__edZmM"))
                )
                mall_filter_button.click()
                self.random_sleep(1)
                
                # 스마트스토어 체크박스 찾기
                smartstore_checkbox = self.driver.find_element(By.XPATH, "//span[contains(text(), '스마트스토어')]/preceding-sibling::input")
                if not smartstore_checkbox.is_selected():
                    # 스크롤하여 요소 보이게 하기
                    self.driver.execute_script("arguments[0].scrollIntoView();", smartstore_checkbox)
                    self.random_sleep(0.5)
                    
                    # 자바스크립트로 클릭 (일반 클릭보다 더 안정적)
                    self.driver.execute_script("arguments[0].click();", smartstore_checkbox)
                    self.random_sleep(1)
                
                # 적용 버튼 클릭
                apply_button = self.driver.find_element(By.CSS_SELECTOR, "button.filter_btn_apply__kZQll")
                apply_button.click()
                self.random_sleep(2)
                
            except Exception as e:
                logger.warning("스마트스토어 필터 적용 실패: %s - %s", keyword, str(e))
            
            # 페이지 스크롤 (더 많은 상품 로드)
            self.scroll_page(scroll_count=3)
            
            # 관련 키워드 추출
            try:
                related_keywords_div = self.driver.find_element(By.CSS_SELECTOR, "div.relatedTags_relation_srh__YG9s7")
                keyword_elements = related_keywords_div.find_elements(By.TAG_NAME, "a")
                
                for element in keyword_elements:
                    keyword_text = element.text.strip()
                    if keyword_text:
                        results["related_keywords"].append(keyword_text)
            except Exception as e:
                logger.warning("관련 키워드 추출 실패: %s - %s", keyword, str(e))
            
            # 스마트스토어 정보 수집
            for page in range(1, max_pages + 1):
                if page > 1:
                    # 다음 페이지로 이동
                    next_page_url = f"https://search.shopping.naver.com/search/all?frm=NVSHATC&origQuery={encoded_keyword}&pagingIndex={page}&pagingSize=40&productSet=total&query={encoded_keyword}&sort=rel&timestamp=&viewType=list"
                    self.driver.get(next_page_url)
                    self.random_sleep()
                    
                    # 페이지 스크롤
                    self.scroll_page(scroll_count=2)
                
                # 상품 요소 추출
                try:
                    product_elements = self.driver.find_elements(By.CSS_SELECTOR, "div.product_item__MDtDF")
                    
                    if not product_elements:
                        break
                    
                    for element in product_elements:
                        try:
                            # 스마트스토어인지 확인
                            mall_element = element.find_element(By.CSS_SELECTOR, "a.product_mall__hCUUi")
                            mall_name = mall_element.text.strip() if mall_element else ""
                            
                            # 스마트스토어가 아니면 건너뛰기
                            if "스마트스토어" not in mall_name:
                                continue
                            
                            # 스토어 링크
                            store_url = mall_element.get_attribute("href") if mall_element else ""
                            
                            # 상품명
                            title_element = element.find_element(By.CSS_SELECTOR, "a.product_link__TrAac")
                            title = title_element.text.strip() if title_element else ""
                            
                            # 가격
                            price_element = element.find_element(By.CSS_SELECTOR, "span.price_num__S2p_v")
                            price_text = price_element.text.strip() if price_element else ""
                            price = self.extract_price(price_text)
                            
                            # 리뷰 수
                            review_count = 0
                            try:
                                review_element = element.find_element(By.CSS_SELECTOR, "em.product_num__iEwQH")
                                review_count = self.extract_number(review_element.text)
                            except:
                                pass
                            
                            # 스토어 ID 추출
                            store_id = ""
                            if store_url:
                                store_id_match = re.search(r'smartstore\.naver\.com\/([^\/\?]+)', store_url)
                                if store_id_match:
                                    store_id = store_id_match.group(1)
                            
                            # 결과에 추가
                            store_info = {
                                "store_name": mall_name,
                                "store_id": store_id,
                                "store_url": store_url,
                                "product_title": title,
                                "price": price,
                                "review_count": review_count
                            }
                            
                            # 중복 제거하며 추가
                            if store_id and not any(s["store_id"] == store_id for s in results["stores"]):
                                results["stores"].append(store_info)
                            
                        except Exception as e:
                            logger.error("스토어 정보 추출 오류: %s", str(e))
                    
                except Exception as e:
                    logger.error("페이지 %d 스토어 추출 실패: %s - %s", page, keyword, str(e))
                    break
            
            return results
            
        except Exception as e:
            logger.error("네이버 스마트스토어 크롤링 실패: %s - %s", keyword, str(e))
            return results
        
        finally:
            # 드라이버는 유지 (재사용)
            pass
    
    async def crawl_naver_ad_keywords(self, keyword: str) -> Dict:
        """네이버 검색 광고 키워드 정보 크롤링"""
        # 결과 구조
        results = {
            "keyword": keyword,
            "ad_keywords": [],
            "timestamp": datetime.now().isoformat()
        }
        
        # 웹드라이버 초기화
        if not self.driver:
            self.initialize_driver()
        
        try:
            # 네이버 검색 페이지
            encoded_keyword = urllib.parse.quote(keyword)
            url = f"https://search.naver.com/search.naver?query={encoded_keyword}"
            
            # 페이지 로드
            self.driver.get(url)
            self.random_sleep()
            
            # 파워링크(광고) 요소 찾기
            try:
                ad_sections = self.driver.find_elements(By.CSS_SELECTOR, "li.ad_section")
                
                for section in ad_sections:
                    try:
                        # 광고 제목
                        title_element = section.find_element(By.CSS_SELECTOR, "a.link_ad")
                        title = title_element.text.strip() if title_element else ""
                        
                        # 광고 URL
                        ad_url = title_element.get_attribute("href") if title_element else ""
                        
                        # 광고주명
                        advertiser = ""
                        try:
                            url_element = section.find_element(By.CSS_SELECTOR, "a.url_link")
                            advertiser = url_element.text.strip() if url_element else ""
                        except:
                            pass
                        
                        # 광고 설명
                        description = ""
                        try:
                            desc_element = section.find_element(By.CSS_SELECTOR, "div.ad_dsc")
                            description = desc_element.text.strip() if desc_element else ""
                        except:
                            pass
                        
                        # 결과에 추가
                        if title:
                            ad_info = {
                                "title": title,
                                "url": ad_url,
                                "advertiser": advertiser,
                                "description": description
                            }
                            results["ad_keywords"].append(ad_info)
                    
                    except Exception as e:
                        logger.error("광고 정보 추출 오류: %s", str(e))
                
            except Exception as e:
                logger.warning("광고 섹션 찾기 실패: %s - %s", keyword, str(e))
            
            return results
            
        except Exception as e:
            logger.error("네이버 광고 키워드 크롤링 실패: %s - %s", keyword, str(e))
            return results
        
        finally:
            # 드라이버는 유지 (재사용)
            pass
    
    def __del__(self):
        """소멸자: 드라이버 자원 정리"""
        self.close_driver()

class KeywordAnalyzer:
    """
    키워드 분석 클래스
    - API와 크롤링을 조합한 하이브리드 데이터 수집
    - 키워드 중요도, 경쟁도, 성장률 등 다양한 지표 계산
    - 연관 키워드 및 롱테일 키워드 발굴
    """
    
    def __init__(self):
        self.db = DatabaseManager()
        self.api = NaverAPI()
        self.crawler = NaverCrawler()
        self.use_api_first = True  # API 우선 사용 설정
        self.api_fallback_to_crawl = True  # API 실패 시 크롤링으로 대체
    
    async def analyze_keyword(self, keyword: str, category: str = None, depth: int = 1, 
                            use_api: bool = True, max_pages: int = None) -> Dict:
        """키워드 분석 실행 (API 또는 크롤링)"""
        logger.info(f"키워드 '{keyword}' 분석 시작 (카테고리: {category}, 깊이: {depth})")
        start_time = time.time()
        
        # 결과 저장 딕셔너리
        results = {
            "main_keyword": keyword,
            "category": category,
            "keywords_data": {},
            "related_keywords": [],
            "total_keywords": 0,
            "api_success": False,
            "crawl_success": False,
            "execution_time": 0
        }
        
        # 1. 메인 키워드 분석
        keyword_data = await self.analyze_single_keyword(keyword, category, use_api, max_pages)
        results["keywords_data"][keyword] = keyword_data
        
        # API 또는 크롤링 성공 여부 기록
        results["api_success"] = keyword_data.get("api_success", False)
        results["crawl_success"] = keyword_data.get("crawl_success", False)
        
        # 2. 관련 키워드 분석 (설정된 깊이에 따라)
        if depth > 1 and "related_keywords" in keyword_data:
            # 관련 키워드 추출 (최대 10개로 제한)
            related_keywords = []
            for kw_data in keyword_data["related_keywords"][:10]:
                related_keyword = kw_data.get("keyword", "")
                if related_keyword and related_keyword != keyword:
                    related_keywords.append(related_keyword)
            
            results["related_keywords"] = related_keywords
            
            # 병렬 처리로 관련 키워드 분석
            if related_keywords:
                logger.info(f"관련 키워드 {len(related_keywords)}개 분석 시작")
                
                tasks = []
                for related_kw in related_keywords:
                    task = self.analyze_single_keyword(related_kw, category, use_api, max_pages)
                    tasks.append(task)
                
                related_results = await asyncio.gather(*tasks)
                
                # 결과 처리
                for idx, related_data in enumerate(related_results):
                    related_kw = related_keywords[idx]
                    results["keywords_data"][related_kw] = related_data
        
        # 3. 실행 시간 계산
        execution_time = time.time() - start_time
        results["execution_time"] = round(execution_time, 2)
        
        # 4. 데이터베이스에 결과 저장
        await self.save_analysis_results(results)
        
        # 5. 총 키워드 수 업데이트
        results["total_keywords"] = len(results["keywords_data"])
        
        logger.info(f"키워드 분석 완료: {results['total_keywords']}개 키워드, 실행 시간: {results['execution_time']}초")
        return results
    
    async def analyze_single_keyword(self, keyword: str, category: str = None, use_api: bool = True, 
                                   max_pages: int = None) -> Dict:
        """단일 키워드 분석 - API와 크롤링 방식 모두 시도"""
        start_time = time.time()
        
        # 결과 저장 딕셔너리
        result = {
            "keyword": keyword,
            "category": category,
            "api_success": False,
            "crawl_success": False,
            "search_volume": [],
            "competition": None,
            "related_keywords": [],
            "products": [],
            "ad_keywords": [],
            "timestamp": datetime.now().isoformat()
        }
        
        # 우선순위에 따라 데이터 수집 (API 또는 크롤링)
        if use_api and self.use_api_first:
            # 1. API로 데이터 수집 시도
            api_result = await self.collect_data_from_api(keyword)
            
            # API 성공 여부 체크
            api_success = not api_result.get("error") and (
                api_result.get("search_volume") or 
                api_result.get("related_keywords") or 
                api_result.get("products")
            )
            
            if api_success:
                # API 데이터 병합
                result.update(api_result)
                result["api_success"] = True
                
                # 광고 키워드 별도 저장 (API에서 제공하지 않으므로 항상 크롤링)
                ad_keywords = await self.collect_ad_keywords(keyword)
                if ad_keywords and "ad_keywords" in ad_keywords:
                    result["ad_keywords"] = ad_keywords["ad_keywords"]
                
                # API 로그 기록
                self.db.log_crawl_activity(
                    keyword=keyword,
                    source="api",
                    status="success",
                    details="API 데이터 수집 성공",
                    products_count=len(result.get("products", [])),
                    related_keywords_count=len(result.get("related_keywords", [])),
                    execution_time=time.time() - start_time
                )
        
        # API 실패 또는 크롤링 우선 설정인 경우 크롤링 시도
        if not result["api_success"] or not self.use_api_first:
            if not self.use_api_first or (self.api_fallback_to_crawl and use_api):
                # 크롤링으로 데이터 수집
                crawl_result = await self.collect_data_from_crawl(keyword, max_pages)
                
                # 크롤링 성공 여부 체크
                crawl_success = (
                    crawl_result.get("search_volume") or 
                    crawl_result.get("related_keywords") or 
                    crawl_result.get("products")
                )
                
                if crawl_success:
                    # 크롤링 데이터 병합
                    for key, value in crawl_result.items():
                        # 이미 API에서 가져온 데이터는 유지
                        if key not in result or not result[key]:
                            result[key] = value
                    
                    result["crawl_success"] = True
                    
                    # 크롤링 로그 기록
                    self.db.log_crawl_activity(
                        keyword=keyword,
                        source="crawl",
                        status="success",
                        details="크롤링 데이터 수집 성공",
                        products_count=len(result.get("products", [])),
                        related_keywords_count=len(result.get("related_keywords", [])),
                        execution_time=time.time() - start_time
                    )
        
        # 실패한 경우 로그 기록
        if not result["api_success"] and not result["crawl_success"]:
            logger.error(f"키워드 '{keyword}' 데이터 수집 실패 (API, 크롤링 모두 실패)")
            
            self.db.log_crawl_activity(
                keyword=keyword,
                source="both",
                status="failure",
                details="API 및 크롤링 모두 실패",
                execution_time=time.time() - start_time
            )
        
        # 키워드 메트릭스 계산
        metrics = self.calculate_keyword_metrics(result)
        result.update(metrics)
        
        # 실행 시간 기록
        result["execution_time"] = round(time.time() - start_time, 2)
        
        return result
    
    async def collect_data_from_api(self, keyword: str) -> Dict:
        """API를 사용하여 키워드 데이터 수집"""
        result = {
            "keyword": keyword,
            "search_volume": [],
            "related_keywords": [],
            "products": [],
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            # 1. 데이터랩 API로 검색량 조회
            datalab_response = await self.api.get_datalab_trend(keyword)
            
            if "error" not in datalab_response and "results" in datalab_response:
                # 검색량 데이터 추출
                results = datalab_response.get("results", [])
                if results and len(results) > 0:
                    trend_data = results[0].get("data", [])
                    result["search_volume"] = trend_data
                    
                    # 평균 검색량 계산
                    if trend_data:
                        avg_volume = sum(item["ratio"] for item in trend_data) / len(trend_data)
                        result["avg_search_volume"] = round(avg_volume, 2)
            
            # 2. 검색광고 API로 키워드 관련 정보 조회
            ad_response = await self.api.get_search_ad_keywords(keyword)
            
            if "error" not in ad_response and "keywordList" in ad_response:
                keyword_list = ad_response.get("keywordList", [])
                
                # 메인 키워드 정보 찾기
                main_keyword_data = next((item for item in keyword_list if item.get("relKeyword") == keyword), None)
                if main_keyword_data:
                    # 경쟁도
                    result["competition"] = main_keyword_data.get("compIdx", 0)
                    
                    # PC/모바일 검색량
                    result["pc_search_volume"] = main_keyword_data.get("monthlyPcQcCnt", 0)
                    result["mobile_search_volume"] = main_keyword_data.get("monthlyMobileQcCnt", 0)
                
                # 관련 키워드 정보 추출
                related_keywords = []
                for item in keyword_list:
                    related_kw = item.get("relKeyword", "")
                    if related_kw and related_kw != keyword:
                        # 관련도 계산 (월간 검색량 + 광고 경쟁도)
                        monthly_qc = item.get("monthlyQcCnt", 0)
                        comp_idx = item.get("compIdx", 0)
                        
                        # 관련도 점수 (0.0 ~ 1.0)
                        relation_strength = min(1.0, (monthly_qc / 10000) * 0.7 + (comp_idx / 100) * 0.3)
                        
                        related_keywords.append({
                            "keyword": related_kw,
                            "strength": round(relation_strength, 2)
                        })
                
                result["related_keywords"] = related_keywords
            
            # 3. 쇼핑 검색 API로 상품 정보 조회
            shopping_response = await self.api.get_shopping_search(keyword, display=40)
            
            if "error" not in shopping_response and "items" in shopping_response:
                items = shopping_response.get("items", [])
                
                products = []
                for idx, item in enumerate(items, 1):
                    product = {
                        "title": item.get("title", "").replace("<b>", "").replace("</b>", ""),
                        "price": int(item.get("lprice", 0)),
                        "brand": item.get("brand", ""),
                        "mall": item.get("mallName", ""),
                        "url": item.get("link", ""),
                        "image_url": item.get("image", ""),
                        "reviews": 0,  # API에서 제공하지 않음
                        "rating": 0,   # API에서 제공하지 않음
                        "rank": idx
                    }
                    products.append(product)
                
                result["products"] = products
                result["total_products"] = shopping_response.get("total", 0)
            
            return result
            
        except Exception as e:
            logger.error(f"API 데이터 수집 중 오류: {str(e)}")
            return {"error": str(e), "keyword": keyword}
    
    async def collect_data_from_crawl(self, keyword: str, max_pages: int = None) -> Dict:
        """웹 크롤링을 사용하여 키워드 데이터 수집"""
        result = {
            "keyword": keyword,
            "search_volume": [],
            "related_keywords": [],
            "products": [],
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            # 병렬로 여러 크롤링 작업 실행
            tasks = [
                self.crawler.crawl_naver_shopping(keyword, max_pages),
                self.crawler.crawl_naver_datalab(keyword),
                self.crawler.crawl_naver_ad_keywords(keyword)
            ]
            
            # 모든 크롤링 작업 동시 실행 및 결과 수집
            shopping_data, datalab_data, ad_data = await asyncio.gather(*tasks)
            
            # 1. 쇼핑 데이터 처리
            if shopping_data and "products" in shopping_data:
                result["products"] = shopping_data["products"]
                result["total_products"] = shopping_data.get("total_products", 0)
                
                if "related_keywords" in shopping_data:
                    related_keywords = []
                    for kw in shopping_data["related_keywords"]:
                        if isinstance(kw, dict) and "keyword" in kw:
                            related_keywords.append(kw)
                        elif isinstance(kw, str):
                            related_keywords.append({"keyword": kw, "strength": 1.0})
                    
                    result["related_keywords"] = related_keywords
            
            # 2. 데이터랩 검색량 데이터 처리
            if datalab_data and "data" in datalab_data and datalab_data["data"]:
                result["search_volume"] = datalab_data["data"]
                
                # 평균 검색량 계산
                if datalab_data["data"]:
                    avg_volume = sum(item.get("volume", 0) for item in datalab_data["data"]) / len(datalab_data["data"])
                    result["avg_search_volume"] = round(avg_volume, 2)
            
            # 3. 광고 키워드 데이터 처리
            if ad_data and "ad_keywords" in ad_data:
                result["ad_keywords"] = ad_data["ad_keywords"]
            
            # 4. 경쟁도 계산 (데이터랩과 쇼핑 데이터 기반)
            if "avg_search_volume" in result and "total_products" in result and result["total_products"] > 0:
                # 상품 수와 검색량 기반 경쟁도 계산 (0-100 사이 값으로 정규화)
                if result["avg_search_volume"] > 0:
                    competition = min(100, result["total_products"] / (result["avg_search_volume"] + 1) * 10)
                    result["competition"] = round(competition, 2)
            
            return result
            
        except Exception as e:
            logger.error(f"크롤링 데이터 수집 중 오류: {str(e)}")
            return {"error": str(e), "keyword": keyword}
    
    async def collect_ad_keywords(self, keyword: str) -> Dict:
        """광고 키워드 정보 수집"""
        try:
            # 광고 키워드 크롤링
            ad_data = await self.crawler.crawl_naver_ad_keywords(keyword)
            return ad_data
        except Exception as e:
            logger.error(f"광고 키워드 수집 중 오류: {str(e)}")
            return {"error": str(e), "keyword": keyword}
    
    async def save_analysis_results(self, results: Dict) -> None:
        """분석 결과를 데이터베이스에 저장"""
        main_keyword = results["main_keyword"]
        category = results.get("category")
        
        try:
            # 각 키워드별 데이터 처리
            for keyword, data in results["keywords_data"].items():
                # 1. 키워드 기본 정보 저장
                search_volume = data.get("avg_search_volume", 0)
                competition = data.get("competition", 0)
                
                keyword_id = self.db.save_keyword(
                    keyword=keyword,
                    category=category,
                    search_volume=search_volume,
                    competition=competition
                )
                
                if not keyword_id:
                    logger.error(f"키워드 '{keyword}' 저장 실패")
                    continue
                
                # 2. 관련 키워드 저장
                related_keywords = data.get("related_keywords", [])
                if related_keywords:
                    self.db.save_related_keywords(keyword_id, related_keywords)
                
                # 3. 상품 정보 저장
                products = data.get("products", [])
                if products:
                    self.db.save_products(keyword_id, products)
                
                # 4. 트렌드 데이터 저장
                trend_data = data.get("search_volume", [])
                if trend_data:
                    trend_list = []
                    for item in trend_data:
                        if isinstance(item, dict):
                            trend_list.append(item)
                    
                    if trend_list:
                        self.db.save_keyword_trend(keyword_id, trend_list)
                
                # 5. 광고 키워드 저장
                ad_keywords = data.get("ad_keywords", [])
                for ad in ad_keywords:
                    if isinstance(ad, dict) and "title" in ad:
                        self.db.save_ad_keyword(ad["title"])
        
        except Exception as e:
            logger.error(f"분석 결과 저장 중 오류: {str(e)}")
    
    def calculate_keyword_metrics(self, keyword_data: Dict) -> Dict:
        """키워드 분석 메트릭스 계산"""
        metrics = {
            "importance": 0,
            "growth_rate": 0,
            "potential_score": 0,
            "difficulty": 0,
            "opportunity": 0
        }
        
        try:
            # 검색량 추세 분석
            search_volume = keyword_data.get("search_volume", [])
            
            if search_volume:
                # 1. 성장률 계산 (전반부 vs 후반부)
                if len(search_volume) > 1:
                    first_half = search_volume[:len(search_volume)//2]
                    second_half = search_volume[len(search_volume)//2:]
                    
                    if isinstance(first_half[0], dict):
                        # API 형식 ('ratio' 키 사용)
                        first_avg = sum(item.get("ratio", 0) for item in first_half) / len(first_half)
                        second_avg = sum(item.get("ratio", 0) for item in second_half) / len(second_half)
                    else:
                        # 크롤링 형식 (숫자 값)
                        first_avg = sum(first_half) / len(first_half)
                        second_avg = sum(second_half) / len(second_half)
                    
                    if first_avg > 0:
                        growth_rate = ((second_avg - first_avg) / first_avg) * 100
                        metrics["growth_rate"] = round(growth_rate, 2)
                
                # 2. 중요도 계산 (검색량 + 경쟁도)
                avg_search_volume = keyword_data.get("avg_search_volume", 0)
                competition = keyword_data.get("competition", 0)
                
                if avg_search_volume > 0:
                    # 검색량과 경쟁도 기반 중요도 점수 (0-100)
                    importance = min(100, (avg_search_volume / 10) * (1 - competition/100))
                    metrics["importance"] = round(importance, 2)
                
                # 3. 잠재력 점수 (중요도 + 성장률)
                potential = (metrics["importance"] * 0.7) + (max(0, metrics["growth_rate"]) * 0.3)
                metrics["potential_score"] = round(potential, 2)
                
                # 4. 난이도 계산 (경쟁도 + 상품 수)
                total_products = keyword_data.get("total_products", 0)
                if competition > 0 and total_products > 0:
                    difficulty = (competition * 0.7) + (min(100, total_products / 100) * 0.3)
                    metrics["difficulty"] = round(difficulty, 2)
                
                # 5. 기회 점수 (중요도 - 난이도)
                opportunity = max(0, metrics["importance"] - metrics["difficulty"] * 0.5)
                metrics["opportunity"] = round(opportunity, 2)
            
        except Exception as e:
            logger.error(f"메트릭스 계산 중 오류: {str(e)}")
        
        return metrics
    
    async def find_longtail_keywords(self, main_keyword: str, category: str = None, limit: int = 20) -> List[Dict]:
        """롱테일 키워드 발굴"""
        longtail_keywords = []
        
        try:
            # 1. 메인 키워드 분석
            keyword_data = await self.analyze_single_keyword(main_keyword, category)
            
            # 2. 관련 키워드 수집
            related_keywords = keyword_data.get("related_keywords", [])
            
            # 3. 추가 연관 키워드 변형 생성
            all_keywords = set()
            
            # 기본 관련 키워드 추가
            for kw_data in related_keywords:
                if isinstance(kw_data, dict) and "keyword" in kw_data:
                    all_keywords.add(kw_data["keyword"])
                elif isinstance(kw_data, str):
                    all_keywords.add(kw_data)
            
            # 변형 키워드 생성 (예: '키워드 추천', '키워드 구매', '키워드 가격' 등)
            modifiers = ["추천", "구매", "가격", "효과", "후기", "비교", "순위", "인기", "최저가", "할인"]
            for kw in list(all_keywords):  # 복사본으로 반복
                for modifier in modifiers:
                    all_keywords.add(f"{kw} {modifier}")
            
            # 4. 각 키워드 분석 (병렬 처리)
            tasks = []
            for kw in list(all_keywords)[:limit]:  # 최대 개수 제한
                task = self.analyze_single_keyword(kw, category)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks)
            
            # 5. 롱테일 키워드 필터링 (경쟁도 낮고 검색량 적당한 키워드)
            for data in results:
                competition = data.get("competition", 100)
                search_volume = data.get("avg_search_volume", 0)
                
                # 롱테일 조건: 경쟁도 50 이하, 검색량 10 이상
                if competition <= 50 and search_volume >= 10:
                    metrics = self.calculate_keyword_metrics(data)
                    
                    longtail_keywords.append({
                        "keyword": data["keyword"],
                        "search_volume": search_volume,
                        "competition": competition,
                        "importance": metrics["importance"],
                        "opportunity": metrics["opportunity"]
                    })
            
            # 기회 점수로 정렬
            longtail_keywords.sort(key=lambda x: x.get("opportunity", 0), reverse=True)
            
        except Exception as e:
            logger.error(f"롱테일 키워드 발굴 중 오류: {str(e)}")
        
        return longtail_keywords
    
    async def analyze_competitor_keywords(self, competitor_url: str, limit: int = 20) -> Dict:
        """경쟁사 키워드 분석"""
        result = {
            "competitor_url": competitor_url,
            "keywords": [],
            "top_keywords": [],
            "shared_keywords": [],
            "unique_keywords": []
        }
        
        try:
            # 1. 경쟁사 스토어 ID 추출
            store_id = ""
            store_id_match = re.search(r'smartstore\.naver\.com\/([^\/\?]+)', competitor_url)
            if store_id_match:
                store_id = store_id_match.group(1)
            else:
                logger.error(f"유효한 스마트스토어 URL이 아님: {competitor_url}")
                return result
            
            # 2. 웹드라이버 초기화
            if not self.crawler.driver:
                self.crawler.initialize_driver()
            
            # 3. 스토어 홈페이지 방문
            self.crawler.driver.get(competitor_url)
            self.crawler.random_sleep()
            
            # 4. 상품 정보 수집
            products = []
            try:
                product_elements = self.crawler.driver.find_elements(By.CSS_SELECTOR, "li.prod_item")
                
                for element in product_elements[:10]:  # 최대 10개 상품만 분석
                    try:
                        # 상품명
                        title_element = element.find_element(By.CSS_SELECTOR, "div.product_info_area span.product_name")
                        title = title_element.text.strip()
                        
                        # 상품 URL
                        link_element = element.find_element(By.CSS_SELECTOR, "a.product_info_area")
                        product_url = link_element.get_attribute("href")
                        
                        products.append({
                            "title": title,
                            "url": product_url
                        })
                    except:
                        continue
            except Exception as e:
                logger.error(f"상품 정보 추출 중 오류: {str(e)}")
            
            # 5. 각 상품에서 키워드 추출 및 분석
            all_keywords = []
            for product in products:
                # 상품명에서 키워드 추출
                title = product["title"]
                if not title:
                    continue
                
                # 주요 명사 추출 (간단한 방법)
                words = re.findall(r'[가-힣a-zA-Z]+', title)
                words = [w for w in words if len(w) >= 2]  # 2글자 이상만 사용
                
                # 단일 키워드 및 2단어 조합 키워드 생성
                keywords = words.copy()
                for i in range(len(words) - 1):
                    keywords.append(f"{words[i]} {words[i+1]}")
                
                all_keywords.extend(keywords)
            
            # 6. 키워드 빈도 계산
            keyword_counter = {}
            for kw in all_keywords:
                keyword_counter[kw] = keyword_counter.get(kw, 0) + 1
            
            # 빈도순 정렬
            sorted_keywords = sorted(keyword_counter.items(), key=lambda x: x[1], reverse=True)
            
            # 7. 상위 키워드 선별 (최대 limit 개)
            top_keywords = []
            for kw, freq in sorted_keywords[:limit]:
                top_keywords.append({"keyword": kw, "frequency": freq})
            
            # 8. 선별된 키워드 분석
            analyzed_keywords = []
            for kw_data in top_keywords[:10]:  # 상위 10개만 분석
                kw = kw_data["keyword"]
                
                # 키워드 분석
                analysis = await self.analyze_single_keyword(kw)
                metrics = self.calculate_keyword_metrics(analysis)
                
                analyzed_keywords.append({
                    "keyword": kw,
                    "frequency": kw_data["frequency"],
                    "search_volume": analysis.get("avg_search_volume", 0),
                    "competition": analysis.get("competition", 0),
                    "importance": metrics["importance"],
                    "opportunity": metrics["opportunity"]
                })
            
            # 결과 업데이트
            result["keywords"] = all_keywords
            result["top_keywords"] = top_keywords
            result["analyzed_keywords"] = analyzed_keywords
            
        except Exception as e:
            logger.error(f"경쟁사 키워드 분석 중 오류: {str(e)}")
        
        return result
    
    def get_keyword_recommendations(self, keyword: str, category: str = None) -> Dict:
        """키워드 추천 및 개선 방안 제안"""
        recommendations = {
            "keyword": keyword,
            "improvements": [],
            "related_suggestions": [],
            "ad_suggestions": []
        }
        
        try:
            # 데이터베이스에서 키워드 정보 조회
            keyword_data = self.db.get_keyword_data(keyword, category)
            
            if not keyword_data["found"]:
                return recommendations
            
            # 1. 키워드 개선 방안
            improvements = []
            
            # 검색량이 너무 적은 경우
            if keyword_data["search_volume"] < 50:
                improvements.append({
                    "issue": "검색량이 적음",
                    "suggestion": "더 일반적인 상위 키워드를 사용하거나, 인기 있는 관련 키워드와 조합해보세요."
                })
            
            # 경쟁도가 너무 높은 경우
            if keyword_data["competition"] > 70:
                improvements.append({
                    "issue": "경쟁도가 높음",
                    "suggestion": "더 구체적인 롱테일 키워드를 사용하여 경쟁을 줄이세요."
                })
            
            # 관련 키워드가 적은 경우
            if len(keyword_data["related_keywords"]) < 5:
                improvements.append({
                    "issue": "관련 키워드가 적음",
                    "suggestion": "키워드 범위를 확장하거나, 동의어/유사어를 찾아 사용하세요."
                })
            
            recommendations["improvements"] = improvements
            
            # 2. 관련 키워드 추천
            related_keywords = keyword_data["related_keywords"]
            
            # 검색량과 경쟁도 기준으로 필터링
            best_related = []
            for kw_data in related_keywords:
                if isinstance(kw_data, dict) and "keyword" in kw_data:
                    related_kw = kw_data["keyword"]
                    related_data = self.db.get_keyword_data(related_kw)
                    
                    if related_data["found"]:
                        search_volume = related_data["search_volume"]
                        competition = related_data["competition"]
                        
                        # 적절한 검색량과 낮은 경쟁도를 가진 키워드 선정
                        if search_volume > 20 and competition < 60:
                            best_related.append({
                                "keyword": related_kw,
                                "search_volume": search_volume,
                                "competition": competition
                            })
            
            recommendations["related_suggestions"] = best_related[:5]  # 상위 5개만
            
            # 3. 광고 키워드 제안
            ad_keywords = []
            for kw_data in related_keywords:
                if isinstance(kw_data, dict) and "keyword" in kw_data:
                    related_kw = kw_data["keyword"]
                    
                    # 이미 광고 키워드인지 확인
                    if not self.db.is_ad_keyword(related_kw):
                        related_data = self.db.get_keyword_data(related_kw)
                        
                        if related_data["found"]:
                            search_volume = related_data["search_volume"]
                            competition = related_data["competition"]
                            
                            # 검색량이 높고 경쟁도가 적당한 키워드 선정
                            if search_volume > 50 and competition < 70:
                                ad_keywords.append({
                                    "keyword": related_kw,
                                    "search_volume": search_volume,
                                    "competition": competition
                                })
            
            recommendations["ad_suggestions"] = ad_keywords[:3]  # 상위 3개만
            
        except Exception as e:
            logger.error(f"키워드 추천 생성 중 오류: {str(e)}")
        
        return recommendations

# 웹 애플리케이션 클래스
class WebApplication:
    """
    Flask 기반 웹 애플리케이션
    - 키워드 분석 UI 제공
    - 실시간 크롤링 모니터링
    - 분석 결과 시각화
    """
    
    def __init__(self, port: int = CONFIG["PORT"]):
        self.app = Flask(__name__)
        self.app.secret_key = os.urandom(24)
        self.port = port
        
        # CORS 설정
        CORS(self.app)
        
        # 소켓IO 설정 (실시간 통신)
        self.socketio = SocketIO(self.app, cors_allowed_origins="*")
        
        # 데이터베이스 및 분석기 인스턴스
        self.db = DatabaseManager()
        self.analyzer = KeywordAnalyzer()
        
        # 정적 폴더 설정
        os.makedirs('static', exist_ok=True)
        
        # 라우트 설정
        self._setup_routes()
        
        # 소켓 이벤트 핸들러 설정
        self._setup_socket_handlers()
        
        logger.info(f"웹 애플리케이션 초기화 완료 (포트: {port})")
    
    def _setup_routes(self):
        """웹 라우트 설정"""
        # 메인 페이지
        @self.app.route('/')
        def index():
            stats = self.db.get_keyword_stats()
            keywords = self.db.get_all_keywords(limit=20)
            return render_template('index.html', stats=stats, keywords=keywords)
        
        # 키워드 분석 API
        @self.app.route('/api/analyze', methods=['POST'])
        async def analyze_keyword():
            data = request.get_json()
            
            if not data or "keyword" not in data:
                return jsonify({"error": "키워드를 입력해주세요"}), 400
            
            keyword = data["keyword"]
            category = data.get("category")
            depth = int(data.get("depth", 1))
            use_api = data.get("use_api", True)
            max_pages = data.get("max_pages", CONFIG["MAX_PAGES"])
            
            # 백그라운드 태스크로 분석 실행 (비동기)
            results = await self.analyzer.analyze_keyword(
                keyword=keyword,
                category=category,
                depth=depth,
                use_api=use_api,
                max_pages=max_pages
            )
            
            return jsonify(results)
        
        # 키워드 상세 페이지
        @self.app.route('/keyword/<keyword>')
        def keyword_details(keyword):
            category = request.args.get('category')
            data = self.db.get_keyword_data(keyword, category)
            
            # 트렌드 그래프 생성
            graph_path = None
            if data["trends"]:
                graph_path = self._generate_trend_graph(keyword, data["trends"])
            
            # 연관 키워드 네트워크 그래프 생성
            network_graph = None
            if data["related_keywords"]:
                network_graph = self._generate_network_graph(keyword, data["related_keywords"])
            
            # 상품 순위 변동 데이터
            ranking_history = self.db.get_ranking_history(keyword, days=30)
            
            return render_template(
                'keyword_details.html',
                keyword=keyword,
                data=data,
                graph_path=graph_path,
                network_graph=network_graph,
                ranking_history=ranking_history
            )
        
        # 롱테일 키워드 발굴 API
        @self.app.route('/api/longtail', methods=['POST'])
        async def find_longtail():
            data = request.get_json()
            
            if not data or "keyword" not in data:
                return jsonify({"error": "키워드를 입력해주세요"}), 400
            
            keyword = data["keyword"]
            category = data.get("category")
            limit = int(data.get("limit", 20))
            
            results = await self.analyzer.find_longtail_keywords(
                main_keyword=keyword,
                category=category,
                limit=limit
            )
            
            return jsonify({"keyword": keyword, "longtail_keywords": results})
        
        # 경쟁사 분석 API
        @self.app.route('/api/competitor', methods=['POST'])
        async def analyze_competitor():
            data = request.get_json()
            
            if not data or "url" not in data:
                return jsonify({"error": "경쟁사 URL을 입력해주세요"}), 400
            
            url = data["url"]
            limit = int(data.get("limit", 20))
            
            results = await self.analyzer.analyze_competitor_keywords(
                competitor_url=url,
                limit=limit
            )
            
            return jsonify(results)
        
        # 키워드 추천 API
        @self.app.route('/api/recommendations/<keyword>')
        def get_recommendations(keyword):
            category = request.args.get('category')
            recommendations = self.analyzer.get_keyword_recommendations(keyword, category)
            return jsonify(recommendations)
        
        # 데이터베이스 통계 페이지
        @self.app.route('/stats')
        def stats():
            stats = self.db.get_keyword_stats()
            return render_template('stats.html', stats=stats)
        
        # 크롤링 모니터링 페이지
        @self.app.route('/monitor')
        def monitor():
            return render_template('monitor.html')
    
    def _setup_socket_handlers(self):
        """소켓IO 이벤트 핸들러 설정"""
        # 크롤링 상태 업데이트
        @self.socketio.on('connect')
        def handle_connect():
            logger.info("클라이언트 연결됨")
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            logger.info("클라이언트 연결 종료")
        
        # 크롤링 진행 상황 업데이트를 위한 태스크 등록
        @self.socketio.on('start_monitor')
        async def start_monitor(data):
            keyword = data.get('keyword', '')
            if not keyword:
                return
            
            # 크롤링 상태 모니터링 시작
            monitor_task = asyncio.create_task(self._monitor_crawling(keyword))
            await monitor_task
    
    async def _monitor_crawling(self, keyword: str):
        """크롤링 진행 상황 모니터링 및 실시간 업데이트"""
        # 임시 상태 저장소
        status = {
            "keyword": keyword,
            "stage": "준비 중",
            "progress": 0,
            "details": "분석 준비 중...",
            "products_count": 0,
            "related_keywords_count": 0,
            "error": None
        }
        
        # 초기 상태 전송
        self.socketio.emit('crawl_status', status)
        
        try:
            # 1. 쇼핑 데이터 크롤링
            status["stage"] = "쇼핑 데이터 수집"
            status["details"] = "네이버 쇼핑 페이지에서 데이터를 수집 중입니다."
            status["progress"] = 10
            self.socketio.emit('crawl_status', status)
            
            # 실제 크롤링 수행
            shopping_data = await self.analyzer.crawler.crawl_naver_shopping(keyword)
            
            # 결과 업데이트
            if shopping_data:
                status["products_count"] = len(shopping_data.get("products", []))
                status["related_keywords_count"] = len(shopping_data.get("related_keywords", []))
                status["progress"] = 40
                self.socketio.emit('crawl_status', status)
            
            # 2. 데이터랩 트렌드 크롤링
            status["stage"] = "검색 트렌드 수집"
            status["details"] = "네이버 데이터랩에서 검색 트렌드를 수집 중입니다."
            status["progress"] = 50
            self.socketio.emit('crawl_status', status)
            
            # 실제 크롤링 수행
            trend_data = await self.analyzer.crawler.crawl_naver_datalab(keyword)
            
            # 결과 업데이트
            if trend_data:
                status["progress"] = 70
                self.socketio.emit('crawl_status', status)
            
            # 3. 광고 키워드 크롤링
            status["stage"] = "광고 키워드 수집"
            status["details"] = "네이버 검색 페이지에서 광고 키워드를 수집 중입니다."
            status["progress"] = 80
            self.socketio.emit('crawl_status', status)
            
            # 실제 크롤링 수행
            ad_data = await self.analyzer.crawler.crawl_naver_ad_keywords(keyword)
            
            # 4. 분석 완료
            status["stage"] = "분석 완료"
            status["details"] = "모든 데이터 수집 및 분석이 완료되었습니다."
            status["progress"] = 100
            self.socketio.emit('crawl_status', status)
            
        except Exception as e:
            status["error"] = str(e)
            status["details"] = f"오류 발생: {str(e)}"
            status["stage"] = "오류"
            self.socketio.emit('crawl_status', status)
            logger.error(f"크롤링 모니터링 중 오류: {str(e)}")
    
    def _generate_trend_graph(self, keyword: str, trend_data: List[Dict]) -> str:
        """검색 트렌드 그래프 생성"""
        try:
            # 데이터 준비
            dates = []
            volumes = []
            
            for data_point in trend_data:
                date = data_point.get("date", "")
                volume = data_point.get("volume", 0)
                
                if date and volume is not None:
                    dates.append(date)
                    volumes.append(volume)
            
            if not dates or not volumes:
                return None
            
            # 그래프 생성
            plt.figure(figsize=(10, 5))
            plt.plot(dates, volumes, marker='o', color='#4285F4', linewidth=2)
            plt.title(f"'{keyword}' 검색 트렌드", fontsize=16)
            plt.xlabel('날짜', fontsize=12)
            plt.ylabel('검색량', fontsize=12)
            plt.grid(True, linestyle='--', alpha=0.7)
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # 그래프 저장
            graph_filename = f"trend_{keyword}_{int(time.time())}.png"
            graph_path = os.path.join('static', graph_filename)
            plt.savefig(graph_path, dpi=100)
            plt.close()
            
            return f"/static/{graph_filename}"
            
        except Exception as e:
            logger.error(f"트렌드 그래프 생성 오류: {str(e)}")
            return None
    
    def _generate_network_graph(self, keyword: str, related_keywords: List[Dict]) -> str:
        """관련 키워드 네트워크 그래프 생성"""
        try:
            # 데이터 준비
            G = {}
            G["nodes"] = [{"id": keyword, "group": 1, "size": 15}]
            G["links"] = []
            
            # 관련 키워드 추가
            for idx, kw_data in enumerate(related_keywords[:15]):  # 최대 15개
                if isinstance(kw_data, dict) and "keyword" in kw_data:
                    related_kw = kw_data["keyword"]
                    strength = kw_data.get("strength", 1.0)
                    
                    # 노드 추가
                    G["nodes"].append({
                        "id": related_kw,
                        "group": 2,
                        "size": 10
                    })
                    
                    # 링크 추가
                    G["links"].append({
                        "source": keyword,
                        "target": related_kw,
                        "value": strength * 5  # 시각적 두께
                    })
            
            # JSON 파일로 저장
            graph_filename = f"network_{keyword}_{int(time.time())}.json"
            graph_path = os.path.join('static', graph_filename)
            
            with open(graph_path, 'w', encoding='utf-8') as f:
                json.dump(G, f, ensure_ascii=False)
            
            return f"/static/{graph_filename}"
            
        except Exception as e:
            logger.error(f"네트워크 그래프 생성 오류: {str(e)}")
            return None
    
    def run(self):
        """웹 애플리케이션 실행"""
        logger.info(f"웹 애플리케이션 시작 (포트: {self.port})")
        self.socketio.run(self.app, host='0.0.0.0', port=self.port, debug=True)

# 템플릿 파일 생성 함수
def create_template_files():
    """템플릿 파일 생성"""
    os.makedirs('templates', exist_ok=True)
    
    # index.html
    with open('templates/index.html', 'w', encoding='utf-8') as f:
        f.write('''
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>구공길 키워드 분석 시스템</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        .keyword-card {
            transition: all 0.3s;
            height: 100%;
        }
        .keyword-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .stats-box {
            background-color: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .loader {
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 2s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        #progress-container {
            margin-top: 20px;
            display: none;
        }
        .feature-icon {
            font-size: 2rem;
            color: #4285F4;
            margin-bottom: 15px;
        }
        .nav-icon {
            margin-right: 8px;
        }
        .brand-logo {
            height: 40px;
        }
    </style>
</head>
<body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">
                <img src="/static/logo.png" alt="구공길" class="brand-logo">
                구공길 키워드 분석기
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="/"><i class="fas fa-home nav-icon"></i>홈</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/stats"><i class="fas fa-chart-bar nav-icon"></i>통계</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/monitor"><i class="fas fa-tv nav-icon"></i>모니터링</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">키워드 분석</h5>
                        <div class="input-group mb-3">
                            <input type="text" id="keyword-input" class="form-control" placeholder="분석할 키워드 입력...">
                            <select id="category-select" class="form-select" style="max-width: 180px;">
                                <option value="건강기능식품" selected>건강기능식품</option>
                                <option value="화장품">화장품</option>
                                <option value="식품">식품</option>
                                <option value="패션의류">패션의류</option>
                                <option value="디지털가전">디지털가전</option>
                            </select>
                            <select id="depth-select" class="form-select" style="max-width: 150px;">
                                <option value="1">단일 키워드</option>
                                <option value="2" selected>관련 키워드 포함</option>
                            </select>
                            <div class="form-check form-switch ms-3 d-flex align-items-center">
                                <input class="form-check-input" type="checkbox" id="api-switch" checked>
                                <label class="form-check-label ms-2" for="api-switch">API 사용</label>
                            </div>
                            <button id="analyze-btn" class="btn btn-primary">
                                <i class="fas fa-search me-1"></i> 분석 시작
                            </button>
                        </div>
                        
                        <div id="progress-container">
                            <div class="progress mb-3">
                                <div id="analysis-progress" class="progress-bar" role="progressbar" style="width: 0%"></div>
                            </div>
                            <p id="progress-status">분석 준비 중...</p>
                            <div class="loader"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="stats-box shadow-sm">
                    <h5><i class="fas fa-database me-2"></i>데이터베이스 통계</h5>
                    <div class="row">
                        <div class="col-md-3 mb-3">
                            <div class="card text-center h-100 border-0 shadow-sm">
                                <div class="card-body">
                                    <i class="fas fa-key feature-icon"></i>
                                    <h3>{{ stats.total_keywords }}</h3>
                                    <p class="card-text text-muted">수집된 키워드</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card text-center h-100 border-0 shadow-sm">
                                <div class="card-body">
                                    <i class="fas fa-shopping-cart feature-icon"></i>
                                    <h3>{{ stats.total_products }}</h3>
                                    <p class="card-text text-muted">수집된 상품</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card text-center h-100 border-0 shadow-sm">
                                <div class="card-body">
                                    <i class="fas fa-chart-line feature-icon"></i>
                                    <h3>{{ stats.total_related_keywords }}</h3>
                                    <p class="card-text text-muted">관련 키워드</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card text-center h-100 border-0 shadow-sm">
                                <div class="card-body">
                                    <i class="fas fa-check-circle feature-icon"></i>
                                    <h3>{{ stats.crawl_success_rate }}%</h3>
                                    <p class="card-text text-muted">크롤링 성공률</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card shadow-sm">
                    <div class="card-header bg-white">
                        <h5 class="mb-0"><i class="fas fa-history me-2"></i>최근 분석된 키워드</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            {% for keyword in keywords %}
                            <div class="col-md-3 mb-4">
                                <div class="card keyword-card shadow-sm">
                                    <div class="card-body">
                                        <h5 class="card-title">{{ keyword.keyword }}</h5>
                                        <p class="card-text text-muted mb-1">카테고리: {{ keyword.category or '일반' }}</p>
                                        <p class="card-text text-muted mb-1">검색량: {{ keyword.search_volume }}</p>
                                        <p class="card-text text-muted">경쟁도: {{ keyword.competition }}</p>
                                        <div class="d-flex justify-content-between">
                                            <small class="text-muted">{{ keyword.updated_at }}</small>
                                            <a href="/keyword/{{ keyword.keyword }}" class="btn btn-sm btn-outline-primary">
                                                <i class="fas fa-search-plus me-1"></i> 상세
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {% endfor %}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card shadow-sm">
                    <div class="card-header bg-white">
                        <h5 class="mb-0"><i class="fas fa-lightbulb me-2"></i>기능 안내</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <div class="card h-100 border-0">
                                    <div class="card-body text-center">
                                        <i class="fas fa-search feature-icon"></i>
                                        <h5>키워드 분석</h5>
                                        <p>네이버 데이터와 크롤링을 결합한 하이브리드 분석 시스템으로 정확하고 다양한 키워드 데이터를 수집합니다.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="card h-100 border-0">
                                    <div class="card-body text-center">
                                        <i class="fas fa-chart-pie feature-icon"></i>
                                        <h5>경쟁 분석</h5>
                                        <p>경쟁사의 키워드 전략을 분석하고, 시장에서 경쟁 우위를 점할 수 있는 틈새 키워드를 발굴합니다.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="card h-100 border-0">
                                    <div class="card-body text-center">
                                        <i class="fas fa-wifi feature-icon"></i>
                                        <h5>실시간 모니터링</h5>
                                        <p>데이터 수집 과정을 실시간으로 모니터링하고, 결과를 시각적으로 확인할 수 있습니다.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <footer class="bg-dark text-white mt-5 py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h5>구공길 키워드 분석 시스템</h5>
                    <p>건강기능식품 판매를 위한 최적의 키워드 분석 솔루션</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <p>&copy; 2025 구공길. All rights reserved.</p>
                </div>
            </div>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/socket.io@4.4.1/client/socket.io.min.js"></script>
    <script>
        document.getElementById('analyze-btn').addEventListener('click', function() {
            const keyword = document.getElementById('keyword-input').value.trim();
            if (!keyword) {
                alert('키워드를 입력해주세요');
                return;
            }
            
            const category = document.getElementById('category-select').value;
            const depth = document.getElementById('depth-select').value;
            const useApi = document.getElementById('api-switch').checked;
            
            // 프로그레스 표시
            const progressContainer = document.getElementById('progress-container');
            const progressBar = document.getElementById('analysis-progress');
            const progressStatus = document.getElementById('progress-status');
            
            progressContainer.style.display = 'block';
            progressBar.style.width = '0%';
            progressStatus.textContent = '분석 준비 중...';
            
            // 분석 요청
            fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keyword: keyword,
                    category: category,
                    depth: parseInt(depth),
                    use_api: useApi
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('분석 결과:', data);
                
                // 프로그레스 완료
                progressBar.style.width = '100%';
                progressStatus.textContent = '분석 완료!';
                
                // 결과 페이지로 이동
                setTimeout(() => {
                    window.location.href = `/keyword/${keyword}?category=${category}`;
                }, 1000);
            })
            .catch(error => {
                console.error('분석 요청 오류:', error);
                progressStatus.textContent = `오류 발생: ${error.message}`;
                progressBar.classList.add('bg-danger');
            });
            
            // 소켓 연결 및 모니터링
            const socket = io();
            
            socket.on('connect', () => {
                console.log('소켓 연결됨');
                socket.emit('start_monitor', { keyword: keyword });
            });
            
            socket.on('crawl_status', (data) => {
                console.log('크롤링 상태:', data);
                progressBar.style.width = `${data.progress}%`;
                progressStatus.textContent = `${data.stage}: ${data.details}`;
                
                if (data.error) {
                    progressBar.classList.add('bg-danger');
                }
            });
        });
    </script>
</body>
</html>
        ''')
    
    # keyword_details.html
    with open('templates/keyword_details.html', 'w', encoding='utf-8') as f:
        f.write('''
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ keyword }} - 키워드 분석 결과 | 구공길</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        .metric-card {
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            color: white;
            height: 100%;
        }
        .metric-card h2 {
            font-size: 2.5rem;
        }
        .bg-primary-gradient {
            background: linear-gradient(135deg, #4285F4, #34A853);
        }
        .bg-success-gradient {
            background: linear-gradient(135deg, #34A853, #FBBC05);
        }
        .bg-warning-gradient {
            background: linear-gradient(135deg, #FBBC05, #EA4335);
        }
        .bg-danger-gradient {
            background: linear-gradient(135deg, #EA4335, #4285F4);
        }
        .trend-chart {
            width: 100%;
            height: 400px;
            margin-bottom: 20px;
        }
        .network-graph {
            width: 100%;
            height: 500px;
            border: 1px solid #ddd;
            border-radius: 10px;
            overflow: hidden;
        }
        .brand-logo {
            height: 40px;
        }
        .nav-icon {
            margin-right: 8px;
        }
        .product-card {
            transition: all 0.3s;
        }
        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .ranking-badge {
            position: absolute;
            top: 10px;
            left: 10px;
            background-color: rgba(0,0,0,0.7);
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
    </style>
</head>
<body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">
                <img src="/static/logo.png" alt="구공길" class="brand-logo">
                구공길 키워드 분석기
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/"><i class="fas fa-home nav-icon"></i>홈</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/stats"><i class="fas fa-chart-bar nav-icon"></i>통계</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/monitor"><i class="fas fa-tv nav-icon"></i>모니터링</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="/">홈</a></li>
                <li class="breadcrumb-item active">키워드 분석</li>
                <li class="breadcrumb-item active">{{ keyword }}</li>
            </ol>
        </nav>
        
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1><i class="fas fa-search me-2"></i>"{{ keyword }}" 분석 결과</h1>
            <div>
                <button id="btn-recommendations" class="btn btn-outline-primary me-2">
                    <i class="fas fa-lightbulb me-1"></i> 키워드 추천
                </button>
                <button id="btn-longtail" class="btn btn-outline-success">
                    <i class="fas fa-sitemap me-1"></i> 롱테일 키워드 발굴
                </button>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="metric-card bg-primary-gradient shadow">
                    <h5>검색량</h5>
                    <h2>{{ data.search_volume }}</h2>
                    <p class="mb-0">월간 평균 검색 횟수</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card bg-success-gradient shadow">
                    <h5>경쟁도</h5>
                    <h2>{{ data.competition }}</h2>
                    <p class="mb-0">100점 만점 기준</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card bg-warning-gradient shadow">
                    <h5>상품 수</h5>
                    <h2>{{ data.products|length }}</h2>
                    <p class="mb-0">관련 상품 개수</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card bg-danger-gradient shadow">
                    <h5>관련 키워드</h5>
                    <h2>{{ data.related_keywords|length }}</h2>
                    <p class="mb-0">연관 키워드 개수</p>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="card shadow-sm">
                    <div class="card-header bg-white">
                        <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i>검색 트렌드</h5>
                    </div>
                    <div class="card-body">
                        {% if graph_path %}
                        <img src="{{ graph_path }}" alt="{{ keyword }} 검색 트렌드" class="img-fluid trend-chart">
                        {% else %}
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>검색 트렌드 데이터가 없습니다.
                        </div>
                        {% endif %}
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card shadow-sm h-100">
                    <div class="card-header bg-white">
                        <h5 class="mb-0"><i class="fas fa-tags me-2"></i>관련 키워드</h5>
                    </div>
                    <div class="card-body">
                        {% if data.related_keywords %}
                        <div class="d-flex flex-wrap">
                            {% for keyword_data in data.related_keywords %}
                            <a href="/keyword/{{ keyword_data.keyword }}" class="btn btn-sm btn-outline-secondary m-1">
                                {{ keyword_data.keyword }}
                            </a>
                            {% endfor %}
                        </div>
                        {% else %}
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>관련 키워드 데이터가 없습니다.
                        </div>
                        {% endif %}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card shadow-sm">
                    <div class="card-header bg-white">
                        <ul class="nav nav-tabs card-header-tabs" id="productTabs">
                            <li class="nav-item">
                                <a class="nav-link active" id="products-tab" data-bs-toggle="tab" href="#products">
                                    <i class="fas fa-shopping-cart me-1"></i> 상품 ({{ data.products|length }})
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="network-tab" data-bs-toggle="tab" href="#network">
                                    <i class="fas fa-project-diagram me-1"></i> 키워드 네트워크
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="rankings-tab" data-bs-toggle="tab" href="#rankings">
                                    <i class="fas fa-sort-amount-down me-1"></i> 순위 변동
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div class="card-body">
                        <div class="tab-content" id="productTabsContent">
                            <div class="tab-pane fade show active" id="products">
                                {% if data.products %}
                                <div class="row">
                                    {% for product in data.products[:12] %}
                                    <div class="col-md-3 mb-4">
                                        <div class="card product-card shadow-sm">
                                            <div class="position-relative">
                                                {% if product.image_url %}
                                                <img src="{{ product.image_url }}" class="card-img-top" alt="{{ product.title }}" style="height: 200px; object-fit: contain;">
                                                {% else %}
                                                <div class="bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                                                    <i class="fas fa-image text-muted fa-3x"></i>
                                                </div>
                                                {% endif %}
                                                <div class="ranking-badge">{{ product.rank }}</div>
                                            </div>
                                            <div class="card-body">
                                                <h6 class="card-title text-truncate">{{ product.title }}</h6>
                                                <p class="card-text text-primary fw-bold">{{ product.price|int|format_number }}원</p>
                                                <p class="card-text mb-0">
                                                    <small class="text-muted">{{ product.mall }}</small>
                                                </p>
                                                {% if product.reviews > 0 %}
                                                <p class="card-text">
                                                    <small class="text-muted">
                                                        <i class="fas fa-star text-warning me-1"></i>{{ product.rating }} 
                                                        <i class="fas fa-comment text-info ms-2 me-1"></i>{{ product.reviews }}
                                                    </small>
                                                </p>
                                                {% endif %}
                                                <a href="{{ product.url }}" target="_blank" class="btn btn-sm btn-outline-primary w-100 mt-2">
                                                    <i class="fas fa-external-link-alt me-1"></i> 상품 보기
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    {% endfor %}
                                </div>
                                
                                {% if data.products|length > 12 %}
                                <div class="text-center mt-3">
                                    <button id="load-more-btn" class="btn btn-outline-secondary">
                                        <i class="fas fa-plus me-2"></i>더 보기 ({{ data.products|length - 12 }}개)
                                    </button>
                                </div>
                                {% endif %}
                                
                                {% else %}
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>상품 데이터가 없습니다.
                                </div>
                                {% endif %}
                            </div>
                            
                            <div class="tab-pane fade" id="network">
                                {% if network_graph %}
                                <div id="network-visualization" class="network-graph"></div>
                                {% else %}
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>키워드 네트워크 데이터가 없습니다.
                                </div>
                                {% endif %}
                            </div>
                            
                            <div class="tab-pane fade" id="rankings">
                                {% if ranking_history %}
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>날짜</th>
                                                <th>상품명</th>
                                                <th>브랜드</th>
                                                <th>순위</th>
                                                <th>변동</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {% for item in ranking_history %}
                                            <tr>
                                                <td>{{ item.date }}</td>
                                                <td>{{ item.product_name }}</td>
                                                <td>{{ item.brand }}</td>
                                                <td>{{ item.rank }}</td>
                                                <td>
                                                    {% if item.change > 0 %}
                                                    <span class="text-success"><i class="fas fa-arrow-up me-1"></i>{{ item.change }}</span>
                                                    {% elif item.change < 0 %}
                                                    <span class="text-danger"><i class="fas fa-arrow-down me-1"></i>{{ abs(item.change) }}</span>
                                                    {% else %}
                                                    <span class="text-muted"><i class="fas fa-minus me-1"></i>0</span>
                                                    {% endif %}
                                                </td>
                                            </tr>
                                            {% endfor %}
                                        </tbody>
                                    </table>
                                </div>
                                {% else %}
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>순위 변동 데이터가 없습니다.
                                </div>
                                {% endif %}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 추천 모달 -->
    <div class="modal fade" id="recommendationsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-lightbulb me-2"></i>"{{ keyword }}" 키워드 추천</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="recommendations-loading" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2">추천 데이터를 불러오는 중...</p>
                    </div>
                    <div id="recommendations-content" style="display: none;">
                        <h6 class="mb-3"><i class="fas fa-tools me-2"></i>키워드 개선 방안</h6>
                        <div id="improvements-list" class="mb-4"></div>
                        
                        <h6 class="mb-3"><i class="fas fa-tags me-2"></i>추천 관련 키워드</h6>
                        <div id="related-suggestions" class="mb-4"></div>
                        
                        <h6 class="mb-3"><i class="fas fa-ad me-2"></i>광고 키워드 제안</h6>
                        <div id="ad-suggestions" class="mb-4"></div>
                    </div>
                    <div id="recommendations-error" class="alert alert-danger" style="display: none;"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 롱테일 모달 -->
    <div class="modal fade" id="longtailModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-sitemap me-2"></i>"{{ keyword }}" 롱테일 키워드 발굴</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="longtail-loading" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2">롱테일 키워드를 분석하는 중...</p>
                    </div>
                    <div id="longtail-content" style="display: none;">
                        <div class="alert alert-info mb-4">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>롱테일 키워드</strong>는 검색량은 적지만 경쟁도가 낮고 구매 의도가 명확한 키워드입니다. 
                            이러한 키워드는 전환율이 높고 상위 노출이 상대적으로 쉽습니다.
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>키워드</th>
                                        <th>검색량</th>
                                        <th>경쟁도</th>
                                        <th>중요도</th>
                                        <th>기회 점수</th>
                                        <th>분석</th>
                                    </tr>
                                </thead>
                                <tbody id="longtail-keywords"></tbody>
                            </table>
                        </div>
                    </div>
                    <div id="longtail-error" class="alert alert-danger" style="display: none;"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
                </div>
            </div>
        </div>
    </div>
    
    <footer class="bg-dark text-white mt-5 py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h5>구공길 키워드 분석 시스템</h5>
                    <p>건강기능식품 판매를 위한 최적의 키워드 분석 솔루션</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <p>&copy; 2025 구공길. All rights reserved.</p>
                </div>
            </div>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // 키워드 네트워크 시각화
        {% if network_graph %}
        d3.json("{{ network_graph }}").then(function(graph) {
            const width = document.getElementById('network-visualization').clientWidth;
            const height = 500;
            
            const svg = d3.select("#network-visualization")
                .append("svg")
                .attr("width", width)
                .attr("height", height);
            
            // 시뮬레이션 설정
            const simulation = d3.forceSimulation(graph.nodes)
                .force("link", d3.forceLink(graph.links).id(d => d.id).distance(100))
                .force("charge", d3.forceManyBody().strength(-300))
                .force("center", d3.forceCenter(width / 2, height / 2));
            
            // 링크 생성
            const link = svg.append("g")
                .selectAll("line")
                .data(graph.links)
                .enter().append("line")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", d => Math.sqrt(d.value));
            
            // 노드 생성
            const node = svg.append("g")
                .selectAll("circle")
                .data(graph.nodes)
                .enter().append("circle")
                .attr("r", d => d.size || 5)
                .attr("fill", d => d.group === 1 ? "#4285F4" : "#34A853")
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));
            
            // 텍스트 라벨 생성
            const text = svg.append("g")
                .selectAll("text")
                .data(graph.nodes)
                .enter().append("text")
                .text(d => d.id)
                .attr("font-size", 12)
                .attr("dx", 15)
                .attr("dy", 4);
            
            // 시뮬레이션 틱 함수
            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);
                
                node
                    .attr("cx", d => d.x = Math.max(10, Math.min(width - 10, d.x)))
                    .attr("cy", d => d.y = Math.max(10, Math.min(height - 10, d.y)));
                
                text
                    .attr("x", d => d.x)
                    .attr("y", d => d.y);
            });
            
            // 드래그 함수들
            function dragstarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }
            
            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }
            
            function dragended(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }
        });
        {% endif %}
        
        // 키워드 추천 모달
        document.getElementById('btn-recommendations').addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('recommendationsModal'));
            modal.show();
            
            // 로딩 표시
            document.getElementById('recommendations-loading').style.display = 'block';
            document.getElementById('recommendations-content').style.display = 'none';
            document.getElementById('recommendations-error').style.display = 'none';
            
            // 데이터 요청
            fetch(`/api/recommendations/{{ keyword }}`)
                .then(response => response.json())
                .then(data => {
                    // 로딩 숨기기
                    document.getElementById('recommendations-loading').style.display = 'none';
                    document.getElementById('recommendations-content').style.display = 'block';
                    
                    // 개선 방안
                    const improvementsList = document.getElementById('improvements-list');
                    improvementsList.innerHTML = '';
                    
                    if (data.improvements && data.improvements.length > 0) {
                        const ul = document.createElement('ul');
                        ul.className = 'list-group';
                        
                        data.improvements.forEach(item => {
                            const li = document.createElement('li');
                            li.className = 'list-group-item';
                            li.innerHTML = `<strong>${item.issue}:</strong> ${item.suggestion}`;
                            ul.appendChild(li);
                        });
                        
                        improvementsList.appendChild(ul);
                    } else {
                        improvementsList.innerHTML = '<div class="alert alert-success">현재 키워드는 최적화가 잘 되어 있습니다.</div>';
                    }
                    
                    // 관련 키워드 추천
                    const relatedSuggestions = document.getElementById('related-suggestions');
                    relatedSuggestions.innerHTML = '';
                    
                    if (data.related_suggestions && data.related_suggestions.length > 0) {
                        const row = document.createElement('div');
                        row.className = 'row';
                        
                        data.related_suggestions.forEach(item => {
                            const col = document.createElement('div');
                            col.className = 'col-md-4 mb-3';
                            
                            const card = document.createElement('div');
                            card.className = 'card h-100';
                            
                            card.innerHTML = `
                                <div class="card-body">
                                    <h6 class="card-title">${item.keyword}</h6>
                                    <p class="card-text mb-1">검색량: ${item.search_volume}</p>
                                    <p class="card-text">경쟁도: ${item.competition}</p>
                                    <a href="/keyword/${item.keyword}" class="btn btn-sm btn-outline-primary w-100">분석</a>
                                </div>
                            `;
                            
                            col.appendChild(card);
                            row.appendChild(col);
                        });
                        
                        relatedSuggestions.appendChild(row);
                    } else {
                        relatedSuggestions.innerHTML = '<div class="alert alert-info">추천할 관련 키워드가 없습니다.</div>';
                    }
                    
                    // 광고 키워드 제안
                    const adSuggestions = document.getElementById('ad-suggestions');
                    adSuggestions.innerHTML = '';
                    
                    if (data.ad_suggestions && data.ad_suggestions.length > 0) {
                        const table = document.createElement('table');
                        table.className = 'table table-striped';
                        
                        const thead = document.createElement('thead');
                        thead.innerHTML = `
                            <tr>
                                <th>키워드</th>
                                <th>검색량</th>
                                <th>경쟁도</th>
                                <th>분석</th>
                            </tr>
                        `;
                        
                        const tbody = document.createElement('tbody');
                        
                        data.ad_suggestions.forEach(item => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${item.keyword}</td>
                                <td>${item.search_volume}</td>
                                <td>${item.competition}</td>
                                <td><a href="/keyword/${item.keyword}" class="btn btn-sm btn-outline-primary">분석</a></td>
                            `;
                            tbody.appendChild(tr);
                        });
                        
                        table.appendChild(thead);
                        table.appendChild(tbody);
                        adSuggestions.appendChild(table);
                    } else {
                        adSuggestions.innerHTML = '<div class="alert alert-info">추천할 광고 키워드가 없습니다.</div>';
                    }
                })
                .catch(error => {
                    document.getElementById('recommendations-loading').style.display = 'none';
                    document.getElementById('recommendations-error').style.display = 'block';
                    document.getElementById('recommendations-error').textContent = `오류가 발생했습니다: ${error.message}`;
                });
        });
        
        // 롱테일 키워드 모달
        document.getElementById('btn-longtail').addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('longtailModal'));
            modal.show();
            
            // 로딩 표시
            document.getElementById('longtail-loading').style.display = 'block';
            document.getElementById('longtail-content').style.display = 'none';
            document.getElementById('longtail-error').style.display = 'none';
            
            // 데이터 요청
            fetch('/api/longtail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    keyword: '{{ keyword }}',
                    limit: 20
                })
            })
                .then(response => response.json())
                .then(data => {
                    // 로딩 숨기기
                    document.getElementById('longtail-loading').style.display = 'none';
                    document.getElementById('longtail-content').style.display = 'block';
                    
                    // 롱테일 키워드 테이블
                    const keywordsTable = document.getElementById('longtail-keywords');
                    keywordsTable.innerHTML = '';
                    
                    if (data.longtail_keywords && data.longtail_keywords.length > 0) {
                        data.longtail_keywords.forEach(item => {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${item.keyword}</td>
                                <td>${item.search_volume}</td>
                                <td>${item.competition}</td>
                                <td>${item.importance}</td>
                                <td>${item.opportunity}</td>
                                <td><a href="/keyword/${item.keyword}" class="btn btn-sm btn-outline-primary">분석</a></td>
                            `;
                            keywordsTable.appendChild(tr);
                        });
                    } else {
                        keywordsTable.innerHTML = '<tr><td colspan="6" class="text-center">발굴된 롱테일 키워드가 없습니다.</td></tr>';
                    }
                })
                .catch(error => {
                    document.getElementById('longtail-loading').style.display = 'none';
                    document.getElementById('longtail-error').style.display = 'block';
                    document.getElementById('longtail-error').textContent = `오류가 발생했습니다: ${error.message}`;
                });
        });
    </script>
</body>
</html>
        ''')
    
    # monitor.html
    with open('templates/monitor.html', 'w', encoding='utf-8') as f:
        f.write('''
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>크롤링 모니터링 | 구공길</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        .monitor-card {
            border-radius: 15px;
            overflow: hidden;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            height: 100%;
        }
        .monitor-header {
            background-color: #4285F4;
            color: white;
            padding: 15px;
        }
        .monitor-body {
            padding: 20px;
            height: 300px;
            overflow-y: auto;
        }
        .monitor-footer {
            background-color: #f8f9fa;
            padding: 15px;
            border-top: 1px solid #dee2e6;
        }
        .crawler-status {
            font-size: 14px;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
        }
        .status-waiting {
            background-color: #f8f9fa;
            border-left: 5px solid #6c757d;
        }
        .status-running {
            background-color: #e8f4fd;
            border-left: 5px solid #4285F4;
        }
        .status-success {
            background-color: #e9f7ef;
            border-left: 5px solid #34A853;
        }
        .status-error {
            background-color: #fdedeb;
            border-left: 5px solid #EA4335;
        }
        .logs-container {
            font-family: monospace;
            background-color: #272822;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 5px;
            height: 300px;
            overflow-y: auto;
            margin-bottom: 20px;
        }
        .log-entry {
            margin-bottom: 5px;
            font-size: 13px;
        }
        .log-time {
            color: #a6e22e;
        }
        .log-info {
            color: #66d9ef;
        }
        .log-error {
            color: #f92672;
        }
        .log-warning {
            color: #fd971f;
        }
        .brand-logo {
            height: 40px;
        }
        .nav-icon {
            margin-right: 8px;
        }
        .stats-card {
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">
                <img src="/static/logo.png" alt="구공길" class="brand-logo">
                구공길 키워드 분석기
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/"><i class="fas fa-home nav-icon"></i>홈</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/stats"><i class="fas fa-chart-bar nav-icon"></i>통계</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="/monitor"><i class="fas fa-tv nav-icon"></i>모니터링</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="/">홈</a></li>
                <li class="breadcrumb-item active">크롤링 모니터링</li>
            </ol>
        </nav>
        
        <h1 class="mb-4"><i class="fas fa-tv me-2"></i>실시간 크롤링 모니터링</h1>
        
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <h5 class="card-title">총 크롤링 횟수</h5>
                        <h1 id="total-crawls" class="display-4 mb-0">0</h1>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <h5 class="card-title">성공률</h5>
                        <h1 id="success-rate" class="display-4 mb-0">0%</h1>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <h5 class="card-title">현재 진행 중</h5>
                        <h1 id="active-crawls" class="display-4 mb-0">0</h1>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="monitor-card">
                    <div class="monitor-header">
                        <h5 class="mb-0"><i class="fas fa-spider me-2"></i>크롤러 상태</h5>
                    </div>
                    <div class="monitor-body" id="crawler-status-container">
                        <div class="crawler-status status-waiting">
                            <i class="fas fa-info-circle me-2"></i>
                            <span>크롤링을 시작하려면 아래에 키워드를 입력하세요.</span>
                        </div>
                    </div>
                    <div class="monitor-footer">
                        <div class="input-group">
                            <input type="text" id="keyword-input" class="form-control" placeholder="모니터링할 키워드 입력...">
                            <button class="btn btn-primary" id="start-monitor-btn">
                                <i class="fas fa-play me-1"></i> 모니터링 시작
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="monitor-card">
                    <div class="monitor-header">
                        <h5 class="mb-0"><i class="fas fa-chart-bar me-2"></i>수집 데이터 현황</h5>
                    </div>
                    <div class="monitor-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h6 class="card-title">상품 개수</h6>
                                        <h3 id="products-count" class="mb-0">0</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h6 class="card-title">관련 키워드</h6>
                                        <h3 id="keywords-count" class="mb-0">0</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="progress mb-3 mt-3">
                            <div id="crawl-progress" class="progress-bar" role="progressbar" style="width: 0%"></div>
                        </div>
                        
                        <div class="mt-4">
                            <h6><i class="fas fa-stopwatch me-2"></i>데이터 수집 진행상황</h6>
                            <ul class="list-group" id="task-status-list">
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    네이버 쇼핑 데이터
                                    <span class="badge bg-secondary rounded-pill" id="status-shopping">대기 중</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    검색 트렌드 데이터
                                    <span class="badge bg-secondary rounded-pill" id="status-trend">대기 중</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    광고 키워드 데이터
                                    <span class="badge bg-secondary rounded-pill" id="status-ad">대기 중</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <div class="monitor-card">
                    <div class="monitor-header">
                        <h5 class="mb-0"><i class="fas fa-terminal me-2"></i>크롤링 로그</h5>
                    </div>
                    <div class="logs-container" id="logs-container">
                        <div class="log-entry">
                            <span class="log-time">[00:00:00]</span>
                            <span class="log-info">시스템이 초기화되었습니다. 로그가 여기에 표시됩니다.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <footer class="bg-dark text-white mt-5 py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h5>구공길 키워드 분석 시스템</h5>
                    <p>건강기능식품 판매를 위한 최적의 키워드 분석 솔루션</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <p>&copy; 2025 구공길. All rights reserved.</p>
                </div>
            </div>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/socket.io@4.4.1/client/socket.io.min.js"></script>
    <script>
        // 소켓 연결
        const socket = io();
        let activeCrawl = false;
        
        // 통계 데이터
        let stats = {
            totalCrawls: 0,
            successCrawls: 0,
            activeCrawls: 0
        };
        
        // 소켓 이벤트 리스너
        socket.on('connect', () => {
            addLog('info', '모니터링 서버에 연결되었습니다.');
            updateStats();
        });
        
        socket.on('disconnect', () => {
            addLog('error', '모니터링 서버와의 연결이 끊어졌습니다.');
        });
        
        // 크롤링 상태 업데이트 이벤트
        socket.on('crawl_status', (data) => {
            console.log('크롤링 상태 업데이트:', data);
            
            if (!activeCrawl) {
                activeCrawl = true;
                stats.activeCrawls++;
                updateStats();
            }
            
            // 진행률 업데이트
            document.getElementById('crawl-progress').style.width = `${data.progress}%`;
            
            // 상태 업데이트
            updateCrawlerStatus(data);
            
            // 데이터 카운트 업데이트
            document.getElementById('products-count').textContent = data.products_count;
            document.getElementById('keywords-count').textContent = data.related_keywords_count;
            
            // 작업 상태 업데이트
            if (data.stage === '쇼핑 데이터 수집') {
                document.getElementById('status-shopping').textContent = '진행 중';
                document.getElementById('status-shopping').className = 'badge bg-primary rounded-pill';
            } else if (data.stage === '검색 트렌드 수집') {
                document.getElementById('status-shopping').textContent = '완료';
                document.getElementById('status-shopping').className = 'badge bg-success rounded-pill';
                document.getElementById('status-trend').textContent = '진행 중';
                document.getElementById('status-trend').className = 'badge bg-primary rounded-pill';
            } else if (data.stage === '광고 키워드 수집') {
                document.getElementById('status-trend').textContent = '완료';
                document.getElementById('status-trend').className = 'badge bg-success rounded-pill';
                document.getElementById('status-ad').textContent = '진행 중';
                document.getElementById('status-ad').className = 'badge bg-primary rounded-pill';
            } else if (data.stage === '분석 완료') {
                document.getElementById('status-ad').textContent = '완료';
                document.getElementById('status-ad').className = 'badge bg-success rounded-pill';
                
                // 완료 처리
                activeCrawl = false;
                stats.totalCrawls++;
                stats.successCrawls++;
                updateStats();
                
                addLog('success', `"${data.keyword}" 키워드 분석이 완료되었습니다. (${data.products_count}개 상품, ${data.related_keywords_count}개 관련 키워드)`);
            } else if (data.stage === '오류') {
                // 오류 처리
                document.getElementById('status-shopping').textContent = '오류';
                document.getElementById('status-shopping').className = 'badge bg-danger rounded-pill';
                document.getElementById('status-trend').textContent = '오류';
                document.getElementById('status-trend').className = 'badge bg-danger rounded-pill';
                document.getElementById('status-ad').textContent = '오류';
                document.getElementById('status-ad').className = 'badge bg-danger rounded-pill';
                
                activeCrawl = false;
                stats.totalCrawls++;
                updateStats();
                
                addLog('error', `"${data.keyword}" 키워드 분석 중 오류 발생: ${data.error || data.details}`);
            }
            
            // 로그 추가
            addLog('info', data.details || data.stage);
        });
        
        // 모니터링 시작 버튼 이벤트
        document.getElementById('start-monitor-btn').addEventListener('click', () => {
            if (activeCrawl) {
                alert('이미 진행 중인 크롤링이 있습니다. 완료 후 다시 시도해주세요.');
                return;
            }
            
            const keyword = document.getElementById('keyword-input').value.trim();
            if (!keyword) {
                alert('모니터링할 키워드를 입력해주세요.');
                return;
            }
            
            // 상태 초기화
            resetStatus();
            
            // 모니터링 시작
            socket.emit('start_monitor', { keyword: keyword });
            
            // 로그 추가
            addLog('info', `"${keyword}" 키워드 모니터링을 시작합니다.`);
        });
        
        // 크롤러 상태 업데이트
        function updateCrawlerStatus(data) {
            const container = document.getElementById('crawler-status-container');
            
            // 이전 상태 제거
            const oldStatus = container.querySelector('.crawler-status');
            if (oldStatus) {
                container.removeChild(oldStatus);
            }
            
            // 새 상태 추가
            const statusDiv = document.createElement('div');
            
            if (data.stage === '준비 중') {
                statusDiv.className = 'crawler-status status-waiting';
                statusDiv.innerHTML = `<i class="fas fa-info-circle me-2"></i><span>${data.details || '크롤링 준비 중...'}</span>`;
            } else if (data.stage === '분석 완료') {
                statusDiv.className = 'crawler-status status-success';
                statusDiv.innerHTML = `<i class="fas fa-check-circle me-2"></i><span>${data.details || '크롤링 완료'}</span>`;
            } else if (data.stage === '오류') {
                statusDiv.className = 'crawler-status status-error';
                statusDiv.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i><span>${data.details || '크롤링 오류 발생'}</span>`;
            } else {
                statusDiv.className = 'crawler-status status-running';
                statusDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fas fa-sync fa-spin me-2"></i>
                            <span>${data.stage}</span>
                        </div>
                        <div>
                            ${data.progress}%
                        </div>
                    </div>
                    <div class="mt-2 small text-muted">${data.details || ''}</div>
                `;
            }
            
            container.appendChild(statusDiv);
            container.scrollTop = container.scrollHeight;
        }
        
        // 로그 추가
        function addLog(type, message) {
            const logsContainer = document.getElementById('logs-container');
            
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            let html = `<span class="log-time">[${timeStr}]</span> `;
            
            if (type === 'info') {
                html += `<span class="log-info">${message}</span>`;
            } else if (type === 'error') {
                html += `<span class="log-error">${message}</span>`;
            } else if (type === 'warning') {
                html += `<span class="log-warning">${message}</span>`;
            } else if (type === 'success') {
                html += `<span style="color: #a6e22e">${message}</span>`;
            } else {
                html += message;
            }
            
            logEntry.innerHTML = html;
            logsContainer.appendChild(logEntry);
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
        
        // 통계 업데이트
        function updateStats() {
            document.getElementById('total-crawls').textContent = stats.totalCrawls;
            
            let successRate = 0;
            if (stats.totalCrawls > 0) {
                successRate = Math.round((stats.successCrawls / stats.totalCrawls) * 100);
            }
            document.getElementById('success-rate').textContent = `${successRate}%`;
            
            document.getElementById('active-crawls').textContent = stats.activeCrawls;
        }
        
        // 상태 초기화
        function resetStatus() {
            document.getElementById('crawl-progress').style.width = '0%';
            document.getElementById('products-count').textContent = '0';
            document.getElementById('keywords-count').textContent = '0';
            
            document.getElementById('status-shopping').textContent = '대기 중';
            document.getElementById('status-shopping').className = 'badge bg-secondary rounded-pill';
            document.getElementById('status-trend').textContent = '대기 중';
            document.getElementById('status-trend').className = 'badge bg-secondary rounded-pill';
            document.getElementById('status-ad').textContent = '대기 중';
            document.getElementById('status-ad').className = 'badge bg-secondary rounded-pill';
        }
    </script>
</body>
</html>
        ''')
    
    # stats.html
    with open('templates/stats.html', 'w', encoding='utf-8') as f:
        f.write('''
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>통계 대시보드 | 구공길</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .stats-card {
            border-radius: 15px;
            overflow: hidden;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .stats-header {
            background-color: #4285F4;
            color: white;
            padding: 15px;
        }
        .stats-body {
            padding: 20px;
        }
        .chart-container {
            height: 300px;
            margin-bottom: 20px;
        }
        .activity-item {
            padding: 10px 15px;
            border-bottom: 1px solid #f1f1f1;
        }
        .activity-item:last-child {
            border-bottom: none;
        }
        .activity-time {
            font-size: 12px;
            color: #6c757d;
        }
        .brand-logo {
            height: 40px;
        }
        .nav-icon {
            margin-right: 8px;
        }
    </style>
</head>
<body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">
                <img src="/static/logo.png" alt="구공길" class="brand-logo">
                구공길 키워드 분석기
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/"><i class="fas fa-home nav-icon"></i>홈</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="/stats"><i class="fas fa-chart-bar nav-icon"></i>통계</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/monitor"><i class="fas fa-tv nav-icon"></i>모니터링</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="/">홈</a></li>
                <li class="breadcrumb-item active">통계 대시보드</li>
            </ol>
        </nav>
        
        <h1 class="mb-4"><i class="fas fa-chart-bar me-2"></i>통계 대시보드</h1>
        
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <i class="fas fa-key text-primary mb-3" style="font-size: 2rem;"></i>
                        <h5 class="card-title">수집된 키워드</h5>
                        <h2 class="mb-0">{{ stats.keyword_count }}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <i class="fas fa-shopping-cart text-success mb-3" style="font-size: 2rem;"></i>
                        <h5 class="card-title">수집된 상품</h5>
                        <h2 class="mb-0">{{ stats.product_count }}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <i class="fas fa-chart-line text-warning mb-3" style="font-size: 2rem;"></i>
                        <h5 class="card-title">검색량 데이터</h5>
                        <h2 class="mb-0">{{ stats.search_volume_points }}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card stats-card">
                    <div class="card-body text-center">
                        <i class="fas fa-project-diagram text-danger mb-3" style="font-size: 2rem;"></i>
                        <h5 class="card-title">키워드 관계</h5>
                        <h2 class="mb-0">{{ stats.relationships_count }}</h2>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="stats-card">
                    <div class="stats-header">
                        <h5 class="mb-0"><i class="fas fa-chart-pie me-2"></i>인기 카테고리</h5>
                    </div>
                    <div class="stats-body">
                        <div class="chart-container">
                            <canvas id="categoryChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="stats-card">
                    <div class="stats-header">
                        <h5 class="mb-0"><i class="fas fa-history me-2"></i>최근 활동</h5>
                    </div>
                    <div class="stats-body">
                        <div style="height: 300px; overflow-y: auto;">
                            {% for activity in stats.recent_activity %}
                            <div class="activity-item">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <strong>{{ activity.keyword }}</strong>
                                    <span class="activity-time">{{ activity.timestamp }}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <span class="badge {% if activity.source == 'api' %}bg-primary{% else %}bg-success{% endif %} me-2">{{ activity.source }}</span>
                                        <span class="badge {% if activity.status == 'success' %}bg-success{% else %}bg-danger{% endif %}">{{ activity.status }}</span>
                                    </div>
                                    <a href="/keyword/{{ activity.keyword }}" class="btn btn-sm btn-outline-primary">상세</a>
                                </div>
                            </div>
                            {% endfor %}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="stats-card">
                    <div class="stats-header">
                        <h5 class="mb-0"><i class="fas fa-search me-2"></i>지난 10일 키워드 분석 현황</h5>
                    </div>
                    <div class="stats-body">
                        <div class="chart-container">
                            <canvas id="activityChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <footer class="bg-dark text-white mt-5 py-4">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h5>구공길 키워드 분석 시스템</h5>
                    <p>건강기능식품 판매를 위한 최적의 키워드 분석 솔루션</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <p>&copy; 2025 구공길. All rights reserved.</p>
                </div>
            </div>
        </div>
    </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // 카테고리 차트
        const categoryChart = new Chart(
            document.getElementById('categoryChart').getContext('2d'),
            {
                type: 'doughnut',
                data: {
                    labels: [{% for cat in stats.top_categories %}'{{ cat.category }}',{% endfor %}],
                    datasets: [{
                        label: '키워드 수',
                        data: [{% for cat in stats.top_categories %}{{ cat.count }},{% endfor %}],
                        backgroundColor: [
                            '#4285F4',
                            '#34A853',
                            '#FBBC05',
                            '#EA4335',
                            '#5F6368'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        }
                    }
                }
            }
        );
        
        // 활동 차트 (더미 데이터)
        const activityChart = new Chart(
            document.getElementById('activityChart').getContext('2d'),
            {
                type: 'bar',
                data: {
                    labels: ['3/14', '3/15', '3/16', '3/17', '3/18', '3/19', '3/20', '3/21', '3/22', '3/23'],
                    datasets: [
                        {
                            label: 'API 호출',
                            data: [12, 19, 15, 8, 14, 17, 13, 18, 10, 15],
                            backgroundColor: '#4285F4',
                        },
                        {
                            label: '웹 크롤링',
                            data: [5, 8, 6, 9, 7, 6, 8, 10, 7, 9],
                            backgroundColor: '#34A853',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true,
                        },
                        y: {
                            stacked: true
                        }
                    }
                }
            }
        );
    </script>
</body>
</html>
        ''')
    
    # 로고 이미지 생성 (간단한 예시)
    os.makedirs('static', exist_ok=True)
    with open('static/logo.png', 'wb') as f:
        f.write(b'')  # 비어있는 파일 (실제 로고는 필요시 추가)

# 메인 함수 - 시스템 시작
def main():
    """메인 함수"""
    # 명령행 인자 파싱
    import argparse
    parser = argparse.ArgumentParser(description='구공길 키워드 분석 시스템')
    parser.add_argument('--port', type=int, default=CONFIG["PORT"], help='웹 서버 포트')
    parser.add_argument('--db', type=str, default=CONFIG["DB_PATH"], help='데이터베이스 경로')
    parser.add_argument('--headless', action='store_true', help='헤드리스 모드로 크롤러 실행')
    args = parser.parse_args()
    
    # 설정 업데이트
    CONFIG["PORT"] = args.port
    CONFIG["DB_PATH"] = args.db
    
    # 템플릿 파일 생성
    create_template_files()
    
    # 데이터베이스 초기화
    db = DatabaseManager(CONFIG["DB_PATH"])
    
    # 웹 애플리케이션 실행
    app = WebApplication(port=args.port)
    app.run()

if __name__ == "__main__":
    main()
                        