"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  addChoreReaction,
  AppLetter,
  AppTask,
  AppWeeklyStat,
  createInviteCode,
  defaultTasks,
  ensureCouple,
  ensureCurrentCycle,
  ensureProfile,
  getActiveInviteCode,
  getCurrentCouple,
  getProfile,
  insertLetter,
  insertWeeklyChore,
  isPersistedId,
  loadLetters,
  loadWeeklyStats,
  loadWeeklyChores,
  redeemInviteCode,
  replaceWeeklyChores,
  updateWeeklyChore,
  upsertWeeklyStats,
} from "@/lib/moaseong-db";

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
  | "castle"
  | "mypage";

type Assignee = "me" | "partner" | "none";
type SocialProvider = "kakao" | "google";

const emojis = ["🌷", "🐻", "🐰", "🦊", "🐶", "🐱", "🌙", "⭐", "🍀", "🍑", "🍞", "🧸", "🎀", "☁️", "💜"];

const assigneeLabel: Record<Assignee, string> = {
  me: "내가 할 일",
  partner: "파트너가 할 일",
  none: "미정",
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [nickname, setNickname] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(emojis[0]);
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

  const completeCount = tasks.filter((task) => task.done).length;
  const progress = tasks.length > 0 ? Math.round((completeCount / tasks.length) * 100) : 0;
  const meDone = tasks.filter((task) => task.done && task.assignee === "me").length;
  const partnerDone = tasks.filter((task) => task.done && task.assignee === "partner").length;

  const choreSelectionTasks = tasks.length > 0 ? tasks : defaultTasks;
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
    const [savedTasks, savedLetters, savedStats] = await Promise.all([
      loadWeeklyChores(cycleId),
      loadLetters(userId),
      loadWeeklyStats(coupleId),
    ]);

    setCurrentCycleId(cycleId);
    setTasks(savedTasks);
    setLetters(savedLetters);
    setWeeklyStats(savedStats);

    return savedTasks.length;
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
    if (couple) return loadCycleData(couple.id, userId);
    return 0;
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
      savedTaskCount = await initializeUserData(userId, profileDraft);
    } catch (error) {
      console.warn("Supabase data initialization failed after login.", error);
      setCurrentUserId(userId);
    } finally {
      setScreen(authIntent === "signup" ? "invite" : savedTaskCount > 0 ? "home" : "chores");
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
      window.alert("로그인이 필요해요.");
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

  const handleSocialLogin = async (provider: SocialProvider, mode: "social" | "login") => {
    window.localStorage.setItem("moaseong-auth-intent", mode === "social" ? "signup" : "login");
    const kakaoScopes = "profile_nickname profile_image";

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        ...(provider === "kakao"
          ? {
              scopes: kakaoScopes,
              queryParams: {
                scope: kakaoScopes,
              },
            }
          : {}),
      },
    });

    if (error) {
      window.localStorage.removeItem("moaseong-auth-intent");
      window.alert("로그인에 실패했어요. 다시 시도해 주세요.");
    }
  };

  const handleProfileNext = async () => {
    if (!nickname.trim()) {
      window.alert("닉네임을 입력해 주세요.");
      return;
    }

    if (!agreedToTerms) {
      window.alert("이용약관에 동의해 주세요.");
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
      window.alert(`초대 코드가 생성됐어요: ${code}`);
    } catch {
      window.alert("초대 코드 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateTask = async (id: string, patch: Partial<AppTask>) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));

    const userId = await ensureSignedInUser();
    if (!userId || !isPersistedId(id)) return;

    try {
      await updateWeeklyChore(id, userId, patch);
    } catch {
      window.alert("할 일 저장에 실패했어요. 다시 시도해 주세요.");
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
      window.alert("할 일 추가에 실패했어요. 다시 시도해 주세요.");
    }
  };

  const saveWeeklyChoresAndGoHome = async () => {
    const context = await ensureCoupleAndCycle();
    if (!context) return;

    setIsSaving(true);
    try {
      const savedTasks = await replaceWeeklyChores(context.cycleId, context.userId, choreSelectionTasks);
      setTasks(savedTasks);
      goHome();
    } catch {
      window.alert("이번 주 할 일 저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteNext = async () => {
    const userId = await ensureSignedInUser();
    if (!userId) return;

    setIsSaving(true);
    try {
      await ensureProfile(userId, nickname.trim() || "모아", selectedEmoji);

      if (inviteCode.trim()) {
        const coupleId = await redeemInviteCode(inviteCode.trim());
        const couple = await getCurrentCouple();
        syncCoupleState(userId, couple ?? { id: coupleId, user_a_id: userId, user_b_id: null });
        await loadCycleData(coupleId, userId);
      } else {
        const couple = await ensureCouple(userId);
        syncCoupleState(userId, couple);
        await loadCycleData(couple.id, userId);
      }

      setScreen("chores");
    } catch {
      window.alert("초대 코드 처리에 실패했어요. 코드를 확인해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const sendLetter = async (weekly = false) => {
    const body = letterBody.trim();
    if (!body) {
      window.alert("편지 내용을 입력해 주세요.");
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
      setScreen(weekly ? "stats" : "sent");
    } catch {
      window.alert("편지 전송에 실패했어요. 다시 시도해 주세요.");
    }
  };

  const handleReact = async (id: string) => {
    await updateTask(id, { reacted: true });

    const userId = await ensureSignedInUser();
    if (!userId || !isPersistedId(id)) return;

    try {
      await addChoreReaction(id, userId, "💗");
    } catch {
      window.alert("리액션 저장에 실패했어요. 다시 시도해 주세요.");
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
            onBack={() => setScreen(screen === "social" ? "profile" : "landing")}
            onLogin={(provider) => handleSocialLogin(provider, screen)}
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
            isSaving={isSaving}
          />
        );
      case "chores":
        return (
          <ChoreSelectScreen
            tasks={choreSelectionTasks}
            groupedTasks={groupedTasks}
            newTask={newTask}
            onNewTaskChange={setNewTask}
            onToggle={(id) => setTasks((current) => {
              const baseTasks = current.length > 0 ? current : defaultTasks;
              return baseTasks.map((task) => (task.id === id ? { ...task, selected: !task.selected } : task));
            })}
            onAssignee={(id, assignee) => {
              setTasks((current) => {
                const baseTasks = current.length > 0 ? current : defaultTasks;
                return baseTasks.map((task) => (task.id === id ? { ...task, assignee } : task));
              });
              if (isPersistedId(id)) void updateTask(id, { assignee });
            }}
            onAddTask={addTask}
            onDone={saveWeeklyChoresAndGoHome}
            isSaving={isSaving}
            hasSavedTasks={tasks.length > 0}
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
            meDone={meDone}
            partnerDone={partnerDone}
            onNext={() => setScreen("chores")}
          />
        );
      case "letters":
        return <LettersScreen letters={letters} />;
      case "castle":
        return <CastleHistoryScreen stats={weeklyStats} />;
      case "mypage":
        return (
          <MyPageScreen
            nickname={nickname}
            selectedEmoji={selectedEmoji}
            myCode={myCode}
            onEdit={() => setScreen("profile")}
            onManageTasks={() => setScreen("chores")}
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
            onToggle={(id) => updateTask(id, { done: !tasks.find((task) => task.id === id)?.done })}
            onReact={handleReact}
            onWriteLetter={() => setScreen("letter")}
            onAddTask={() => setScreen("chores")}
            onCloseWeek={() => setScreen("close")}
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
    </main>
  );
}

function AuthLoadingScreen() {
  return (
    <div className="center-screen gradient-bg">
      <div className="logo-orb">🏰</div>
      <h2>모아성</h2>
      <p>로그인 정보를 확인하고 있어요</p>
    </div>
  );
}

function AuthErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="center-screen">
      <div className="logo-orb">⚠️</div>
      <h2>로그인 연결에 실패했어요</h2>
      <p>{message}</p>
      <button className="primary-button" onClick={onRetry}>다시 로그인하기</button>
    </div>
  );
}

function StartScreen({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return (
    <div className="center-screen gradient-bg">
      <div className="logo-orb">🏰</div>
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
        <div className="logo-orb">🏰</div>
        <h2>모아성</h2>
        <p>나를 표현할 이모지를 골라주세요</p>
      </div>
      <label className="field">
        <span>닉네임</span>
        <input value={nickname} maxLength={10} onChange={(event) => onNicknameChange(event.target.value)} />
      </label>
      <div className="emoji-grid">
        {emojis.map((emoji) => (
          <button
            className={emoji === selectedEmoji ? "emoji-choice selected" : "emoji-choice"}
            key={emoji}
            onClick={() => onEmojiChange(emoji)}
          >
            {emoji}
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
  onBack,
  onLogin,
}: {
  mode: "social" | "login";
  onBack: () => void;
  onLogin: (provider: SocialProvider) => void;
}) {
  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>‹</button>
      <Header
        eyebrow={mode === "social" ? "간편 로그인 연동" : "로그인"}
        title={mode === "social" ? "계정을 연결하면 기록이 안전하게 저장돼요" : "다시 만나서 반가워요"}
      />
      <div className="social-card">
        <button className="kakao-button" onClick={() => onLogin("kakao")}>카카오로 계속하기</button>
        <button className="google-button" onClick={() => onLogin("google")}>Google로 계속하기</button>
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
  isSaving,
}: {
  inviteCode: string;
  myCode: string;
  onInviteCodeChange: (value: string) => void;
  onCreateCode: () => void;
  onNext: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="stack-screen">
      <div className="partner-hero">
        <span>{emojis[0]}</span>
        <span>💗</span>
        <span>🐻</span>
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
      <button className="text-button" disabled={isSaving} onClick={onNext}>나중에 연결할게요</button>
    </div>
  );
}

function ChoreSelectScreen({
  tasks,
  groupedTasks,
  newTask,
  onNewTaskChange,
  onToggle,
  onAssignee,
  onAddTask,
  onDone,
  isSaving,
  hasSavedTasks,
}: {
  tasks: AppTask[];
  groupedTasks: Record<string, AppTask[]>;
  newTask: string;
  onNewTaskChange: (value: string) => void;
  onToggle: (id: string) => void;
  onAssignee: (id: string, assignee: Assignee) => void;
  onAddTask: () => void;
  onDone: () => void;
  isSaving: boolean;
  hasSavedTasks: boolean;
}) {
  return (
    <div className="stack-screen">
      <Header eyebrow="이번 주" title="이번 주 할 일을 선택해요" />
      <div className="notice-box">
        {hasSavedTasks ? "저장된 이번 주 항목을 불러왔어요. 필요한 항목만 조정해 주세요." : "자주 하는 집안일을 골라 이번 주 목록을 만들어 보세요."}
      </div>
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
      <button className="primary-button sticky-bottom" disabled={isSaving} onClick={onDone}>{isSaving ? "저장 중..." : `선택완료 (${tasks.filter((task) => task.selected).length}개)`}</button>
    </div>
  );
}

function HomeScreen({
  nickname,
  selectedEmoji,
  tasks,
  progress,
  completeCount,
  onToggle,
  onReact,
  onWriteLetter,
  onAddTask,
  onCloseWeek,
}: {
  nickname: string;
  selectedEmoji: string;
  tasks: AppTask[];
  progress: number;
  completeCount: number;
  onToggle: (id: string) => void;
  onReact: (id: string) => void;
  onWriteLetter: () => void;
  onAddTask: () => void;
  onCloseWeek: () => void;
}) {
  return (
    <div className="stack-screen">
      <div className="home-head">
        <div>
          <span className="eyebrow">우리의 이번 주</span>
          <h2>{nickname}성 공사 중</h2>
        </div>
        <button className="round-button">🔔</button>
      </div>
      <CastleCard progress={progress} completeCount={completeCount} total={tasks.length} />
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
              <button onClick={() => onReact(task.id)}>{task.reacted ? "💗" : "🤍"}</button>
              <button onClick={onWriteLetter}>💌</button>
              <button>⭐</button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

function CastleCard({ progress, completeCount, total }: { progress: number; completeCount: number; total: number }) {
  return (
    <section className="castle-card">
      <div className="castle-visual">
        <div className="castle-ground" />
        <div className="castle-base" style={{ opacity: 0.35 + progress / 160 }} />
        <div className="castle-tower left" />
        <div className="castle-tower right" />
        <div className="castle-flag">🏳️</div>
      </div>
      <div className="progress-info">
        <span>{completeCount}/{total} 완료</span>
        <strong>{progress}%</strong>
      </div>
      <div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>
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
  const reactions = ["💗", "👍", "😍", "🥹", "🌸", "🍀", "☀️", "👏"];

  return (
    <div className="stack-screen">
      <button className="icon-button" onClick={onBack}>×</button>
      <Header
        eyebrow={weekly ? "주간 칭찬" : "편지 쓰기"}
        title={weekly ? "이번 주를 마무리하는 마음을 남겨요" : "파트너에게 마음을 보내요"}
      />
      {weekly && <div className="notice-box">이번 주 성 완공률은 {progress}%예요. 편지를 보내면 다음 주로 넘어갈 수 있어요.</div>}
      <div className="recipient-card">받는 사람 <strong>파트너</strong> 💗</div>
      <textarea
        className="letter-area"
        maxLength={1000}
        placeholder="고마웠던 마음을 자유롭게 써주세요"
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
      />
      <div className="reaction-picker">
        {reactions.map((item) => (
          <button className={reaction === item ? "selected" : ""} key={item} onClick={() => onReactionChange(item)}>{item}</button>
        ))}
      </div>
      <button className="primary-button sticky-bottom" onClick={onSend}>편지 보내기</button>
    </div>
  );
}

function SentScreen({ onHome }: { onHome: () => void }) {
  return (
    <div className="center-screen">
      <div className="logo-orb">💌</div>
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
  meDone,
  partnerDone,
  onNext,
}: {
  progress: number;
  completeCount: number;
  meDone: number;
  partnerDone: number;
  onNext: () => void;
}) {
  return (
    <div className="stack-screen">
      <Header eyebrow="주간 통계" title={progress >= 100 ? "이번 주 성이 완성됐어요" : "다음 주엔 조금 더 완성해봐요"} />
      <CastleCard progress={progress} completeCount={completeCount} total={completeCount || 1} />
      <div className="stats-grid">
        <div><strong>{completeCount}</strong><span>완료 항목</span></div>
        <div><strong>{meDone}</strong><span>내 기여</span></div>
        <div><strong>{partnerDone}</strong><span>파트너 기여</span></div>
      </div>
      <button className="primary-button sticky-bottom" onClick={onNext}>다음 할 일 설정하러 가기</button>
    </div>
  );
}

function LettersScreen({ letters }: { letters: AppLetter[] }) {
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
          icon="💌"
          title="아직 주고받은 편지가 없어요"
          description="완료한 집안일에 마음을 보내면 이곳에 차곡차곡 모여요."
        />
      ) : letters.map((letter) => (
        <article className="letter-card" key={letter.id}>
          <span>{letter.from === "me" ? "내가 보낸 편지" : "상대방이 보낸 편지"} · {letter.date}</span>
          <h3>{letter.reaction} {letter.title}</h3>
          <p>{letter.body}</p>
        </article>
      ))}
    </div>
  );
}

function CastleHistoryScreen({ stats }: { stats: AppWeeklyStat[] }) {
  return (
    <div className="stack-screen">
      <Header eyebrow="성 모아" title="매주 쌓은 우리의 기록" />
      {stats.length === 0 ? (
        <EmptyState
          icon="🏰"
          title="아직 완성된 주간 기록이 없어요"
          description="이번 주를 마무리하면 성 완공률과 기여 기록이 이곳에 쌓여요."
        />
      ) : (
        <div className="history-grid">
          {stats.map((stat) => (
          <article className={stat.completionRate >= 100 ? "history-card complete" : "history-card"} key={stat.id}>
            <div className="mini-castle">🏰</div>
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

function MyPageScreen({
  nickname,
  selectedEmoji,
  myCode,
  onEdit,
  onManageTasks,
}: {
  nickname: string;
  selectedEmoji: string;
  myCode: string;
  onEdit: () => void;
  onManageTasks: () => void;
}) {
  return (
    <div className="stack-screen">
      <Header eyebrow="마이페이지" title="내 정보와 설정" />
      <div className="profile-card">
        <div className="avatar">{selectedEmoji}</div>
        <div>
          <strong>{nickname}</strong>
          <span>{myCode || "초대 코드 없음"}</span>
        </div>
        <button onClick={onEdit}>수정</button>
      </div>
      <div className="menu-list">
        <button onClick={onManageTasks}>할 일 목록 관리 <span>›</span></button>
        <button>파트너 연결 관리 <span>›</span></button>
        <button>알림 설정 <span>›</span></button>
        <button>계정 설정 <span>›</span></button>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="empty-state">
      <div>{icon}</div>
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
  const items: { screen: Screen; label: string; icon: string }[] = [
    { screen: "home", label: "홈", icon: "🏠" },
    { screen: "letters", label: "편지", icon: "💌" },
    { screen: "castle", label: "성", icon: "🏰" },
    { screen: "mypage", label: "마이페이지", icon: "👤" },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          className={current === item.screen ? "active" : ""}
          key={item.screen}
          onClick={() => onChange(item.screen)}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
