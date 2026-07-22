import { supabase } from "@/lib/supabase";
import { buildCatalogTasks, iconKeyForCategory, normalizeCategory, TaskIconKey } from "@/lib/chore-catalog";

export type Assignee = "me" | "partner" | "none";

export type AppTask = {
  id: string;
  title: string;
  category: string;
  iconKey?: TaskIconKey;
  assignee: Assignee;
  selected: boolean;
  done: boolean;
  completedAt?: string | null;
  reacted: boolean;
  myReaction?: string | null;
};

export type AppLetter = {
  id: string;
  from: "me" | "partner";
  title: string;
  body: string;
  date: string;
  createdAt: string;
  reaction: string;
  kind?: "instant" | "weekly";
  cycleId?: string | null;
};

export type AppReaction = {
  id: string;
  from: "me" | "partner";
  reaction: string;
  choreTitle: string;
  createdAt: string;
  date: string;
};

export type NotificationKind = "reminder" | "chore_done" | "letter" | "reaction" | "partner_connect" | "other";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  date: string;
  createdAt: string;
  kind: NotificationKind;
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
  meCompletedCount: number;
  partnerCompletedCount: number;
  partnerLetterReceived: boolean;
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
  completed_by?: string | null;
  chore_reactions?: { id: string; reaction?: string | null; sender_id?: string | null }[];
};

type WeeklyStatRow = {
  cycle_id: string;
  completion_rate: number;
  me_completed_count: number | null;
  partner_completed_count: number | null;
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
  kind?: "instant" | "weekly" | null;
  cycle_id?: string | null;
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

function mapChoreRow(task: WeeklyChoreRow, viewerUserId?: string | null, partnerUserId?: string | null): AppTask {
  let assignee: Assignee = task.assignee ?? "none";
  if (task.completed_at && task.completed_by && viewerUserId) {
    if (task.completed_by === viewerUserId) assignee = "me";
    else if (partnerUserId && task.completed_by === partnerUserId) assignee = "partner";
    else if (task.completed_by !== viewerUserId) assignee = "partner";
  } else if (!task.completed_at) {
    assignee = "none";
  }

  const myReactionRow = viewerUserId
    ? task.chore_reactions?.find((row) => row.sender_id === viewerUserId)
    : task.chore_reactions?.[0];
  const myReaction = myReactionRow?.reaction ?? null;

  return {
    id: task.id,
    title: task.title,
    category: task.category,
    iconKey: iconKeyForCategory(task.category),
    assignee,
    selected: true,
    done: Boolean(task.completed_at),
    completedAt: task.completed_at,
    reacted: Boolean(myReaction),
    myReaction,
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
    .select("id,user_a_id,user_b_id,connected_at,created_at")
    .order("created_at", { ascending: false })
    .returns<Array<Couple & { connected_at?: string | null; created_at?: string }>>();

  if (error) throw error;
  if (!data?.length) return null;
  // 파트너 연결된 couple을 우선 (고아 solo couple이 남아 있어도)
  return data.find((couple) => couple.user_b_id) ?? data[0];
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
  if (message.includes("chores_conflict_needs_confirm")) {
    return "파트너의 할 일 목록으로 변경하려면 확인이 필요해요.";
  }
  return "초대 코드 처리에 실패했어요. 다시 시도해 주세요.";
}

export function parseDisconnectError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("no_partner_connected")) return "연결된 파트너가 없어요.";
  if (message.includes("couple_not_found")) return "커플 정보를 찾을 수 없어요.";
  return "파트너 연결 해제에 실패했어요. 다시 시도해 주세요.";
}

export type InviteConnectPreview = {
  generator_has_chores: boolean;
  enterer_has_chores: boolean;
  needs_confirm: boolean;
};

export async function previewInviteConnect(code: string): Promise<InviteConnectPreview> {
  const { data, error } = await supabase.rpc("preview_invite_connect", {
    p_code: code,
  });

  if (error) throw error;
  const raw = (data ?? {}) as Partial<InviteConnectPreview>;
  return {
    generator_has_chores: Boolean(raw.generator_has_chores),
    enterer_has_chores: Boolean(raw.enterer_has_chores),
    needs_confirm: Boolean(raw.needs_confirm),
  };
}

