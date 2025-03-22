/**
 * 키워드 인사이트 페이지
 * 키워드 대시보드를 보여주는 페이지
 */
import React from 'react';
import KeywordDashboard from '@/components/dashboard/KeywordDashboard';

export default function KeywordInsightsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="container mx-auto px-4 py-3">
        <h2 className="text-xl font-semibold mb-3">키워드 인사이트</h2>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
          <KeywordDashboard />
        </div>
      </div>
    </div>
  );
}