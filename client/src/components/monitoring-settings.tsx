/**
 * 경쟁사 모니터링 설정 컴포넌트
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { MultiSelect } from './ui/multi-select';
import { X } from 'lucide-react';

// 설정 스키마 정의
const monitoringFormSchema = z.object({
  keyword: z.string().min(1, '키워드를 입력하세요'),
  competitors: z.array(z.string()).min(1, '최소 1개 이상의 경쟁사를 선택하세요'),
  monitorFrequency: z.enum(['daily', 'weekly']),
  alertThresholds: z.object({
    priceChangePercent: z.number().min(0).max(100),
    newProduct: z.boolean(),
    rankChange: z.boolean(),
    reviewChangePercent: z.number().min(0).max(100),
  }),
});

type MonitoringFormValues = z.infer<typeof monitoringFormSchema>;

// 경쟁사 목록 (ID 값 사용)
const COMPETITOR_OPTIONS = [
  { label: '닥터린', value: 'drlin' },
  { label: '내츄럴플러스', value: 'naturalplus' },
  { label: '에스더몰', value: 'esthermall' },
  { label: '안국건강', value: 'anguk' },
  { label: '고려은단', value: 'koreaeundan' },
  { label: '뉴트리원', value: 'nutrione' },
  { label: '종근당건강', value: 'ckdhc' },
  { label: 'GNM 자연의품격', value: 'gnm' },
  { label: '뉴트리데이', value: 'nutriday' },
  { label: '주영엔에스', value: 'jyns' },
  { label: '한미양행', value: 'hanmi' },
  { label: '유한양행', value: 'yuhan' },
];

interface MonitoringSettingsProps {
  onClose: () => void;
}

export function MonitoringSettings({ onClose }: MonitoringSettingsProps) {
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);

  // 기본값 설정
  const defaultValues: MonitoringFormValues = {
    keyword: '',
    competitors: [],
    monitorFrequency: 'daily',
    alertThresholds: {
      priceChangePercent: 5,
      newProduct: true,
      rankChange: true,
      reviewChangePercent: 10,
    },
  };

  const form = useForm<MonitoringFormValues>({
    resolver: zodResolver(monitoringFormSchema),
    defaultValues,
  });

  const onSubmit = (data: MonitoringFormValues) => {
    console.log('모니터링 설정:', data);
    // TODO: 설정 저장 API 호출
    onClose();
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">모니터링 설정</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모니터링 키워드</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 루테인, 비타민C 등" {...field} />
                  </FormControl>
                  <FormDescription>
                    모니터링 할 상품 키워드를 입력하세요
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monitorFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모니터링 주기</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="모니터링 주기 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">매일</SelectItem>
                      <SelectItem value="weekly">매주</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    변경 사항을 확인할 주기를 선택하세요
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="competitors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>모니터링할 경쟁사</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={COMPETITOR_OPTIONS}
                    selectedValues={field.value}
                    onChange={(values: string[]) => {
                      field.onChange(values);
                      setSelectedCompetitors(values);
                    }}
                    placeholder="경쟁사 선택 (최대 5개)"
                  />
                </FormControl>
                <FormDescription>
                  모니터링할 경쟁사를 선택하세요 (최대 5개)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border rounded-md p-4">
            <h4 className="font-medium mb-4">알림 설정</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="alertThresholds.priceChangePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>가격 변동 알림 ({field.value}%)</FormLabel>
                    <FormControl>
                      <Slider
                        defaultValue={[field.value]}
                        min={1}
                        max={50}
                        step={1}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      설정한 비율(%) 이상 가격이 변경되면 알림을 받습니다
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alertThresholds.reviewChangePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>리뷰 변동 알림 ({field.value}%)</FormLabel>
                    <FormControl>
                      <Slider
                        defaultValue={[field.value]}
                        min={1}
                        max={50}
                        step={1}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      설정한 비율(%) 이상 리뷰가 증가하면 알림을 받습니다
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alertThresholds.newProduct"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>신제품 알림</FormLabel>
                      <FormDescription>
                        경쟁사의 신제품이 등록되면 알림을 받습니다
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alertThresholds.rankChange"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>순위 변동 알림</FormLabel>
                      <FormDescription>
                        상품 순위가 변경되면 알림을 받습니다
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">저장</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}