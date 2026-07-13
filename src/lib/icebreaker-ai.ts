export type IcebreakerPerspective =
  | "완료한 일 짚어주기"
  | "내 마음 표현하기"
  | "다음 주 응원하기";

export type WeeklySummaryInput = {
  completed_count: number;
  total_count: number;
  contribution_rate: number;
  completed_items: string[];
};

export type IcebreakerPhrases = Record<IcebreakerPerspective, string[]>;

export const ICEBREAKER_PERSPECTIVES: IcebreakerPerspective[] = [
  "완료한 일 짚어주기",
  "내 마음 표현하기",
  "다음 주 응원하기",
];

const HISTORY_ROUNDS = 8;

function historyStorageKey(userId: string) {
  return `moaseong-icebreaker-history:${userId}`;
}

function emptyPhrases(): IcebreakerPhrases {
  return {
    "완료한 일 짚어주기": [],
    "내 마음 표현하기": [],
    "다음 주 응원하기": [],
  };
}

/** 사용자별 최근 8회 노출분(관점당 최대 24개) 슬라이딩 윈도우 */
export function loadRecentIcebreakerPhrases(userId: string | null | undefined): IcebreakerPhrases {
  const recent = emptyPhrases();
  if (!userId || typeof window === "undefined") return recent;

  try {
    const raw = window.localStorage.getItem(historyStorageKey(userId));
    if (!raw) return recent;
    const parsed = JSON.parse(raw) as { rounds?: IcebreakerPhrases[] };
    const rounds = Array.isArray(parsed.rounds) ? parsed.rounds.slice(-HISTORY_ROUNDS) : [];

    for (const round of rounds) {
      for (const perspective of ICEBREAKER_PERSPECTIVES) {
        const list = round?.[perspective];
        if (!Array.isArray(list)) continue;
        recent[perspective].push(...list.filter((item): item is string => typeof item === "string"));
      }
    }

    for (const perspective of ICEBREAKER_PERSPECTIVES) {
      recent[perspective] = recent[perspective].slice(-HISTORY_ROUNDS * 3);
    }
  } catch {
    // 이력 파싱 실패 시 빈 이력으로 진행
  }

  return recent;
}

export function rememberIcebreakerPhrases(userId: string | null | undefined, phrases: IcebreakerPhrases) {
  if (!userId || typeof window === "undefined") return;

  try {
    const key = historyStorageKey(userId);
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as { rounds?: IcebreakerPhrases[] }) : { rounds: [] };
    const rounds = Array.isArray(parsed.rounds) ? parsed.rounds : [];
    rounds.push(phrases);
    window.localStorage.setItem(
      key,
      JSON.stringify({ rounds: rounds.slice(-HISTORY_ROUNDS) }),
    );
  } catch {
    // 저장 실패해도 문구 사용은 가능
  }
}

/** H-01: 서버 /api/icebreaker → OpenAI gpt-5.4-mini */
export async function requestIcebreakerPhrases({
  partnerNickname,
  weeklySummary,
  userId,
  recentPhrasesByPerspective,
}: {
  partnerNickname: string;
  weeklySummary: WeeklySummaryInput;
  userId?: string | null;
  recentPhrasesByPerspective?: Partial<Record<IcebreakerPerspective, string[]>>;
}): Promise<IcebreakerPhrases> {
  const recent = recentPhrasesByPerspective
    ?? (userId ? loadRecentIcebreakerPhrases(userId) : emptyPhrases());

  const response = await fetch("/api/icebreaker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partnerNickname,
      weeklySummary,
      recentPhrasesByPerspective: recent,
    }),
  });

  const payload = (await response.json()) as {
    phrases?: IcebreakerPhrases;
    error?: string;
  };

  if (!response.ok || !payload.phrases) {
    throw new Error(payload.error || "AI 응답에 실패했어요.");
  }

  rememberIcebreakerPhrases(userId, payload.phrases);
  return payload.phrases;
}

export function subjectParticleName(nickname: string) {
  const name = nickname.trim() || "파트너";
  const last = name.charCodeAt(name.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) {
    const hasBatchim = (last - 0xac00) % 28 !== 0;
    return hasBatchim ? `${name}이` : `${name}가`;
  }
  return `${name}가`;
}
