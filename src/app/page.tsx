"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  addChoreReaction,
  AppLetter,
  AppTask,
  createInviteCode,
  defaultTasks,
  ensureCouple,
  ensureCurrentCycle,
  ensureProfile,
  getCurrentCouple,
  getProfile,
  insertLetter,
  insertWeeklyChore,
  isPersistedId,
  loadLetters,
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

const suggestedTasks = ["설거지", "빨래 널기", "냉장고 정리", "음식물 쓰레기 버리기"];

const assigneeLabel: Record<Assignee, string> = {
  me: "내가 할 일",
  partner: "파트너가 할 일",
  none: "미정",
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [nickname, setNickname] = useState("모아");
  const [selectedEmoji, setSelectedEmoji] = useState(emojis[0]);
  const [inviteCode, setInviteCode] = useState("");
  const [myCode, setMyCode] = useState("");
  const [tasks, setTasks] = useState<AppTask[]>(defaultTasks);
  const [newTask, setNewTask] = useState("");
  const [letterBody, setLetterBody] = useState("");
  const [reaction, setReaction] = useState("💗");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentCoupleId, setCurrentCoupleId] = useState<string | null>(null);
  const [currentCycleId, setCurrentCycleId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [letters, setLetters] = useState<AppLetter[]>([
    {
      id: "sample-letter-1",
      from: "partner",
      title: "고마워",
      body: "오늘 청소 끝내줘서 정말 든든했어. 덕분에 저녁 시간이 훨씬 편해졌어.",
      date: "2026.07.08",
      reaction: "💗",
    },
    {
      id: "sample-letter-2",
      from: "me",
      title: "최고야",
      body: "이번 주 장보기 맡아줘서 고마워. 작은 일들이 쌓여서 집이 완성되는 느낌이야.",
      date: "2026.07.07",
      reaction: "👍",
    },
  ]);

  const completeCount = tasks.filter((task) => task.done).length;
  const progress = Math.round((completeCount / tasks.length) * 100);
  const meDone = tasks.filter((task) => task.done && task.assignee === "me").length;
  const partnerDone = tasks.filter((task) => task.done && task.assignee === "partner").length;

  const groupedTasks = useMemo(() => {
    return tasks.reduce<Record<string, AppTask[]>>((acc, task) => {
      acc[task.category] = [...(acc[task.category] ?? []), task];
      return acc;
    }, {});
  }, [tasks]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;

      const authIntent = window.localStorage.getItem("moaseong-auth-intent");
      const profileDraft = getProfileDraft();
      window.localStorage.removeItem("moaseong-auth-intent");
      window.localStorage.removeItem("moaseong-profile-draft");

      await initializeUserData(data.session.user.id, profileDraft);
      setScreen(authIntent === "signup" ? "invite" : "home");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSessionUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  };

  const getProfileDraft = () => {
    const fallback = { nickname, avatarEmoji: selectedEmoji };
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
    const [savedTasks, savedLetters] = await Promise.all([loadWeeklyChores(cycleId), loadLetters(userId)]);

    setCurrentCycleId(cycleId);
    setTasks(savedTasks.length > 0 ? savedTasks : defaultTasks);
    if (savedLetters.length > 0) setLetters(savedLetters);
  };

  const initializeUserData = async (userId: string, profileDraft?: { nickname: string; avatarEmoji: string }) => {
    setCurrentUserId(userId);

    const existingProfile = await getProfile(userId);
    if (existingProfile) {
      setNickname(existingProfile.nickname);
      setSelectedEmoji(existingProfile.avatar_emoji);
    } else {
      await ensureProfile(userId, profileDraft?.nickname ?? nickname, profileDraft?.avatarEmoji ?? selectedEmoji);
    }

    const couple = await getCurrentCouple();
    syncCoupleState(userId, couple);
    if (couple) await loadCycleData(couple.id, userId);
  };

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

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        scopes: provider === "kakao" ? "profile_nickname" : undefined,
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
      const savedTasks = await replaceWeeklyChores(context.cycleId, context.userId, tasks);
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
            tasks={tasks}
            groupedTasks={groupedTasks}
            newTask={newTask}
            onNewTaskChange={setNewTask}
            onToggle={(id) => updateTask(id, { done: !tasks.find((task) => task.id === id)?.done })}
            onAssignee={(id, assignee) => updateTask(id, { assignee })}
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
            meDone={meDone}
            partnerDone={partnerDone}
            onNext={() => setScreen("chores")}
          />
        );
      case "letters":
        return <LettersScreen letters={letters} />;
      case "castle":
        return <CastleHistoryScreen progress={progress} />;
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
        <div className={showNav ? "screen with-nav" : "screen"}>{renderScreen()}</div>
        {showNav && <BottomNav current={screen} onChange={setScreen} />}
      </section>
    </main>
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
  onNext,
}: {
  nickname: string;
  selectedEmoji: string;
  onNicknameChange: (value: string) => void;
  onEmojiChange: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="stack-screen">
      <Header eyebrow="회원가입" title="나를 표현해 주세요" />
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
        <input type="checkbox" defaultChecked />
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
      <p className="helper-text">소셜 로그인은 Supabase Auth와 연결됩니다. 카카오/구글 provider 설정이 완료되어야 정상 동작합니다.</p>
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
}) {
  return (
    <div className="stack-screen">
      <Header eyebrow="이번 주" title="이번 주 할 일을 선택해요" />
      <div className="notice-box">지난 주 선택 항목을 불러왔어요. 필요한 항목만 조정해 주세요.</div>
      <div className="category-list">
        {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
          <section className="category-card" key={category}>
            <div className="category-head">
              <strong>{category}</strong>
              <span>{categoryTasks.filter((task) => task.done).length}개 선택</span>
            </div>
            {categoryTasks.map((task) => (
              <div className="task-edit-row" key={task.id}>
                <label>
                  <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} />
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
      <div className="chip-row">
        {suggestedTasks.map((task) => <span key={task}>{task}</span>)}
      </div>
      <button className="primary-button sticky-bottom" disabled={isSaving} onClick={onDone}>{isSaving ? "저장 중..." : `선택완료 (${tasks.length}개)`}</button>
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
      <div className="recipient-card">받는 사람 <strong>곰돌이</strong> 💗</div>
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
  return (
    <div className="stack-screen">
      <Header eyebrow="편지 모아" title="주고받은 마음" />
      <div className="calendar-card">
        <div className="month-title">2026년 7월</div>
        <div className="calendar-grid">
          {Array.from({ length: 31 }, (_, index) => (
            <span className={[5, 7, 8, 15].includes(index + 1) ? "has-letter" : ""} key={index}>{index + 1}</span>
          ))}
        </div>
      </div>
      {letters.map((letter) => (
        <article className="letter-card" key={letter.id}>
          <span>{letter.from === "me" ? "내가 보낸 편지" : "상대방이 보낸 편지"} · {letter.date}</span>
          <h3>{letter.reaction} {letter.title}</h3>
          <p>{letter.body}</p>
        </article>
      ))}
    </div>
  );
}

function CastleHistoryScreen({ progress }: { progress: number }) {
  const weeks = [100, 80, 90, progress, 70, 100];

  return (
    <div className="stack-screen">
      <Header eyebrow="성 모아" title="매주 쌓은 우리의 기록" />
      <div className="history-grid">
        {weeks.map((value, index) => (
          <article className={value >= 100 ? "history-card complete" : "history-card"} key={`${value}-${index}`}>
            <div className="mini-castle">🏰</div>
            <strong>{value}%</strong>
            <span>2026.06.{10 + index * 7} - 06.{16 + index * 7}</span>
            <div className="progress-bar"><span style={{ width: `${value}%` }} /></div>
          </article>
        ))}
      </div>
      <p className="helper-text">기록을 누르면 주간 통계 상세를 볼 수 있어요.</p>
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
