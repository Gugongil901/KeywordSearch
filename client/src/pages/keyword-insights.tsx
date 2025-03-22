/**
 * 키워드 인사이트 페이지
 * 키워드 대시보드를 보여주는 페이지
 */
import React from 'react';
import KeywordDashboard from '@/components/dashboard/KeywordDashboard';

export default function KeywordInsightsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">키워드 인사이트</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <KeywordDashboard />
        </div>
      </div>
    </div>
  );
}