/** Works on old Android Chrome where MediaQueryList has addListener only. */
export function subscribeMediaQuery(
  media: MediaQueryList,
  handler: () => void
): () => void {
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }
  const legacyHandler = () => handler();
  media.addListener(legacyHandler);
  return () => media.removeListener(legacyHandler);
}
