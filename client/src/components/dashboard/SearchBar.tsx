/**
 * SearchBar.tsx - 키워드 검색 입력 컴포넌트
 */
import React, { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp } from 'lucide-react';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([
    '나이키', '아디다스', '뉴발란스', '스니커즈', '원피스',
    '청바지', '노트북', '아이폰', '갤럭시', '애플워치'
  ]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    setInputValue(keyword);
    onSearch(keyword);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="키워드를 입력하세요 (예: 나이키, 아이폰, 청바지...)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !inputValue.trim()}>
          {isLoading ? '분석 중...' : '분석하기'}
        </Button>
      </form>

      <div className="mt-4">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>인기 키워드</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedKeywords.map((keyword) => (
            <Button
              key={keyword}
              variant="outline"
              size="sm"
              onClick={() => handleKeywordClick(keyword)}
              disabled={isLoading}
            >
              {keyword}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;