/**
 * TopProducts.tsx - 상위 제품 목록 컴포넌트
 */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Eye, 
  ShoppingCart, 
  ExternalLink, 
  TrendingUp, 
  Truck
} from 'lucide-react';

interface Product {
  productId: string;
  title: string;
  price: number;
  image: string;
  category: string;
  brandName: string;
  reviewCount: number;
  rank: number;
  productUrl: string;
  salesRank?: number;
  salesCount?: number;
  isRocketDelivery?: boolean;
  isForeignProduct?: boolean;
  isGlobalSeller?: boolean;
}

interface TopProductsProps {
  data: Product[];
}

const TopProducts: React.FC<TopProductsProps> = ({ data }) => {
  // 숫자 포맷팅 (천 단위 콤마)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // 가격 포맷팅
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(num);
  };

  // HTML 태그 제거
  const removeHtmlTags = (str: string) => {
    return str.replace(/<\/?[^>]+(>|$)/g, "");
  };

  // 리뷰 수에 따른 인기도 배지 생성
  const getPopularityBadge = (reviewCount: number) => {
    if (reviewCount > 10000) {
      return <Badge className="bg-red-500">인기 대박</Badge>;
    } else if (reviewCount > 5000) {
      return <Badge className="bg-orange-500">인기 높음</Badge>;
    } else if (reviewCount > 1000) {
      return <Badge className="bg-yellow-500">인기 좋음</Badge>;
    } else if (reviewCount > 100) {
      return <Badge className="bg-green-500">인기 보통</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {data.length > 0 ? (
          data.map((product, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 lg:w-1/5 p-4 flex items-center justify-center bg-gray-50">
                    <div className="relative">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={removeHtmlTags(product.title)} 
                          className="w-full h-32 object-contain" 
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      {product.rank <= 3 && (
                        <div className="absolute -top-2 -left-2 bg-amber-500 text-white h-8 w-8 rounded-full flex items-center justify-center font-bold">
                          {product.rank}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm text-gray-500">{product.brandName || '일반 판매자'}</div>
                          {product.isRocketDelivery && (
                            <Badge variant="outline" className="flex items-center text-blue-500 border-blue-200">
                              <Truck className="h-3 w-3 mr-1" /> 로켓배송
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-medium mb-2" title={removeHtmlTags(product.title)}>
                          {removeHtmlTags(product.title).length > 60 
                            ? `${removeHtmlTags(product.title).substring(0, 60)}...` 
                            : removeHtmlTags(product.title)}
                        </h3>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="text-xl font-bold">{formatCurrency(product.price)}</div>
                          {getPopularityBadge(product.reviewCount)}
                          {product.isForeignProduct && (
                            <Badge variant="outline" className="border-gray-300 text-gray-600">해외직구</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 mr-1 text-yellow-400" />
                            <span>리뷰 {formatNumber(product.reviewCount)}개</span>
                          </div>
                          {product.salesCount && (
                            <div className="flex items-center">
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              <span>판매 {formatNumber(product.salesCount)}개</span>
                            </div>
                          )}
                          {product.salesRank && (
                            <div className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              <span>판매 순위 {formatNumber(product.salesRank)}위</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open(product.productUrl, '_blank')}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          상품 보기
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">상위 제품 데이터가 없습니다.</p>
          </div>
        )}
      </div>
      
      {data.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <div className="flex items-start">
            <div className="bg-blue-100 rounded-full p-1.5 mr-3 mt-0.5">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-700 mb-1">상위 제품 인사이트</h4>
              <p className="text-sm text-blue-600">
                가장 인기 있는 상위 제품들의 가격대는 {formatCurrency(Math.min(...data.map(p => p.price)))} ~ {formatCurrency(Math.max(...data.map(p => p.price)))}로, 
                평균 가격은 {formatCurrency(data.reduce((sum, p) => sum + p.price, 0) / data.length)}입니다.
                {data.filter(p => p.isRocketDelivery).length > 0 && 
                  ` 상위 ${data.length}개 제품 중 ${data.filter(p => p.isRocketDelivery).length}개가 로켓배송을 제공합니다.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopProducts;