import type { Location } from "react-router-dom";

/** `Navigate` state로 넘긴 `location`에서 전체 경로(쿼리 포함)를 만듭니다. */
export function pathFromRedirectState(state: unknown): string {
  const s = state as { from?: Location } | null | undefined;
  const loc = s?.from;
  if (!loc) return "/";
  return `${loc.pathname}${loc.search ?? ""}${loc.hash ?? ""}`;
}
