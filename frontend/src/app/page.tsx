"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getRefreshToken } from "../lib/auth/token-store";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (getRefreshToken()) {
      router.replace("/employees");
      return;
    }

    router.replace("/login");
  }, [router]);

  return (
    <section className="rounded-2xl border border-black/10 bg-surface p-6 sm:p-8">
      <p className="text-sm text-muted">Redirecting...</p>
    </section>
  );
}
