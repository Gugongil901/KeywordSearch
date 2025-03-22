// =========================================================================
// app.js - 건강기능식품 키워드 분석 시스템 통합 모듈
// =========================================================================
// 설명: 모든 모듈을 통합하고 API 엔드포인트를 제공하는 애플리케이션 코어

// 핵심 모듈 불러오기
const express = require('express');
const cors = require('cors');
const { config, logger, utils } = require('./core');
const collector = require('./collector');
const analyzer = require('./analyzer');
const storage = require('./storage');
const cron = require('node-cron');

// Express 앱 초기화
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// 상태 확인 엔드포인트
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// 키워드 분석 엔드포인트
app.post('/api/analyze', async (req, res) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '키워드를 입력해주세요.'
      });
    }
    
    // 키워드 분석 실행
    const result = await analyzer.analyzeKeyword(keyword);
    
    // 분석 결과 저장
    await storage.saveAnalysis(result);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`분석 API 오류: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: '키워드 분석 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 키워드 추천 엔드포인트
app.post('/api/recommend', async (req, res) => {
  try {
    const { keyword, limit = 10 } = req.body;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '키워드를 입력해주세요.'
      });
    }
    
    // 키워드 추천 생성
    const recommendations = await analyzer.generateKeywordRecommendations(keyword, limit);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error(`추천 API 오류: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: '키워드 추천 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 키워드 랭킹 엔드포인트
app.post('/api/ranking', async (req, res) => {
  try {
    const { keywords } = req.body;
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        message: '키워드 배열을 입력해주세요.'
      });
    }
    
    // 키워드 랭킹 분석
    const ranking = await analyzer.analyzeKeywordRanking(keywords);
    
    res.json({
      success: true,
      data: ranking
    });
  } catch (error) {
    logger.error(`랭킹 API 오류: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: '키워드 랭킹 분석 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 과거 분석 결과 조회 엔드포인트
app.get('/api/history/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    
    // 저장된 분석 결과 조회
    const history = await storage.getAnalysisHistory(keyword);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error(`히스토리 API 오류: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: '분석 히스토리 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 카테고리별 키워드 트렌드 엔드포인트
app.get('/api/trends/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { period = 6 } = req.query; // 기본 6개월
    
    // 카테고리별 트렌드 조회
    const trends = await storage.getCategoryTrends(category, parseInt(period));
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error(`트렌드 API 오류: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: '카테고리 트렌드 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 키워드 일괄 분석 엔드포인트 (백그라운드 작업)
app.post('/api/batch-analyze', async (req, res) => {
  try {
    const { keywords, notifyUrl } = req.body;
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        message: '키워드 배열을 입력해주세요.'
      });
    }
    
    // 백그라운드 작업 시작
    const jobId = `batch-${Date.now()}`;
    
    // 작업 즉시 응답
    res.json({
      success: true,
      message: '일괄 분석 작업이 시작되었습니다.',
      jobId,
      totalKeywords: keywords.length
    });
    
    // 백그라운드에서 처리
    process.nextTick(async () => {
      try {
        logger.info(`일괄 분석 작업 시작: ${jobId} (${keywords.length}개 키워드)`);
        
        // 배치 처리 (10개씩)
        const batchSize = 10;
        let processed = 0;
        let results = [];
        
        for (let i = 0; i < keywords.length; i += batchSize) {
          const batch = keywords.slice(i, i + batchSize);
          const batchResults = await analyzer.analyzeKeywordRanking(batch);
          
          results = results.concat(batchResults);
          processed += batch.length;
          
          logger.info(`일괄 작업 진행 중: ${processed}/${keywords.length} 완료`);
          
          // 결과 저장
          for (const result of batchResults) {
            await storage.saveAnalysis(result);
          }
        }
        
        logger.info(`일괄 분석 작업 완료: ${jobId}`);
        
        // 콜백 URL이 제공된 경우 결과 전송
        if (notifyUrl) {
          try {
            await axios.post(notifyUrl, {
              jobId,
              status: 'completed',
              totalProcessed: processed,
              results: results.map(r => ({
                keyword: r.keyword,
                compositeScore: r.analysis.scores.composite
              }))
            });
          } catch (callbackError) {
            logger.error(`콜백 전송 실패: ${callbackError.message}`);
          }
        }
      } catch (error) {
        logger.error(`일괄 작업 오류: ${error.message}`);
        
        // 콜백 URL이 제공된 경우 오류 전송
        if (notifyUrl) {
          try {
            await axios.post(notifyUrl, {
              jobId,
              status: 'error',
              error: error.message
            });
          } catch (callbackError) {
            logger.error(`콜백 전송 실패: ${callbackError.message}`);
          }
        }
      }
    });
  } catch (error) {
    logger.error(`일괄 분석 API 오류: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: '일괄 분석 작업 시작 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 쿠팡 통합 (향후 확장)
app.post('/api/coupang/keywords', (req, res) => {
  res.json({
    success: true,
    message: '쿠팡 키워드 API는 아직 구현 중입니다.',
    availableDate: '2023년 4분기'
  });
});

// 정기적인 인기 키워드 분석 작업 (매일 02:00 실행)
cron.schedule('0 2 * * *', async () => {
  try {
    logger.info('일일 인기 키워드 분석 작업 시작');
    
    // 저장소에서, 최근 일주일간 인기 키워드 조회
    const popularKeywords = await storage.getPopularKeywords(7, 20);
    
    if (popularKeywords.length > 0) {
      // 인기 키워드 분석
      const results = await analyzer.analyzeKeywordRanking(popularKeywords);
      
      // 결과 저장
      for (const result of results) {
        await storage.saveAnalysis(result);
      }
      
      logger.info(`일일 분석 완료: ${results.length}개 키워드`);
    } else {
      logger.info('분석할 인기 키워드가 없습니다.');
    }
  } catch (error) {
    logger.error(`일일 분석 작업 오류: ${error.message}`);
  }
});

// 서버 시작
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  
  // 초기화
  storage.initialize().then(() => {
    logger.info('스토리지 초기화 완료');
  }).catch(error => {
    logger.error(`스토리지 초기화 오류: ${error.message}`);
  });
});

// 종료 처리
process.on('SIGINT', async () => {
  logger.info('애플리케이션 종료 중...');
  
  try {
    await collector.closeBrowser();
    await storage.close();
    logger.info('모든 리소스가 정상적으로 종료되었습니다.');
    process.exit(0);
  } catch (error) {
    logger.error(`종료 중 오류 발생: ${error.message}`);
    process.exit(1);
  }
});

// 모듈 내보내기
module.exports = app;
