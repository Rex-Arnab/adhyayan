/**
 * One definition of the password policy, used by the Zod schema, the server
 * route and the strength meter. If these lived in three places they would drift,
 * and the form would happily accept what the API rejects.
 */
export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (v) => v.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    label: "One capital letter",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: "symbol",
    label: "One symbol (!@#$…)",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export function failedRules(value: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(value));
}

export function satisfiesPolicy(value: string): boolean {
  return failedRules(value).length === 0;
}

export type Strength = {
  /** 0-4. 0-2 are below policy; 3 meets it; 4 is comfortably beyond it. */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
};

/**
 * A deliberately simple meter: it rewards meeting the policy first, then length
 * and variety. It is guidance, not a security control — the policy is.
 */
export function strengthOf(value: string): Strength {
  if (!value) return { score: 0, label: "Enter a password" };

  const passed = PASSWORD_RULES.filter((r) => r.test(value)).length;
  if (passed < PASSWORD_RULES.length) {
    return passed <= 1
      ? { score: 1, label: "Too weak" }
      : { score: 2, label: "Almost there" };
  }

  const bonus =
    (value.length >= 12 ? 1 : 0) +
    (/\d/.test(value) ? 1 : 0) +
    (/[a-z]/.test(value) && /[A-Z]/.test(value) ? 1 : 0);

  return bonus >= 2
    ? { score: 4, label: "Strong" }
    : { score: 3, label: "Good" };
}
