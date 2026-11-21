import { parseAppMode, type AppMode } from "./env/schema";

export type { AppMode };

export function getAppMode(): AppMode {
  return parseAppMode(process.env.APP_MODE);
}

export function isPublicMode(): boolean {
  return getAppMode() === "public";
}

export function isPrivateMode(): boolean {
  return getAppMode() === "private";
}
