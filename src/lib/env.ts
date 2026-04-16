export function isDemoMode(value: string | null): boolean {
  return value === "true";
}

export function missingEnv(keys: string[]): string[] {
  return keys.filter((key) => !process.env[key]);
}
