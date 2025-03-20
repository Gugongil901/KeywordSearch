import { Link, useLocation } from "wouter";
import Logo from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

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
            <Link href="/discover" className={`text-sm font-medium ${isActive('/discover') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              아이템발굴
            </Link>
            <Link href="/keyword" className={`text-sm font-medium ${isActive('/keyword') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              키워드분석
            </Link>
            <Link href="/insights" className={`text-sm font-medium ${isActive('/insights') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              키워드인사이트
            </Link>
            <Link href="/" className={`text-sm font-medium ${isActive('/') && !location.includes('/') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              트렌드분석
            </Link>
            <Link href="/competition" className={`text-sm font-medium ${isActive('/competition') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              경쟁/입점
            </Link>
            <Link href="/tracking" className={`text-sm font-medium ${isActive('/tracking') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              판매/재고
            </Link>
            <Link href="/monitoring" className={`text-sm font-medium ${isActive('/monitoring') ? 'text-primary border-b-2 border-primary' : 'text-gray-900 hover:text-primary'}`}>
              경쟁사모니터링
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
          <Button className="bg-primary text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90">로그인</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
