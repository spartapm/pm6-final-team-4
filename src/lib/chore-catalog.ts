import type { StaticImageData } from "next/image";
import taskBabyBottle from "../../icons/task-baby-bottle.svg";
import taskCooking from "../../icons/task-cooking.svg";
import taskEtc from "../../icons/task-etc.svg";
import taskLaundry from "../../icons/task-laundry.svg";
import taskMoney from "../../icons/task-money.svg";
import taskNote from "../../icons/task-note.svg";
import taskPackage from "../../icons/task-package.svg";
import taskPlant from "../../icons/task-plant.svg";
import taskShoppingCart from "../../icons/task-shopping-cart.svg";
import taskSweep from "../../icons/task-sweep.svg";
import taskToothbrush from "../../icons/task-toothbrush.svg";

export type TaskIconKey =
  | "sweep"
  | "cooking"
  | "laundry"
  | "shopping-cart"
  | "baby-bottle"
  | "plant"
  | "package"
  | "toothbrush"
  | "money"
  | "note"
  | "etc";

export const taskIconMap: Record<TaskIconKey, StaticImageData | string> = {
  sweep: taskSweep,
  cooking: taskCooking,
  laundry: taskLaundry,
  "shopping-cart": taskShoppingCart,
  "baby-bottle": taskBabyBottle,
  plant: taskPlant,
  package: taskPackage,
  toothbrush: taskToothbrush,
  money: taskMoney,
  note: taskNote,
  etc: taskEtc,
};

/** 카테고리 메타 — 추후 DB(icon_path 포함)로 이전 가능하도록 단일 소스로 관리 */
export const categoryMeta = [
  { category: "청소", iconKey: "sweep" as TaskIconKey, iconPath: "icons/task-sweep.svg" },
  { category: "정리정돈", iconKey: "package" as TaskIconKey, iconPath: "icons/task-package.svg" },
  { category: "요리·식사", iconKey: "cooking" as TaskIconKey, iconPath: "icons/task-cooking.svg" },
  { category: "세탁", iconKey: "laundry" as TaskIconKey, iconPath: "icons/task-laundry.svg" },
  { category: "유지보수", iconKey: "toothbrush" as TaskIconKey, iconPath: "icons/task-toothbrush.svg" },
  { category: "구매·재고", iconKey: "shopping-cart" as TaskIconKey, iconPath: "icons/task-shopping-cart.svg" },
  { category: "일정·정보", iconKey: "note" as TaskIconKey, iconPath: "icons/task-note.svg" },
  { category: "재정·행정", iconKey: "money" as TaskIconKey, iconPath: "icons/task-money.svg" },
  { category: "기타", iconKey: "etc" as TaskIconKey, iconPath: "icons/task-etc.svg" },
  { category: "반려동물·식물", iconKey: "plant" as TaskIconKey, iconPath: "icons/task-plant.svg" },
  { category: "육아", iconKey: "baby-bottle" as TaskIconKey, iconPath: "icons/task-baby-bottle.svg" },
];

/** @deprecated use categoryMeta — kept for template edit category list */
export const categoryCatalog = categoryMeta.map((item) => ({
  ...item,
  title: item.category,
}));

const legacyCategoryMap: Record<string, string> = {
  주방: "요리·식사",
  빨래: "세탁",
  장보기: "구매·재고",
  "식물·반려": "반려동물·식물",
  욕실: "유지보수",
  가계: "재정·행정",
};

