const fs = require('fs');
const path = 'client/src/pages/competitor-monitoring.tsx';

// 파일 읽기
let content = fs.readFileSync(path, 'utf8');

// ProductImage 태그 찾아서 CompetitorProductImage로 변경
const regex = /<ProductImage\s+src=\{([^}]+)\.image\}\s+alt=\{([^}]+)\.name\}\s+className="([^"]+)"\s*\/>/g;
const replacement = '<CompetitorProductImage product={$1} className="$3" brandName={brandName} brandId={competitor} />';

// 변경 내용 적용
content = content.replace(regex, replacement);

// 파일 쓰기
fs.writeFileSync(path, content);
console.log('Product images updated successfully!')