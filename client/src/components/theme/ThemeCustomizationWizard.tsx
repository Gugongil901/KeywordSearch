import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Paintbrush, Moon, Sun, Monitor, Check, RotateCcw, SaveIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// 테마 설정 인터페이스
interface ThemeOptions {
  primary: string;
  variant: 'professional' | 'tint' | 'vibrant';
  appearance: 'light' | 'dark' | 'system';
  radius: number;
}

// 기본 테마 설정
const defaultTheme: ThemeOptions = {
  primary: '#e01e5a', // 핑크 계열
  variant: 'vibrant',
  appearance: 'system',
  radius: 0.5
};

// 프리셋 색상 팔레트
const presetColors = [
  { name: '핑크', value: '#e01e5a' },
  { name: '바이올렛', value: '#7c3aed' },
  { name: '블루', value: '#3b82f6' },
  { name: '씨그린', value: '#10b981' },
  { name: '옐로우', value: '#f59e0b' },
  { name: '오렌지', value: '#f97316' },
  { name: '레드', value: '#ef4444' },
  { name: '그레이', value: '#6b7280' },
];

const ThemeCustomizationWizard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('colors');
  const [theme, setTheme] = useState<ThemeOptions>(() => {
    // 로컬 스토리지에서 저장된 테마 불러오기
    try {
      const saved = localStorage.getItem('app-theme');
      return saved ? JSON.parse(saved) : defaultTheme;
    } catch (error) {
      console.error('테마 불러오기 오류:', error);
      return defaultTheme;
    }
  });
  const [customColor, setCustomColor] = useState(theme.primary);

  // 테마 변경 시 실시간 적용
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // 테마 적용 함수
  const applyTheme = (themeOptions: ThemeOptions) => {
    document.documentElement.setAttribute('data-theme-variant', themeOptions.variant);
    document.documentElement.style.setProperty('--primary', themeOptions.primary);
    
    if (themeOptions.appearance === 'system') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDarkMode);
    } else {
      document.documentElement.classList.toggle('dark', themeOptions.appearance === 'dark');
    }
    
    document.documentElement.style.setProperty('--radius', `${themeOptions.radius}rem`);
  };

  // 테마 저장 함수
  const saveTheme = () => {
    try {
      localStorage.setItem('app-theme', JSON.stringify(theme));
      toast({
        title: "테마 저장 완료",
        description: "테마 설정이 성공적으로 저장되었습니다.",
        duration: 3000,
      });
    } catch (error) {
      console.error('테마 저장 오류:', error);
      toast({
        title: "테마 저장 실패",
        description: "테마 설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // 테마 초기화 함수
  const resetTheme = () => {
    setTheme(defaultTheme);
    setCustomColor(defaultTheme.primary);
    toast({
      title: "테마 초기화 완료",
      description: "테마 설정이 기본값으로 초기화되었습니다.",
      duration: 3000,
    });
  };

  // 색상 변경 함수
  const handleColorChange = (color: string) => {
    setTheme(prev => ({ ...prev, primary: color }));
    setCustomColor(color);
  };

  // 커스텀 색상 입력 변경 핸들러
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
    setTheme(prev => ({ ...prev, primary: e.target.value }));
  };

  // 테마 스타일 변경 핸들러
  const handleVariantChange = (variant: 'professional' | 'tint' | 'vibrant') => {
    setTheme(prev => ({ ...prev, variant }));
  };

  // 다크/라이트 모드 변경 핸들러
  const handleAppearanceChange = (appearance: 'light' | 'dark' | 'system') => {
    setTheme(prev => ({ ...prev, appearance }));
  };

  // 테두리 둥글기 변경 핸들러
  const handleRadiusChange = (value: number[]) => {
    setTheme(prev => ({ ...prev, radius: value[0] }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="colors" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Paintbrush className="h-4 w-4" />
            <span>색상</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>외관</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <span>고급 설정</span>
          </TabsTrigger>
        </TabsList>
        
        {/* 색상 탭 */}
        <TabsContent value="colors" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">주요 색상 선택</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-3">
                {presetColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={cn(
                      "h-12 rounded-md relative flex items-center justify-center",
                      theme.primary === color.value ? "ring-2 ring-primary ring-offset-2" : ""
                    )}
                    style={{ backgroundColor: color.value }}
                    aria-label={`색상: ${color.name}`}
                  >
                    {theme.primary === color.value && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-color">직접 입력 (HEX)</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="color-picker"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    className="h-10 w-12 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    id="custom-color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    className="flex-1 px-3 py-2 rounded-md border border-input"
                    placeholder="#RRGGBB"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">테마 스타일</h3>
                <RadioGroup 
                  value={theme.variant}
                  onValueChange={(v) => handleVariantChange(v as 'professional' | 'tint' | 'vibrant')}
                  className="grid grid-cols-3 gap-3"
                >
                  <div>
                    <RadioGroupItem
                      value="professional"
                      id="professional"
                      className="sr-only"
                    />
                    <Label
                      htmlFor="professional"
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:border-accent",
                        theme.variant === "professional" && "border-primary"
                      )}
                    >
                      <div className="h-6 w-6 rounded-full border-2 border-primary/25 bg-background"></div>
                      <span className="mt-2 block text-center">프로페셔널</span>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem
                      value="tint"
                      id="tint"
                      className="sr-only"
                    />
                    <Label
                      htmlFor="tint"
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:border-accent",
                        theme.variant === "tint" && "border-primary"
                      )}
                    >
                      <div className="h-6 w-6 rounded-full border-2 border-primary bg-primary/10"></div>
                      <span className="mt-2 block text-center">틴트</span>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem
                      value="vibrant"
                      id="vibrant"
                      className="sr-only"
                    />
                    <Label
                      htmlFor="vibrant"
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:border-accent",
                        theme.variant === "vibrant" && "border-primary"
                      )}
                    >
                      <div className="h-6 w-6 rounded-full bg-primary"></div>
                      <span className="mt-2 block text-center">비비드</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 외관 탭 */}
        <TabsContent value="appearance" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">외관 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup 
                value={theme.appearance}
                onValueChange={(v) => handleAppearanceChange(v as 'light' | 'dark' | 'system')}
                className="grid grid-cols-3 gap-3"
              >
                <div>
                  <RadioGroupItem
                    value="light"
                    id="light-mode"
                    className="sr-only"
                  />
                  <Label
                    htmlFor="light-mode"
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:border-accent",
                      theme.appearance === "light" && "border-primary"
                    )}
                  >
                    <Sun className="h-6 w-6" />
                    <span className="mt-2 block text-center">라이트</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem
                    value="dark"
                    id="dark-mode"
                    className="sr-only"
                  />
                  <Label
                    htmlFor="dark-mode"
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:border-accent",
                      theme.appearance === "dark" && "border-primary"
                    )}
                  >
                    <Moon className="h-6 w-6" />
                    <span className="mt-2 block text-center">다크</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem
                    value="system"
                    id="system-mode"
                    className="sr-only"
                  />
                  <Label
                    htmlFor="system-mode"
                    className={cn(
                      "flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:border-accent",
                      theme.appearance === "system" && "border-primary"
                    )}
                  >
                    <Monitor className="h-6 w-6" />
                    <span className="mt-2 block text-center">시스템</span>
                  </Label>
                </div>
              </RadioGroup>

              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-4">
                  {theme.appearance === 'system' 
                    ? '시스템 설정을 따라 자동으로 라이트/다크 모드가 전환됩니다.' 
                    : theme.appearance === 'dark' 
                      ? '다크 모드는 눈의 피로를 줄여주고 배터리를 절약합니다.' 
                      : '라이트 모드는 밝은 환경에서 가독성이 좋습니다.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 고급 설정 탭 */}
        <TabsContent value="advanced" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">고급 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="radius">테두리 둥글기 (Border Radius)</Label>
                    <span className="text-sm text-muted-foreground">{theme.radius}rem</span>
                  </div>
                  <Slider
                    id="radius"
                    max={1.5}
                    step={0.1}
                    value={[theme.radius]}
                    onValueChange={handleRadiusChange}
                  />
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                  <div className="rounded border border-primary p-3" style={{ borderRadius: `${theme.radius}rem` }}>
                    버튼 및 카드 미리보기
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-sm border border-input p-2 text-center text-xs">Small</div>
                    <div className="rounded border border-input p-2 text-center text-xs">Default</div>
                    <div className="rounded-lg border border-input p-2 text-center text-xs">Large</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between gap-2 pt-6">
        <Button variant="outline" onClick={resetTheme} className="flex items-center gap-1">
          <RotateCcw className="h-4 w-4" />
          초기화
        </Button>
        <Button onClick={saveTheme} className="flex items-center gap-1">
          <SaveIcon className="h-4 w-4" />
          저장하기
        </Button>
      </CardFooter>
    </div>
  );
};

export default ThemeCustomizationWizard;