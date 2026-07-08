import { supabase } from "@/lib/supabase";

export type Assignee = "me" | "partner" | "none";

export type AppTask = {
  id: string;
  title: string;
  category: string;
  assignee: Assignee;
  selected: boolean;
  done: boolean;
  reacted: boolean;
};

export type AppLetter = {
  id: string;
  from: "me" | "partner";
  title: string;
  body: string;
  date: string;
  reaction: string;
};

export type Couple = {
  id: string;
  user_a_id: string;
  user_b_id: string | null;
};

export type AppWeeklyStat = {
  id: string;
  completionRate: number;
  weekStart: string;
  weekEnd: string;
};

type ProfileRow = {
  user_id: string;
  nickname: string;
  avatar_emoji: string;
};

type WeeklyChoreRow = {
  id: string;
  title: string;
  category: string;
  assignee: Assignee;
  completed_at: string | null;
  chore_reactions?: { id: string }[];
};

type WeeklyStatRow = {
  cycle_id: string;
  completion_rate: number;
  weekly_cycles: {
    week_start: string;
    week_end: string;
  } | null;
};

type LetterRow = {
  id: string;
  sender_id: string;
  body: string;
  reaction: string | null;
  created_at: string;
};

export const defaultTasks: AppTask[] = [
  { id: "seed-1", title: "바닥 청소", category: "청소", assignee: "me", selected: true, done: false, reacted: false },
  { id: "seed-2", title: "분리수거 하기", category: "청소", assignee: "partner", selected: true, done: false, reacted: false },
  { id: "seed-3", title: "화장실 청소", category: "청소", assignee: "me", selected: true, done: false, reacted: false },
  { id: "seed-4", title: "장보기", category: "생활", assignee: "partner", selected: true, done: false, reacted: false },
  { id: "seed-5", title: "침구 정리", category: "정리정돈", assignee: "none", selected: true, done: false, reacted: false },
  { id: "seed-6", title: "식물 물 주기", category: "생활", assignee: "partner", selected: true, done: false, reacted: false },
];

