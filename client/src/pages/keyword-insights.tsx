/**
 * 키워드 인사이트 페이지
 * 키워드 대시보드를 보여주는 페이지
 */
import React from 'react';
import KeywordDashboard from '@/components/dashboard/KeywordDashboard';

export default function KeywordInsightsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <KeywordDashboard />
    </div>
  );
}