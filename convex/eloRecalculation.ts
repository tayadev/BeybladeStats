import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { STARTING_ELO, WIN_BONUS, calculateMatchElo, calculateTournamentBonus } from "./eloCalculations";
import { Id } from "./_generated/dataModel";

export const recalculateSeasonElo = internalMutation({
  args: {
    seasonId: v.id("seasons"),
    fromTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const season = await ctx.db.get(args.seasonId);
    if (!season || season.deleted) {
      throw new Error("Season not found");
    }

    if (args.fromTimestamp !== undefined) {
      const fromTime = args.fromTimestamp;
      const snapshotsToDelete = await ctx.db
        .query("eloSnapshots")
        .withIndex("by_season", (q) => q.eq("seasonId", args.seasonId))
        .filter((q) => q.gte(q.field("timestamp"), fromTime))
        .collect();

      for (const snapshot of snapshotsToDelete) {
        await ctx.db.delete(snapshot._id);
      }
    } else {
      const allSnapshots = await ctx.db
        .query("eloSnapshots")
        .withIndex("by_season", (q) => q.eq("seasonId", args.seasonId))
        .collect();

      for (const snapshot of allSnapshots) {
        await ctx.db.delete(snapshot._id);
      }
    }

    const allMatches = await ctx.db.query("matches").collect();
    const seasonMatches = allMatches
      .filter((m) => !m.deleted && m.date >= season.start && m.date <= season.end)
      .sort((a, b) => a.date - b.date);

    const playerIds = new Set<Id<"users">>();
    for (const match of seasonMatches) {
      playerIds.add(match.winner);
      playerIds.add(match.loser);
    }

    const currentElo = new Map<Id<"users">, number>();
    for (const playerId of playerIds) {
      currentElo.set(playerId, STARTING_ELO);

      await ctx.db.insert("eloSnapshots", {
        playerId: playerId,
        seasonId: args.seasonId,
        elo: STARTING_ELO,
        timestamp: season.start,
        calculationMetadata: {
          reason: "season_start",
        },
      });
    }

    for (const match of seasonMatches) {
      const winnerElo = currentElo.get(match.winner) || STARTING_ELO;
      const loserElo = currentElo.get(match.loser) || STARTING_ELO;

      const { newWinnerElo, newLoserElo, pointsTransferred } = calculateMatchElo(winnerElo, loserElo);

      currentElo.set(match.winner, newWinnerElo);
      currentElo.set(match.loser, newLoserElo);

      await ctx.db.insert("eloSnapshots", {
        playerId: match.winner,
        seasonId: args.seasonId,
        elo: newWinnerElo,
        matchId: match._id,
        timestamp: match.date,
        calculationMetadata: {
          pointsGained: pointsTransferred + WIN_BONUS,
          reason: "match_win",
        },
      });

      await ctx.db.insert("eloSnapshots", {
        playerId: match.loser,
        seasonId: args.seasonId,
        elo: newLoserElo,
        matchId: match._id,
        timestamp: match.date,
        calculationMetadata: {
          pointsLost: pointsTransferred,
          reason: "match_loss",
        },
      });
    }

    const tournaments = await ctx.db.query("tournaments").collect();
    const seasonTournaments = tournaments
      .filter((t) => !t.deleted && t.date >= season.start && t.date <= season.end)
      .sort((a, b) => a.date - b.date);

    for (const tournament of seasonTournaments) {
      const winnerCurrentElo = currentElo.get(tournament.winner) || STARTING_ELO;
      const bonus = calculateTournamentBonus(winnerCurrentElo);
      const newElo = winnerCurrentElo + bonus;

      currentElo.set(tournament.winner, newElo);

      await ctx.db.insert("eloSnapshots", {
        playerId: tournament.winner,
        seasonId: args.seasonId,
        elo: newElo,
        tournamentBonusId: tournament._id,
        timestamp: tournament.date,
        calculationMetadata: {
          tournamentBonus: bonus,
          reason: "tournament_bonus",
        },
      });
    }

    return { playersProcessed: playerIds.size, matchesProcessed: seasonMatches.length };
  },
});
