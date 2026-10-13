import { useEffect, useRef } from "react";
import { revealWhenVisible } from "./revealQueue.js";

// delay：進場動畫延後幾毫秒才開始，同一排的多個項目可以用它錯開。
// 卡片牆就是靠這個讓同一列的卡片由左而右依序淡入。
export default function Reveal({
  as: Tag = "section",
  className = "",
  delay = 0,
  style,
  children,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 不做動畫時直接進場即可；下面那條 prefers-reduced-motion 的 CSS 也會
    // 強制 .reveal 保持可見，這裡只是少留一個待進場的元素。
    if (reduce) {
      el.classList.add("in");
      return;
    }

    return revealWhenVisible(el);
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={delay ? { ...style, animationDelay: `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
