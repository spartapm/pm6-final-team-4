"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
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
import bottomNavCalander from "../../icons/bottomNav-calander.svg";
import bottomNavCastle from "../../icons/bottomNav-castle.svg";
import bottomNavHome from "../../icons/bottomNav-home.svg";
import bottomNavMypage from "../../icons/bottomNav-mypage.svg";
import castleLevel1 from "../../castle_image/성1단계.svg";
import castleLevel2 from "../../castle_image/성2단계.svg";
import castleLevel3 from "../../castle_image/성3단계.svg";
import castleLevel4 from "../../castle_image/성4단계.svg";
import castleLevel5 from "../../castle_image/성5단계.svg";
import castleLevel6 from "../../castle_image/성6단계.svg";
import castleLevel7 from "../../castle_image/성7단계.svg";
import castleLevel8 from "../../castle_image/성8단계.svg";
import castleLevel9 from "../../castle_image/성9단계.svg";
import castleLevel10 from "../../castle_image/성10단계.svg";
import commonHeartOutline from "../../icons/common-heart-outline.svg";
import commonNotification from "../../icons/common-notification.svg";
import commonWarning from "../../icons/common-warning.svg";
import mainLogo from "../../icons/main-logo.svg";
import reactionClap from "../../icons/reaction-clap.svg";
import reactionClover from "../../icons/reaction-clover.svg";
import reactionFlower from "../../icons/reaction-flower.svg";
import reactionHeartPink from "../../icons/reaction-heart-pink.svg";
import reactionLetter from "../../icons/reaction-letter.svg";
import reactionLike from "../../icons/reaction-like.svg";
import reactionSparkle from "../../icons/reaction-sparkle.svg";
import reactionStar from "../../icons/reaction-star.svg";
import snsKakao from "../../icons/sns-kakao.svg";
import { AlertDialog, ConfirmDialog, ModalOverlay } from "@/components/modals";
import { categoryCatalog, taskIconMap } from "@/lib/chore-catalog";
import {
  addChoreReaction,
  AppChoreTemplate,
  AppLetter,
  AppNotification,
  AppPartnerProfile,
  AppTask,
  AppWeeklyStat,
  closeWeeklyCycle,
  countCompletedWeekStreak,
  coupleHasWeeklyChores,
  createChoreTemplate,
  createInviteCode,
  createNotification,
  deleteChoreTemplate,
  ensureCouple,
  ensureCurrentCycle,
  ensureProfile,
  getActiveInviteCode,
  getCurrentCouple,
  getPartnerProfile,
  getProfile,
  getWeeklyLetterStatus,
  insertLetter,
  insertWeeklyChore,
  isPersistedId,
  loadChoreTemplates,
  loadLetters,
  loadNotifications,
  loadPreviousCycleChores,
  loadWeeklyStats,
  loadWeeklyChores,
  markNotificationRead,
  mergeTemplatesIntoCatalog,
  parseInviteError,
  redeemInviteCode,
  replaceWeeklyChores,
  seedDefaultTemplates,
  startNextWeekCycle,
  updateChoreTemplate,
  updateWeeklyChore,
  upsertWeeklyStats,
} from "@/lib/moaseong-db";
import commonCopy from "../../icons/common-copy.svg";

type Screen =
  | "landing"
  | "profile"
  | "social"
  | "login"
  | "invite"
  | "chores"
  | "home"
  | "letter"
  | "sent"
  | "close"
  | "weeklyLetter"
  | "stats"
  | "letters"
  | "letterDetail"
  | "castle"
  | "castleExplain"
  | "mypage"
  | "profileEdit"
  | "notifications"
  | "templateManage"
  | "templateEdit"
  | "templateAdd"
  | "partnerManage"
  | "notificationSettings"
  | "accountSettings";

type DialogState =
  | { kind: "alert"; title: string; message: string }
  | {
      kind: "confirm";
      title: string;
      message: string;
      confirmLabel?: string;
      cancelLabel?: string;
      onConfirm: () => void;
    }
  | null;

type Assignee = "me" | "partner" | "none";
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

const castleLevels = [
  castleLevel1,
  castleLevel2,
  castleLevel3,
  castleLevel4,
  castleLevel5,
  castleLevel6,
  castleLevel7,
  castleLevel8,
  castleLevel9,
  castleLevel10,
];

const reactionOptions = [
  { value: "💗", src: reactionHeartPink, label: "하트" },
  { value: "👍", src: reactionLike, label: "좋아요" },
  { value: "🌸", src: reactionFlower, label: "꽃" },
  { value: "🍀", src: reactionClover, label: "클로버" },
  { value: "☀️", src: reactionSparkle, label: "반짝" },
  { value: "👏", src: reactionClap, label: "박수" },
  { value: "⭐", src: reactionStar, label: "별" },
];

