import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldIcon, AlertTriangleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StrengthWeaknessData {
  subject: string;
  score: number;
  fullMark: number;
  type: 'strength' | 'weakness';
}

interface StrengthWeaknessRadarProps {
  competitor: string;
  strengthsDetails: Record<string, {
    description: string;
    score: number;
    recommendations?: string[];
  }>;
  weaknessesDetails: Record<string, {
    description: string;
    score: number;
    recommendations?: string[];
  }>;
  className?: string;
}

export default function StrengthWeaknessRadar({
  competitor,
  strengthsDetails,
  weaknessesDetails,
  className
}: StrengthWeaknessRadarProps) {
  // 레이더 차트 데이터 생성
  const radarData: StrengthWeaknessData[] = [
    // 강점 데이터
    ...Object.entries(strengthsDetails).map(([key, details]) => ({
      subject: key,
      score: details.score,
      fullMark: 100,
      type: 'strength' as const
    })),
    // 약점 데이터
    ...Object.entries(weaknessesDetails).map(([key, details]) => ({
      subject: key,
      score: details.score,
      fullMark: 100,
      type: 'weakness' as const
    }))
  ];

  // 툴팁 커스텀 컴포넌트
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded shadow-md border text-sm">
          <p className="font-medium">{data.subject}</p>
          <p className="text-gray-700">점수: {data.score}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {competitor} 강점/약점 분석
        </CardTitle>
        <CardDescription>
          경쟁사의 주요 강점과 약점 분석 결과입니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 레이더 차트 */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="강점"
                dataKey="score"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.5}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
                animationDuration={500}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 강점 목록 */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldIcon className="h-5 w-5 text-emerald-500" />
            <h3 className="font-medium">주요 강점</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(strengthsDetails).map(([key, details]) => (
              <div key={`strength-${key}`} className="border rounded-md p-3 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{key}</span>
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                    {details.score}/100
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{details.description}</p>
                {details.recommendations && details.recommendations.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500">대응 전략:</span>
                    <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                      {details.recommendations.map((rec, idx) => (
                        <li key={idx} className="ml-1">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 약점 목록 */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
            <h3 className="font-medium">주요 약점</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(weaknessesDetails).map(([key, details]) => (
              <div key={`weakness-${key}`} className="border rounded-md p-3 bg-amber-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{key}</span>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                    {details.score}/100
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{details.description}</p>
                {details.recommendations && details.recommendations.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-500">활용 전략:</span>
                    <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                      {details.recommendations.map((rec, idx) => (
                        <li key={idx} className="ml-1">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}