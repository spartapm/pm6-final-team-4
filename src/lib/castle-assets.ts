import type { StaticImageData } from "next/image";

import moaseong1 from "../../castle_image/week1/1.svg";
import moaseong2 from "../../castle_image/week1/2.svg";
import moaseong3 from "../../castle_image/week1/3.svg";
import moaseong4 from "../../castle_image/week1/4.svg";
import moaseong5 from "../../castle_image/week1/5.svg";
import moaseong6 from "../../castle_image/week1/6.svg";
import moaseong7 from "../../castle_image/week1/7.svg";
import moaseong8 from "../../castle_image/week1/8.svg";
import moaseong9 from "../../castle_image/week1/9.svg";
import moaseong10 from "../../castle_image/week1/10.svg";

import forest1 from "../../castle_image/week2/1.svg";
import forest2 from "../../castle_image/week2/2.svg";
import forest3 from "../../castle_image/week2/3.svg";
import forest4 from "../../castle_image/week2/4.svg";
import forest5 from "../../castle_image/week2/5.svg";
import forest6 from "../../castle_image/week2/6.svg";
import forest7 from "../../castle_image/week2/7.svg";
import forest8 from "../../castle_image/week2/8.svg";
import forest9 from "../../castle_image/week2/9.svg";
import forest10 from "../../castle_image/week2/10.svg";

export type CastleAsset = StaticImageData | string;

export type CastleThemeId = "moaseong" | "forest";

export type CastleTheme = {
  id: CastleThemeId;
  name: string;
  levels: CastleAsset[];
};

/** 1주차 테마: 모아성 */
export const CASTLE_THEME_MOASEONG: CastleTheme = {
  id: "moaseong",
  name: "모아성",
  levels: [
    moaseong1,
    moaseong2,
    moaseong3,
    moaseong4,
    moaseong5,
    moaseong6,
    moaseong7,
    moaseong8,
    moaseong9,
    moaseong10,
  ],
};

/** 2주차 테마: 숲의 왕국 — 주기 마감 후 이전 주기와 다른 이미지 */
export const CASTLE_THEME_FOREST: CastleTheme = {
  id: "forest",
  name: "숲의 왕국",
  levels: [
    forest1,
    forest2,
    forest3,
    forest4,
    forest5,
    forest6,
    forest7,
    forest8,
    forest9,
    forest10,
  ],
};

const CASTLE_THEMES = [CASTLE_THEME_MOASEONG, CASTLE_THEME_FOREST] as const;

/** 기본(가이드/폴백) — 1주차 모아성 */
export const castleLevels = CASTLE_THEME_MOASEONG.levels;
export const castleLevel1 = CASTLE_THEME_MOASEONG.levels[0];
export const castleLevel10 = CASTLE_THEME_MOASEONG.levels[9];

export function castleStageFromRate(rate: number) {
  return Math.min(10, Math.max(1, Math.floor(rate / 10) || 1));
}

/**
 * week_start(월요일) 기준으로 주 테마를 교차 배정.
 * 연속된 주는 서로 다른 성 이미지 세트를 사용한다.
 */
export function castleThemeForWeek(weekStart?: string | null): CastleTheme {
  if (!weekStart) return CASTLE_THEME_MOASEONG;
  const start = new Date(`${weekStart}T00:00:00`);
  if (Number.isNaN(start.getTime())) return CASTLE_THEME_MOASEONG;
  // 1970-01-05 = Monday
  const epoch = new Date("1970-01-05T00:00:00");
  const weeks = Math.floor((start.getTime() - epoch.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const index = ((weeks % CASTLE_THEMES.length) + CASTLE_THEMES.length) % CASTLE_THEMES.length;
  return CASTLE_THEMES[index];
}

export function castleLevelsForWeek(weekStart?: string | null): CastleAsset[] {
  return castleThemeForWeek(weekStart).levels;
}

export function castleSrcForWeek(
  weekStart: string | null | undefined,
  completionRateOrStage: number,
  options?: { asStage?: boolean },
): CastleAsset {
  const levels = castleLevelsForWeek(weekStart);
  const stage = options?.asStage
    ? Math.min(10, Math.max(1, completionRateOrStage || 1))
    : castleStageFromRate(completionRateOrStage);
  return levels[stage - 1];
}
