import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, PaintBucket, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    background: string[];
    border: string[];
    radar: string[];
  };
}

// 미리 정의된 색상 팔레트들
export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: "pastel",
    name: "파스텔",
    colors: {
      background: [
        'rgba(79, 142, 247, 0.4)',   // 밝은 파랑
        'rgba(64, 192, 153, 0.4)',   // 민트
        'rgba(252, 128, 128, 0.4)',  // 연한 빨강
        'rgba(248, 175, 97, 0.4)',   // 연한 주황
        'rgba(147, 115, 237, 0.4)',  // 연한 보라
        'rgba(247, 121, 167, 0.4)',  // 연한 분홍
      ],
      border: [
        'rgba(79, 142, 247, 0.7)',
        'rgba(64, 192, 153, 0.7)', 
        'rgba(252, 128, 128, 0.7)',
        'rgba(248, 175, 97, 0.7)',
        'rgba(147, 115, 237, 0.7)',
        'rgba(247, 121, 167, 0.7)',
      ],
      radar: [
        'rgba(79, 142, 247, 0.1)',
        'rgba(64, 192, 153, 0.1)',
        'rgba(252, 128, 128, 0.1)',
        'rgba(248, 175, 97, 0.1)',
        'rgba(147, 115, 237, 0.1)',
        'rgba(247, 121, 167, 0.1)',
      ]
    }
  },
  {
    id: "modern",
    name: "모던",
    colors: {
      background: [
        'rgba(45, 55, 72, 0.6)',     // 진한 남색
        'rgba(56, 161, 105, 0.6)',   // 그린
        'rgba(229, 62, 62, 0.6)',    // 빨강
        'rgba(214, 158, 46, 0.6)',   // 골드
        'rgba(113, 128, 150, 0.6)',  // 슬레이트
        'rgba(186, 74, 135, 0.6)',   // 자주색
      ],
      border: [
        'rgba(45, 55, 72, 0.85)',
        'rgba(56, 161, 105, 0.85)',
        'rgba(229, 62, 62, 0.85)',
        'rgba(214, 158, 46, 0.85)',
        'rgba(113, 128, 150, 0.85)',
        'rgba(186, 74, 135, 0.85)',
      ],
      radar: [
        'rgba(45, 55, 72, 0.15)',
        'rgba(56, 161, 105, 0.15)',
        'rgba(229, 62, 62, 0.15)',
        'rgba(214, 158, 46, 0.15)',
        'rgba(113, 128, 150, 0.15)',
        'rgba(186, 74, 135, 0.15)',
      ]
    }
  },
  {
    id: "vivid",
    name: "비비드",
    colors: {
      background: [
        'rgba(66, 153, 225, 0.7)',   // 밝은 파랑
        'rgba(72, 187, 120, 0.7)',   // 밝은 녹색
        'rgba(237, 100, 166, 0.7)',  // 핑크
        'rgba(246, 173, 85, 0.7)',   // 주황
        'rgba(159, 122, 234, 0.7)',  // 보라
        'rgba(237, 137, 54, 0.7)',   // 진한 주황
      ],
      border: [
        'rgba(66, 153, 225, 1)',
        'rgba(72, 187, 120, 1)',
        'rgba(237, 100, 166, 1)',
        'rgba(246, 173, 85, 1)',
        'rgba(159, 122, 234, 1)',
        'rgba(237, 137, 54, 1)',
      ],
      radar: [
        'rgba(66, 153, 225, 0.15)',
        'rgba(72, 187, 120, 0.15)',
        'rgba(237, 100, 166, 0.15)',
        'rgba(246, 173, 85, 0.15)',
        'rgba(159, 122, 234, 0.15)',
        'rgba(237, 137, 54, 0.15)',
      ]
    }
  },
  {
    id: "minimal",
    name: "미니멀",
    colors: {
      background: [
        'rgba(160, 174, 192, 0.5)',  // 회색 1
        'rgba(113, 128, 150, 0.5)',  // 회색 2
        'rgba(74, 85, 104, 0.5)',    // 회색 3
        'rgba(45, 55, 72, 0.5)',     // 회색 4
        'rgba(26, 32, 44, 0.5)',     // 회색 5
        'rgba(203, 213, 224, 0.5)',  // 회색 6
      ],
      border: [
        'rgba(160, 174, 192, 0.8)',
        'rgba(113, 128, 150, 0.8)',
        'rgba(74, 85, 104, 0.8)',
        'rgba(45, 55, 72, 0.8)',
        'rgba(26, 32, 44, 0.8)',
        'rgba(203, 213, 224, 0.8)',
      ],
      radar: [
        'rgba(160, 174, 192, 0.15)',
        'rgba(113, 128, 150, 0.15)',
        'rgba(74, 85, 104, 0.15)',
        'rgba(45, 55, 72, 0.15)',
        'rgba(26, 32, 44, 0.15)',
        'rgba(203, 213, 224, 0.15)',
      ]
    }
  }
];

interface ColorPaletteSelectorProps {
  selectedPaletteId: string;
  onSelectPalette: (palette: ColorPalette) => void;
}

export function ColorPaletteSelector({ 
  selectedPaletteId,
  onSelectPalette 
}: ColorPaletteSelectorProps) {
  const [open, setOpen] = useState(false);
  
  // 현재 선택된 팔레트 찾기
  const selectedPalette = COLOR_PALETTES.find(p => p.id === selectedPaletteId) || COLOR_PALETTES[0];
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 border-dashed flex items-center gap-1"
        >
          <Palette className="h-3.5 w-3.5 mr-1" />
          <span>{selectedPalette.name}</span>
          <div className="flex ml-2">
            {selectedPalette.colors.background.slice(0, 3).map((color, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-full border border-gray-200"
                style={{ background: color, marginLeft: i > 0 ? '-3px' : undefined }}
              />
            ))}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-2" align="end">
        <div className="grid gap-1">
          <div className="text-sm font-medium mb-1 px-1">색상 팔레트</div>
          {COLOR_PALETTES.map((palette) => {
            const isSelected = palette.id === selectedPaletteId;
            return (
              <Button
                key={palette.id}
                variant="ghost"
                className={cn(
                  "justify-start text-xs font-normal w-full px-2 py-1 h-auto",
                  isSelected && "bg-accent"
                )}
                onClick={() => {
                  onSelectPalette(palette);
                  setOpen(false);
                }}
              >
                <div className="flex items-center w-full">
                  <div className="flex mr-2">
                    {palette.colors.background.slice(0, 5).map((color, i) => (
                      <div
                        key={i}
                        className="h-3 w-3 rounded-full border border-gray-200"
                        style={{ background: color, marginLeft: i > 0 ? '-3px' : undefined }}
                      />
                    ))}
                  </div>
                  <span className="flex-1">{palette.name}</span>
                  {isSelected && <Check className="h-4 w-4 ml-auto" />}
                </div>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}