export const isPersistedId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export async function ensureProfile(userId: string, nickname: string, avatarEmoji: string) {
  const { error } = await supabase.from("profiles").upsert({
    user_id: userId,
    nickname,
    avatar_emoji: avatarEmoji,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,nickname,avatar_emoji")
    .eq("user_id", userId)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  return data;
}

export async function getCurrentCouple() {
  const { data, error } = await supabase
    .from("couples")
    .select("id,user_a_id,user_b_id")
    .limit(1)
    .maybeSingle<Couple>();

  if (error) throw error;
  return data;
}

export async function ensureCouple(userId: string) {
  const existing = await getCurrentCouple();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("couples")
    .insert({ user_a_id: userId })
    .select("id,user_a_id,user_b_id")
    .single<Couple>();

  if (error) throw error;
  return data;
}

export async function createInviteCode(userId: string) {
  const couple = await ensureCouple(userId);
  const existingCode = await getActiveInviteCode(userId);
  if (existingCode) return { code: existingCode, couple };

  const code = `MOA-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { error } = await supabase.from("invite_codes").insert({
    code,
    couple_id: couple.id,
    created_by: userId,
  });

  if (error) throw error;
  return { code, couple };
}

export async function getActiveInviteCode(userId: string) {
  const { data, error } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("created_by", userId)
    .is("used_by", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ code: string }>();

  if (error) throw error;
  return data?.code ?? "";
}

export async function redeemInviteCode(code: string) {
  const { data, error } = await supabase.rpc("redeem_invite_code", {
    p_code: code,
  });

  if (error) throw error;
  return data as string;
}

export function currentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    weekStart: start.toISOString().slice(0, 10),
    weekEnd: end.toISOString().slice(0, 10),
  };
}

export async function ensureCurrentCycle(coupleId: string) {
  const { weekStart, weekEnd } = currentWeekRange();
  const { data, error } = await supabase
    .from("weekly_cycles")
    .upsert(
      {
        couple_id: coupleId,
        week_start: weekStart,
        week_end: weekEnd,
      },
      { onConflict: "couple_id,week_start" },
    )
    .select("id")
    .single<{ id: string }>();

  if (error) throw error;
  return data.id;
}

export async function loadWeeklyChores(cycleId: string): Promise<AppTask[]> {
  const { data, error } = await supabase
    .from("weekly_chores")
    .select("id,title,category,assignee,completed_at,chore_reactions(id)")
    .eq("cycle_id", cycleId)
    .order("created_at", { ascending: true })
    .returns<WeeklyChoreRow[]>();

  if (error) throw error;

  return data.map((task) => ({
    id: task.id,
    title: task.title,
    category: task.category,
    assignee: task.assignee,
    selected: true,
    done: Boolean(task.completed_at),
    reacted: Boolean(task.chore_reactions?.length),
  }));
}

export async function replaceWeeklyChores(cycleId: string, userId: string, tasks: AppTask[]): Promise<AppTask[]> {
  const { error: deleteError } = await supabase.from("weekly_chores").delete().eq("cycle_id", cycleId);
  if (deleteError) throw deleteError;

  const selectedTasks = tasks.filter((task) => task.selected);
  if (selectedTasks.length === 0) return [];

  const { data, error } = await supabase
    .from("weekly_chores")
    .insert(
      selectedTasks.map((task) => ({
        cycle_id: cycleId,
        title: task.title,
        category: task.category,
        assignee: task.assignee,
        completed_by: null,
        completed_at: null,
      })),
    )
    .select("id,title,category,assignee,completed_at")
    .returns<WeeklyChoreRow[]>();

  if (error) throw error;

  return data.map((task) => ({
    id: task.id,
    title: task.title,
    category: task.category,
    assignee: task.assignee,
    selected: true,
    done: Boolean(task.completed_at),
    reacted: false,
  }));
}

export async function insertWeeklyChore(cycleId: string, title: string): Promise<AppTask> {
  const { data, error } = await supabase
    .from("weekly_chores")
    .insert({
      cycle_id: cycleId,
      title,
      category: "추가한 일",
      assignee: "none",
    })
    .select("id,title,category,assignee,completed_at")
    .single<WeeklyChoreRow>();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    category: data.category,
    assignee: data.assignee,
    selected: true,
    done: false,
    reacted: false,
  };
}

export async function updateWeeklyChore(taskId: string, userId: string, patch: Partial<AppTask>) {
  const update: Record<string, string | null> = {};

  if (patch.assignee) update.assignee = patch.assignee;
  if (typeof patch.done === "boolean") {
    update.completed_by = patch.done ? userId : null;
    update.completed_at = patch.done ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) return;

  const { error } = await supabase.from("weekly_chores").update(update).eq("id", taskId);
  if (error) throw error;
}

export async function addChoreReaction(taskId: string, userId: string, reaction: string) {
  const { error } = await supabase.from("chore_reactions").insert({
    chore_id: taskId,
    sender_id: userId,
    reaction,
  });

  if (error) throw error;
}

export async function loadLetters(userId: string): Promise<AppLetter[]> {
  const { data, error } = await supabase
    .from("letters")
    .select("id,sender_id,body,reaction,created_at")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .returns<LetterRow[]>();

  if (error) throw error;

  return data.map((letter) => ({
    id: letter.id,
    from: letter.sender_id === userId ? "me" as const : "partner" as const,
    title: letter.sender_id === userId ? "내가 보낸 편지" : "상대방이 보낸 편지",
    body: letter.body,
    date: new Date(letter.created_at).toLocaleDateString("ko-KR"),
    reaction: letter.reaction ?? "💌",
  }));
}

export async function loadWeeklyStats(coupleId: string): Promise<AppWeeklyStat[]> {
  const { data, error } = await supabase
    .from("weekly_stats")
    .select("cycle_id,completion_rate,weekly_cycles!inner(week_start,week_end,couple_id)")
    .eq("weekly_cycles.couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(12)
    .returns<WeeklyStatRow[]>();

  if (error) throw error;

  return data.map((row) => ({
    id: row.cycle_id,
    completionRate: row.completion_rate,
    weekStart: row.weekly_cycles?.week_start ?? "",
    weekEnd: row.weekly_cycles?.week_end ?? "",
  }));
}

export async function insertLetter({
  cycleId,
  senderId,
  receiverId,
  body,
  reaction,
  weekly,
}: {
  cycleId: string | null;
  senderId: string;
  receiverId: string | null;
  body: string;
  reaction: string;
  weekly: boolean;
}) {
  const { data, error } = await supabase
    .from("letters")
    .insert({
      cycle_id: cycleId,
      sender_id: senderId,
      receiver_id: receiverId,
      kind: weekly ? "weekly" : "instant",
      body,
      reaction,
    })
    .select("id,sender_id,body,reaction,created_at")
    .single<LetterRow>();

  if (error) throw error;

  return {
    id: data.id,
    from: "me" as const,
    title: weekly ? "주간 칭찬을 보냈어요" : "마음을 보냈어요",
    body: data.body,
    date: new Date(data.created_at).toLocaleDateString("ko-KR"),
    reaction: data.reaction ?? reaction,
  };
}

export async function upsertWeeklyStats({
  cycleId,
  completionRate,
  meCompletedCount,
  partnerCompletedCount,
  sentLetterCount,
}: {
  cycleId: string;
  completionRate: number;
  meCompletedCount: number;
  partnerCompletedCount: number;
  sentLetterCount: number;
}) {
  const { error } = await supabase.from("weekly_stats").upsert({
    cycle_id: cycleId,
    completion_rate: completionRate,
    me_completed_count: meCompletedCount,
    partner_completed_count: partnerCompletedCount,
    sent_letter_count: sentLetterCount,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}
