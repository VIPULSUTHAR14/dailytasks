// lib/spotlight.ts: Global cursor tracking spotlight mounted in client layouts
export function initSpotlight(): () => void {
  if (typeof window === "undefined") return () => {};
  let raf = 0;
  const onMove = (e: PointerEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(".spotlight");
    if (!el) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  };
  document.addEventListener("pointermove", onMove, { passive: true });
  return () => document.removeEventListener("pointermove", onMove);
}
