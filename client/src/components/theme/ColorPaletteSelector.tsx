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
  },
  {
    id: 'green',
    name: '녹색 테마',
    primary: '#15803D',
    secondary: '#22C55E',
    accent: '#4ADE80',
    background: '#F0FDF4',
    foreground: '#14532D',
  },
  {
    id: 'purple',
    name: '보라 테마',
    primary: '#7E22CE',
    secondary: '#A855F7',
    accent: '#C084FC',
    background: '#FAF5FF',
    foreground: '#581C87',
  },
  {
    id: 'pastel',
    name: '파스텔 테마',
    primary: '#FB7185',
    secondary: '#FDA4AF',
    accent: '#FECDD3',
    background: '#FFF1F2',
    foreground: '#881337',
  },
  {
    id: 'dark',
    name: '다크 테마',
    primary: '#6366F1',
    secondary: '#818CF8',
    accent: '#A5B4FC',
    background: '#1E293B',
    foreground: '#F8FAFC',
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