export async function redeemInviteCode(code: string, confirmReplace = false) {
  const { data, error } = await supabase.rpc("redeem_invite_code", {
    p_code: code,
    p_confirm_replace: confirmReplace,
  });

  if (error) throw error;
  return data as string;
}

/** 해제 실행자만 새 solo couple을 받고, 상대는 기존 couple+할 일을 유지 */
export async function disconnectPartner(): Promise<Couple> {
  const { data, error } = await supabase.rpc("disconnect_partner");
  if (error) throw error;

  const coupleId = data as string;
  const { data: couple, error: coupleError } = await supabase
    .from("couples")
    .select("id,user_a_id,user_b_id")
    .eq("id", coupleId)
    .single<Couple>();

  if (coupleError) throw coupleError;
  return couple;
}

export function parseDeleteAccountError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("not_authenticated")) return "로그인이 필요해요.";
  return "회원 탈퇴에 실패했어요. 다시 시도해 주세요.";
}

/** 파트너가 있으면 연결만 끊고(상대 할 일 유지), 본인 데이터·auth 유저 삭제 */
export async function deleteMyAccount() {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw error;
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
  return ensureCurrentCycleForWeek(coupleId, weekStart, weekEnd);
}

export async function ensureCurrentCycleForWeek(coupleId: string, weekStart: string, weekEnd: string) {
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

/** 조회만 (없으면 null). 마감 팝업 판별 시 빈 지난주 주기를 upsert 하지 않기 위함 */
export async function getWeeklyCycleId(coupleId: string, weekStart: string) {
  const { data, error } = await supabase
    .from("weekly_cycles")
    .select("id")
    .eq("couple_id", coupleId)
    .eq("week_start", weekStart)
    .maybeSingle<{ id: string }>();

  if (error) throw error;
  return data?.id ?? null;
}

export async function coupleHasWeeklyChores(coupleId: string) {
  const cycleId = await ensureCurrentCycle(coupleId);
  const chores = await loadWeeklyChores(cycleId);
  return chores.length > 0;
}

export async function loadWeeklyChores(
  cycleId: string,
  viewerUserId?: string | null,
  partnerUserId?: string | null,
): Promise<AppTask[]> {
  const { data, error } = await supabase
    .from("weekly_chores")
    .select("id,title,category,assignee,completed_at,completed_by,chore_reactions(id,reaction,sender_id)")
    .eq("cycle_id", cycleId)
    .order("created_at", { ascending: true })
    .returns<WeeklyChoreRow[]>();

  if (error) throw error;
  return data.map((task) => mapChoreRow(task, viewerUserId, partnerUserId));
}

export async function loadPreviousCycleChores(
  coupleId: string,
  viewerUserId?: string | null,
  partnerUserId?: string | null,
): Promise<AppTask[]> {
  const { weekStart } = currentWeekRange(-1);
  const { data, error } = await supabase
    .from("weekly_cycles")
    .select("id,weekly_chores(id,title,category,assignee,completed_at,completed_by,chore_reactions(id,reaction,sender_id))")
    .eq("couple_id", coupleId)
    .eq("week_start", weekStart)
    .maybeSingle<{ id: string; weekly_chores: WeeklyChoreRow[] | null }>();

  if (error) throw error;
  if (!data?.weekly_chores?.length) return [];

  return data.weekly_chores.map((task) => ({
    ...mapChoreRow(task, viewerUserId, partnerUserId),
    selected: true,
    done: false,
    reacted: false,
    myReaction: null,
  }));
}

export async function replaceWeeklyChores(
  cycleId: string,
  userId: string,
  tasks: AppTask[],
  viewerUserId?: string | null,
  partnerUserId?: string | null,
): Promise<AppTask[]> {
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
        category: normalizeCategory(task.category),
        assignee: "none" as const,
        completed_by: null,
        completed_at: null,
      })),
    )
    .select("id,title,category,assignee,completed_at,completed_by")
    .returns<WeeklyChoreRow[]>();

  if (error) throw error;

  return data.map((task) => ({
    ...mapChoreRow(task, viewerUserId ?? userId, partnerUserId),
    selected: true,
    done: false,
    reacted: false,
  }));
}

