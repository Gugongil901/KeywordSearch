import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
  duration?: number;
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
}

/**
 * 고성능 키워드나 중요 이벤트를 발견했을 때 축하 효과를 보여주는 컴포넌트
 * @param trigger - confetti 효과를 실행할지 여부 (true면 실행)
 * @param duration - 효과 지속 시간 (밀리초)
 * @param particleCount - 파티클 수 (많을수록 화려함)
 * @param spread - 파티클이 퍼지는 각도 (360이면 원형으로 퍼짐)
 * @param origin - 효과가 시작되는 위치 (x, y 좌표, 0~1 사이 값)
 */
export function ConfettiEffect({ 
  trigger, 
  duration = 3000, 
  particleCount = 100,
  spread = 100,
  origin = { x: 0.5, y: 0.5 }
}: ConfettiEffectProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (trigger && !isAnimating) {
      setIsAnimating(true);
      
      // 축하 효과 실행
      confetti({
        particleCount,
        spread,
        origin,
        colors: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3'],
        zIndex: 1000,
        disableForReducedMotion: true
      });

      // 추가 효과
      setTimeout(() => {
        confetti({
          particleCount: particleCount / 2,
          angle: 60,
          spread: spread / 1.5,
          origin: { x: 0.1, y: 0.5 },
          colors: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3'],
          zIndex: 1000,
          disableForReducedMotion: true
        });
      }, 250);

      setTimeout(() => {
        confetti({
          particleCount: particleCount / 2,
          angle: 120,
          spread: spread / 1.5,
          origin: { x: 0.9, y: 0.5 },
          colors: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3'],
          zIndex: 1000,
          disableForReducedMotion: true
        });
      }, 400);

      // 애니메이션 상태 초기화
      setTimeout(() => {
        setIsAnimating(false);
      }, duration);
    }
  }, [trigger, isAnimating, duration, particleCount, spread, origin]);

  // 실제 DOM에는 아무것도 렌더링하지 않음 (효과만 보여줌)
  return null;
}

/**
 * 수치 데이터가 특정 기준을 넘었을 때 confetti 효과를 트리거하는 유틸리티 함수
 * @param value - 비교할 값
 * @param threshold - 기준값
 * @param previousValue - 이전 값 (변화 감지 시 필요)
 * @returns 효과를 보여줄지 여부
 */
export function shouldTriggerConfetti(value: number, threshold: number, previousValue?: number): boolean {
  // 값이 기준치를 넘고, 이전값이 있다면 증가했을 때만 효과 표시
  if (value >= threshold) {
    if (previousValue === undefined || value > previousValue) {
      return true;
    }
  }
  return false;
}