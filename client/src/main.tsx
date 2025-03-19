import { createRoot } from "react-dom/client";
import React, { useEffect, useState } from "react";
import "./index.css";
import App from "./App";

// 최소한의 반응형 앱으로 테스트 (디버깅 모드)
const MinimalApp = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [showDebug, setShowDebug] = useState(true);
  
  useEffect(() => {
    // 1초마다 시간 업데이트
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    // 5초 후에 디버그 정보 숨기기
    const hideTimer = setTimeout(() => {
      setShowDebug(false);
    }, 5000);
    
    // 클린업 함수
    return () => {
      clearInterval(timer);
      clearTimeout(hideTimer);
    };
  }, []);
  
  if (!showDebug) {
    return <App />;
  }
  
  return (
    <div className="p-6 m-6 bg-red-500 text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4">키워드 스카우터 (디버깅 모드)</h1>
      <div className="bg-red-600 p-4 rounded-md mb-4">
        <p className="text-xl">React가 정상적으로 작동합니다.</p>
        <p className="text-lg font-mono">현재 시간: {currentTime}</p>
        <p className="mt-2 text-sm">5초 후 자동으로 메인 앱으로 전환됩니다...</p>
      </div>
      <div className="bg-blue-500 p-4 rounded-md mt-4">
        <h2 className="text-xl font-bold mb-2">시스템 정보</h2>
        <p>서버: Express + Vite</p>
        <p>클라이언트: React + TypeScript</p>
        <p>로드 시간: {new Date().toString()}</p>
      </div>
    </div>
  );
};

console.log("React 앱 초기화 중... (디버깅 모드)");

// Root 요소 찾기 및 렌더링
const rootElement = document.getElementById("root");
if (rootElement) {
  console.log("루트 요소 찾음, 렌더링 시작");
  createRoot(rootElement).render(
    <React.StrictMode>
      <MinimalApp />
    </React.StrictMode>
  );
} else {
  console.error("루트 요소를 찾을 수 없음! DOM이 로드되었는지 확인하세요.");
}
