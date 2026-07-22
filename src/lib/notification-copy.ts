import { subjectParticleName } from "@/lib/icebreaker-ai";

export function objectParticlePhrase(word: string) {
  const name = word.trim() || "할 일";
  const last = name.charCodeAt(name.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    const hasBatchim = (last - 0xac00) % 28 !== 0;
    return hasBatchim ? `${name}을` : `${name}를`;
  }
  return `${name}를`;
}

/** 파트너 연결 알림 본문 */
export function partnerConnectNotifBody(partnerNickname: string) {
  return `파트너 ${subjectParticleName(partnerNickname)} 연결 되었어요!`;
}

/** 리액션 알림 — title에 이모지를 넣어 토스트 아이콘으로 복원 */
export function reactionNotifTitle(reactionEmoji: string) {
  return `리액션 알림|${reactionEmoji}`;
}

export function reactionNotifBody(partnerNickname: string, choreTitle: string) {
  return `${subjectParticleName(partnerNickname)} ${choreTitle}에 리액션을 남겼어요`;
}

export function parseReactionEmojiFromTitle(title: string) {
  if (!title.startsWith("리액션 알림|")) return null;
  const emoji = title.slice("리액션 알림|".length).trim();
  return emoji || null;
}

export function letterNotifBody(partnerNickname: string) {
  const name = partnerNickname.trim() || "파트너";
  return `${name}로부터 편지가 도착했어요`;
}

export function choreDoneNotifBody(partnerNickname: string, choreTitle: string) {
  return `${subjectParticleName(partnerNickname)} ${objectParticlePhrase(choreTitle)} 완료했어요`;
}

export const ONBOARDING_SCREENS = new Set([
  "landing",
  "profile",
  "terms",
  "social",
  "login",
  "invite",
  "inviteCreate",
  "inviteEnter",
]);
