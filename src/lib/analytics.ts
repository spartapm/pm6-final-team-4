import type { IcebreakerPerspective } from "@/lib/icebreaker-ai";

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

/** AI 말문틔우기 관점 → GA perspective_type */
export const AI_PERSPECTIVE_TYPE: Record<IcebreakerPerspective, string> = {
  "완료한 일 짚어주기": "task_recognition",
  "내 마음 표현하기": "express_feelings",
  "다음 주 응원하기": "encourage_next_week",
};

export function isManualChoreId(id: string) {
  return id.startsWith("custom-") || id.startsWith("draft-");
}

export function countTodoInputTypes(tasks: { id: string; selected?: boolean }[]) {
  const selected = tasks.filter((task) => task.selected !== false);
  let templateCount = 0;
  let manualCount = 0;
  for (const task of selected) {
    if (isManualChoreId(task.id)) manualCount += 1;
    else templateCount += 1;
  }
  return {
    todo_count: selected.length,
    template_count: templateCount,
    manual_count: manualCount,
  };
}
