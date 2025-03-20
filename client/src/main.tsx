import { createRoot } from "react-dom/client";
import React, { useEffect, useState } from "react";
import "./index.css";
import App from "./App";

// 최소한의 반응형 앱으로 테스트 (디버깅 모드)
const MinimalApp = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [showDebug, setShowDebug] = useState(true);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiResponse, setApiResponse] = useState<any>(null);
  
  useEffect(() => {
    // 1초마다 시간 업데이트
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    
    // 서버 상태 확인
    const checkServer = async () => {
      try {
        console.log('서버 상태 확인 중...');
        const response = await fetch(`${window.location.origin}/api/system/status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('서버 응답:', data);
          setApiResponse(data);
          setServerStatus('online');
        } else {
          console.error('서버 응답 오류:', response.status);
          setServerStatus('offline');
        }
      } catch (error) {
        console.error('서버 연결 오류:', error);
        setServerStatus('offline');
      }
    };
    
    checkServer();
    
    // 7초 후에 디버그 정보 숨기기 (연결 확인 위해 시간 증가)
    const hideTimer = setTimeout(() => {
      setShowDebug(false);
    }, 7000);
    
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
    <div className="p-6 m-6 bg-gray-800 text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4">키워드 스카우터 (디버깅 모드)</h1>
      
      <div className={`p-4 rounded-md mb-4 ${serverStatus === 'online' ? 'bg-green-600' : serverStatus === 'offline' ? 'bg-red-600' : 'bg-yellow-600'}`}>
        <p className="text-xl">React가 정상적으로 작동합니다.</p>
        <p className="text-lg font-mono">현재 시간: {currentTime}</p>
        <p className="mt-2">
          서버 상태: 
          <span className={`ml-2 font-bold ${
            serverStatus === 'online' ? 'text-green-300' : 
            serverStatus === 'offline' ? 'text-red-300' : 
            'text-yellow-300'
          }`}>
            {serverStatus === 'online' ? '온라인' : 
             serverStatus === 'offline' ? '오프라인' : 
             '확인 중...'}
          </span>
        </p>
        <p className="mt-2 text-sm">7초 후 자동으로 메인 앱으로 전환됩니다...</p>
      </div>
      
      <div className="bg-blue-700 p-4 rounded-md mt-4">
        <h2 className="text-xl font-bold mb-2">시스템 정보</h2>
        <p>서버: Express + Vite</p>
        <p>클라이언트: React + TypeScript</p>
        <p>로드 시간: {new Date().toString()}</p>
        {apiResponse && (
          <div className="mt-3 p-3 bg-blue-900 rounded-md">
            <h3 className="font-bold">API 응답:</h3>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
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