/** 기본 할 일 템플릿 (A-06 / 템플릿 관리 default) */
const catalogItems: { category: string; iconKey: TaskIconKey; title: string }[] = [
  { category: "청소", iconKey: "sweep", title: "바닥 청소하기" },
  { category: "청소", iconKey: "sweep", title: "화장실 청소하기" },
  { category: "청소", iconKey: "sweep", title: "설거지하기" },
  { category: "청소", iconKey: "sweep", title: "분리수거하기" },
  { category: "청소", iconKey: "sweep", title: "싱크대 청소하기" },

  { category: "정리정돈", iconKey: "package", title: "침구 정리하기" },
  { category: "정리정돈", iconKey: "package", title: "현관 정리하기" },
  { category: "정리정돈", iconKey: "package", title: "옷장·서랍 정리하기" },
  { category: "정리정돈", iconKey: "package", title: "테이블 위 정리하기" },
  { category: "정리정돈", iconKey: "package", title: "안 쓰는 물건 비우기" },

  { category: "요리·식사", iconKey: "cooking", title: "식재료 다듬기" },
  { category: "요리·식사", iconKey: "cooking", title: "식사 요리하기" },
  { category: "요리·식사", iconKey: "cooking", title: "저녁 식재료 준비하기" },
  { category: "요리·식사", iconKey: "cooking", title: "도시락 싸기" },
  { category: "요리·식사", iconKey: "cooking", title: "식기 정리하기" },

  { category: "세탁", iconKey: "laundry", title: "흰옷 빨래 돌리기" },
  { category: "세탁", iconKey: "laundry", title: "건조기 돌리기" },
  { category: "세탁", iconKey: "laundry", title: "빨래 개서 정리하기" },
  { category: "세탁", iconKey: "laundry", title: "이불 빨래 돌리기" },
  { category: "세탁", iconKey: "laundry", title: "수건 빨래 돌리기" },

  { category: "유지보수", iconKey: "toothbrush", title: "에어컨 필터 청소하기" },
  { category: "유지보수", iconKey: "toothbrush", title: "배수구 청소하기" },
  { category: "유지보수", iconKey: "toothbrush", title: "방충망 점검하기" },
  { category: "유지보수", iconKey: "toothbrush", title: "실리콘 곰팡이 점검하기" },
  { category: "유지보수", iconKey: "toothbrush", title: "소모품 교체 시기 확인하기" },

  { category: "구매·재고", iconKey: "shopping-cart", title: "휴지 재고 확인하기" },
  { category: "구매·재고", iconKey: "shopping-cart", title: "식재료 재고 확인하기" },
  { category: "구매·재고", iconKey: "shopping-cart", title: "장보기 목록 주문하기" },
  { category: "구매·재고", iconKey: "shopping-cart", title: "세제 재고 확인하기" },
  { category: "구매·재고", iconKey: "shopping-cart", title: "예산 내 소비 점검하기" },

  { category: "일정·정보", iconKey: "note", title: "오늘의 집안일 정하기" },
  { category: "일정·정보", iconKey: "note", title: "이번 주 할 일 점검하기" },
  { category: "일정·정보", iconKey: "note", title: "가족·파트너 일정 공유하기" },
  { category: "일정·정보", iconKey: "note", title: "병원·약속 예약 확인하기" },
  { category: "일정·정보", iconKey: "note", title: "각종 서류 정리하기" },

  { category: "재정·행정", iconKey: "money", title: "공과금 납부하기" },
  { category: "재정·행정", iconKey: "money", title: "관리비 확인하기" },
  { category: "재정·행정", iconKey: "money", title: "가계부 작성하기" },
  { category: "재정·행정", iconKey: "money", title: "정기 구독 서비스 점검하기" },
  { category: "재정·행정", iconKey: "money", title: "보험·계약 갱신일 확인하기" },

  { category: "기타", iconKey: "etc", title: "차량 관리하기" },
  { category: "기타", iconKey: "etc", title: "집들이 준비하기" },

  { category: "반려동물·식물", iconKey: "plant", title: "물 챙겨주기" },
  { category: "반려동물·식물", iconKey: "plant", title: "사료 챙겨주기" },
  { category: "반려동물·식물", iconKey: "plant", title: "용품 청소하기" },
  { category: "반려동물·식물", iconKey: "plant", title: "산책 시키기" },
  { category: "반려동물·식물", iconKey: "plant", title: "식물 물 주기" },

  { category: "육아", iconKey: "baby-bottle", title: "이유식 만들기" },
  { category: "육아", iconKey: "baby-bottle", title: "젖병 소독하기" },
  { category: "육아", iconKey: "baby-bottle", title: "식기 소독하기" },
  { category: "육아", iconKey: "baby-bottle", title: "예방접종 일정 확인하기" },
  { category: "육아", iconKey: "baby-bottle", title: "목욕 시키기" },
];

export function normalizeCategory(category: string) {
  return legacyCategoryMap[category] ?? category;
}

export function iconKeyForCategory(category: string): TaskIconKey {
  const normalized = normalizeCategory(category);
  return categoryMeta.find((item) => item.category === normalized)?.iconKey ?? "etc";
}

export function catalogTitlesForCategory(category: string) {
  const normalized = normalizeCategory(category);
  return catalogItems
    .filter((item) => item.category === normalized)
    .map((item) => item.title);
}

export function buildCatalogTasks() {
  return catalogItems.map((item, index) => ({
    id: `catalog-${index + 1}`,
    title: item.title,
    category: item.category,
    iconKey: item.iconKey,
    assignee: "none" as const,
    selected: false,
    done: false,
    reacted: false,
  }));
}

export function formatWeekRangeLabel(weekStart: string, weekEnd: string) {
  if (!weekStart || !weekEnd) return "";
  const start = weekStart.replace(/-/g, ".");
  const endDay = weekEnd.slice(8);
  return `${start}~${endDay}`;
}

export function formatReportWeekRange(weekStart: string, weekEnd: string) {
  if (!weekStart || !weekEnd) return "";
  const start = weekStart.replace(/-/g, ".");
  const endDay = weekEnd.slice(8);
  return `${start} - ${endDay}`;
}

export function formatHomeWeekRange(weekStart: string, weekEnd: string) {
  if (!weekStart || !weekEnd) return "";
  const start = weekStart.slice(5).replace("-", "/").replace(/^0/, "").replace("/0", "/");
  const end = weekEnd.slice(5).replace("-", "/").replace(/^0/, "").replace("/0", "/");
  return `${start} - ${end}`;
}
