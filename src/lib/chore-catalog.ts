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

export const categoryCatalog = [
  { category: "청소", iconKey: "sweep" as TaskIconKey, title: "바닥·분리수거 청소" },
  { category: "주방", iconKey: "cooking" as TaskIconKey, title: "설거지·싱크대 정리" },
  { category: "빨래", iconKey: "laundry" as TaskIconKey, title: "빨래·건조·개기" },
  { category: "장보기", iconKey: "shopping-cart" as TaskIconKey, title: "장보기·냉장고 채우기" },
  { category: "육아", iconKey: "baby-bottle" as TaskIconKey, title: "아이 케어·등원 준비" },
  { category: "식물·반려", iconKey: "plant" as TaskIconKey, title: "식물·반려동물 돌보기" },
  { category: "정리정돈", iconKey: "package" as TaskIconKey, title: "택배·짐 정리" },
  { category: "욕실", iconKey: "toothbrush" as TaskIconKey, title: "욕실·화장실 청소" },
  { category: "가계", iconKey: "money" as TaskIconKey, title: "공과금·가계 체크" },
  { category: "기타", iconKey: "note" as TaskIconKey, title: "메모·기타 집안일" },
];

export function buildCatalogTasks() {
  return categoryCatalog.map((item, index) => ({
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
