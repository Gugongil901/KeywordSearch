import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import KeywordDetail from "@/pages/keyword-detail";
import KeywordSearch from "@/pages/keyword-search";
import TrackRanking from "@/pages/track-ranking";
import KeywordInsights from "@/pages/keyword-insights";
import CompetitorMonitoring from "@/pages/competitor-monitoring-new";
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
