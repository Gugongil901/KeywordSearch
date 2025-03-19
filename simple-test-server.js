// 간단한 Express 서버 (ES 모듈 형식)
import express from 'express';
const app = express();
const port = process.env.PORT || 3000; // 다른 포트 사용

// 기본 라우트
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>키워드 스카우터 - 간단 테스트</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #3b82f6; }
        .status { background: #dbeafe; padding: 10px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>키워드 스카우터 기본 테스트 페이지</h1>
        <div class="status">서버 상태: 정상 작동 중</div>
        <p>현재 시간: ${new Date().toLocaleString()}</p>
        <p>이 페이지가 표시되면 서버가 제대로 작동 중입니다.</p>
        <p>실행 포트: ${port}</p>
        
        <div style="margin-top: 20px; padding: 10px; background: #fee2e2; border-radius: 4px;">
          <h3>환경 정보</h3>
          <p>Node 버전: ${process.version}</p>
          <p>환경: ${process.env.NODE_ENV || 'development'}</p>
          <p>Replit ID: ${process.env.REPL_ID || '없음'}</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API 테스트 경로
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    env: {
      port: port,
      node_env: process.env.NODE_ENV || 'development',
      replit_id: process.env.REPL_ID || 'undefined'
    }
  });
});

// Express 서버 시작
app.listen(port, '0.0.0.0', () => {
  console.log(`테스트 서버가 포트 ${port}에서 실행 중입니다`);
  console.log(`접속 URL: http://0.0.0.0:${port}`);
});