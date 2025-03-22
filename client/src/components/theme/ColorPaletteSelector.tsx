import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Paintbrush } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type ColorPalette = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  // 차트에서 사용할 색상 팔레트 추가
  chartColors?: {
    background: string[];
    border: string[];
    radar: string[];
  };
};

const defaultPalettes: ColorPalette[] = [
  {
    id: 'blue',
    name: '파랑 테마',
    primary: '#1E40AF',
    secondary: '#3B82F6',
    accent: '#60A5FA',
    background: '#F0F9FF',
    foreground: '#0F172A',
    chartColors: {
      background: [
        'rgba(37, 99, 235, 0.5)',   // 파랑
        'rgba(79, 70, 229, 0.5)',   // 인디고
        'rgba(59, 130, 246, 0.5)',  // 하늘색
        'rgba(6, 182, 212, 0.5)',   // 시안
        'rgba(14, 165, 233, 0.5)',  // 하늘색 2
      ],
      border: [
        'rgba(37, 99, 235, 0.8)',
        'rgba(79, 70, 229, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(6, 182, 212, 0.8)',
        'rgba(14, 165, 233, 0.8)',
      ],
      radar: [
        'rgba(37, 99, 235, 0.15)',
        'rgba(79, 70, 229, 0.15)',
        'rgba(59, 130, 246, 0.15)',
        'rgba(6, 182, 212, 0.15)',
        'rgba(14, 165, 233, 0.15)',
      ]
    }
  },
  {
    id: 'green',
    name: '녹색 테마',
    primary: '#15803D',
    secondary: '#22C55E',
    accent: '#4ADE80',
    background: '#F0FDF4',
    foreground: '#14532D',
    chartColors: {
      background: [
        'rgba(21, 128, 61, 0.5)',   // 초록
        'rgba(22, 163, 74, 0.5)',   // 연한 초록
        'rgba(16, 185, 129, 0.5)',  // 민트
        'rgba(5, 150, 105, 0.5)',   // 에메랄드
        'rgba(4, 120, 87, 0.5)',    // 청록
      ],
      border: [
        'rgba(21, 128, 61, 0.8)',
        'rgba(22, 163, 74, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(5, 150, 105, 0.8)',
        'rgba(4, 120, 87, 0.8)',
      ],
      radar: [
        'rgba(21, 128, 61, 0.15)',
        'rgba(22, 163, 74, 0.15)',
        'rgba(16, 185, 129, 0.15)',
        'rgba(5, 150, 105, 0.15)',
        'rgba(4, 120, 87, 0.15)',
      ]
    }
  },
  {
    id: 'purple',
    name: '보라 테마',
    primary: '#7E22CE',
    secondary: '#A855F7',
    accent: '#C084FC',
    background: '#FAF5FF',
    foreground: '#581C87',
    chartColors: {
      background: [
        'rgba(126, 34, 206, 0.5)',  // 보라
        'rgba(168, 85, 247, 0.5)',  // 연한 보라
        'rgba(147, 51, 234, 0.5)',  // 중간 보라
        'rgba(192, 132, 252, 0.5)', // 라벤더
        'rgba(139, 92, 246, 0.5)',  // 블루 보라
      ],
      border: [
        'rgba(126, 34, 206, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(147, 51, 234, 0.8)',
        'rgba(192, 132, 252, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      radar: [
        'rgba(126, 34, 206, 0.15)',
        'rgba(168, 85, 247, 0.15)',
        'rgba(147, 51, 234, 0.15)',
        'rgba(192, 132, 252, 0.15)',
        'rgba(139, 92, 246, 0.15)',
      ]
    }
  },
  {
    id: 'pastel',
    name: '파스텔 테마',
    primary: '#FB7185',
    secondary: '#FDA4AF',
    accent: '#FECDD3',
    background: '#FFF1F2',
    foreground: '#881337',
    chartColors: {
      background: [
        'rgba(251, 113, 133, 0.4)',  // 연한 빨강
        'rgba(253, 164, 175, 0.4)',  // 연한 핑크
        'rgba(249, 168, 212, 0.4)',  // 라이트 핑크
        'rgba(248, 180, 180, 0.4)',  // 연한 코랄
        'rgba(251, 207, 232, 0.4)',  // 매우 연한 핑크
      ],
      border: [
        'rgba(251, 113, 133, 0.7)',
        'rgba(253, 164, 175, 0.7)',
        'rgba(249, 168, 212, 0.7)',
        'rgba(248, 180, 180, 0.7)',
        'rgba(251, 207, 232, 0.7)',
      ],
      radar: [
        'rgba(251, 113, 133, 0.15)',
        'rgba(253, 164, 175, 0.15)',
        'rgba(249, 168, 212, 0.15)',
        'rgba(248, 180, 180, 0.15)',
        'rgba(251, 207, 232, 0.15)',
      ]
    }
  },
  {
    id: 'dark',
    name: '다크 테마',
    primary: '#6366F1',
    secondary: '#818CF8',
    accent: '#A5B4FC',
    background: '#1E293B',
    foreground: '#F8FAFC',
    chartColors: {
      background: [
        'rgba(99, 102, 241, 0.5)',   // 인디고
        'rgba(129, 140, 248, 0.5)',  // 연한 인디고
        'rgba(165, 180, 252, 0.5)',  // 매우 연한 인디고
        'rgba(139, 92, 246, 0.5)',   // 보라
        'rgba(124, 58, 237, 0.5)',   // 진한 보라
      ],
      border: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(129, 140, 248, 0.8)',
        'rgba(165, 180, 252, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(124, 58, 237, 0.8)',
      ],
      radar: [
        'rgba(99, 102, 241, 0.2)',   // 다크모드는 약간 더 진하게
        'rgba(129, 140, 248, 0.2)',
        'rgba(165, 180, 252, 0.2)',
        'rgba(139, 92, 246, 0.2)',
        'rgba(124, 58, 237, 0.2)',
      ]
    }
  }
];

