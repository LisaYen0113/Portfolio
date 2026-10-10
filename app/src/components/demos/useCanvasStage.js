import { useEffect, useRef, useState } from "react";

/** 高解析手機的繪製成本上限，超過 2 沒有視覺效益 */
const MAX_DPR = 2;

/**
 * 管理一個 canvas 的完整生命週期：尺寸、動畫迴圈、資源釋放。
 *
 * 釋放不是最佳化而是必要：換頁時若未釋放 WebGL context，
 * 連續瀏覽數頁就會耗盡瀏覽器約 16 個的上限，導致後續 canvas 全部失效。
 */
export default function useCanvasStage({ init, frame, onResize }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  // 用 ref 保存最新的 callback，讓 effect 只需執行一次
  const latest = useRef({ init, frame, onResize });
  latest.current = { init, frame, onResize };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    let disposed = false;
    let rafId = 0;
    let cleanup = null;
    let last = performance.now();
    const started = last;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      return {
        canvas,
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
        dpr: Math.min(window.devicePixelRatio || 1, MAX_DPR),
      };
    };

    const applySize = (size) => {
      canvas.width = Math.round(size.width * size.dpr);
      canvas.height = Math.round(size.height * size.dpr);
    };

    let failed = false;
    try {
      const size = measure();
      applySize(size);
      cleanup = latest.current.init?.(size);
    } catch (e) {
      failed = true;
      setError(e);
    }

    let observer = null;
    if (!failed) {
      const tick = (now) => {
        if (disposed) return;
        // 分頁切換回來時 dt 會非常大，設上限避免動畫一次跳掉
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        try {
          latest.current.frame?.({ dt, elapsed: (now - started) / 1000 });
        } catch (e) {
          setError(e);
          return;
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => {
          if (disposed) return;
          const size = measure();
          applySize(size);
          latest.current.onResize?.(size);
        });
        observer.observe(container);
      }
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      // 即使 init 拋錯，cleanup 仍要執行——init 可能在建立 renderer 之後才失敗，
      // 此時若不執行 cleanup 就會洩漏一個 WebGL context
      try {
        cleanup?.();
      } catch (e) {
        if (import.meta.env.DEV) console.error("[demo] 釋放資源時發生錯誤:", e);
      }
    };
  }, []);

  return { containerRef, canvasRef, error };
}
