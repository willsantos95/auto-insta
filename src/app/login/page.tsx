"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError("Senha inválida.");
      setLoading(false);
      return;
    }
    window.location.href = params.get("next") || "/painel";
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <p className="text-sm text-fuchsia-400">@poraodanet</p>
        <h1 className="mt-2 text-2xl font-bold">Instagram Auto</h1>
        <p className="mt-2 text-sm text-zinc-400">Entre com a senha administrativa do painel.</p>
        <input
          className="mt-6 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-fuchsia-500"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha"
          required
        />
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="mt-4 w-full rounded-xl bg-fuchsia-600 px-4 py-3 font-semibold hover:bg-fuchsia-500 disabled:opacity-50">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
