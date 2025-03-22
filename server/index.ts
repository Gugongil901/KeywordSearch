import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as fs from "fs";
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS 설정 - cors 미들웨어 사용
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  maxAge: 3600,
  credentials: true
}));

// Replit 환경에서 서비스가 깨어나도록 하는 미들웨어
app.use((req, res, next) => {
  // 모든 요청에 대해 CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // API 요청에 대해 UTF-8 인코딩 설정
  if (req.path.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  
  // Replit 서비스를 깨우기 위한 헤더 설정
  res.setHeader('X-Replit-Keep-Alive', 'true');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // 모든 환경에서 Vite 설정을 사용하도록 수정
  // (Replit 환경에서는 NODE_ENV가 설정되지 않을 수 있음)
  // 운영 빌드가 있는 경우에만 정적 파일 서빙, 그렇지 않으면 Vite 개발 서버 사용
  try {
    const hasDistBuild = fs.existsSync('./dist/public/index.html');
    if (process.env.NODE_ENV === 'production' && hasDistBuild) {
      console.log('프로덕션 모드: 정적 파일 서빙');
      serveStatic(app);
    } else {
      console.log('개발 모드: Vite 개발 서버 사용');
      await setupVite(app, server);
    }
  } catch (error) {
    console.error('Vite 설정 오류:', error);
    // 오류 발생 시 Vite 설정 시도
    await setupVite(app, server);
  }

  // Replit 환경에서 포트 설정 로직 개선
  // .replit 파일에 따르면 서버가 5000 포트에서 실행되어야 함
  // 포트 매핑: 5000 -> 80, 3000 -> 3000
  // 워크플로우에서 waitForPort = 5000으로 설정되어 있어 5000으로 사용
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  
  // 디버그 로그 추가
  console.log(`Replit ID: ${process.env.REPL_ID || 'undefined'}`);
  console.log(`Replit SLUG: ${process.env.REPL_SLUG || 'undefined'}`);
  console.log(`환경 변수 PORT: ${process.env.PORT || 'undefined'}`);
  console.log(`사용할 포트: ${port} (Replit 환경: ${process.env.REPL_ID ? '예' : '아니오'})`);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`서버가 시작되었습니다: http://localhost:${port}`);
    log(`외부 접속 URL: https://${process.env.REPLIT_DOMAINS || `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`}`);
    // 접속 테스트용 로그 추가
    log(`======================================`);
    log(`Replit 환경 확인: ${process.env.REPL_ID ? 'Replit에서 실행 중' : '로컬에서 실행 중'}`);
    log(`웹 브라우저에서 접속하려면: https://${process.env.REPLIT_DOMAINS || `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`}`);
    log(`API 테스트: https://${process.env.REPLIT_DOMAINS || `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`}/api/system/status`);
    log(`======================================`);
  });
})();
