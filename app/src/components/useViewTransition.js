import { useCallback, useRef } from "react";
import { flushSync } from "react-dom";

/**
 * 把一次 state 更新包進瀏覽器的 View Transition，讓有登記 view-transition-name
 * 的元素自動在新舊畫面之間平移、淡入淡出。
 *
 * 作品集篩選就是靠這個：切分類時卡片的數量與位置都會變，不包轉場的話卡片是
 * 硬生生消失／出現。這裡沒有引入動畫套件——View Transition 是瀏覽器內建的行為，
 * 多加一個 dependency 換不到更好的結果。
 *
 * 下面三種情況直接即時更新、不做轉場：
 *   1. 瀏覽器還沒有 View Transition API（Safari 18、Firefox 139 以前）
 *   2. 使用者系統設定了「減少動態效果」
 *   3. 上一個轉場還在跑——此時再開一個會讓畫面閃一下
 * 換句話說，沒有轉場時行為與改動前完全相同，不會壞掉。
 */
export default function useViewTransition() {
  const running = useRef(false);

  return useCallback((update) => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (running.current || reduce || typeof document.startViewTransition !== "function") {
      update();
      return;
    }

    running.current = true;
    const transition = document.startViewTransition(() => {
      // 一定要 flushSync：瀏覽器要在這個 callback 回來時就拍到「新畫面」的快照，
      // 而 React 18 預設把 setState 排進非同步佇列，不強制同步更新的話拍到的還是舊畫面。
      flushSync(update);
    });

    // 轉場被後來的轉場打斷時 finished 會被 reject，所以兩個結果都要接，
    // 否則 running 會永遠卡在 true，之後就再也不會轉場了。
    const done = () => {
      running.current = false;
    };
    transition.finished.then(done, done);
  }, []);
}
