/**
 * 全站共用一個捲動監聽，負責在元素捲進畫面時補上 .in。
 *
 * 這裡刻意不用 IntersectionObserver。IO 只在「相交狀態改變」時回報，元素若從
 * 畫面下方直接跳到畫面上方（按 End、拖捲軸、快速滑動），前後兩次都是不相交，
 * 回呼根本不會來，那個區塊就永遠停在 opacity: 0——內容直接消失，而且畫面上
 * 看不出任何錯誤。每次捲動重新量一次位置就沒有這個漏洞。
 *
 * 代價是每個 frame 讀幾次 getBoundingClientRect。全部量完才改 class，不會
 * 邊讀邊寫造成反覆重排；待進場的元素清空後會把監聽整個拿掉，之後捲動不做事。
 */

const pending = new Set();
let frame = 0;

// 觸發線在畫面底部再往上一點：元素露出一小截就進場，而不是等它整塊進來。
// 比觸發線高（top 更小）就算數，所以已經被捲過頭的元素同樣會進場。
const TRIGGER_RATIO = 0.92;

function flush() {
  frame = 0;
  const line = window.innerHeight * TRIGGER_RATIO;
  const ready = [];
  for (const el of pending) {
    if (el.getBoundingClientRect().top < line) ready.push(el);
  }
  for (const el of ready) {
    pending.delete(el);
    el.classList.add("in");
  }
  if (pending.size === 0) detach();
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(flush);
}

function attach() {
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
}

function detach() {
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
}

/**
 * 元素越過觸發線時幫它加上 .in。回傳取消註冊的函式（元件卸載時用）。
 */
export function revealWhenVisible(el) {
  if (pending.size === 0) attach();
  pending.add(el);
  schedule();

  return () => {
    pending.delete(el);
    if (pending.size === 0) detach();
  };
}
