import type { AppNotification, AppTask } from "@/lib/moaseong-db";

/** UT용 홈/알림 조용한 폴링 간격 (3~5초 권장) */
export const QUIET_POLL_INTERVAL_MS = 4000;

export type LetterStatusSnapshot = {
  meSent: boolean;
  partnerSent: boolean;
  bothSent: boolean;
};

export function tasksFingerprint(tasks: AppTask[]) {
  return tasks
    .map((task) => `${task.id}:${Number(task.done)}:${task.assignee}:${Number(task.reacted)}:${task.title}`)
    .join("|");
}

export function notificationsFingerprint(items: AppNotification[]) {
  return items
    .map((item) => `${item.id}:${Number(item.read)}:${item.title}:${item.body}`)
    .join("|");
}

export function letterStatusFingerprint(status: LetterStatusSnapshot) {
  return `${Number(status.meSent)}:${Number(status.partnerSent)}:${Number(status.bothSent)}`;
}
