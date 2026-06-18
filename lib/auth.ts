export const COOKIE_NAME = "rl_unlocked";

export function isValidPasscode(input: string, expected: string | undefined): boolean {
  if (!expected) return false;
  return input.length > 0 && input === expected;
}
