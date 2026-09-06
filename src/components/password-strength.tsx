"use client";

import { Check, X } from "lucide-react";

import { PASSWORD_RULES, strengthOf } from "@/lib/password";

const BAR_COLOR = ["bg-muted", "bg-locked", "bg-progress", "bg-sky", "bg-success"];

export function PasswordStrength({
  value,
  /** Rules only turn red once the field has been touched — not while typing the first character. */
  showFailures,
}: {
  value: string;
  showFailures: boolean;
}) {
  const strength = strengthOf(value);

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1" aria-hidden>
          {[1, 2, 3, 4].map((segment) => (
            <span
              key={segment}
              className={`h-full flex-1 rounded-full transition-colors duration-200 ${
                strength.score >= segment ? BAR_COLOR[strength.score] : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="w-24 shrink-0 text-right text-xs font-bold text-muted-foreground">
          {strength.label}
        </span>
      </div>

      {/* Announce politely so a screen reader hears the requirement state without
          interrupting typing. */}
      <ul className="mt-2.5 space-y-1" aria-live="polite">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(value);
          const failed = !passed && (showFailures || value.length > 0);
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-1.5 text-xs font-medium ${
                passed
                  ? "text-success"
                  : failed
                    ? "text-muted-foreground"
                    : "text-muted-foreground"
              }`}
            >
              <span
                aria-hidden
                className={`flex size-3.5 shrink-0 items-center justify-center rounded-full ${
                  passed ? "bg-success text-white" : "border border-muted-foreground/40"
                }`}
              >
                {passed ? (
                  <Check className="size-2.5" strokeWidth={4} />
                ) : showFailures ? (
                  <X className="size-2.5 text-locked" strokeWidth={4} />
                ) : null}
              </span>
              <span className={passed ? "line-through opacity-70" : undefined}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
