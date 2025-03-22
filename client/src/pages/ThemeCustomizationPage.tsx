import React from 'react';
import ThemeCustomizationWizard from '@/components/theme/ThemeCustomizationWizard';
import { PaintBucket, ChevronLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const ThemeCustomizationPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-2 gap-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PaintBucket className="h-5 w-5" />
            테마 커스터마이징
          </h1>
        </div>
        <p className="text-muted-foreground">
          애플리케이션의 모양과 느낌을 원하는 방식으로 사용자 지정하세요
        </p>
      </div>
      
      <ThemeCustomizationWizard />
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>변경 사항은 브라우저 로컬 저장소에 저장됩니다</p>
      </div>
    </div>
  );
};

export default ThemeCustomizationPage;