/** 기존 할 일을 유지한 채 선택분을 추가(중복 허용). 파트너 연결 후 A-06 합산용 */
export async function appendWeeklyChores(
  cycleId: string,
  userId: string,
  tasks: AppTask[],
  viewerUserId?: string | null,
  partnerUserId?: string | null,
): Promise<AppTask[]> {
  const selectedTasks = tasks.filter((task) => task.selected);
  if (selectedTasks.length > 0) {
    const { error } = await supabase.from("weekly_chores").insert(
      selectedTasks.map((task) => ({
        cycle_id: cycleId,
        title: task.title,
        category: normalizeCategory(task.category),
        assignee: "none" as const,
        completed_by: null,
        completed_at: null,
      })),
    );
    if (error) throw error;
  }

  return loadWeeklyChores(cycleId, viewerUserId ?? userId, partnerUserId);
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

  if (typeof patch.title === "string") update.title = patch.title;
  // 완료 처리 시 assignee(me/partner)는 viewer 기준 표시용 — DB에는 completed_by만 기록
  if (patch.assignee && typeof patch.done !== "boolean") update.assignee = patch.assignee;
  if (typeof patch.done === "boolean") {
    update.completed_by = patch.done ? userId : null;
    update.completed_at = patch.done ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) return;

  const { error } = await supabase.from("weekly_chores").update(update).eq("id", taskId);
  if (error) throw error;
}

export async function deleteWeeklyChore(taskId: string) {
  const { error } = await supabase.from("weekly_chores").delete().eq("id", taskId);
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

function inferNotificationKind(title: string, body: string): NotificationKind {
  const text = `${title} ${body}`;
  if (/파트너 연결|연결 되었어요/.test(text)) return "partner_connect";
  if (/편지/.test(text)) return "letter";
  if (/리액션/.test(text)) return "reaction";
  if (/리마인드|절반|아직/.test(text)) return "reminder";
  if (/완료/.test(text)) return "chore_done";
  return "other";
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
  // Partner inbox inserts must use RPC — RLS blocks direct insert for other users.
  const { error } = await supabase.rpc("notify_user", {
    p_user_id: userId,
    p_title: title,
    p_body: body,
    p_chore_id: choreId ?? null,
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
    createdAt: row.created_at,
    kind: inferNotificationKind(row.title, row.body),
  }));
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
}

export async function loadLetters(userId: string): Promise<AppLetter[]> {
  const { data, error } = await supabase
    .from("letters")
    .select("id,sender_id,body,reaction,created_at,kind,cycle_id")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .returns<LetterRow[]>();

  if (error) throw error;

  return data.map((letter) => ({
    id: letter.id,
    from: letter.sender_id === userId ? "me" as const : "partner" as const,
    title: letter.kind === "weekly"
      ? (letter.sender_id === userId ? "주간 칭찬을 보냈어요" : "주간 칭찬을 받았어요")
      : (letter.sender_id === userId ? "내가 보낸 편지" : "상대방이 보낸 편지"),
    body: letter.body,
    date: new Date(letter.created_at).toLocaleDateString("ko-KR"),
    createdAt: letter.created_at,
    reaction: letter.reaction ?? "💌",
    kind: letter.kind === "weekly" ? "weekly" : "instant",
    cycleId: letter.cycle_id ?? null,
  }));
}

type ReactionRow = {
  id: string;
  sender_id: string;
  reaction: string;
  created_at: string;
  weekly_chores: {
    title: string;
    weekly_cycles: { couple_id: string } | null;
  } | null;
};

