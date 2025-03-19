import fs from 'fs';
console.log('Checking for variable name in the file...');
const fileContent = fs.readFileSync('server/api/analyzers/competitor-analyzer.ts', 'utf8');
console.log('File content loaded, length:', fileContent.length);
console.log('Contains sellerProducts2:', fileContent.includes('sellerProducts2'));
const sellerProducts2Index = fileContent.indexOf('sellerProducts2');
if (sellerProducts2Index !== -1) {
  console.log('Found at index:', sellerProducts2Index);
  const contextStart = Math.max(0, sellerProducts2Index - 50);
  const contextEnd = Math.min(fileContent.length, sellerProducts2Index + 50);
  console.log('Context:', fileContent.substring(contextStart, contextEnd));
}