const assigneeLabel: Record<Assignee, string> = {
  me: "내가 할 일",
  partner: "파트너가 할 일",
  none: "미정",
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [nickname, setNickname] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(avatarOptions[0].id);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [myCode, setMyCode] = useState("");
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [letterBody, setLetterBody] = useState("");
  const [reaction, setReaction] = useState("💗");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentCoupleId, setCurrentCoupleId] = useState<string | null>(null);
  const [currentCycleId, setCurrentCycleId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthResolving, setIsAuthResolving] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const isHandlingAuthRef = useRef(false);
  const [letters, setLetters] = useState<AppLetter[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<AppWeeklyStat[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [templates, setTemplates] = useState<AppChoreTemplate[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<AppPartnerProfile | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<AppLetter | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<AppChoreTemplate | null>(null);
  const [templateDraft, setTemplateDraft] = useState({ title: "", category: "기타" });
  const [dialog, setDialog] = useState<DialogState>(null);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [choreMode, setChoreMode] = useState<"first" | "repeat">("first");
  const [statsComplete, setStatsComplete] = useState(false);
  const [weekStreak, setWeekStreak] = useState(0);
  const [weeklyLetterStatus, setWeeklyLetterStatus] = useState({ meSent: false, partnerSent: false, bothSent: false });
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  const showAlert = (title: string, message: string) => setDialog({ kind: "alert", title, message });
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = "확인",
    cancelLabel = "취소",
  ) => setDialog({ kind: "confirm", title, message, onConfirm, confirmLabel, cancelLabel });

  const completeCount = tasks.filter((task) => task.done).length;
  const progress = tasks.length > 0 ? Math.round((completeCount / tasks.length) * 100) : 0;
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
    setPartnerId(couple ? (couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id) : null);
  };

  const loadCycleData = async (coupleId: string, userId: string) => {
    const cycleId = await ensureCurrentCycle(coupleId);
    const partner = partnerId ?? (await getCurrentCouple())?.user_a_id === userId
      ? (await getCurrentCouple())?.user_b_id ?? null
      : (await getCurrentCouple())?.user_a_id ?? null;

    const [savedTasks, savedLetters, savedStats, notifs, letterStatus, streak] = await Promise.all([
      loadWeeklyChores(cycleId),
      loadLetters(userId),
      loadWeeklyStats(coupleId),
      loadNotifications(userId),
      getWeeklyLetterStatus(cycleId, userId, partner),
      countCompletedWeekStreak(coupleId),
    ]);

    setCurrentCycleId(cycleId);
    setTasks(savedTasks);
    setLetters(savedLetters);
    setWeeklyStats(savedStats);
    setNotifications(notifs);
    setWeeklyLetterStatus(letterStatus);
    setWeekStreak(streak);
    if (partner) setPartnerProfile(await getPartnerProfile(partner));

    return savedTasks.length;
  };

  const prepareChoreSelection = async (coupleId: string, userId: string) => {
    const seeded = await seedDefaultTemplates(userId);
    setTemplates(seeded);

    const savedTasks = await loadWeeklyChores(await ensureCurrentCycle(coupleId));
    if (savedTasks.length > 0) {
      setTasks(savedTasks);
      setChoreMode("repeat");
      return;
    }

    const previousTasks = await loadPreviousCycleChores(coupleId);
    if (previousTasks.length > 0) {
      setTasks(previousTasks);
      setChoreMode("repeat");
      return;
    }

    setTasks(mergeTemplatesIntoCatalog(seeded));
    setChoreMode("first");
  };

  const initializeUserData = async (userId: string, profileDraft?: { nickname: string; avatarEmoji: string }) => {
    setCurrentUserId(userId);

    const existingProfile = await getProfile(userId);
    if (existingProfile) {
      setNickname(existingProfile.nickname);
      setSelectedEmoji(existingProfile.avatar_emoji);
    } else {
      await ensureProfile(userId, profileDraft?.nickname?.trim() || nickname.trim() || "모아", profileDraft?.avatarEmoji ?? selectedEmoji);
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
    isHandlingAuthRef.current = true;

    const authIntent = window.localStorage.getItem("moaseong-auth-intent");
    const profileDraft = getProfileDraft();
    window.localStorage.removeItem("moaseong-auth-intent");
    window.localStorage.removeItem("moaseong-profile-draft");

    let savedTaskCount = 0;

    try {
      const initResult = await initializeUserData(userId, profileDraft);
      savedTaskCount = initResult.savedTaskCount;

      if (authIntent === "signup" && !initResult.isNewUser) {
        showConfirm("이미 존재하는 계정이에요", "로그인할까요?", () => setScreen(savedTaskCount > 0 ? "home" : "chores"), "네", "아니오");
        return;
      }

      if (authIntent === "login" && initResult.isNewUser) {
        showConfirm("회원가입 할까요?", "아직 가입된 계정이 없어요. 새로 시작할까요?", () => setScreen("profile"), "가입할게요", "아니요");
        return;
      }

      if (authIntent === "signup") {
        setScreen("invite");
      } else if (savedTaskCount > 0) {
        setScreen("home");
      } else {
        const couple = await ensureCouple(userId);
        syncCoupleState(userId, couple);
        await prepareChoreSelection(couple.id, userId);
        setScreen("chores");
      }
    } catch (error) {
      console.warn("Supabase data initialization failed after login.", error);
      setCurrentUserId(userId);
      setScreen("landing");
    } finally {
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
      showAlert("로그인 실패", "로그인에 실패했어요. 다시 시도해 주세요.");
    }
  };

  const handleProfileNext = async () => {
    if (!nickname.trim()) {
      showAlert("닉네임 입력", "닉네임을 입력해 주세요.");
      return;
    }

    if (!agreedToTerms) {
      showAlert("약관 동의", "이용약관에 동의해 주세요.");
      return;
    }

    window.localStorage.setItem(
      "moaseong-profile-draft",
      JSON.stringify({ nickname: nickname.trim(), avatarEmoji: selectedEmoji }),
    );

    if (currentUserId) await ensureProfile(currentUserId, nickname.trim(), selectedEmoji);
    setScreen("social");
  };

  const createInviteCodeForUser = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return;

    setIsSaving(true);
    try {
      await ensureProfile(userId, nickname.trim() || "모아", selectedEmoji);
      const { code, couple } = await createInviteCode(userId);
      setMyCode(code);
      syncCoupleState(userId, couple);
      setShowInviteCodeModal(true);
    } catch {
      showAlert("코드 생성 실패", "초대 코드 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyInviteCode = async () => {
    if (!myCode) return;
    try {
      await navigator.clipboard.writeText(myCode);
      showAlert("복사 완료", "초대 코드를 복사했어요.");
    } catch {
      showAlert("복사 실패", "코드를 직접 복사해 주세요.");
    }
  };

  const updateTask = async (id: string, patch: Partial<AppTask>) => {
    const previous = tasks.find((task) => task.id === id);
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));

    const userId = await ensureSignedInUser();
    if (!userId || !isPersistedId(id)) return;

    try {
      await updateWeeklyChore(id, userId, patch);
      if (patch.done && !previous?.done && partnerId && notificationEnabled) {
        const task = tasks.find((item) => item.id === id);
        await createNotification({
          userId: partnerId,
          choreId: id,
          title: "집안일 완료 알림",
          body: `${nickname || "파트너"}님이 '${task?.title ?? "할 일"}'을(를) 완료했어요.`,
        });
      }
    } catch {
      showAlert("저장 실패", "할 일 저장에 실패했어요. 다시 시도해 주세요.");
    }
  };

  const addTask = async () => {
    const title = newTask.trim();
    if (!title) return;

    const context = await ensureCoupleAndCycle();
    if (!context) return;

    try {
      const savedTask = await insertWeeklyChore(context.cycleId, title);
      setTasks((current) => [...current, savedTask]);
      setNewTask("");
    } catch {
      showAlert("추가 실패", "할 일 추가에 실패했어요. 다시 시도해 주세요.");
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

  const openTemplateManage = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return;
    const seeded = await seedDefaultTemplates(userId);
    setTemplates(seeded);
    setScreen("templateManage");
  };

  const handleSaveProfile = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return;
    if (!nickname.trim()) {
      showAlert("닉네임 입력", "닉네임을 입력해 주세요.");
      return;
    }
    try {
      await ensureProfile(userId, nickname.trim(), selectedEmoji);
      setScreen("mypage");
    } catch {
      showAlert("저장 실패", "프로필 저장에 실패했어요.");
    }
  };

  const handleNotificationOpen = async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((current) => current.map((item) => (
        item.id === notificationId ? { ...item, read: true } : item
      )));
    } catch {
      // 읽음 처리 실패는 목록 표시를 막지 않습니다.
    }
  };

  const handleSaveTemplate = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return;
    const title = templateDraft.title.trim();
    if (!title) {
      showAlert("입력 필요", "할 일 이름을 입력해 주세요.");
      return;
    }
    try {
      if (editingTemplate) {
        await updateChoreTemplate(editingTemplate.id, title, templateDraft.category);
        setTemplates(await loadChoreTemplates(userId));
      } else {
        const created = await createChoreTemplate(userId, title, templateDraft.category);
        setTemplates((current) => [...current, created]);
      }
      setEditingTemplate(null);
      setTemplateDraft({ title: "", category: "기타" });
      setScreen("templateManage");
    } catch {
      showAlert("저장 실패", "할 일 저장에 실패했어요.");
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    showConfirm("삭제 확인", "이 할 일을 목록에서 삭제할까요?", () => {
      void (async () => {
        try {
          await deleteChoreTemplate(templateId);
          setTemplates((current) => current.filter((item) => item.id !== templateId));
        } catch {
          showAlert("삭제 실패", "삭제에 실패했어요.");
        }
      })();
    });
  };

  const handlePartnerRedeem = async () => {
    const userId = await ensureSignedInUser();
    if (!userId || !inviteCode.trim()) {
      showAlert("코드 입력", "파트너 초대 코드를 입력해 주세요.");
      return;
    }
    setIsSaving(true);
    try {
      const coupleId = await redeemInviteCode(inviteCode.trim());
      const couple = await getCurrentCouple();
      syncCoupleState(userId, couple ?? { id: coupleId, user_a_id: userId, user_b_id: null });
      await loadCycleData(coupleId, userId);
      setInviteCode("");
      showAlert("연결 완료", "파트너와 연결됐어요.");
    } catch (error) {
      showAlert("연결 실패", parseInviteError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChoreSelection = (id: string) => {
    setTasks((current) => current.map((task) => (
      task.id === id ? { ...task, selected: !task.selected } : task
    )));
  };

  const deselectAllChores = () => {
    setTasks((current) => current.map((task) => ({ ...task, selected: false })));
  };

  const saveWeeklyChoresAndGoHome = async () => {
    const context = await ensureCoupleAndCycle();
    if (!context) return;

    if (choreSelectionTasks.filter((task) => task.selected).length === 0) {
      showAlert("선택 필요", "최소 한 개 이상의 할 일을 선택해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const savedTasks = await replaceWeeklyChores(context.cycleId, context.userId, choreSelectionTasks);
      setTasks(savedTasks);
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
    await prepareChoreSelection(couple.id, userId);
    setScreen("chores");
  };

  const handleInviteNext = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return;

    if (!inviteCode.trim() && !myCode) {
      showConfirm(
        "코드 없이 진행",
        "아직 코드를 생성하지 않았어요. 연결을 나중에 할까요?",
        () => void proceedInviteToChores(),
        "나중에 할게요",
        "연결할게요",
      );
      return;
    }

    setIsSaving(true);
    try {
      await ensureProfile(userId, nickname.trim() || "모아", selectedEmoji);

      if (inviteCode.trim()) {
        const coupleId = await redeemInviteCode(inviteCode.trim());
        const couple = await getCurrentCouple();
        syncCoupleState(userId, couple ?? { id: coupleId, user_a_id: userId, user_b_id: null });
        const hasPartnerTasks = await coupleHasWeeklyChores(coupleId);
        await loadCycleData(coupleId, userId);
        if (hasPartnerTasks) {
          setScreen("home");
        } else {
          showConfirm(
            "파트너 할 일 없음",
            "파트너가 아직 할 일을 등록하지 않았어요. 내가 먼저 등록해볼까요?",
            () => void proceedInviteToChores(),
            "네",
            "아니오",
          );
        }
      } else {
        const couple = await ensureCouple(userId);
        syncCoupleState(userId, couple);
        await proceedInviteToChores();
      }
    } catch (error) {
      showAlert("초대 코드 오류", parseInviteError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipInvite = () => {
    showConfirm(
      "나중에 연결",
      "파트너와 연결을 나중에 할까요? 파트너와 함께해야 집이 완성돼요. 마이페이지에서 언제든 연결할 수 있어요.",
      () => void proceedInviteToChores(),
      "나중에 할게요",
      "연결할게요",
    );
  };

  const sendLetter = async (weekly = false) => {
    const body = letterBody.trim();
    if (!body) {
      showAlert("편지 작성", "편지 내용을 입력해 주세요.");
      return;
    }

    const userId = await ensureSignedInUser();
    if (!userId) return;

    try {
      const savedLetter = await insertLetter({
        cycleId: currentCycleId,
        senderId: userId,
        receiverId: partnerId,
        body,
        reaction,
        weekly,
      });

      setLetters((current) => [savedLetter, ...current]);
      setLetterBody("");

      if (weekly && currentCycleId && currentCoupleId) {
        const letterStatus = await getWeeklyLetterStatus(currentCycleId, userId, partnerId);
        setWeeklyLetterStatus(letterStatus);
        const complete = letterStatus.bothSent && progress >= 80;
        setStatsComplete(complete);
        setWeekStreak(await countCompletedWeekStreak(currentCoupleId));
        setScreen("stats");
        return;
      }

      setScreen(weekly ? "stats" : "sent");
    } catch {
      showAlert("전송 실패", "편지 전송에 실패했어요. 다시 시도해 주세요.");
    }
  };

  const handleReact = async (id: string, reactionValue = "💗") => {
    await updateTask(id, { reacted: true });

    const userId = await ensureSignedInUser();
    if (!userId || !isPersistedId(id)) return;

    try {
      await addChoreReaction(id, userId, reactionValue);
    } catch {
      showAlert("리액션 실패", "리액션 저장에 실패했어요. 다시 시도해 주세요.");
    }
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
      if (currentCoupleId) setWeeklyStats(await loadWeeklyStats(currentCoupleId));
    } catch {
      // 통계 저장 실패가 주간 마감 흐름 자체를 막지는 않게 둡니다.
    }

    setScreen("weeklyLetter");
  };

  const finishWeekAndStartNext = async () => {
    if (!currentCoupleId || !currentCycleId) return;
    setIsSaving(true);
    try {
      await closeWeeklyCycle(currentCycleId);
      const { cycleId, tasks: nextTasks } = await startNextWeekCycle(currentCoupleId, tasks);
      setCurrentCycleId(cycleId);
      setTasks(nextTasks);
      setChoreMode("repeat");
      setScreen("chores");
    } catch {
      showAlert("주기 전환 실패", "다음 주로 넘어가지 못했어요. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const choreContribution = Math.round((progress / 100) * 80);
  const letterContribution = weeklyLetterStatus.bothSent ? 10 : weeklyLetterStatus.meSent || weeklyLetterStatus.partnerSent ? 5 : 0;
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
            onNext={handleProfileNext}
          />
        );
      case "social":
      case "login":
        return (
          <SocialScreen
            mode={screen}
            isLoggingIn={isLoggingIn}
            onBack={() => setScreen(screen === "social" ? "profile" : "landing")}
            onLogin={() => handleSocialLogin(screen)}
          />
        );
      case "invite":
        return (
          <InviteScreen
            inviteCode={inviteCode}
            myCode={myCode}
            onInviteCodeChange={setInviteCode}
            onCreateCode={createInviteCodeForUser}
            onNext={handleInviteNext}
            onSkip={handleSkipInvite}
            isSaving={isSaving}
          />
        );
      case "chores":
        return (
          <ChoreSelectScreen
            tasks={choreSelectionTasks}
            groupedTasks={groupedTasks}
            choreMode={choreMode}
            newTask={newTask}
            onNewTaskChange={setNewTask}
            onToggle={toggleChoreSelection}
            onDeselectAll={deselectAllChores}
            onAssignee={(id, assignee) => {
              setTasks((current) => current.map((task) => (task.id === id ? { ...task, assignee } : task)));
              if (isPersistedId(id)) void updateTask(id, { assignee });
            }}
            onAddTask={addTask}
            onDone={saveWeeklyChoresAndGoHome}
            isSaving={isSaving}
          />
        );
      case "letter":
      case "weeklyLetter":
        return (
          <LetterWriteScreen
            weekly={screen === "weeklyLetter"}
            body={letterBody}
            reaction={reaction}
            progress={progress}
            onBodyChange={setLetterBody}
            onReactionChange={setReaction}
            onBack={goHome}
            onSend={() => sendLetter(screen === "weeklyLetter")}
          />
        );
      case "sent":
        return <SentScreen onHome={goHome} />;
      case "close":
        return <CloseWeekScreen onCancel={goHome} onNext={closeWeek} />;
      case "stats":
        return (
          <StatsScreen
            progress={progress}
            completeCount={completeCount}
            totalCount={tasks.length}
            meDone={meDone}
            partnerDone={partnerDone}
            choreContribution={choreContribution}
            letterContribution={letterContribution}
            complete={statsComplete}
            weekStreak={weekStreak}
            weeklyLetterStatus={weeklyLetterStatus}
            onNext={() => void finishWeekAndStartNext()}
            isSaving={isSaving}
          />
        );
      case "letters":
        return (
          <LettersScreen
            letters={letters}
            onSelect={(letter) => {
              setSelectedLetter(letter);
              setScreen("letterDetail");
            }}
          />
        );
      case "letterDetail":
        return selectedLetter ? (
          <LetterDetailScreen letter={selectedLetter} onBack={() => setScreen("letters")} />
        ) : null;
      case "castle":
        return (
          <CastleHistoryScreen
            stats={weeklyStats}
            onExplain={() => setScreen("castleExplain")}
          />
        );
      case "castleExplain":
        return <CastleExplainScreen onBack={() => setScreen("castle")} />;
      case "mypage":
        return (
          <MyPageScreen
            nickname={nickname}
            selectedEmoji={selectedEmoji}
            myCode={myCode}
            partnerProfile={partnerProfile}
            onEdit={() => setScreen("profileEdit")}
            onManageTasks={() => void openTemplateManage()}
            onPartnerManage={() => setScreen("partnerManage")}
            onNotificationSettings={() => setScreen("notificationSettings")}
            onAccountSettings={() => setScreen("accountSettings")}
          />
        );
      case "profileEdit":
        return (
          <ProfileEditScreen
            nickname={nickname}
            selectedEmoji={selectedEmoji}
            onNicknameChange={setNickname}
            onEmojiChange={setSelectedEmoji}
            onSave={() => void handleSaveProfile()}
            onBack={() => setScreen("mypage")}
          />
        );
      case "notifications":
        return (
          <NotificationsScreen
            notifications={notifications}
            onBack={goHome}
            onOpen={(id) => void handleNotificationOpen(id)}
          />
        );
      case "templateManage":
        return (
          <TemplateManageScreen
            templates={templates}
            onBack={() => setScreen("mypage")}
            onAdd={() => {
              setEditingTemplate(null);
              setTemplateDraft({ title: "", category: "기타" });
              setScreen("templateAdd");
            }}
            onEdit={(template) => {
              setEditingTemplate(template);
              setTemplateDraft({ title: template.title, category: template.category });
              setScreen("templateEdit");
            }}
            onDelete={handleDeleteTemplate}
          />
        );
      case "templateEdit":
      case "templateAdd":
        return (
          <TemplateEditScreen
            draft={templateDraft}
            categories={categoryCatalog.map((item) => item.category)}
            isEditing={screen === "templateEdit"}
            onDraftChange={setTemplateDraft}
            onSave={() => void handleSaveTemplate()}
            onBack={() => setScreen("templateManage")}
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
            onLogout={async () => {
              await supabase.auth.signOut();
              setScreen("landing");
              setTasks([]);
              setLetters([]);
              setCurrentUserId(null);
            }}
            onBack={() => setScreen("mypage")}
          />
        );
      case "home":
      default:
        return (
          <HomeScreen
            nickname={nickname}
            selectedEmoji={selectedEmoji}
            tasks={tasks}
            progress={progress}
            completeCount={completeCount}
            unreadCount={unreadCount}
            onToggle={(id) => updateTask(id, { done: !tasks.find((task) => task.id === id)?.done })}
            onReact={handleReact}
            onWriteLetter={() => setScreen("letter")}
            onAddTask={() => void openChoreSelection()}
            onCloseWeek={() => setScreen("close")}
            onNotifications={() => setScreen("notifications")}
            onCastleExplain={() => setScreen("castleExplain")}
          />
        );
    }
  };

  const showNav = ["home", "letters", "castle", "mypage"].includes(screen);

  return (
    <main className="app-shell">
      <section className="app-frame">
        <div className={showNav ? "screen with-nav" : "screen"}>
          {isAuthResolving ? <AuthLoadingScreen /> : authError ? <AuthErrorScreen message={authError} onRetry={() => {
            setAuthError(null);
            setScreen("login");
          }} /> : renderScreen()}
        </div>
        {showNav && <BottomNav current={screen} onChange={setScreen} />}
      </section>

      {dialog?.kind === "alert" && (
        <AlertDialog title={dialog.title} message={dialog.message} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "confirm" && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          onConfirm={() => {
            dialog.onConfirm();
            setDialog(null);
          }}
          onCancel={() => setDialog(null)}
        />
      )}

      {showInviteCodeModal && myCode && (
        <ModalOverlay onClose={() => setShowInviteCodeModal(false)}>
          <h2>내 초대 코드</h2>
          <p>파트너에게 아래 코드를 공유해 주세요.</p>
          <div className="invite-code-display">
            <strong>{myCode}</strong>
            <button className="icon-button copy-button" aria-label="코드 복사" onClick={() => void copyInviteCode()}>
              <AssetImage src={commonCopy} alt="" />
            </button>
          </div>
          <button className="primary-button" onClick={() => setShowInviteCodeModal(false)}>확인</button>
        </ModalOverlay>
      )}
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
    <div className="center-screen gradient-bg">
      <LogoMark />
      <h2>모아성</h2>
      <p>작은 집안일 하나가 모여 우리의 성이 됩니다</p>
      <button className="primary-button" onClick={onStart}>새로 시작하기</button>
      <button className="ghost-button" onClick={onLogin}>기존 계정 로그인</button>
    </div>
  );
}

function ProfileScreen({
  nickname,
  selectedEmoji,
  onNicknameChange,
  onEmojiChange,
  agreedToTerms,
  onTermsChange,
  onNext,
}: {
  nickname: string;
  selectedEmoji: string;
  onNicknameChange: (value: string) => void;
  onEmojiChange: (value: string) => void;
  agreedToTerms: boolean;
  onTermsChange: (value: boolean) => void;
  onNext: () => void;
}) {
  return (
    <div className="stack-screen">
      <div className="onboarding-brand">
        <LogoMark compact />
        <h2>모아성</h2>
        <p>나를 표현할 아바타를 골라주세요</p>
      </div>
      <label className="field">
        <span>닉네임</span>
        <input value={nickname} maxLength={10} onChange={(event) => onNicknameChange(event.target.value)} />
      </label>
      <div className="emoji-grid">
        {avatarOptions.map((avatar) => (
          <button
            aria-label={avatar.label}
            className={avatar.id === selectedEmoji ? "emoji-choice selected" : "emoji-choice"}
            key={avatar.id}
            onClick={() => onEmojiChange(avatar.id)}
          >
            <AssetImage src={avatar.src} alt="" />
          </button>
        ))}
      </div>
      <label className="check-row">
        <input type="checkbox" checked={agreedToTerms} onChange={(event) => onTermsChange(event.target.checked)} />
        이용약관과 개인정보 처리방침에 동의합니다
      </label>
      <button className="primary-button sticky-bottom" onClick={onNext}>시작하기</button>
    </div>
  );
}

function SocialScreen({
  mode,
  isLoggingIn,
  onBack,
  onLogin,
}: {
  mode: "social" | "login";
  isLoggingIn: boolean;
  onBack: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header
        eyebrow={mode === "social" ? "간편 로그인 연동" : "로그인"}
        title={mode === "social" ? "계정을 연결하면 기록이 안전하게 저장돼요" : "다시 만나서 반가워요"}
      />
      <div className="social-card">
        <button className="kakao-button" disabled={isLoggingIn} onClick={onLogin}><AssetImage src={snsKakao} alt="" />{isLoggingIn ? "연결 중..." : "카카오로 계속하기"}</button>
      </div>
      <p className="helper-text">로그인하면 파트너와 함께 만든 기록이 안전하게 저장돼요.</p>
    </div>
  );
}

function InviteScreen({
  inviteCode,
  myCode,
  onInviteCodeChange,
  onCreateCode,
  onNext,
  onSkip,
  isSaving,
}: {
  inviteCode: string;
  myCode: string;
  onInviteCodeChange: (value: string) => void;
  onCreateCode: () => void;
  onNext: () => void;
  onSkip: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="stack-screen">
      <div className="partner-hero">
        <span><AvatarMark value="avatar-pink" /></span>
        <span><AssetImage src={reactionHeartPink} alt="" /></span>
        <span><AvatarMark value="avatar-mint" /></span>
      </div>
      <Header eyebrow="파트너 초대" title="같이 성을 지을 파트너를 연결해요" />
      <label className="field">
        <span>파트너 초대 코드</span>
        <input placeholder="예: MOA-1234" value={inviteCode} onChange={(event) => onInviteCodeChange(event.target.value)} />
      </label>
      <div className="invite-card">
        <span>내 초대 코드</span>
        <strong>{myCode || "아직 생성하지 않았어요"}</strong>
        <button className="secondary-button" disabled={isSaving} onClick={onCreateCode}>{myCode ? "초대 코드 다시 보기" : "내 코드 생성하기"}</button>
      </div>
      <button className="primary-button sticky-bottom" disabled={isSaving} onClick={onNext}>{isSaving ? "저장 중..." : "다음으로"}</button>
      <button className="text-button" disabled={isSaving} onClick={onSkip}>나중에 연결할게요</button>
    </div>
  );
}

function ChoreSelectScreen({
  tasks,
  groupedTasks,
  choreMode,
  newTask,
  onNewTaskChange,
  onToggle,
  onDeselectAll,
  onAssignee,
  onAddTask,
  onDone,
  isSaving,
}: {
  tasks: AppTask[];
  groupedTasks: Record<string, AppTask[]>;
  choreMode: "first" | "repeat";
  newTask: string;
  onNewTaskChange: (value: string) => void;
  onToggle: (id: string) => void;
  onDeselectAll: () => void;
  onAssignee: (id: string, assignee: Assignee) => void;
  onAddTask: () => void;
  onDone: () => void;
  isSaving: boolean;
}) {
  const selectedCount = tasks.filter((task) => task.selected).length;

  return (
    <div className="stack-screen">
      <Header
        eyebrow="이번 주"
        title={choreMode === "repeat" ? "지난주 할 일을 불러왔어요" : "이번 주 할 일을 선택해요"}
      />
      <div className="notice-box">
        {choreMode === "repeat"
          ? "지난주에 선택한 할 일이 미리 선택돼 있어요. 필요하면 전체 해제 후 다시 고를 수 있어요."
          : "10가지 카테고리에서 자주 하는 집안일을 골라 이번 주 목록을 만들어 보세요."}
      </div>
      {choreMode === "repeat" && (
        <button className="ghost-button deselect-all-button" onClick={onDeselectAll}>전체 해제</button>
      )}
      <div className="category-list">
        {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
          <section className="category-card" key={category}>
            <div className="category-head">
              <strong>{category}</strong>
              <span>{categoryTasks.filter((task) => task.selected).length}개 선택</span>
            </div>
            {categoryTasks.map((task) => (
              <div className="task-edit-row" key={task.id}>
                <label>
                  <input type="checkbox" checked={task.selected} onChange={() => onToggle(task.id)} />
                  {task.iconKey && taskIconMap[task.iconKey] && (
                    <span className="task-icon"><AssetImage src={taskIconMap[task.iconKey]} alt="" /></span>
                  )}
                  {task.title}
                </label>
                <select value={task.assignee} onChange={(event) => onAssignee(task.id, event.target.value as Assignee)}>
                  <option value="me">나</option>
                  <option value="partner">파트너</option>
                  <option value="none">미지정</option>
                </select>
              </div>
            ))}
          </section>
        ))}
      </div>
      <div className="add-row">
        <input placeholder="직접 할 일 추가" value={newTask} onChange={(event) => onNewTaskChange(event.target.value)} />
        <button onClick={onAddTask}>추가</button>
      </div>
      <button className="primary-button sticky-bottom" disabled={isSaving} onClick={onDone}>{isSaving ? "저장 중..." : `선택완료 (${selectedCount}개)`}</button>
    </div>
  );
}

function HomeScreen({
  nickname,
  selectedEmoji,
  tasks,
  progress,
  completeCount,
  unreadCount,
  onToggle,
  onReact,
  onWriteLetter,
  onAddTask,
  onCloseWeek,
  onNotifications,
  onCastleExplain,
}: {
  nickname: string;
  selectedEmoji: string;
  tasks: AppTask[];
  progress: number;
  completeCount: number;
  unreadCount: number;
  onToggle: (id: string) => void;
  onReact: (id: string) => void;
  onWriteLetter: () => void;
  onAddTask: () => void;
  onCloseWeek: () => void;
  onNotifications: () => void;
  onCastleExplain: () => void;
}) {
  return (
    <div className="stack-screen">
      <div className="home-head">
        <div>
          <span className="eyebrow">우리의 이번 주</span>
          <h2>{nickname}성 공사 중</h2>
        </div>
        <button className="round-button notification-button" aria-label="알림" onClick={onNotifications}>
          <AssetImage src={commonNotification} alt="" />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
      </div>
      <CastleCard progress={progress} completeCount={completeCount} total={tasks.length} onExplain={onCastleExplain} />
      <TaskSection
        title="완료한 일"
        tasks={tasks.filter((task) => task.done)}
        empty="아직 완료한 일이 없어요"
        onToggle={onToggle}
        onReact={onReact}
        onWriteLetter={onWriteLetter}
      />
      <TaskSection
        title="미완료한 일"
        tasks={tasks.filter((task) => !task.done)}
        empty="이번 주 할 일을 모두 끝냈어요"
        onToggle={onToggle}
        onReact={onReact}
        onWriteLetter={onWriteLetter}
      />
      <div className="home-actions">
        <button className="secondary-button" onClick={onAddTask}>할 일 수정</button>
        <button className="primary-button" onClick={onCloseWeek}>이번 주 마무리</button>
      </div>
      <div className="partner-strip">{selectedEmoji} 파트너에게 완료 알림과 인정 요청을 보낼 수 있어요.</div>
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  empty,
  onToggle,
  onReact,
  onWriteLetter,
}: {
  title: string;
  tasks: AppTask[];
  empty: string;
  onToggle: (id: string) => void;
  onReact: (id: string) => void;
  onWriteLetter: () => void;
}) {
  return (
    <section className="task-section">
      <h3>{title} <span>{tasks.length}</span></h3>
      {tasks.length === 0 ? <p className="empty">{empty}</p> : tasks.map((task) => (
        <div className={task.done ? "task-row done" : "task-row"} key={task.id}>
          <label>
            <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} />
            <span>{task.title}</span>
          </label>
          <small>{assigneeLabel[task.assignee]}</small>
          {task.done && (
            <div className="reaction-row">
              <button aria-label="하트 리액션" onClick={() => onReact(task.id)}>
                <AssetImage src={task.reacted ? reactionHeartPink : commonHeartOutline} alt="" />
              </button>
              <button aria-label="편지 쓰기" onClick={onWriteLetter}>
                <AssetImage src={reactionLetter} alt="" />
              </button>
              <button aria-label="칭찬 표시">
                <AssetImage src={reactionStar} alt="" />
              </button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

function CastleCard({
  progress,
  completeCount,
  total,
  onExplain,
}: {
  progress: number;
  completeCount: number;
  total: number;
  onExplain?: () => void;
}) {
  const levelIndex = Math.min(castleLevels.length - 1, Math.max(0, Math.ceil(progress / 10) - 1));
  const castleSrc = castleLevels[levelIndex];

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
  weekly,
  body,
  reaction,
  progress,
  onBodyChange,
  onReactionChange,
  onBack,
  onSend,
}: {
  weekly: boolean;
  body: string;
  reaction: string;
  progress: number;
  onBodyChange: (value: string) => void;
  onReactionChange: (value: string) => void;
  onBack: () => void;
  onSend: () => void;
}) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>×</button>
      <Header
        eyebrow={weekly ? "주간 칭찬" : "편지 쓰기"}
        title={weekly ? "이번 주를 마무리하는 마음을 남겨요" : "파트너에게 마음을 보내요"}
      />
      {weekly && <div className="notice-box">이번 주 성 완공률은 {progress}%예요. 편지를 보내면 다음 주로 넘어갈 수 있어요.</div>}
      <div className="recipient-card">받는 사람 <strong>파트너</strong> <AssetImage src={reactionHeartPink} alt="" /></div>
      <textarea
        className="letter-area"
        maxLength={1000}
        placeholder="고마웠던 마음을 자유롭게 써주세요"
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
      />
      <div className="reaction-picker">
        {reactionOptions.map((item) => (
          <button aria-label={item.label} className={reaction === item.value ? "selected" : ""} key={item.value} onClick={() => onReactionChange(item.value)}>
            <AssetImage src={item.src} alt="" />
          </button>
        ))}
      </div>
      <button className="primary-button sticky-bottom" onClick={onSend}>편지 보내기</button>
    </div>
  );
}

function SentScreen({ onHome }: { onHome: () => void }) {
  return (
    <div className="center-screen">
      <IconBubble src={reactionLetter} alt="편지" />
      <h2>마음이 잘 도착했어요</h2>
      <p>파트너가 오늘의 고마움을 확인할 수 있어요.</p>
      <button className="primary-button" onClick={onHome}>홈으로 돌아가기</button>
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
          <button className="ghost-button" onClick={onCancel}>취소</button>
          <button className="primary-button" onClick={onNext}>다음 주로 넘어가기</button>
        </div>
      </div>
    </div>
  );
}

function StatsScreen({
  progress,
  completeCount,
  totalCount,
  meDone,
  partnerDone,
  choreContribution,
  letterContribution,
  complete,
  weekStreak,
  weeklyLetterStatus,
  onNext,
  isSaving,
}: {
  progress: number;
  completeCount: number;
  totalCount: number;
  meDone: number;
  partnerDone: number;
  choreContribution: number;
  letterContribution: number;
  complete: boolean;
  weekStreak: number;
  weeklyLetterStatus: { meSent: boolean; partnerSent: boolean; bothSent: boolean };
  onNext: () => void;
  isSaving: boolean;
}) {
  return (
    <div className={complete ? "stack-screen stats-screen complete" : "stack-screen stats-screen incomplete"}>
      {complete && weekStreak > 0 && (
        <div className="streak-banner">🔥 {weekStreak}주 연속 완성 중!</div>
      )}
      <Header
        eyebrow="주간 통계"
        title={complete ? "이번 주 성이 완성됐어요!" : "다음 주엔 조금 더 완성해봐요"}
      />
      {complete && <p className="celebration-text">서로의 노력이 모여 성이 한층 더 높아졌어요.</p>}
      <CastleCard progress={progress} completeCount={completeCount} total={totalCount || 1} />
      <div className="contribution-section">
        <h3>이번 주 기여</h3>
        <div className="contribution-row">
          <span>집안일 (최대 80%)</span>
          <strong>{choreContribution}%</strong>
        </div>
        <div className="progress-bar contribution-bar"><span style={{ width: `${(choreContribution / 80) * 100}%` }} /></div>
        <div className="contribution-row">
          <span>주간 편지 (최대 10%)</span>
          <strong>{letterContribution}%</strong>
        </div>
        <div className="progress-bar contribution-bar letter"><span style={{ width: `${(letterContribution / 10) * 100}%` }} /></div>
        <p className="helper-text">
          {weeklyLetterStatus.bothSent
            ? "두 분 모두 주간 편지를 보냈어요."
            : weeklyLetterStatus.meSent
              ? "내 편지는 보냈어요. 파트너 편지를 기다려요."
              : "주간 편지를 보내면 기여도가 올라가요."}
        </p>
      </div>
      <div className="stats-grid">
        <div><strong>{completeCount}</strong><span>완료 항목</span></div>
        <div><strong>{meDone}</strong><span>내 기여</span></div>
        <div><strong>{partnerDone}</strong><span>파트너 기여</span></div>
      </div>
      <button className="primary-button sticky-bottom" disabled={isSaving} onClick={onNext}>
        {isSaving ? "다음 주 준비 중..." : "다음 할 일 설정하러 가기"}
      </button>
    </div>
  );
}

function LettersScreen({
  letters,
  onSelect,
}: {
  letters: AppLetter[];
  onSelect: (letter: AppLetter) => void;
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const letterDays = new Set(
    letters
      .map((letter) => letter.date.match(/\d+/g)?.map(Number))
      .filter((parts): parts is number[] => Boolean(parts && parts.length >= 3))
      .filter(([letterYear, letterMonth]) => letterYear === year && letterMonth === month + 1)
      .map(([, , day]) => day),
  );

  return (
    <div className="stack-screen">
      <Header eyebrow="편지 모아" title="주고받은 마음" />
      <div className="calendar-card">
        <div className="month-title">{year}년 {month + 1}월</div>
        <div className="calendar-grid">
          {Array.from({ length: daysInMonth }, (_, index) => (
            <span className={letterDays.has(index + 1) ? "has-letter" : ""} key={index}>{index + 1}</span>
          ))}
        </div>
      </div>
      {letters.length === 0 ? (
        <EmptyState
          icon={reactionLetter}
          title="아직 주고받은 편지가 없어요"
          description="완료한 집안일에 마음을 보내면 이곳에 차곡차곡 모여요."
        />
      ) : letters.map((letter) => (
        <article className="letter-card clickable" key={letter.id} onClick={() => onSelect(letter)}>
          <span>{letter.from === "me" ? "내가 보낸 편지" : "상대방이 보낸 편지"} · {letter.date}</span>
          <h3>{letter.reaction} {letter.title}</h3>
          <p>{letter.body.slice(0, 80)}{letter.body.length > 80 ? "..." : ""}</p>
        </article>
      ))}
    </div>
  );
}

function LetterDetailScreen({ letter, onBack }: { letter: AppLetter; onBack: () => void }) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header
        eyebrow={letter.from === "me" ? "내가 보낸 편지" : "상대방이 보낸 편지"}
        title={letter.date}
      />
      <article className="letter-detail-card">
        <span className="letter-reaction">{letter.reaction}</span>
        <h3>{letter.title}</h3>
        <p>{letter.body}</p>
      </article>
    </div>
  );
}

function CastleHistoryScreen({
  stats,
  onExplain,
}: {
  stats: AppWeeklyStat[];
  onExplain: () => void;
}) {
  return (
    <div className="stack-screen">
      <Header eyebrow="성 모아" title="매주 쌓은 우리의 기록" />
      <button className="text-button castle-explain-link" onClick={onExplain}>성 완성 규칙 보기</button>
      {stats.length === 0 ? (
        <EmptyState
          icon={castleLevel1}
          title="아직 완성된 주간 기록이 없어요"
          description="이번 주를 마무리하면 성 완공률과 기여 기록이 이곳에 쌓여요."
        />
      ) : (
        <div className="history-grid">
          {stats.map((stat) => (
          <article className={stat.completionRate >= 100 ? "history-card complete" : "history-card"} key={stat.id}>
            <div className="mini-castle"><AssetImage src={castleLevels[Math.min(castleLevels.length - 1, Math.max(0, Math.ceil(stat.completionRate / 10) - 1))]} alt="" /></div>
            <strong>{stat.completionRate}%</strong>
            <span>{stat.weekStart} - {stat.weekEnd}</span>
            <div className="progress-bar"><span style={{ width: `${stat.completionRate}%` }} /></div>
          </article>
          ))}
        </div>
      )}
    </div>
  );
}

function CastleExplainScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header eyebrow="성 완성 가이드" title="성은 어떻게 완성되나요?" />
      <div className="notice-box">
        <p>집안일 완료율이 성의 높이를 결정해요. 이번 주 할 일을 80% 이상 완료하면 성이 한 단계씩 자라요.</p>
        <p>주간 칭찬 편지를 서로 보내면 추가 10% 기여가 더해져요. 꾸준히 함께하면 연속 완성 기록도 쌓여요.</p>
      </div>
      <CastleCard progress={72} completeCount={7} total={10} />
    </div>
  );
}

function MyPageScreen({
  nickname,
  selectedEmoji,
  myCode,
  partnerProfile,
  onEdit,
  onManageTasks,
  onPartnerManage,
  onNotificationSettings,
  onAccountSettings,
}: {
  nickname: string;
  selectedEmoji: string;
  myCode: string;
  partnerProfile: AppPartnerProfile | null;
  onEdit: () => void;
  onManageTasks: () => void;
  onPartnerManage: () => void;
  onNotificationSettings: () => void;
  onAccountSettings: () => void;
}) {
  return (
    <div className="stack-screen">
      <Header eyebrow="마이페이지" title="내 정보와 설정" />
      <div className="profile-card">
        <div className="avatar"><AvatarMark value={selectedEmoji} /></div>
        <div>
          <strong>{nickname}</strong>
          <span>{myCode || "초대 코드 없음"}</span>
          {partnerProfile && <span>파트너: {partnerProfile.nickname}</span>}
        </div>
        <button onClick={onEdit}>수정</button>
      </div>
      <div className="menu-list">
        <button onClick={onManageTasks}>할 일 목록 관리 <span>›</span></button>
        <button onClick={onPartnerManage}>파트너 연결 관리 <span>›</span></button>
        <button onClick={onNotificationSettings}>알림 설정 <span>›</span></button>
        <button onClick={onAccountSettings}>계정 설정 <span>›</span></button>
      </div>
    </div>
  );
}

function ProfileEditScreen({
  nickname,
  selectedEmoji,
  onNicknameChange,
  onEmojiChange,
  onSave,
  onBack,
}: {
  nickname: string;
  selectedEmoji: string;
  onNicknameChange: (value: string) => void;
  onEmojiChange: (value: string) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header eyebrow="프로필 수정" title="내 정보를 바꿔요" />
      <label className="field">
        <span>닉네임</span>
        <input value={nickname} maxLength={10} onChange={(event) => onNicknameChange(event.target.value)} />
      </label>
      <div className="emoji-grid">
        {avatarOptions.map((avatar) => (
          <button
            aria-label={avatar.label}
            className={avatar.id === selectedEmoji ? "emoji-choice selected" : "emoji-choice"}
            key={avatar.id}
            onClick={() => onEmojiChange(avatar.id)}
          >
            <AssetImage src={avatar.src} alt="" />
          </button>
        ))}
      </div>
      <button className="primary-button sticky-bottom" onClick={onSave}>저장하기</button>
    </div>
  );
}

function NotificationsScreen({
  notifications,
  onBack,
  onOpen,
}: {
  notifications: AppNotification[];
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header eyebrow="알림함" title="파트너 소식" />
      {notifications.length === 0 ? (
        <EmptyState
          icon={commonNotification}
          title="새 알림이 없어요"
          description="파트너가 집안일을 완료하면 여기에 알림이 도착해요."
        />
      ) : (
        <div className="notification-list">
          {notifications.map((item) => (
            <article
              className={item.read ? "notification-item read" : "notification-item"}
              key={item.id}
              onClick={() => onOpen(item.id)}
            >
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              <span>{item.date}</span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateManageScreen({
  templates,
  onBack,
  onAdd,
  onEdit,
  onDelete,
}: {
  templates: AppChoreTemplate[];
  onBack: () => void;
  onAdd: () => void;
  onEdit: (template: AppChoreTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const grouped = templates.reduce<Record<string, AppChoreTemplate[]>>((acc, template) => {
    acc[template.category] = [...(acc[template.category] ?? []), template];
    return acc;
  }, {});

  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header eyebrow="할 일 관리" title="자주 하는 집안일 목록" />
      <p className="helper-text">여기서 관리한 목록이 매주 할 일 선택 화면에 반영돼요.</p>
      <div className="template-list">
        {Object.entries(grouped).map(([category, items]) => (
          <section className="category-card" key={category}>
            <div className="category-head">
              <strong>{category}</strong>
              <span>{items.length}개</span>
            </div>
            {items.map((template) => (
              <div className="template-row" key={template.id}>
                <div>
                  {template.iconKey && taskIconMap[template.iconKey] && (
                    <span className="task-icon"><AssetImage src={taskIconMap[template.iconKey]} alt="" /></span>
                  )}
                  {template.title}
                </div>
                <div className="template-actions">
                  <button onClick={() => onEdit(template)}>수정</button>
                  <button onClick={() => onDelete(template.id)}>삭제</button>
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
      <button className="primary-button sticky-bottom" onClick={onAdd}>할 일 추가</button>
    </div>
  );
}

function TemplateEditScreen({
  draft,
  categories,
  isEditing,
  onDraftChange,
  onSave,
  onBack,
}: {
  draft: { title: string; category: string };
  categories: string[];
  isEditing: boolean;
  onDraftChange: (value: { title: string; category: string }) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header eyebrow="할 일 관리" title={isEditing ? "할 일 수정" : "할 일 추가"} />
      <label className="field">
        <span>할 일 이름</span>
        <input
          value={draft.title}
          maxLength={30}
          onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
        />
      </label>
      <label className="field">
        <span>카테고리</span>
        <select
          value={draft.category}
          onChange={(event) => onDraftChange({ ...draft, category: event.target.value })}
        >
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </label>
      <button className="primary-button sticky-bottom" onClick={onSave}>저장하기</button>
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
  const avatar = avatarOptions.find((item) => item.id === value);
  if (!avatar) return <span>{value}</span>;

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
    { screen: "letters", label: "편지", icon: bottomNavCalander },
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
