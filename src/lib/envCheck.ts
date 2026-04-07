const FIREBASE_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

export function getMissingEnvironmentKeys(): string[] {
  const missing: string[] = [];
  for (const k of FIREBASE_KEYS) {
    if (!import.meta.env[k]?.trim()) missing.push(k);
  }
  if (!import.meta.env.VITE_GEMINI_API_KEY?.trim()) {
    missing.push("VITE_GEMINI_API_KEY");
  }
  const modelRaw = import.meta.env.VITE_GEMINI_MODEL;
  if (modelRaw?.trim()) {
    const m = modelRaw.trim();
    if (m !== "gemini-2.0-flash" && m !== "gemini-2.5-flash") {
      missing.push("VITE_GEMINI_MODEL (gemini-2.0-flash 또는 gemini-2.5-flash만 허용)");
    }
  }
  return missing;
}
