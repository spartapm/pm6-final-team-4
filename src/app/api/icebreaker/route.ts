import { NextResponse } from "next/server";
import {
  ICEBREAKER_PERSPECTIVES,
  type IcebreakerPerspective,
  type IcebreakerPhrases,
  type WeeklySummaryInput,
} from "@/lib/icebreaker-ai";
import { buildIcebreakerUserPrompt, ICEBREAKER_SYSTEM_PROMPT } from "@/lib/icebreaker-prompt";

export const runtime = "nodejs";

type RequestBody = {
  partnerNickname?: string;
  weeklySummary?: WeeklySummaryInput;
  recentPhrasesByPerspective?: Partial<Record<IcebreakerPerspective, string[]>>;
};

function emptyRecent(): Record<IcebreakerPerspective, string[]> {
  return {
    "완료한 일 짚어주기": [],
    "내 마음 표현하기": [],
    "다음 주 응원하기": [],
  };
}

function normalizePhrases(raw: unknown): IcebreakerPhrases | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const result = emptyRecent() as IcebreakerPhrases;

  for (const perspective of ICEBREAKER_PERSPECTIVES) {
    const list = source[perspective];
    if (!Array.isArray(list)) return null;
    const phrases = list
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.replace(/[.!?\u3002\uFF01\uFF1F]/g, "").trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 3);
    if (phrases.length !== 3) return null;
    result[perspective] = phrases;
  }

  return result;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY 가 설정되지 않았어요." },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const weeklySummary = body.weeklySummary;
  if (!weeklySummary || typeof weeklySummary !== "object") {
    return NextResponse.json({ error: "weekly_summary 가 필요해요." }, { status: 400 });
  }

  const recent = emptyRecent();
  for (const perspective of ICEBREAKER_PERSPECTIVES) {
    const list = body.recentPhrasesByPerspective?.[perspective];
    recent[perspective] = Array.isArray(list)
      ? list.filter((item): item is string => typeof item === "string").slice(-24)
      : [];
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5.4-mini";
  const userPrompt = buildIcebreakerUserPrompt({
    partnerNickname: body.partnerNickname?.trim() || "파트너",
    weeklySummary: {
      completed_count: Number(weeklySummary.completed_count) || 0,
      total_count: Number(weeklySummary.total_count) || 0,
      contribution_rate: Number(weeklySummary.contribution_rate) || 0,
      completed_items: Array.isArray(weeklySummary.completed_items)
        ? weeklySummary.completed_items.filter((item): item is string => typeof item === "string").slice(0, 30)
        : [],
    },
    recentPhrasesByPerspective: recent,
  });

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ICEBREAKER_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const payload = (await openaiRes.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    if (!openaiRes.ok) {
      console.warn("OpenAI icebreaker error:", payload.error?.message ?? openaiRes.status);
      return NextResponse.json(
        { error: payload.error?.message || "AI 응답에 실패했어요." },
        { status: 502 },
      );
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI 응답이 비어 있어요." }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "AI 응답 형식을 읽지 못했어요." }, { status: 502 });
    }

    const phrases = normalizePhrases(parsed);
    if (!phrases) {
      return NextResponse.json({ error: "AI 응답 형식이 올바르지 않아요." }, { status: 502 });
    }

    return NextResponse.json({ phrases });
  } catch (error) {
    console.warn("OpenAI icebreaker request failed:", error);
    return NextResponse.json({ error: "AI 요청 중 오류가 났어요." }, { status: 502 });
  }
}
