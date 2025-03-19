import { createRoot } from "react-dom/client";
import React from "react";
import "./index.css";

// 최소한의 반응형 앱으로 테스트 (업데이트됨)
const MinimalApp = () => (
  <div className="p-4 m-4 bg-red-500 text-white rounded-md">
    <h1 className="text-2xl font-bold">테스트 앱 (업데이트됨)</h1>
    <p>이 메시지가 보이면 React가 정상적으로 작동합니다.</p>
    <p>현재 시간: {new Date().toLocaleTimeString()}</p>
  </div>
);

console.log("React 앱 초기화 중...");

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
  console.error("루트 요소를 찾을 수 없음!");
}
