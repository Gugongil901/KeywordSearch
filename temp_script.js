const fs = require('fs');
const filePath = 'client/src/pages/competitor-monitoring.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 모든 이미지 태그를 ProductImage 컴포넌트로 교체
const imgPattern = /{change\.product\.image && \(\s*<img\s+src={change\.product\.image}\s+alt={change\.product\.name}\s+className="w-16 h-16 object-cover rounded"\s*\/>\s*\)}/g;
const replacement = '<ProductImage product={change.product} />';

content = content.replace(imgPattern, replacement);
fs.writeFileSync(filePath, content);
console.log('ProductImage 컴포넌트로 모든 이미지 교체 완료');
