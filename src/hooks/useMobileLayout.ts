import { useEffect, useState } from "react";

const MOBILE_LAYOUT_QUERY = "(max-width: 900px)";

export function useMobileLayout(): boolean {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(MOBILE_LAYOUT_QUERY).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(MOBILE_LAYOUT_QUERY);
    const onChange = () => setMobile(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return mobile;
}
