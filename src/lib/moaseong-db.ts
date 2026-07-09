import { supabase } from "@/lib/supabase";
import { buildCatalogTasks, iconKeyForCategory, TaskIconKey } from "@/lib/chore-catalog";

export type Assignee = "me" | "partner" | "none";

export type AppTask = {
  id: string;
  title: string;
  category: string;
  iconKey?: TaskIconKey;
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

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  date: string;
};

export type AppChoreTemplate = {
  id: string;
  title: string;
  category: string;
  iconKey?: TaskIconKey;
};

export type AppWeeklyStat = {
  id: string;
  completionRate: number;
  weekStart: string;
  weekEnd: string;
};

export type AppPartnerProfile = {
  userId: string;
  nickname: string;
  avatarEmoji: string;
};

export type Couple = {
  id: string;
  user_a_id: string;
  user_b_id: string | null;
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
  kind?: "instant" | "weekly";
};

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type ChoreTemplateRow = {
  id: string;
  title: string;
  category: string;
};

export const defaultTasks: AppTask[] = buildCatalogTasks();

export const isPersistedId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

function mapChoreRow(task: WeeklyChoreRow): AppTask {
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    iconKey: iconKeyForCategory(task.category),
    assignee: task.assignee,
    selected: true,
    done: Boolean(task.completed_at),
    reacted: Boolean(task.chore_reactions?.length),
  };
}

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

export async function getPartnerProfile(userId: string | null): Promise<AppPartnerProfile | null> {
  if (!userId) return null;
  const profile = await getProfile(userId);
  if (!profile) return null;
  return {
    userId: profile.user_id,
    nickname: profile.nickname,
    avatarEmoji: profile.avatar_emoji,
  };
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

export function parseInviteError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("invalid_invite_code")) return "올바르지 않은 초대 코드예요.";
  if (message.includes("already_connected")) return "이미 연결된 코드예요.";
  if (message.includes("cannot_use_own_invite_code")) return "내 코드는 직접 사용할 수 없어요.";
  return "초대 코드 처리에 실패했어요. 다시 시도해 주세요.";
}

export async function redeemInviteCode(code: string) {
  const { data, error } = await supabase.rpc("redeem_invite_code", {
    p_code: code,
  });

  if (error) throw error;
  return data as string;
}

export function currentWeekRange(offsetWeeks = 0) {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday + offsetWeeks * 7);
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

export async function coupleHasWeeklyChores(coupleId: string) {
  const cycleId = await ensureCurrentCycle(coupleId);
  const chores = await loadWeeklyChores(cycleId);
  return chores.length > 0;
}

export async function loadWeeklyChores(cycleId: string): Promise<AppTask[]> {
  const { data, error } = await supabase
    .from("weekly_chores")
    .select("id,title,category,assignee,completed_at,chore_reactions(id)")
    .eq("cycle_id", cycleId)
    .order("created_at", { ascending: true })
    .returns<WeeklyChoreRow[]>();

  if (error) throw error;
  return data.map(mapChoreRow);
}

export async function loadPreviousCycleChores(coupleId: string): Promise<AppTask[]> {
  const { weekStart } = currentWeekRange(-1);
  const { data, error } = await supabase
    .from("weekly_cycles")
    .select("id,weekly_chores(id,title,category,assignee,completed_at,chore_reactions(id))")
    .eq("couple_id", coupleId)
    .eq("week_start", weekStart)
    .maybeSingle<{ id: string; weekly_chores: WeeklyChoreRow[] | null }>();

  if (error) throw error;
  if (!data?.weekly_chores?.length) return [];

  return data.weekly_chores.map((task) => ({
    ...mapChoreRow(task),
    selected: true,
    done: false,
    reacted: false,
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
    ...mapChoreRow(task),
    selected: true,
    done: false,
    reacted: false,
  }));
}

