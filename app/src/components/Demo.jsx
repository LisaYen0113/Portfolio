import { Component, Suspense, useEffect, useRef, useState } from "react";
import Reveal from "./Reveal.jsx";
import SectionHead from "./SectionHead.jsx";
import registry from "./demos/registry.js";

/** 提前 200px 開始載入，讓使用者捲到時已經就緒 */
const PRELOAD_MARGIN = "200px 0px";

function DemoLoading() {
  return (
    <div className="demo-stage">
      <p className="demo-fallback">展示載入中…</p>
    </div>
  );
}

function DemoFallback({ reason }) {
  return (
    <div className="demo-stage">
      <p className="demo-fallback">
        此互動展示無法在此裝置上執行{reason ? `（${reason}）` : ""}。
        展示內容需要 WebGL 與 JavaScript，請改用支援的瀏覽器，或開啟硬體加速後重新整理。
      </p>
    </div>
  );
}

/** 單一 demo 的錯誤不得影響整頁 */
class DemoBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error("[demo] 元件發生錯誤:", error, info);
  }

  render() {
    if (this.state.error) return <DemoFallback reason={this.state.error.message} />;
    return this.props.children;
  }
}

/** 捲到附近才回傳 true，避免一次建立多個 WebGL context */
function useNearViewport(ref) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, near]);

  return near;
}

export default function Demo({ block, anchor }) {
  const hostRef = useRef(null);
  const near = useNearViewport(hostRef);
  const DemoComponent = registry[block.demo];

  return (
    <Reveal className="section" data-od-id={anchor}>
      <SectionHead idx={block.idx} heading={block.heading} />

      <div ref={hostRef}>
        {!DemoComponent ? (
          <DemoFallback reason={`未知的展示「${block.demo}」`} />
        ) : near ? (
          <DemoBoundary>
            <Suspense fallback={<DemoLoading />}>
              <DemoComponent />
            </Suspense>
          </DemoBoundary>
        ) : (
          <DemoLoading />
        )}
      </div>

      {block.caption && <p className="demo-caption">{block.caption}</p>}
      {block.note && <p className="demo-note">{block.note}</p>}
    </Reveal>
  );
}
