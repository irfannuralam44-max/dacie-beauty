export type AppMode = "public" | "private";

export function getAppMode(): AppMode {
  const mode = process.env.APP_MODE;
  if (mode !== "public" && mode !== "private") {
    throw new Error("APP_MODE must be 'public' or 'private'.");
  }
  return mode;
}

export function isPublicMode(): boolean {
  return getAppMode() === "public";
}

export function isPrivateMode(): boolean {
  return getAppMode() === "private";
}