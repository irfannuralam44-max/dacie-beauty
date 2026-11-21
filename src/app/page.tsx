import { getAppMode } from "@/lib/app-mode";

export default function Home() {
  const mode = getAppMode();

  if (mode === "public") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-3xl font-semibold">Dacie Beauty — Booking</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Placeholder area booking publik. Mode aplikasi: public.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">Dacie Beauty — Rekam Kulit</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Placeholder area rekam kulit privat. Mode aplikasi: private.
      </p>
    </main>
  );
}