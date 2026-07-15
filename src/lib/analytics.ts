declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export const GTM_ID = "GTM-MR72LD65";
export const GA4_MEASUREMENT_ID = "G-1DX6C2SMT1";

/** GTM dataLayer push — Custom Event 트리거와 이벤트명이 일치해야 함 */
export function trackEvent(
  event: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  const payload: Record<string, unknown> = { event };
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    payload[key] = value;
  }
  window.dataLayer.push(payload);
}
