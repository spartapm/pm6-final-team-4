"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AI_PERSPECTIVE_TYPE, countTodoInputTypes, trackEvent } from "@/lib/analytics";
import {
  castleLevel1,
  castleLevel10,
  castleSrcForWeek,
  castleStageFromRate,
} from "@/lib/castle-assets";
import { PRIVACY_POLICY_MD, SERVICE_TERMS_MD } from "@/lib/legal-docs";
import { MarkdownLite } from "@/lib/markdown-lite";
import {
  choreDoneNotifBody,
  letterNotifBody,
  ONBOARDING_SCREENS,
  partnerConnectNotifBody,
  parseReactionEmojiFromTitle,
  reactionNotifBody,
  reactionNotifTitle,
} from "@/lib/notification-copy";
import {
  letterStatusFingerprint,
  notificationsFingerprint,
  QUIET_POLL_INTERVAL_MS,
  tasksFingerprint,
} from "@/lib/quiet-sync";
import avatarCream from "../../icons/avatar-cream.svg";
import avatarCool from "../../icons/avatar-cool.svg";
import avatarCrystal from "../../icons/avatar-crystal.svg";
import avatarGalaxy from "../../icons/avatar-galaxy.svg";
import avatarKing from "../../icons/avatar-king.svg";
import avatarLaundry from "../../icons/avatar-laundry.svg";
import avatarLove from "../../icons/avatar-love.svg";
import avatarMint from "../../icons/avatar-mint.svg";
import avatarPeach from "../../icons/avatar-peach.svg";
import avatarPink from "../../icons/avatar-pink.svg";
import avatarPurple from "../../icons/avatar-purple.svg";
import avatarQueen from "../../icons/avatar-queen.svg";
import avatarRainbow from "../../icons/avatar-rainbow.svg";
import avatarSky from "../../icons/avatar-sky.svg";
import avatarYellow from "../../icons/avatar-yellow.svg";
import castleUpgradeGuide from "../../castle_image/성 업그레이드 설명서.svg";
import bottomNavCalander from "../../icons/bottomNav-calander.svg";
import bottomNavCastle from "../../icons/bottomNav-castle.svg";
import bottomNavHome from "../../icons/bottomNav-home.svg";
import bottomNavMypage from "../../icons/bottomNav-mypage.svg";
import commonAi from "../../icons/common-ai.svg";
import commonAlarm from "../../icons/common-alarm.svg";
import commonCheckboxFilled from "../../icons/common-checkbox-filled.svg";
import commonCheckboxOutline from "../../icons/common-checkbox-outline.svg";
import commonChat from "../../icons/common-chat.svg";
import commonCopy from "../../icons/common-copy.svg";
import commonCalendar from "../../icons/common-calendar.svg";
import commonDelete from "../../icons/common-delete.svg";
import commonDocument from "../../icons/common-document.svg";
import commonEdit from "../../icons/common-edit.svg";
import commonInfo from "../../icons/common-info.svg";
import commonMailbox from "../../icons/common-mailbox.svg";
import commonNotification from "../../icons/common-notification.svg";
import commonNotificationTrue from "../../icons/common-notification-true.svg";
import commonRefresh from "../../icons/common-refresh.svg";
import commonShield from "../../icons/common-shield.svg";
import commonStatistics from "../../icons/common-statistics.svg";
import commonTrophy from "../../icons/common-trophy.svg";
import commonWarning from "../../icons/common-warning.svg";
import mainLogo from "../../icons/main-logo.svg";
import taskPlant from "../../icons/task-plant.svg";
import reactionClap from "../../icons/reaction-clap.svg";
import reactionClover from "../../icons/reaction-clover.svg";
import reactionFlower from "../../icons/reaction-flower.svg";
import reactionHeartGift from "../../icons/reaction-heart-gift.svg";
import reactionHeartPink from "../../icons/reaction-heart-pink.svg";
import reactionHeartPurple from "../../icons/reaction-heart-purple.svg";
import reactionLetter from "../../icons/reaction-letter.svg";
import reactionLike from "../../icons/reaction-like.svg";
import reactionParty from "../../icons/reaction-party.svg";
import reactionSparkle from "../../icons/reaction-sparkle.svg";
import reactionStar from "../../icons/reaction-star.svg";
import reactionThanks from "../../icons/reaction-thanks.svg";
import reactionTeary from "../../icons/reaction-teary.svg";
import snsKakao from "../../icons/sns-kakao.svg";
import { AlertDialog, ConfirmDialog, ModalOverlay } from "@/components/modals";
import { categoryMeta, catalogTitlesForCategory, formatHomeWeekRange, formatReportWeekRange, formatWeekRangeLabel, iconKeyForCategory, normalizeCategory, taskIconMap } from "@/lib/chore-catalog";
import {
  ICEBREAKER_PERSPECTIVES,
  type IcebreakerPerspective,
  type IcebreakerPhrases,
  requestIcebreakerPhrases,
  subjectParticleName,
} from "@/lib/icebreaker-ai";
import {
  addChoreReaction,
  AppChoreTemplate,
  AppLetter,
  AppNotification,
  AppPartnerProfile,
  AppReaction,
  AppTask,
  AppWeeklyStat,
  buildRepeatChoreCatalog,
  closeWeeklyCycle,
  countCompletedWeekStreak,
  createChoreTemplate,
  createInviteCode,
  createNotification,
  currentWeekRange,
  deleteChoreTemplate,
  deleteMyAccount,
  deleteWeeklyChore,
  disconnectPartner,
  ensureCouple,
  ensureCurrentCycle,
  ensureCurrentCycleForWeek,
  ensureProfile,
  getActiveInviteCode,
  getCurrentCouple,
  getPartnerProfile,
  getProfile,
  getWeeklyCycleId,
  getWeeklyLetterStatus,
  insertLetter,
  insertWeeklyChore,
  isPersistedId,
  loadChoreTemplates,
  loadCoupleReactions,
  loadLetters,
  loadNotifications,
  loadPreviousCycleChores,
  loadWeeklyStats,
  loadWeeklyChores,
  markAllNotificationsRead,
  markNotificationRead,
  mergeTemplatesIntoCatalog,
  parseDeleteAccountError,
  parseDisconnectError,
  parseInviteError,
  redeemInviteCode,
  replaceWeeklyChores,
  appendWeeklyChores,
  seedDefaultTemplates,
  updateChoreTemplate,
  updateWeeklyChore,
  upsertWeeklyStats,
} from "@/lib/moaseong-db";

type Screen =
  | "landing"
  | "profile"
  | "terms"
  | "social"
  | "login"
  | "invite"
  | "inviteCreate"
  | "inviteEnter"
  | "chores"
  | "home"
  | "letter"
  | "sent"
  | "close"
  | "weeklyLetter"
  | "stats"
  | "letters"
  | "castle"
  | "castleExplain"
  | "mypage"
  | "notifications"
  | "templateManage"
  | "partnerManage"
  | "notificationSettings"
  | "accountSettings";

type DialogState =
  | { kind: "alert"; title?: string; message: string; onClose?: () => void }
  | {
      kind: "confirm";
      title?: string;
      message: string;
      confirmLabel?: string;
      cancelLabel?: string;
      onConfirm: () => void;
      onCancel?: () => void;
    }
  | null;

type AssetModule = string | StaticImageData;

const avatarOptions = [
  { id: "avatar-pink", src: avatarPink, label: "핑크" },
  { id: "avatar-purple", src: avatarPurple, label: "퍼플" },
  { id: "avatar-mint", src: avatarMint, label: "민트" },
  { id: "avatar-peach", src: avatarPeach, label: "피치" },
  { id: "avatar-yellow", src: avatarYellow, label: "옐로우" },
  { id: "avatar-sky", src: avatarSky, label: "스카이" },
  { id: "avatar-rainbow", src: avatarRainbow, label: "레인보우" },
  { id: "avatar-love", src: avatarLove, label: "러브" },
  { id: "avatar-cream", src: avatarCream, label: "크림" },
  { id: "avatar-cool", src: avatarCool, label: "쿨" },
  { id: "avatar-crystal", src: avatarCrystal, label: "크리스탈" },
  { id: "avatar-galaxy", src: avatarGalaxy, label: "갤럭시" },
  { id: "avatar-king", src: avatarKing, label: "킹" },
  { id: "avatar-queen", src: avatarQueen, label: "퀸" },
  { id: "avatar-laundry", src: avatarLaundry, label: "런드리" },
];

function calcWeekProgress(
  doneCount: number,
  totalCount: number,
  letterStatus: { meSent: boolean; partnerSent: boolean },
) {
  const choreRate = totalCount > 0 ? (doneCount / totalCount) * 80 : 0;
  const letterRate = (letterStatus.meSent ? 10 : 0) + (letterStatus.partnerSent ? 10 : 0);
  return Math.round(choreRate + letterRate);
}

function resolveAvatarId(value?: string | null) {
  if (value && avatarOptions.some((item) => item.id === value)) return value;
  return "avatar-mint";
}

function partnerDisplayName(profile?: AppPartnerProfile | null) {
  return profile?.nickname?.trim() || "파트너";
}

function partnerAvatarId(profile?: AppPartnerProfile | null) {
  return resolveAvatarId(profile?.avatarEmoji);
}

