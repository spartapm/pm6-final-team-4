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

/** 추후 실제 LLM API로 교체. 설계 문서: docs/H-01-말문틔우기-AI-프롬프트.md */
export async function requestIcebreakerPhrases({
  partnerNickname,
  weeklySummary,
}: {
  partnerNickname: string;
  weeklySummary: WeeklySummaryInput;
  recentPhrasesByPerspective?: Partial<Record<IcebreakerPerspective, string[]>>;
}): Promise<IcebreakerPhrases> {
  await new Promise((resolve) => setTimeout(resolve, 450));

  const name = partnerNickname.trim() || "파트너";
  const items = weeklySummary.completed_items;
  const itemA = items[0] ?? "집안일";
  const itemB = items[1] ?? items[0] ?? "할 일";
  const rate = weeklySummary.contribution_rate;
  const done = weeklySummary.completed_count;

  return {
    "완료한 일 짚어주기": [
      `${itemA} 해줘서 `,
      `${itemA}이랑 ${itemB} 보니까 `,
      `이번 주 ${itemA}까지 챙겨줘서 `,
    ].map((text) => text.slice(0, 40)),
    "내 마음 표현하기": [
      `이번 주 네가 해준 거 생각하니까 `,
      `혼자 다 한 것 같아서 `,
      `문득 고마운 마음이 들어서 `,
    ].map((text) => text.slice(0, 40)),
    "다음 주 응원하기": [
      `이번 주 ${done}개나 해낸 거 보면 `,
      `기여율 ${rate}%까지 간 거 보니까 `,
      `다음 주도 이렇게 같이 가면 `,
    ].map((text) => text.slice(0, 40)),
  };
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
