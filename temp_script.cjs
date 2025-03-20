const fs = require('fs');
const filePath = 'client/src/pages/competitor-monitoring.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 모든 이미지 태그를 ProductImage 컴포넌트로 교체 (alert.product)
const imgPattern2 = /{alert\.product\.image && \(\s*<img\s+src={alert\.product\.image}\s+alt={alert\.product\.name}\s+className="w-16 h-16 object-cover rounded"\s*\/>\s*\)}/g;
const replacement2 = '<ProductImage product={alert.product} />';

content = content.replace(imgPattern2, replacement2);
fs.writeFileSync(filePath, content);
console.log('Alert ProductImage 컴포넌트로 이미지 교체 완료');
