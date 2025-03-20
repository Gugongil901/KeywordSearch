const fs = require('fs');
const path = 'client/src/pages/competitor-monitoring.tsx';

let content = fs.readFileSync(path, 'utf8');

// 모든 ProductImage 속성 변경
content = content.replace(
  /<ProductImage\s+src=\{([^{}]+)\}\s+alt=\{([^{}]+)\}\s+width=\{(\d+)\}\s+height=\{(\d+)\}\s+productName=\{([^{}]+)\}\s+productUrl=\{([^{}]+)\}\s+isClickable=\{([^{}]+)\}\s*\/>/g,
  '<ProductImage src={$1} title={$2} productId={$5.productId} width={$3} height={$4} />'
);

// 이미지 onError 처리 변경
content = content.replace(
  /onError=\{\(e\) => \{\s+\(e\.target as HTMLImageElement\)\.src = DEFAULT_PRODUCT_IMAGES\[0\];\s+\}\}/g,
  ''
);

fs.writeFileSync(path, content);
console.log('ProductImage 컴포넌트 업데이트 완료');
