import express from 'express';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10); // 환경 변수에서 포트 가져오기

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>테스트 서버</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 80%;
        }
        h1 {
          color: #3b82f6;
        }
        .status {
          margin: 1rem 0;
          padding: 0.5rem;
          background: #dbeafe;
          border-radius: 4px;
        }
        .time {
          font-family: monospace;
          font-size: 1.2rem;
          margin: 1rem 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>테스트 서버 작동 중</h1>
        <div class="status">서버 상태: 정상</div>
        <p class="time">현재 시간: ${new Date().toLocaleString()}</p>
        <p>이 페이지가 보인다면 Express 서버가 제대로 작동 중입니다.</p>
      </div>
    </body>
    </html>
  `);
});

app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API 테스트 성공',
    time: new Date().toISOString()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`테스트 서버가 http://0.0.0.0:${port} 에서 실행 중입니다`);
});