const reactionOptions = [
  { value: "💗", src: reactionHeartPink, label: "하트" },
  { value: "💜", src: reactionHeartPurple, label: "퍼플하트" },
  { value: "🎁", src: reactionHeartGift, label: "선물하트" },
  { value: "👍", src: reactionLike, label: "좋아요" },
  { value: "🌸", src: reactionFlower, label: "꽃" },
  { value: "🍀", src: reactionClover, label: "클로버" },
  { value: "✨", src: reactionSparkle, label: "반짝" },
  { value: "👏", src: reactionClap, label: "박수" },
  { value: "⭐", src: reactionStar, label: "별" },
  { value: "🎉", src: reactionParty, label: "파티" },
  { value: "🙏", src: reactionThanks, label: "감사" },
  { value: "🥹", src: reactionTeary, label: "감동" },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [nickname, setNickname] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(avatarOptions[0].id);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [myCode, setMyCode] = useState("");
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [homeAdding, setHomeAdding] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showCastleUpgrade, setShowCastleUpgrade] = useState(false);
  const [letterBody, setLetterBody] = useState("");
  const [reaction, setReaction] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentCoupleId, setCurrentCoupleId] = useState<string | null>(null);
  const [currentCycleId, setCurrentCycleId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthResolving, setIsAuthResolving] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const isHandlingAuthRef = useRef(false);
  const authBootstrappedUserRef = useRef<string | null>(null);
  const inviteBusyRef = useRef(false);
  const usedAiSuggestionRef = useRef(false);
  const categoryScreenTrackedRef = useRef(false);
  const pollInFlightRef = useRef(false);
  const localMutationRef = useRef(0);
  const tasksFingerprintRef = useRef("");
  const notificationsFingerprintRef = useRef("");
  const letterStatusFingerprintRef = useRef("");
  const [letters, setLetters] = useState<AppLetter[]>([]);
  const [reactions, setReactions] = useState<AppReaction[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<AppWeeklyStat[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [templates, setTemplates] = useState<AppChoreTemplate[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<AppPartnerProfile | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<AppLetter | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<AppReaction | null>(null);
  const [lastSentLetter, setLastSentLetter] = useState<AppLetter | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<AppChoreTemplate | null>(null);
  const [templateDraft, setTemplateDraft] = useState({ title: "", category: "기타" });
  const [templateSheet, setTemplateSheet] = useState<
    | null
    | { kind: "add"; category: string }
    | { kind: "edit"; template: AppChoreTemplate }
    | { kind: "delete"; template: AppChoreTemplate }
  >(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lettersFocusAt, setLettersFocusAt] = useState<string | null>(null);
  const [alertToast, setAlertToast] = useState<{
    id: string;
    message: string;
    kind: AppNotification["kind"];
    reactionEmoji?: string | null;
    local?: boolean;
  } | null>(null);
  const knownNotifIdsRef = useRef<Set<string> | null>(null);
  const alertToastTimerRef = useRef<number | null>(null);
  const castleStageRef = useRef(1);
  const weeklyLetterStatusRef = useRef({ meSent: false, partnerSent: false, bothSent: false });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [inviteEntry, setInviteEntry] = useState<"onboarding" | "settings">("onboarding");
  const [choreMode, setChoreMode] = useState<"first" | "repeat">("first");
  const [choreSaveMode, setChoreSaveMode] = useState<"replace" | "merge">("replace");
  const [statsComplete, setStatsComplete] = useState(false);
  const [weekStreak, setWeekStreak] = useState(0);
  const [weeklyLetterStatus, setWeeklyLetterStatus] = useState({ meSent: false, partnerSent: false, bothSent: false });
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [showWeekClosePopup, setShowWeekClosePopup] = useState(false);
  const [showIcebreakerAi, setShowIcebreakerAi] = useState(false);
  const [icebreakerPhrasesCache, setIcebreakerPhrasesCache] = useState<IcebreakerPhrases | null>(null);
  const [closingWeekRange, setClosingWeekRange] = useState<{ weekStart: string; weekEnd: string } | null>(null);
  const [closingWeekProgress, setClosingWeekProgress] = useState(0);
  const [closingWeekTasks, setClosingWeekTasks] = useState<AppTask[]>([]);
  const [statsEntry, setStatsEntry] = useState<"letter" | "castle">("letter");
  const [reportTasks, setReportTasks] = useState<AppTask[]>([]);
  const [reportMeta, setReportMeta] = useState<{
    progress: number;
    completeCount: number;
    totalCount: number;
    meDone: number;
    partnerDone: number;
  } | null>(null);

  const showAlert = (title: string, message: string, onClose?: () => void) => setDialog({ kind: "alert", title, message, onClose });
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = "네",
    cancelLabel = "아니오",
    onCancel?: () => void,
  ) => setDialog({
    kind: "confirm",
    title: title || undefined,
    message,
    onConfirm,
    confirmLabel,
    cancelLabel,
    onCancel,
  });

  const completeCount = tasks.filter((task) => task.done).length;
  const progress = calcWeekProgress(completeCount, tasks.length, weeklyLetterStatus);
  const castleLevel = castleStageFromRate(progress);
  const meDone = tasks.filter((task) => task.done && task.assignee === "me").length;
  const partnerDone = tasks.filter((task) => task.done && task.assignee === "partner").length;

  const choreSelectionTasks = tasks.length > 0 ? tasks : mergeTemplatesIntoCatalog(templates);
  const groupedTasks = useMemo(() => {
    return choreSelectionTasks.reduce<Record<string, AppTask[]>>((acc, task) => {
      acc[task.category] = [...(acc[task.category] ?? []), task];
      return acc;
    }, {});
  }, [choreSelectionTasks]);

  const getSessionUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  };

  const getProfileDraft = () => {
    const fallback = { nickname: nickname.trim() || "모아", avatarEmoji: selectedEmoji };
    const rawDraft = window.localStorage.getItem("moaseong-profile-draft");
    if (!rawDraft) return fallback;

    try {
      return JSON.parse(rawDraft) as { nickname: string; avatarEmoji: string };
    } catch {
      return fallback;
    }
  };

  const syncCoupleState = (userId: string, couple: { id: string; user_a_id: string; user_b_id: string | null } | null) => {
    setCurrentCoupleId(couple?.id ?? null);
    const nextPartnerId = couple
      ? (couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id)
      : null;
    setPartnerId(nextPartnerId);
    if (!nextPartnerId) {
      setPartnerProfile(null);
      return;
    }
    void getPartnerProfile(nextPartnerId)
      .then((profile) => setPartnerProfile(profile))
      .catch(() => setPartnerProfile(null));
  };

  // v4: 미참여 지난주 마감 팝업 오탐 방지 (온보딩/파트너 연결 직후)
  const weekCloseStorageKey = (userId: string, weekStart: string) => `moaseong-week-close:v4:${userId}:${weekStart}`;

  const evaluateWeekClosePopup = useCallback(async (userId: string, coupleId: string | null, resolvedPartnerId: string | null = partnerId) => {
    if (!coupleId) {
      setShowWeekClosePopup(false);
      return;
    }

    const previous = currentWeekRange(-1);
    const current = currentWeekRange();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const previousEnd = new Date(`${previous.weekEnd}T00:00:00`);
    const weekEnded = today > previousEnd;

    const couple = await getCurrentCouple();
    const connectedAt = couple?.connected_at ? new Date(couple.connected_at) : null;
    if (connectedAt) connectedAt.setHours(0, 0, 0, 0);

    const clearPending = (weekStart: string) => {
      window.localStorage.removeItem(weekCloseStorageKey(userId, weekStart));
    };

    const tryShowForRange = async (range: { weekStart: string; weekEnd: string }) => {
      // 파트너 연결 전에 이미 끝난 주기는 마감 대상이 아님
      if (connectedAt && couple?.user_b_id) {
        const weekEndDate = new Date(`${range.weekEnd}T00:00:00`);
        if (weekEndDate < connectedAt) {
          clearPending(range.weekStart);
          return false;
        }
      }

      // 실제 존재하는 주기만 조회 (없으면 upsert 하지 않음)
      const cycleId = await getWeeklyCycleId(coupleId, range.weekStart);
      if (!cycleId) {
        clearPending(range.weekStart);
        return false;
      }

      const weekChores = await loadWeeklyChores(cycleId, userId, resolvedPartnerId);
      // 할 일 생성(=실제 참여)한 주기만 마감 팝업 대상
      if (weekChores.length === 0) {
        clearPending(range.weekStart);
        return false;
      }

      const letterStatus = await getWeeklyLetterStatus(cycleId, userId, resolvedPartnerId);
      if (letterStatus.meSent) {
        clearPending(range.weekStart);
        return false;
      }

      const doneCount = weekChores.filter((task) => task.done).length;
      setClosingWeekProgress(calcWeekProgress(doneCount, weekChores.length, letterStatus));
      setClosingWeekTasks(weekChores);
      setClosingWeekRange(range);
      setShowWeekClosePopup(true);
      window.localStorage.setItem(weekCloseStorageKey(userId, range.weekStart), "pending");
      return true;
    };

    try {
      // 1) 수동 마감 후 편지 미작성 (현재 주 pending)
      if (window.localStorage.getItem(weekCloseStorageKey(userId, current.weekStart)) === "pending") {
        if (await tryShowForRange(current)) return;
      }

      // 2) 주간 사이클 종료 후 첫 진입 / 재진입 — 참여한 지난주만
      if (weekEnded || window.localStorage.getItem(weekCloseStorageKey(userId, previous.weekStart)) === "pending") {
        if (await tryShowForRange(previous)) return;
      }

      setShowWeekClosePopup(false);
    } catch {
      // 마감 팝업 판별 실패는 홈 진입을 막지 않습니다.
    }
  }, [partnerId]);

  useEffect(() => {
    if (screen === "home" && currentUserId && currentCoupleId) {
      void evaluateWeekClosePopup(currentUserId, currentCoupleId);
    }
  }, [screen, currentUserId, currentCoupleId, evaluateWeekClosePopup]);

  useEffect(() => {
    if (isAuthResolving) return;
    // 최초 회원가입(첫 할 일 설정) 진입 시에만 1회
    if (screen === "chores" && choreMode === "first" && !categoryScreenTrackedRef.current) {
      categoryScreenTrackedRef.current = true;
      trackEvent("category_screen_viewed");
    }
    if (screen === "letters") trackEvent("calendar_viewed", { app_user_id: currentUserId });
    if (screen === "castle") trackEvent("castle_history_viewed", { app_user_id: currentUserId });
    if (screen === "stats") trackEvent("weekly_report_viewed");
    if (screen === "weeklyLetter") trackEvent("weekly_praise_prompt_shown");
  }, [screen, isAuthResolving, choreMode, currentUserId]);

  // C-03/D-01 등: 파트너 닉·이모지 최신화 (연결 직후·화면 진입 시)
  useEffect(() => {
    if (!partnerId) {
      setPartnerProfile(null);
      return;
    }
    if (screen !== "letter" && screen !== "letters" && screen !== "home" && screen !== "mypage") return;
    let cancelled = false;
    void getPartnerProfile(partnerId)
      .then((profile) => {
        if (!cancelled) setPartnerProfile(profile);
      })
      .catch(() => {
        if (!cancelled) setPartnerProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [partnerId, screen]);

  const loadCycleData = async (coupleId: string, userId: string) => {
    const cycleId = await ensureCurrentCycle(coupleId);
    const couple = await getCurrentCouple();
    const partner = couple
      ? (couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id)
      : null;

    const [savedTasks, savedLetters, savedReactions, savedStats, notifs, letterStatus, streak, seededTemplates] = await Promise.all([
      loadWeeklyChores(cycleId, userId, partner),
      loadLetters(userId),
      loadCoupleReactions(coupleId, userId),
      loadWeeklyStats(coupleId, partner),
      loadNotifications(userId),
      getWeeklyLetterStatus(cycleId, userId, partner),
      countCompletedWeekStreak(coupleId),
      seedDefaultTemplates(userId),
    ]);

    setCurrentCycleId(cycleId);
    setPartnerId(partner);
    setTasks(savedTasks);
    setLetters(savedLetters);
    setReactions(savedReactions);
    setWeeklyStats(savedStats);
    setNotifications(notifs);
    setWeeklyLetterStatus(letterStatus);
    setWeekStreak(streak);
    setTemplates(seededTemplates);
    tasksFingerprintRef.current = tasksFingerprint(savedTasks);
    notificationsFingerprintRef.current = notificationsFingerprint(notifs);
    letterStatusFingerprintRef.current = letterStatusFingerprint(letterStatus);
    knownNotifIdsRef.current = new Set(notifs.map((item) => item.id));
    if (partner) setPartnerProfile(await getPartnerProfile(partner));
    else setPartnerProfile(null);

    await evaluateWeekClosePopup(userId, coupleId, partner);

    return savedTasks.length;
  };

  const beginLocalMutation = () => {
    localMutationRef.current += 1;
  };

  const endLocalMutation = () => {
    localMutationRef.current = Math.max(0, localMutationRef.current - 1);
  };

  const dismissAlertToast = useCallback(() => {
    if (alertToastTimerRef.current) {
      window.clearTimeout(alertToastTimerRef.current);
      alertToastTimerRef.current = null;
    }
    setAlertToast(null);
  }, []);

  const showHomeAlertBanner = useCallback((message: string, kind: AppNotification["kind"] = "other") => {
    if (ONBOARDING_SCREENS.has(screen)) return;
    if (screen === "notifications") return;

    dismissAlertToast();
    setAlertToast({
      id: `local-${Date.now()}`,
      message,
      kind,
      local: true,
    });
    alertToastTimerRef.current = window.setTimeout(() => {
      setAlertToast(null);
      alertToastTimerRef.current = null;
    }, 3800);
  }, [dismissAlertToast, screen]);

  const showPartnerAlertToast = useCallback((item: AppNotification) => {
    if (ONBOARDING_SCREENS.has(screen)) return;
    if (screen === "notifications") return;

    dismissAlertToast();
    setAlertToast({
      id: item.id,
      message: item.body || item.title,
      kind: item.kind,
      reactionEmoji: parseReactionEmojiFromTitle(item.title),
    });
    alertToastTimerRef.current = window.setTimeout(() => {
      setAlertToast(null);
      alertToastTimerRef.current = null;
    }, 3800);
  }, [dismissAlertToast, screen]);

  useEffect(() => {
    castleStageRef.current = castleLevel;
  }, [castleLevel]);

  useEffect(() => {
    weeklyLetterStatusRef.current = weeklyLetterStatus;
  }, [weeklyLetterStatus]);

  const ingestPolledNotifications = useCallback((notifs: AppNotification[]) => {
    const nextNotifsKey = notificationsFingerprint(notifs);
    const shouldUpdateList = nextNotifsKey !== notificationsFingerprintRef.current;
    if (shouldUpdateList) {
      notificationsFingerprintRef.current = nextNotifsKey;
      setNotifications(notifs);
    }

    if (knownNotifIdsRef.current === null) {
      knownNotifIdsRef.current = new Set(notifs.map((item) => item.id));
      // 온보딩 직후 진입 등: 방금 도착한 미읽음은 토스트 1회 노출
      const recentUnread = notifs.find((item) => {
        if (item.read) return false;
        const age = Date.now() - new Date(item.createdAt).getTime();
        return Number.isFinite(age) && age >= 0 && age < 45_000;
      });
      if (recentUnread) showPartnerAlertToast(recentUnread);
      return;
    }

    const fresh = notifs.filter((item) => !knownNotifIdsRef.current!.has(item.id));
    for (const item of fresh) knownNotifIdsRef.current.add(item.id);
    if (fresh.length > 0) {
      // 최신순 정렬이므로 첫 항목이 가장 최근
      showPartnerAlertToast(fresh[0]);
    }
  }, [showPartnerAlertToast]);

  /** 홈/알림용 조용한 동기화 — 로딩 UI·ensureCycle·마감 팝업 없이 변경분만 반영 */
  const quietSyncPartnerVisibleData = useCallback(async () => {
    if (pollInFlightRef.current) return;
    if (localMutationRef.current > 0) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (!currentUserId) return;

    pollInFlightRef.current = true;
    try {
      const choresPromise = currentCycleId
        ? loadWeeklyChores(currentCycleId, currentUserId, partnerId)
        : Promise.resolve(null);
      const letterPromise = currentCycleId
        ? getWeeklyLetterStatus(currentCycleId, currentUserId, partnerId)
        : Promise.resolve(null);

      const [savedTasks, notifs, letterStatus] = await Promise.all([
        choresPromise,
        loadNotifications(currentUserId),
        letterPromise,
      ]);

      // 요청 중에 로컬 변경이 있으면 덮어쓰지 않음
      if (localMutationRef.current > 0) return;

      if (savedTasks) {
        const nextTasksKey = tasksFingerprint(savedTasks);
        if (nextTasksKey !== tasksFingerprintRef.current) {
          const resolvedLetter = letterStatus ?? weeklyLetterStatusRef.current;
          const prevStage = castleStageRef.current;
          const nextDone = savedTasks.filter((task) => task.done).length;
          const nextStage = castleStageFromRate(
            calcWeekProgress(nextDone, savedTasks.length, resolvedLetter),
          );

          tasksFingerprintRef.current = nextTasksKey;
          setTasks(savedTasks);

          if (nextStage > prevStage) {
            showHomeAlertBanner("성이 업그레이드 되었습니다", "other");
            castleStageRef.current = nextStage;
          }
        }
      }

      ingestPolledNotifications(notifs);

      if (letterStatus) {
        const nextLetterKey = letterStatusFingerprint(letterStatus);
        if (nextLetterKey !== letterStatusFingerprintRef.current) {
          letterStatusFingerprintRef.current = nextLetterKey;
          setWeeklyLetterStatus(letterStatus);
        }
      }
    } catch {
      // 폴링 실패는 UI/로딩에 영향 주지 않음
    } finally {
      pollInFlightRef.current = false;
    }
  }, [currentCycleId, currentUserId, ingestPolledNotifications, partnerId, showHomeAlertBanner]);

  useEffect(() => {
    const shouldPoll = Boolean(
      currentUserId
      && !isAuthResolving
      && !ONBOARDING_SCREENS.has(screen),
    );
    if (!shouldPoll) return;

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      void quietSyncPartnerVisibleData();
    };

    // 화면 진입 직후 1회 + 이후 주기 폴링
    tick();
    const timerId = window.setInterval(tick, QUIET_POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [screen, currentUserId, isAuthResolving, quietSyncPartnerVisibleData]);

  const prepareChoreSelection = async (coupleId: string, userId: string) => {
    const seeded = await seedDefaultTemplates(userId);
    setTemplates(seeded);

    const savedTasks = await loadWeeklyChores(await ensureCurrentCycle(coupleId), userId, partnerId);
    if (savedTasks.length > 0) {
      setTasks(savedTasks);
      setChoreMode("repeat");
      return;
    }

    const previousTasks = await loadPreviousCycleChores(coupleId, userId, partnerId);
    if (previousTasks.length > 0) {
      setTasks(buildRepeatChoreCatalog(seeded, previousTasks));
      setChoreMode("repeat");
      return;
    }

    setTasks(mergeTemplatesIntoCatalog(seeded));
    setChoreMode("first");
  };

  // 앱 가입 여부 = profiles 행 존재 여부 (카카오 OAuth만으로는 미가입)
  const initializeUserData = async (
    userId: string,
    profileDraft?: { nickname: string; avatarEmoji: string },
    options?: { createIfMissing?: boolean },
  ) => {
    setCurrentUserId(userId);

    const existingProfile = await getProfile(userId);
    if (existingProfile) {
      setNickname(existingProfile.nickname);
      setSelectedEmoji(existingProfile.avatar_emoji);
    } else if (options?.createIfMissing) {
      await ensureProfile(
        userId,
        profileDraft?.nickname?.trim() || nickname.trim() || "모아",
        profileDraft?.avatarEmoji ?? selectedEmoji,
      );
      if (profileDraft?.nickname?.trim()) setNickname(profileDraft.nickname.trim());
      if (profileDraft?.avatarEmoji) setSelectedEmoji(profileDraft.avatarEmoji);
    }

    const couple = await getCurrentCouple();
    const existingCode = await getActiveInviteCode(userId);
    setMyCode(existingCode);

    syncCoupleState(userId, couple);
    const savedTaskCount = couple ? await loadCycleData(couple.id, userId) : 0;
    return { savedTaskCount, isNewUser: !existingProfile };
  };

  const completeSignedInFlow = useCallback(async (userId: string) => {
    if (isHandlingAuthRef.current) return;

    const authIntent = window.localStorage.getItem("moaseong-auth-intent");
    // 이미 부트스트랩된 세션의 중복 SIGNED_IN/INITIAL_SESSION 은 화면을 가로채지 않음
    // (A-04 대기 중 자동으로 할 일 설정 Alert 가 뜨던 문제 방지)
    if (!authIntent && authBootstrappedUserRef.current === userId) {
      setIsAuthResolving(false);
      return;
    }

    isHandlingAuthRef.current = true;
    const profileDraft = getProfileDraft();

    let savedTaskCount = 0;

    try {
      // 카카오 로그인 성공 ≠ 앱 가입. profiles 유무로만 판별한다.
      const existingProfile = await getProfile(userId);
      const isNewUser = !existingProfile;

      // 기존 로그인인데 미가입: 프로필을 만들지 말고 세션을 끊어 신규 가입 경로를 오염시키지 않음
      if (authIntent === "login" && isNewUser) {
        window.localStorage.removeItem("moaseong-auth-intent");
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          // 세션 정리 실패해도 가입 유도는 진행
        }
        setCurrentUserId(null);
        setCurrentCoupleId(null);
        setCurrentCycleId(null);
        setPartnerId(null);
        setPartnerProfile(null);
        setScreen("login");
        showConfirm(
          "",
          "가입된 계정이 없어요.\n회원가입 할까요?",
          () => setScreen("profile"),
          "네",
          "아니오",
        );
        return;
      }

      // 회원가입인데 이미 profiles 있음
      if (authIntent === "signup" && !isNewUser) {
        window.localStorage.removeItem("moaseong-auth-intent");
        window.localStorage.removeItem("moaseong-profile-draft");
        const initResult = await initializeUserData(userId);
        savedTaskCount = initResult.savedTaskCount;
        setScreen("social");
        showConfirm(
          "",
          "이미 존재하는 계정이에요. 로그인할까요?",
          () => setScreen(savedTaskCount > 0 ? "home" : "chores"),
          "네",
          "아니오",
        );
        return;
      }

      window.localStorage.removeItem("moaseong-auth-intent");
      window.localStorage.removeItem("moaseong-profile-draft");

      // 여기 도달한 신규 유저만 profiles 생성 (회원가입 성공 / 세션 복구)
      const initResult = await initializeUserData(userId, profileDraft, { createIfMissing: isNewUser });
      savedTaskCount = initResult.savedTaskCount;

      if (authIntent === "signup") {
        setInviteEntry("onboarding");
        setScreen("invite");
        trackEvent("sign_up");
      } else if (savedTaskCount > 0) {
        setScreen("home");
      } else if (authIntent === "login") {
        // 기존 계정 로그인인데 할 일 미설정인 경우에만 Alert
        const couple = await ensureCouple(userId);
        syncCoupleState(userId, couple);
        await prepareChoreSelection(couple.id, userId);
        setScreen("login");
        showAlert("알림", "아직 할 일을 설정하지 않았어요. 지금 설정해볼까요?", () => {
          void openChoreSelection();
        });
      } else {
        // 세션 복구/중복 이벤트: 온보딩 초대 화면 유지 (자동 Alert/전환 없음)
        setInviteEntry("onboarding");
        setScreen("invite");
      }
    } catch (error) {
      console.warn("Supabase data initialization failed after login.", error);
      setCurrentUserId(userId);
      setScreen("landing");
    } finally {
      authBootstrappedUserRef.current = userId;
      if (window.location.hash || window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      setIsAuthResolving(false);
      isHandlingAuthRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const getAuthCallbackError = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      return (
        searchParams.get("error_description")
        ?? searchParams.get("error")
        ?? hashParams.get("error_description")
        ?? hashParams.get("error")
      );
    };

    const waitForSession = async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        if (data.session) return data.session;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      return null;
    };

    const resolveAuthRedirect = async () => {
      const callbackError = getAuthCallbackError();

      if (callbackError) {
        setAuthError(`카카오 로그인 콜백 오류: ${decodeURIComponent(callbackError)}`);
        setIsAuthResolving(false);
        return;
      }

      const session = await waitForSession();
      if (session) {
        await completeSignedInFlow(session.user.id);
        return;
      }

      if (window.location.hash || window.location.search) {
        setAuthError("카카오 로그인은 완료됐지만 Supabase 세션이 생성되지 않았어요. Supabase Kakao Provider 설정과 Redirect URL을 확인해 주세요.");
        setIsAuthResolving(false);
        return;
      }

      setIsAuthResolving(false);
    };

    void resolveAuthRedirect();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        void completeSignedInFlow(session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [completeSignedInFlow]);

  const ensureSignedInUser = async () => {
    const userId = currentUserId ?? await getSessionUserId();
    if (!userId) {
      showAlert("로그인 필요", "로그인이 필요해요.");
      setScreen("login");
      return null;
    }

    setCurrentUserId(userId);
    return userId;
  };

  const ensureCoupleAndCycle = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return null;

    const couple = currentCoupleId
      ? { id: currentCoupleId, user_a_id: userId, user_b_id: partnerId }
      : await ensureCouple(userId);
    syncCoupleState(userId, couple);

    const cycleId = currentCycleId ?? await ensureCurrentCycle(couple.id);
    setCurrentCycleId(cycleId);

    return { userId, coupleId: couple.id, cycleId };
  };

  const goHome = () => setScreen("home");

  const clearMoaseongBrowserState = () => {
    if (typeof window === "undefined") return;
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith("moaseong-")) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  };

  const resetSessionToLanding = () => {
    clearMoaseongBrowserState();
    authBootstrappedUserRef.current = null;
    categoryScreenTrackedRef.current = false;
    knownNotifIdsRef.current = null;
    dismissAlertToast();
    setScreen("landing");
    setTasks([]);
    setLetters([]);
    setReactions([]);
    setWeeklyStats([]);
    setNotifications([]);
    setTemplates([]);
    setWeeklyLetterStatus({ meSent: false, partnerSent: false, bothSent: false });
    setCurrentUserId(null);
    setCurrentCoupleId(null);
    setCurrentCycleId(null);
    setPartnerId(null);
    setPartnerProfile(null);
    setMyCode("");
    setInviteCode("");
    setLetterBody("");
    setReaction("");
    setClosingWeekTasks([]);
    setClosingWeekRange(null);
    setShowWeekClosePopup(false);
    setIcebreakerPhrasesCache(null);
    setShowIcebreakerAi(false);
    setInviteEntry("onboarding");
    setDialog(null);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // 로컬 세션 정리 실패해도 랜딩으로 보냄
    }
    resetSessionToLanding();
  };

  const handleDeleteAccount = async () => {
    setIsSaving(true);
    try {
      await deleteMyAccount();
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // auth.users 삭제 후 세션이 이미 무효일 수 있음
      }
      resetSessionToLanding();
      showAlert("알림", "회원 탈퇴가 완료되었어요.");
    } catch (error) {
      showAlert("알림", parseDeleteAccountError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSocialLogin = async (mode: "social" | "login") => {
    window.localStorage.setItem("moaseong-auth-intent", mode === "social" ? "signup" : "login");
    setIsLoggingIn(true);
    const kakaoScopes = "profile_nickname profile_image";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: window.location.origin,
        scopes: kakaoScopes,
        queryParams: {
          scope: kakaoScopes,
        },
      },
    });

    setIsLoggingIn(false);
    if (error) {
      window.localStorage.removeItem("moaseong-auth-intent");
      const isNetworkError = !navigator.onLine || /network|fetch|Failed to fetch/i.test(error.message);
      showAlert(
        "알림",
        isNetworkError ? "인터넷 연결을 확인해 주세요." : "로그인에 실패했어요. 다시 시도해 주세요.",
      );
    }
  };

  const handleProfileNext = async () => {
    if (!nickname.trim()) {
      showAlert("알림", "닉네임을 입력해 주세요.");
      return;
    }

    if (!agreedToTerms) {
      showAlert("알림", "이용약관에 동의해 주세요.");
      return;
    }

    window.localStorage.setItem(
      "moaseong-profile-draft",
      JSON.stringify({ nickname: nickname.trim(), avatarEmoji: selectedEmoji }),
    );

    if (currentUserId) await ensureProfile(currentUserId, nickname.trim(), selectedEmoji);
    setScreen("social");
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage((current) => (current === message ? null : current)), 1800);
  };

  const createInviteCodeForUser = async (options?: { showModal?: boolean }) => {
    const showModal = options?.showModal ?? true;

    if (myCode) {
      if (showModal) setShowInviteCodeModal(true);
      return;
    }

    const userId = await ensureSignedInUser();
    if (!userId) return;

    setIsSaving(true);
    try {
      await ensureProfile(userId, nickname.trim() || "모아", selectedEmoji);
      const { code, couple } = await createInviteCode(userId);
      setMyCode(code);
      syncCoupleState(userId, couple);
      if (showModal) setShowInviteCodeModal(true);
      trackEvent("invite_code_created");
    } catch (error) {
      const isNetworkError = !navigator.onLine || (error instanceof Error && /network|fetch|Failed to fetch/i.test(error.message));
      showAlert("알림", isNetworkError ? "인터넷 연결을 확인해 주세요." : "초대 코드 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyInviteCode = async () => {
    if (!myCode) return;
    try {
      await navigator.clipboard.writeText(myCode);
      showToast("복사되었습니다.");
    } catch {
      showAlert("알림", "코드를 직접 복사해 주세요.");
    }
  };

  const updateTask = async (id: string, patch: Partial<AppTask>) => {
    const previous = tasks.find((task) => task.id === id);
    const localPatch: Partial<AppTask> = {
      ...patch,
      ...(patch.done === true
        ? { assignee: "me" as const, completedAt: new Date().toISOString() }
        : {}),
      ...(patch.done === false ? { assignee: "none" as const, completedAt: null } : {}),
    };
    beginLocalMutation();
    setTasks((current) => {
      const next = current.map((task) => (task.id === id ? { ...task, ...localPatch } : task));
      tasksFingerprintRef.current = tasksFingerprint(next);
      return next;
    });

    const userId = await ensureSignedInUser();
    if (!userId || !isPersistedId(id)) {
      endLocalMutation();
      return;
    }

    try {
      await updateWeeklyChore(id, userId, {
        ...(typeof patch.done === "boolean" ? { done: patch.done } : {}),
        ...(typeof patch.title === "string" ? { title: patch.title } : {}),
      });
      if (patch.done && !previous?.done && partnerId && notificationEnabled) {
        const task = tasks.find((item) => item.id === id);
        try {
          await createNotification({
            userId: partnerId,
            choreId: id,
            title: "집안일 완료 알림",
            body: choreDoneNotifBody(nickname, task?.title ?? "할 일"),
          });
        } catch {
          // 알림 실패는 완료 저장 성공을 막지 않음
        }
      }
    } catch {
      if (previous) {
        setTasks((current) => {
          const next = current.map((task) => (task.id === id ? previous : task));
          tasksFingerprintRef.current = tasksFingerprint(next);
          return next;
        });
      }
      showAlert("저장 실패", "할 일 저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      endLocalMutation();
    }
  };

  const completeHomeTask = (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.done) return;

    const prevStage = castleLevel;
    const nextProgress = calcWeekProgress(completeCount + 1, tasks.length, weeklyLetterStatus);
    const nextStage = castleStageFromRate(nextProgress);

    trackEvent("todo_completed", { app_user_id: currentUserId });
    void updateTask(id, { done: true });
    showToast("내가 한 일에 추가되었습니다");

    if (nextStage > prevStage) {
      showHomeAlertBanner("성이 업그레이드 되었습니다", "other");
      castleStageRef.current = nextStage;
    }
  };

  const uncompleteHomeTask = (id: string) => {
    void updateTask(id, { done: false });
  };

  const renameHomeTask = async (id: string, title: string) => {
    const nextTitle = title.trim().slice(0, 30);
    if (!nextTitle) {
      showAlert("알림", "할 일명을 입력해주세요.");
      return false;
    }

    const previous = tasks.find((task) => task.id === id)?.title;
    beginLocalMutation();
    setTasks((current) => {
      const next = current.map((task) => (task.id === id ? { ...task, title: nextTitle } : task));
      tasksFingerprintRef.current = tasksFingerprint(next);
      return next;
    });

    if (!isPersistedId(id)) {
      endLocalMutation();
      return true;
    }

    const userId = await ensureSignedInUser();
    if (!userId) {
      endLocalMutation();
      return false;
    }

    try {
      await updateWeeklyChore(id, userId, { title: nextTitle });
      return true;
    } catch {
      if (previous) {
        setTasks((current) => {
          const next = current.map((task) => (task.id === id ? { ...task, title: previous } : task));
          tasksFingerprintRef.current = tasksFingerprint(next);
          return next;
        });
      }
      showAlert("저장 실패", "할 일 수정에 실패했어요. 다시 시도해 주세요.");
      return false;
    } finally {
      endLocalMutation();
    }
  };

  const deleteHomeTask = async (id: string) => {
    const previous = tasks;
    beginLocalMutation();
    setTasks((current) => {
      const next = current.filter((task) => task.id !== id);
      tasksFingerprintRef.current = tasksFingerprint(next);
      return next;
    });

    if (!isPersistedId(id)) {
      endLocalMutation();
      return;
    }

    try {
      await deleteWeeklyChore(id);
    } catch {
      setTasks(previous);
      tasksFingerprintRef.current = tasksFingerprint(previous);
      showAlert("삭제 실패", "할 일 삭제에 실패했어요. 다시 시도해 주세요.");
    } finally {
      endLocalMutation();
    }
  };

  const requestDeleteHomeTask = (id: string) => {
    showConfirm(
      "",
      "할 일을 삭제할까요?",
      () => void deleteHomeTask(id),
      "삭제하기",
      "취소",
    );
  };

  const addHomeTask = async (title: string, category: string) => {
    const nextTitle = title.trim().slice(0, 30);
    if (!nextTitle) {
      showAlert("알림", "할 일명을 입력해주세요.");
      return;
    }

    const userId = await ensureSignedInUser();
    if (!userId) return;

    beginLocalMutation();
    try {
      let cycleId = currentCycleId;
      if (!cycleId) {
        const couple = currentCoupleId
          ? { id: currentCoupleId, user_a_id: userId, user_b_id: partnerId }
          : await ensureCouple(userId);
        syncCoupleState(userId, couple);
        cycleId = await ensureCurrentCycle(couple.id);
        setCurrentCycleId(cycleId);
      }

      const nextCategory = normalizeCategory(category);
      const created = await insertWeeklyChore(cycleId, nextTitle, nextCategory);
      setTasks((current) => {
        const next = [...current, { ...created, category: nextCategory, iconKey: iconKeyForCategory(nextCategory) }];
        tasksFingerprintRef.current = tasksFingerprint(next);
        return next;
      });
      setHomeAdding(false);
      setNewTask("");
      trackEvent("todo_created", {
        app_user_id: userId,
        todo_count: 1,
        template_count: 0,
        manual_count: 1,
        source: "home_add",
      });
    } catch {
      showAlert("추가 실패", "할 일 추가에 실패했어요. 다시 시도해 주세요.");
    } finally {
      endLocalMutation();
    }
  };

  const openChoreSelection = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return;
    const couple = currentCoupleId
      ? { id: currentCoupleId, user_a_id: userId, user_b_id: partnerId }
      : await ensureCouple(userId);
    syncCoupleState(userId, couple);
    await prepareChoreSelection(couple.id, userId);
    setScreen("chores");
  };

  const disconnectPartnerAndReset = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return;
    if (!partnerId) {
      showAlert("알림", "연결된 파트너가 없어요.");
      return;
    }

    setIsSaving(true);
    try {
      const newCouple = await disconnectPartner();
      syncCoupleState(userId, newCouple);
      setPartnerId(null);
      setPartnerProfile(null);
      setMyCode("");
      setInviteCode("");
      setCurrentCycleId(null);
      setTasks([]);
      setLetters([]);
      setReactions([]);
      setWeeklyStats([]);
      setWeeklyLetterStatus({ meSent: false, partnerSent: false, bothSent: false });
      setClosingWeekTasks([]);
      setClosingWeekRange(null);
      setShowWeekClosePopup(false);
      setIcebreakerPhrasesCache(null);
      setLetterBody("");
      setReaction("");
      setChoreMode("first");
      await prepareChoreSelection(newCouple.id, userId);
      setScreen("chores");
    } catch (error) {
      showAlert("알림", parseDisconnectError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (nextNickname: string, nextEmoji: string) => {
    const trimmed = nextNickname.trim();
    if (!trimmed) {
      showAlert("알림", "닉네임을 입력해주세요.");
      return;
    }
    const userId = await ensureSignedInUser();
    if (!userId) return;
    try {
      await ensureProfile(userId, trimmed, nextEmoji);
      setNickname(trimmed);
      setSelectedEmoji(nextEmoji);
      setShowProfileEdit(false);
    } catch {
      showAlert("저장 실패", "프로필 저장에 실패했어요.");
    }
  };

  const handleNotificationOpen = async (notification: AppNotification) => {
    try {
      if (!notification.read) {
        beginLocalMutation();
        try {
          await markNotificationRead(notification.id);
          setNotifications((current) => {
            const next = current.map((item) => (
              item.id === notification.id ? { ...item, read: true } : item
            ));
            notificationsFingerprintRef.current = notificationsFingerprint(next);
            return next;
          });
        } finally {
          endLocalMutation();
        }
      }
    } catch {
      // 읽음 처리 실패는 이동을 막지 않습니다.
    }

    // 파트너 연결: 읽음만, 화면 이동 없음
    if (notification.kind === "partner_connect") return;

    // 편지/리액션: D-01 편지 화면 + 해당 날짜 선택
    if (notification.kind === "letter" || notification.kind === "reaction") {
      setLettersFocusAt(notification.createdAt);
      setSelectedLetter(null);
      setSelectedReaction(null);
      setScreen("letters");
      return;
    }

    // 할 일 완료 등: C-01 홈
    setLettersFocusAt(null);
    setScreen("home");
  };

  const handleMarkAllNotificationsRead = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return;
    const hasUnread = notifications.some((item) => !item.read);
    if (!hasUnread) return;

    beginLocalMutation();
    try {
      await markAllNotificationsRead(userId);
      setNotifications((current) => {
        const next = current.map((item) => ({ ...item, read: true }));
        notificationsFingerprintRef.current = notificationsFingerprint(next);
        return next;
      });
    } catch {
      showAlert("알림", "모두 읽음 처리에 실패했어요. 다시 시도해 주세요.");
    } finally {
      endLocalMutation();
    }
  };

  const handleApplyTemplateEdit = () => {
    if (templateSheet?.kind !== "edit") return;
    const title = templateDraft.title.trim();
    if (!title) {
      showAlert("알림", "할 일명을 입력해주세요.");
      return;
    }
    const target = templateSheet.template;
    const originalTitle = target.title;
    const category = normalizeCategory(target.category);

    setTemplates((current) => current.map((item) => (
      item.id === target.id
        ? { ...item, title, category: templateDraft.category || item.category }
        : item
    )));
    setTasks((current) => current.map((task) => (
      task.title === originalTitle && normalizeCategory(task.category) === category
        ? { ...task, title }
        : task
    )));
    setEditingTemplate(null);
    setTemplateDraft({ title: "", category: "기타" });
    setTemplateSheet(null);
  };

  const handleApplyTemplateAdd = () => {
    if (templateSheet?.kind !== "add") return;
    const title = templateDraft.title.trim();
    if (!title) {
      showAlert("알림", "할 일명을 입력해주세요.");
      return;
    }

    const category = normalizeCategory(templateSheet.category);
    const draftId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const iconKey = iconKeyForCategory(category);
    const created: AppChoreTemplate = {
      id: draftId,
      title,
      category,
      iconKey,
    };

    setTemplates((current) => [...current, created]);
    setTasks((current) => [
      ...current,
      {
        id: draftId,
        title,
        category,
        iconKey,
        assignee: "none",
        selected: true,
        done: false,
        reacted: false,
      },
    ]);
    setEditingTemplate(null);
    setTemplateDraft({ title: "", category: "기타" });
    setTemplateSheet(null);
  };

  const handleDeleteTemplate = (template: AppChoreTemplate) => {
    void (async () => {
      try {
        if (isPersistedId(template.id)) {
          await deleteChoreTemplate(template.id);
        }
        const category = normalizeCategory(template.category);
        setTemplates((current) => current.filter((item) => item.id !== template.id));
        setTasks((current) => current.filter((task) => !(
          (task.id === template.id)
          || (task.title === template.title && normalizeCategory(task.category) === category)
        )));
        setTemplateSheet(null);
        showAlert("알림", "삭제가 완료되었습니다.");
      } catch {
        showAlert("삭제 실패", "삭제에 실패했어요.");
      }
    })();
  };

  const handleSaveTemplateManage = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return;

    const context = await ensureCoupleAndCycle();
    if (!context) {
      setScreen("mypage");
      return;
    }

    setIsSaving(true);
    try {
      const savedTemplates: AppChoreTemplate[] = [];

      for (const template of templates) {
        if (isPersistedId(template.id)) {
          await updateChoreTemplate(template.id, template.title, template.category);
          savedTemplates.push(template);
        } else {
          const created = await createChoreTemplate(userId, template.title, template.category);
          savedTemplates.push(created);
        }
      }

      setTemplates(savedTemplates);

      const nextTasks: AppTask[] = savedTemplates.map((template, index) => {
        const source = templates[index];
        const existing = tasks.find((task) => (
          task.id === source.id
          || task.id === template.id
          || (task.title === template.title && normalizeCategory(task.category) === normalizeCategory(template.category))
        ));
        return {
          id: existing && isPersistedId(existing.id) ? existing.id : template.id,
          title: template.title,
          category: template.category,
          iconKey: template.iconKey ?? iconKeyForCategory(template.category),
          assignee: existing?.assignee ?? "none",
          selected: true,
          done: existing?.done ?? false,
          completedAt: existing?.completedAt ?? null,
          reacted: existing?.reacted ?? false,
          myReaction: existing?.myReaction ?? null,
        };
      });
      const savedTasks = await replaceWeeklyChores(context.cycleId, context.userId, nextTasks);
      setTasks(savedTasks);
      setScreen("mypage");
    } catch {
      showAlert("저장 실패", "이번 주 할 일 저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePartnerRedeem = async () => {
    const userId = await ensureSignedInUser();
    if (!userId || !inviteCode.trim()) {
      showAlert("코드 입력", "파트너 초대 코드를 입력해 주세요.");
      return;
    }
    void connectWithInviteCode(inviteCode.trim(), { fromSettings: true });
  };

  const connectWithInviteCode = async (
    code: string,
    _options: { fromSettings: boolean },
  ) => {
    const userId = await ensureSignedInUser();
    if (!userId) return;

    trackEvent("invite_code_entered");

    inviteBusyRef.current = true;
    setIsSaving(true);
    try {
      await ensureProfile(userId, nickname.trim() || "모아", selectedEmoji);

      const coupleId = await redeemInviteCode(code, true);
      const couple = await getCurrentCouple();
      syncCoupleState(userId, couple ?? { id: coupleId, user_a_id: userId, user_b_id: null });
      setInviteCode("");
      trackEvent("partner_connected");

      const inviteOwnerId = couple
        ? (couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id)
        : null;
      if (inviteOwnerId) {
        try {
          await createNotification({
            userId: inviteOwnerId,
            title: "파트너 연결 알림",
            body: partnerConnectNotifBody(nickname),
          });
        } catch {
          // 알림 실패는 연결 성공을 막지 않음
        }
      }

      // 유효 코드 연결 성공 → 알럿 확인 후 A-06 (선택분은 파트너 목록과 합산)
      showAlert(
        "",
        "파트너와 연결되었어요!\n이제 할 일을 설정해 볼까요?",
        () => void openChoresAfterPartnerConnect(coupleId, userId),
      );
    } catch (error) {
      const isNetworkError = !navigator.onLine || (error instanceof Error && /network|fetch|Failed to fetch/i.test(error.message));
      showAlert("알림", isNetworkError ? "인터넷 연결을 확인해 주세요." : parseInviteError(error));
    } finally {
      inviteBusyRef.current = false;
      setIsSaving(false);
    }
  };

  /** 코드 입력 연결 후 A-06: 신규 선택분을 파트너 할 일과 합산(중복 허용) */
  const openChoresAfterPartnerConnect = async (coupleId: string, userId: string) => {
    await loadCycleData(coupleId, userId);
    setChoreSaveMode("merge");
    const seeded = await seedDefaultTemplates(userId);
    setTemplates(seeded);
    setTasks(mergeTemplatesIntoCatalog(seeded));
    setChoreMode("first");
    setScreen("chores");
  };

  const toggleChoreSelection = (id: string) => {
    setTasks((current) => current.map((task) => (
      task.id === id ? { ...task, selected: !task.selected } : task
    )));
  };

  const setAllChoresSelected = (selected: boolean) => {
    setTasks((current) => current.map((task) => ({ ...task, selected })));
  };

  const setCategoryChoresSelected = (category: string, selected: boolean) => {
    setTasks((current) => current.map((task) => (
      task.category === category ? { ...task, selected } : task
    )));
  };

  const addCategoryTask = () => {
    if (!addingCategory) return;

    const title = newTask.trim();
    if (!title) {
      showAlert("알림", "할 일명을 입력해주세요.");
      return;
    }

    const customTask: AppTask = {
      id: `custom-${Date.now()}`,
      title: title.slice(0, 30),
      category: normalizeCategory(addingCategory),
      iconKey: iconKeyForCategory(addingCategory),
      assignee: "none",
      selected: false,
      done: false,
      reacted: false,
    };

    setTasks((current) => {
      const base = current.length > 0 ? current : choreSelectionTasks;
      return [...base, customTask];
    });
    setNewTask("");
    setAddingCategory(null);
  };

  const saveWeeklyChoresAndGoHome = async () => {
    const context = await ensureCoupleAndCycle();
    if (!context) return;

    if (choreSelectionTasks.filter((task) => task.selected).length === 0) {
      showAlert("알림", "할 일을 1개 이상 선택해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      // 파트너 연결 시 기존 할 일과 합산(중복 가능). 미연결은 교체 저장.
      const savedTasks = (choreSaveMode === "merge" || Boolean(partnerId))
        ? await appendWeeklyChores(context.cycleId, context.userId, choreSelectionTasks, context.userId, partnerId)
        : await replaceWeeklyChores(context.cycleId, context.userId, choreSelectionTasks);
      setTasks(savedTasks);
      setChoreSaveMode("replace");
      const inputCounts = countTodoInputTypes(choreSelectionTasks.filter((task) => task.selected));
      trackEvent("todo_created", {
        app_user_id: context.userId,
        todo_count: inputCounts.todo_count,
        template_count: inputCounts.template_count,
        manual_count: inputCounts.manual_count,
        source: choreMode === "first" ? "onboarding" : "weekly_select",
      });
      goHome();
    } catch {
      showAlert("저장 실패", "이번 주 할 일 저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const proceedInviteToChores = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return;
    const couple = currentCoupleId
      ? { id: currentCoupleId, user_a_id: userId, user_b_id: partnerId }
      : await ensureCouple(userId);
    syncCoupleState(userId, couple);
    setChoreSaveMode("replace");
    await prepareChoreSelection(couple.id, userId);
    setScreen("chores");
  };

  /** 파트너 연결 후: 파트너 할 일 있음 → C-01 / 없음 → A-06 (합산 저장) */
  const continueAfterPartnerCheck = async (
    coupleId: string,
    userId: string,
    options?: { partnerHasChores?: boolean },
  ) => {
    const taskCount = await loadCycleData(coupleId, userId);
    const partnerHasChores = options?.partnerHasChores;

    // 파트너 할 일 없음(N) → A-06 (내 할 일이 있어도 추가 선택 가능, 합산 저장)
    if (partnerHasChores === false) {
      setChoreSaveMode(taskCount > 0 ? "merge" : "replace");
      await prepareChoreSelection(coupleId, userId);
      setScreen("chores");
      return;
    }

    // 파트너 할 일 있음(Y) 또는 합산 후 목록이 있으면 C-01
    if (partnerHasChores === true || taskCount > 0) {
      setScreen("home");
      return;
    }

    setChoreSaveMode("replace");
    await prepareChoreSelection(coupleId, userId);
    setScreen("chores");
  };

  const handleInviteNext = async () => {
    if (inviteBusyRef.current || isSaving) return;
    const userId = await ensureSignedInUser();
    if (!userId) return;
    const fromSettings = inviteEntry === "settings";

    if (!inviteCode.trim() && !myCode) {
      showConfirm(
        "",
        "아직 코드를 생성하지 않았어요.\n연결을 나중에 할까요?",
        () => undefined,
        "연결할게요",
        "나중에 할게요",
        () => {
          if (fromSettings) {
            setScreen("mypage");
            return;
          }
          void proceedInviteToChores();
        },
      );
      return;
    }

    inviteBusyRef.current = true;
    setIsSaving(true);
    try {
      await ensureProfile(userId, nickname.trim() || "모아", selectedEmoji);

      // 파트너 코드 입력 → 즉시 연결 (F-01 할 일 병합 정책 포함)
      if (inviteCode.trim()) {
        inviteBusyRef.current = false;
        setIsSaving(false);
        await connectWithInviteCode(inviteCode.trim(), { fromSettings });
        return;
      }

      // 내 코드만 있는 경우: 파트너가 이미 등록했는지 최신 상태 확인
      const couple = await getCurrentCouple() ?? await ensureCouple(userId);
      syncCoupleState(userId, couple);
      const partnerConnected = Boolean(couple.user_b_id);

      if (fromSettings) {
        setScreen("mypage");
        return;
      }

      if (partnerConnected) {
        await continueAfterPartnerCheck(couple.id, userId);
        return;
      }

      // 파트너 연결 미완료 (즉시 등록 전 / 시간차 등록 대기)
      showAlert(
        "알림",
        "아직 할 일을 설정하지 않았어요. 지금 설정해볼까요?",
        () => void proceedInviteToChores(),
      );
    } catch (error) {
      const isNetworkError = !navigator.onLine || (error instanceof Error && /network|fetch|Failed to fetch/i.test(error.message));
      showAlert("알림", isNetworkError ? "인터넷 연결을 확인해 주세요." : parseInviteError(error));
    } finally {
      inviteBusyRef.current = false;
      setIsSaving(false);
    }
  };

  const handleSkipInvite = () => {
    if (inviteEntry === "settings") {
      setScreen("mypage");
      return;
    }

    // 왼쪽: 나중에 할게요 → A-06 / 오른쪽: 연결할게요 → A-04 유지
    showConfirm(
      "",
      "파트너 연결을 나중에 할까요?\n파트너와 함께해야 집이 완성돼요 🏠\n마이페이지에서 언제든 연결할 수 있어요.",
      () => undefined,
      "연결할게요",
      "나중에 할게요",
      () => void proceedInviteToChores(),
    );
  };

  const openWeeklyStatsReport = async (targetCycleId: string, coupleId: string, userId: string) => {
    if (closingWeekRange) {
      window.localStorage.removeItem(weekCloseStorageKey(userId, closingWeekRange.weekStart));
    }
    setShowWeekClosePopup(false);

    const letterStatus = await getWeeklyLetterStatus(targetCycleId, userId, partnerId);
    setWeeklyLetterStatus(letterStatus);
    const weekChores = await loadWeeklyChores(targetCycleId, userId, partnerId);
    // 전체수 = 나와 파트너가 설정한 할 일 합산(공유 사이클 전체). 완료수 = 양쪽 완료 합산.
    const weekDone = weekChores.filter((task) => task.done).length;
    const weekMeDone = weekChores.filter((task) => task.done && task.assignee === "me").length;
    const weekPartnerDone = weekChores.filter((task) => task.done && task.assignee === "partner").length;
    const weekTotal = weekChores.length;
    const weekProgress = calcWeekProgress(weekDone, weekTotal, letterStatus);
    const complete = letterStatus.bothSent && weekProgress >= 100;
    trackEvent("castle_stage_finalized", {
      completion_rate: weekProgress,
      castle_stage: castleStageFromRate(weekProgress),
      both_letters_sent: letterStatus.bothSent,
    });
    setStatsComplete(complete);
    setWeekStreak(await countCompletedWeekStreak(coupleId));
    setClosingWeekProgress(weekProgress);
    setClosingWeekTasks(weekChores);
    setReportTasks(weekChores);
    setReportMeta({
      progress: weekProgress,
      completeCount: weekDone,
      totalCount: weekTotal,
      meDone: weekMeDone,
      partnerDone: weekPartnerDone,
    });
    try {
      await upsertWeeklyStats({
        cycleId: targetCycleId,
        completionRate: weekProgress,
        meCompletedCount: weekMeDone,
        partnerCompletedCount: weekPartnerDone,
        sentLetterCount: (letterStatus.meSent ? 1 : 0) + (letterStatus.partnerSent ? 1 : 0),
      });
      setWeeklyStats(await loadWeeklyStats(coupleId, partnerId));
    } catch {
      // 통계 저장 실패가 결과 화면 진입을 막지 않게 둡니다.
    }
    setStatsEntry("letter");
    setScreen("stats");
  };

  const sendLetter = async (weekly = false) => {
    const meaningfulLength = letterBody.replace(/\s/g, "").length;
    if (meaningfulLength < 1) {
      showAlert("알림", weekly ? "편지를 입력해 주세요." : "편지 내용을 입력해 주세요.");
      return;
    }

    const userId = await ensureSignedInUser();
    if (!userId) return;

    try {
      let targetCycleId = currentCycleId;
      if (weekly && currentCoupleId && closingWeekRange) {
        targetCycleId = await ensureCurrentCycleForWeek(
          currentCoupleId,
          closingWeekRange.weekStart,
          closingWeekRange.weekEnd,
        );
      }

      const savedLetter = await insertLetter({
        cycleId: targetCycleId,
        senderId: userId,
        receiverId: partnerId,
        body: letterBody,
        reaction: reaction || "💌",
        weekly,
      });

      setLetters((current) => [savedLetter, ...current]);
      if (!weekly) setLastSentLetter(savedLetter);
      setLetterBody("");
      setReaction("");
      setIcebreakerPhrasesCache(null);

      if (partnerId && notificationEnabled) {
        try {
          await createNotification({
            userId: partnerId,
            title: "편지 알림",
            body: letterNotifBody(nickname),
          });
        } catch {
          // 알림 실패는 편지 전송 성공을 막지 않음
        }
      }

      const usedAi = usedAiSuggestionRef.current;
      usedAiSuggestionRef.current = false;
      trackEvent("letter_sent", {
        app_user_id: userId,
        letter_type: weekly ? "forced" : "voluntary",
        used_ai_suggestion: usedAi,
      });
      if (weekly) {
        trackEvent("weekly_praise_created", {
          trigger_context: "weekly_required",
          used_ai_suggestion: usedAi,
        });
      }

      if (weekly && targetCycleId && currentCoupleId) {
        await openWeeklyStatsReport(targetCycleId, currentCoupleId, userId);
        return;
      }

      setScreen(weekly ? "stats" : "sent");
    } catch (error) {
      const isNetworkError = !navigator.onLine || (error instanceof Error && /network|fetch|Failed to fetch/i.test(error.message));
      if (!weekly) {
        showToast("전송에 실패했어요. 다시 시도해 주세요.");
        return;
      }
      showAlert("알림", isNetworkError ? "인터넷 연결을 확인해 주세요." : "편지 전송에 실패했어요. 다시 시도해 주세요.");
    }
  };

  const skipWeeklyLetterLater = async () => {
    const userId = await ensureSignedInUser();
    if (!userId || !currentCoupleId) {
      setScreen("home");
      return;
    }

    try {
      let targetCycleId = currentCycleId;
      if (closingWeekRange) {
        targetCycleId = await ensureCurrentCycleForWeek(
          currentCoupleId,
          closingWeekRange.weekStart,
          closingWeekRange.weekEnd,
        );
      }
      if (!targetCycleId) {
        setScreen("home");
        return;
      }
      await openWeeklyStatsReport(targetCycleId, currentCoupleId, userId);
    } catch {
      showAlert("알림", "화면 이동에 실패했어요. 다시 시도해 주세요.");
    }
  };

  const handleWeeklyLetterLater = () => {
    // 작성 유무와 관계없이 컨펌 → 확인 시 미저장으로 B-03 이동
    showConfirm(
      "",
      "편지를 작성하지 않으시면 성을 완성하지 못하게 됩니다. 그래도 넘어가시겠습니까?",
      () => {
        setLetterBody("");
        setReaction("");
        setIcebreakerPhrasesCache(null);
        void skipWeeklyLetterLater();
      },
      "확인",
      "취소",
    );
  };

  const requestSendInstantLetter = () => {
    const meaningfulLength = letterBody.replace(/\s/g, "").length;
    if (meaningfulLength < 1) {
      showAlert("알림", "편지 내용을 입력해 주세요.");
      return;
    }

    showConfirm(
      "",
      "전송 후 수정 및 삭제가 불가능합니다.\n보내시겠습니까?",
      () => void sendLetter(false),
      "확인",
      "취소",
    );
  };

  const requestSendWeeklyLetter = () => {
    const meaningfulLength = letterBody.replace(/\s/g, "").length;
    if (meaningfulLength < 1) {
      showAlert("알림", "편지를 입력해 주세요.");
      return;
    }

    showConfirm(
      "",
      "전송 후 수정 및 삭제가 불가능합니다.\n보내시겠습니까?",
      () => void sendLetter(true),
      "네",
      "아니오",
    );
  };

  const openWeeklyLetterFromClosePopup = () => {
    if (!navigator.onLine) {
      showAlert("알림", "인터넷 연결을 확인해 주세요.");
      return;
    }
    setShowWeekClosePopup(false);
    setScreen("weeklyLetter");
  };

  const handleReact = async (id: string, reactionValue = "💗") => {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.reacted) return;

    beginLocalMutation();
    setTasks((current) => {
      const next = current.map((item) => (item.id === id ? { ...item, reacted: true, myReaction: reactionValue } : item));
      tasksFingerprintRef.current = tasksFingerprint(next);
      return next;
    });

    const userId = await ensureSignedInUser();
    if (!userId || !isPersistedId(id)) {
      endLocalMutation();
      return;
    }

    try {
      await addChoreReaction(id, userId, reactionValue);
      trackEvent("reaction_sent", { app_user_id: userId, reaction: reactionValue });
      setReactions((current) => [
        {
          id: `local-${Date.now()}`,
          from: "me",
          reaction: reactionValue,
          choreTitle: task.title,
          createdAt: new Date().toISOString(),
          date: new Date().toLocaleDateString("ko-KR"),
        },
        ...current,
      ]);
      if (partnerId && notificationEnabled) {
        try {
          await createNotification({
            userId: partnerId,
            choreId: id,
            title: reactionNotifTitle(reactionValue),
            body: reactionNotifBody(nickname, task.title),
          });
        } catch {
          // 리액션 저장 성공 후 알림 실패는 롤백하지 않음
        }
      }
    } catch {
      setTasks((current) => {
        const next = current.map((item) => (item.id === id ? { ...item, reacted: false, myReaction: null } : item));
        tasksFingerprintRef.current = tasksFingerprint(next);
        return next;
      });
      showToast("전송에 실패했어요.");
    } finally {
      endLocalMutation();
    }
  };

  const requestReact = (id: string, title: string, reactionValue: string, reactionLabel: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.reacted) return;
    showConfirm(
      "",
      `'${title}'에 ${reactionLabel}를 보내시겠습니까?`,
      () => void handleReact(id, reactionValue),
      "네",
      "아니오",
    );
  };

  const closeWeek = async () => {
    if (!currentCycleId) {
      setScreen("weeklyLetter");
      return;
    }

    try {
      await upsertWeeklyStats({
        cycleId: currentCycleId,
        completionRate: progress,
        meCompletedCount: meDone,
        partnerCompletedCount: partnerDone,
        sentLetterCount: letters.length,
      });
      if (currentCoupleId) setWeeklyStats(await loadWeeklyStats(currentCoupleId, partnerId));
    } catch {
      // 통계 저장 실패가 주간 마감 흐름 자체를 막지는 않게 둡니다.
    }

    const range = currentWeekRange();
    setClosingWeekRange(range);
    setClosingWeekProgress(progress);
    setClosingWeekTasks(tasks);
    if (currentUserId) {
      window.localStorage.setItem(weekCloseStorageKey(currentUserId, range.weekStart), "pending");
    }
    setShowWeekClosePopup(true);
    setScreen("home");
  };

  const finishWeekAndStartNext = async () => {
    if (!currentCoupleId) return;
    const userId = await ensureSignedInUser();
    if (!userId) return;

    setIsSaving(true);
    try {
      const closedRange = closingWeekRange ?? currentWeekRange(-1);
      const closingCycleId = await ensureCurrentCycleForWeek(
        currentCoupleId,
        closedRange.weekStart,
        closedRange.weekEnd,
      );
      await closeWeeklyCycle(closingCycleId);

      // 마감한 주가 이번 주면 다음 주로, 지난주면 이번 주(새 주기)로
      const thisWeek = currentWeekRange(0);
      const nextRange = closedRange.weekStart === thisWeek.weekStart
        ? currentWeekRange(1)
        : thisWeek;
      const cycleId = await ensureCurrentCycleForWeek(
        currentCoupleId,
        nextRange.weekStart,
        nextRange.weekEnd,
      );
      setCurrentCycleId(cycleId);

      const existing = await loadWeeklyChores(cycleId, userId, partnerId);
      if (existing.length > 0) {
        await loadCycleData(currentCoupleId, userId);
        setScreen("home");
        showAlert(
          "알림",
          "파트너가 이미 할 일을 설정하였어요. 이번 주 일을 같이 시작해보세요!",
        );
        return;
      }

      // 파트너 미설정: A-06에 전체 템플릿 + 지난주 등록분(완료 여부 무관) 자동 체크
      const lastWeekTasks = await loadWeeklyChores(closingCycleId, userId, partnerId);
      const seeded = await seedDefaultTemplates(userId);
      setTemplates(seeded);
      setTasks(buildRepeatChoreCatalog(seeded, lastWeekTasks));
      setChoreMode("repeat");
      setWeeklyLetterStatus({ meSent: false, partnerSent: false, bothSent: false });
      setIcebreakerPhrasesCache(null);
      setScreen("chores");
    } catch {
      showAlert("주기 전환 실패", "다음 주로 넘어가지 못했어요. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const openWeeklyReportFromCastle = (stat: AppWeeklyStat) => {
    void (async () => {
      if (!currentCoupleId || !currentUserId) return;
      trackEvent("castle_history_card_clicked", {
        app_user_id: currentUserId,
        week_start: stat.weekStart,
        completion_rate: stat.completionRate,
      });

      const meCount = stat.meCompletedCount;
      const partnerCount = stat.partnerCompletedCount;
      const totalDone = meCount + partnerCount;

      setClosingWeekRange({ weekStart: stat.weekStart, weekEnd: stat.weekEnd });
      setStatsComplete(stat.completionRate >= 100);
      setStatsEntry("castle");
      setClosingWeekProgress(stat.completionRate);
      // 상세 로드 전: 완료 합만 알 수 있음. 전체수는 로드 후 확정(0건이면 빈 상태 문구).
      setReportMeta({
        progress: stat.completionRate,
        completeCount: totalDone,
        totalCount: totalDone,
        meDone: meCount,
        partnerDone: partnerCount,
      });
      setReportTasks([]);
      setScreen("stats");

      try {
        const cycleId = await ensureCurrentCycleForWeek(currentCoupleId, stat.weekStart, stat.weekEnd);
        const [weekChores, letterStatus, weekLetters] = await Promise.all([
          loadWeeklyChores(cycleId, currentUserId, partnerId),
          getWeeklyLetterStatus(cycleId, currentUserId, partnerId),
          loadLetters(currentUserId),
        ]);
        const weekDone = weekChores.filter((task) => task.done).length;
        const weekMeDone = weekChores.filter((task) => task.done && task.assignee === "me").length;
        const weekPartnerDone = weekChores.filter((task) => task.done && task.assignee === "partner").length;
        const weekTotal = weekChores.length;
        const weekProgress = calcWeekProgress(weekDone, weekTotal, letterStatus);

        setWeeklyLetterStatus(letterStatus);
        setLetters(weekLetters);
        setReportTasks(weekChores);
        setClosingWeekTasks(weekChores);
        setClosingWeekProgress(weekProgress);
        setStatsComplete(letterStatus.bothSent && weekProgress >= 100);
        setReportMeta({
          progress: weekProgress,
          completeCount: weekDone,
          totalCount: weekTotal,
          meDone: weekMeDone,
          partnerDone: weekPartnerDone,
        });
        setWeeklyStats((current) => current.map((item) => (
          item.id === stat.id || item.weekStart === stat.weekStart
            ? { ...item, completionRate: weekProgress }
            : item
        )));
        try {
          await upsertWeeklyStats({
            cycleId,
            completionRate: weekProgress,
            meCompletedCount: weekMeDone,
            partnerCompletedCount: weekPartnerDone,
            sentLetterCount: (letterStatus.meSent ? 1 : 0) + (letterStatus.partnerSent ? 1 : 0),
          });
        } catch {
          // 카드/상세 일치용 재계산 저장 실패는 상세 표시를 막지 않음
        }
      } catch {
        // 상세 로드 실패 시 통계 카드 수치만으로 표시합니다.
      }
    })();
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  const renderScreen = () => {
    switch (screen) {
      case "landing":
        return (
          <StartScreen
            onStart={() => setScreen("profile")}
            onLogin={() => setScreen("login")}
          />
        );
      case "profile":
        return (
          <ProfileScreen
            nickname={nickname}
            selectedEmoji={selectedEmoji}
            onNicknameChange={setNickname}
            onEmojiChange={setSelectedEmoji}
            agreedToTerms={agreedToTerms}
            onTermsChange={setAgreedToTerms}
            onOpenTerms={() => setScreen("terms")}
            onBack={() => setScreen("landing")}
            onNext={handleProfileNext}
          />
        );
      case "terms":
        return <TermsPolicyScreen onBack={() => setScreen("profile")} />;
      case "social":
        return (
          <SocialSignupScreen
            isLoggingIn={isLoggingIn}
            onBack={() => setScreen("profile")}
            onLogin={() => handleSocialLogin("social")}
          />
        );
      case "login":
        return (
          <LoginScreen
            isLoggingIn={isLoggingIn}
            onBack={() => setScreen("landing")}
            onLogin={() => handleSocialLogin("login")}
          />
        );
      case "invite":
        return (
          <InviteScreen
            selectedEmoji={selectedEmoji}
            entry={inviteEntry}
            onSelectCreate={() => {
              setInviteCode("");
              setScreen("inviteCreate");
              void createInviteCodeForUser({ showModal: false });
            }}
            onSelectEnter={() => setScreen("inviteEnter")}
            onSkip={handleSkipInvite}
            onBack={inviteEntry === "settings" ? () => setScreen("mypage") : undefined}
            isSaving={isSaving}
          />
        );
      case "inviteCreate":
        return (
          <InviteCreateScreen
            selectedEmoji={selectedEmoji}
            myCode={myCode}
            entry={inviteEntry}
            onCopyCode={() => void copyInviteCode()}
            onGoChores={() => void proceedInviteToChores()}
            onDone={() => setScreen("mypage")}
            onBack={() => setScreen("invite")}
            isSaving={isSaving}
          />
        );
      case "inviteEnter":
        return (
          <InviteEnterScreen
            selectedEmoji={selectedEmoji}
            inviteCode={inviteCode}
            onInviteCodeChange={setInviteCode}
            onConnect={() => {
              if (!inviteCode.trim()) {
                showAlert("코드 입력", "파트너 초대 코드를 입력해 주세요.");
                return;
              }
              void connectWithInviteCode(inviteCode.trim(), {
                fromSettings: inviteEntry === "settings",
              });
            }}
            onBack={() => setScreen("invite")}
            isSaving={isSaving}
          />
        );
      case "chores":
        return (
          <ChoreSelectScreen
            tasks={choreSelectionTasks}
            groupedTasks={groupedTasks}
            choreMode={choreMode}
            weekLabel={(() => {
              const { weekStart, weekEnd } = currentWeekRange();
              return formatWeekRangeLabel(weekStart, weekEnd);
            })()}
            onToggle={toggleChoreSelection}
            onToggleAll={() => {
              const allSelected = choreSelectionTasks.length > 0 && choreSelectionTasks.every((task) => task.selected);
              setAllChoresSelected(!allSelected);
            }}
            onToggleCategory={(category) => {
              const categoryTasks = choreSelectionTasks.filter((task) => task.category === category);
              const allSelected = categoryTasks.length > 0 && categoryTasks.every((task) => task.selected);
              setCategoryChoresSelected(category, !allSelected);
            }}
            onStartAdd={(category) => {
              setAddingCategory(category);
              setNewTask("");
            }}
            onDone={saveWeeklyChoresAndGoHome}
            isSaving={isSaving}
          />
        );
      case "letter":
        return (
          <LetterWriteScreen
            body={letterBody}
            reaction={reaction}
            partnerProfile={partnerProfile}
            onBodyChange={setLetterBody}
            onReactionChange={setReaction}
            onBack={goHome}
            onOpenAi={() => setShowIcebreakerAi(true)}
            onEmpty={() => showAlert("알림", "편지 내용을 입력해 주세요.")}
            onSend={requestSendInstantLetter}
          />
        );
      case "weeklyLetter":
        return (
          <WeeklyLetterScreen
            body={letterBody}
            reaction={reaction}
            progress={closingWeekProgress || progress}
            weekStart={closingWeekRange?.weekStart ?? currentWeekRange(-1).weekStart}
            weekEnd={closingWeekRange?.weekEnd ?? currentWeekRange(-1).weekEnd}
            partnerProfile={partnerProfile}
            onBodyChange={setLetterBody}
            onReactionChange={setReaction}
            onOpenAi={() => setShowIcebreakerAi(true)}
            onEmpty={() => showAlert("알림", "편지를 입력해 주세요.")}
            onSend={requestSendWeeklyLetter}
            onLater={handleWeeklyLetterLater}
          />
        );
      case "sent":
        return (
          <SentScreen
            partnerProfile={partnerProfile}
            letter={lastSentLetter}
            onHome={goHome}
            onWriteAgain={() => {
              setLetterBody("");
              setReaction("");
              setIcebreakerPhrasesCache(null);
              setScreen("letter");
            }}
          />
        );
      case "close":
        return (
          <CloseWeekScreen
            onCancel={goHome}
            onNext={() => {
              void closeWeek();
            }}
          />
        );
      case "stats": {
        const reportProgress = reportMeta?.progress ?? progress;
        const reportCompleteCount = reportMeta?.completeCount ?? completeCount;
        const reportTotalCount = reportMeta?.totalCount ?? tasks.length;
        const reportMeDone = reportMeta?.meDone ?? meDone;
        const reportPartnerDone = reportMeta?.partnerDone ?? partnerDone;
        const reportWeek = closingWeekRange ?? currentWeekRange(-1);
        const weeklyLetters = letters.filter((letter) => (
          letter.kind === "weekly"
          || letter.title.includes("주간")
        ));
        const inReportWeek = (iso: string) => {
          const day = iso.slice(0, 10);
          return day >= reportWeek.weekStart && day <= reportWeek.weekEnd;
        };
        const reportLetterCount = letters.filter((letter) => inReportWeek(letter.createdAt)).length;
        const reportReactionCount = reactions.filter((item) => inReportWeek(item.createdAt)).length;
        return (
          <StatsScreen
            progress={reportProgress}
            completeCount={reportCompleteCount}
            totalCount={reportTotalCount}
            meDone={reportMeDone}
            partnerDone={reportPartnerDone}
            tasks={reportTasks}
            weekStart={reportWeek.weekStart}
            weekEnd={reportWeek.weekEnd}
            complete={statsComplete || reportProgress >= 100}
            weekStreak={weekStreak}
            letterCount={reportLetterCount}
            reactionCount={reportReactionCount}
            myLetter={weeklyLetters.find((letter) => letter.from === "me") ?? null}
            partnerLetter={weeklyLetters.find((letter) => letter.from === "partner") ?? null}
            selectedEmoji={selectedEmoji}
            partnerProfile={partnerProfile}
            entry={statsEntry}
            onBack={() => {
              if (statsEntry === "castle") {
                setScreen("castle");
                return;
              }
              void finishWeekAndStartNext();
            }}
            onNextWeek={() => void finishWeekAndStartNext()}
            onSelectLetter={(letter) => {
              setSelectedLetter(letter);
              setSelectedReaction(null);
            }}
            isSaving={isSaving}
          />
        );
      }
      case "letters":
        return (
          <LettersScreen
            letters={letters}
            reactions={reactions}
            partnerProfile={partnerProfile}
            nickname={nickname}
            selectedEmoji={selectedEmoji}
            focusAt={lettersFocusAt}
            onSelectLetter={(letter) => {
              setSelectedLetter(letter);
              setSelectedReaction(null);
            }}
            onSelectReaction={(reaction) => {
              setSelectedReaction(reaction);
              setSelectedLetter(null);
            }}
            onSelectDate={(year, month, day) => {
              setLettersFocusAt(null);
              trackEvent("calendar_date_selected", {
                app_user_id: currentUserId,
                date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
              });
            }}
          />
        );
      case "castle":
        return (
          <CastleHistoryScreen
            stats={weeklyStats}
            onSelectWeek={openWeeklyReportFromCastle}
          />
        );
      case "castleExplain":
        return <CastleExplainScreen onBack={() => setScreen("castle")} />;
      case "mypage":
        return (
          <MyPageScreen
            nickname={nickname}
            selectedEmoji={selectedEmoji}
            partnerProfile={partnerProfile}
            partnerConnected={Boolean(partnerId)}
            notificationEnabled={notificationEnabled}
            onEdit={() => setShowProfileEdit(true)}
            onConnectPartner={() => {
              setInviteEntry("settings");
              setScreen("invite");
            }}
            onDisconnectPartner={() => void disconnectPartnerAndReset()}
            onLogout={() => void handleLogout()}
            onDeleteAccount={() => void handleDeleteAccount()}
            onCloseWeek={() => void closeWeek()}
            showConfirm={showConfirm}
            showAlert={showAlert}
          />
        );
      case "notifications":
        return (
          <NotificationsScreen
            notifications={notifications}
            partnerProfile={partnerProfile}
            onBack={goHome}
            onMarkAll={() => void handleMarkAllNotificationsRead()}
            onOpen={(item) => void handleNotificationOpen(item)}
          />
        );
      case "templateManage":
        return (
          <TemplateManageScreen
            templates={templates}
            weekCategories={new Set(tasks.map((task) => normalizeCategory(task.category)))}
            isSaving={isSaving}
            onBack={() => setScreen("mypage")}
            onAdd={(category) => {
              setEditingTemplate(null);
              setTemplateDraft({ title: "", category });
              setTemplateSheet({ kind: "add", category });
            }}
            onEdit={(template) => {
              setEditingTemplate(template);
              setTemplateDraft({ title: template.title, category: template.category });
              setTemplateSheet({ kind: "edit", template });
            }}
            onDelete={(template) => setTemplateSheet({ kind: "delete", template })}
            onSave={() => void handleSaveTemplateManage()}
          />
        );
      case "partnerManage":
        return (
          <PartnerManageScreen
            myCode={myCode}
            inviteCode={inviteCode}
            partnerProfile={partnerProfile}
            isSaving={isSaving}
            onInviteCodeChange={setInviteCode}
            onCreateCode={createInviteCodeForUser}
            onCopyCode={() => void copyInviteCode()}
            onConnect={() => void handlePartnerRedeem()}
            onBack={() => setScreen("mypage")}
          />
        );
      case "notificationSettings":
        return (
          <NotificationSettingsScreen
            enabled={notificationEnabled}
            onToggle={setNotificationEnabled}
            onBack={() => setScreen("mypage")}
          />
        );
      case "accountSettings":
        return (
          <AccountSettingsScreen
            onLogout={() => void handleLogout()}
            onBack={() => setScreen("mypage")}
          />
        );
      case "home":
      default: {
        const homeWeek = currentWeekRange();
        return (
          <HomeScreen
            tasks={tasks}
            progress={progress}
            castleLevel={castleLevel}
            completeCount={completeCount}
            unreadCount={unreadCount}
            weekStart={homeWeek.weekStart}
            weekEnd={homeWeek.weekEnd}
            partnerProfile={partnerProfile}
            onComplete={completeHomeTask}
            onUncomplete={uncompleteHomeTask}
            onReact={requestReact}
            onWriteLetter={() => setScreen("letter")}
            onRename={(id, title) => renameHomeTask(id, title)}
            onDelete={requestDeleteHomeTask}
            onAdd={() => {
              setNewTask("");
              setHomeAdding(true);
            }}
            onNotifications={() => setScreen("notifications")}
            onCastleExplain={() => setShowCastleUpgrade(true)}
          />
        );
      }
    }
  };

  const showNav = ["home", "letters", "castle", "mypage"].includes(screen)
    || (screen === "stats" && statsEntry === "castle");

  return (
    <main className="app-shell">
      <section className="app-frame">
        <div
          className={[
            "screen",
            showNav ? "with-nav" : "",
            !isAuthResolving && !authError && screen === "home" ? "is-home" : "",
          ].filter(Boolean).join(" ")}
        >
          {isAuthResolving ? <AuthLoadingScreen /> : authError ? <AuthErrorScreen message={authError} onRetry={() => {
            setAuthError(null);
            setScreen("login");
          }} /> : renderScreen()}
        </div>
        {showNav && (
          <BottomNav
            current={
              screen === "stats" && statsEntry === "castle"
                ? "castle"
                : screen
            }
            onChange={(next) => {
              if (next === "letters") setLettersFocusAt(null);
              setScreen(next);
            }}
          />
        )}
      </section>

      {alertToast && !ONBOARDING_SCREENS.has(screen) && (
        <button
          className="alert-toast-banner"
          type="button"
          onClick={() => {
            dismissAlertToast();
            if (!alertToast.local) setScreen("notifications");
          }}
        >
          <span className={`alert-toast-icon ${alertToast.kind}`}>
            {alertToast.local && alertToast.message.includes("업그레이드") ? (
              <AssetImage src={commonTrophy} alt="" />
            ) : alertToast.kind === "partner_connect" ? (
              <AvatarMark value={partnerAvatarId(partnerProfile)} />
            ) : alertToast.kind === "reaction" ? (
              <AssetImage
                src={
                  reactionOptions.find((item) => item.value === alertToast.reactionEmoji)?.src
                  ?? reactionLike
                }
                alt=""
              />
            ) : alertToast.kind === "letter" ? (
              <AssetImage src={reactionLetter} alt="" />
            ) : alertToast.kind === "chore_done" ? (
              <AssetImage src={commonCheckboxFilled} alt="" />
            ) : (
              <AssetImage src={commonNotification} alt="" />
            )}
          </span>
          <strong>{alertToast.message}</strong>
        </button>
      )}

      {dialog?.kind === "alert" && (
        <AlertDialog
          title={dialog.title}
          message={dialog.message}
          onClose={() => {
            dialog.onClose?.();
            setDialog(null);
          }}
        />
      )}
      {dialog?.kind === "confirm" && (
        <ConfirmDialog
          title={dialog.title || undefined}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          onConfirm={() => {
            dialog.onConfirm();
            setDialog(null);
          }}
          onCancel={() => {
            dialog.onCancel?.();
            setDialog(null);
          }}
        />
      )}

      {showInviteCodeModal && myCode && (
        <ModalOverlay onClose={() => setShowInviteCodeModal(false)}>
          <h2 className="modal-title">내 초대 코드</h2>
          <p className="modal-message">파트너에게 아래 코드를 공유해 주세요.</p>
          <div className="invite-code-display">
            <strong>{myCode}</strong>
            <button className="copy-icon-button" aria-label="코드 복사" type="button" onClick={() => void copyInviteCode()}>
              <AssetImage src={commonCopy} alt="" />
            </button>
          </div>
          <button className="modal-confirm full" type="button" onClick={() => setShowInviteCodeModal(false)}>확인</button>
        </ModalOverlay>
      )}

      {addingCategory && (
        <AddChoreSheet
          value={newTask}
          onChange={setNewTask}
          onClose={() => {
            setAddingCategory(null);
            setNewTask("");
          }}
          onSubmit={addCategoryTask}
        />
      )}

      {showProfileEdit && (
        <ProfileEditSheet
          nickname={nickname}
          selectedEmoji={selectedEmoji}
          onClose={() => setShowProfileEdit(false)}
          onSave={(nextNickname, nextEmoji) => void handleSaveProfile(nextNickname, nextEmoji)}
        />
      )}

      {templateSheet?.kind === "add" && (
        <TemplateAddSheet
          value={templateDraft.title}
          onChange={(title) => setTemplateDraft((current) => ({ ...current, title }))}
          onClose={() => {
            setEditingTemplate(null);
            setTemplateSheet(null);
          }}
          onSubmit={handleApplyTemplateAdd}
        />
      )}

      {templateSheet?.kind === "edit" && (
        <TemplateEditSheet
          originalTitle={templateSheet.template.title}
          value={templateDraft.title}
          onChange={(title) => setTemplateDraft((current) => ({ ...current, title }))}
          onClose={() => {
            setEditingTemplate(null);
            setTemplateSheet(null);
          }}
          onSubmit={handleApplyTemplateEdit}
        />
      )}

      {templateSheet?.kind === "delete" && (
        <TemplateDeleteSheet
          title={templateSheet.template.title}
          category={templateSheet.template.category}
          onClose={() => setTemplateSheet(null)}
          onConfirm={() => handleDeleteTemplate(templateSheet.template)}
        />
      )}

      {homeAdding && (
        <HomeAddChoreSheet
          templates={templates}
          existingTitles={tasks.map((task) => task.title)}
          onClose={() => {
            setHomeAdding(false);
            setNewTask("");
          }}
          onSave={(title, category) => void addHomeTask(title, category)}
        />
      )}

      {showWeekClosePopup && screen === "home" && (
        <WeekClosePopup
          weekStart={closingWeekRange?.weekStart ?? currentWeekRange(-1).weekStart}
          weekEnd={closingWeekRange?.weekEnd ?? currentWeekRange(-1).weekEnd}
          progress={closingWeekProgress || progress}
          onWriteLetter={openWeeklyLetterFromClosePopup}
        />
      )}

      {showIcebreakerAi && (
        <IcebreakerAiModal
          userId={currentUserId}
          partnerNickname={partnerDisplayName(partnerProfile)}
          tasks={
            screen === "weeklyLetter" && closingWeekTasks.length > 0
              ? closingWeekTasks
              : tasks
          }
          cachedPhrases={icebreakerPhrasesCache}
          onPhrasesLoaded={setIcebreakerPhrasesCache}
          onClose={() => setShowIcebreakerAi(false)}
          onApply={(phrase) => {
            usedAiSuggestionRef.current = true;
            trackEvent("ai_suggestion_applied", { app_user_id: currentUserId });
            setLetterBody((current) => appendIcebreakerPhrase(current, phrase));
            setShowIcebreakerAi(false);
          }}
          onOpened={() => trackEvent("ai_suggestion_opened")}
          onPerspectiveExpanded={(perspective) => trackEvent("ai_suggestion_expanded", {
            perspective_type: AI_PERSPECTIVE_TYPE[perspective],
          })}
          onFailed={() => trackEvent("ai_suggestion_failed")}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      )}

      {showCastleUpgrade && (
        <CastleUpgradeModal onClose={() => setShowCastleUpgrade(false)} />
      )}

      {selectedLetter && (
        <LetterDetailModal
          letter={selectedLetter}
          senderEmoji={
            selectedLetter.from === "me"
              ? resolveAvatarId(selectedEmoji)
              : partnerAvatarId(partnerProfile)
          }
          senderName={
            selectedLetter.from === "me"
              ? (nickname.trim() || "나")
              : partnerDisplayName(partnerProfile)
          }
          onClose={() => setSelectedLetter(null)}
        />
      )}

      {selectedReaction && (
        <ReactionDetailModal
          reaction={selectedReaction}
          senderEmoji={
            selectedReaction.from === "me"
              ? resolveAvatarId(selectedEmoji)
              : partnerAvatarId(partnerProfile)
          }
          senderName={
            selectedReaction.from === "me"
              ? (nickname.trim() || "나")
              : partnerDisplayName(partnerProfile)
          }
          onClose={() => setSelectedReaction(null)}
        />
      )}

      {toastMessage && <div className="toast-banner">{toastMessage}</div>}
    </main>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="center-screen gradient-bg">
      <LogoMark />
      <h2>모아성</h2>
      <p>로그인 정보를 확인하고 있어요</p>
    </div>
  );
}

function AuthErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="center-screen">
      <IconBubble src={commonWarning} alt="경고" />
      <h2>로그인 연결에 실패했어요</h2>
      <p>{message}</p>
      <button className="primary-button" onClick={onRetry}>다시 로그인하기</button>
    </div>
  );
}

function StartScreen({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return (
    <div className="start-screen">
      <div className="start-brand">
        <div className="start-logo">
          <AssetImage src={mainLogo} alt="모아성" />
        </div>
        <h1 className="start-title">모아성</h1>
        <p className="start-subtitle">작은 집안일 하나가 모여 우리의 성이 됩니다</p>
      </div>
      <div className="start-actions">
        <button className="start-primary" onClick={onStart}>새로 시작하기</button>
        <button className="start-secondary" onClick={onLogin}>기존 계정 로그인</button>
      </div>
    </div>
  );
}

function BackChip({ onClick }: { onClick: () => void }) {
  return (
    <button className="back-chip" onClick={onClick} type="button">
      <span aria-hidden>‹</span> 뒤로
    </button>
  );
}

function ProfileScreen({
  nickname,
  selectedEmoji,
  onNicknameChange,
  onEmojiChange,
  agreedToTerms,
  onTermsChange,
  onOpenTerms,
  onBack,
  onNext,
}: {
  nickname: string;
  selectedEmoji: string;
  onNicknameChange: (value: string) => void;
  onEmojiChange: (value: string) => void;
  agreedToTerms: boolean;
  onTermsChange: (value: boolean) => void;
  onOpenTerms: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const selectedAvatar = avatarOptions.find((item) => item.id === selectedEmoji) ?? avatarOptions[0];

  return (
    <div className="profile-setup-screen">
      <BackChip onClick={onBack} />
      <div className="profile-setup-brand">
        <div className="profile-setup-logo">
          <AssetImage src={mainLogo} alt="모아성" />
        </div>
        <h1>모아성</h1>
        <p>작은 집안일 하나가 모여 우리의 성이 됩니다</p>
      </div>

      <section className="profile-card-block">
        <h2>나를 표현할 이모지를 골라요</h2>
        <div className="emoji-grid">
          {avatarOptions.map((avatar) => (
            <button
              aria-label={avatar.label}
              aria-pressed={avatar.id === selectedEmoji}
              className={avatar.id === selectedEmoji ? "emoji-choice selected" : "emoji-choice"}
              key={avatar.id}
              type="button"
              onClick={() => onEmojiChange(avatar.id)}
            >
              <AssetImage src={avatar.src} alt="" />
            </button>
          ))}
        </div>
      </section>

      <section className="profile-card-block nickname-block">
        <h2>닉네임을 입력해요</h2>
        <div className="nickname-field">
          <span className="nickname-avatar">
            <AssetImage src={selectedAvatar.src} alt="" />
          </span>
          <input
            value={nickname}
            maxLength={10}
            placeholder="예: 곰돌이, 토순이..."
            onChange={(event) => onNicknameChange(event.target.value)}
          />
        </div>
      </section>

      <label className="terms-check">
        <input type="checkbox" checked={agreedToTerms} onChange={(event) => onTermsChange(event.target.checked)} />
        <button
          type="button"
          className="terms-link"
          onClick={(event) => {
            event.preventDefault();
            onOpenTerms();
          }}
        >
          이용약관 및 개인정보처리방침에 동의합니다.(필수)
        </button>
      </label>

      <button
        className="start-primary profile-start"
        type="button"
        disabled={!nickname.trim() || !agreedToTerms}
        onClick={onNext}
      >
        시작하기
      </button>
    </div>
  );
}

function TermsPolicyScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="legal-screen">
      <div className="legal-topbar">
        <BackChip onClick={onBack} />
        <h1>이용약관 및 개인정보처리방침</h1>
        <span className="legal-topbar-spacer" aria-hidden />
      </div>
      <div className="legal-card">
        <MarkdownLite source={SERVICE_TERMS_MD} />
        <div className="legal-divider" />
        <MarkdownLite source={PRIVACY_POLICY_MD} />
      </div>
    </div>
  );
}

function SocialSignupScreen({
  isLoggingIn,
  onBack,
  onLogin,
}: {
  isLoggingIn: boolean;
  onBack: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="social-signup-screen">
      <BackChip onClick={onBack} />
      <div className="social-signup-body">
        <div className="social-hero-logo">
          <AssetImage src={mainLogo} alt="모아성" />
        </div>
        <h1>어떤 계정으로 시작할까요?</h1>
        <p>소셜 계정으로 간편하게 연동해요</p>
        <button className="kakao-start-button" disabled={isLoggingIn} type="button" onClick={onLogin}>
          {isLoggingIn ? <span className="button-spinner" aria-hidden /> : <AssetImage src={snsKakao} alt="" />}
          {isLoggingIn ? "연결 중..." : "카카오로 시작하기"}
        </button>
      </div>
    </div>
  );
}

function LoginScreen({
  isLoggingIn,
  onBack,
  onLogin,
}: {
  isLoggingIn: boolean;
  onBack: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="login-screen">
      <BackChip onClick={onBack} />
      <div className="login-body">
        <div className="social-hero-logo">
          <AssetImage src={mainLogo} alt="모아성" />
        </div>
        <h1>다시 돌아오셔서 기뻐요!</h1>
        <p>가입할 때 사용한 계정으로 로그인해요</p>
        <button className="kakao-start-button" disabled={isLoggingIn} type="button" onClick={onLogin}>
          {isLoggingIn ? <span className="button-spinner" aria-hidden /> : <AssetImage src={snsKakao} alt="" />}
          {isLoggingIn ? "연결 중..." : "카카오로 로그인"}
        </button>
      </div>
    </div>
  );
}

function InviteCoupleHeader({ selectedEmoji }: { selectedEmoji: string }) {
  return (
    <div className="invite-couple">
      <span className="invite-avatar me"><AvatarMark value={selectedEmoji} /></span>
      <span className="invite-heart-line">
        <span className="invite-dash" />
        <AssetImage src={reactionHeartPink} alt="" />
        <span className="invite-dash" />
      </span>
      <span className="invite-avatar partner dotted">
        <AssetImage src={avatarQueen} alt="" />
        <span className="invite-partner-heart" aria-hidden>
          <AssetImage src={reactionHeartPink} alt="" />
        </span>
      </span>
    </div>
  );
}

/** A-04 / F-01: 파트너 연결 방법 선택 */
function InviteScreen({
  selectedEmoji,
  entry,
  onSelectCreate,
  onSelectEnter,
  onSkip,
  onBack,
  isSaving,
}: {
  selectedEmoji: string;
  entry: "onboarding" | "settings";
  onSelectCreate: () => void;
  onSelectEnter: () => void;
  onSkip: () => void;
  onBack?: () => void;
  isSaving: boolean;
}) {
  const fromSettings = entry === "settings";
  const createLabel = fromSettings ? "코드 생성" : "내가 먼저 시작할게요";
  const enterLabel = fromSettings ? "코드 입력" : "파트너가 먼저 시작했어요";

  return (
    <div className="invite-screen">
      {onBack && <BackChip onClick={onBack} />}
      <InviteCoupleHeader selectedEmoji={selectedEmoji} />

      <div className="invite-heading">
        <h1 className="invite-title">파트너를 연결해요</h1>
        <p className="invite-subtitle">어떤 방법으로 시작할까요?</p>
      </div>

      <div className="invite-choice-list">
        <button className="invite-choice-card" type="button" disabled={isSaving} onClick={onSelectCreate}>
          <span className="invite-choice-text">
            <strong>{createLabel}</strong>
            <span>초대 코드를 만들어 파트너에게 공유할게요</span>
          </span>
          <em className="invite-choice-chevron" aria-hidden>{">"}</em>
        </button>

        <button className="invite-choice-card" type="button" disabled={isSaving} onClick={onSelectEnter}>
          <span className="invite-choice-text">
            <strong>{enterLabel}</strong>
            <span>파트너에게 받은 초대 코드를 입력해서 연결할게요</span>
          </span>
          <em className="invite-choice-chevron" aria-hidden>{">"}</em>
        </button>
      </div>

      <div className="invite-footer invite-footer-choice">
        <button className="invite-later" disabled={isSaving} type="button" onClick={onSkip}>
          나중에 연결할게요
        </button>
      </div>
    </div>
  );
}

/** A-04.1: 초대 코드 생성 */
function InviteCreateScreen({
  selectedEmoji,
  myCode,
  entry,
  onCopyCode,
  onGoChores,
  onDone,
  onBack,
  isSaving,
}: {
  selectedEmoji: string;
  myCode: string;
  entry: "onboarding" | "settings";
  onCopyCode: () => void;
  onGoChores: () => void;
  onDone: () => void;
  onBack: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="invite-screen">
      <BackChip onClick={onBack} />
      <InviteCoupleHeader selectedEmoji={selectedEmoji} />

      <div className="invite-heading">
        <h1 className="invite-title">초대 코드 생성하기</h1>
        <p className="invite-subtitle">
          아래 코드를 복사해 파트너에게 공유해 주세요.
          <br />
          공유 후 이번주 할 일을 먼저 생성해보세요.
        </p>
      </div>

      <section className="invite-section">
        <div className="invite-panel">
          <span className="invite-label">나의 초대 코드</span>
          <div className="my-code-box">
            <strong>{myCode || (isSaving ? "생성 중..." : "—")}</strong>
            <button
              className="copy-icon-button"
              aria-label="코드 복사"
              type="button"
              disabled={!myCode || isSaving}
              onClick={onCopyCode}
            >
              <AssetImage src={commonCopy} alt="" />
            </button>
          </div>
        </div>
      </section>

      <div className="invite-footer">
        <button
          className="start-primary"
          disabled={isSaving || !myCode}
          type="button"
          onClick={entry === "settings" ? onDone : onGoChores}
        >
          {entry === "settings" ? "완료" : "할 일 생성하러 가기"}
        </button>
      </div>
    </div>
  );
}

/** A-04.2: 파트너 초대 코드 입력 */
function InviteEnterScreen({
  selectedEmoji,
  inviteCode,
  onInviteCodeChange,
  onConnect,
  onBack,
  isSaving,
}: {
  selectedEmoji: string;
  inviteCode: string;
  onInviteCodeChange: (value: string) => void;
  onConnect: () => void;
  onBack: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="invite-screen">
      <BackChip onClick={onBack} />
      <InviteCoupleHeader selectedEmoji={selectedEmoji} />

      <div className="invite-heading">
        <h1 className="invite-title">초대 코드 입력하기</h1>
        <p className="invite-subtitle">
          파트너에게 전달 받은 초대 코드를 입력하세요.
          <br />
          입력 후 이번주 할 일을 생성해보세요.
        </p>
      </div>

      <section className="invite-section">
        <div className="invite-panel">
          <label className="invite-label" htmlFor="partner-invite-code">파트너의 초대 코드</label>
          <input
            id="partner-invite-code"
            className="partner-code-input"
            placeholder="초대 코드를 입력하세요."
            value={inviteCode}
            onChange={(event) => onInviteCodeChange(event.target.value)}
          />
        </div>
      </section>

      <div className="invite-footer">
        <button className="start-primary" disabled={isSaving} type="button" onClick={onConnect}>
          {isSaving ? "연결 중..." : "연결하기"}
        </button>
      </div>
    </div>
  );
}

function ChoreSelectScreen({
  tasks,
  groupedTasks,
  choreMode,
  weekLabel,
  onToggle,
  onToggleAll,
  onToggleCategory,
  onStartAdd,
  onDone,
  isSaving,
}: {
  tasks: AppTask[];
  groupedTasks: Record<string, AppTask[]>;
  choreMode: "first" | "repeat";
  weekLabel: string;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onToggleCategory: (category: string) => void;
  onStartAdd: (category: string) => void;
  onDone: () => void;
  isSaving: boolean;
}) {
  const selectedCount = tasks.filter((task) => task.selected).length;
  const allSelected = tasks.length > 0 && tasks.every((task) => task.selected);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const categories = [
    ...categoryMeta.map((item) => item.category).filter((category) => (groupedTasks[category] ?? []).length > 0),
    ...Object.keys(groupedTasks).filter((category) => !categoryMeta.some((item) => item.category === category)),
  ];
  const isExpanded = (category: string, index: number) => expanded[category] ?? index === 0;

  return (
    <div className="chore-select-screen">
      <header className="chore-select-header">
        <h1>이번 주 할 일을 선택해요{weekLabel ? ` (${weekLabel})` : ""}</h1>
        <p>
          원하는 카테고리에서 추가할 할 일을 선택해주세요.
          <br />
          파트너 연결 시 파트너가 설정한 할 일 목록과 합산됩니다. (중복 가능)
        </p>
      </header>

      {choreMode === "repeat" ? (
        <div className="chore-guide-box">
          지난 주 할 일을 미리 골라놨어요 😊 원하지 않는 항목은 해제하고 시작해주세요.
        </div>
      ) : null}

      <div className="chore-toolbar">
        <label className="chore-all-toggle">
          <input type="checkbox" checked={allSelected} onChange={onToggleAll} />
          <span>전체 선택/해제</span>
        </label>
        <strong>{selectedCount}개 선택됨</strong>
      </div>

      <div className="chore-category-list">
        {categories.map((category, index) => {
          const categoryTasks = groupedTasks[category] ?? [];
          const allInCategorySelected = categoryTasks.length > 0 && categoryTasks.every((task) => task.selected);
          const open = isExpanded(category, index);
          const iconKey = categoryTasks[0]?.iconKey ?? iconKeyForCategory(category);

          return (
            <section className="chore-category-card" key={category}>
              <div
                className="chore-category-head"
                role="button"
                tabIndex={0}
                onClick={() => setExpanded((current) => ({ ...current, [category]: !open }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setExpanded((current) => ({ ...current, [category]: !open }));
                  }
                }}
              >
                <label
                  className="chore-category-check"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={allInCategorySelected}
                    onChange={() => onToggleCategory(category)}
                    aria-label={`${category} 전체 선택`}
                  />
                </label>
                <span className="chore-category-title">
                  {taskIconMap[iconKey] ? (
                    <span className="task-icon"><AssetImage src={taskIconMap[iconKey]} alt="" /></span>
                  ) : null}
                  <strong>{category}</strong>
                </span>
                <span className="chore-chevron" aria-hidden>{open ? "▲" : "▼"}</span>
              </div>

              {open ? (
                <div className="chore-category-body">
                  {categoryTasks.map((task) => (
                    <label className="chore-item" key={task.id}>
                      <input type="checkbox" checked={task.selected} onChange={() => onToggle(task.id)} />
                      <span>{task.title}</span>
                    </label>
                  ))}

                  <button className="chore-add-button" type="button" onClick={() => onStartAdd(category)}>
                    + 추가하기
                  </button>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <button className="start-primary chore-done" disabled={isSaving} type="button" onClick={onDone}>
        {isSaving ? "저장 중..." : `선택완료 (${selectedCount}개)`}
      </button>
    </div>
  );
}

function AddChoreSheet({
  value,
  onChange,
  onClose,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="bottom-sheet-overlay" role="presentation">
      <div className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="add-chore-title">
        <div className="bottom-sheet-header">
          <h2 id="add-chore-title">할 일 추가</h2>
          <button className="bottom-sheet-close" type="button" aria-label="닫기" onClick={onClose}>×</button>
        </div>

        <label className="bottom-sheet-field">
          <span>새 이름</span>
          <div className="bottom-sheet-input-wrap">
            <input
              autoFocus
              value={value}
              maxLength={30}
              placeholder="할 일을 입력하세요"
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSubmit();
              }}
            />
            <em>{value.length}/30</em>
          </div>
        </label>

        <button className="start-primary" type="button" onClick={onSubmit}>추가하기</button>
      </div>
    </div>
  );
}

function HomeAddChoreSheet({
  templates,
  existingTitles,
  onClose,
  onSave,
}: {
  templates: AppChoreTemplate[];
  existingTitles: string[];
  onClose: () => void;
  onSave: (title: string, category: string) => void;
}) {
  const [category, setCategory] = useState(categoryMeta[0].category);
  const [title, setTitle] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const iconKey = iconKeyForCategory(category);
  const existingSet = new Set(existingTitles);
  const templateOptions = templates
    .filter((item) => normalizeCategory(item.category) === normalizeCategory(category))
    .map((item) => item.title)
    .filter((item) => !existingSet.has(item));
  const options = (templateOptions.length > 0
    ? templateOptions
    : catalogTitlesForCategory(category).filter((item) => !existingSet.has(item)));
  const canSave = title.trim().length > 0;

  const selectCategory = (next: string) => {
    setCategory(next);
    setTitle("");
    setManualMode(false);
    setSelectedOption(null);
    setSelectOpen(false);
  };

  const pickOption = (option: string) => {
    if (option === "__manual__") {
      setManualMode(true);
      setSelectedOption("직접 입력하기");
      setTitle("");
    } else {
      setManualMode(false);
      setSelectedOption(option);
      setTitle(option);
    }
    setSelectOpen(false);
  };

  return (
    <div className="bottom-sheet-overlay" role="presentation">
      <div
        className="bottom-sheet home-add-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-add-chore-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bottom-sheet-header">
          <h2 id="home-add-chore-title">할 일 추가하기</h2>
          <button className="bottom-sheet-close" type="button" aria-label="닫기" onClick={onClose}>×</button>
        </div>

        <div className="home-add-block">
          <span className="home-add-label">카테고리</span>
          <div className="home-add-category-grid">
            {categoryMeta.map((item) => (
              <button
                className={category === item.category ? "selected" : ""}
                key={item.category}
                type="button"
                onClick={() => selectCategory(item.category)}
              >
                <AssetImage src={taskIconMap[item.iconKey]} alt="" />
                <em>{item.category}</em>
              </button>
            ))}
          </div>
        </div>

        <div className="home-add-block">
          <span className="home-add-label">할 일 이름</span>
          <div className="home-add-select-wrap">
            <button
              className="home-add-select"
              type="button"
              onClick={() => setSelectOpen((open) => !open)}
            >
              <AssetImage src={taskIconMap[iconKey]} alt="" />
              <span className={selectedOption ? "" : "placeholder"}>
                {selectedOption ?? "옵션을 선택해 주세요"}
              </span>
              <em>▼</em>
            </button>
            {selectOpen && (
              <div className="home-add-dropdown">
                {options.map((option) => (
                  <button key={option} type="button" onClick={() => pickOption(option)}>
                    {option}
                  </button>
                ))}
                <button type="button" onClick={() => pickOption("__manual__")}>직접 입력하기</button>
              </div>
            )}
          </div>

          <div className={`home-add-input-row${manualMode || title ? " active" : ""}`}>
            <AssetImage src={taskIconMap[iconKey]} alt="" />
            <input
              maxLength={30}
              placeholder={manualMode ? "할 일 이름을 입력하세요" : ""}
              readOnly={!manualMode}
              value={title}
              onChange={(event) => {
                if (!manualMode) return;
                setTitle(event.target.value.slice(0, 30));
              }}
            />
            {manualMode && <em>{title.length}/30</em>}
          </div>
        </div>

        <button
          className={canSave ? "home-add-save active" : "home-add-save"}
          disabled={!canSave}
          type="button"
          onClick={() => {
            if (!canSave) return;
            onSave(title, category);
          }}
        >
          {canSave ? "저장하기" : "할 일 이름을 입력해주세요"}
        </button>
      </div>
    </div>
  );
}

function homeDoneDateKey(iso: string | null | undefined) {
  const source = iso ? new Date(iso) : new Date();
  const date = Number.isNaN(source.getTime()) ? new Date() : source;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function homeDoneDateLabel(iso: string | null | undefined) {
  const key = homeDoneDateKey(iso);
  const todayKey = homeDoneDateKey(new Date().toISOString());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = homeDoneDateKey(yesterday.toISOString());
  if (key === todayKey) return "오늘";
  if (key === yesterdayKey) return "어제";
  const [year, month, day] = key.split("-");
  return `${year}.${month}.${day}`;
}

function sortHomeDoneTasks(tasks: AppTask[]) {
  return [...tasks].sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  });
}

function groupHomeDoneTasks(tasks: AppTask[]) {
  const groups: { key: string; label: string; tasks: AppTask[] }[] = [];
  for (const task of sortHomeDoneTasks(tasks)) {
    const key = homeDoneDateKey(task.completedAt);
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.tasks.push(task);
    } else {
      groups.push({ key, label: homeDoneDateLabel(task.completedAt), tasks: [task] });
    }
  }
  return groups;
}

const HOME_DONE_PREVIEW_LIMIT = 5;

function HomeScreen({
  tasks,
  progress,
  castleLevel,
  completeCount,
  unreadCount,
  weekStart,
  weekEnd,
  partnerProfile,
  onComplete,
  onUncomplete,
  onReact,
  onWriteLetter,
  onRename,
  onDelete,
  onAdd,
  onNotifications,
  onCastleExplain,
}: {
  tasks: AppTask[];
  progress: number;
  castleLevel: number;
  completeCount: number;
  unreadCount: number;
  weekStart: string;
  weekEnd: string;
  partnerProfile: AppPartnerProfile | null;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onReact: (id: string, title: string, reactionValue: string, reactionLabel: string) => void;
  onWriteLetter: () => void;
  onRename: (id: string, title: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onNotifications: () => void;
  onCastleExplain: () => void;
}) {
  const [doneTab, setDoneTab] = useState<"me" | "partner">("partner");
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(() => new Set());
  const [editMode, setEditMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const homeScrollRef = useRef<HTMLDivElement>(null);

  const level = Math.min(10, Math.max(1, castleLevel || 1));
  const doneMine = tasks.filter((task) => task.done && task.assignee === "me");
  const donePartner = tasks.filter((task) => task.done && task.assignee === "partner");
  const incomplete = tasks.filter((task) => !task.done);
  const visibleDone = doneTab === "me" ? doneMine : donePartner;
  const sortedDone = sortHomeDoneTasks(visibleDone);
  const previewDone = doneExpanded ? sortedDone : sortedDone.slice(0, HOME_DONE_PREVIEW_LIMIT);
  const doneGroups = groupHomeDoneTasks(previewDone);
  const showDoneToggle = sortedDone.length > HOME_DONE_PREVIEW_LIMIT;
  const partnerName = partnerDisplayName(partnerProfile);

  const incompleteGroups = incomplete.reduce<Record<string, AppTask[]>>((acc, task) => {
    const key = normalizeCategory(task.category);
    acc[key] = [...(acc[key] ?? []), task];
    return acc;
  }, {});

  const reactionButtons = [
    { value: "💗", src: reactionHeartPink, label: "💗" },
    { value: "👍", src: reactionLike, label: "👍" },
  ];

  const switchDoneTab = (tab: "me" | "partner") => {
    setDoneTab(tab);
    setDoneExpanded(false);
  };

  const handleUncomplete = (id: string) => {
    if (cancellingIds.has(id)) return;
    setCancellingIds((current) => new Set(current).add(id));
    window.setTimeout(() => {
      onUncomplete(id);
      setCancellingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }, 220);
  };

  const startEditTask = (task: AppTask) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const saveEditTask = async () => {
    if (!editingTaskId) return;
    const ok = await onRename(editingTaskId, editingTitle);
    if (ok) {
      setEditingTaskId(null);
      setEditingTitle("");
    }
  };

  const exitEditMode = () => {
    setEditMode(false);
    setEditingTaskId(null);
    setEditingTitle("");
  };

  const scrollHomeToTop = () => {
    homeScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="home-screen">
      <div className="home-sticky-head">
        <header className="home-topbar">
          <div className="home-title-block">
            <strong>우리의 이번 주</strong>
            <span>{formatHomeWeekRange(weekStart, weekEnd)}</span>
          </div>
          <button className="home-bell" aria-label="알림" type="button" onClick={onNotifications}>
            <AssetImage src={unreadCount > 0 ? commonNotificationTrue : commonNotification} alt="" />
          </button>
        </header>

        <section className="home-castle">
          <div className="home-castle-badge">{level}단계 · {progress}%</div>
          <button className="home-castle-info" aria-label="완수율 안내" type="button" onClick={onCastleExplain}>
            <AssetImage src={commonInfo} alt="" />
          </button>
          <div className="home-castle-visual">
            <AssetImage src={castleSrcForWeek(weekStart, progress)} alt={`${level}단계 성`} />
          </div>
        </section>
      </div>

      <div className="home-scroll-body" ref={homeScrollRef}>
      <section className="home-done-section">
        <div className="home-section-head">
          <h3>우리가 완료한 일 <em>{completeCount}개</em></h3>
        </div>

        <div className="home-done-tabs" role="tablist">
          <button
            className={doneTab === "me" ? "active" : ""}
            role="tab"
            type="button"
            onClick={() => switchDoneTab("me")}
          >
            내가 한 일
          </button>
          <button
            className={doneTab === "partner" ? "active" : ""}
            role="tab"
            type="button"
            onClick={() => switchDoneTab("partner")}
          >
            {subjectParticleName(partnerName)} 한 일
          </button>
        </div>

        {doneTab === "partner" && (
          <button className="home-letter-button" type="button" onClick={onWriteLetter}>
            <AssetImage src={reactionLetter} alt="" />
            {partnerName}에게 편지 보내기
          </button>
        )}

        {visibleDone.length === 0 ? (
          <p className="home-empty">아직 완료한 일이 없어요</p>
        ) : (
          <>
            <ul className="home-done-list">
              {doneGroups.map((group) => (
                <li className="home-done-group" key={group.key}>
                  <p className="home-done-date">{group.label}</p>
                  <ul className="home-done-group-list">
                    {group.tasks.map((task) => {
                      const cancelling = cancellingIds.has(task.id);
                      return (
                        <li key={task.id}>
                          {doneTab === "me" ? (
                            <button
                              className={`home-done-item clickable is-completed${cancelling ? " is-cancelled" : ""}`}
                              type="button"
                              onClick={() => handleUncomplete(task.id)}
                            >
                              <AssetImage src={cancelling ? commonCheckboxOutline : commonCheckboxFilled} alt="" />
                              <span>{task.title}</span>
                            </button>
                          ) : (
                            <div className="home-done-partner-row">
                              <span className="home-done-partner-title is-completed">{task.title}</span>
                              <div className="home-reaction-row">
                                {reactionButtons.map((item) => {
                                  const selected = task.myReaction === item.value;
                                  const locked = Boolean(task.myReaction);
                                  return (
                                    <button
                                      aria-label={`${item.label} 리액션`}
                                      className={selected ? "is-selected" : locked ? "is-dimmed" : undefined}
                                      disabled={locked}
                                      key={item.value}
                                      type="button"
                                      onClick={() => onReact(task.id, task.title, item.value, item.label)}
                                    >
                                      <AssetImage src={item.src} alt="" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
            {showDoneToggle ? (
              <button
                className="home-done-more"
                type="button"
                onClick={() => setDoneExpanded((current) => !current)}
              >
                더보기 <span aria-hidden>{doneExpanded ? "△" : "▽"}</span>
              </button>
            ) : null}
          </>
        )}
      </section>

      <section className="home-todo-section">
        <div className="home-section-head">
          <h3>우리가 해야할 일 <em>{incomplete.length}개</em></h3>
          {editMode ? (
            <div className="home-edit-actions">
              <button className="home-add-button" type="button" onClick={onAdd}>추가</button>
              <button className="home-done-edit-button" type="button" onClick={exitEditMode}>완료</button>
            </div>
          ) : (
            <button className="home-edit-button" type="button" onClick={() => setEditMode(true)}>편집</button>
          )}
        </div>

        {incomplete.length === 0 ? (
          <p className="home-empty">이번 주 할 일을 모두 끝냈어요</p>
        ) : (
          Object.entries(incompleteGroups).map(([category, categoryTasks]) => {
            const collapsed = Boolean(collapsedCategories[category]);
            const iconKey = iconKeyForCategory(category);
            return (
              <div className="home-category" key={category}>
                <button
                  className="home-category-head"
                  type="button"
                  onClick={() => setCollapsedCategories((current) => ({
                    ...current,
                    [category]: !current[category],
                  }))}
                >
                  <span className="home-category-icon">
                    <AssetImage src={taskIconMap[iconKey]} alt="" />
                  </span>
                  <strong>{category}</strong>
                  <em>{categoryTasks.length}</em>
                  <span className="home-category-chevron">{collapsed ? "▾" : "▴"}</span>
                </button>
                {!collapsed && (
                  <ul className="home-todo-list">
                    {categoryTasks.map((task) => (
                      <li key={task.id}>
                        {editMode ? (
                          editingTaskId === task.id ? (
                            <div className="home-todo-edit-row">
                              <input
                                autoFocus
                                maxLength={30}
                                value={editingTitle}
                                onChange={(event) => setEditingTitle(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") void saveEditTask();
                                }}
                              />
                              <button className="home-save-button" type="button" onClick={() => void saveEditTask()}>
                                저장
                              </button>
                            </div>
                          ) : (
                            <div className="home-todo-manage-row">
                              <span>{task.title}</span>
                              <div className="home-todo-manage-actions">
                                <button
                                  aria-label="수정"
                                  type="button"
                                  onClick={() => startEditTask(task)}
                                >
                                  <AssetImage src={commonEdit} alt="" />
                                </button>
                                <button
                                  aria-label="삭제"
                                  type="button"
                                  onClick={() => onDelete(task.id)}
                                >
                                  <AssetImage src={commonDelete} alt="" />
                                </button>
                              </div>
                            </div>
                          )
                        ) : (
                          <button
                            className="home-todo-item"
                            type="button"
                            onClick={() => onComplete(task.id)}
                          >
                            <AssetImage src={commonCheckboxOutline} alt="" />
                            <span>{task.title}</span>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </section>
      </div>

      <button
        aria-label="맨 위로"
        className="home-topup"
        type="button"
        onClick={scrollHomeToTop}
      >
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M4.5 10.5L9 6l4.5 4.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
        </svg>
      </button>
    </div>
  );
}

function CastleCard({
  progress,
  completeCount,
  total,
  weekStart,
  onExplain,
}: {
  progress: number;
  completeCount: number;
  total: number;
  weekStart?: string;
  onExplain?: () => void;
}) {
  const castleSrc = castleSrcForWeek(weekStart, progress);

  return (
    <section className="castle-card">
      <div className="castle-visual">
        <AssetImage src={castleSrc} alt={`성 완공률 ${progress}%`} />
      </div>
      <div className="progress-info">
        <span>{completeCount}/{total} 완료</span>
        <strong>{progress}%</strong>
      </div>
      <div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>
      {onExplain && (
        <button className="text-button castle-explain-link" onClick={onExplain}>성은 어떻게 완성되나요?</button>
      )}
    </section>
  );
}

function LetterWriteScreen({
  body,
  reaction,
  partnerProfile,
  onBodyChange,
  onReactionChange,
  onBack,
  onOpenAi,
  onEmpty,
  onSend,
}: {
  body: string;
  reaction: string;
  partnerProfile: AppPartnerProfile | null;
  onBodyChange: (value: string) => void;
  onReactionChange: (value: string) => void;
  onBack: () => void;
  onOpenAi: () => void;
  onEmpty: () => void;
  onSend: () => void;
}) {
  const meaningfulLength = body.replace(/\s/g, "").length;
  const canSend = meaningfulLength >= 1;
  const partnerName = partnerDisplayName(partnerProfile);
  const todayLabel = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleBodyChange = (value: string) => {
    let kept = "";
    let count = 0;
    for (const char of value) {
      if (/\s/.test(char)) {
        kept += char;
        continue;
      }
      if (count >= 1000) break;
      kept += char;
      count += 1;
    }
    onBodyChange(kept);
  };

  return (
    <div className="instant-letter-screen">
      <header className="instant-letter-header">
        <button className="instant-letter-cancel" type="button" onClick={onBack}>
          × 취소
        </button>
        <h1>
          편지 쓰기
          <AssetImage src={reactionLetter} alt="" />
        </h1>
        <span className="instant-letter-spacer" aria-hidden />
      </header>

      <div className="instant-recipient-card">
        <span className="instant-recipient-avatar">
          <AvatarMark value={partnerAvatarId(partnerProfile)} />
        </span>
        <div>
          <em>받는 사람</em>
          <strong>{partnerName}</strong>
        </div>
        <AssetImage src={reactionHeartPink} alt="" />
      </div>

      <button className="weekly-ai-button instant-ai-button" type="button" onClick={onOpenAi}>
        <AssetImage src={commonAi} alt="" />
        말문 틔우기(AI)
      </button>

      <div className="instant-letter-card">
        <span className="instant-letter-date">{todayLabel}</span>
        <textarea
          placeholder={`${partnerName}에게 마음을 담아 자유롭게 써봐요`}
          value={body}
          onChange={(event) => handleBodyChange(event.target.value)}
        />
        <em>{meaningfulLength} / 1000</em>
      </div>

      <div className="instant-sticker-card">
        <span>스티커 첨부 (선택)</span>
        <div className="instant-sticker-grid">
          {reactionOptions.map((item) => (
            <button
              aria-label={item.label}
              className={reaction === item.value ? "selected" : ""}
              key={item.value}
              type="button"
              onClick={() => onReactionChange(reaction === item.value ? "" : item.value)}
            >
              <AssetImage src={item.src} alt="" />
            </button>
          ))}
        </div>
      </div>

      <button
        className={canSend ? "instant-send-button active" : "instant-send-button"}
        type="button"
        onClick={() => {
          if (!canSend) {
            onEmpty();
            return;
          }
          onSend();
        }}
      >
        <AssetImage src={reactionLetter} alt="" />
        편지 보내기
      </button>
    </div>
  );
}

function WeeklyLetterScreen({
  body,
  reaction,
  progress,
  weekStart,
  weekEnd,
  partnerProfile,
  onBodyChange,
  onReactionChange,
  onOpenAi,
  onEmpty,
  onSend,
  onLater,
}: {
  body: string;
  reaction: string;
  progress: number;
  weekStart: string;
  weekEnd: string;
  partnerProfile: AppPartnerProfile | null;
  onBodyChange: (value: string) => void;
  onReactionChange: (value: string) => void;
  onOpenAi: () => void;
  onEmpty: () => void;
  onSend: () => void;
  onLater: () => void;
}) {
  const meaningfulLength = body.replace(/\s/g, "").length;
  const canSend = meaningfulLength >= 1;
  const partnerName = partnerDisplayName(partnerProfile);
  const castleSrc = castleSrcForWeek(weekStart, progress);

  const handleBodyChange = (value: string) => {
    let kept = "";
    let count = 0;
    for (const char of value) {
      if (/\s/.test(char)) {
        kept += char;
        continue;
      }
      if (count >= 1000) break;
      kept += char;
      count += 1;
    }
    onBodyChange(kept);
  };

  return (
    <div className="weekly-letter-overlay" role="presentation">
      <div className="weekly-letter-sheet" role="dialog" aria-modal="true" aria-labelledby="weekly-letter-title">
        <div className="week-close-hero weekly-letter-hero">
          <div className="week-close-badge">
            <AssetImage src={commonCalendar} alt="" />
            <span>{formatWeekCloseBadge(weekStart, weekEnd)}</span>
          </div>
          <div className="week-close-castle weekly-letter-castle">
            <AssetImage src={castleSrc} alt="이번 주 성" />
          </div>
        </div>

        <h2 id="weekly-letter-title" className="weekly-letter-title">
          편지를 써서 성을 완성하세요!
          <span className="weekly-letter-title-icon"><AssetImage src={reactionLetter} alt="" /></span>
        </h2>
        <p className="weekly-letter-subtitle">할 일을 모두 끝낸 뒤 편지를 작성하면 성이 완성돼요</p>

        <div className="weekly-ai-wrap">
          <span className="weekly-ai-bubble" aria-hidden>
            {subjectParticleName(partnerName)} 한 일 요약을 확인해 보세요
          </span>
          <button className="weekly-ai-button weekly-ai-button-solid" type="button" onClick={onOpenAi}>
            <AssetImage src={commonAi} alt="" />
            말문 틔우기(AI)
          </button>
        </div>

        <div className="weekly-letter-field">
          <textarea
            placeholder={`${partnerName}에게 마음을 담아 자유롭게 써봐요`}
            value={body}
            onChange={(event) => handleBodyChange(event.target.value)}
          />
          <em>{meaningfulLength} / 1000</em>
        </div>

        <div className="weekly-sticker-block">
          <span>스티커 붙이기 (선택)</span>
          <div className="weekly-sticker-row">
            {reactionOptions.map((item) => (
              <button
                aria-label={item.label}
                aria-pressed={reaction === item.value}
                className={reaction === item.value ? "selected" : ""}
                key={item.value}
                type="button"
                onClick={() => onReactionChange(reaction === item.value ? "" : item.value)}
              >
                <AssetImage src={item.src} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="weekly-letter-actions">
          <button
            className={canSend ? "weekly-send-button active" : "weekly-send-button"}
            type="button"
            aria-disabled={!canSend}
            onClick={() => {
              if (!canSend) {
                onEmpty();
                return;
              }
              onSend();
            }}
          >
            <AssetImage src={reactionLetter} alt="" />
            편지 보내고 성 완성하기
          </button>
          <button className="weekly-later-button" type="button" onClick={onLater}>
            나중에 작성하기
          </button>
        </div>
      </div>
    </div>
  );
}

function SentScreen({
  partnerProfile,
  letter,
  onHome,
  onWriteAgain,
}: {
  partnerProfile: AppPartnerProfile | null;
  letter: AppLetter | null;
  onHome: () => void;
  onWriteAgain: () => void;
}) {
  const partnerName = partnerDisplayName(partnerProfile);
  const preview = letter?.body ?? "";

  return (
    <div className="letter-sent-screen">
      <div className="letter-sent-hero">
        <div className="letter-sent-glow">
          <AssetImage src={reactionLetter} alt="" />
        </div>
      </div>

      <h1>편지를 보냈어요! 🎉</h1>
      <p className="letter-sent-subtitle">
        {partnerName}에게 따뜻한 마음이 전달됐어요
        <AssetImage src={reactionHeartPink} alt="" />
      </p>

      <article className="letter-sent-preview">
        <div className="letter-sent-preview-head">
          <span className="letter-sent-avatar">
            <AvatarMark value={partnerAvatarId(partnerProfile)} />
          </span>
          <div>
            <em>받는 사람</em>
            <strong>{partnerName}</strong>
          </div>
          <span className="letter-sent-time">방금 전</span>
        </div>
        <p className="letter-sent-body">{preview || "보낸 편지 내용이 없어요."}</p>
      </article>

      <div className="letter-sent-actions">
        <button className="letter-sent-home" type="button" onClick={onHome}>
          홈으로 돌아가기
        </button>
        <button className="letter-sent-again" type="button" onClick={onWriteAgain}>
          편지 한 통 더 쓰기 ✉️
        </button>
      </div>
    </div>
  );
}

function formatWeekCloseBadge(weekStart: string, weekEnd: string) {
  if (!weekStart || !weekEnd) return "이번 주 마감";
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(`${weekEnd}T00:00:00`);
  return `${start.getMonth() + 1}/${start.getDate()} – ${end.getMonth() + 1}/${end.getDate()} · 이번 주 마감`;
}

/** 공백 제외 1000자 한도 안에서 문구를 이어붙임 (초과분은 절삭) */
function appendIcebreakerPhrase(current: string, phrase: string) {
  const base = current.trim() ? `${current.trim()}\n` : "";
  let kept = base;
  let count = base.replace(/\s/g, "").length;
  for (const char of phrase) {
    if (/\s/.test(char)) {
      kept += char;
      continue;
    }
    if (count >= 1000) break;
    kept += char;
    count += 1;
  }
  return kept;
}

function IcebreakerAiModal({
  userId,
  partnerNickname,
  tasks,
  cachedPhrases,
  onPhrasesLoaded,
  onClose,
  onApply,
  onOpened,
  onPerspectiveExpanded,
  onFailed,
  showAlert,
  showConfirm,
}: {
  userId: string | null;
  partnerNickname: string;
  tasks: AppTask[];
  cachedPhrases: IcebreakerPhrases | null;
  onPhrasesLoaded: (phrases: IcebreakerPhrases) => void;
  onClose: () => void;
  onApply: (phrase: string) => void;
  onOpened?: () => void;
  onPerspectiveExpanded?: (perspective: IcebreakerPerspective) => void;
  onFailed?: () => void;
  showAlert: (title: string, message: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel?: string,
    cancelLabel?: string,
  ) => void;
}) {
  const partnerDoneTasks = tasks.filter((task) => task.done && task.assignee === "partner");
  const totalCount = tasks.length;
  const completedCount = partnerDoneTasks.length;
  const contributionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const completedItems = partnerDoneTasks.map((task) => task.title);
  const labelName = subjectParticleName(partnerNickname);

  const [expandedAllChips, setExpandedAllChips] = useState(false);
  const [expandedPerspectives, setExpandedPerspectives] = useState<Record<IcebreakerPerspective, boolean>>({
    "완료한 일 짚어주기": false,
    "내 마음 표현하기": false,
    "다음 주 응원하기": false,
  });
  const [phrases, setPhrases] = useState<IcebreakerPhrases | null>(cachedPhrases);
  const [loading, setLoading] = useState(!cachedPhrases);
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<Record<IcebreakerPerspective, number>>({
    "완료한 일 짚어주기": 1,
    "내 마음 표현하기": 1,
    "다음 주 응원하기": 1,
  });

  useEffect(() => {
    onOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cachedPhrases) {
      setPhrases(cachedPhrases);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void requestIcebreakerPhrases({
      userId,
      partnerNickname,
      weeklySummary: {
        completed_count: completedCount,
        total_count: totalCount,
        contribution_rate: contributionRate,
        completed_items: completedItems,
      },
    })
      .then((result) => {
        if (cancelled) return;
        setPhrases(result);
        onPhrasesLoaded(result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        onFailed?.();
        showAlert("알림", "응답에 실패했습니다. 다시 시도해주세요.");
      });
    return () => {
      cancelled = true;
    };
    // 모달 오픈 시 1회만 호출 (세션 캐시 있으면 재사용, 없으면 OpenAI 1회)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleChips = expandedAllChips ? completedItems : completedItems.slice(0, 4);
  const hiddenChipCount = Math.max(0, completedItems.length - 4);

  const requestApply = () => {
    if (!selectedPhrase) return;
    showConfirm(
      "",
      `'${selectedPhrase}' 문장을 적용하시겠습니까?`,
      () => onApply(selectedPhrase),
      "확인",
      "취소",
    );
  };

  return (
    <div className="icebreaker-overlay" role="presentation">
      <div
        className="icebreaker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="icebreaker-title"
      >
        <div className="icebreaker-header">
          <h2 id="icebreaker-title">
            <span className="icebreaker-title-icon"><AssetImage src={commonAi} alt="" /></span>
            말문 틔우기
          </h2>
          <button className="bottom-sheet-close" type="button" aria-label="닫기" onClick={onClose}>×</button>
        </div>

        <section className="icebreaker-summary">
          <h3>{labelName} 한 일</h3>
          {totalCount === 0 ? (
            <p className="icebreaker-empty">이번 주 등록된 할일이 아직 없어요</p>
          ) : completedCount === 0 ? (
            <p className="icebreaker-empty">아직 {labelName} 완료한 일이 없어요</p>
          ) : (
            <>
              <div className="icebreaker-summary-stats">
                <strong>{completedCount} / {totalCount}개 완료</strong>
                <em>기여율 {contributionRate}%</em>
              </div>
              <div className="icebreaker-chips">
                {visibleChips.map((title, index) => (
                  <span className="icebreaker-chip" key={`${title}-${index}`}>
                    <i>✓</i>
                    {title}
                  </span>
                ))}
                {!expandedAllChips && hiddenChipCount > 0 && (
                  <button
                    className="icebreaker-chip more"
                    type="button"
                    onClick={() => setExpandedAllChips(true)}
                  >
                    +{hiddenChipCount}개 더
                  </button>
                )}
              </div>
            </>
          )}
        </section>

        <section className="icebreaker-perspectives">
          <h3>어떤 얘기부터 시작할까요?</h3>
          {loading && <p className="icebreaker-loading">문구를 준비하고 있어요...</p>}
          <div className="icebreaker-perspective-list">
            {ICEBREAKER_PERSPECTIVES.map((perspective) => {
              const open = expandedPerspectives[perspective];
              const list = phrases?.[perspective] ?? [];
              const showCount = visibleCount[perspective];

              return (
                <div className={`icebreaker-perspective${open ? " open" : ""}`} key={perspective}>
                  <button
                    className="icebreaker-perspective-head"
                    type="button"
                    onClick={() => {
                      if (loading) return;
                      if (!phrases) {
                        showAlert("알림", "응답에 실패했습니다. 다시 시도해주세요.");
                        return;
                      }
                      const nextOpen = !expandedPerspectives[perspective];
                      setExpandedPerspectives((current) => ({
                        ...current,
                        [perspective]: nextOpen,
                      }));
                      if (nextOpen) onPerspectiveExpanded?.(perspective);
                    }}
                  >
                    <span>{perspective}</span>
                    {phrases && <em aria-hidden>{open ? "▲" : "▽"}</em>}
                  </button>
                  {open && (
                    <div className="icebreaker-phrase-block">
                      <span className="icebreaker-phrase-label">AI 추천 문구</span>
                      <div className="icebreaker-phrase-list">
                        {list.slice(0, showCount).map((phrase) => (
                          <button
                            key={phrase}
                            type="button"
                            className={selectedPhrase === phrase ? "selected" : ""}
                            onClick={() => setSelectedPhrase(phrase)}
                          >
                            {phrase}
                          </button>
                        ))}
                      </div>
                      {showCount < list.length && (
                        <button
                          className="icebreaker-more-phrases"
                          type="button"
                          onClick={() => setVisibleCount((current) => ({
                            ...current,
                            [perspective]: list.length,
                          }))}
                        >
                          AI 추천 문구 더보기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <button
          className="icebreaker-apply"
          type="button"
          disabled={!selectedPhrase}
          onClick={requestApply}
        >
          적용하기
        </button>
      </div>
    </div>
  );
}

function WeekClosePopup({
  weekStart,
  weekEnd,
  progress,
  onWriteLetter,
}: {
  weekStart: string;
  weekEnd: string;
  progress: number;
  onWriteLetter: () => void;
}) {
  const castleSrc = castleSrcForWeek(weekStart, progress);

  return (
    <div className="week-close-overlay" role="presentation">
      <div className="week-close-popup" role="dialog" aria-modal="true" aria-labelledby="week-close-title">
        <div className="week-close-hero">
          <div className="week-close-badge">
            <AssetImage src={commonCalendar} alt="" />
            <span>{formatWeekCloseBadge(weekStart, weekEnd)}</span>
          </div>
          <div className="week-close-castle">
            <AssetImage src={castleSrc} alt="이번 주 성" />
          </div>
        </div>

        <div className="week-close-brand">
          <AssetImage src={mainLogo} alt="" />
        </div>

        <h2 id="week-close-title">이번 주 성 쌓기가 종료되었어요!</h2>
        <p className="week-close-subtitle">
          둘이 함께 열심히 쌓았어요💕
          <br />
          이번 주 결과를 확인해볼까요?
        </p>

        <div className="week-close-teasers" aria-hidden>
          <div>
            <strong className="green">?개</strong>
            <span>완료한 일</span>
          </div>
          <div>
            <strong className="orange">??%</strong>
            <span>전체 진행률</span>
          </div>
          <div>
            <strong className="purple">?단계</strong>
            <span>달성 단계</span>
          </div>
        </div>

        <button className="week-close-cta" type="button" onClick={onWriteLetter}>
          편지쓰기 →
        </button>
      </div>
    </div>
  );
}

function CloseWeekScreen({ onCancel, onNext }: { onCancel: () => void; onNext: () => void }) {
  return (
    <div className="center-screen">
      <div className="modal-card">
        <h2>이번 주를 마무리할까요?</h2>
        <p>칭찬 편지를 작성하면 이번 주 기록이 저장되고 다음 주 할 일을 다시 고를 수 있어요.</p>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>취소</button>
          <button className="modal-confirm" onClick={onNext}>다음으로 →</button>
        </div>
      </div>
    </div>
  );
}

function reactionAsset(value: string) {
  return reactionOptions.find((item) => item.value === value)?.src ?? null;
}

function formatLetterDayLabel(letter: AppLetter) {
  const source = letter.createdAt || letter.date;
  const date = new Date(source);
  if (!Number.isNaN(date.getTime())) {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }
  return letter.date;
}

const REPORT_DONUT_COLORS = ["#FDC9D8", "#CDBAF4", "#FEEC99", "#CAF5BB", "#BFDFFD"] as const;

/** 카테고리별 완료 비율(소수 1자리). 합이 정확히 100.0% 가 되도록 최대잔여 방식으로 보정 */
function buildReportCategorySlices(tasks: AppTask[]) {
  const doneTasks = tasks.filter((task) => task.done);
  const counts = new Map<string, number>();
  for (const task of doneTasks) {
    const category = normalizeCategory(task.category);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"));
  const totalDone = doneTasks.length;
  if (totalDone === 0 || sorted.length === 0) return [] as { label: string; count: number; percent: number; color: string }[];

  const top = sorted.slice(0, 4);
  const rest = sorted.slice(4);
  const rawSlices = top.map(([label, count], index) => ({
    label,
    count,
    color: REPORT_DONUT_COLORS[index] ?? REPORT_DONUT_COLORS[4],
  }));

  if (rest.length > 0) {
    const restCount = rest.reduce((sum, [, count]) => sum + count, 0);
    rawSlices.push({
      label: `외 ${rest.length}개`,
      count: restCount,
      color: REPORT_DONUT_COLORS[4],
    });
  }

  // 소수 첫째자리까지 내린 뒤, 잔여(1000 - 합)를 소수부가 큰 조각부터 +0.1
  const floors = rawSlices.map((slice) => {
    const exact = (slice.count / totalDone) * 1000; // 0.1% 단위
    return { ...slice, floor: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  let remain = 1000 - floors.reduce((sum, slice) => sum + slice.floor, 0);
  const order = floors
    .map((slice, index) => ({ index, frac: slice.frac, count: slice.count }))
    .sort((a, b) => b.frac - a.frac || b.count - a.count || a.index - b.index);

  for (const item of order) {
    if (remain <= 0) break;
    floors[item.index].floor += 1;
    remain -= 1;
  }

  return floors.map(({ label, count, color, floor }) => ({
    label,
    count,
    percent: floor / 10,
    color,
  }));
}

function ReportDonutChart({ slices }: { slices: { label: string; count: number; percent: number; color: string }[] }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 72;
  const stroke = 28;
  const total = slices.reduce((sum, slice) => sum + slice.count, 0) || 1;
  let angle = -Math.PI / 2;

  const arcs = slices.map((slice) => {
    const sweep = (slice.count / total) * Math.PI * 2;
    const start = angle;
    const end = angle + Math.min(sweep, Math.PI * 2 - 0.0001);
    angle += sweep;
    const large = sweep > Math.PI ? 1 : 0;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    const mid = start + sweep / 2;
    const labelR = radius + 34;
    const fullCircle = slice.count === total;
    return {
      ...slice,
      fullCircle,
      d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`,
      labelX: cx + labelR * Math.cos(mid),
      labelY: cy + labelR * Math.sin(mid),
    };
  });

  return (
    <svg className="weekly-report-donut" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="카테고리별 완료 비율">
      {arcs.length === 0 ? (
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#efe8f2" strokeWidth={stroke} />
      ) : arcs.map((arc) => (
        <g key={arc.label}>
          {arc.fullCircle ? (
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke={arc.color} strokeWidth={stroke} />
          ) : (
            <path d={arc.d} fill="none" stroke={arc.color} strokeWidth={stroke} strokeLinecap="butt" />
          )}
          <text x={arc.labelX} y={arc.labelY} textAnchor="middle" dominantBaseline="middle" className="weekly-report-donut-label">
            {arc.count} {arc.percent.toFixed(1)}%
          </text>
        </g>
      ))}
    </svg>
  );
}

function StatsScreen({
  progress,
  completeCount,
  totalCount,
  tasks,
  weekStart,
  weekEnd,
  complete,
  weekStreak,
  letterCount,
  reactionCount,
  myLetter,
  partnerLetter,
  selectedEmoji,
  partnerProfile,
  entry,
  onBack,
  onNextWeek,
  onSelectLetter,
  isSaving,
}: {
  progress: number;
  completeCount: number;
  totalCount: number;
  meDone: number;
  partnerDone: number;
  tasks: AppTask[];
  weekStart: string;
  weekEnd: string;
  complete: boolean;
  weekStreak: number;
  letterCount: number;
  reactionCount: number;
  myLetter: AppLetter | null;
  partnerLetter: AppLetter | null;
  selectedEmoji: string;
  partnerProfile: AppPartnerProfile | null;
  entry: "letter" | "castle";
  onBack: () => void;
  onNextWeek: () => void;
  onSelectLetter: (letter: AppLetter) => void;
  isSaving: boolean;
}) {
  const level = castleStageFromRate(progress);
  const castleSrc = castleSrcForWeek(weekStart, progress);
  const partnerName = partnerDisplayName(partnerProfile);
  const myTasks = tasks.filter((task) => task.done && task.assignee === "me");
  const partnerTasks = tasks.filter((task) => task.done && task.assignee === "partner");
  // 공유 사이클 기준: 전체 = 양쪽이 설정한 할 일 합, 완료 = 양쪽 완료 합
  const resolvedTotalCount = tasks.length > 0 ? tasks.length : totalCount;
  const resolvedCompleteCount = tasks.length > 0
    ? tasks.filter((task) => task.done).length
    : completeCount;
  const categorySlices = buildReportCategorySlices(tasks);
  const hasTasks = resolvedTotalCount > 0;
  const showDonut = hasTasks && resolvedCompleteCount > 0 && categorySlices.length > 0;
  const nextWeekSub = complete || progress >= 100
    ? "100% 완성! 다음 성도 지으러 가요"
    : "꾸준히 함께하고 있어요. 다음 주도 화이팅";
  const showBack = entry === "castle";
  const [expandedMeChores, setExpandedMeChores] = useState(false);
  const [expandedPartnerChores, setExpandedPartnerChores] = useState(false);

  return (
    <div className={`weekly-report-screen${entry === "castle" ? " with-tab" : " with-cta"}`}>
      <header className={`weekly-report-header${showBack ? "" : " no-back"}`}>
        {showBack ? (
          <button className="weekly-report-back" type="button" disabled={isSaving} onClick={onBack}>
            {isSaving ? "준비 중..." : "< 뒤로"}
          </button>
        ) : null}
        <div className="weekly-report-title-block">
          <span className="weekly-report-range">{formatReportWeekRange(weekStart, weekEnd)}</span>
          <strong>주간 완료 리포트</strong>
        </div>
        <div className="weekly-report-badge">
          <AssetImage src={commonTrophy} alt="" />
          <span>{level}단계 완공</span>
        </div>
      </header>

      <div className="weekly-report-scroll">
        <div className="weekly-report-castle">
          <AssetImage src={castleSrc} alt={`${level}단계 성`} />
        </div>

        <section className="weekly-report-ours">
          <h3>
            <span className="weekly-report-ours-icon">
              <AssetImage src={avatarMint} alt="" />
            </span>
            우리의 기록 <em>(이번 주 요약)</em>
          </h3>

          {hasTasks ? (
            <p className="weekly-report-ours-count">{resolvedCompleteCount} / {resolvedTotalCount}개 완료</p>
          ) : (
            <p className="weekly-report-ours-empty">이번 주 설정된 할일이 없어요</p>
          )}

          {showDonut ? (
            <>
              <ReportDonutChart slices={categorySlices} />
              <ul className="weekly-report-legend">
                {categorySlices.map((slice) => (
                  <li key={slice.label}>
                    <i style={{ background: slice.color }} />
                    <span>{slice.label}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <div className="weekly-report-exchange">
            <div className="weekly-report-exchange-card">
              <AssetImage src={reactionLetter} alt="" />
              <span>편지 {letterCount}회</span>
            </div>
            <div className="weekly-report-exchange-card">
              <AssetImage src={reactionLike} alt="" />
              <span>리액션 {reactionCount}회</span>
            </div>
          </div>
        </section>

        <section className="weekly-report-chores">
          <div>
            <h4><i className="dot me" /> 내가 한 일</h4>
            <ul>
              {myTasks.length === 0 ? (
                <li className="empty">완료한 일이 없어요</li>
              ) : (expandedMeChores ? myTasks : myTasks.slice(0, 5)).map((task) => (
                <li key={task.id}>
                  <span className="task-icon">
                    <AssetImage src={taskIconMap[task.iconKey ?? iconKeyForCategory(task.category)]} alt="" />
                  </span>
                  <span>{task.title}</span>
                  <em>✓</em>
                </li>
              ))}
            </ul>
            {myTasks.length > 5 ? (
              <button
                className="weekly-report-more"
                type="button"
                onClick={() => setExpandedMeChores((current) => !current)}
              >
                더보기 <span aria-hidden>{expandedMeChores ? "△" : "▽"}</span>
              </button>
            ) : null}
          </div>
          <div>
            <h4><i className="dot partner" /> {subjectParticleName(partnerName)} 한 일</h4>
            <ul>
              {partnerTasks.length === 0 ? (
                <li className="empty">완료한 일이 없어요</li>
              ) : (expandedPartnerChores ? partnerTasks : partnerTasks.slice(0, 5)).map((task) => (
                <li key={task.id}>
                  <span className="task-icon">
                    <AssetImage src={taskIconMap[task.iconKey ?? iconKeyForCategory(task.category)]} alt="" />
                  </span>
                  <span>{task.title}</span>
                  <em>✓</em>
                </li>
              ))}
            </ul>
            {partnerTasks.length > 5 ? (
              <button
                className="weekly-report-more"
                type="button"
                onClick={() => setExpandedPartnerChores((current) => !current)}
              >
                더보기 <span aria-hidden>{expandedPartnerChores ? "△" : "▽"}</span>
              </button>
            ) : null}
          </div>
        </section>

        <section className="weekly-report-section letters">
          <h3>
            <AssetImage src={reactionLetter} alt="" />
            주고받은 편지
          </h3>
          <div className="weekly-letter-pair">
            <div className="weekly-letter-side">
              <span className="label">
                <AvatarMark value={selectedEmoji} />
                내가 쓴 편지
              </span>
              {myLetter ? (
                <button
                  className="weekly-letter-card me"
                  type="button"
                  onClick={() => onSelectLetter(myLetter)}
                >
                  {reactionAsset(myLetter.reaction) && (
                    <span className="weekly-letter-sticker">
                      <AssetImage src={reactionAsset(myLetter.reaction)!} alt="" />
                    </span>
                  )}
                  <div className="weekly-letter-card-head">
                    <strong>나</strong>
                    <em>{formatLetterDayLabel(myLetter)}</em>
                  </div>
                  <p>{myLetter.body}</p>
                </button>
              ) : (
                <div className="weekly-letter-empty">
                  <AssetImage src={commonMailbox} alt="" />
                  <span>아직 편지가 없어요.</span>
                </div>
              )}
            </div>
            <div className="weekly-letter-side">
              <span className="label">
                <AvatarMark value={partnerAvatarId(partnerProfile)} />
                {subjectParticleName(partnerName)} 쓴 편지
              </span>
              {partnerLetter ? (
                <button
                  className="weekly-letter-card partner"
                  type="button"
                  onClick={() => onSelectLetter(partnerLetter)}
                >
                  {reactionAsset(partnerLetter.reaction) && (
                    <span className="weekly-letter-sticker">
                      <AssetImage src={reactionAsset(partnerLetter.reaction)!} alt="" />
                    </span>
                  )}
                  <div className="weekly-letter-card-head">
                    <strong>{partnerName}</strong>
                    <em>{formatLetterDayLabel(partnerLetter)}</em>
                  </div>
                  <p>{partnerLetter.body}</p>
                </button>
              ) : (
                <div className="weekly-letter-empty">
                  <AssetImage src={commonMailbox} alt="" />
                  <span>아직 편지가 없어요.</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {entry === "castle" && weekStreak > 0 && (
          <div className="weekly-streak-banner" aria-hidden>
            <AssetImage src={reactionClap} alt="" />
            <div>
              <strong>{weekStreak}주 연속 달성 중!</strong>
              <p>꾸준히 함께하고 있어요. 이번 주도 화이팅</p>
            </div>
          </div>
        )}
      </div>

      {entry === "letter" && (
        <div className="weekly-report-cta">
          <button className="weekly-next-button" type="button" disabled={isSaving} onClick={onNextWeek}>
            <AssetImage src={reactionClover} alt="" />
            <span>
              <strong>{isSaving ? "다음 주 준비 중..." : "다음주 할일 설정 하러 가기"}</strong>
              <em>{nextWeekSub}</em>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function sameCalendarDay(iso: string, year: number, month: number, day: number) {
  const date = new Date(iso);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}

function formatMonthDayLabel(year: number, month: number, day: number) {
  return `${month + 1}월 ${day}일`;
}

function LettersScreen({
  letters,
  reactions,
  partnerProfile,
  nickname,
  selectedEmoji,
  focusAt,
  onSelectLetter,
  onSelectReaction,
  onSelectDate,
}: {
  letters: AppLetter[];
  reactions: AppReaction[];
  partnerProfile: AppPartnerProfile | null;
  nickname: string;
  selectedEmoji: string;
  focusAt?: string | null;
  onSelectLetter: (letter: AppLetter) => void;
  onSelectReaction: (reaction: AppReaction) => void;
  onSelectDate?: (year: number, month: number, day: number) => void;
}) {
  const today = new Date();
  const focusDate = focusAt ? new Date(focusAt) : null;
  const focusValid = focusDate && !Number.isNaN(focusDate.getTime()) ? focusDate : null;
  const [viewYear, setViewYear] = useState(focusValid?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(focusValid?.getMonth() ?? today.getMonth());
  const [selectedDay, setSelectedDay] = useState(focusValid?.getDate() ?? today.getDate());
  const [tab, setTab] = useState<"partner" | "me">("partner");

  useEffect(() => {
    if (!focusAt) return;
    const next = new Date(focusAt);
    if (Number.isNaN(next.getTime())) return;
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setSelectedDay(next.getDate());
    setTab("partner");
  }, [focusAt]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const partnerName = partnerDisplayName(partnerProfile);
  const myName = nickname.trim() || "나";
  const myAvatar = resolveAvatarId(selectedEmoji);
  const partnerAvatar = partnerAvatarId(partnerProfile);

  const filteredLetters = letters.filter((letter) => (tab === "me" ? letter.from === "me" : letter.from === "partner"));
  const filteredReactions = reactions.filter((reaction) => (tab === "me" ? reaction.from === "me" : reaction.from === "partner"));

  const dayLetters = filteredLetters
    .filter((letter) => sameCalendarDay(letter.createdAt, viewYear, viewMonth, selectedDay))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const dayReactions = filteredReactions
    .filter((reaction) => sameCalendarDay(reaction.createdAt, viewYear, viewMonth, selectedDay))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const markersByDay = useMemo(() => {
    const map = new Map<number, { kind: "letter" | "reaction"; value: string; at: number }[]>();
    const push = (iso: string, kind: "letter" | "reaction", value: string) => {
      const date = new Date(iso);
      if (date.getFullYear() !== viewYear || date.getMonth() !== viewMonth) return;
      const day = date.getDate();
      const list = map.get(day) ?? [];
      list.push({ kind, value, at: +date });
      map.set(day, list);
    };
    filteredLetters.forEach((letter) => push(letter.createdAt, "letter", "letter"));
    filteredReactions.forEach((reaction) => push(reaction.createdAt, "reaction", reaction.reaction));
    map.forEach((list, day) => {
      list.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "letter" ? -1 : 1;
        return b.at - a.at;
      });
      map.set(day, list.slice(0, 3));
    });
    return map;
  }, [filteredLetters, filteredReactions, viewYear, viewMonth]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setSelectedDay(1);
  };

  const dateLabel = formatMonthDayLabel(viewYear, viewMonth, selectedDay);
  const letterSectionTitle = tab === "partner" ? `내가 받은 편지 · ${dateLabel}` : `내가 보낸 편지 · ${dateLabel}`;
  const reactionSectionTitle = tab === "partner" ? `내가 받은 리액션 · ${dateLabel}` : `내가 보낸 리액션 · ${dateLabel}`;

  return (
    <div className="letters-screen">
      <header className="letters-title">
        <strong>
          마음 모아
          <AssetImage src={reactionLetter} alt="" />
        </strong>
      </header>

      <div className="letters-tabs" role="tablist">
        <button
          className={tab === "partner" ? "active" : ""}
          role="tab"
          type="button"
          onClick={() => setTab("partner")}
        >
          <AssetImage src={reactionHeartPurple} alt="" />
          받은 마음
        </button>
        <button
          className={tab === "me" ? "active" : ""}
          role="tab"
          type="button"
          onClick={() => setTab("me")}
        >
          <AssetImage src={reactionHeartPink} alt="" />
          보낸 마음
        </button>
      </div>

      <section className="letters-calendar">
        <div className="letters-month-nav">
          <button type="button" aria-label="이전 달" onClick={() => shiftMonth(-1)}>‹</button>
          <strong>{viewYear}년 {viewMonth + 1}월</strong>
          <button type="button" aria-label="다음 달" onClick={() => shiftMonth(1)}>›</button>
        </div>

        <div className="letters-weekdays">
          {["일", "월", "화", "수", "목", "금", "토"].map((label, index) => (
            <span className={index === 0 ? "sun" : index === 6 ? "sat" : ""} key={label}>{label}</span>
          ))}
        </div>

        <div className="letters-days">
          {Array.from({ length: startWeekday }, (_, index) => (
            <span className="empty" key={`pad-${index}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const weekday = new Date(viewYear, viewMonth, day).getDay();
            const markers = markersByDay.get(day) ?? [];
            const isSelected = selectedDay === day;
            return (
              <button
                className={[
                  "letters-day",
                  isSelected ? "selected" : "",
                  markers.length > 0 ? "has-stamp" : "",
                  weekday === 0 ? "sun" : "",
                  weekday === 6 ? "sat" : "",
                ].filter(Boolean).join(" ")}
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDay(day);
                  onSelectDate?.(viewYear, viewMonth, day);
                }}
              >
                <em>{day}</em>
                {markers.length > 0 && (
                  <span className="letters-day-markers" aria-hidden>
                    {markers.map((marker, markerIndex) => (
                      <i key={`${day}-${markerIndex}`} className={marker.kind === "letter" ? "letter" : "reaction"}>
                        {marker.kind === "letter" ? (
                          <AssetImage src={reactionLetter} alt="" />
                        ) : (
                          <AssetImage src={reactionStar} alt="" />
                        )}
                      </i>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="letters-section">
        <div className="letters-section-head">
          <h3>{letterSectionTitle}</h3>
          <em>{dayLetters.length}개</em>
        </div>
        {dayLetters.length === 0 ? (
          <p className="letters-empty">이 날의 편지가 없어요</p>
        ) : (
          <ul className="letters-feed">
            {dayLetters.map((letter) => (
              <li key={letter.id}>
                <button className="letters-feed-card" type="button" onClick={() => onSelectLetter(letter)}>
                  <span className="letters-feed-emoji letter">
                    <AssetImage src={reactionLetter} alt="" />
                  </span>
                  <div>
                    <strong>편지</strong>
                    <p>{letter.body}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="letters-section">
        <div className="letters-section-head">
          <h3>{reactionSectionTitle}</h3>
          <em>{dayReactions.length}개</em>
        </div>
        {dayReactions.length === 0 ? (
          <p className="letters-empty">이 날의 리액션이 없어요</p>
        ) : (
          <ul className="letters-feed">
            {dayReactions.map((reaction) => (
              <li key={reaction.id}>
                <button className="letters-feed-card reaction" type="button" onClick={() => onSelectReaction(reaction)}>
                  <span className="letters-feed-emoji sender">
                    <AvatarMark value={tab === "partner" ? partnerAvatar : myAvatar} />
                  </span>
                  <div>
                    <strong>
                      💕 {tab === "partner" ? partnerName : myName} 님이 리액션을 보냈어요
                    </strong>
                    <p>{reaction.choreTitle}</p>
                  </div>
                  <span className="letters-feed-reaction-mark" aria-hidden>
                    {reaction.reaction}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function LetterDetailModal({
  letter,
  senderEmoji,
  senderName,
  onClose,
}: {
  letter: AppLetter;
  senderEmoji: string;
  senderName: string;
  onClose: () => void;
}) {
  const sticker = reactionAsset(letter.reaction);
  const dateLabel = letter.createdAt
    ? new Date(letter.createdAt).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : letter.date;

  return (
    <div className="letter-detail-overlay" role="presentation" onClick={onClose}>
      <div
        className="letter-detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="편지 상세"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="letter-detail-handle" aria-hidden />
        <button className="letter-detail-close" type="button" aria-label="닫기" onClick={onClose}>×</button>

        <div className="letter-detail-sender">
          <span className="letter-detail-avatar">
            <AvatarMark value={senderEmoji} />
          </span>
          <div>
            <em>보낸 사람</em>
            <strong>{senderName}</strong>
          </div>
        </div>

        <div className="letter-detail-content">
          <div className="letter-detail-content-head">
            <span className="letter-detail-sticker">
              {sticker ? <AssetImage src={sticker} alt="" /> : null}
            </span>
            <em>{dateLabel}</em>
          </div>
          <p>{letter.body}</p>
        </div>
      </div>
    </div>
  );
}

function ReactionDetailModal({
  reaction,
  senderEmoji,
  senderName,
  onClose,
}: {
  reaction: AppReaction;
  senderEmoji: string;
  senderName: string;
  onClose: () => void;
}) {
  const sticker = reactionAsset(reaction.reaction);
  const dateLabel = reaction.createdAt
    ? new Date(reaction.createdAt).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : reaction.date;

  return (
    <div className="letter-detail-overlay" role="presentation" onClick={onClose}>
      <div
        className="letter-detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="리액션 상세"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="letter-detail-handle" aria-hidden />
        <button className="letter-detail-close" type="button" aria-label="닫기" onClick={onClose}>×</button>

        <div className="letter-detail-sender">
          <span className="letter-detail-avatar">
            <AvatarMark value={senderEmoji} />
          </span>
          <div>
            <em>보낸 사람</em>
            <strong>{senderName}</strong>
          </div>
        </div>

        <div className="letter-detail-content">
          <div className="letter-detail-content-head">
            <span className="letter-detail-sticker">
              {sticker ? <AssetImage src={sticker} alt="" /> : (
                <span className="letter-detail-sticker-emoji">{reaction.reaction}</span>
              )}
            </span>
            <em>{dateLabel}</em>
          </div>
          <p>{senderName} 님이 리액션을 보냈어요{"\n"}{reaction.choreTitle}</p>
        </div>
      </div>
    </div>
  );
}

function formatCastleWeekRange(weekStart: string, weekEnd: string) {
  if (!weekStart || !weekEnd) return "";
  const start = weekStart.replace(/-/g, ".");
  const endDay = weekEnd.slice(8);
  return `${start}-${endDay}`;
}

function isWeekEnded(weekEnd: string) {
  if (!weekEnd) return false;
  const end = new Date(`${weekEnd}T23:59:59`);
  return end.getTime() < Date.now();
}

function CastleHistoryScreen({
  stats,
  onSelectWeek,
}: {
  stats: AppWeeklyStat[];
  onSelectWeek: (stat: AppWeeklyStat) => void;
}) {
  return (
    <div className="castle-history-screen">
      <header className="castle-history-header">
        <strong>
          성 모아
          <AssetImage src={castleLevel10} alt="" />
        </strong>
        <span>매주 쌓아온 우리의 기록</span>
      </header>

      {stats.length === 0 ? (
        <EmptyState
          icon={castleLevel1}
          title="아직 완성된 주간 기록이 없어요"
          description="이번 주를 마무리하면 성 완공률과 기여 기록이 이곳에 쌓여요."
        />
      ) : (
        <div className="castle-history-grid">
          {stats.map((stat) => {
            const complete = stat.completionRate >= 100;
            const waitingLetter = isWeekEnded(stat.weekEnd) && !stat.partnerLetterReceived;
            return (
              <button
                className={[
                  "castle-history-card",
                  complete ? "complete" : "",
                  waitingLetter ? "waiting" : "",
                ].filter(Boolean).join(" ")}
                key={stat.id}
                type="button"
                onClick={() => onSelectWeek(stat)}
              >
                <div className="castle-history-visual">
                  <AssetImage
                    src={castleSrcForWeek(stat.weekStart, stat.completionRate)}
                    alt={`${stat.completionRate}% 성`}
                  />
                  {waitingLetter && (
                    <div className="castle-history-lock">
                      <AssetImage src={reactionLetter} alt="" />
                      <span>아직 받은 편지가 없어요</span>
                    </div>
                  )}
                </div>
                <div className="castle-history-meta">
                  <em>{formatCastleWeekRange(stat.weekStart, stat.weekEnd)}</em>
                  <div className="castle-history-rate">
                    <div className="castle-history-bar">
                      <span style={{ width: `${Math.min(100, Math.max(0, stat.completionRate))}%` }} />
                    </div>
                    <strong>{stat.completionRate}%</strong>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="castle-history-hint">카드를 탭하면 상세 기록을 볼 수 있어요</p>
    </div>
  );
}

function CastleExplainScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header eyebrow="성 완성 가이드" title="성은 어떻게 완성되나요?" />
      <div className="notice-box">
        <p>성은 할 일을 12.5% 달성할 때마다 한 단계씩 업그레이드됩니다. 총 10단계로 구성되어 있으며, 할 일만으로는 8단계까지 성장할 수 있습니다.</p>
        <p>최종 9·10단계는 파트너에게 편지를 작성해야 완성할 수 있습니다. 할일 완수율(%) = (완료한 할일 수 / 전체 할일 수) × 80 + 편지 보너스(각 10%).</p>
      </div>
      <CastleCard progress={72} completeCount={7} total={10} />
    </div>
  );
}

function CastleUpgradeModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="castle-upgrade-overlay" role="presentation" onClick={onClose}>
      <div
        className="castle-upgrade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="castle-upgrade-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="castle-upgrade-header">
          <h2 id="castle-upgrade-title">
            <span className="castle-upgrade-title-icon">
              <AssetImage src={castleLevel10} alt="" />
            </span>
            성 업그레이드
          </h2>
        </div>

        <div className="castle-upgrade-guide-art">
          <AssetImage src={castleUpgradeGuide} alt="성 업그레이드 1단계부터 10단계 안내" />
        </div>

        <p className="castle-upgrade-guide">
          성은 할 일을 12.5% 달성할 때마다 한 단계씩 업그레이드됩니다.
          {"\n"}총 10단계로 구성되어 있으며,
          {"\n"}할 일만으로는 8단계까지 성장할 수 있습니다.
          {"\n"}최종 9·10단계는 주간 마감 후 파트너에게 편지를 작성해야 완성할 수 있습니다.
        </p>

        <button className="castle-upgrade-done" type="button" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}

function MyPageScreen({
  nickname,
  selectedEmoji,
  partnerProfile,
  partnerConnected,
  notificationEnabled,
  onEdit,
  onConnectPartner,
  onDisconnectPartner,
  onLogout,
  onDeleteAccount,
  onCloseWeek,
  showConfirm,
  showAlert,
}: {
  nickname: string;
  selectedEmoji: string;
  partnerProfile: AppPartnerProfile | null;
  partnerConnected: boolean;
  notificationEnabled: boolean;
  onEdit: () => void;
  onConnectPartner: () => void;
  onDisconnectPartner: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onCloseWeek: () => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel?: string,
    cancelLabel?: string,
  ) => void;
  showAlert: (title: string, message: string) => void;
}) {
  const [autoRepeat, setAutoRepeat] = useState(true);
  const [notifPartnerDone, setNotifPartnerDone] = useState(true);
  const [notifLetter, setNotifLetter] = useState(true);
  const [notifProgress, setNotifProgress] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(false);

  const openDisconnectConfirm = () => {
    showConfirm(
      "",
      "연결을 끊으면 데이터가 분리돼요. 파트너 연결을 해제하시겠습니까?",
      onDisconnectPartner,
      "확인",
      "취소",
    );
  };

  const openLogoutConfirm = () => {
    showConfirm(
      "",
      "로그아웃 하시겠습니까?",
      onLogout,
      "확인",
      "취소",
    );
  };

  const openDeleteAccountConfirm = () => {
    showConfirm(
      "",
      "회원 탈퇴 시 계정 정보가 모두 삭제되며 복구할 수 없습니다. 탈퇴하시겠습니까?",
      onDeleteAccount,
      "확인",
      "취소",
    );
  };

  return (
    <div className="settings-screen">
      <h1 className="settings-title">설정</h1>

      <section className="settings-section">
        <h2>내 프로필</h2>
        <div className="settings-profile-card">
          <span className="settings-avatar">
            <AvatarMark value={selectedEmoji} />
          </span>
          <strong>{nickname.trim() || "모아"}</strong>
          <button className="settings-edit-chip" type="button" onClick={onEdit}>수정</button>
        </div>
      </section>

      <section className="settings-section">
        <h2>파트너 관리</h2>
        <div className="settings-card">
          <div className="settings-partner-row">
            <span className="settings-avatar">
              <AvatarMark value={partnerConnected ? partnerAvatarId(partnerProfile) : "avatar-pink"} />
            </span>
            <div className="settings-partner-info">
              <strong>
                {partnerConnected
                  ? partnerDisplayName(partnerProfile)
                  : "파트너 없음"}
              </strong>
              {partnerConnected ? (
                <em className="connected"><i />연결됨</em>
              ) : (
                <em className="disconnected">미연결</em>
              )}
            </div>
            {partnerConnected ? (
              <span className="settings-connected-chip" aria-hidden>✓ 연결됨</span>
            ) : (
              <button className="settings-connect-chip" type="button" onClick={onConnectPartner}>연결하기</button>
            )}
          </div>
          {partnerConnected && (
            <>
              <div className="settings-card-divider" />
              <div className="settings-inline-row">
                <span className="settings-row-icon warn"><AssetImage src={commonWarning} alt="" /></span>
                <div>
                  <strong>파트너 연결 해제</strong>
                  <span>연결을 끊으면 데이터가 분리돼요</span>
                </div>
                <button className="settings-danger-text" type="button" onClick={openDisconnectConfirm}>
                  해제
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="settings-section">
        <h2>집안일 관리</h2>
        <div className="settings-card">
          <div className="settings-inline-row">
            <span className="settings-row-icon pink"><AssetImage src={commonRefresh} alt="" /></span>
            <div>
              <strong>할 일 자동 반복</strong>
              <span>매주 자동으로 같은 목록 사용</span>
            </div>
            <button
              aria-pressed={autoRepeat}
              className={autoRepeat ? "settings-toggle on" : "settings-toggle"}
              type="button"
              onClick={() => setAutoRepeat((value) => !value)}
            >
              <i />
            </button>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>알림 설정</h2>
        <div className="settings-card">
          {[
            {
              key: "partner",
              icon: taskPlant,
              tone: "mint",
              title: "파트너 완료 알림",
              desc: "파트너가 할 일을 완료하면 알려줘요",
              value: notifPartnerDone,
              onToggle: () => setNotifPartnerDone((value) => !value),
            },
            {
              key: "letter",
              icon: reactionLetter,
              tone: "peach",
              title: "편지·반응 알림",
              desc: "편지와 리액션이 오면 알려줘요",
              value: notifLetter,
              onToggle: () => setNotifLetter((value) => !value),
            },
            {
              key: "progress",
              icon: commonAlarm,
              tone: "lavender",
              title: "진행률 알림",
              desc: "주간 진행 상황을 알려줘요",
              value: notifProgress,
              onToggle: () => setNotifProgress((value) => !value),
            },
            {
              key: "weekly",
              icon: commonStatistics,
              tone: "sky",
              title: "주간 리포트",
              desc: "주간 리포트가 준비되면 알려줘요",
              value: notifWeekly,
              onToggle: () => setNotifWeekly((value) => !value),
            },
          ].map((item, index, list) => (
            <div key={item.key}>
              {index > 0 && <div className="settings-card-divider" />}
              <div className="settings-inline-row">
                <span className={`settings-row-icon ${item.tone}`}><AssetImage src={item.icon} alt="" /></span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
                <button
                  aria-pressed={item.value}
                  className={item.value ? "settings-toggle on" : "settings-toggle"}
                  type="button"
                  onClick={item.onToggle}
                >
                  <i />
                </button>
              </div>
              {index === list.length - 1 && !notificationEnabled && (
                <p className="settings-note">기기 알림이 꺼져 있으면 푸시가 도착하지 않을 수 있어요.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>앱 정보 및 개인정보</h2>
        <div className="settings-card">
          {[
            { icon: commonDocument, title: "서비스 이용약관" },
            { icon: commonShield, title: "개인정보 처리방침" },
            { icon: commonInfo, title: "개인정보 수집 및 이용 동의" },
          ].map((item, index) => (
            <div key={item.title}>
              {index > 0 && <div className="settings-card-divider" />}
              <button
                className="settings-inline-row link"
                type="button"
                onClick={() => showAlert("알림", "준비 중이에요.")}
              >
                <span className="settings-row-icon soft"><AssetImage src={item.icon} alt="" /></span>
                <div>
                  <strong>{item.title}</strong>
                </div>
                <em className="settings-chevron">›</em>
              </button>
            </div>
          ))}
          <div className="settings-card-divider" />
          <div className="settings-inline-row">
            <span className="settings-row-icon soft"><AssetImage src={commonInfo} alt="" /></span>
            <div>
              <strong>앱 버전</strong>
              <span>v1.0.0</span>
            </div>
            <em className="settings-version-badge">최신 버전</em>
          </div>
          <div className="settings-card-divider" />
          <button
            className="settings-inline-row link"
            type="button"
            onClick={() => showAlert("알림", "준비 중이에요.")}
          >
            <span className="settings-row-icon soft"><AssetImage src={commonChat} alt="" /></span>
            <div>
              <strong>문의하기 / 피드백</strong>
            </div>
            <em className="settings-chevron">›</em>
          </button>
        </div>
      </section>

      <div className="settings-account">
        <button className="settings-logout" type="button" onClick={openLogoutConfirm}>로그아웃</button>
        <button
          className="settings-withdraw"
          type="button"
          onClick={openDeleteAccountConfirm}
        >
          회원 탈퇴
        </button>
      </div>

      <button className="home-close-week-button" type="button" onClick={onCloseWeek}>
        주기 마감하기(테스트용)
      </button>
    </div>
  );
}

function ProfileEditSheet({
  nickname,
  selectedEmoji,
  onClose,
  onSave,
}: {
  nickname: string;
  selectedEmoji: string;
  onClose: () => void;
  onSave: (nickname: string, emoji: string) => void;
}) {
  const [tab, setTab] = useState<"nickname" | "emoji">("nickname");
  const [draftNickname, setDraftNickname] = useState(nickname.slice(0, 10));
  const [draftEmoji, setDraftEmoji] = useState(
    avatarOptions.some((item) => item.id === selectedEmoji)
      ? selectedEmoji
      : avatarOptions[0].id,
  );
  const previewAvatar = avatarOptions.find((item) => item.id === draftEmoji) ?? avatarOptions[0];
  const previewName = draftNickname.trim() || "닉네임";

  return (
    <div
      className="bottom-sheet-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bottom-sheet profile-edit-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="내 정보 수정"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-edit-handle" aria-hidden />

        <div className="profile-edit-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "nickname"}
            className={tab === "nickname" ? "active" : ""}
            type="button"
            onClick={() => setTab("nickname")}
          >
            닉네임 변경
          </button>
          <button
            role="tab"
            aria-selected={tab === "emoji"}
            className={tab === "emoji" ? "active" : ""}
            type="button"
            onClick={() => setTab("emoji")}
          >
            이모지 변경
          </button>
        </div>

        <div className="profile-edit-preview">
          <span className="profile-edit-preview-label">미리보기</span>
          <div className="profile-edit-preview-card">
            <span className="profile-edit-preview-avatar">
              <AssetImage src={previewAvatar.src} alt="" />
            </span>
            <strong>{previewName}</strong>
          </div>
        </div>

        {tab === "nickname" ? (
          <label className="profile-edit-field">
            <span>새 닉네임</span>
            <div className="profile-edit-input-wrap">
              <input
                value={draftNickname}
                maxLength={10}
                placeholder="닉네임을 입력해주세요"
                onChange={(event) => setDraftNickname(event.target.value.slice(0, 10))}
              />
              <em>{draftNickname.length}/10</em>
            </div>
          </label>
        ) : (
          <div className="profile-edit-emoji-block">
            <h3>나를 표현할 이모지를 골라요</h3>
            <div className="profile-edit-emoji-grid">
              {avatarOptions.map((avatar) => (
                <button
                  aria-label={avatar.label}
                  aria-pressed={avatar.id === draftEmoji}
                  className={avatar.id === draftEmoji ? "selected" : ""}
                  key={avatar.id}
                  type="button"
                  onClick={() => setDraftEmoji(avatar.id)}
                >
                  <AssetImage src={avatar.src} alt="" />
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="profile-edit-save"
          type="button"
          onClick={() => onSave(draftNickname, draftEmoji)}
        >
          저장하기
        </button>
      </div>
    </div>
  );
}

function formatNotificationTime(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "오전" : "오후";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const time = `${period} ${hour12}:${minutes}`;

  if (date >= startToday) return time;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function NotificationsScreen({
  notifications,
  partnerProfile,
  onBack,
  onMarkAll,
  onOpen,
}: {
  notifications: AppNotification[];
  partnerProfile: AppPartnerProfile | null;
  onBack: () => void;
  onMarkAll: () => void;
  onOpen: (item: AppNotification) => void;
}) {
  const unreadCount = notifications.filter((item) => !item.read).length;
  const today = new Date();
  const todayItems = notifications.filter((item) => isSameDay(new Date(item.createdAt), today));
  const previousItems = notifications.filter((item) => !isSameDay(new Date(item.createdAt), today));

  const iconFor = (item: AppNotification) => {
    if (item.kind === "reminder") return { kind: "asset" as const, src: commonAlarm, tone: "purple" as const };
    if (item.kind === "chore_done") return { kind: "asset" as const, src: commonCheckboxFilled, tone: "purple" as const };
    if (item.kind === "letter") return { kind: "asset" as const, src: reactionLetter, tone: "orange" as const };
    if (item.kind === "reaction") {
      const emoji = parseReactionEmojiFromTitle(item.title);
      const src = reactionOptions.find((option) => option.value === emoji)?.src ?? reactionLike;
      return { kind: "asset" as const, src, tone: "pink" as const };
    }
    if (item.kind === "partner_connect") {
      return { kind: "avatar" as const, tone: "purple" as const };
    }
    return { kind: "asset" as const, src: commonNotification, tone: "purple" as const };
  };

  const renderGroup = (label: string, items: AppNotification[]) => {
    if (items.length === 0) return null;
    return (
      <section className="notif-group">
        <h3>{label}</h3>
        <ul>
          {items.map((item) => {
            const icon = iconFor(item);
            return (
              <li key={item.id}>
                <button
                  className={item.read ? "notif-card read" : "notif-card"}
                  type="button"
                  onClick={() => onOpen(item)}
                >
                  {!item.read && <i className="notif-dot" aria-hidden />}
                  <span className={`notif-icon ${icon.tone}`}>
                    {icon.kind === "avatar" ? (
                      <AvatarMark value={partnerAvatarId(partnerProfile)} />
                    ) : (
                      <AssetImage src={icon.src} alt="" />
                    )}
                  </span>
                  <div>
                    <strong>{item.body || item.title}</strong>
                    <em>{formatNotificationTime(item.createdAt)}</em>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className="notif-screen">
      <header className="notif-header">
        <button className="notif-back" type="button" onClick={onBack}>{"< 뒤로"}</button>
        <div className="notif-title-block">
          <strong>
            알림
            <AssetImage src={commonNotification} alt="" />
          </strong>
          <span>읽지 않은 알림 {unreadCount}개</span>
        </div>
        <button
          className="notif-mark-all"
          type="button"
          disabled={unreadCount === 0}
          onClick={onMarkAll}
        >
          모두 읽음
        </button>
      </header>

      {notifications.length === 0 ? (
        <EmptyState
          icon={commonNotification}
          title="새 알림이 없어요"
          description="파트너가 집안일을 완료하면 여기에 알림이 도착해요."
        />
      ) : (
        <div className="notif-list">
          {renderGroup("오늘", todayItems)}
          {renderGroup("이전", previousItems)}
        </div>
      )}
    </div>
  );
}

function TemplateManageScreen({
  templates,
  weekCategories,
  isSaving,
  onBack,
  onAdd,
  onEdit,
  onDelete,
  onSave,
}: {
  templates: AppChoreTemplate[];
  weekCategories: Set<string>;
  isSaving: boolean;
  onBack: () => void;
  onAdd: (category: string) => void;
  onEdit: (template: AppChoreTemplate) => void;
  onDelete: (template: AppChoreTemplate) => void;
  onSave: () => void;
}) {
  const grouped = useMemo(() => {
    return templates.reduce<Record<string, AppChoreTemplate[]>>((acc, template) => {
      const category = normalizeCategory(template.category);
      acc[category] = [...(acc[category] ?? []), template];
      return acc;
    }, {});
  }, [templates]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of categoryMeta) {
      if (item.category === "기타") continue;
      const hasItems = templates.some((template) => normalizeCategory(template.category) === item.category);
      initial[item.category] = hasItems && weekCategories.has(item.category);
    }
    return initial;
  });

  const categories = categoryMeta.filter((item) => item.category !== "기타");

  return (
    <div className="template-manage-screen">
      <header className="template-manage-header">
        <button className="template-manage-back" type="button" onClick={onBack}>‹ 설정</button>
        <div>
          <h1>할 일 목록 관리</h1>
          <p>할 일 목록 수정/삭제가 가능해요</p>
        </div>
      </header>

      <div className="template-manage-list">
        {categories.map((meta) => {
          const items = grouped[meta.category] ?? [];
          const open = expanded[meta.category] ?? false;
          const icon = taskIconMap[meta.iconKey];

          return (
            <section className="template-manage-card" key={meta.category}>
              <button
                className="template-manage-category"
                type="button"
                onClick={() => setExpanded((current) => ({
                  ...current,
                  [meta.category]: !open,
                }))}
              >
                <span className="template-manage-category-icon">
                  <AssetImage src={icon} alt="" />
                </span>
                <strong>{meta.category}</strong>
                <em>{items.length}</em>
                <span className="template-manage-chevron">{open ? "▲" : "▼"}</span>
              </button>

              {open && (
                <div className="template-manage-items">
                  {items.map((template) => (
                    <div className="template-manage-row" key={template.id}>
                      <span>{template.title}</span>
                      <div className="template-manage-actions">
                        <button
                          type="button"
                          aria-label="수정"
                          onClick={() => onEdit(template)}
                        >
                          <AssetImage src={commonEdit} alt="" />
                        </button>
                        <button
                          type="button"
                          aria-label="삭제"
                          onClick={() => onDelete(template)}
                        >
                          <AssetImage src={commonDelete} alt="" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="template-manage-add"
                    type="button"
                    onClick={() => onAdd(meta.category)}
                  >
                    + 추가하기
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <button
        className="template-manage-save"
        type="button"
        disabled={isSaving}
        onClick={onSave}
      >
        {isSaving ? "저장 중..." : "저장하기"}
      </button>
    </div>
  );
}

function TemplateAddSheet({
  value,
  onChange,
  onClose,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="bottom-sheet-overlay no-dismiss" role="presentation">
      <div
        className="bottom-sheet template-add-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-add-title"
      >
        <div className="profile-edit-handle" aria-hidden />
        <div className="bottom-sheet-header">
          <h2 id="template-add-title">할 일 추가</h2>
          <button className="bottom-sheet-close" type="button" aria-label="닫기" onClick={onClose}>×</button>
        </div>

        <label className="bottom-sheet-field">
          <span>새 이름</span>
          <div className="bottom-sheet-input-wrap">
            <input
              autoFocus
              value={value}
              maxLength={30}
              placeholder="할 일을 입력하세요"
              onChange={(event) => onChange(event.target.value.slice(0, 30))}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSubmit();
              }}
            />
            <em>{value.length}/30</em>
          </div>
        </label>

        <button className="start-primary" type="button" onClick={onSubmit}>
          추가하기
        </button>
      </div>
    </div>
  );
}

function TemplateEditSheet({
  originalTitle,
  value,
  onChange,
  onClose,
  onSubmit,
}: {
  originalTitle: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="bottom-sheet-overlay no-dismiss" role="presentation">
      <div
        className="bottom-sheet template-edit-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-edit-title"
      >
        <div className="profile-edit-handle" aria-hidden />
        <div className="bottom-sheet-header">
          <h2 id="template-edit-title">할 일 수정</h2>
          <button className="bottom-sheet-close" type="button" aria-label="닫기" onClick={onClose}>×</button>
        </div>

        <label className="bottom-sheet-field">
          <span>기존 이름</span>
          <div className="template-edit-old-name" aria-readonly="true">
            <s>{originalTitle}</s>
          </div>
        </label>

        <label className="bottom-sheet-field">
          <span>새 이름</span>
          <div className="bottom-sheet-input-wrap">
            <input
              autoFocus
              value={value}
              maxLength={30}
              placeholder="할 일명을 입력해주세요"
              onChange={(event) => onChange(event.target.value.slice(0, 30))}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSubmit();
              }}
            />
            <em>{value.length}/30</em>
          </div>
        </label>

        <button className="start-primary" type="button" onClick={onSubmit}>
          수정완료
        </button>
      </div>
    </div>
  );
}

function TemplateDeleteSheet({
  title,
  category,
  onClose,
  onConfirm,
}: {
  title: string;
  category: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const iconKey = iconKeyForCategory(category);
  const icon = taskIconMap[iconKey];

  return (
    <div className="bottom-sheet-overlay no-dismiss" role="presentation">
      <div
        className="bottom-sheet template-delete-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-delete-title"
      >
        <div className="profile-edit-handle" aria-hidden />
        <span className="template-delete-icon">
          <AssetImage src={icon} alt="" />
        </span>
        <h2 id="template-delete-title">할 일을 삭제할까요?</h2>
        <div className="template-delete-target">“{title}”</div>
        <p className="template-delete-guide">
          삭제하면 이번 주 목록에서 제거되고 복구할 수 없어요.
        </p>
        <div className="template-delete-actions">
          <button type="button" className="template-delete-cancel" onClick={onClose}>취소</button>
          <button type="button" className="template-delete-confirm" onClick={onConfirm}>삭제하기</button>
        </div>
      </div>
    </div>
  );
}

function PartnerManageScreen({
  myCode,
  inviteCode,
  partnerProfile,
  isSaving,
  onInviteCodeChange,
  onCreateCode,
  onCopyCode,
  onConnect,
  onBack,
}: {
  myCode: string;
  inviteCode: string;
  partnerProfile: AppPartnerProfile | null;
  isSaving: boolean;
  onInviteCodeChange: (value: string) => void;
  onCreateCode: () => void;
  onCopyCode: () => void;
  onConnect: () => void;
  onBack: () => void;
}) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header eyebrow="파트너 연결" title="함께 성을 지을 사람" />
      {partnerProfile ? (
        <div className="profile-card">
          <div className="avatar"><AvatarMark value={partnerProfile.avatarEmoji} /></div>
          <div>
            <strong>{partnerProfile.nickname}</strong>
            <span>연결됨</span>
          </div>
        </div>
      ) : (
        <div className="notice-box">아직 파트너와 연결되지 않았어요. 초대 코드를 공유하거나 파트너 코드를 입력해 주세요.</div>
      )}
      <div className="invite-card">
        <span>내 초대 코드</span>
        <div className="invite-code-display">
          <strong>{myCode || "코드 없음"}</strong>
          {myCode && (
            <button className="icon-button copy-button" aria-label="코드 복사" onClick={onCopyCode}>
              <AssetImage src={commonCopy} alt="" />
            </button>
          )}
        </div>
        <button className="secondary-button" disabled={isSaving} onClick={onCreateCode}>
          {myCode ? "코드 다시 보기" : "내 코드 생성하기"}
        </button>
      </div>
      {!partnerProfile && (
        <>
          <label className="field">
            <span>파트너 초대 코드 입력</span>
            <input placeholder="예: MOA-1234" value={inviteCode} onChange={(event) => onInviteCodeChange(event.target.value)} />
          </label>
          <button className="primary-button" disabled={isSaving} onClick={onConnect}>{isSaving ? "연결 중..." : "파트너 연결하기"}</button>
        </>
      )}
    </div>
  );
}

function NotificationSettingsScreen({
  enabled,
  onToggle,
  onBack,
}: {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  onBack: () => void;
}) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header eyebrow="알림 설정" title="알림 받기" />
      <label className="check-row settings-row">
        <span>파트너 집안일 완료 알림</span>
        <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} />
      </label>
      <p className="helper-text">알림을 끄면 파트너에게도 내 완료 알림이 전송되지 않아요.</p>
    </div>
  );
}

function AccountSettingsScreen({
  onLogout,
  onBack,
}: {
  onLogout: () => void;
  onBack: () => void;
}) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header eyebrow="계정 설정" title="계정 관리" />
      <div className="menu-list">
        <button onClick={onLogout}>로그아웃</button>
      </div>
    </div>
  );
}

function AssetImage({ src, alt }: { src: AssetModule; alt: string }) {
  return <Image src={src} alt={alt} width={96} height={96} unoptimized />;
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "logo-orb compact" : "logo-orb"}>
      <AssetImage src={mainLogo} alt="모아성" />
    </div>
  );
}

function IconBubble({ src, alt }: { src: AssetModule; alt: string }) {
  return (
    <div className="logo-orb">
      <AssetImage src={src} alt={alt} />
    </div>
  );
}

function AvatarMark({ value }: { value: string }) {
  const avatar = avatarOptions.find((item) => item.id === resolveAvatarId(value));
  if (!avatar) return <AssetImage src={avatarOptions[0].src} alt="" />;

  return <AssetImage src={avatar.src} alt="" />;
}

function EmptyState({ icon, title, description }: { icon: AssetModule; title: string; description: string }) {
  return (
    <div className="empty-state">
      <div><AssetImage src={icon} alt="" /></div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="section-header">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
    </header>
  );
}

function BottomNav({ current, onChange }: { current: Screen; onChange: (screen: Screen) => void }) {
  const items: { screen: Screen; label: string; icon: AssetModule }[] = [
    { screen: "home", label: "홈", icon: bottomNavHome },
    { screen: "letters", label: "마음", icon: bottomNavCalander },
    { screen: "castle", label: "성", icon: bottomNavCastle },
    { screen: "mypage", label: "마이페이지", icon: bottomNavMypage },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          className={current === item.screen ? "active" : ""}
          key={item.screen}
          onClick={() => onChange(item.screen)}
        >
          <span><AssetImage src={item.icon} alt="" /></span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
