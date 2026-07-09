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
  { category: "세탁", iconKey: "laundry" as TaskIconKey, iconPath: "icons/task-laundry.svg" },
  { category: "요리·식사", iconKey: "cooking" as TaskIconKey, iconPath: "icons/task-cooking.svg" },
  { category: "정리정돈", iconKey: "package" as TaskIconKey, iconPath: "icons/task-package.svg" },
  { category: "구매·재고", iconKey: "shopping-cart" as TaskIconKey, iconPath: "icons/task-shopping-cart.svg" },
  { category: "유지보수", iconKey: "toothbrush" as TaskIconKey, iconPath: "icons/task-toothbrush.svg" },
  { category: "재정·행정", iconKey: "money" as TaskIconKey, iconPath: "icons/task-money.svg" },
  { category: "반려동물·식물", iconKey: "plant" as TaskIconKey, iconPath: "icons/task-plant.svg" },
  { category: "육아", iconKey: "baby-bottle" as TaskIconKey, iconPath: "icons/task-baby-bottle.svg" },
  { category: "일정·정보", iconKey: "note" as TaskIconKey, iconPath: "icons/task-note.svg" },
  { category: "기타", iconKey: "etc" as TaskIconKey, iconPath: "icons/task-etc.svg" },
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

const catalogItems: { category: string; iconKey: TaskIconKey; title: string }[] = [
  { category: "청소", iconKey: "sweep", title: "거실 청소" },
  { category: "청소", iconKey: "sweep", title: "화장실 청소" },
  { category: "청소", iconKey: "sweep", title: "마루 청소" },
  { category: "청소", iconKey: "sweep", title: "바닥 청소" },
  { category: "청소", iconKey: "sweep", title: "분리수거" },
  { category: "청소", iconKey: "sweep", title: "먼지 털기" },
  { category: "청소", iconKey: "sweep", title: "창문·베란다 청소" },
  { category: "청소", iconKey: "sweep", title: "청소기 돌리기" },
  { category: "청소", iconKey: "sweep", title: "쓰레기 비우기" },
  { category: "세탁", iconKey: "laundry", title: "빨래 돌리기" },
  { category: "세탁", iconKey: "laundry", title: "빨래 널기" },
  { category: "세탁", iconKey: "laundry", title: "빨래 개기" },
  { category: "세탁", iconKey: "laundry", title: "이불 빨래" },
  { category: "세탁", iconKey: "laundry", title: "빨래 분류 및 세탁" },
  { category: "요리·식사", iconKey: "cooking", title: "설거지" },
  { category: "요리·식사", iconKey: "cooking", title: "요리하기" },
  { category: "요리·식사", iconKey: "cooking", title: "싱크대 정리" },
  { category: "요리·식사", iconKey: "cooking", title: "가스레인지 닦기" },
  { category: "요리·식사", iconKey: "cooking", title: "냉장고 정리" },
  { category: "정리정돈", iconKey: "package", title: "주방 청소" },
  { category: "정리정돈", iconKey: "package", title: "방 청소" },
  { category: "정리정돈", iconKey: "package", title: "택배 정리" },
  { category: "정리정돈", iconKey: "package", title: "옷장 정리" },
  { category: "정리정돈", iconKey: "package", title: "책상 정리" },
  { category: "구매·재고", iconKey: "shopping-cart", title: "장보기" },
  { category: "구매·재고", iconKey: "shopping-cart", title: "생필품 구매" },
  { category: "구매·재고", iconKey: "shopping-cart", title: "온라인 주문" },
  { category: "유지보수", iconKey: "toothbrush", title: "욕실 청소" },
  { category: "유지보수", iconKey: "toothbrush", title: "수건 교체" },
  { category: "유지보수", iconKey: "toothbrush", title: "현관 청소" },
  { category: "재정·행정", iconKey: "money", title: "공과금 체크" },
  { category: "재정·행정", iconKey: "money", title: "가계부 정리" },
  { category: "반려동물·식물", iconKey: "plant", title: "식물 물주기" },
  { category: "반려동물·식물", iconKey: "plant", title: "화분 물주기" },
  { category: "반려동물·식물", iconKey: "plant", title: "반려동물 돌보기" },
  { category: "육아", iconKey: "baby-bottle", title: "아이 케어" },
  { category: "육아", iconKey: "baby-bottle", title: "등원·하원 준비" },
  { category: "육아", iconKey: "baby-bottle", title: "장난감 정리" },
  { category: "일정·정보", iconKey: "note", title: "일정 확인" },
  { category: "일정·정보", iconKey: "note", title: "예약 관리" },
  { category: "기타", iconKey: "etc", title: "기타 집안일" },
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
