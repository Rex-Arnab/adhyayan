"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { PasswordStrength } from "@/components/password-strength";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/lib/validation";

const FIELDS = [
  { id: "name", label: "Name", type: "text", autoComplete: "name" },
  { id: "email", label: "Email", type: "email", autoComplete: "email" },
  { id: "password", label: "Password", type: "password", autoComplete: "new-password" },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      setTouched(true);
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setPending(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        fields?: Record<string, string[]>;
      } | null;
      setFieldErrors(payload?.fields ?? {});
      setFormError(payload?.error ?? "Could not create the account.");
      setPending(false);
      return;
    }

    // Registration succeeded — sign straight in so the user never types twice.
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    setPending(false);

    if (!result || result.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
      {FIELDS.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>{field.label}</Label>
          {field.id === "password" ? (
          <PasswordInput
            id={field.id}
            name={field.id}
            autoComplete={field.autoComplete}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={Boolean(fieldErrors[field.id])}
            aria-describedby="password-requirements"
          />
          ) : (
          <Input
            id={field.id}
            name={field.id}
            type={field.type}
            autoComplete={field.autoComplete}
            required
            aria-invalid={Boolean(fieldErrors[field.id])}
            aria-describedby={
              fieldErrors[field.id] ? `${field.id}-error` : undefined
            }
          />
          )}

          {field.id === "password" ? (
            <div id="password-requirements">
              <PasswordStrength value={password} showFailures={touched} />
            </div>
          ) : fieldErrors[field.id] ? (
            <p id={`${field.id}-error`} className="text-sm text-destructive">
              {fieldErrors[field.id][0]}
            </p>
          ) : null}
        </div>
      ))}

      {formError ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
