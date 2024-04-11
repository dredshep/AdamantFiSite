import { useEffect } from "react";

export const useResizeObserver = (
  ref: React.RefObject<Element>,
  callback: ResizeObserverCallback
) => {
  useEffect(() => {
    const observer = new ResizeObserver(callback);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref, callback]);
};