export async function loadCoupleReactions(coupleId: string, userId: string): Promise<AppReaction[]> {
  const { data, error } = await supabase
    .from("chore_reactions")
    .select("id,sender_id,reaction,created_at,weekly_chores!inner(title,weekly_cycles!inner(couple_id))")
    .eq("weekly_chores.weekly_cycles.couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<ReactionRow[]>();

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    from: row.sender_id === userId ? "me" as const : "partner" as const,
    reaction: row.reaction,
    choreTitle: row.weekly_chores?.title ?? "할 일",
    createdAt: row.created_at,
    date: new Date(row.created_at).toLocaleDateString("ko-KR"),
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

export async function loadWeeklyStats(
  coupleId: string,
  partnerId: string | null = null,
): Promise<AppWeeklyStat[]> {
  const { data, error } = await supabase
    .from("weekly_stats")
    .select("cycle_id,completion_rate,me_completed_count,partner_completed_count,weekly_cycles!inner(week_start,week_end,couple_id)")
    .eq("weekly_cycles.couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(12)
    .returns<WeeklyStatRow[]>();

  if (error) throw error;

  const cycleIds = data.map((row) => row.cycle_id);
  let partnerLetterCycles = new Set<string>();

  if (partnerId && cycleIds.length > 0) {
    const { data: weeklyLetters, error: letterError } = await supabase
      .from("letters")
      .select("cycle_id,sender_id")
      .in("cycle_id", cycleIds)
      .eq("kind", "weekly")
      .eq("sender_id", partnerId)
      .returns<{ cycle_id: string | null; sender_id: string }[]>();

    if (letterError) throw letterError;
    partnerLetterCycles = new Set(
      (weeklyLetters ?? [])
        .map((letter) => letter.cycle_id)
        .filter((id): id is string => Boolean(id)),
    );
  }

  return data.map((row) => ({
    id: row.cycle_id,
    completionRate: row.completion_rate,
    weekStart: row.weekly_cycles?.week_start ?? "",
    weekEnd: row.weekly_cycles?.week_end ?? "",
    meCompletedCount: row.me_completed_count ?? 0,
    partnerCompletedCount: row.partner_completed_count ?? 0,
    partnerLetterReceived: partnerId ? partnerLetterCycles.has(row.cycle_id) : true,
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
    .select("id,sender_id,body,reaction,created_at,kind,cycle_id")
    .single<LetterRow>();

  if (error) throw error;

  return {
    id: data.id,
    from: "me" as const,
    title: weekly ? "주간 칭찬을 보냈어요" : "마음을 보냈어요",
    body: data.body,
    date: new Date(data.created_at).toLocaleDateString("ko-KR"),
    createdAt: data.created_at,
    reaction: data.reaction ?? reaction,
    kind: weekly ? "weekly" as const : "instant" as const,
    cycleId: data.cycle_id ?? cycleId,
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
  const existingKeys = new Set(
    existing.map((item) => `${normalizeCategory(item.category)}::${item.title.trim()}`),
  );

  const missing = defaultTasks.filter((task) => (
    !existingKeys.has(`${normalizeCategory(task.category)}::${task.title.trim()}`)
  ));

  if (missing.length === 0) return existing;

  const { error } = await supabase.from("chore_templates").insert(
    missing.map((task) => ({
      owner_id: userId,
      title: task.title,
      category: task.category,
    })),
  );

  if (error) throw error;

  return loadChoreTemplates(userId);
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

/** A-06 반복 선택: 전체 템플릿 + 지난주 등록분 자동 체크(완료 여부 무관) */
export function buildRepeatChoreCatalog(templates: AppChoreTemplate[], lastWeekTasks: AppTask[]): AppTask[] {
  const lastWeekByTitle = new Map<string, AppTask>();
  for (const task of lastWeekTasks) {
    const title = task.title.trim();
    if (!title || lastWeekByTitle.has(title)) continue;
    lastWeekByTitle.set(title, task);
  }
  const lastTitles = new Set(lastWeekByTitle.keys());

  const catalog = mergeTemplatesIntoCatalog(templates).map((task) => ({
    ...task,
    selected: lastTitles.has(task.title),
    done: false,
    reacted: false,
  }));

  const catalogTitles = new Set(catalog.map((task) => task.title));
  const extras = [...lastWeekByTitle.values()]
    .filter((task) => !catalogTitles.has(task.title.trim()))
    .map((task) => {
      const category = normalizeCategory(task.category);
      return {
        id: `prev-${task.id}`,
        title: task.title.trim(),
        category,
        iconKey: task.iconKey ?? iconKeyForCategory(category),
        assignee: "none" as const,
        selected: true,
        done: false,
        reacted: false,
      };
    });

  return [...catalog, ...extras];
}
