import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Free, and takes about twenty seconds.
      </p>

      <RegisterForm />

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