export async function insertWeeklyChore(cycleId: string, title: string, category = "추가한 일"): Promise<AppTask> {
  const { data, error } = await supabase
    .from("weekly_chores")
    .insert({
      cycle_id: cycleId,
      title,
      category,
      assignee: "none",
    })
    .select("id,title,category,assignee,completed_at")
    .single<WeeklyChoreRow>();

  if (error) throw error;

  return {
    ...mapChoreRow(data),
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

export async function createNotification({
  userId,
  choreId,
  title,
  body,
}: {
  userId: string;
  choreId?: string;
  title: string;
  body: string;
}) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    chore_id: choreId ?? null,
    title,
    body,
  });

  if (error) throw error;
}

export async function loadNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,read_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30)
    .returns<NotificationRow[]>();

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    read: Boolean(row.read_at),
    date: new Date(row.created_at).toLocaleDateString("ko-KR"),
  }));
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

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

export async function getWeeklyLetterStatus(cycleId: string, userId: string, partnerId: string | null) {
  const { data, error } = await supabase
    .from("letters")
    .select("sender_id,kind")
    .eq("cycle_id", cycleId)
    .eq("kind", "weekly")
    .returns<{ sender_id: string; kind: string }[]>();

  if (error) throw error;

  const meSent = data.some((letter) => letter.sender_id === userId);
  const partnerSent = partnerId ? data.some((letter) => letter.sender_id === partnerId) : false;

  return { meSent, partnerSent, bothSent: meSent && partnerSent };
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

export async function countCompletedWeekStreak(coupleId: string) {
  const stats = await loadWeeklyStats(coupleId);
  let streak = 0;
  for (const stat of stats) {
    if (stat.completionRate >= 100) streak += 1;
    else break;
  }
  return streak;
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

export async function closeWeeklyCycle(cycleId: string) {
  const { error } = await supabase
    .from("weekly_cycles")
    .update({ closed_at: new Date().toISOString() })
    .eq("id", cycleId);

  if (error) throw error;
}

export async function startNextWeekCycle(coupleId: string, tasks: AppTask[]) {
  const { weekStart, weekEnd } = currentWeekRange(1);
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

  const nextTasks = tasks.map((task) => ({
    ...task,
    selected: true,
    done: false,
    reacted: false,
  }));

  const savedTasks = await replaceWeeklyChores(data.id, "", nextTasks);
  return { cycleId: data.id, tasks: savedTasks };
}

export async function loadChoreTemplates(userId: string): Promise<AppChoreTemplate[]> {
  const { data, error } = await supabase
    .from("chore_templates")
    .select("id,title,category")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .returns<ChoreTemplateRow[]>();

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    iconKey: iconKeyForCategory(row.category),
  }));
}

export async function createChoreTemplate(userId: string, title: string, category: string) {
  const { data, error } = await supabase
    .from("chore_templates")
    .insert({ owner_id: userId, title, category })
    .select("id,title,category")
    .single<ChoreTemplateRow>();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    category: data.category,
    iconKey: iconKeyForCategory(data.category),
  };
}

export async function updateChoreTemplate(templateId: string, title: string, category: string) {
  const { error } = await supabase
    .from("chore_templates")
    .update({ title, category })
    .eq("id", templateId);

  if (error) throw error;
}

export async function deleteChoreTemplate(templateId: string) {
  const { error } = await supabase.from("chore_templates").delete().eq("id", templateId);
  if (error) throw error;
}

export async function seedDefaultTemplates(userId: string) {
  const existing = await loadChoreTemplates(userId);
  if (existing.length > 0) return existing;

  const rows = defaultTasks.map((task) => ({
    owner_id: userId,
    title: task.title,
    category: task.category,
  }));

  const { data, error } = await supabase
    .from("chore_templates")
    .insert(rows)
    .select("id,title,category")
    .returns<ChoreTemplateRow[]>();

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    iconKey: iconKeyForCategory(row.category),
  }));
}

export function mergeTemplatesIntoCatalog(templates: AppChoreTemplate[]): AppTask[] {
  if (templates.length === 0) return defaultTasks;

  return templates.map((template) => ({
    id: template.id,
    title: template.title,
    category: template.category,
    iconKey: template.iconKey ?? iconKeyForCategory(template.category),
    assignee: "none" as const,
    selected: false,
    done: false,
    reacted: false,
  }));
}
