import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { getPaletteFromLocalStorage, getFullPaletteById, applyPaletteToDocument } from "@/components/theme/ColorPaletteSelector";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import KeywordDetail from "@/pages/keyword-detail";
import KeywordSearch from "@/pages/keyword-search";
import TrackRanking from "@/pages/track-ranking";
import KeywordInsights from "@/pages/keyword-insights";
import CompetitorMonitoring from "@/pages/competitor-monitoring-new";
import TrendAnalysis from "@/pages/trend-analysis";
import AdvancedAnalysis from "@/pages/advanced-analysis";
import HealthSupplement from "@/pages/health-supplement";
import ThemeSettings from "@/pages/theme-settings";
import TestComponent from "@/components/test/TestComponent";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/keyword/:keyword" component={KeywordDetail} />
      <Route path="/keyword" component={KeywordSearch} />
      <Route path="/insights" component={KeywordInsights} />
      <Route path="/tracking" component={TrackRanking} />
      <Route path="/monitoring" component={CompetitorMonitoring} />
      <Route path="/trends" component={TrendAnalysis} />
      <Route path="/advanced-analysis" component={AdvancedAnalysis} />
      <Route path="/health-supplement" component={HealthSupplement} />
      <Route path="/theme-settings" component={ThemeSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // 앱 로드 시 저장된 테마 적용
  useEffect(() => {
    // localStorage에서 커스텀 테마 데이터 삭제
    localStorage.removeItem('app-theme');
    
    // 기본 컬러 팔레트 적용
    const savedPaletteId = getPaletteFromLocalStorage();
    const fullPalette = getFullPaletteById(savedPaletteId);
    applyPaletteToDocument(fullPalette);
    console.log('앱 시작 시 테마 적용:', fullPalette.name);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <div className="max-w-5xl mx-auto w-full">
            <Router />
          </div>
        </main>
        <Footer />
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary/90 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
