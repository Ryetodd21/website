"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Observe whether an element has entered the viewport.
 *
 * Fires once per element: as soon as it crosses the threshold the observer
 * disconnects so the entrance animation is never re-played on re-scroll.
 * Use together with the `.in-view` CSS rule to replay the fadeSlideUp keyframe.
 */
export function useInView<T extends Element = HTMLDivElement>(
  options: IntersectionObserverInit = {
    threshold: 0.12,
    rootMargin: "0px 0px -8% 0px",
  },
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      options,
    );
    obs.observe(el);
    return () => obs.disconnect();
    // options object identity is treated as constant at call-site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return { ref, inView } as const;
}