export const savePaletteToLocalStorage = (paletteId: string) => {
  localStorage.setItem('selectedColorPalette', paletteId);
  console.log('로컬 스토리지에서 색상 팔레트 저장됨:', paletteId);
};

export const getPaletteFromLocalStorage = (): string => {
  const savedPalette = localStorage.getItem('selectedColorPalette');
  console.log('로컬 스토리지에서 색상 팔레트 불러옴:', savedPalette || 'blue');
  return savedPalette || 'blue';
};

export const getFullPaletteById = (paletteId: string): ColorPalette => {
  return defaultPalettes.find(p => p.id === paletteId) || defaultPalettes[0];
};

export const applyPaletteToDocument = (palette: ColorPalette) => {
  // CSS 변수 설정
  document.documentElement.style.setProperty('--color-primary', palette.primary);
  document.documentElement.style.setProperty('--color-secondary', palette.secondary);
  document.documentElement.style.setProperty('--color-accent', palette.accent);
  document.documentElement.style.setProperty('--color-background', palette.background);
  document.documentElement.style.setProperty('--color-foreground', palette.foreground);
  
  // 테마 모드 설정 (다크/라이트)
  if (palette.id === 'dark') {
    document.documentElement.classList.add('dark-theme');
    document.documentElement.style.setProperty('--theme-mode', 'dark');
  } else {
    document.documentElement.classList.remove('dark-theme');
    document.documentElement.style.setProperty('--theme-mode', 'light');
  }

  // 테마 JSON 데이터 업데이트 (Redux/Context를 사용하는 경우 추가)

  // 로컬 스토리지에 테마 설정 저장
  savePaletteToLocalStorage(palette.id);
};

interface ColorPaletteSelectorProps {
  onPaletteChange?: (palette: ColorPalette) => void;
  isPopover?: boolean;
}

const ColorPaletteSelector: React.FC<ColorPaletteSelectorProps> = ({ 
  onPaletteChange,
  isPopover = false
}) => {
  const [selectedPalette, setSelectedPalette] = useState<string>(getPaletteFromLocalStorage());
  const { toast } = useToast();

  useEffect(() => {
    // 컴포넌트 마운트 시 저장된 팔레트 적용
    const savedPaletteId = getPaletteFromLocalStorage();
    setSelectedPalette(savedPaletteId);
    const fullPalette = getFullPaletteById(savedPaletteId);
    applyPaletteToDocument(fullPalette);
  }, []);

  const handlePaletteChange = (paletteId: string) => {
    setSelectedPalette(paletteId);
    const selectedPaletteObj = getFullPaletteById(paletteId);
    
    // 문서에 팔레트 적용
    applyPaletteToDocument(selectedPaletteObj);
    
    // 콜백 호출 (있는 경우)
    if (onPaletteChange) {
      onPaletteChange(selectedPaletteObj);
    }
    
    toast({
      title: "색상 테마 변경",
      description: `${selectedPaletteObj.name}(으)로 변경되었습니다.`,
      duration: 2000,
    });
  };

  // 팝업용 간소화 버전
  if (isPopover) {
    return (
      <div className="p-2 w-64">
        <h3 className="text-sm font-medium mb-2">색상 테마 선택</h3>
        <div className="flex flex-wrap gap-2">
          {defaultPalettes.map((palette) => (
            <button
              key={palette.id}
              className={`w-10 h-10 rounded-full border-2 ${
                selectedPalette === palette.id ? 'border-gray-900 dark:border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: palette.primary }}
              onClick={() => handlePaletteChange(palette.id)}
              aria-label={`${palette.name} 색상 테마 선택`}
              title={palette.name}
            />
          ))}
        </div>
      </div>
    );
  }

  // 전체 버전
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>색상 팔레트 설정</CardTitle>
        <CardDescription>
          애플리케이션의 색상 테마를 선택하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedPalette} 
          onValueChange={handlePaletteChange}
          className="space-y-4"
        >
          {defaultPalettes.map((palette) => (
            <div key={palette.id} className="flex items-center space-x-3">
              <RadioGroupItem value={palette.id} id={`palette-${palette.id}`} />
              <div 
                className="w-8 h-8 rounded-full mr-2" 
                style={{ backgroundColor: palette.primary }}
              />
              <Label htmlFor={`palette-${palette.id}`} className="flex-1">
                {palette.name}
              </Label>
              <div className="flex space-x-1">
                {[palette.primary, palette.secondary, palette.accent].map((color, idx) => (
                  <div 
                    key={idx}
                    className="w-4 h-4 rounded-full border border-gray-200" 
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => handlePaletteChange('blue')}
        >
          기본값으로 재설정
        </Button>
        <Button onClick={() => toast({
          title: "색상 설정 저장됨",
          description: "선택한 색상 설정이 저장되었습니다.",
        })}>
          저장
        </Button>
      </CardFooter>
    </Card>
  );
};

// 팝업 형태의 색상 선택기 컴포넌트
export const PopoverColorSelector: React.FC = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Paintbrush size={14} />
          <span className="hidden sm:inline">테마</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <ColorPaletteSelector isPopover />
      </PopoverContent>
    </Popover>
  );
};

export default ColorPaletteSelector;