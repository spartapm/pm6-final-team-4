import { createClient, type SupportedStorage } from "@supabase/supabase-js";

const supabaseUrl = "https://tepjmaehpbyghqcsmwur.supabase.co";
const supabasePublishableKey = "sb_publishable_T7A5YYkE2pp9fiX_Y385Tw_4V-dQPf_";

/** 브라우저를 닫으면 로그인 세션이 사라지도록 sessionStorage 사용 */
function createAuthStorage(): SupportedStorage {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  // 예전에 localStorage에 남아 있던 Supabase 세션 제거 (브라우저 재실행 시 자동 로그인 방지)
  try {
    const staleKeys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && (key.startsWith("sb-") || key.includes("supabase.auth"))) {
        staleKeys.push(key);
      }
    }
    staleKeys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // storage 접근 실패는 무시
  }

  return window.sessionStorage;
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: createAuthStorage(),
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "implicit",
    persistSession: true,
  },
});
