import { useState, useEffect } from 'react';
import ColorPaletteSelector from '@/components/theme/ColorPaletteSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFullPaletteById, getPaletteFromLocalStorage } from '@/components/theme/ColorPaletteSelector';
import { useToast } from '@/hooks/use-toast';

const ThemeSettings = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('색상');
  const [currentTheme, setCurrentTheme] = useState(getFullPaletteById(getPaletteFromLocalStorage()));

  // 테마 변경될 때 실행되는 콜백
  const handleThemeChange = (newPalette: any) => {
    setCurrentTheme(newPalette);
    toast({
      title: "테마 변경됨",
      description: `${newPalette.name}(으)로 테마가 변경되었습니다.`,
      duration: 2000,
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">테마 설정</h1>
      <p className="text-gray-600 mb-8">
        애플리케이션의 시각적 테마를 사용자 취향에 맞게 설정하세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="색상">색상 팔레트</TabsTrigger>
              <TabsTrigger value="미리보기">미리보기</TabsTrigger>
            </TabsList>
            
            <TabsContent value="색상" className="mt-4">
              <ColorPaletteSelector onPaletteChange={handleThemeChange} />
            </TabsContent>
            
            <TabsContent value="미리보기" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>테마 미리보기</CardTitle>
                  <CardDescription>
                    현재 선택된 테마: <span className="font-medium">{currentTheme.name}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">버튼</h3>
                      <div className="flex flex-wrap gap-3">
                        <button className="px-4 py-2 rounded bg-primary text-white">기본 버튼</button>
                        <button className="px-4 py-2 rounded bg-secondary text-white">보조 버튼</button>
                        <button className="px-4 py-2 rounded bg-accent text-foreground">강조 버튼</button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">텍스트</h3>
                      <p className="text-foreground">기본 텍스트</p>
                      <p className="text-primary">주요 색상 텍스트</p>
                      <p className="text-secondary">보조 색상 텍스트</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">배경</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-4 bg-background border rounded">기본 배경</div>
                        <div className="p-4 bg-primary text-white rounded">주요 배경</div>
                        <div className="p-4 bg-secondary text-white rounded">보조 배경</div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">카드</h3>
                      <Card>
                        <CardHeader>
                          <CardTitle>샘플 카드</CardTitle>
                          <CardDescription>
                            카드 디자인 미리보기
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p>현재 테마에서 카드가 어떻게 보이는지 확인하세요.</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>현재 테마 정보</CardTitle>
              <CardDescription>
                선택한 테마의 상세 정보
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">테마 이름</h3>
                  <p>{currentTheme.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">주요 색상</h3>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: currentTheme.primary }}
                    />
                    <code className="text-xs bg-gray-100 p-1 rounded">{currentTheme.primary}</code>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">보조 색상</h3>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: currentTheme.secondary }}
                    />
                    <code className="text-xs bg-gray-100 p-1 rounded">{currentTheme.secondary}</code>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">액센트 색상</h3>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: currentTheme.accent }}
                    />
                    <code className="text-xs bg-gray-100 p-1 rounded">{currentTheme.accent}</code>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">배경 색상</h3>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border" 
                      style={{ backgroundColor: currentTheme.background }}
                    />
                    <code className="text-xs bg-gray-100 p-1 rounded">{currentTheme.background}</code>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">텍스트 색상</h3>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: currentTheme.foreground }}
                    />
                    <code className="text-xs bg-gray-100 p-1 rounded">{currentTheme.foreground}</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;