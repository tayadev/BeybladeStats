"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Header } from "@/components/header";
import { LeaderboardPodium } from "@/components/leaderboard-podium";
import { LeaderboardTable } from "@/components/leaderboard-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

export default function LeaderboardPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<Id<"seasons"> | null>(null);
  const currentSeason = useQuery(api.eloQueries.getCurrentSeason);
  const allSeasons = useQuery(api.myFunctions.listSeasons);

  // Default to current season
  useEffect(() => {
    if (currentSeason && !selectedSeasonId) {
      setSelectedSeasonId(currentSeason._id);
    }
  }, [currentSeason, selectedSeasonId]);

  const leaderboard = useQuery(
    api.eloQueries.getSeasonLeaderboard,
    selectedSeasonId ? { seasonId: selectedSeasonId } : "skip"
  );

  const selectedSeason = allSeasons?.find((s: any) => s._id === selectedSeasonId);

  return (
    <>
      <Header />
      <main className="p-8 flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Leaderboard</h1>

          {/* Season Selector */}
          {allSeasons && allSeasons.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Season:</label>
              <Select
                value={selectedSeasonId ?? ""}
                onValueChange={(val) => setSelectedSeasonId(val as Id<"seasons">)}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select a season" />
                </SelectTrigger>
                <SelectContent>
                  {allSeasons.map((season: any) => (
                    <SelectItem key={season._id} value={season._id}>
                      {season.name}
                      {season._id === currentSeason?._id && " (Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Loading State */}
        {leaderboard === undefined && (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        )}

        {/* Empty State */}
        {leaderboard?.length === 0 && (
          <div className="rounded-lg border bg-card p-12 shadow-sm text-center">
            <h2 className="text-xl font-semibold mb-2">No Rankings Yet</h2>
            <p className="text-muted-foreground">
              No matches have been played in {selectedSeason?.name || "this season"}{" "}
              yet.
            </p>
          </div>
        )}

        {/* Leaderboard Display */}
        {leaderboard && leaderboard.length > 0 && (
          <>
            {leaderboard.length >= 3 && (
              <LeaderboardPodium players={leaderboard.slice(0, 3)} />
            )}

            {leaderboard.length > 3 && (
              <LeaderboardTable players={leaderboard.slice(3)} startRank={4} />
            )}

            {/* Stats Summary */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Season Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Players</p>
                  <p className="text-2xl font-bold">{leaderboard.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Highest ELO</p>
                  <p className="text-2xl font-bold">
                    {Math.round(leaderboard[0].currentElo)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Season</p>
                  <p className="text-lg font-semibold">
                    {selectedSeason?.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Period</p>
                  <p className="text-sm">
                    {selectedSeason?.start && formatDate(selectedSeason.start)} -{" "}
                    {selectedSeason?.end && formatDate(selectedSeason.end)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
