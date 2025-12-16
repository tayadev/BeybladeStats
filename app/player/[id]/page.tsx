"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Header } from "@/components/header";
import Link from "next/link";

function SeasonWithElo({ season, playerId }: { season: any; playerId: Id<"users"> }) {
  const eloData = useQuery(api.eloQueries.getPlayerCurrentElo, {
    playerId,
    seasonId: season._id,
  });

  return (
    <Link
      key={season._id}
      href={`/season/${season._id}`}
      className="block p-3 rounded border border-border hover:bg-muted transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{season.name}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(season.start).toLocaleDateString()} -{" "}
            {new Date(season.end).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          {eloData === undefined ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : eloData === null ? (
            <p className="text-sm text-muted-foreground">No ELO</p>
          ) : (
            <div>
              <p className="text-lg font-bold text-foreground">
                {Math.round(eloData.currentElo)}
              </p>
              <p className="text-xs text-muted-foreground">ELO</p>
              {eloData.isInactive && (
                <p className="text-xs text-amber-600">Inactive</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function PlayerProfilePage() {
  const params = useParams<{ id: string }>();
  const idParam = (params?.id ?? "") as string;

  const isPlausibleConvexId = (s: string) => /^[a-z0-9]{10,}$/i.test(s);
  const validId = isPlausibleConvexId(idParam);
  const id = (validId ? (idParam as Id<"users">) : undefined) as
    | Id<"users">
    | undefined;

  const player = useQuery(
    api.myFunctions.getUserById,
    id ? { id } : undefined
  );

  const seasons = useQuery(
    api.myFunctions.getPlayerSeasons,
    id ? { playerId: id } : undefined
  );

  const tournaments = useQuery(
    api.myFunctions.getPlayerTournaments,
    id ? { playerId: id } : undefined
  );

  const matches = useQuery(
    api.myFunctions.getPlayerMatches,
    id ? { playerId: id } : undefined
  );

  if (!validId) {
    return (
      <>
        <Header />
        <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-semibold mb-2">Invalid player id</h1>
            <p className="text-muted-foreground">Please check the URL and try again.</p>
          </div>
        </main>
      </>
    );
  }

  if (player === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (player === null) {
    return (
      <>
        <Header />
        <main className="p-8 flex flex-col gap-8 max-w-3xl mx-auto">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-semibold mb-2">Player not found</h1>
            <p className="text-muted-foreground">We couldn't find that player.</p>
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
          <div className="flex items-start gap-4">
            {player.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={player.name}
                src={player.image}
                className="h-20 w-20 rounded-full object-cover border"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border">
                <span className="text-xl font-semibold">
                  {player.name?.[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{player.name}</h1>
              <p className="text-sm text-muted-foreground">Role: {player.role}</p>
            </div>
          </div>
        </div>

        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Seasons</h2>
          {seasons === undefined ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : seasons.length === 0 ? (
            <p className="text-muted-foreground">No seasons found.</p>
          ) : (
            <div className="grid gap-2">
              {seasons.map((season) => (
                <SeasonWithElo key={season._id} season={season} playerId={id!} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Tournaments</h2>
          {tournaments === undefined ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : tournaments.length === 0 ? (
            <p className="text-muted-foreground">No tournaments found.</p>
          ) : (
            <div className="grid gap-2">
              {tournaments.map((tournament) => (
                <Link
                  key={tournament._id}
                  href={`/tournament/${tournament._id}`}
                  className="block p-3 rounded border border-border hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-foreground">{tournament.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tournament.date).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Matches</h2>
          {matches === undefined ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : matches.length === 0 ? (
            <p className="text-muted-foreground">No matches found.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {matches.map((match) => {
                const opponentName = match.opponentName ?? "Unknown opponent";
                const resultLabel = match.playerWon ? "Win" : "Loss";
                const opponent = match.opponentId ? (
                  <Link
                    href={`/player/${match.opponentId}`}
                    className="text-foreground hover:underline"
                  >
                    {opponentName}
                  </Link>
                ) : (
                  opponentName
                );

                return (
                  <div
                    key={match._id}
                    className="p-3 rounded border border-border text-sm flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        {new Date(match.date).toLocaleDateString()}
                      </p>
                      <p className="text-foreground font-medium">
                        {resultLabel} vs {opponent}
                      </p>
                      {match.tournament ? (
                        <p className="text-xs text-muted-foreground">
                          Tournament: {" "}
                          <Link
                            href={`/tournament/${match.tournament}`}
                            className="hover:underline"
                          >
                            {match.tournamentName ?? "Tournament"}
                          </Link>
                          {match.tournamentDate
                            ? ` · ${new Date(match.tournamentDate).toLocaleDateString()}`
                            : null}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        match.playerWon
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {resultLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
