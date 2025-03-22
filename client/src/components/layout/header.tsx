import { Link, useLocation } from "wouter";
import Logo from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { PopoverColorSelector } from "@/components/theme/ColorPaletteSelector";
import { PaintBucket } from "lucide-react";

const Header = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-10">
          <Logo />
          <nav className="hidden md:flex space-x-6">

            <Link href="/keyword" className={`text-sm font-medium ${isActive('/keyword') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              키워드분석
            </Link>
            <Link href="/insights" className={`text-sm font-medium ${isActive('/insights') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              키워드인사이트
            </Link>
            <Link href="/trends" className={`text-sm font-medium ${isActive('/trends') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              키워드 트래커
            </Link>

            <Link href="/advanced-analysis" className={`text-sm font-medium ${isActive('/advanced-analysis') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              고급 분석
            </Link>

            <Link href="/monitoring" className={`text-sm font-medium ${isActive('/monitoring') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              경쟁사모니터링
            </Link>
            
            <Link href="/health-supplement" className={`text-sm font-medium ${isActive('/health-supplement') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              건강기능식품
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/help" className="text-gray-900 hover:text-primary text-sm">
            도움말
          </Link>
          <Link href="/guide" className="text-gray-900 hover:text-primary text-sm">
            가이드
          </Link>
          <Link 
            href="/theme-customization" 
            className={`flex items-center text-sm ${isActive('/theme-customization') ? 'text-primary' : 'text-gray-900 hover:text-primary'}`}
          >
            <PaintBucket className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">테마</span>
          </Link>
          <PopoverColorSelector />
          <Button className="bg-primary text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90">로그인</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
