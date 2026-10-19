"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function ChartPlaceholder() {
  return (
    <div
      role="status"
      className="flex h-full items-center justify-center text-sm text-muted-foreground"
    >
      Memuat grafik…
    </div>
  );
}

export function ChartViewport({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className="h-80 w-full min-w-0" aria-label={label}>
      {visible ? children : <ChartPlaceholder />}
    </div>
  );
}
