const fs = require('fs');
const path = require('path');

const files = [
  'client/src/components/keyword-analysis/IntegratedSearch.tsx',
  'client/src/components/home/hero-search.tsx'
];

files.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`파일을 찾을 수 없습니다: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // IntegratedSearch.tsx에서 검색 버튼 업데이트
    if (filePath.includes('IntegratedSearch.tsx')) {
      content = content.replace(
        /variant="outline"(\s+)onClick={\(\) => handleSearch\(\)}(\s+)className="whitespace-nowrap"/g, 
        'variant="default" onClick={() => handleSearch()} className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white"'
      );
    }
    
    // hero-search.tsx에서 검색 버튼 업데이트 (이미 파란색이지만 일관성을 위해 포함)
    if (filePath.includes('hero-search.tsx')) {
      content = content.replace(
        /className="bg-blue-600 text-white px-5 py-3 rounded-none font-medium hover:bg-blue-700"/g,
        'className="bg-blue-600 text-white px-5 py-3 rounded-none font-medium hover:bg-blue-700"'
      );
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`파일이 성공적으로 업데이트되었습니다: ${filePath}`);
  } catch (error) {
    console.error(`파일 처리 중 오류 발생: ${filePath}`, error);
  }
});
