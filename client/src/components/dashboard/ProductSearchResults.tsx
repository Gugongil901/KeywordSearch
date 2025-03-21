import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { ProductImage } from '@/components/ui/product-image';

export interface Product {
  productId: string;
  title: string;
  price: number;
  image: string;
  category?: string;
  brandName?: string;
  reviewCount?: number;
  rank?: number;
  productUrl?: string;
}

interface ProductSearchResultsProps {
  products: Product[];
  title?: string;
  showRank?: boolean;
}

const ProductSearchResults: React.FC<ProductSearchResultsProps> = ({
  products,
  title = '상품 검색 결과',
  showRank = true
}) => {
  // 숫자 포맷팅 함수
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  }
  
  // 가격 포맷팅 함수
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div 
              key={product.productId} 
              className="flex items-center border-b last:border-0 pb-4 last:pb-0"
            >
              {showRank && (
                <div className="w-8 flex-shrink-0 text-center font-medium text-muted-foreground mr-2">
                  {index + 1}
                </div>
              )}
              
              <div className="w-16 h-16 flex-shrink-0 mr-4 overflow-hidden rounded">
                <ProductImage 
                  productId={product.productId}
                  title={product.title} 
                  src={product.image}
                  width={64}
                  height={64}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="line-clamp-2 text-sm mb-1">{product.title}</div>
                <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                  {product.brandName && (
                    <span>{product.brandName}</span>
                  )}
                  {product.reviewCount !== undefined && (
                    <span>리뷰 {formatNumber(product.reviewCount)}개</span>
                  )}
                  {product.rank !== undefined && (
                    <span>순위 {product.rank}위</span>
                  )}
                </div>
              </div>
              
              <div className="flex-shrink-0 ml-4 text-right">
                <div className="font-medium">{formatCurrency(product.price)}원</div>
                {product.productUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7 mt-1"
                    onClick={() => window.open(product.productUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    상품보기
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              상품 정보가 없습니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductSearchResults;