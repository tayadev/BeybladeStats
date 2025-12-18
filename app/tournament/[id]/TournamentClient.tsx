"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Header } from "@/components/header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function TournamentClient() {
  const params = useParams<{ id: string }>();
  const idParam = (params?.id ?? "") as string;

  const isPlausibleConvexId = (s: string) => /^[a-z0-9]{10,}$/i.test(s);
  const validId = isPlausibleConvexId(idParam);
  const id = (validId ? (idParam as Id<"tournaments">) : undefined) as
    | Id<"tournaments">
    | undefined;

  const tournament = useQuery(
    api.myFunctions.getTournamentById,
    id ? { id } : "skip"
  );

  const matches = useQuery(
    api.myFunctions.getTournamentMatches,
    tournament ? { tournamentId: tournament._id } : "skip"
  );

  const participants = useQuery(
    api.myFunctions.getTournamentParticipants,
    tournament ? { tournamentId: tournament._id } : "skip"
  );

  const players = useQuery(api.myFunctions.listPlayers);

  if (tournament === undefined || matches === undefined || participants === undefined) {
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
            <h1 className="text-2xl font-semibold mb-2">Invalid tournament id</h1>
            <p className="text-muted-foreground">Please check the URL and try again.</p>
          </div>
        </main>
      </>
    );
  }

  if (tournament === null) {
    return (
      <>
        <Header />
        <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-semibold mb-2">Tournament not found</h1>
            <p className="text-muted-foreground">We couldn't find that tournament.</p>
          </div>
        </main>
      </>
    );
  }

  const playerMap = new Map(
    (players ?? []).map((p: any) => [p._id, p.name])
  );

  const winnerName = (playerMap.get(tournament.winner) as string) || "Unknown";

  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-foreground">{tournament.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {formatDateTime(tournament.date)}
          </p>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm">
              <span className="font-semibold">Tournament Winner:</span>{" "}
              <span className="text-foreground">{winnerName}</span>
            </p>
          </div>
        </div>

        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Participants ({participants.length})</h2>
          {participants.length === 0 ? (
            <p className="text-muted-foreground">No participants in this tournament.</p>
          ) : (
            <div className="space-y-2">
              {participants.map((participant: any, index: number) => (
                <div
                  key={participant._id}
                  className="flex items-center justify-between p-3 rounded border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full font-semibold text-sm">
                      {index + 1}
                    </div>
                    <Link href={`/player/${participant._id}`}>
                      <p className="text-sm font-medium hover:underline">{participant.name}</p>
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Record</p>
                      <p className="text-sm font-semibold">
                        <span className="text-green-600">{participant.wins}W</span>
                        {" "}
                        <span className="text-red-600">{participant.losses}L</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Matches ({matches.length})</h2>
          {matches.length === 0 ? (
            <p className="text-muted-foreground">No matches recorded for this tournament.</p>
          ) : (
            <div className="space-y-3">
              {matches.map((match: any) => (
                <div
                  key={match._id}
                  className="flex items-center justify-between p-3 rounded border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      <span className="text-green-600 font-semibold">{match.winnerName}</span>
                      {" "}
                      <span className="text-muted-foreground">vs</span>
                      {" "}
                      <span className="text-red-600">{match.loserName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(match.date)}
                    </p>
                  </div>
                  <Link href={`/match/${match._id}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
