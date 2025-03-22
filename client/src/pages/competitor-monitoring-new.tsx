/**
 * 경쟁사 모니터링 대시보드 페이지
 * 키워드와 경쟁사들의 상품 변화를 모니터링하는 페이지
 */
import React from 'react';
import { competitor_monitoring_content } from '../components/competitor-monitoring-content';

export default function CompetitorMonitoring() {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">경쟁사 모니터링</h2>
        <div className="bg-white rounded-lg shadow p-4">
          {competitor_monitoring_content()}
        </div>
      </div>
    </div>
  );
}