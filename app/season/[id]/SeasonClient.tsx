"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Header } from "@/components/header";

export default function SeasonClient() {
  const params = useParams<{ id: string }>();
  const idParam = (params?.id ?? "") as string;

  const isPlausibleConvexId = (s: string) => /^[a-z0-9]{10,}$/i.test(s);
  const validId = isPlausibleConvexId(idParam);
  const id = (validId ? (idParam as Id<"seasons">) : undefined) as
    | Id<"seasons">
    | undefined;

  const season = useQuery(
    api.myFunctions.getSeasonById,
    id ? { id } : "skip"
  );

  if (season === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!validId) {
    return (
      <>
        <Header />
        <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-semibold mb-2">Invalid season id</h1>
            <p className="text-muted-foreground">Please check the URL and try again.</p>
          </div>
        </main>
      </>
    );
  }

  if (season === null) {
    return (
      <>
        <Header />
        <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-semibold mb-2">Season not found</h1>
            <p className="text-muted-foreground">We couldn't find that season.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-foreground">{season.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {new Date(season.start).toLocaleDateString()} -{" "}
            {new Date(season.end).toLocaleDateString()}
          </p>
        </div>

        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Tournaments</h2>
          <p className="text-muted-foreground">Coming soon.</p>
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Matches</h2>
          <p className="text-muted-foreground">Coming soon.</p>
        </section>
      </main>
    </>
  );
}
