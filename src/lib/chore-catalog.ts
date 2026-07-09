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

export const categoryMeta = [
  { category: "청소", iconKey: "sweep" as TaskIconKey },
  { category: "주방", iconKey: "cooking" as TaskIconKey },
  { category: "빨래", iconKey: "laundry" as TaskIconKey },
  { category: "장보기", iconKey: "shopping-cart" as TaskIconKey },
  { category: "육아", iconKey: "baby-bottle" as TaskIconKey },
  { category: "식물·반려", iconKey: "plant" as TaskIconKey },
  { category: "정리정돈", iconKey: "package" as TaskIconKey },
  { category: "욕실", iconKey: "toothbrush" as TaskIconKey },
  { category: "가계", iconKey: "money" as TaskIconKey },
  { category: "기타", iconKey: "note" as TaskIconKey },
];

/** @deprecated use categoryMeta — kept for template edit category list */
export const categoryCatalog = categoryMeta.map((item) => ({
  ...item,
  title: item.category,
}));

const catalogItems: { category: string; iconKey: TaskIconKey; title: string }[] = [
  { category: "청소", iconKey: "sweep", title: "바닥 청소" },
  { category: "청소", iconKey: "sweep", title: "분리수거" },
  { category: "청소", iconKey: "sweep", title: "먼지 털기" },
  { category: "청소", iconKey: "sweep", title: "창문·베란다 청소" },
  { category: "청소", iconKey: "sweep", title: "청소기 돌리기" },
  { category: "청소", iconKey: "sweep", title: "쓰레기 비우기" },
  { category: "주방", iconKey: "cooking", title: "설거지" },
  { category: "주방", iconKey: "cooking", title: "싱크대 정리" },
  { category: "주방", iconKey: "cooking", title: "가스레인지 닦기" },
  { category: "주방", iconKey: "cooking", title: "냉장고 정리" },
  { category: "빨래", iconKey: "laundry", title: "빨래 돌리기" },
  { category: "빨래", iconKey: "laundry", title: "빨래 널기" },
  { category: "빨래", iconKey: "laundry", title: "빨래 개기" },
  { category: "빨래", iconKey: "laundry", title: "이불 빨래" },
  { category: "장보기", iconKey: "shopping-cart", title: "장보기" },
  { category: "장보기", iconKey: "shopping-cart", title: "생필품 구매" },
  { category: "장보기", iconKey: "shopping-cart", title: "온라인 주문" },
  { category: "육아", iconKey: "baby-bottle", title: "아이 케어" },
  { category: "육아", iconKey: "baby-bottle", title: "등원·하원 준비" },
  { category: "육아", iconKey: "baby-bottle", title: "장난감 정리" },
  { category: "식물·반려", iconKey: "plant", title: "식물 물주기" },
  { category: "식물·반려", iconKey: "plant", title: "반려동물 돌보기" },
  { category: "정리정돈", iconKey: "package", title: "택배 정리" },
  { category: "정리정돈", iconKey: "package", title: "옷장 정리" },
  { category: "정리정돈", iconKey: "package", title: "책상 정리" },
  { category: "욕실", iconKey: "toothbrush", title: "욕실 청소" },
  { category: "욕실", iconKey: "toothbrush", title: "화장실 청소" },
  { category: "욕실", iconKey: "toothbrush", title: "수건 교체" },
  { category: "가계", iconKey: "money", title: "공과금 체크" },
  { category: "가계", iconKey: "money", title: "가계부 정리" },
  { category: "기타", iconKey: "note", title: "기타 집안일" },
];

export function iconKeyForCategory(category: string): TaskIconKey {
  return categoryMeta.find((item) => item.category === category)?.iconKey ?? "etc";
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
