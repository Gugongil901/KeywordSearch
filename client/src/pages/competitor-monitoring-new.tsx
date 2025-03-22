/**
 * 경쟁사 모니터링 대시보드 페이지
 * 키워드와 경쟁사들의 상품 변화를 모니터링하는 페이지
 */
import React from 'react';
import CompetitorMonitoringContent from '../components/competitor-monitoring-content';

export default function CompetitorMonitoring() {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="container mx-auto px-4 py-3">
        <h2 className="text-xl font-semibold mb-3">경쟁사 모니터링</h2>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
          <CompetitorMonitoringContent />
        </div>
      </div>
    </div>
  );
}